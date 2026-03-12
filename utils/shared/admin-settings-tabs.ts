export const ADMIN_SETTINGS_TABS = [
    'general',
    'ai',
    'email',
    'storage',
    'auth',
    'security',
    'limits',
    'analytics',
    'agreements',
    'notifications',
    'commercial',
    'audit_logs',
    'third_party',
] as const

export type AdminSettingsTab = typeof ADMIN_SETTINGS_TABS[number]

export function resolveAdminSettingsTab(tab: unknown): AdminSettingsTab {
    const value = Array.isArray(tab) ? tab[0] : tab
    return ADMIN_SETTINGS_TABS.includes(value as AdminSettingsTab) ? value as AdminSettingsTab : 'general'
}

export function buildAdminSettingsTabLocation(
    route: { path?: string, query?: Record<string, unknown> },
    tab: AdminSettingsTab,
) {
    return {
        path: route.path,
        query: {
            ...(route.query || {}),
            tab,
        },
    }
}
