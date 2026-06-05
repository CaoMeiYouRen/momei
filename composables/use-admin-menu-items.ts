import { computed, type ComputedRef } from 'vue'

interface UseAdminMenuItemsInput {
    t: (key: string) => string
    localePath: (path: string) => string
    userRole: ComputedRef<string | null | undefined>
    isAdmin: (role?: string | null) => boolean
}

interface AdminMenuItem {
    label: string
    icon: string
    command?: () => void
    items?: AdminMenuItem[]
}

/** Wraps navigateTo to satisfy no-misused-promises in MenuItem command callbacks. */
function nav(localePath: (path: string) => string, path: string) {
    void navigateTo(localePath(path))
}

export function useAdminMenuItems({ t, localePath, userRole, isAdmin }: UseAdminMenuItemsInput) {
    const goToAdminPosts = () => nav(localePath, '/admin/posts')

    const adminMenuItems = computed(() => {
        const items: AdminMenuItem[] = [
            { label: t('pages.admin.dashboard.title'), icon: 'pi pi-chart-bar', command: () => nav(localePath, '/admin') },
            { label: t('pages.admin.posts.title'), icon: 'pi pi-file', command: goToAdminPosts },
            { label: t('pages.admin.calendar.title'), icon: 'pi pi-calendar', command: () => nav(localePath, '/admin/calendar') },
            { label: t('pages.admin.snippets.title'), icon: 'pi pi-bolt', command: () => nav(localePath, '/admin/snippets') },
            { label: t('pages.admin.categories.title'), icon: 'pi pi-folder', command: () => nav(localePath, '/admin/categories') },
            { label: t('pages.admin.tags.title'), icon: 'pi pi-tags', command: () => nav(localePath, '/admin/tags') },
            { label: t('pages.admin.comments.title'), icon: 'pi pi-comments', command: () => nav(localePath, '/admin/comments') },
            { label: t('pages.admin.submissions.title'), icon: 'pi pi-inbox', command: () => nav(localePath, '/admin/submissions') },
            { label: t('pages.admin.ai.title'), icon: 'pi pi-sparkles', command: () => nav(localePath, '/admin/ai') },
        ]

        if (isAdmin(userRole.value)) {
            items.push(
                { label: t('pages.admin.users.title'), icon: 'pi pi-users', command: () => nav(localePath, '/admin/users') },
                { label: t('pages.admin.subscribers.title'), icon: 'pi pi-envelope', command: () => nav(localePath, '/admin/subscribers') },
                { label: t('pages.admin.waitlist.title'), icon: 'pi pi-list-check', command: () => nav(localePath, '/admin/waitlist') },
                {
                    label: t('pages.admin.ad.title'), icon: 'pi pi-percentage',
                    items: [
                        { label: t('pages.admin.ad.campaigns.title'), icon: 'pi pi-megaphone', command: () => nav(localePath, '/admin/ad/campaigns') },
                        { label: t('pages.admin.ad.placements.title'), icon: 'pi pi-map', command: () => nav(localePath, '/admin/ad/placements') },
                    ],
                },
                { label: t('pages.admin.external_links.title'), icon: 'pi pi-external-link', command: () => nav(localePath, '/admin/external-links') },
                { label: t('pages.admin.link_governance.title'), icon: 'pi pi-directions-alt', command: () => nav(localePath, '/admin/migrations/link-governance') },
                { label: t('pages.admin.friend_links.title'), icon: 'pi pi-link', command: () => nav(localePath, '/admin/friend-links') },
                { label: t('pages.admin.marketing.title'), icon: 'pi pi-megaphone', command: () => nav(localePath, '/admin/marketing') },
                { label: t('pages.admin.notifications.title'), icon: 'pi pi-bell', command: () => nav(localePath, '/admin/notifications') },
                {
                    label: t('common.settings'), icon: 'pi pi-cog',
                    items: [
                        { label: t('pages.admin.settings.theme.title'), icon: 'pi pi-palette', command: () => nav(localePath, '/admin/settings/theme') },
                        { label: t('pages.admin.settings.system.title'), icon: 'pi pi-sliders-h', command: () => nav(localePath, '/admin/settings') },
                    ],
                },
            )
        }

        return items
    })

    return { adminMenuItems, goToAdminPosts }
}
