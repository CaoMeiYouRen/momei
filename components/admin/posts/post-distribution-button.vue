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
                    <div class="post-distribution-preview-dialog__meta-card post-distribution-preview-dialog__meta-card--cover">
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
                    <div v-if="expandedPreview.copyrightMarkdown" class="post-distribution-preview-dialog__meta-card post-distribution-preview-dialog__meta-card--tailnote">
                        <div class="post-distribution-preview-dialog__panel-header">
                            <span class="post-distribution-preview-dialog__meta-label">{{ $t('pages.admin.posts.distribution.preview.copyright') }}</span>
                            <span>{{ renderChannelLabel(expandedPreview.channel, t) }}</span>
                        </div>
                        <!-- eslint-disable vue/no-v-html -->
                        <div
                            class="post-distribution-dialog__preview-rich post-distribution-preview-dialog__tailnote-surface"
                            v-html="renderPreviewMarkdownHtml(expandedPreview.copyrightMarkdown, expandedPreview.contentProfile)"
                        />
                        <!-- eslint-enable vue/no-v-html -->
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
                            v-html="renderPreviewMarkdownHtml(expandedPreview.finalMarkdown, expandedPreview.contentProfile)"
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
                </div>
            </div>
            <template #footer>
                <Button
                    v-if="expandedPreview?.channel === 'wechatsync' && expandedPreview?.contentProfile === 'wechat_mp'"
                    :label="$t('pages.admin.posts.distribution.preview.copy_formatted_content')"
                    icon="pi pi-copy"
                    severity="contrast"
                    @click="copyExpandedPreviewContent"
                />
                <Button
                    v-if="expandedPreview?.channel === 'wechatsync' && expandedPreview?.contentProfile === 'wechat_mp'"
                    :label="$t('pages.admin.posts.distribution.preview.copy_rendered_html')"
                    icon="pi pi-code"
                    severity="contrast"
                    @click="copyExpandedPreviewRenderedHtml"
                />
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
import { toRef } from 'vue'
import type { Post } from '@/types/post'
import { usePostDistributionButton } from '@/composables/use-post-distribution-button'

const props = withDefaults(defineProps<{
    post: Partial<Post>
    showButton?: boolean
}>(), {
    showButton: true,
})

const {
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
} = usePostDistributionButton({
    post: toRef(props, 'post'),
})

defineExpose({
    openDialog,
})
</script>

<style lang="scss" scoped src="./post-distribution-button.scss"></style>
