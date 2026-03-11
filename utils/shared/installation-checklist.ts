export type InstallationChecklistMode = 'demo' | 'production'
export type InstallationChecklistGroup = 'immediate' | 'later'

export interface InstallationChecklistLink {
    path: string
    query?: Record<string, string>
}

export interface InstallationChecklistItem {
    key: string
    group: InstallationChecklistGroup
    icon: string
    titleKey: string
    descriptionKey: string
    contextKey: string
    link?: InstallationChecklistLink
}

export interface InstallationChecklistGroups {
    immediate: InstallationChecklistItem[]
    later: InstallationChecklistItem[]
}

const productionChecklist: InstallationChecklistItem[] = [
    {
        key: 'site_identity',
        group: 'immediate',
        icon: 'pi pi-globe',
        titleKey: 'installation.setupChecklist.items.siteIdentity.title',
        descriptionKey: 'installation.setupChecklist.items.siteIdentity.description',
        contextKey: 'installation.setupChecklist.contexts.wizardSite',
    },
    {
        key: 'locale_timezone',
        group: 'immediate',
        icon: 'pi pi-clock',
        titleKey: 'installation.setupChecklist.items.localeTimezone.title',
        descriptionKey: 'installation.setupChecklist.items.localeTimezone.description',
        contextKey: 'installation.setupChecklist.contexts.wizardLocale',
        link: {
            path: '/settings',
            query: { tab: 'profile' },
        },
    },
    {
        key: 'admin_access',
        group: 'immediate',
        icon: 'pi pi-shield',
        titleKey: 'installation.setupChecklist.items.adminAccess.title',
        descriptionKey: 'installation.setupChecklist.items.adminAccess.description',
        contextKey: 'installation.setupChecklist.contexts.wizardAdmin',
    },
    {
        key: 'seo_visibility',
        group: 'immediate',
        icon: 'pi pi-megaphone',
        titleKey: 'installation.setupChecklist.items.seoVisibility.title',
        descriptionKey: 'installation.setupChecklist.items.seoVisibility.description',
        contextKey: 'installation.setupChecklist.contexts.wizardSeo',
        link: {
            path: '/admin/settings',
            query: { tab: 'analytics' },
        },
    },
    {
        key: 'auth_experience',
        group: 'later',
        icon: 'pi pi-id-card',
        titleKey: 'installation.setupChecklist.items.authExperience.title',
        descriptionKey: 'installation.setupChecklist.items.authExperience.description',
        contextKey: 'installation.setupChecklist.contexts.adminAuth',
        link: {
            path: '/admin/settings',
            query: { tab: 'auth' },
        },
    },
    {
        key: 'storage_delivery',
        group: 'later',
        icon: 'pi pi-folder-open',
        titleKey: 'installation.setupChecklist.items.storageDelivery.title',
        descriptionKey: 'installation.setupChecklist.items.storageDelivery.description',
        contextKey: 'installation.setupChecklist.contexts.adminStorage',
        link: {
            path: '/admin/settings',
            query: { tab: 'storage' },
        },
    },
    {
        key: 'ai_workflow',
        group: 'later',
        icon: 'pi pi-sparkles',
        titleKey: 'installation.setupChecklist.items.aiWorkflow.title',
        descriptionKey: 'installation.setupChecklist.items.aiWorkflow.description',
        contextKey: 'installation.setupChecklist.contexts.adminAi',
        link: {
            path: '/admin/settings',
            query: { tab: 'ai' },
        },
    },
    {
        key: 'notifications',
        group: 'later',
        icon: 'pi pi-bell',
        titleKey: 'installation.setupChecklist.items.notifications.title',
        descriptionKey: 'installation.setupChecklist.items.notifications.description',
        contextKey: 'installation.setupChecklist.contexts.adminNotifications',
        link: {
            path: '/admin/settings',
            query: { tab: 'notifications' },
        },
    },
]

const demoChecklist: InstallationChecklistItem[] = [
    {
        key: 'demo_public',
        group: 'immediate',
        icon: 'pi pi-book',
        titleKey: 'installation.setupChecklist.items.demoPublic.title',
        descriptionKey: 'installation.setupChecklist.items.demoPublic.description',
        contextKey: 'installation.setupChecklist.contexts.demoPublic',
        link: {
            path: '/',
        },
    },
    {
        key: 'demo_creator',
        group: 'immediate',
        icon: 'pi pi-pencil',
        titleKey: 'installation.setupChecklist.items.demoCreator.title',
        descriptionKey: 'installation.setupChecklist.items.demoCreator.description',
        contextKey: 'installation.setupChecklist.contexts.demoEditor',
        link: {
            path: '/admin/posts/new',
        },
    },
    {
        key: 'demo_locale',
        group: 'immediate',
        icon: 'pi pi-language',
        titleKey: 'installation.setupChecklist.items.demoLocale.title',
        descriptionKey: 'installation.setupChecklist.items.demoLocale.description',
        contextKey: 'installation.setupChecklist.contexts.demoExplore',
        link: {
            path: '/posts',
        },
    },
    {
        key: 'demo_production_identity',
        group: 'later',
        icon: 'pi pi-cog',
        titleKey: 'installation.setupChecklist.items.demoProductionIdentity.title',
        descriptionKey: 'installation.setupChecklist.items.demoProductionIdentity.description',
        contextKey: 'installation.setupChecklist.contexts.postDemoGeneral',
        link: {
            path: '/admin/settings',
            query: { tab: 'general' },
        },
    },
    {
        key: 'demo_integrations',
        group: 'later',
        icon: 'pi pi-link',
        titleKey: 'installation.setupChecklist.items.demoIntegrations.title',
        descriptionKey: 'installation.setupChecklist.items.demoIntegrations.description',
        contextKey: 'installation.setupChecklist.contexts.postDemoIntegrations',
        link: {
            path: '/admin/settings',
            query: { tab: 'ai' },
        },
    },
    {
        key: 'demo_notifications',
        group: 'later',
        icon: 'pi pi-send',
        titleKey: 'installation.setupChecklist.items.demoNotifications.title',
        descriptionKey: 'installation.setupChecklist.items.demoNotifications.description',
        contextKey: 'installation.setupChecklist.contexts.postDemoNotifications',
        link: {
            path: '/admin/settings',
            query: { tab: 'notifications' },
        },
    },
]

export function getInstallationChecklist(mode: InstallationChecklistMode): InstallationChecklistGroups {
    const items = mode === 'demo' ? demoChecklist : productionChecklist

    return {
        immediate: items.filter((item) => item.group === 'immediate'),
        later: items.filter((item) => item.group === 'later'),
    }
}
