import { useAppStore } from '../store/useAppStore';

const originalSetItem = localStorage.setItem.bind(localStorage);
const originalGetItem = localStorage.getItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

// We must not intercept KoBar's internal system keys
const KOBAR_SYSTEM_KEYS = [
    'kobar-storage', 
    'kobar_force_theme_color', 
    'kobar_license_key',
    'kobar_language',
    'kobar_onboarding_completed'
];

function isSystemKey(key: string): boolean {
    return KOBAR_SYSTEM_KEYS.includes(key);
}

function getIsolatedKey(key: string): string {
    if (!key || isSystemKey(key)) return key;
    
    try {
        const state = useAppStore.getState();
        const activeWs = state.workspaces.find(w => w.id === state.activeWorkspaceId);
        
        if (activeWs && activeWs.isIsolated) {
            return `${key}_iso_${activeWs.id}`;
        }
    } catch (e) {
        console.warn('KoBar localStorage isolation failed to read state', e);
    }
    
    return key;
}

export function setupLocalStorageIsolation() {
    localStorage.setItem = function(key: string, value: string) {
        return originalSetItem(getIsolatedKey(key), value);
    };

    localStorage.getItem = function(key: string) {
        return originalGetItem(getIsolatedKey(key));
    };

    localStorage.removeItem = function(key: string) {
        return originalRemoveItem(getIsolatedKey(key));
    };

    localStorage.clear = function() {
        // Safe clear: only remove keys that belong to the current workspace context
        try {
            const state = useAppStore.getState();
            const activeWs = state.workspaces.find(w => w.id === state.activeWorkspaceId);
            const suffix = (activeWs && activeWs.isIsolated) ? `_iso_${activeWs.id}` : '';
            
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && !isSystemKey(k)) {
                    if (suffix) {
                        if (k.endsWith(suffix)) keysToRemove.push(k);
                    } else {
                        // If we are in shared workspace, only clear keys that DON'T have an iso suffix
                        if (!k.includes('_iso_')) keysToRemove.push(k);
                    }
                }
            }
            keysToRemove.forEach(k => originalRemoveItem(k));
        } catch (e) {
            console.warn('KoBar localStorage isolation clear failed', e);
        }
    };
}
