import React from 'react';

export interface ExtensionButton {
    id: string;
    icon: string;
    label: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement>, anchorRect: { top: number; left: number; bottom: number; right: number; width: number; height: number; } | null) => void;
    isActive?: boolean;
}

export interface ExtensionPanel {
    id: string;
    render: (props: { onClose: () => void; anchorRect: { top: number; left: number; bottom: number; right: number; width: number; height: number; } | null }) => React.ReactNode;
}

export interface ExtensionSettingsPanel {
    id: string;
    render: () => React.ReactNode;
}

export interface ExtensionInlineWidget {
    id: string;
    render: () => React.ReactNode;
}

class ExtensionRegistry {
    private buttons: ExtensionButton[] = [];
    private panels: Map<string, ExtensionPanel> = new Map();
    private settingsPanels: Map<string, ExtensionSettingsPanel> = new Map();
    private inlineWidgets: Map<string, ExtensionInlineWidget> = new Map();
    private manifests: Map<string, any> = new Map();
    private listeners: Set<() => void> = new Set();
    private isSuspended = false;

    registerManifest(id: string, manifest: any) {
        this.manifests.set(id, manifest);
    }

    getManifest(id: string) {
        return this.manifests.get(id);
    }

    registerSidebarButton(button: ExtensionButton) {
        this.buttons = this.buttons.filter(b => b.id !== button.id);
        this.buttons.push(button);
        this.notify();
    }

    registerPanel(panelId: string, panel: ExtensionPanel) {
        this.panels.set(panelId, panel);
        this.notify();
    }

    registerSettingsPanel(panelId: string, panel: ExtensionSettingsPanel) {
        this.settingsPanels.set(panelId, panel);
        this.notify();
    }

    getButtons() {
        return this.buttons;
    }

    getPanel(panelId: string) {
        return this.panels.get(panelId);
    }

    getSettingsPanel(panelId: string) {
        return this.settingsPanels.get(panelId);
    }

    registerInlineWidget(widgetId: string, widget: ExtensionInlineWidget) {
        this.inlineWidgets.set(widgetId, widget);
        this.notify();
    }

    getInlineWidgets() {
        return Array.from(this.inlineWidgets.values());
    }

    subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    notify() {
        if (!this.isSuspended) {
            this.listeners.forEach(l => l());
        }
    }

    suspendNotifications() {
        this.isSuspended = true;
    }

    resumeNotifications() {
        this.isSuspended = false;
        this.notify();
    }

    getData<T = any>(pluginId: string, defaultValue?: T): T {
        if (typeof window !== 'undefined' && window.useAppStore) {
            return window.useAppStore.getState().getPluginData(pluginId, defaultValue);
        }
        return defaultValue as T;
    }

    setData(pluginId: string, data: any) {
        if (typeof window !== 'undefined' && window.useAppStore) {
            window.useAppStore.getState().setPluginData(pluginId, data);
            this.notify();
        }
    }

    clear() {
        this.buttons = [];
        this.panels.clear();
        this.settingsPanels.clear();
        this.inlineWidgets.clear();
        this.manifests.clear();
        this.notify();
    }
}

declare global {
    interface Window {
        KoBarExtensions: ExtensionRegistry;
        React: typeof React;
        useAppStore: any;
    }
}

const registry = (window as any).KoBarExtensions || new ExtensionRegistry();
(window as any).KoBarExtensions = registry;

export function useExtensionRegistry() {
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
        return registry.subscribe(() => {
            setTick(t => t + 1);
        });
    }, []);
    return registry;
}

/**
 * Custom React hook for plugin authors to seamlessly access and mutate workspace-isolated or global data.
 */
export function usePluginData<T = any>(pluginId: string, defaultValue?: T): [T, (data: T | ((prev: T) => T)) => void] {
    const getStore = () => (typeof window !== 'undefined' && window.useAppStore ? window.useAppStore.getState() : null);
    
    // Subscribe to workspace switches and plugin data changes
    const [data, setDataState] = React.useState<T>(() => {
        const store = getStore();
        return store ? store.getPluginData(pluginId, defaultValue) : defaultValue;
    });

    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.useAppStore) return;

        const handleWsChange = () => {
            const currentStore = getStore();
            if (currentStore) {
                setDataState(currentStore.getPluginData(pluginId, defaultValue));
            }
        };
        window.addEventListener('kobar:workspace-changed', handleWsChange);

        const unsubscribe = window.useAppStore.subscribe((state: any, prevState: any) => {
            // If active workspace changed or workspace isolation updated or plugin data updated
            if (
                state.activeWorkspaceId !== prevState?.activeWorkspaceId ||
                state.workspaces !== prevState?.workspaces ||
                state.globalPluginData !== prevState?.globalPluginData
            ) {
                const current = state.getPluginData(pluginId, defaultValue);
                setDataState(current);
            }
        });

        return () => {
            window.removeEventListener('kobar:workspace-changed', handleWsChange);
            unsubscribe();
        };
    }, [pluginId, defaultValue]);

    const setPluginData = React.useCallback((nextValueOrUpdater: T | ((prev: T) => T)) => {
        const store = getStore();
        if (!store) return;

        const current = store.getPluginData(pluginId, defaultValue);
        const resolvedValue = typeof nextValueOrUpdater === 'function'
            ? (nextValueOrUpdater as (prev: T) => T)(current)
            : nextValueOrUpdater;

        store.setPluginData(pluginId, resolvedValue);
        setDataState(resolvedValue);
    }, [pluginId, defaultValue]);

    return [data, setPluginData];
}

export default registry;
