<template>
    <div class="wechatsync-button">
        <Button
            v-if="!isNew"
            v-tooltip="$t('pages.admin.posts.wechatsync.tooltip')"
            icon="pi pi-sync"
            text
            rounded
            @click="openSyncDialog"
        />

        <Dialog
            v-model:visible="dialogVisible"
            modal
            class="wechatsync-dialog"
            :header="$t('pages.admin.posts.wechatsync.dialog_title')"
            :style="{width: '500px'}"
        >
            <div class="wechatsync-dialog__content">
                <!-- Article Preview -->
                <div class="wechatsync-dialog__article-preview">
                    <div v-if="post.coverImage" class="wechatsync-dialog__article-thumb-wrapper">
                        <img
                            :src="post.coverImage"
                            class="wechatsync-dialog__article-thumb"
                            referrerpolicy="no-referrer"
                        >
                    </div>
                    <div class="wechatsync-dialog__article-info">
                        <h5 class="wechatsync-dialog__article-title">
                            {{ post.title }}
                        </h5>
                        <p class="wechatsync-dialog__article-desc">
                            {{ post.summary || post.content.substring(0, 100).replace(/[#*`]/g, "") }}
                        </p>
                    </div>
                </div>

                <!-- Extension Detection -->
                <div v-if="!extensionInstalled" class="wechatsync-dialog__not-installed">
                    <div v-if="checkCount >= 3" class="wechatsync-dialog__error-content">
                        <i class="pi pi-exclamation-triangle wechatsync-dialog__error-icon" />
                        <p>{{ $t("pages.admin.posts.wechatsync.extension_not_found") }}</p>
                        <small>{{ $t("pages.admin.posts.wechatsync.extension_help") }}</small>
                        <a
                            href="https://www.wechatsync.com/?utm_source=momei"
                            target="_blank"
                            class="wechatsync-dialog__install-link"
                        >
                            {{ $t("pages.admin.posts.wechatsync.install_link") }}
                        </a>
                    </div>
                    <div v-else class="wechatsync-dialog__detecting">
                        <ProgressSpinner style="width: 30px; height: 30px" />
                    </div>
                </div>

                <!-- Account Selection & Status -->
                <div v-else class="wechatsync-dialog__body">
                    <div v-if="!submitting" class="wechatsync-dialog__accounts-section">
                        <h6 class="wechatsync-dialog__section-title">
                            {{ $t("pages.admin.posts.wechatsync.accounts_title") }}
                        </h6>
                        <div v-if="allAccounts.length > 0" class="wechatsync-dialog__account-list">
                            <div
                                v-for="account in allAccounts"
                                :key="account.id"
                                class="wechatsync-dialog__account-item"
                            >
                                <Checkbox
                                    v-model="account.checked"
                                    :input-id="'ac-' + account.id"
                                    binary
                                />
                                <label :for="'ac-' + account.id" class="wechatsync-dialog__account-label">
                                    <img
                                        v-if="account.icon"
                                        :src="account.icon"
                                        class="wechatsync-dialog__account-icon"
                                    >
                                    <span class="wechatsync-dialog__account-name">{{ account.title }}</span>
                                </label>
                            </div>
                        </div>
                        <div v-else class="wechatsync-dialog__empty-accounts">
                            {{ $t("pages.admin.posts.wechatsync.no_accounts") }}
                        </div>
                    </div>

                    <!-- Task Status -->
                    <div v-else class="wechatsync-dialog__status-section">
                        <div v-if="!taskStatus.accounts" class="wechatsync-dialog__waiting">
                            <ProgressSpinner style="width: 20px; height: 20px" stroke-width="4" />
                            <span>{{ $t("pages.admin.posts.wechatsync.prepare_sync") }}</span>
                        </div>
                        <div class="wechatsync-dialog__task-list">
                            <div
                                v-for="account in taskStatus.accounts"
                                :key="account.title"
                                class="wechatsync-dialog__task-item"
                            >
                                <div class="wechatsync-dialog__task-account">
                                    <img
                                        v-if="account.icon"
                                        :src="account.icon"
                                        class="wechatsync-dialog__task-icon"
                                    >
                                    <span class="wechatsync-dialog__task-name">{{ account.title }}</span>
                                </div>
                                <div class="wechatsync-dialog__task-result">
                                    <template v-if="account.status === 'uploading'">
                                        <i class="pi pi-spin pi-spinner wechatsync-dialog__status-icon" />
                                        <span class="wechatsync-dialog__status-text wechatsync-dialog__status-text--uploading">
                                            {{ account.msg || $t("pages.admin.posts.wechatsync.syncing") }}
                                        </span>
                                    </template>
                                    <template v-else-if="account.status === 'done'">
                                        <i class="pi pi-check-circle wechatsync-dialog__status-icon wechatsync-dialog__status-icon--done" />
                                        <span class="wechatsync-dialog__status-text">
                                            {{ $t("pages.admin.posts.wechatsync.sync_done") }}
                                        </span>
                                        <a
                                            v-if="account.editResp && account.editResp.draftLink"
                                            :href="account.editResp.draftLink"
                                            target="_blank"
                                            class="wechatsync-dialog__draft-link"
                                        >
                                            {{ $t("pages.admin.posts.wechatsync.draft_link") }}
                                        </a>
                                    </template>
                                    <template v-else-if="account.status === 'failed'">
                                        <i class="pi pi-times-circle wechatsync-dialog__status-icon wechatsync-dialog__status-icon--failed" />
                                        <span class="wechatsync-dialog__status-text wechatsync-dialog__status-text--failed" :title="account.error">
                                            {{ $t("pages.admin.posts.wechatsync.sync_failed") }}
                                        </span>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="wechatsync-dialog__footer">
                    <Button
                        v-if="submitting"
                        :label="$t('common.close')"
                        severity="secondary"
                        text
                        @click="closeDialog"
                    />
                    <template v-else>
                        <Button
                            :label="$t('common.cancel')"
                            severity="secondary"
                            text
                            @click="dialogVisible = false"
                        />
                        <Button
                            v-if="extensionInstalled && allAccounts.length > 0"
                            :label="$t('pages.admin.posts.wechatsync.sync_now')"
                            severity="contrast"
                            @click="doSubmit"
                        />
                    </template>
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useIntervalFn, useTimeoutFn } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import type { Post } from '@/types/post'
import { createMarkdownRenderer } from '@/utils/shared/markdown'

const props = defineProps<{
    post: Post
    isNew: boolean
}>()

const { t } = useI18n()
const toast = useToast()

const dialogVisible = ref(false)
const submitting = ref(false)
const extensionInstalled = ref(false)
const checkCount = ref(0)
const allAccounts = ref<any[]>([])
const taskStatus = ref<any>({})

const { pause, resume } = useIntervalFn(() => {
    // @ts-ignore
    const syncer = window.$syncer
    extensionInstalled.value = typeof syncer !== 'undefined'
    checkCount.value++

    if (extensionInstalled.value) {
        loadAccounts()
        pause()
        return
    }

    if (checkCount.value >= 15) {
        pause()
    }
}, 800, { immediate: false })

onMounted(() => {
    resume()
})

const openSyncDialog = () => {
    if (!extensionInstalled.value) {
        toast.add({
            severity: 'warn',
            summary: t('pages.admin.posts.wechatsync.extension_not_found'),
            detail: t('pages.admin.posts.wechatsync.extension_help'),
            life: 5000,
        })
        checkCount.value = 0
        resume()
    }
    dialogVisible.value = true
}

const loadAccounts = () => {
    // @ts-ignore
    if (window.$syncer && window.$syncer.getAccounts) {
        // @ts-ignore
        window.$syncer.getAccounts((resp: any[]) => {
            console.info('[WechatSync] accounts loaded', resp)
            // Initialize checked status
            allAccounts.value = resp.map((a) => ({ ...a, checked: false }))
        })
    }
}

const doSubmit = () => {
    const selectedAc = allAccounts.value.filter((a) => a.checked)
    if (selectedAc.length === 0) {
        toast.add({
            severity: 'warn',
            summary: t('common.warn'),
            detail: t('pages.admin.posts.wechatsync.accounts_title'),
            life: 3000,
        })
        return
    }

    submitting.value = true
    taskStatus.value = {}

    const md = createMarkdownRenderer({
        html: true,
        withAnchor: true,
    })

    const renderedContent = md.render(props.post.content || '')

    const postToSync = {
        title: props.post.title,
        markdown: props.post.content, // markdown 格式
        content: renderedContent, // HTML 格式，供部分平台使用
        // desc for some platforms
        desc: props.post.summary || props.post.content.substring(0, 100).replace(/[#*`]/g, ''),
        cover: props.post.coverImage || '',
    }

    // @ts-ignore
    if (window.$syncer && window.$syncer.addTask) {
        // @ts-ignore
        window.$syncer.addTask(
            {
                post: postToSync,
                accounts: selectedAc,
            },
            (status: any) => {
                taskStatus.value = status
            },
            () => {
                console.info('[WechatSync] task triggered')
            },
        )
    }
}

const { start: startCloseTimeout } = useTimeoutFn(() => {
    submitting.value = false
    taskStatus.value = {}
}, 300, { immediate: false })

const closeDialog = () => {
    dialogVisible.value = false
    // Reset state after a short delay to allow dialog animation
    startCloseTimeout()
}
</script>

<style lang="scss" scoped>
.wechatsync-dialog {
    &__content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    &__article-preview {
        display: flex;
        gap: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--p-surface-border);
    }

    &__article-thumb-wrapper {
        flex-shrink: 0;
        width: 120px;
        height: 80px;
        border-radius: var(--p-border-radius-sm);
        overflow: hidden;
        background: var(--p-surface-100);
    }

    &__article-thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &__article-info {
        flex: 1;
        min-width: 0;
    }

    &__article-title {
        font-weight: 700;
        font-size: 1rem;
        margin: 0 0 0.5rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__article-desc {
        font-size: 0.875rem;
        color: var(--p-text-muted-color);
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    &__not-installed {
        padding: 2rem 0;
        text-align: center;
    }

    &__error-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;

        p {
            font-weight: 600;
            margin: 0;
        }

        small {
            color: var(--p-text-muted-color);
        }
    }

    &__error-icon {
        font-size: 2rem;
        color: var(--p-orange-500);
        margin-bottom: 0.5rem;
    }

    &__install-link {
        margin-top: 1rem;
        color: var(--p-primary-500);
        text-decoration: none;
        font-weight: 600;

        &:hover {
            text-decoration: underline;
        }
    }

    &__body {
        min-height: 150px;
    }

    &__section-title {
        font-weight: 600;
        font-size: 0.9rem;
        margin: 0 0 1rem;
        color: var(--p-text-secondary-color);
    }

    &__account-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
    }

    &__account-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__account-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        flex: 1;
        min-width: 0;
    }

    &__account-icon {
        width: 18px;
        height: 18px;
        border-radius: 2px;
    }

    &__account-name {
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__status-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    &__waiting {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--p-text-muted-color);
        font-size: 0.9rem;
    }

    &__task-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    &__task-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.625rem 0.875rem;
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius-md);
    }

    &__task-account {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__task-icon {
        width: 20px;
        height: 20px;
    }

    &__task-name {
        font-weight: 500;
        font-size: 0.9rem;
    }

    &__task-result {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__status-icon {
        font-size: 1rem;

        &--done {
            color: var(--p-green-500);
        }

        &--failed {
            color: var(--p-red-500);
        }
    }

    &__status-text {
        font-size: 0.875rem;

        &--uploading {
            color: var(--p-primary-500);
        }

        &--failed {
            color: var(--p-red-500);
        }
    }

    &__draft-link {
        font-size: 0.75rem;
        color: var(--p-primary-500);
        text-decoration: none;
        font-weight: 600;
        margin-left: 0.25rem;

        &:hover {
            text-decoration: underline;
        }
    }

    &__footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        width: 100%;
    }
}

:global(.dark) {
    .wechatsync-dialog {
        &__task-item {
            background: var(--p-surface-800);
        }
    }
}
</style>
