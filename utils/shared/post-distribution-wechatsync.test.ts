import { describe, expect, it } from 'vitest'
import {
    mapCompletionAccountsToTaskAccounts,
    mergeWechatSyncCompletionAccounts,
    mergeWechatSyncTaskAccounts,
    resolveWechatSyncCompletionAccountKey,
    resolveWechatSyncTaskAccountKey,
    shouldFinalizeWechatSyncStatus,
} from './post-distribution-wechatsync'

describe('post distribution wechatsync helpers', () => {
    it('finalizes only when every account is done or failed', () => {
        expect(shouldFinalizeWechatSyncStatus({ accounts: [] })).toBe(false)
        expect(shouldFinalizeWechatSyncStatus({
            accounts: [
                { id: 'wechat', type: 'wechat', title: '公众号 A', status: 'done' },
                { id: 'weibo', type: 'weibo', title: '微博 B', status: 'uploading' },
            ],
        })).toBe(false)
        expect(shouldFinalizeWechatSyncStatus({
            accounts: [
                { id: 'wechat', type: 'wechat', title: '公众号 A', status: 'done' },
                { id: 'weibo', type: 'weibo', title: '微博 B', status: 'failed' },
            ],
        })).toBe(true)
    })

    it('resolves stable task and completion account keys with trim and fallback order', () => {
        expect(resolveWechatSyncTaskAccountKey({
            id: ' account-id ',
            type: ' wechat ',
            title: '公众号 A',
        })).toBe('wechat')

        expect(resolveWechatSyncTaskAccountKey({
            id: ' account-id ',
            type: '   ',
            title: '公众号 B',
        })).toBe('account-id')

        expect(resolveWechatSyncTaskAccountKey({
            id: '   ',
            type: undefined,
            title: '公众号 C',
        })).toBe('公众号 C')

        expect(resolveWechatSyncCompletionAccountKey({
            id: ' completion-id ',
            title: '完成账号 A',
        })).toBe('completion-id')

        expect(resolveWechatSyncCompletionAccountKey({
            id: '   ',
            title: '完成账号 B',
        })).toBe('完成账号 B')
    })

    it('merges task accounts by resolved key and lets next payload override current', () => {
        const merged = mergeWechatSyncTaskAccounts([
            { id: 'wechat', type: 'wechat', title: '公众号 A', status: 'pending' },
            { id: 'weibo', type: 'weibo', title: '微博 B', status: 'pending' },
        ], [
            { id: 'wechat-legacy', type: 'wechat', title: '公众号 A', status: 'done', msg: 'ok' },
            { id: 'toutiao', type: 'toutiao', title: '头条 C', status: 'failed', error: 'denied' },
        ])

        expect(merged).toEqual([
            { id: 'wechat-legacy', type: 'wechat', title: '公众号 A', status: 'done', msg: 'ok' },
            { id: 'weibo', type: 'weibo', title: '微博 B', status: 'pending' },
            { id: 'toutiao', type: 'toutiao', title: '头条 C', status: 'failed', error: 'denied' },
        ])
    })

    it('merges completion accounts by resolved key and preserves insertion order', () => {
        const merged = mergeWechatSyncCompletionAccounts([
            { id: 'wechat', title: '公众号 A', status: 'uploading' },
            { id: 'weibo', title: '微博 B', status: 'uploading' },
        ], [
            { id: 'wechat', title: '公众号 A', status: 'done', draftLink: 'https://drafts.example.com/a' },
            { id: 'toutiao', title: '头条 C', status: 'failed', error: 'quota_exceeded' },
        ])

        expect(merged).toEqual([
            { id: 'wechat', title: '公众号 A', status: 'done', draftLink: 'https://drafts.example.com/a' },
            { id: 'weibo', title: '微博 B', status: 'uploading' },
            { id: 'toutiao', title: '头条 C', status: 'failed', error: 'quota_exceeded' },
        ])
    })

    it('maps completion accounts back to task accounts and keeps optional edit response narrow', () => {
        expect(mapCompletionAccountsToTaskAccounts([
            {
                id: 'wechat',
                title: '公众号 A',
                status: 'done',
                msg: 'published',
                draftLink: 'https://drafts.example.com/a',
            },
            {
                id: 'weibo',
                title: '微博 B',
                status: 'failed',
                error: 'network timeout',
            },
        ])).toEqual([
            {
                id: 'wechat',
                type: 'wechat',
                title: '公众号 A',
                status: 'done',
                msg: 'published',
                error: undefined,
                editResp: {
                    draftLink: 'https://drafts.example.com/a',
                },
            },
            {
                id: 'weibo',
                type: 'weibo',
                title: '微博 B',
                status: 'failed',
                msg: undefined,
                error: 'network timeout',
                editResp: undefined,
            },
        ])
    })
})
