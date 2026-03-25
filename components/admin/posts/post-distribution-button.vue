<template>
    <div class="post-distribution-button">
        <Button
            v-if="showButton && postId"
            v-tooltip="$t('pages.admin.posts.distribution.tooltip')"
            icon="pi pi-sync"
            text
            rounded
            @click="openDialog"
        />

        <Dialog
            v-model:visible="dialogVisible"
            modal
            class="post-distribution-dialog"
            :header="$t('pages.admin.posts.distribution.dialog_title')"
            :style="{width: '58rem'}"
        >
            <div v-if="loading" class="post-distribution-dialog__loading">
                <ProgressSpinner style="width: 2rem; height: 2rem" stroke-width="4" />
            </div>
            <div v-else-if="summary" class="post-distribution-dialog__content">
                <div class="post-distribution-dialog__channels">
                    <section class="post-distribution-dialog__channel-card">
                        <div class="post-distribution-dialog__channel-header">
                            <div>
                                <h4>{{ $t('pages.admin.posts.distribution.channels.memos') }}</h4>
                                <small>{{ renderChannelMessage('memos') }}</small>
                            </div>
                            <Tag
                                :value="renderStatusLabel(summary.channels.memos.status)"
                                :severity="renderStatusSeverity(summary.channels.memos.status)"
                            />
                        </div>

                        <div v-if="showModeSelector('memos')" class="post-distribution-dialog__mode-group">
                            <div class="post-distribution-dialog__mode-item">
                                <RadioButton
                                    v-model="memosMode"
                                    input-id="distribution_memos_update"
                                    name="distribution_memos_mode"
                                    value="update-existing"
                                />
                                <label for="distribution_memos_update">
                                    {{ $t('pages.admin.posts.distribution.mode_update_existing') }}
                                </label>
                            </div>
                            <div class="post-distribution-dialog__mode-item">
                                <RadioButton
                                    v-model="memosMode"
                                    input-id="distribution_memos_republish"
                                    name="distribution_memos_mode"
                                    value="republish-new"
                                />
                                <label for="distribution_memos_republish">
                                    {{ $t('pages.admin.posts.distribution.mode_republish_new') }}
                                </label>
                            </div>
                        </div>
                        <small v-else class="post-distribution-dialog__hint">
                            {{ $t('pages.admin.posts.distribution.first_sync_hint') }}
                        </small>

                        <a
                            v-if="summary.channels.memos.remoteUrl"
                            :href="summary.channels.memos.remoteUrl"
                            target="_blank"
                            class="post-distribution-dialog__remote-link"
                        >
                            {{ $t('pages.admin.posts.distribution.open_remote') }}
                        </a>

                        <div class="post-distribution-dialog__actions">
                            <Button
                                :label="$t('pages.admin.posts.distribution.sync_now')"
                                severity="contrast"
                                :loading="memosSubmitting"
                                @click="dispatchMemos('sync')"
                            />
                            <Button
                                v-if="canRetry('memos')"
                                :label="$t('pages.admin.posts.distribution.retry')"
                                text
                                :loading="memosSubmitting"
                                @click="dispatchMemos('retry')"
                            />
                        </div>
                    </section>

                    <section class="post-distribution-dialog__channel-card">
                        <div class="post-distribution-dialog__channel-header">
                            <div>
                                <h4>{{ $t('pages.admin.posts.distribution.channels.wechatsync') }}</h4>
                                <small>{{ renderChannelMessage('wechatsync') }}</small>
                            </div>
                            <Tag
                                :value="renderStatusLabel(summary.channels.wechatsync.status)"
                                :severity="renderStatusSeverity(summary.channels.wechatsync.status)"
                            />
                        </div>

                        <small class="post-distribution-dialog__hint">
                            {{ extensionInstalled
                                ? $t('pages.admin.posts.distribution.wechatsync_ready')
                                : $t('pages.admin.posts.distribution.extension_missing') }}
                        </small>

                        <div v-if="showModeSelector('wechatsync')" class="post-distribution-dialog__mode-group">
                            <div class="post-distribution-dialog__mode-item">
                                <RadioButton
                                    v-model="wechatSyncMode"
                                    input-id="distribution_wechat_update"
                                    name="distribution_wechatsync_mode"
                                    value="update-existing"
                                />
                                <label for="distribution_wechat_update">
                                    {{ $t('pages.admin.posts.distribution.mode_update_existing') }}
                                </label>
                            </div>
                            <div class="post-distribution-dialog__mode-item">
                                <RadioButton
                                    v-model="wechatSyncMode"
                                    input-id="distribution_wechat_republish"
                                    name="distribution_wechatsync_mode"
                                    value="republish-new"
                                />
                                <label for="distribution_wechat_republish">
                                    {{ $t('pages.admin.posts.distribution.mode_republish_new') }}
                                </label>
                            </div>
                        </div>
                        <small v-else class="post-distribution-dialog__hint">
                            {{ $t('pages.admin.posts.distribution.first_sync_hint') }}
                        </small>

                        <div v-if="extensionInstalled && allAccounts.length > 0" class="post-distribution-dialog__account-list">
                            <div
                                v-for="account in allAccounts"
                                :key="resolveWechatSyncAccountKey(account)"
                                class="post-distribution-dialog__account-item"
                            >
                                <Checkbox
                                    v-model="account.checked"
                                    :input-id="`distribution-account-${resolveWechatSyncAccountKey(account)}`"
                                    binary
                                />
                                <label :for="`distribution-account-${resolveWechatSyncAccountKey(account)}`">
                                    <img
                                        v-if="account.icon"
                                        :src="account.icon"
                                        class="post-distribution-dialog__account-icon"
                                    >
                                    <span>{{ account.title }}</span>
                                </label>
                            </div>
                        </div>
                        <div v-if="wechatSyncPrecheckNotices.length" class="post-distribution-dialog__precheck-list">
                            <div
                                v-for="notice in wechatSyncPrecheckNotices"
                                :key="notice.key"
                                class="post-distribution-dialog__precheck"
                                :class="`post-distribution-dialog__precheck--${notice.severity}`"
                            >
                                <strong>{{ notice.summary }}</strong>
                                <p>{{ notice.detail }}</p>
                            </div>
                        </div>
                        <a
                            v-else-if="!extensionInstalled"
                            href="https://www.wechatsync.com/?utm_source=momei"
                            target="_blank"
                            class="post-distribution-dialog__remote-link"
                        >
                            {{ $t('pages.admin.posts.distribution.install_extension') }}
                        </a>

                        <div class="post-distribution-dialog__actions">
                            <Button
                                :label="$t('pages.admin.posts.distribution.start_wechatsync')"
                                severity="contrast"
                                :disabled="!extensionInstalled || !selectedWechatAccounts.length || hasBlockingWechatSyncPrecheck"
                                :loading="wechatSyncSubmitting"
                                @click="dispatchWechatSync('sync')"
                            />
                            <Button
                                v-if="canRetry('wechatsync')"
                                :label="$t('pages.admin.posts.distribution.retry')"
                                text
                                :disabled="!extensionInstalled || !selectedWechatAccounts.length || hasBlockingWechatSyncPrecheck"
                                :loading="wechatSyncSubmitting"
                                @click="dispatchWechatSync('retry')"
                            />
                            <Button
                                v-if="summary.channels.wechatsync.activeAttemptId"
                                :label="$t('pages.admin.posts.distribution.terminate')"
                                text
                                severity="danger"
                                :loading="wechatSyncSubmitting"
                                @click="terminateWechatSync"
                            />
                        </div>

                        <div v-if="localWechatTaskStatus?.accounts?.length" class="post-distribution-dialog__task-list">
                            <div
                                v-for="account in localWechatTaskStatus.accounts"
                                :key="resolveWechatSyncAccountKey(account)"
                                class="post-distribution-dialog__task-item"
                            >
                                <div class="post-distribution-dialog__task-name">
                                    {{ account.title }}
                                </div>
                                <div class="post-distribution-dialog__task-meta">
                                    <span :title="account.error || account.msg">{{ renderWechatTaskLabel(account.status) }}</span>
                                    <a
                                        v-if="account.editResp?.draftLink"
                                        :href="account.editResp.draftLink"
                                        target="_blank"
                                    >
                                        {{ $t('pages.admin.posts.distribution.open_remote') }}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div class="post-distribution-dialog__timeline">
                    <div class="post-distribution-dialog__timeline-header">
                        <h4>{{ $t('pages.admin.posts.distribution.timeline_title') }}</h4>
                        <Button
                            icon="pi pi-refresh"
                            text
                            rounded
                            @click="loadSummary"
                        />
                    </div>

                    <div v-if="summary.timeline.length === 0" class="post-distribution-dialog__empty">
                        {{ $t('pages.admin.posts.distribution.no_timeline') }}
                    </div>

                    <div v-else class="post-distribution-dialog__timeline-list">
                        <article
                            v-for="item in summary.timeline"
                            :key="item.id"
                            class="post-distribution-dialog__timeline-item"
                        >
                            <div class="post-distribution-dialog__timeline-main">
                                <strong>{{ renderChannelLabel(item.channel) }}</strong>
                                <span>{{ renderActionLabel(item.action, item.mode) }}</span>
                                <Tag
                                    :value="renderStatusLabel(item.status)"
                                    :severity="renderStatusSeverity(item.status)"
                                />
                            </div>
                            <small class="post-distribution-dialog__timeline-time">
                                {{ formatDateTime(item.startedAt) }}
                            </small>
                            <p v-if="item.message" class="post-distribution-dialog__timeline-message">
                                {{ item.message }}
                            </p>
                            <p
                                v-if="item.failureReason"
                                class="post-distribution-dialog__timeline-message post-distribution-dialog__timeline-message--error"
                            >
                                {{ renderFailureReason(item.failureReason) }}
                            </p>
                        </article>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    :label="$t('common.close')"
                    text
                    severity="secondary"
                    @click="dialogVisible = false"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTimeoutFn } from '@vueuse/core'
import type {
    Post,
    PostDistributionAction,
    PostDistributionChannel,
    PostDistributionFailureReason,
    PostDistributionMode,
    PostDistributionStatus,
    PostDistributionTimelineEntry,
} from '@/types/post'
import type { ApiResponse } from '@/types/api'
import {
    buildDistributionMaterialBundle,
    buildWechatSyncPostFromMaterialBundle,
    type DistributionMaterialBundle,
} from '@/utils/shared/distribution-template'
import {
    groupWechatSyncAccountsByTagRenderMode,
} from '@/utils/shared/distribution-tags'
import {
    buildWechatSyncPrecheckNotices,
    type WechatSyncPrecheckNotice,
} from '@/utils/shared/post-distribution-precheck'
import {
    buildWechatSyncFailureResults,
    mapWechatSyncTaskAccountsForCompletion,
    normalizeWechatSyncAccounts,
    resolveWechatSyncAccountKey,
    type WechatSyncAccount,
    type WechatSyncCompletionAccount,
    type WechatSyncRawAccount,
    type WechatSyncTaskAccount,
    type WechatSyncTaskStatus,
} from '@/utils/shared/wechatsync'
import {
    mapCompletionAccountsToTaskAccounts,
    mergeWechatSyncCompletionAccounts,
    mergeWechatSyncTaskAccounts,
    resolveWechatSyncCompletionAccountKey,
    shouldFinalizeWechatSyncStatus,
} from '@/utils/shared/post-distribution-wechatsync'
import { useI18nDate } from '@/composables/use-i18n-date'

interface PostDistributionSummary {
    channels: {
        memos: {
            status?: PostDistributionStatus | null
            remoteId?: string | null
            remoteUrl?: string | null
            lastMode?: PostDistributionMode | null
            activeAttemptId?: string | null
            lastFailureReason?: PostDistributionFailureReason | null
            lastMessage?: string | null
            lastSuccessAt?: string | Date | null
        }
        wechatsync: {
            status?: PostDistributionStatus | null
            remoteId?: string | null
            remoteUrl?: string | null
            lastMode?: PostDistributionMode | null
            activeAttemptId?: string | null
            lastFailureReason?: PostDistributionFailureReason | null
            lastMessage?: string | null
            lastSuccessAt?: string | Date | null
        }
    }
    timeline: PostDistributionTimelineEntry[]
}

interface WechatSyncWindow {
    getAccounts: (callback: (accounts: WechatSyncRawAccount[]) => void) => void
    addTask: (
        payload: {
            post: {
                title: string
                markdown: string
                content: string
                desc: string
                thumb: string
            }
            accounts: WechatSyncAccount[]
        },
        onStatus: (status: WechatSyncTaskStatus) => void,
        onReady: () => void,
    ) => void
}

declare global {
    interface Window {
        $syncer?: WechatSyncWindow
    }
}

const props = withDefaults(defineProps<{
    post: Partial<Post>
    showButton?: boolean
}>(), {
    showButton: true,
})

const runtimeConfig = useRuntimeConfig()
const { t } = useI18n()
const { formatDateTime } = useI18nDate()
const { resolveErrorMessage, showErrorToast, showSuccessToast } = useRequestFeedback()

const dialogVisible = ref(false)
const loading = ref(false)
const memosSubmitting = ref(false)
const wechatSyncSubmitting = ref(false)
const finalizingWechatSync = ref(false)
const extensionInstalled = ref(false)
const summary = ref<PostDistributionSummary | null>(null)
const allAccounts = ref<WechatSyncAccount[]>([])
const localWechatTaskStatus = ref<WechatSyncTaskStatus | null>(null)
const activeWechatAttemptId = ref<string | null>(null)
const memosMode = ref<PostDistributionMode>('update-existing')
const wechatSyncMode = ref<PostDistributionMode>('update-existing')
const fetchedPost = ref<Post | null>(null)

const postId = computed(() => props.post.id || '')
const selectedWechatAccounts = computed(() => allAccounts.value.filter((account) => account.checked))
const distributionMaterialBundle = computed<DistributionMaterialBundle | null>(() => {
    const sourcePost = fetchedPost.value || (props.post as Post)
    if (!sourcePost?.id || typeof sourcePost.content !== 'string') {
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

function resolveSyncer() {
    return import.meta.client ? window.$syncer : undefined
}

const wechatSyncPrecheckNotices = computed(() => buildWechatSyncPrecheckNotices(
    distributionMaterialBundle.value,
    selectedWechatAccounts.value,
    t,
))
const hasBlockingWechatSyncPrecheck = computed(() => wechatSyncPrecheckNotices.value.some((notice) => notice.severity === 'danger'))

function renderStatusSeverity(status?: PostDistributionStatus | null) {
    const severityMap: Record<string, string> = {
        idle: 'secondary',
        delivering: 'info',
        succeeded: 'success',
        failed: 'danger',
        cancelled: 'warn',
    }

    return severityMap[status || 'idle'] || 'secondary'
}

function renderStatusLabel(status?: PostDistributionStatus | null) {
    return t(`pages.admin.posts.distribution.status.${status || 'idle'}`)
}

function renderChannelLabel(channel: PostDistributionChannel) {
    return t(`pages.admin.posts.distribution.channels.${channel}`)
}

function renderFailureReason(reason: PostDistributionFailureReason) {
    return t(`pages.admin.posts.distribution.failure_reason.${reason}`)
}

function renderActionLabel(action: PostDistributionAction, mode?: PostDistributionMode | null) {
    if ((action === 'update' || action === 'republish' || action === 'retry') && mode) {
        return `${t(`pages.admin.posts.distribution.action.${action}`)} · ${mode === 'update-existing'
            ? t('pages.admin.posts.distribution.mode_update_existing')
            : t('pages.admin.posts.distribution.mode_republish_new')}`
    }

    return t(`pages.admin.posts.distribution.action.${action}`)
}

function renderWechatTaskLabel(status: WechatSyncTaskAccount['status']) {
    const normalizedStatus = status === 'pending' ? 'uploading' : status
    return t(`pages.admin.posts.distribution.wechatsync_task.${normalizedStatus}`)
}

function renderChannelMessage(channel: PostDistributionChannel) {
    const state = summary.value?.channels[channel]
    if (!state) {
        return t('pages.admin.posts.distribution.no_status')
    }

    if (state.status === 'failed' && state.lastFailureReason) {
        return `${renderFailureReason(state.lastFailureReason)}${state.lastMessage ? ` · ${state.lastMessage}` : ''}`
    }

    if (state.lastMessage) {
        return state.lastMessage
    }

    return t('pages.admin.posts.distribution.no_status')
}

function showModeSelector(channel: PostDistributionChannel) {
    const state = summary.value?.channels[channel]
    return Boolean(state?.remoteId || state?.lastSuccessAt)
}

function canRetry(channel: PostDistributionChannel) {
    return summary.value?.channels[channel].status === 'failed'
}

async function ensurePostDetail() {
    if (fetchedPost.value || !postId.value) {
        return
    }

    const response = await $fetch<ApiResponse<Post>>(`/api/posts/${postId.value}`)
    fetchedPost.value = response.data || null
}

async function loadAccounts() {
    const syncer = resolveSyncer()
    extensionInstalled.value = Boolean(syncer)
    if (!syncer?.getAccounts) {
        allAccounts.value = []
        return
    }

    syncer.getAccounts((accounts) => {
        allAccounts.value = normalizeWechatSyncAccounts(accounts, allAccounts.value)
    })
}

async function loadSummary() {
    if (!postId.value) {
        return
    }

    loading.value = true
    try {
        const response = await $fetch<ApiResponse<PostDistributionSummary>>(`/api/admin/posts/${postId.value}/distribution`)
        summary.value = response.data || null

        if (summary.value?.channels.memos.lastMode) {
            memosMode.value = summary.value.channels.memos.lastMode
        }
        if (summary.value?.channels.wechatsync.lastMode) {
            wechatSyncMode.value = summary.value.channels.wechatsync.lastMode
        }
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.load_failed' })
    } finally {
        loading.value = false
    }
}

async function openDialog() {
    dialogVisible.value = true
    await Promise.all([loadSummary(), loadAccounts(), ensurePostDetail()])
}

async function dispatchMemos(operation: 'sync' | 'retry') {
    if (!postId.value) {
        return
    }

    memosSubmitting.value = true
    try {
        await $fetch(`/api/admin/posts/${postId.value}/distribution`, {
            method: 'POST',
            body: {
                channel: 'memos',
                mode: showModeSelector('memos') ? memosMode.value : undefined,
                operation,
            },
        })
        await loadSummary()
        showSuccessToast('pages.admin.posts.distribution.memos_success')
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.posts.distribution.dispatch_failed' })
    } finally {
        memosSubmitting.value = false
    }
}

function syncLocalWechatTaskAccounts(accounts: readonly WechatSyncTaskAccount[]) {
    localWechatTaskStatus.value = {
        accounts: mergeWechatSyncTaskAccounts(localWechatTaskStatus.value?.accounts || [], accounts),
    }
}

async function buildWechatSyncMaterialBundle() {
    await ensurePostDetail()
    if (distributionMaterialBundle.value) {
        return distributionMaterialBundle.value
    }

    const sourcePost = fetchedPost.value || (props.post as Post)
    return buildDistributionMaterialBundle(sourcePost, {
        siteUrl: runtimeConfig.public.siteUrl || window.location.origin,
        defaultLicense: runtimeConfig.public.postCopyright || runtimeConfig.public.defaultCopyright || 'all-rights-reserved',
    })
}

async function runWechatSyncBatch(
    syncer: WechatSyncWindow,
    materialBundle: DistributionMaterialBundle,
    batch: {
        renderMode: 'leading' | 'wrapped' | 'none'
        contentProfile: 'default' | 'weibo'
        accounts: WechatSyncAccount[]
    },
) {
    return await new Promise<WechatSyncCompletionAccount[]>((resolve) => {
        const postToSync = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: batch.renderMode,
            contentProfile: batch.contentProfile,
        })

        try {
            syncer.addTask(
                {
                    post: postToSync,
                    accounts: batch.accounts,
                },
                (status) => {
                    const taskAccounts = status.accounts || []
                    if (taskAccounts.length) {
                        syncLocalWechatTaskAccounts(taskAccounts)
                    }

                    if (shouldFinalizeWechatSyncStatus({ accounts: taskAccounts })) {
                        resolve(mapWechatSyncTaskAccountsForCompletion(taskAccounts, batch.accounts))
                    }
                },
                () => {
                    void loadSummary()
                },
            )
        } catch (error) {
            const failureResults = buildWechatSyncFailureResults(
                batch.accounts,
                resolveErrorMessage(error, {
                    fallbackKey: 'pages.admin.posts.distribution.dispatch_failed',
                }),
            )
            syncLocalWechatTaskAccounts(mapCompletionAccountsToTaskAccounts(failureResults))
            resolve(failureResults)
        }
    })
}

async function finalizeWechatSync(accounts: WechatSyncCompletionAccount[]) {
    if (!postId.value || !activeWechatAttemptId.value || finalizingWechatSync.value) {
        return
    }

    finalizingWechatSync.value = true
    try {
        await $fetch(`/api/admin/posts/${postId.value}/distribution/wechatsync-complete`, {
            method: 'POST',
            body: {
                attemptId: activeWechatAttemptId.value,
                accounts,
            },
        })
        await loadSummary()
        showSuccessToast('pages.admin.posts.distribution.wechatsync_success')
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.posts.distribution.dispatch_failed' })
    } finally {
        activeWechatAttemptId.value = null
        finalizingWechatSync.value = false
    }
}

async function dispatchWechatSync(operation: 'sync' | 'retry') {
    if (!postId.value || !selectedWechatAccounts.value.length) {
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

    try {
        const materialBundle = await buildWechatSyncMaterialBundle()
        const blockingNotice = buildWechatSyncPrecheckNotices(materialBundle, selectedAccountsSnapshot, t)
            .find((notice) => notice.severity === 'danger')

        if (blockingNotice) {
            showErrorToast(new Error(t('pages.admin.posts.distribution.precheck.blocking_toast')), {
                fallbackKey: 'pages.admin.posts.distribution.precheck.blocking_toast',
            })
            return
        }

        const response = await $fetch<ApiResponse<{ attemptId?: string | null }>>(`/api/admin/posts/${postId.value}/distribution`, {
            method: 'POST',
            body: {
                channel: 'wechatsync',
                mode: showModeSelector('wechatsync') ? wechatSyncMode.value : undefined,
                operation,
            },
        })

        activeWechatAttemptId.value = response.data?.attemptId || null
        localWechatTaskStatus.value = { accounts: [] }

        const groupedAccounts = groupWechatSyncAccountsByTagRenderMode(selectedAccountsSnapshot)

        for (const group of groupedAccounts) {
            const batchCompletionAccounts = await runWechatSyncBatch(syncer, materialBundle, group)
            completionAccounts = mergeWechatSyncCompletionAccounts(completionAccounts, batchCompletionAccounts)
        }

        await finalizeWechatSync(completionAccounts)
    } catch (error) {
        const completedAccountKeys = new Set(completionAccounts.map((account) => resolveWechatSyncCompletionAccountKey(account)))
        const remainingAccounts = selectedAccountsSnapshot.filter((account) => !completedAccountKeys.has(account.id || account.type || account.title))

        if (remainingAccounts.length && activeWechatAttemptId.value) {
            const failureResults = buildWechatSyncFailureResults(
                remainingAccounts,
                resolveErrorMessage(error, {
                    fallbackKey: 'pages.admin.posts.distribution.dispatch_failed',
                }),
            )
            completionAccounts = mergeWechatSyncCompletionAccounts(completionAccounts, failureResults)
            syncLocalWechatTaskAccounts(mapCompletionAccountsToTaskAccounts(failureResults))
            await finalizeWechatSync(completionAccounts)
        } else {
            showErrorToast(error, { fallbackKey: 'pages.admin.posts.distribution.dispatch_failed' })
        }
    } finally {
        wechatSyncSubmitting.value = false
    }
}

async function terminateWechatSync() {
    if (!postId.value) {
        return
    }

    wechatSyncSubmitting.value = true
    try {
        await $fetch(`/api/admin/posts/${postId.value}/distribution`, {
            method: 'POST',
            body: {
                channel: 'wechatsync',
                operation: 'terminate',
            },
        })
        localWechatTaskStatus.value = null
        activeWechatAttemptId.value = null
        await loadSummary()
        showSuccessToast('pages.admin.posts.distribution.terminate_success')
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.posts.distribution.dispatch_failed' })
    } finally {
        wechatSyncSubmitting.value = false
    }
}

const { start: resetTaskStatus } = useTimeoutFn(() => {
    localWechatTaskStatus.value = null
}, 400, { immediate: false })

watch(dialogVisible, (visible) => {
    if (!visible) {
        resetTaskStatus()
    }
})

defineExpose({
    openDialog,
})
</script>

<style lang="scss" scoped src="./post-distribution-button.scss"></style>
