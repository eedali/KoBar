from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore
import uuid
import datetime
import json

# Sadece uygulamayı başlatıyoruz, veritabanına henüz dokunmuyoruz
initialize_app()

@https_fn.on_request()
def generate_license(req: https_fn.Request) -> https_fn.Response:
    try:
        # 1. Veritabanı bağlantısını sadece webhook tetiklendiğinde yapıyoruz
        db = firestore.client()
        
        # 2. Parse incoming JSON from the store
        data = req.get_json()
        if not data:
            return https_fn.Response("No JSON data provided", status=400)
        
        # 3. Extract buyer details
        buyer_email = data.get("email", "unknown@email.com")
        order_id = data.get("order_id", "UNKNOWN_ORDER")
        platform = data.get("platform", "test_store")

        # 4. Generate a clean License Key (Format: XXXXX-XXXXX-XXXXX-XXXXX)
        raw_uuid = uuid.uuid4().hex.upper()
        license_key = f"{raw_uuid[0:5]}-{raw_uuid[5:10]}-{raw_uuid[10:15]}-{raw_uuid[15:20]}"

        # 5. Save to Firestore
        doc_ref = db.collection("licenses").document(license_key)
        doc_ref.set({
            "license_key": license_key,
            "buyer_email": buyer_email,
            "order_id": order_id,
            "platform": platform,
            "hardware_id": None, # KoBar app will fill this later
            "is_active": True,
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })

        return https_fn.Response(f"Success! License {license_key} created.", status=200)

    except Exception as e:
        return https_fn.Response(f"Error: {str(e)}", status=500)

@https_fn.on_request()
def activate_license(req: https_fn.Request) -> https_fn.Response:
    # Set CORS headers for Electron/Vite frontend requests
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle CORS preflight request
    if req.method == 'OPTIONS':
        return https_fn.Response('', status=204, headers=headers)

    try:
        db = firestore.client()
        data = req.get_json()
        
        if not data:
            return https_fn.Response(json.dumps({"status": "error", "message": "No data"}), status=400, headers=headers)

        license_key = data.get("license_key")
        hardware_id = data.get("hardware_id")
        force_transfer = data.get("force_transfer", False)

        if not license_key or not hardware_id:
            return https_fn.Response(json.dumps({"status": "error", "message": "Missing params"}), status=400, headers=headers)

        doc_ref = db.collection("licenses").document(license_key)
        doc = doc_ref.get()

        # 1. Lisans Yoksa
        if not doc.exists:
            return https_fn.Response(json.dumps({"status": "invalid", "message": "License not found"}), status=404, headers=headers)

        doc_data = doc.to_dict()
        current_hwid = doc_data.get("hardware_id")

        # 2. İlk Kez Kullanılıyorsa (Boşsa)
        if not current_hwid:
            doc_ref.update({"hardware_id": hardware_id})
            return https_fn.Response(json.dumps({"status": "activated", "message": "Bound to new device"}), status=200, headers=headers)

        # 3. Zaten Bu Cihazda Aktifse (Welcome back)
        if current_hwid == hardware_id:
            return https_fn.Response(json.dumps({"status": "valid", "message": "Welcome back"}), status=200, headers=headers)

        # 4. BAŞKA CİHAZDA AKTİFSE
        if current_hwid != hardware_id:
            if force_transfer:
                # Kullanıcı arayüzde "Evet, buraya aktar" dedi
                doc_ref.update({"hardware_id": hardware_id})
                return https_fn.Response(json.dumps({"status": "transferred", "message": "Transferred to this device"}), status=200, headers=headers)
            else:
                # Uygulamaya "Başka cihazda açık, sor bakalım aktaralım mı?" sinyali gönder
                return https_fn.Response(json.dumps({"status": "device_mismatch", "message": "Active on another device"}), status=403, headers=headers)

    except Exception as e:
        return https_fn.Response(json.dumps({"status": "error", "message": str(e)}), status=500, headers=headers)