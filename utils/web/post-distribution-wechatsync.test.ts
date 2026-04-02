import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    buildFallbackDistributionMaterialBundle,
    loadWechatSyncAccounts,
    mergeLocalWechatTaskAccounts,
    runWechatSyncBatch,
} from './post-distribution-wechatsync'
import type { WechatSyncWindow } from './post-distribution-dialog'
import type { Post } from '@/types/post'
import type { DistributionMaterialBundle } from '@/utils/shared/distribution-template'
import type {
    WechatSyncAccount,
    WechatSyncRawAccount,
    WechatSyncTaskAccount,
} from '@/utils/shared/wechatsync'

const {
    buildDistributionMaterialBundleMock,
    buildWechatSyncDispatchPostFromMaterialBundleMock,
    buildWechatSyncFailureResultsMock,
    mapWechatSyncTaskAccountsForCompletionMock,
    normalizeWechatSyncAccountsMock,
    mergeWechatSyncTaskAccountsMock,
    shouldFinalizeWechatSyncStatusMock,
} = vi.hoisted(() => ({
    buildDistributionMaterialBundleMock: vi.fn(),
    buildWechatSyncDispatchPostFromMaterialBundleMock: vi.fn(),
    buildWechatSyncFailureResultsMock: vi.fn(),
    mapWechatSyncTaskAccountsForCompletionMock: vi.fn(),
    normalizeWechatSyncAccountsMock: vi.fn(),
    mergeWechatSyncTaskAccountsMock: vi.fn(),
    shouldFinalizeWechatSyncStatusMock: vi.fn(),
}))

vi.mock('@/utils/shared/distribution-template', () => ({
    buildDistributionMaterialBundle: buildDistributionMaterialBundleMock,
    buildWechatSyncDispatchPostFromMaterialBundle: buildWechatSyncDispatchPostFromMaterialBundleMock,
}))

vi.mock('@/utils/shared/wechatsync', () => ({
    buildWechatSyncFailureResults: buildWechatSyncFailureResultsMock,
    mapWechatSyncTaskAccountsForCompletion: mapWechatSyncTaskAccountsForCompletionMock,
    normalizeWechatSyncAccounts: normalizeWechatSyncAccountsMock,
}))

vi.mock('@/utils/shared/post-distribution-wechatsync', () => ({
    mergeWechatSyncTaskAccounts: mergeWechatSyncTaskAccountsMock,
    shouldFinalizeWechatSyncStatus: shouldFinalizeWechatSyncStatusMock,
}))

describe('post-distribution-wechatsync', () => {
    const createSyncer = (overrides: Partial<WechatSyncWindow> = {}): WechatSyncWindow => ({
        getAccounts: () => undefined,
        addTask: () => undefined,
        ...overrides,
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('delegates account merge to shared helper', () => {
        const currentAccounts: WechatSyncTaskAccount[] = [{ id: 'wechat', title: 'A', status: 'done' }]
        const nextAccounts: WechatSyncTaskAccount[] = [{ id: 'weibo', title: 'B', status: 'failed' }]
        const merged: WechatSyncTaskAccount[] = [{ id: 'wechat', title: 'A', status: 'done' }, { id: 'weibo', title: 'B', status: 'failed' }]
        mergeWechatSyncTaskAccountsMock.mockReturnValue(merged)

        expect(mergeLocalWechatTaskAccounts(currentAccounts, nextAccounts)).toBe(merged)
        expect(mergeWechatSyncTaskAccountsMock).toHaveBeenCalledWith(currentAccounts, nextAccounts)
    })

    it('loads accounts from syncer and normalizes them against current selection', async () => {
        const currentAccounts: WechatSyncAccount[] = [{ id: 'wechat', type: 'wechat', title: '公众号 A', checked: true }]
        const rawAccounts: WechatSyncRawAccount[] = [{ type: 'wechat', title: '公众号 A' }]
        const normalizedAccounts: WechatSyncAccount[] = [{ id: 'wechat', type: 'wechat', title: '公众号 A', checked: true }]
        normalizeWechatSyncAccountsMock.mockReturnValue(normalizedAccounts)

        const result = await loadWechatSyncAccounts(createSyncer({
            getAccounts(callback) {
                callback(rawAccounts)
            },
        }), currentAccounts)

        expect(result).toBe(normalizedAccounts)
        expect(normalizeWechatSyncAccountsMock).toHaveBeenCalledWith(rawAccounts, currentAccounts)
        await expect(loadWechatSyncAccounts(undefined, currentAccounts)).resolves.toEqual([])
    })

    it('delegates fallback material bundle construction to shared helper', () => {
        const sourcePost = {} as Post
        const bundle = { channels: { wechatsync: { basePost: { markdown: '' } } } } as unknown as DistributionMaterialBundle
        buildDistributionMaterialBundleMock.mockReturnValue(bundle)

        expect(buildFallbackDistributionMaterialBundle(sourcePost, 'https://momei.example', 'CC BY-NC-SA 4.0')).toBe(bundle)
        expect(buildDistributionMaterialBundleMock).toHaveBeenCalledWith(sourcePost, {
            siteUrl: 'https://momei.example',
            defaultLicense: 'CC BY-NC-SA 4.0',
        })
    })

    it('runs sync batch and resolves completion accounts after finalized status', async () => {
        const materialBundle = { bundle: true } as unknown as DistributionMaterialBundle
        const batch = {
            renderMode: 'wrapped' as const,
            contentProfile: 'weibo' as const,
            accounts: [{ id: 'weibo', type: 'weibo', title: '微博 B', checked: true }],
        }
        const postToSync = { title: 'post-to-sync' }
        const taskAccounts: WechatSyncTaskAccount[] = [{ id: 'weibo', title: '微博 B', status: 'done' }]
        const completionAccounts = [{ id: 'weibo', title: '微博 B', status: 'done' }]
        const onTaskAccounts = vi.fn()
        const onReady = vi.fn()

        buildWechatSyncDispatchPostFromMaterialBundleMock.mockReturnValue(postToSync)
        shouldFinalizeWechatSyncStatusMock.mockReturnValue(true)
        mapWechatSyncTaskAccountsForCompletionMock.mockReturnValue(completionAccounts)

        const result = await runWechatSyncBatch({
            syncer: createSyncer({
                addTask(payload, onStatus, ready) {
                    expect(payload).toEqual({
                        post: postToSync,
                        accounts: batch.accounts,
                    })
                    ready()
                    onStatus({ accounts: taskAccounts })
                },
            }),
            materialBundle,
            batch,
            onTaskAccounts,
            onReady,
            resolveFailureMessage: () => 'unused',
        })

        expect(result).toBe(completionAccounts)
        expect(buildWechatSyncDispatchPostFromMaterialBundleMock).toHaveBeenCalledWith(materialBundle, {
            renderMode: 'wrapped',
            contentProfile: 'weibo',
        })
        expect(onReady).toHaveBeenCalledTimes(1)
        expect(onTaskAccounts).toHaveBeenCalledWith(taskAccounts)
        expect(shouldFinalizeWechatSyncStatusMock).toHaveBeenCalledWith({ accounts: taskAccounts })
        expect(mapWechatSyncTaskAccountsForCompletionMock).toHaveBeenCalledWith(taskAccounts, batch.accounts)
    })

    it('returns failure results when syncer throws during task creation', async () => {
        const failureResults = [{ id: 'wechat', title: '公众号 A', status: 'failed', error: 'sync failed' }]
        const error = new Error('sync failed')

        buildWechatSyncDispatchPostFromMaterialBundleMock.mockReturnValue({ title: 'post' })
        buildWechatSyncFailureResultsMock.mockReturnValue(failureResults)

        const result = await runWechatSyncBatch({
            syncer: createSyncer({
                addTask() {
                    throw error
                },
            }),
            materialBundle: { bundle: true } as unknown as DistributionMaterialBundle,
            batch: {
                renderMode: 'leading',
                contentProfile: 'default',
                accounts: [{ id: 'wechat', type: 'wechat', title: '公众号 A', checked: true }],
            },
            onTaskAccounts: vi.fn(),
            onReady: vi.fn(),
            resolveFailureMessage: (caught) => (caught as Error).message,
        })

        expect(result).toBe(failureResults)
        expect(buildWechatSyncFailureResultsMock).toHaveBeenCalledWith([{ id: 'wechat', type: 'wechat', title: '公众号 A', checked: true }], 'sync failed')
    })
})
