import { computed, type ComputedRef, type Component } from 'vue'
import {
    Bell,
    CalendarDays,
    ChartColumn,
    ExternalLink,
    FileText,
    Folder,
    Inbox,
    Link,
    ListChecks,
    Mail,
    Megaphone,
    Map,
    MessagesSquare,
    Palette,
    Percent,
    Settings,
    Signpost,
    SlidersHorizontal,
    Sparkles,
    Tags,
    Users,
    Zap,
} from '@lucide/vue'
import { rawIcon } from '@/utils/shared/brand-icons'

interface UseAdminMenuItemsInput {
    t: (key: string) => string
    localePath: (path: string) => string
    userRole: ComputedRef<string | null | undefined>
    isAdmin: (role?: string | null) => boolean
}

interface AdminMenuItem {
    label: string
    icon: Component
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
            { label: t('pages.admin.dashboard.title'), icon: rawIcon(ChartColumn), command: () => nav(localePath, '/admin') },
            { label: t('pages.admin.posts.title'), icon: rawIcon(FileText), command: goToAdminPosts },
            { label: t('pages.admin.calendar.title'), icon: rawIcon(CalendarDays), command: () => nav(localePath, '/admin/calendar') },
            { label: t('pages.admin.snippets.title'), icon: rawIcon(Zap), command: () => nav(localePath, '/admin/snippets') },
            { label: t('pages.admin.categories.title'), icon: rawIcon(Folder), command: () => nav(localePath, '/admin/categories') },
            { label: t('pages.admin.tags.title'), icon: rawIcon(Tags), command: () => nav(localePath, '/admin/tags') },
            { label: t('pages.admin.comments.title'), icon: rawIcon(MessagesSquare), command: () => nav(localePath, '/admin/comments') },
            { label: t('pages.admin.submissions.title'), icon: rawIcon(Inbox), command: () => nav(localePath, '/admin/submissions') },
            { label: t('pages.admin.ai.title'), icon: rawIcon(Sparkles), command: () => nav(localePath, '/admin/ai') },
        ]

        if (isAdmin(userRole.value)) {
            items.push(
                { label: t('pages.admin.users.title'), icon: rawIcon(Users), command: () => nav(localePath, '/admin/users') },
                { label: t('pages.admin.subscribers.title'), icon: rawIcon(Mail), command: () => nav(localePath, '/admin/subscribers') },
                { label: t('pages.admin.waitlist.title'), icon: rawIcon(ListChecks), command: () => nav(localePath, '/admin/waitlist') },
                {
                    label: t('pages.admin.ad.title'), icon: rawIcon(Percent),
                    items: [
                        { label: t('pages.admin.ad.campaigns.title'), icon: rawIcon(Megaphone), command: () => nav(localePath, '/admin/ad/campaigns') },
                        { label: t('pages.admin.ad.placements.title'), icon: rawIcon(Map), command: () => nav(localePath, '/admin/ad/placements') },
                    ],
                },
                { label: t('pages.admin.external_links.title'), icon: rawIcon(ExternalLink), command: () => nav(localePath, '/admin/external-links') },
                { label: t('pages.admin.link_governance.title'), icon: rawIcon(Signpost), command: () => nav(localePath, '/admin/migrations/link-governance') },
                { label: t('pages.admin.friend_links.title'), icon: rawIcon(Link), command: () => nav(localePath, '/admin/friend-links') },
                { label: t('pages.admin.marketing.title'), icon: rawIcon(Megaphone), command: () => nav(localePath, '/admin/marketing') },
                { label: t('pages.admin.notifications.title'), icon: rawIcon(Bell), command: () => nav(localePath, '/admin/notifications') },
                {
                    label: t('common.settings'), icon: rawIcon(Settings),
                    items: [
                        { label: t('pages.admin.settings.theme.title'), icon: rawIcon(Palette), command: () => nav(localePath, '/admin/settings/theme') },
                        { label: t('pages.admin.settings.system.title'), icon: rawIcon(SlidersHorizontal), command: () => nav(localePath, '/admin/settings') },
                    ],
                },
            )
        }

        return items
    })

    return { adminMenuItems, goToAdminPosts }
}
