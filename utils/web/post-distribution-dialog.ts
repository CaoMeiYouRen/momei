import type {
    PostDistributionAction,
    PostDistributionChannel,
    PostDistributionFailureReason,
    PostDistributionMode,
    PostDistributionStatus,
} from '@/types/post'
import type { PostDistributionChannelSummary } from '@/types/post-distribution'
import type { MemosDistributionPreview, WechatSyncDistributionPreviewGroup } from '@/utils/shared/post-distribution-preview'
import type {
    WechatSyncAccount,
    WechatSyncRawAccount,
    WechatSyncTaskAccount,
    WechatSyncTaskStatus,
} from '@/utils/shared/wechatsync'

type Translate = (key: string) => string

export type { PostDistributionSummary } from '@/types/post-distribution'

export interface WechatSyncWindow {
    getAccounts: (callback: (accounts: WechatSyncRawAccount[]) => void) => void
    addTask: (
        payload: {
            post: {
                title: string
                content: string
                desc: string
                thumb: string
                markdown?: string
            }
            accounts: WechatSyncAccount[]
        },
        onStatus: (status: WechatSyncTaskStatus) => void,
        onReady: () => void,
    ) => void
}

export interface ExpandedDistributionPreview {
    channel: PostDistributionChannel
    contentProfile?: WechatSyncDistributionPreviewGroup['contentProfile']
    title: string
    badge: string
    badgeSeverity: string
    accountsLabel?: string | null
    articleTitle?: string | null
    coverUrl?: string | null
    summary?: string | null
    bodyMarkdown?: string | null
    tagLine?: string | null
    copyrightMarkdown?: string | null
    finalMarkdown?: string | null
}

declare global {
    interface Window {
        $syncer?: WechatSyncWindow
    }
}

export function resolveSyncer() {
    return import.meta.client ? window.$syncer : undefined
}

export function createMemosExpandedPreview(preview: MemosDistributionPreview, t: Translate): ExpandedDistributionPreview {
    return {
        channel: 'memos',
        title: `${t('common.preview')} · ${t('pages.admin.posts.distribution.channels.memos')}`,
        badge: 'Memos',
        badgeSeverity: 'info',
        accountsLabel: 'Memos',
        articleTitle: preview.title,
        coverUrl: preview.coverUrl,
        summary: preview.summary,
        tagLine: preview.tagLine,
        copyrightMarkdown: preview.copyrightMarkdown,
        finalMarkdown: preview.content,
    }
}

export function renderWechatSyncPreviewSeverity(group: WechatSyncDistributionPreviewGroup) {
    if (group.compatibility.blockers.length) {
        return 'danger'
    }

    if (group.contentProfile === 'weibo' || group.compatibility.adjustments.length) {
        return 'warn'
    }

    return 'info'
}

export function renderWechatSyncPreviewProfile(group: WechatSyncDistributionPreviewGroup, t: Translate) {
    if (group.contentProfile === 'weibo') {
        return t('pages.admin.posts.distribution.preview.payload.weibo_compatible')
    }

    if (group.contentProfile === 'xiaohongshu') {
        return t('pages.admin.posts.distribution.preview.payload.xiaohongshu_compatible')
    }

    if (group.contentProfile === 'wechat_mp') {
        return t('pages.admin.posts.distribution.preview.payload.wechat_mp_compatible')
    }

    return t('pages.admin.posts.distribution.preview.payload.standard')
}

export function createWechatSyncExpandedPreview(group: WechatSyncDistributionPreviewGroup, t: Translate): ExpandedDistributionPreview {
    return {
        channel: 'wechatsync',
        contentProfile: group.contentProfile,
        title: `${t('common.preview')} · ${t('pages.admin.posts.distribution.channels.wechatsync')}`,
        badge: renderWechatSyncPreviewProfile(group, t),
        badgeSeverity: renderWechatSyncPreviewSeverity(group),
        accountsLabel: group.accountsLabel,
        articleTitle: group.title,
        coverUrl: group.coverUrl,
        summary: group.summary,
        bodyMarkdown: group.bodyMarkdown,
        tagLine: group.tagLine,
        copyrightMarkdown: group.copyrightMarkdown,
        finalMarkdown: group.finalMarkdown,
    }
}

export function renderStatusSeverity(status?: PostDistributionStatus | null) {
    const severityMap: Record<string, string> = {
        idle: 'secondary',
        delivering: 'info',
        succeeded: 'success',
        failed: 'danger',
        cancelled: 'warn',
    }

    return severityMap[status || 'idle'] || 'secondary'
}

export function renderStatusLabel(status: PostDistributionStatus | null | undefined, t: Translate) {
    return t(`pages.admin.posts.distribution.status.${status || 'idle'}`)
}

export function renderChannelLabel(channel: PostDistributionChannel, t: Translate) {
    return t(`pages.admin.posts.distribution.channels.${channel}`)
}

export function renderFailureReason(reason: PostDistributionFailureReason, t: Translate) {
    return t(`pages.admin.posts.distribution.failure_reason.${reason}`)
}

export function renderActionLabel(action: PostDistributionAction, mode: PostDistributionMode | null | undefined, t: Translate) {
    if ((action === 'update' || action === 'republish' || action === 'retry') && mode) {
        return `${t(`pages.admin.posts.distribution.action.${action}`)} · ${mode === 'update-existing'
            ? t('pages.admin.posts.distribution.mode_update_existing')
            : t('pages.admin.posts.distribution.mode_republish_new')}`
    }

    return t(`pages.admin.posts.distribution.action.${action}`)
}

export function renderWechatTaskLabel(status: WechatSyncTaskAccount['status'], t: Translate) {
    const normalizedStatus = status === 'pending' ? 'uploading' : status
    return t(`pages.admin.posts.distribution.wechatsync_task.${normalizedStatus}`)
}

export function renderChannelMessage(state: PostDistributionChannelSummary | undefined, t: Translate) {
    if (!state) {
        return t('pages.admin.posts.distribution.no_status')
    }

    if (state.status === 'failed' && state.lastFailureReason) {
        return `${renderFailureReason(state.lastFailureReason, t)}${state.lastMessage ? ` · ${state.lastMessage}` : ''}`
    }

    if (state.lastMessage) {
        return state.lastMessage
    }

    return t('pages.admin.posts.distribution.no_status')
}

export function showModeSelector(state: PostDistributionChannelSummary | undefined) {
    return Boolean(state?.remoteId || state?.lastSuccessAt)
}

export function canRetry(state: PostDistributionChannelSummary | undefined) {
    return state?.status === 'failed'
}
