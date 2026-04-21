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
            v-model:visible="expandedPreviewVisible"
            modal
            maximizable
            class="post-distribution-preview-dialog"
            :header="expandedPreviewTitle"
            :style="{width: 'min(96vw, 82rem)'}"
        >
            <div v-if="expandedPreview" class="post-distribution-preview-dialog__content">
                <div class="post-distribution-preview-dialog__meta-grid">
                    <div class="post-distribution-preview-dialog__meta-card post-distribution-preview-dialog__meta-card--accent">
                        <div class="post-distribution-preview-dialog__meta-topline">
                            <span class="post-distribution-preview-dialog__meta-label">{{ renderChannelLabel(expandedPreview.channel, t) }}</span>
                            <Tag :value="expandedPreview.badge" :severity="expandedPreview.badgeSeverity" />
                        </div>
                        <h3>{{ renderPreviewValue(expandedPreview.articleTitle) }}</h3>
                        <p>{{ renderPreviewValue(expandedPreview.summary) }}</p>
                    </div>
                    <div class="post-distribution-preview-dialog__meta-card">
                        <span class="post-distribution-preview-dialog__meta-label">{{ $t('pages.admin.posts.distribution.preview.accounts') }}</span>
                        <p>{{ renderPreviewValue(expandedPreview.accountsLabel) }}</p>
                    </div>
                    <div class="post-distribution-preview-dialog__meta-card">
                        <span class="post-distribution-preview-dialog__meta-label">{{ $t('pages.admin.posts.distribution.preview.tags') }}</span>
                        <p>{{ renderPreviewValue(expandedPreview.tagLine) }}</p>
                    </div>
                    <div class="post-distribution-preview-dialog__meta-card">
                        <span class="post-distribution-preview-dialog__meta-label">{{ $t('pages.admin.posts.distribution.preview.cover') }}</span>
                        <div v-if="expandedPreview.coverUrl" class="post-distribution-preview-dialog__cover-media">
                            <img
                                :src="expandedPreview.coverUrl"
                                :alt="renderPreviewValue(expandedPreview.articleTitle)"
                                class="post-distribution-preview-dialog__cover-image"
                            >
                            <a
                                :href="expandedPreview.coverUrl"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="post-distribution-dialog__remote-link"
                            >
                                {{ $t('pages.admin.posts.distribution.open_remote') }}
                            </a>
                        </div>
                        <p v-else>
                            {{ renderPreviewValue('') }}
                        </p>
                    </div>
                </div>
                <div class="post-distribution-preview-dialog__panel-grid">
                    <section class="post-distribution-preview-dialog__panel post-distribution-preview-dialog__panel--wide">
                        <div class="post-distribution-preview-dialog__panel-header">
                            <h4>{{ $t('common.preview') }}</h4>
                            <span>{{ $t('pages.admin.posts.distribution.preview.final_markdown') }}</span>
                        </div>
                        <!-- eslint-disable vue/no-v-html -->
                        <div
                            class="post-distribution-dialog__preview-rich post-distribution-preview-dialog__preview-surface"
                            v-html="renderPreviewMarkdownHtml(expandedPreview.finalMarkdown)"
                        />
                        <!-- eslint-enable vue/no-v-html -->
                    </section>
                    <section class="post-distribution-preview-dialog__panel">
                        <div class="post-distribution-preview-dialog__panel-header">
                            <h4>{{ $t('pages.admin.posts.distribution.preview.final_markdown') }}</h4>
                            <span>{{ $t('pages.admin.posts.distribution.preview.final_markdown') }}</span>
                        </div>
                        <pre class="post-distribution-dialog__preview-code post-distribution-preview-dialog__code-surface">{{ renderPreviewValue(expandedPreview.finalMarkdown) }}</pre>
                    </section>
                    <section v-if="expandedPreview.bodyMarkdown" class="post-distribution-preview-dialog__panel">
                        <div class="post-distribution-preview-dialog__panel-header">
                            <h4>{{ $t('pages.admin.posts.distribution.preview.body') }}</h4>
                            <span>{{ renderChannelLabel(expandedPreview.channel, t) }}</span>
                        </div>
                        <pre class="post-distribution-dialog__preview-code post-distribution-preview-dialog__code-surface">{{ renderPreviewValue(expandedPreview.bodyMarkdown) }}</pre>
                    </section>
                    <section v-if="expandedPreview.copyrightMarkdown" class="post-distribution-preview-dialog__panel">
                        <div class="post-distribution-preview-dialog__panel-header">
                            <h4>{{ $t('pages.admin.posts.distribution.preview.copyright') }}</h4>
                            <span>{{ renderChannelLabel(expandedPreview.channel, t) }}</span>
                        </div>
                        <!-- eslint-disable vue/no-v-html -->
                        <div
                            class="post-distribution-dialog__preview-rich post-distribution-preview-dialog__preview-surface"
                            v-html="renderPreviewMarkdownHtml(expandedPreview.copyrightMarkdown)"
                        />
                        <!-- eslint-enable vue/no-v-html -->
                    </section>
                </div>
            </div>
            <template #footer>
                <Button
                    :label="$t('common.close')"
                    text
                    severity="secondary"
                    @click="closeExpandedPreview"
                />
            </template>
        </Dialog>
        <Dialog
            v-model:visible="dialogVisible"
            modal
            class="post-distribution-dialog"
            :header="$t('pages.admin.posts.distribution.dialog_title')"
            :style="{width: '58rem'}"
        >
            <div v-if="loading" class="post-distribution-dialog__loading" />
            <div v-else-if="summary" class="post-distribution-dialog__content">
                <div class="post-distribution-dialog__channels">
                    <section class="post-distribution-dialog__channel-card">
                        <div class="post-distribution-dialog__channel-header">
                            <div>
                                <h4>{{ $t('pages.admin.posts.distribution.channels.memos') }}</h4>
                                <small>{{ renderChannelMessage(summary.channels.memos, t) }}</small>
                            </div>
                            <Tag
                                :value="renderStatusLabel(summary.channels.memos.status, t)"
                                :severity="renderStatusSeverity(summary.channels.memos.status)"
                            />
                        </div>
                        <div v-if="showModeSelector(summary.channels.memos)" class="post-distribution-dialog__mode-group">
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
                        <div v-if="memosPreview" class="post-distribution-dialog__preview-launcher">
                            <div class="post-distribution-dialog__preview-launcher-main">
                                <span class="post-distribution-dialog__preview-label">{{ $t('common.preview') }}</span>
                                <p class="post-distribution-dialog__preview-launcher-text">
                                    {{ $t('pages.admin.posts.distribution.preview.memos_title') }}
                                </p>
                            </div>
                            <div class="post-distribution-dialog__preview-actions">
                                <Tag value="Memos" severity="info" />
                                <Button
                                    :label="$t('common.expand')"
                                    icon="pi pi-window-maximize"
                                    text
                                    size="small"
                                    @click="openMemosPreviewDialog"
                                />
                            </div>
                        </div>
                        <div class="post-distribution-dialog__actions">
                            <Button
                                :label="$t('pages.admin.posts.distribution.sync_now')"
                                severity="contrast"
                                :loading="memosSubmitting"
                                @click="dispatchMemos('sync')"
                            />
                            <Button
                                v-if="canRetry(summary.channels.memos)"
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
                                <h4>{{ $t('pages.admin.posts.distribution.channels.hexo_repository_sync') }}</h4>
                                <small>{{ renderHexoRepositorySyncMessage(summary.channels.hexoRepositorySync) }}</small>
                            </div>
                            <Tag
                                :value="renderStatusLabel(summary.channels.hexoRepositorySync.status, t)"
                                :severity="renderStatusSeverity(summary.channels.hexoRepositorySync.status)"
                            />
                        </div>
                        <small class="post-distribution-dialog__hint">
                            {{ renderHexoRepositorySyncTarget(summary.channels.hexoRepositorySync) }}
                        </small>
                        <div v-if="summary.channels.hexoRepositorySync.filePath" class="post-distribution-dialog__preview-launcher">
                            <div class="post-distribution-dialog__preview-launcher-main">
                                <span class="post-distribution-dialog__preview-label">{{ $t('pages.admin.posts.distribution.hexo_repository_file_path') }}</span>
                                <p class="post-distribution-dialog__preview-launcher-text">
                                    {{ summary.channels.hexoRepositorySync.filePath }}
                                </p>
                            </div>
                            <div class="post-distribution-dialog__preview-actions">
                                <Tag
                                    v-if="summary.channels.hexoRepositorySync.remoteSha"
                                    :value="summary.channels.hexoRepositorySync.remoteSha"
                                    severity="secondary"
                                />
                            </div>
                        </div>
                        <a
                            v-if="summary.channels.hexoRepositorySync.remoteUrl"
                            :href="summary.channels.hexoRepositorySync.remoteUrl"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="post-distribution-dialog__remote-link"
                        >
                            {{ $t('pages.admin.posts.distribution.open_remote') }}
                        </a>
                        <div class="post-distribution-dialog__actions">
                            <Button
                                :label="$t('pages.admin.posts.distribution.sync_now')"
                                severity="contrast"
                                :loading="hexoRepositorySubmitting"
                                @click="dispatchHexoRepositorySync('sync')"
                            />
                            <Button
                                v-if="canRetry(summary.channels.hexoRepositorySync)"
                                :label="$t('pages.admin.posts.distribution.retry')"
                                text
                                :loading="hexoRepositorySubmitting"
                                @click="dispatchHexoRepositorySync('retry')"
                            />
                        </div>
                    </section>
                    <section class="post-distribution-dialog__channel-card">
                        <div class="post-distribution-dialog__channel-header">
                            <div>
                                <h4>{{ $t('pages.admin.posts.distribution.channels.wechatsync') }}</h4>
                                <small>{{ renderChannelMessage(summary.channels.wechatsync, t) }}</small>
                            </div>
                            <Tag
                                :value="renderStatusLabel(summary.channels.wechatsync.status, t)"
                                :severity="renderStatusSeverity(summary.channels.wechatsync.status)"
                            />
                        </div>

                        <small class="post-distribution-dialog__hint">
                            {{ extensionInstalled
                                ? $t('pages.admin.posts.distribution.wechatsync_ready')
                                : $t('pages.admin.posts.distribution.extension_missing') }}
                        </small>
                        <div v-if="showModeSelector(summary.channels.wechatsync)" class="post-distribution-dialog__mode-group">
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
                        <div v-if="wechatSyncPreviewGroups.length" class="post-distribution-dialog__preview-launcher-list">
                            <div
                                v-for="group in wechatSyncPreviewGroups"
                                :key="group.key"
                                class="post-distribution-dialog__preview-launcher"
                            >
                                <div class="post-distribution-dialog__preview-launcher-main">
                                    <span class="post-distribution-dialog__preview-label">{{ $t('common.preview') }}</span>
                                    <p class="post-distribution-dialog__preview-launcher-text">
                                        {{ renderPreviewValue(group.accountsLabel) }}
                                    </p>
                                </div>
                                <div class="post-distribution-dialog__preview-actions">
                                    <Tag
                                        :value="renderWechatSyncPreviewProfile(group, t)"
                                        :severity="renderWechatSyncPreviewSeverity(group)"
                                    />
                                    <Button
                                        :label="$t('common.expand')"
                                        icon="pi pi-window-maximize"
                                        text
                                        size="small"
                                        @click="openWechatSyncPreviewDialog(group)"
                                    />
                                </div>
                            </div>
                        </div>
                        <div v-else-if="extensionInstalled" class="post-distribution-dialog__empty">
                            {{ $t('pages.admin.posts.distribution.preview.no_account_selected') }}
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
                                v-if="canRetry(summary.channels.wechatsync)"
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
                                :key="resolveWechatSyncAccountKey(account)"
                                class="post-distribution-dialog__task-item"
                            >
                                <div class="post-distribution-dialog__task-name">
                                    {{ account.title }}
                                </div>
                                <div class="post-distribution-dialog__task-meta">
                                    <span :title="account.error || account.msg">{{ renderWechatTaskLabel(account.status, t) }}</span>
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
                                <strong>{{ renderChannelLabel(item.channel, t) }}</strong>
                                <span>{{ renderActionLabel(item.action, item.mode, t) }}</span>
                                <Tag
                                    :value="renderStatusLabel(item.status, t)"
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
                                {{ renderFailureReason(item.failureReason, t) }}
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
    type WechatSyncDistributionPreviewGroup,
} from '@/utils/shared/post-distribution-preview'
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
import { renderDistributionPreviewHtml } from '@/utils/shared/post-distribution-preview-renderer'
import { useI18nDate } from '@/composables/use-i18n-date'

const props = withDefaults(defineProps<{
    post: Partial<Post>
    showButton?: boolean
}>(), {
    showButton: true,
})

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

function resolveRoutePostId() {
    return typeof route.params.id === 'string' && route.params.id !== 'new'
        ? route.params.id
        : ''
}

function isDistributionSourcePost(post: Partial<Post> | Post | null | undefined): post is Post {
    if (!post?.id) {
        return false
    }

    return typeof post.content === 'string'
}

function captureDistributionContext() {
    if (!postId.value) {
        return null
    }

    return {
        postId: postId.value,
        version: distributionContextVersion.value,
    }
}

function isActiveDistributionContext(context: ReturnType<typeof captureDistributionContext>) {
    if (!context) {
        return false
    }

    return context.version === distributionContextVersion.value
        && context.postId === postId.value
}

const routePostId = computed(() => resolveRoutePostId())
const liveDistributionPost = computed<Post | null>(() => {
    if (!isDistributionSourcePost(props.post)) {
        return null
    }

    if (routePostId.value && props.post.id !== routePostId.value) {
        return null
    }

    return props.post
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
const postId = computed(() => routePostId.value || props.post.id || fetchedPost.value?.id || '')
const selectedWechatAccounts = computed(() => allAccounts.value.filter((account) => account.checked))
const distributionMaterialBundle = computed<DistributionMaterialBundle | null>(() => {
    const sourcePost = liveDistributionPost.value || cachedDistributionPost.value
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

function renderPreviewValue(value?: string | null) {
    return value?.trim() || t('pages.admin.posts.distribution.preview.empty')
}

function renderPreviewMarkdownHtml(value?: string | null) {
    return renderDistributionPreviewHtml(value, t('pages.admin.posts.distribution.preview.empty'))
}

function openExpandedPreview(preview: ExpandedDistributionPreview) {
    expandedPreview.value = preview
    expandedPreviewVisible.value = true
}

function closeExpandedPreview() {
    expandedPreviewVisible.value = false
}

function openMemosPreviewDialog() {
    if (!memosPreview.value) return
    openExpandedPreview(createMemosExpandedPreview(memosPreview.value, t))
}

function openWechatSyncPreviewDialog(group: WechatSyncDistributionPreviewGroup) {
    openExpandedPreview(createWechatSyncExpandedPreview(group, t))
}

function renderHexoRepositorySyncMessage(state: PostDistributionSummary['channels']['hexoRepositorySync']) {
    if (state.lastMessage) {
        return state.lastMessage
    }

    return t('pages.admin.posts.distribution.hexo_repository_hint')
}

function renderHexoRepositorySyncTarget(state: PostDistributionSummary['channels']['hexoRepositorySync']) {
    if (state.owner && state.repo) {
        return t('pages.admin.posts.distribution.hexo_repository_target', {
            provider: (state.provider || 'github').toUpperCase(),
            target: `${state.owner}/${state.repo}`,
            branch: state.branch || 'main',
        })
    }

    return t('pages.admin.posts.distribution.hexo_repository_hint')
}

async function ensurePostDetail() {
    const context = captureDistributionContext()
    if (cachedDistributionPost.value || !context) return

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
    if (!context) return

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
            showErrorToast(error, { fallbackKey: 'common.load_failed' })
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
    if (!context) return

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
    if (!context) return

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
    if (distributionMaterialBundle.value) return distributionMaterialBundle.value
    const sourcePost = liveDistributionPost.value || cachedDistributionPost.value
    if (!sourcePost) {
        throw new Error(t('pages.admin.posts.distribution.dispatch_failed'))
    }
    return buildFallbackDistributionMaterialBundle(
        sourcePost,
        runtimeConfig.public.siteUrl || window.location.origin,
        runtimeConfig.public.postCopyright || runtimeConfig.public.defaultCopyright || 'all-rights-reserved',
    )
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

async function finalizeWechatSync(
    target: {
        postId: string
        attemptId: string | null
        context: ReturnType<typeof captureDistributionContext>
    },
    accounts: WechatSyncCompletionAccount[],
    observation?: WechatSyncDispatchObservation | null,
) {
    if (!target.postId || !target.attemptId || finalizingWechatAttemptIds.has(target.attemptId)) return
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
    if (!context || !selectedWechatAccounts.value.length) return

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
        } else {
            if (isActiveDistributionContext(context)) {
                showErrorToast(error, { fallbackKey: 'pages.admin.posts.distribution.dispatch_failed' })
            }
        }
    } finally {
        if (isActiveDistributionContext(context)) {
            wechatSyncSubmitting.value = false
        }
    }
}

async function terminateWechatSync() {
    const context = captureDistributionContext()
    if (!context) return

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

const { start: resetTaskStatus } = useTimeoutFn(() => {
    localWechatTaskStatus.value = null
}, 400, { immediate: false })

watch(dialogVisible, (visible) => {
    if (!visible) {
        resetTaskStatus()
        closeExpandedPreview()
    }
})

watch(routePostId, (nextRoutePostId, previousRoutePostId) => {
    if (nextRoutePostId === previousRoutePostId) {
        return
    }

    distributionContextVersion.value += 1
    loading.value = false
    memosSubmitting.value = false
    hexoRepositorySubmitting.value = false
    wechatSyncSubmitting.value = false
    fetchedPost.value = null
    summary.value = null
    localWechatTaskStatus.value = null
    activeWechatAttemptId.value = null
    dialogVisible.value = false
    closeExpandedPreview()
})

watch(expandedPreviewVisible, (visible) => {
    if (!visible) {
        expandedPreview.value = null
    }
})

defineExpose({
    openDialog,
})
</script>

<style lang="scss" scoped src="./post-distribution-button.scss"></style>
