import { describe, expect, it } from 'vitest'
import {
    canRetry,
    createMemosExpandedPreview,
    createWechatSyncExpandedPreview,
    renderActionLabel,
    renderChannelLabel,
    renderChannelMessage,
    renderFailureReason,
    renderStatusLabel,
    renderStatusSeverity,
    renderWechatSyncPreviewProfile,
    renderWechatSyncPreviewSeverity,
    renderWechatTaskLabel,
    resolveSyncer,
    showModeSelector,
    type WechatSyncWindow,
} from './post-distribution-dialog'
import type { WechatSyncDistributionPreviewGroup } from '@/utils/shared/post-distribution-preview'

describe('post-distribution-dialog', () => {
    const translate = (key: string) => `translated:${key}`
    const createPreviewGroup = (
        overrides: Partial<WechatSyncDistributionPreviewGroup> = {},
    ): WechatSyncDistributionPreviewGroup => ({
        key: 'wrapped:default:wechat',
        accounts: [{ id: 'wechat', type: 'wechat', title: '公众号 A', checked: true }],
        accountsLabel: '公众号 A',
        contentProfile: 'default',
        title: 'Wechat title',
        summary: 'Wechat summary',
        coverUrl: 'https://example.com/cover.png',
        bodyMarkdown: 'body',
        tagLine: '#wechat',
        copyrightMarkdown: 'copyright',
        finalMarkdown: 'final markdown',
        compatibility: {
            blockers: [],
            adjustments: [],
        },
        ...overrides,
    })

    it('resolves syncer from window in client environment', () => {
        const syncer: WechatSyncWindow = {
            getAccounts: () => undefined,
            addTask: () => undefined,
        }

        window.$syncer = syncer
        expect(resolveSyncer()).toBe(syncer)
        delete window.$syncer
    })

    it('builds memos and wechatsync expanded previews with expected badges', () => {
        const memosPreview = createMemosExpandedPreview({
            title: 'Memos title',
            summary: 'Memos summary',
            coverUrl: 'https://example.com/cover.png',
            tagLine: '#momei',
            copyrightMarkdown: 'copyright',
            content: 'final memos markdown',
        }, translate)

        expect(memosPreview).toEqual({
            channel: 'memos',
            title: 'translated:common.preview · translated:pages.admin.posts.distribution.channels.memos',
            badge: 'Memos',
            badgeSeverity: 'info',
            accountsLabel: 'Memos',
            articleTitle: 'Memos title',
            coverUrl: 'https://example.com/cover.png',
            summary: 'Memos summary',
            tagLine: '#momei',
            copyrightMarkdown: 'copyright',
            finalMarkdown: 'final memos markdown',
        })

        const group = createPreviewGroup({
            key: 'wrapped:weibo:weibo',
            accounts: [{ id: 'weibo', type: 'weibo', title: '微博 B', checked: true }],
            accountsLabel: '微博 B',
            contentProfile: 'weibo' as const,
            tagLine: '#wechat',
            compatibility: {
                blockers: [],
                adjustments: ['trim-tags'],
            },
        })

        expect(createWechatSyncExpandedPreview(group, translate)).toEqual({
            channel: 'wechatsync',
            title: 'translated:common.preview · translated:pages.admin.posts.distribution.channels.wechatsync',
            badge: 'translated:pages.admin.posts.distribution.preview.payload.weibo_compatible',
            badgeSeverity: 'warn',
            accountsLabel: '微博 B',
            articleTitle: 'Wechat title',
            coverUrl: 'https://example.com/cover.png',
            summary: 'Wechat summary',
            bodyMarkdown: 'body',
            tagLine: '#wechat',
            copyrightMarkdown: 'copyright',
            finalMarkdown: 'final markdown',
        })
    })

    it('renders severity and profile for blocker, adjustment, and default groups', () => {
        expect(renderWechatSyncPreviewSeverity(createPreviewGroup({
            contentProfile: 'default',
            compatibility: {
                blockers: ['cover-required'],
                adjustments: [],
            },
        }))).toBe('danger')

        expect(renderWechatSyncPreviewSeverity(createPreviewGroup({
            contentProfile: 'weibo',
            compatibility: {
                blockers: [],
                adjustments: [],
            },
        }))).toBe('warn')

        expect(renderWechatSyncPreviewSeverity(createPreviewGroup({
            contentProfile: 'default',
            compatibility: {
                blockers: [],
                adjustments: [],
            },
        }))).toBe('info')

        expect(renderWechatSyncPreviewProfile(createPreviewGroup({
            contentProfile: 'default',
        }), translate)).toBe('translated:pages.admin.posts.distribution.preview.payload.standard')
    })

    it('renders status, channel, action, and task labels', () => {
        expect(renderStatusSeverity('idle')).toBe('secondary')
        expect(renderStatusSeverity('delivering')).toBe('info')
        expect(renderStatusSeverity('succeeded')).toBe('success')
        expect(renderStatusSeverity('failed')).toBe('danger')
        expect(renderStatusSeverity('cancelled')).toBe('warn')
        expect(renderStatusSeverity(undefined)).toBe('secondary')

        expect(renderStatusLabel('failed', translate)).toBe('translated:pages.admin.posts.distribution.status.failed')
        expect(renderStatusLabel(undefined, translate)).toBe('translated:pages.admin.posts.distribution.status.idle')
        expect(renderChannelLabel('memos', translate)).toBe('translated:pages.admin.posts.distribution.channels.memos')
        expect(renderFailureReason('network_error', translate)).toBe('translated:pages.admin.posts.distribution.failure_reason.network_error')
        expect(renderActionLabel('retry', 'update-existing', translate)).toBe(
            'translated:pages.admin.posts.distribution.action.retry · translated:pages.admin.posts.distribution.mode_update_existing',
        )
        expect(renderActionLabel('create', null, translate)).toBe('translated:pages.admin.posts.distribution.action.create')
        expect(renderWechatTaskLabel('pending', translate)).toBe('translated:pages.admin.posts.distribution.wechatsync_task.uploading')
        expect(renderWechatTaskLabel('done', translate)).toBe('translated:pages.admin.posts.distribution.wechatsync_task.done')
    })

    it('renders channel messages and action affordances from summary state', () => {
        expect(renderChannelMessage(undefined, translate)).toBe('translated:pages.admin.posts.distribution.no_status')
        expect(renderChannelMessage({
            status: 'failed',
            lastFailureReason: 'network_error',
            lastMessage: 'remote rejected',
        }, translate)).toBe('translated:pages.admin.posts.distribution.failure_reason.network_error · remote rejected')
        expect(renderChannelMessage({
            status: 'succeeded',
            lastMessage: 'published',
        }, translate)).toBe('published')
        expect(renderChannelMessage({
            status: 'idle',
        }, translate)).toBe('translated:pages.admin.posts.distribution.no_status')

        expect(showModeSelector(undefined)).toBe(false)
        expect(showModeSelector({ remoteId: 'memos-1' })).toBe(true)
        expect(showModeSelector({ lastSuccessAt: '2026-04-02T00:00:00.000Z' })).toBe(true)
        expect(canRetry({ status: 'failed' })).toBe(true)
        expect(canRetry({ status: 'succeeded' })).toBe(false)
    })
})
