"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseManager = void 0;
const node_machine_id_1 = require("node-machine-id");
const crypto_1 = require("crypto");
class LicenseManager {
    // Bilgisayara özel, şifrelenmiş donanım kimliğini (HWID) üretir
    static getDeviceHWID() {
        try {
            // node-machine-id paketi Windows/Mac/Linux için benzersiz ID'yi otomatik alır
            const rawId = (0, node_machine_id_1.machineIdSync)(true); // true = orijinal ID'yi ver
            // Güvenlik için bu ID'yi SHA-256 ile şifreliyoruz
            return (0, crypto_1.createHash)('sha256').update(rawId).digest('hex');
        }
        catch (error) {
            console.error("HWID alınırken hata oluştu:", error);
            return "UNKNOWN_DEVICE";
        }
    }
}
exports.LicenseManager = LicenseManager;
