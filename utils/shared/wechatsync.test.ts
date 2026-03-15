import { describe, expect, it } from 'vitest'
import {
    buildWechatSyncFailureResults,
    mapWechatSyncTaskAccountsForCompletion,
    normalizeWechatSyncAccounts,
    resolveWechatSyncAccountKey,
} from './wechatsync'

describe('wechatsync helpers', () => {
    it('normalizes legacy plugin accounts that only expose type', () => {
        const accounts = normalizeWechatSyncAccounts([
            {
                type: 'wechat',
                title: '公众号 A',
                icon: 'https://example.com/icon.png',
            },
        ])

        expect(accounts).toEqual([
            {
                id: 'wechat',
                type: 'wechat',
                title: '公众号 A',
                icon: 'https://example.com/icon.png',
                displayName: undefined,
                avatar: undefined,
                uid: undefined,
                home: undefined,
                supportTypes: undefined,
                checked: false,
            },
        ])
    })

    it('preserves completion ids across legacy status payloads', () => {
        const selectedAccounts = normalizeWechatSyncAccounts([
            {
                type: 'wechat',
                title: '公众号 A',
            },
            {
                type: 'weibo',
                title: '微博 B',
            },
        ])

        const completionAccounts = mapWechatSyncTaskAccountsForCompletion([
            {
                type: 'wechat',
                title: '公众号 A',
                status: 'done',
                editResp: {
                    draftLink: 'https://drafts.example.com/a',
                },
            },
            {
                title: '微博 B',
                status: 'failed',
                error: 'network timeout',
            },
        ], selectedAccounts)

        expect(completionAccounts).toEqual([
            {
                id: 'wechat',
                title: '公众号 A',
                status: 'done',
                draftLink: 'https://drafts.example.com/a',
                msg: undefined,
                error: undefined,
            },
            {
                id: 'weibo',
                title: '微博 B',
                status: 'failed',
                msg: undefined,
                error: 'network timeout',
                draftLink: undefined,
            },
        ])
    })

    it('builds stable failure payloads for startup errors', () => {
        const selectedAccounts = normalizeWechatSyncAccounts([
            {
                type: 'wechat',
                title: '公众号 A',
            },
        ])

        expect(buildWechatSyncFailureResults(selectedAccounts, 'plugin startup failed')).toEqual([
            {
                id: 'wechat',
                title: '公众号 A',
                status: 'failed',
                error: 'plugin startup failed',
            },
        ])
    })

    it('resolves a stable account key from legacy payloads', () => {
        expect(resolveWechatSyncAccountKey({ type: 'wechat', title: '公众号 A' })).toBe('wechat')
        expect(resolveWechatSyncAccountKey({ id: 'weibo', title: '微博 B' })).toBe('weibo')
    })
})
