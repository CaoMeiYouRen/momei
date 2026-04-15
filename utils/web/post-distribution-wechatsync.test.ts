import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    buildFallbackDistributionMaterialBundle,
    buildPendingWechatSyncTaskAccounts,
    loadWechatSyncAccounts,
    mergeLocalWechatTaskAccounts,
    runWechatSyncTask,
} from './post-distribution-wechatsync'
import type { WechatSyncWindow } from './post-distribution-dialog'
import type { Post } from '@/types/post'
import type { DistributionMaterialBundle } from '@/utils/shared/distribution-template'
import {
    MAX_WECHATSYNC_OBSERVATION_EVENTS,
    type WechatSyncAccount,
    type WechatSyncDispatchObservation,
    type WechatSyncRawAccount,
    type WechatSyncTaskAccount,
} from '@/utils/shared/wechatsync'

const {
    buildDistributionMaterialBundleMock,
    buildWechatSyncFailureResultsMock,
    mapWechatSyncTaskAccountsForCompletionMock,
    mergeWechatSyncCompletionAccountsMock,
    normalizeWechatSyncAccountsMock,
    mergeWechatSyncTaskAccountsMock,
    shouldFinalizeWechatSyncStatusMock,
} = vi.hoisted(() => ({
    buildDistributionMaterialBundleMock: vi.fn(),
    buildWechatSyncFailureResultsMock: vi.fn(),
    mapWechatSyncTaskAccountsForCompletionMock: vi.fn(),
    mergeWechatSyncCompletionAccountsMock: vi.fn(),
    normalizeWechatSyncAccountsMock: vi.fn(),
    mergeWechatSyncTaskAccountsMock: vi.fn(),
    shouldFinalizeWechatSyncStatusMock: vi.fn(),
}))

vi.mock('@/utils/shared/distribution-template', () => ({
    buildDistributionMaterialBundle: buildDistributionMaterialBundleMock,
}))

vi.mock('@/utils/shared/wechatsync', () => ({
    MAX_WECHATSYNC_OBSERVATION_ACCOUNT_KEYS: 50,
    MAX_WECHATSYNC_OBSERVATION_ACCOUNTS: 50,
    MAX_WECHATSYNC_OBSERVATION_EVENTS: 30,
    MAX_WECHATSYNC_OBSERVATION_RAW_STATUS_KEYS: 20,
    buildWechatSyncFailureResults: buildWechatSyncFailureResultsMock,
    mapWechatSyncTaskAccountsForCompletion: mapWechatSyncTaskAccountsForCompletionMock,
    normalizeWechatSyncAccounts: normalizeWechatSyncAccountsMock,
}))

vi.mock('@/utils/shared/post-distribution-wechatsync', () => ({
    mergeWechatSyncCompletionAccounts: mergeWechatSyncCompletionAccountsMock,
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
        mergeWechatSyncTaskAccountsMock.mockImplementation((currentAccounts: WechatSyncTaskAccount[], nextAccounts: WechatSyncTaskAccount[]) => {
            const mergedAccounts = new Map<string, WechatSyncTaskAccount>()

            for (const account of currentAccounts) {
                mergedAccounts.set(account.type || account.id || account.title, account)
            }

            for (const account of nextAccounts) {
                mergedAccounts.set(account.type || account.id || account.title, account)
            }

            return Array.from(mergedAccounts.values())
        })
        mergeWechatSyncCompletionAccountsMock.mockImplementation((currentAccounts, nextAccounts) => {
            const mergedAccounts = new Map<string, (typeof currentAccounts)[number]>()

            for (const account of currentAccounts) {
                mergedAccounts.set(account.id || account.title, account)
            }

            for (const account of nextAccounts) {
                mergedAccounts.set(account.id || account.title, account)
            }

            return Array.from(mergedAccounts.values())
        })
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

    it('builds pending task accounts before the first plugin callback arrives', () => {
        expect(buildPendingWechatSyncTaskAccounts([
            { id: 'wechat', type: 'wechat', title: '公众号 A', checked: true },
            { id: 'weibo', type: 'weibo', title: '微博 B', checked: true },
        ])).toEqual([
            { id: 'wechat', type: 'wechat', title: '公众号 A', status: 'pending' },
            { id: 'weibo', type: 'weibo', title: '微博 B', status: 'pending' },
        ])
    })

    it('runs a single raw/default task and records observation after finalized status', async () => {
        const materialBundle = { bundle: true } as unknown as DistributionMaterialBundle
        const accounts = [{ id: 'weibo', type: 'weibo', title: '微博 B', checked: true }]
        const taskAccounts: WechatSyncTaskAccount[] = [{ id: 'weibo', title: '微博 B', status: 'done' }]
        const completionAccounts = [{ id: 'weibo', title: '微博 B', status: 'done' }]
        const onTaskAccounts = vi.fn()
        const onReady = vi.fn()
        const onObservation = vi.fn<(observation: WechatSyncDispatchObservation) => void>()
        const rawPost = {
            title: 'raw-post',
            markdown: '# raw',
            content: '<p>raw</p>',
            desc: 'summary',
            thumb: '',
        }

        ;(materialBundle as DistributionMaterialBundle).channels = {
            memos: { content: '' },
            wechatsync: {
                basePost: rawPost,
                tagPlacement: 'before-copyright',
            },
        }

        shouldFinalizeWechatSyncStatusMock.mockReturnValue(true)
        mapWechatSyncTaskAccountsForCompletionMock.mockReturnValue(completionAccounts)

        const result = await runWechatSyncTask({
            syncer: createSyncer({
                addTask(payload, onStatus, ready) {
                    expect(payload).toEqual({
                        post: rawPost,
                        accounts,
                    })
                    ready()
                    onStatus({ accounts: taskAccounts })
                },
            }),
            materialBundle,
            accounts,
            onTaskAccounts,
            onReady,
            onObservation,
            resolveFailureMessage: () => 'unused',
        })

        expect(result.completionAccounts).toBe(completionAccounts)
        expect(onReady).toHaveBeenCalledTimes(1)
        expect(onTaskAccounts).toHaveBeenCalledWith(taskAccounts)
        expect(shouldFinalizeWechatSyncStatusMock).toHaveBeenCalledWith({ accounts: taskAccounts })
        expect(mapWechatSyncTaskAccountsForCompletionMock).toHaveBeenCalledWith(taskAccounts, accounts)
        expect(result.observation).toMatchObject({
            strategy: 'single_add_task_default_raw',
            resolution: 'terminal_status',
            readyEventCount: 1,
            statusEventCount: 1,
            payload: {
                renderMode: 'none',
                contentProfile: 'default',
                usesRawPost: true,
                accountKeys: ['weibo'],
            },
        })
        expect(result.observation.events.map((event) => event.phase)).toEqual([
            'dispatch_started',
            'ready',
            'status_received',
            'resolved',
        ])
        expect(onObservation).toHaveBeenCalled()
    })

    it('waits for every selected account before resolving terminal status', async () => {
        const accounts = [
            { id: 'wechat', type: 'wechat', title: '公众号 A', checked: true },
            { id: 'weibo', type: 'weibo', title: '微博 B', checked: true },
        ]
        const firstStatus: WechatSyncTaskAccount[] = [{ id: 'wechat', title: '公众号 A', status: 'done' }]
        const secondStatus: WechatSyncTaskAccount[] = [
            { id: 'weibo', title: '微博 B', status: 'failed', error: 'quota' },
        ]
        const mergedStatus: WechatSyncTaskAccount[] = [
            { id: 'wechat', title: '公众号 A', status: 'done' },
            { id: 'weibo', title: '微博 B', status: 'failed', error: 'quota' },
        ]
        const completionAccounts = [
            { id: 'wechat', title: '公众号 A', status: 'done' },
            { id: 'weibo', title: '微博 B', status: 'failed', error: 'quota' },
        ]
        const materialBundle = {
            channels: {
                memos: { content: '' },
                wechatsync: {
                    basePost: {
                        title: 'post',
                        markdown: '# post',
                        content: '<p>post</p>',
                        desc: 'desc',
                        thumb: '',
                    },
                    tagPlacement: 'before-copyright',
                },
            },
        } as unknown as DistributionMaterialBundle

        shouldFinalizeWechatSyncStatusMock.mockReturnValue(true)
        mapWechatSyncTaskAccountsForCompletionMock.mockReturnValue(completionAccounts)

        const result = await runWechatSyncTask({
            syncer: createSyncer({
                addTask(_payload, onStatus) {
                    onStatus({ accounts: firstStatus })
                    expect(mapWechatSyncTaskAccountsForCompletionMock).not.toHaveBeenCalled()
                    onStatus({ accounts: secondStatus })
                },
            }),
            materialBundle,
            accounts,
            onTaskAccounts: vi.fn(),
            onReady: vi.fn(),
            resolveFailureMessage: () => 'unused',
        })

        expect(mapWechatSyncTaskAccountsForCompletionMock).toHaveBeenCalledTimes(1)
        expect(mapWechatSyncTaskAccountsForCompletionMock).toHaveBeenCalledWith(mergedStatus, accounts)
        expect(result.completionAccounts).toBe(completionAccounts)
        expect(result.observation.statusEventCount).toBe(2)
        expect(result.observation.events.map((event) => event.phase)).toEqual([
            'dispatch_started',
            'status_received',
            'status_received',
            'resolved',
        ])
    })

    it('caps persisted observation events while preserving anchor and terminal events', async () => {
        const accounts = [{ id: 'weibo', type: 'weibo', title: '微博 B', checked: true }]
        const statusUpdates = Array.from({ length: 35 }, (_, index) => ({
            id: 'weibo',
            title: '微博 B',
            status: index === 34 ? 'done' : 'uploading',
            msg: `step-${index + 1}`,
        } satisfies WechatSyncTaskAccount))
        const materialBundle = {
            channels: {
                memos: { content: '' },
                wechatsync: {
                    basePost: {
                        title: 'post',
                        markdown: '# post',
                        content: '<p>post</p>',
                        desc: 'desc',
                        thumb: '',
                    },
                    tagPlacement: 'before-copyright',
                },
            },
        } as unknown as DistributionMaterialBundle

        shouldFinalizeWechatSyncStatusMock.mockImplementation(({ accounts: currentAccounts }: { accounts?: WechatSyncTaskAccount[] }) => currentAccounts?.[0]?.status === 'done')
        mapWechatSyncTaskAccountsForCompletionMock.mockReturnValue([
            { id: 'weibo', title: '微博 B', status: 'done' },
        ])

        const result = await runWechatSyncTask({
            syncer: createSyncer({
                addTask(_payload, onStatus, ready) {
                    ready()
                    for (const taskAccount of statusUpdates) {
                        onStatus({ accounts: [taskAccount] })
                    }
                },
            }),
            materialBundle,
            accounts,
            onTaskAccounts: vi.fn(),
            onReady: vi.fn(),
            resolveFailureMessage: () => 'unused',
        })

        expect(result.observation.statusEventCount).toBe(statusUpdates.length)
        expect(result.observation.events).toHaveLength(MAX_WECHATSYNC_OBSERVATION_EVENTS)
        expect(result.observation.events[0]?.phase).toBe('dispatch_started')
        expect(result.observation.events[1]?.phase).toBe('ready')
        expect(result.observation.events.at(-1)?.phase).toBe('resolved')
        expect(result.observation.events.filter((event) => event.phase === 'status_received')).toHaveLength(MAX_WECHATSYNC_OBSERVATION_EVENTS - 3)
    })

    it('fails missing accounts after status inactivity timeout', async () => {
        vi.useFakeTimers()

        try {
            const accounts = [
                { id: 'wechat', type: 'wechat', title: '公众号 A', checked: true },
                { id: 'weibo', type: 'weibo', title: '微博 B', checked: true },
            ]
            const firstStatus: WechatSyncTaskAccount[] = [{ id: 'wechat', title: '公众号 A', status: 'done' }]
            const materialBundle = {
                channels: {
                    memos: { content: '' },
                    wechatsync: {
                        basePost: {
                            title: 'post',
                            markdown: '# post',
                            content: '<p>post</p>',
                            desc: 'desc',
                            thumb: '',
                        },
                        tagPlacement: 'before-copyright',
                    },
                },
            } as unknown as DistributionMaterialBundle

            shouldFinalizeWechatSyncStatusMock.mockReturnValue(true)
            mapWechatSyncTaskAccountsForCompletionMock.mockReturnValue([
                { id: 'wechat', title: '公众号 A', status: 'done' },
            ])
            buildWechatSyncFailureResultsMock.mockReturnValue([
                { id: 'weibo', title: '微博 B', status: 'failed', error: 'status timeout' },
            ])

            const resultPromise = runWechatSyncTask({
                syncer: createSyncer({
                    addTask(_payload, onStatus) {
                        onStatus({ accounts: firstStatus })
                    },
                }),
                materialBundle,
                accounts,
                onTaskAccounts: vi.fn(),
                onReady: vi.fn(),
                resolveFailureMessage: () => 'unused',
                resolveTimeoutMessage: () => 'status timeout',
                statusInactivityTimeoutMs: 1_000,
            })

            await vi.advanceTimersByTimeAsync(1_000)
            const result = await resultPromise

            expect(buildWechatSyncFailureResultsMock).toHaveBeenCalledWith([
                { id: 'weibo', type: 'weibo', title: '微博 B', checked: true },
            ], 'status timeout')
            expect(result.completionAccounts).toEqual([
                { id: 'wechat', title: '公众号 A', status: 'done' },
                { id: 'weibo', title: '微博 B', status: 'failed', error: 'status timeout' },
            ])
            expect(result.observation).toMatchObject({
                resolution: 'timeout_incomplete_status',
                statusEventCount: 1,
            })
            expect(result.observation.events.at(-1)).toMatchObject({
                phase: 'timeout_resolved',
                accountCount: 2,
            })
        } finally {
            vi.useRealTimers()
        }
    })

    it('returns failure results and start_error observation when syncer throws during task creation', async () => {
        const failureResults = [{ id: 'wechat', title: '公众号 A', status: 'failed', error: 'sync failed' }]
        const error = new Error('sync failed')
        const materialBundle = {
            channels: {
                memos: { content: '' },
                wechatsync: {
                    basePost: {
                        title: 'post',
                        markdown: 'body',
                        content: '<p>body</p>',
                        desc: 'desc',
                        thumb: '',
                    },
                    tagPlacement: 'before-copyright',
                },
            },
        } as unknown as DistributionMaterialBundle
        buildWechatSyncFailureResultsMock.mockReturnValue(failureResults)

        const result = await runWechatSyncTask({
            syncer: createSyncer({
                addTask() {
                    throw error
                },
            }),
            materialBundle,
            accounts: [{ id: 'wechat', type: 'wechat', title: '公众号 A', checked: true }],
            onTaskAccounts: vi.fn(),
            onReady: vi.fn(),
            resolveFailureMessage: (caught) => (caught as Error).message,
        })

        expect(result.completionAccounts).toBe(failureResults)
        expect(buildWechatSyncFailureResultsMock).toHaveBeenCalledWith([{ id: 'wechat', type: 'wechat', title: '公众号 A', checked: true }], 'sync failed')
        expect(result.observation).toMatchObject({
            strategy: 'single_add_task_default_raw',
            resolution: 'start_error',
        })
        expect(result.observation.events.at(-1)?.phase).toBe('start_failed')
    })
})
