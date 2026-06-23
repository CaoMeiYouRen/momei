import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useTimeoutFn } from '@vueuse/core'
import {
    createExpandedPreviewController,
    mergeDistributionSourcePost,
    type DistributionSourcePost,
} from './use-post-distribution-button.helpers'
import type {
    Post,
    PostDistributionMode,
} from '@/types/post'
import type { ApiResponse } from '@/types/api'
import {
    buildDistributionMaterialBundle,
    type DistributionMaterialBundle,
} from '@/utils/shared/distribution-template'
import {
    buildMemosDistributionPreview,
    buildWechatSyncDistributionPreviewGroups,
} from '@/utils/shared/post-distribution-preview'
import {
    canRetry,
    renderActionLabel,
    renderChannelLabel,
    renderChannelMessage,
    renderFailureReason,
    renderStatusLabel,
    renderStatusSeverity,
    renderWechatTaskLabel,
    renderWechatSyncPreviewProfile,
    renderWechatSyncPreviewSeverity,
    resolveSyncer,
    showModeSelector,
    type ExpandedDistributionPreview,
    type PostDistributionSummary,
} from '@/utils/web/post-distribution-dialog'
import {
    buildWechatSyncPrecheckNotices,
} from '@/utils/shared/post-distribution-precheck'
import {
    buildWechatSyncFailureResults,
    resolveWechatSyncAccountKey,
    type WechatSyncAccount,
    type WechatSyncCompletionAccount,
    type WechatSyncDispatchObservation,
    type WechatSyncTaskAccount,
    type WechatSyncTaskStatus,
} from '@/utils/shared/wechatsync'
import {
    mapCompletionAccountsToTaskAccounts,
    mergeWechatSyncCompletionAccounts,
    resolveWechatSyncCompletionAccountKey,
} from '@/utils/shared/post-distribution-wechatsync'
import {
    buildFallbackDistributionMaterialBundle,
    buildPendingWechatSyncTaskAccounts,
    loadWechatSyncAccounts,
    mergeLocalWechatTaskAccounts,
    runWechatSyncTask,
} from '@/utils/web/post-distribution-wechatsync'

import { useI18nDate } from '@/composables/use-i18n-date'

interface UsePostDistributionButtonOptions {
    post: Ref<Partial<Post>>
}

type TranslateFn = ReturnType<typeof useI18n>['t']
type HexoRepositorySyncState = PostDistributionSummary['channels']['hexoRepositorySync']
type DistributionContext = {
    postId: string
    version: number
} | null

function resolveRoutePostId(route: ReturnType<typeof useRoute>) {
    return typeof route.params.id === 'string' && route.params.id !== 'new'
        ? route.params.id
        : ''
}

function isDistributionSourcePost(
    sourcePost: Partial<Post> | Post | null | undefined,
): sourcePost is Post {
    if (!sourcePost?.id) {
        return false
    }

    return typeof sourcePost.content === 'string'
}

function createHexoRepositorySyncRenderers(t: TranslateFn) {
    function renderHexoRepositorySyncMessage(state: HexoRepositorySyncState) {
        if (state.lastMessage) {
            return state.lastMessage
        }

        return t('pages.admin.posts.distribution.hexo_repository_hint')
    }

    function renderHexoRepositorySyncTarget(state: HexoRepositorySyncState) {
        if (state.owner && state.repo) {
            return t('pages.admin.posts.distribution.hexo_repository_target', {
                provider: (state.provider || 'github').toUpperCase(),
                target: `${state.owner}/${state.repo}`,
                branch: state.branch || 'main',
            })
        }

        return t('pages.admin.posts.distribution.hexo_repository_hint')
    }

    return {
        renderHexoRepositorySyncMessage,
        renderHexoRepositorySyncTarget,
    }
}

function reportWechatSyncObservation(observation: WechatSyncDispatchObservation) {
    if (!import.meta.client) {
        return
    }

    const lastEvent = observation.events[observation.events.length - 1] || null

    console.info('[momei][wechatsync-observation]', {
        strategy: observation.strategy,
        resolution: observation.resolution,
        readyEventCount: observation.readyEventCount,
        statusEventCount: observation.statusEventCount,
        lastEvent,
    })
}

function bindDistributionLifecycle(options: {
    activeWechatAttemptId: Ref<string | null>
    closeExpandedPreview: () => void
    dialogVisible: Ref<boolean>
    expandedPreview: Ref<ExpandedDistributionPreview | null>
    expandedPreviewVisible: Ref<boolean>
    fetchedPost: Ref<Post | null>
    hexoRepositorySubmitting: Ref<boolean>
    loading: Ref<boolean>
    localWechatTaskStatus: Ref<WechatSyncTaskStatus | null>
    memosSubmitting: Ref<boolean>
    routePostId: ComputedRef<string>
    summary: Ref<PostDistributionSummary | null>
    wechatSyncSubmitting: Ref<boolean>
    distributionContextVersion: Ref<number>
}) {
    const { start: resetTaskStatus } = useTimeoutFn(() => {
        options.localWechatTaskStatus.value = null
    }, 400, { immediate: false })

    watch(options.dialogVisible, (visible) => {
        if (!visible) {
            resetTaskStatus()
            options.closeExpandedPreview()
        }
    })

    watch(options.routePostId, (nextRoutePostId, previousRoutePostId) => {
        if (nextRoutePostId === previousRoutePostId) {
            return
        }

        options.distributionContextVersion.value += 1
        options.loading.value = false
        options.memosSubmitting.value = false
        options.hexoRepositorySubmitting.value = false
        options.wechatSyncSubmitting.value = false
        options.fetchedPost.value = null
        options.summary.value = null
        options.localWechatTaskStatus.value = null
        options.activeWechatAttemptId.value = null
        options.dialogVisible.value = false
        options.closeExpandedPreview()
    })

    watch(options.expandedPreviewVisible, (visible) => {
        if (!visible) {
            options.expandedPreview.value = null
        }
    })
}

function createDistributionContextController(options: {
    distributionContextVersion: Ref<number>
    postId: ComputedRef<string>
}) {
    function captureDistributionContext(): DistributionContext {
        if (!options.postId.value) {
            return null
        }

        return {
            postId: options.postId.value,
            version: options.distributionContextVersion.value,
        }
    }

    function isActiveDistributionContext(context: DistributionContext) {
        if (!context) {
            return false
        }

        return context.version === options.distributionContextVersion.value
            && context.postId === options.postId.value
    }

    return {
        captureDistributionContext,
        isActiveDistributionContext,
    }
}

export function usePostDistributionButton({ post }: UsePostDistributionButtonOptions) {
    const runtimeConfig = useRuntimeConfig()
    const route = useRoute()
    const { t } = useI18n()
    const { formatDateTime } = useI18nDate()
    const { resolveErrorMessage, showErrorToast, showSuccessToast } = useRequestFeedback()
    const dialogVisible = ref(false)
    const expandedPreviewVisible = ref(false)
    const loading = ref(false)
    const memosSubmitting = ref(false)
    const hexoRepositorySubmitting = ref(false)
    const wechatSyncSubmitting = ref(false)
    const distributionContextVersion = ref(0)
    const extensionInstalled = ref(false)
    const summary = ref<PostDistributionSummary | null>(null)
    const allAccounts = ref<WechatSyncAccount[]>([])
    const localWechatTaskStatus = ref<WechatSyncTaskStatus | null>(null)
    const activeWechatAttemptId = ref<string | null>(null)
    const memosMode = ref<PostDistributionMode>('update-existing')
    const wechatSyncMode = ref<PostDistributionMode>('update-existing')
    const fetchedPost = ref<Post | null>(null)
    const expandedPreview = ref<ExpandedDistributionPreview | null>(null)
    const finalizingWechatAttemptIds = new Set<string>()

    const routePostId = computed(() => resolveRoutePostId(route))
    const liveDistributionPost = computed<DistributionSourcePost | null>(() => {
        if (!isDistributionSourcePost(post.value)) {
            return null
        }

        if (routePostId.value && post.value.id !== routePostId.value) {
            return null
        }

        return post.value
    })
    const cachedDistributionPost = computed<Post | null>(() => {
        if (!fetchedPost.value) {
            return null
        }

        if (routePostId.value && fetchedPost.value.id !== routePostId.value) {
            return null
        }

        return fetchedPost.value
    })
    const resolvedDistributionPost = computed<Post | null>(() => mergeDistributionSourcePost(
        liveDistributionPost.value,
        cachedDistributionPost.value,
    ))
    const postId = computed(() => routePostId.value || post.value.id || fetchedPost.value?.id || '')
    const selectedWechatAccounts = computed(() => allAccounts.value.filter((account) => account.checked))
    const distributionMaterialBundle = computed<DistributionMaterialBundle | null>(() => {
        const sourcePost = resolvedDistributionPost.value
        if (!sourcePost) {
            return null
        }
        const siteUrl = runtimeConfig.public.siteUrl || (import.meta.client ? window.location.origin : '')
        if (!siteUrl) {
            return null
        }
        return buildDistributionMaterialBundle(sourcePost, {
            siteUrl,
            defaultLicense: runtimeConfig.public.postCopyright || runtimeConfig.public.defaultCopyright || 'all-rights-reserved',
        })
    })
    const wechatSyncPrecheckNotices = computed(() => buildWechatSyncPrecheckNotices(
        distributionMaterialBundle.value,
        selectedWechatAccounts.value,
        t,
    ))
    const memosPreview = computed(() => distributionMaterialBundle.value
        ? buildMemosDistributionPreview(distributionMaterialBundle.value)
        : null)
    const wechatSyncPreviewGroups = computed(() => distributionMaterialBundle.value
        ? buildWechatSyncDistributionPreviewGroups(distributionMaterialBundle.value, selectedWechatAccounts.value)
        : [])
    const expandedPreviewTitle = computed(() => expandedPreview.value?.title || t('common.preview'))
    const {
        copyExpandedPreviewContent,
        copyExpandedPreviewRenderedHtml,
        closeExpandedPreview,
        openMemosPreviewDialog,
        openWechatSyncPreviewDialog,
        renderPreviewMarkdownHtml,
        renderPreviewValue,
    } = createExpandedPreviewController({
        expandedPreview,
        expandedPreviewVisible,
        memosPreview,
        showErrorToast,
        showSuccessToast,
        t,
    })
    const {
        renderHexoRepositorySyncMessage,
        renderHexoRepositorySyncTarget,
    } = createHexoRepositorySyncRenderers(t)
    const {
        captureDistributionContext,
        isActiveDistributionContext,
    } = createDistributionContextController({
        distributionContextVersion,
        postId,
    })

    async function ensurePostDetail() {
        const context = captureDistributionContext()
        if (cachedDistributionPost.value || !context) {
            return
        }

        const response = await $fetch<ApiResponse<Post>>(`/api/posts/${context.postId}`)
        if (!isActiveDistributionContext(context)) {
            return
        }

        fetchedPost.value = response.data || null
    }

    async function loadAccounts() {
        const syncer = resolveSyncer()
        extensionInstalled.value = Boolean(syncer)
        allAccounts.value = await loadWechatSyncAccounts(syncer, allAccounts.value)
    }

    async function loadSummary() {
        const context = captureDistributionContext()
        if (!context) {
            return
        }

        loading.value = true
        try {
            const response = await $fetch<ApiResponse<PostDistributionSummary>>(`/api/admin/posts/${context.postId}/distribution`)
            if (!isActiveDistributionContext(context)) {
                return
            }

            summary.value = response.data || null

            if (summary.value?.channels.memos.lastMode) {
                memosMode.value = summary.value.channels.memos.lastMode
            }
            if (summary.value?.channels.wechatsync.lastMode) {
                wechatSyncMode.value = summary.value.channels.wechatsync.lastMode
            }
        } catch (error) {
            if (isActiveDistributionContext(context)) {
                showErrorToast(error, { fallbackKey: 'common.error_loading' })
            }
        } finally {
            if (isActiveDistributionContext(context)) {
                loading.value = false
            }
        }
    }

    async function openDialog() {
        dialogVisible.value = true
        await Promise.all([loadSummary(), loadAccounts(), ensurePostDetail()])
    }

    async function dispatchMemos(operation: 'sync' | 'retry') {
        const context = captureDistributionContext()
        if (!context) {
            return
        }

        memosSubmitting.value = true
        try {
            await $fetch(`/api/admin/posts/${context.postId}/distribution`, {
                method: 'POST',
                body: {
                    channel: 'memos',
                    mode: showModeSelector(summary.value?.channels.memos) ? memosMode.value : undefined,
                    operation,
                },
            })
            await loadSummary()
            if (isActiveDistributionContext(context)) {
                showSuccessToast('pages.admin.posts.distribution.memos_success')
            }
        } catch (error) {
            if (isActiveDistributionContext(context)) {
                showErrorToast(error, { fallbackKey: 'pages.admin.posts.distribution.dispatch_failed' })
            }
        } finally {
            if (isActiveDistributionContext(context)) {
                memosSubmitting.value = false
            }
        }
    }

    async function dispatchHexoRepositorySync(operation: 'sync' | 'retry') {
        const context = captureDistributionContext()
        if (!context) {
            return
        }

        hexoRepositorySubmitting.value = true
        try {
            await $fetch(`/api/admin/posts/${context.postId}/hexo-repository-sync`, {
                method: 'POST',
                body: { operation },
            })
            await loadSummary()
            if (isActiveDistributionContext(context)) {
                showSuccessToast('pages.admin.posts.distribution.hexo_sync_success')
            }
        } catch (error) {
            if (isActiveDistributionContext(context)) {
                showErrorToast(error, { fallbackKey: 'pages.admin.posts.distribution.dispatch_failed' })
            }
        } finally {
            if (isActiveDistributionContext(context)) {
                hexoRepositorySubmitting.value = false
            }
        }
    }

    function syncLocalWechatTaskAccounts(accounts: readonly WechatSyncTaskAccount[]) {
        localWechatTaskStatus.value = {
            accounts: mergeLocalWechatTaskAccounts(localWechatTaskStatus.value?.accounts || [], accounts),
        }
    }

    async function buildWechatSyncMaterialBundle() {
        await ensurePostDetail()
        if (distributionMaterialBundle.value) {
            return distributionMaterialBundle.value
        }

        const sourcePost = resolvedDistributionPost.value
        if (!sourcePost) {
            throw new Error(t('pages.admin.posts.distribution.dispatch_failed'))
        }
        return buildFallbackDistributionMaterialBundle(
            sourcePost,
            runtimeConfig.public.siteUrl || window.location.origin,
            runtimeConfig.public.postCopyright || runtimeConfig.public.defaultCopyright || 'all-rights-reserved',
        )
    }

    async function finalizeWechatSync(
        target: {
            postId: string
            attemptId: string | null
            context: ReturnType<typeof captureDistributionContext>
        },
        accounts: WechatSyncCompletionAccount[],
        observation?: WechatSyncDispatchObservation | null,
    ) {
        if (!target.postId || !target.attemptId || finalizingWechatAttemptIds.has(target.attemptId)) {
            return
        }

        finalizingWechatAttemptIds.add(target.attemptId)
        try {
            await $fetch(`/api/admin/posts/${target.postId}/distribution/wechatsync-complete`, {
                method: 'POST',
                body: {
                    attemptId: target.attemptId,
                    accounts,
                    observation: observation || undefined,
                },
            })
            if (isActiveDistributionContext(target.context)) {
                await loadSummary()
                showSuccessToast('pages.admin.posts.distribution.wechatsync_success')
            }
        } catch (error) {
            if (isActiveDistributionContext(target.context)) {
                showErrorToast(error, { fallbackKey: 'pages.admin.posts.distribution.dispatch_failed' })
            }
        } finally {
            if (isActiveDistributionContext(target.context) && activeWechatAttemptId.value === target.attemptId) {
                activeWechatAttemptId.value = null
            }
            finalizingWechatAttemptIds.delete(target.attemptId)
        }
    }

    async function dispatchWechatSync(operation: 'sync' | 'retry') {
        const context = captureDistributionContext()
        if (!context || !selectedWechatAccounts.value.length) {
            return
        }

        const syncer = resolveSyncer()
        if (!syncer?.addTask) {
            showErrorToast(new Error(t('pages.admin.posts.distribution.extension_missing')), {
                fallbackKey: 'pages.admin.posts.distribution.extension_missing',
            })
            return
        }

        wechatSyncSubmitting.value = true
        const selectedAccountsSnapshot = selectedWechatAccounts.value.map((account) => ({ ...account }))
        let completionAccounts: WechatSyncCompletionAccount[] = []
        let dispatchObservation: WechatSyncDispatchObservation | null = null
        let dispatchAttemptId: string | null = null

        try {
            const materialBundle = await buildWechatSyncMaterialBundle()

            const response = await $fetch<ApiResponse<{ attemptId?: string | null }>>(`/api/admin/posts/${context.postId}/distribution`, {
                method: 'POST',
                body: {
                    channel: 'wechatsync',
                    mode: showModeSelector(summary.value?.channels.wechatsync) ? wechatSyncMode.value : undefined,
                    operation,
                },
            })

            dispatchAttemptId = response.data?.attemptId || null
            if (isActiveDistributionContext(context)) {
                activeWechatAttemptId.value = dispatchAttemptId
                localWechatTaskStatus.value = {
                    accounts: buildPendingWechatSyncTaskAccounts(selectedAccountsSnapshot),
                }
            }

            const taskResult = await runWechatSyncTask({
                syncer,
                materialBundle,
                accounts: selectedAccountsSnapshot,
                onTaskAccounts: (accounts) => {
                    if (!isActiveDistributionContext(context)) {
                        return
                    }

                    syncLocalWechatTaskAccounts(accounts)
                },
                onReady: () => {
                    if (!isActiveDistributionContext(context)) {
                        return
                    }

                    void loadSummary()
                },
                onObservation: (observation) => {
                    dispatchObservation = observation
                    if (isActiveDistributionContext(context)) {
                        reportWechatSyncObservation(observation)
                    }
                },
                resolveFailureMessage: (error) => resolveErrorMessage(error, {
                    fallbackKey: 'pages.admin.posts.distribution.dispatch_failed',
                }),
                resolveTimeoutMessage: () => t('pages.admin.posts.distribution.wechatsync_timeout'),
            })
            completionAccounts = taskResult.completionAccounts
            dispatchObservation = taskResult.observation

            if (completionAccounts.some((account) => account.status === 'failed') && isActiveDistributionContext(context)) {
                syncLocalWechatTaskAccounts(mapCompletionAccountsToTaskAccounts(completionAccounts))
            }

            await finalizeWechatSync({
                postId: context.postId,
                attemptId: dispatchAttemptId,
                context,
            }, completionAccounts, dispatchObservation)
        } catch (error) {
            const completedAccountKeys = new Set(completionAccounts.map((account) => resolveWechatSyncCompletionAccountKey(account)))
            const remainingAccounts = selectedAccountsSnapshot.filter((account) => !completedAccountKeys.has(account.id || account.type || account.title))

            if (remainingAccounts.length && dispatchAttemptId) {
                const failureResults = buildWechatSyncFailureResults(
                    remainingAccounts,
                    resolveErrorMessage(error, {
                        fallbackKey: 'pages.admin.posts.distribution.dispatch_failed',
                    }),
                )
                completionAccounts = mergeWechatSyncCompletionAccounts(completionAccounts, failureResults)
                if (isActiveDistributionContext(context)) {
                    syncLocalWechatTaskAccounts(mapCompletionAccountsToTaskAccounts(failureResults))
                }
                await finalizeWechatSync({
                    postId: context.postId,
                    attemptId: dispatchAttemptId,
                    context,
                }, completionAccounts, dispatchObservation)
            } else if (isActiveDistributionContext(context)) {
                showErrorToast(error, { fallbackKey: 'pages.admin.posts.distribution.dispatch_failed' })
            }
        } finally {
            if (isActiveDistributionContext(context)) {
                wechatSyncSubmitting.value = false
            }
        }
    }

    async function terminateWechatSync() {
        const context = captureDistributionContext()
        if (!context) {
            return
        }

        wechatSyncSubmitting.value = true
        try {
            await $fetch(`/api/admin/posts/${context.postId}/distribution`, {
                method: 'POST',
                body: {
                    channel: 'wechatsync',
                    operation: 'terminate',
                },
            })
            if (isActiveDistributionContext(context)) {
                localWechatTaskStatus.value = null
                activeWechatAttemptId.value = null
            }
            await loadSummary()
            if (isActiveDistributionContext(context)) {
                showSuccessToast('pages.admin.posts.distribution.terminate_success')
            }
        } catch (error) {
            if (isActiveDistributionContext(context)) {
                showErrorToast(error, { fallbackKey: 'pages.admin.posts.distribution.dispatch_failed' })
            }
        } finally {
            if (isActiveDistributionContext(context)) {
                wechatSyncSubmitting.value = false
            }
        }
    }

    bindDistributionLifecycle({
        activeWechatAttemptId,
        closeExpandedPreview,
        dialogVisible,
        distributionContextVersion,
        expandedPreview,
        expandedPreviewVisible,
        fetchedPost,
        hexoRepositorySubmitting,
        loading,
        localWechatTaskStatus,
        memosSubmitting,
        routePostId,
        summary,
        wechatSyncSubmitting,
    })

    return {
        activeWechatAttemptId,
        allAccounts,
        canRetry,
        closeExpandedPreview,
        copyExpandedPreviewContent,
        copyExpandedPreviewRenderedHtml,
        dialogVisible,
        dispatchHexoRepositorySync,
        dispatchMemos,
        dispatchWechatSync,
        expandedPreview,
        expandedPreviewTitle,
        expandedPreviewVisible,
        extensionInstalled,
        formatDateTime,
        hexoRepositorySubmitting,
        loadSummary,
        loading,
        localWechatTaskStatus,
        memosMode,
        memosPreview,
        memosSubmitting,
        openDialog,
        openMemosPreviewDialog,
        openWechatSyncPreviewDialog,
        postId,
        renderActionLabel,
        renderChannelLabel,
        renderChannelMessage,
        renderFailureReason,
        renderHexoRepositorySyncMessage,
        renderHexoRepositorySyncTarget,
        renderPreviewMarkdownHtml,
        renderPreviewValue,
        renderStatusLabel,
        renderStatusSeverity,
        renderWechatSyncPreviewProfile,
        renderWechatSyncPreviewSeverity,
        renderWechatTaskLabel,
        resolveWechatSyncAccountKey,
        selectedWechatAccounts,
        showModeSelector,
        summary,
        t,
        terminateWechatSync,
        wechatSyncMode,
        wechatSyncPrecheckNotices,
        wechatSyncPreviewGroups,
        wechatSyncSubmitting,
    }
}
