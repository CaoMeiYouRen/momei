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
                                :key="account.id"
                                class="post-distribution-dialog__account-item"
                            >
                                <Checkbox
                                    v-model="account.checked"
                                    :input-id="`distribution-account-${account.id}`"
                                    binary
                                />
                                <label :for="`distribution-account-${account.id}`">
                                    <img
                                        v-if="account.icon"
                                        :src="account.icon"
                                        class="post-distribution-dialog__account-icon"
                                    >
                                    <span>{{ account.title }}</span>
                                </label>
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
                                :disabled="!extensionInstalled || !selectedWechatAccounts.length"
                                :loading="wechatSyncSubmitting"
                                @click="dispatchWechatSync('sync')"
                            />
                            <Button
                                v-if="canRetry('wechatsync')"
                                :label="$t('pages.admin.posts.distribution.retry')"
                                text
                                :disabled="!extensionInstalled || !selectedWechatAccounts.length"
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
                                :key="account.title"
                                class="post-distribution-dialog__task-item"
                            >
                                <div class="post-distribution-dialog__task-name">
                                    {{ account.title }}
                                </div>
                                <div class="post-distribution-dialog__task-meta">
                                    <span>{{ renderWechatTaskLabel(account.status) }}</span>
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
import { appendPostCopyrightNotice } from '@/utils/shared/post-copyright'
import { createMarkdownRenderer } from '@/utils/shared/markdown'
import { buildAbsoluteUrl } from '@/utils/shared/seo'
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

interface WechatSyncAccount {
    id: string
    title: string
    icon?: string
    checked: boolean
}

interface WechatSyncTaskAccount {
    title: string
    status: 'uploading' | 'done' | 'failed'
    msg?: string
    error?: string
    editResp?: {
        draftLink?: string
    }
}

interface WechatSyncTaskStatus {
    accounts?: WechatSyncTaskAccount[]
}

interface WechatSyncWindow {
    getAccounts: (callback: (accounts: Array<{ id: string | number, title: string, icon?: string }>) => void) => void
    addTask: (
        payload: {
            post: {
                title: string
                markdown: string
                content: string
                desc: string
                cover: string
            }
            accounts: Array<{ id: string, title: string, icon?: string, checked: boolean }>
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
const { showErrorToast, showSuccessToast } = useRequestFeedback()

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

function resolveSyncer() {
    return import.meta.client ? window.$syncer : undefined
}

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
    return t(`pages.admin.posts.distribution.wechatsync_task.${status}`)
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
        allAccounts.value = accounts.map((account) => ({
            id: String(account.id),
            title: account.title,
            icon: account.icon,
            checked: false,
        }))
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
    await Promise.all([loadSummary(), loadAccounts()])
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

async function finalizeWechatSync(accounts: WechatSyncTaskAccount[]) {
    if (!postId.value || !activeWechatAttemptId.value || finalizingWechatSync.value) {
        return
    }

    finalizingWechatSync.value = true
    try {
        await $fetch(`/api/admin/posts/${postId.value}/distribution/wechatsync-complete`, {
            method: 'POST',
            body: {
                attemptId: activeWechatAttemptId.value,
                accounts: accounts.map((account, index) => ({
                    id: String(index + 1),
                    title: account.title,
                    status: account.status,
                    msg: account.msg,
                    error: account.error,
                    draftLink: account.editResp?.draftLink,
                })),
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

function shouldFinalizeWechatSync(status: WechatSyncTaskStatus) {
    return Boolean(status.accounts?.length)
        && status.accounts!.every((account) => account.status === 'done' || account.status === 'failed')
}

async function buildWechatSyncPost() {
    await ensurePostDetail()
    const sourcePost = fetchedPost.value || (props.post as Post)
    const md = createMarkdownRenderer({
        html: true,
        withAnchor: true,
    })

    const langPrefix = sourcePost.language === 'zh-CN' ? '' : `/${sourcePost.language}`
    const postUrl = buildAbsoluteUrl(
        runtimeConfig.public.siteUrl || window.location.origin,
        `${langPrefix}/posts/${sourcePost.slug || sourcePost.id}`,
    )
    const markdownWithCopyright = appendPostCopyrightNotice(sourcePost.content || '', {
        authorName: sourcePost.author?.name || null,
        url: postUrl,
        license: sourcePost.copyright,
        defaultLicense: runtimeConfig.public.defaultCopyright || 'all-rights-reserved',
        locale: sourcePost.language,
    }, 'markdown')

    return {
        title: sourcePost.title || '',
        markdown: markdownWithCopyright,
        content: md.render(markdownWithCopyright),
        desc: sourcePost.summary || (sourcePost.content || '').substring(0, 100).replace(/[#*`]/g, ''),
        cover: sourcePost.coverImage || '',
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
    try {
        const response = await $fetch<ApiResponse<{ attemptId?: string | null }>>(`/api/admin/posts/${postId.value}/distribution`, {
            method: 'POST',
            body: {
                channel: 'wechatsync',
                mode: showModeSelector('wechatsync') ? wechatSyncMode.value : undefined,
                operation,
            },
        })

        activeWechatAttemptId.value = response.data?.attemptId || null
        const postToSync = await buildWechatSyncPost()
        localWechatTaskStatus.value = { accounts: [] }

        syncer.addTask(
            {
                post: postToSync,
                accounts: selectedWechatAccounts.value,
            },
            (status) => {
                localWechatTaskStatus.value = status
                if (shouldFinalizeWechatSync(status) && status.accounts) {
                    void finalizeWechatSync(status.accounts)
                }
            },
            () => {
                void loadSummary()
            },
        )
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'pages.admin.posts.distribution.dispatch_failed' })
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

<style lang="scss" scoped>
.post-distribution-dialog {
    &__loading {
        display: flex;
        justify-content: center;
        padding: 2rem 0;
    }

    &__content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    &__channels {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__channel-card {
        padding: 1rem;
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius-md);
        background: var(--p-content-background);
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
    }

    &__channel-header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;

        h4 {
            margin: 0 0 0.25rem;
        }

        small {
            color: var(--p-text-muted-color);
            display: block;
            line-height: 1.5;
        }
    }

    &__hint {
        color: var(--p-text-muted-color);
    }

    &__mode-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    &__mode-item,
    &__account-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__account-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
    }

    &__account-icon {
        width: 1rem;
        height: 1rem;
        object-fit: contain;
    }

    &__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    &__remote-link {
        color: var(--p-primary-500);
        text-decoration: none;
    }

    &__task-list,
    &__timeline {
        padding: 1rem;
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius-md);
        background: var(--p-content-background);
    }

    &__task-item,
    &__timeline-item {
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--p-surface-border);
    }

    &__task-item:last-child,
    &__timeline-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }

    &__task-name,
    &__timeline-main {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    &__task-meta,
    &__timeline-time {
        color: var(--p-text-muted-color);
        display: flex;
        gap: 0.5rem;
        margin-top: 0.25rem;
    }

    &__timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;

        h4 {
            margin: 0;
        }
    }

    &__timeline-message {
        margin: 0.25rem 0 0;
        color: var(--p-text-color);

        &--error {
            color: var(--p-red-500);
        }
    }

    &__empty {
        color: var(--p-text-muted-color);
    }
}

@media (width <= 960px) {
    .post-distribution-dialog {
        &__channels {
            grid-template-columns: 1fr;
        }

        &__account-list {
            grid-template-columns: 1fr;
        }
    }
}
</style>
