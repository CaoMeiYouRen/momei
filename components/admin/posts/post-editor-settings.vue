<template>
    <div
        class="settings-sidebar"
        :class="{
            'settings-sidebar--visible': visible,
            'settings-sidebar--compact': isCompact
        }"
    >
        <div class="settings-sidebar__header">
            <h3 class="settings-sidebar__title">
                {{ $t('pages.admin.posts.settings_title') }}
            </h3>
            <div class="settings-sidebar__actions">
                <AppTooltip :content="isCompact ? $t('common.expand') : $t('common.collapse')">
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        tone="neutral"
                        rounded
                        :label="isCompact ? $t('common.expand') : $t('common.collapse')"
                        @click="isCompact = !isCompact"
                    >
                        <template #icon>
                            <component :is="isCompact ? ChevronLeft : ChevronRight" :size="16" />
                        </template>
                    </CaomeiButton>
                </AppTooltip>
                <CaomeiButton
                    icon-only
                    variant="ghost"
                    tone="neutral"
                    rounded
                    :label="$t('common.close')"
                    @click="visible = false"
                >
                    <template #icon>
                        <X :size="16" />
                    </template>
                </CaomeiButton>
            </div>
        </div>
        <div class="settings-form">
            <div class="form-group">
                <label for="language" class="form-label">{{ $t('pages.admin.posts.language') }}</label>
                <CaomeiSelect
                    id="language"
                    v-model="post.language"
                    :options="languageOptions"
                    option-label="label"
                    option-value="value"
                />
            </div>

            <div class="form-group">
                <label for="translationId" class="form-label">
                    {{ $t('pages.admin.posts.translation_group') }}
                    <small class="text-secondary">({{ $t('common.optional') }})</small>
                </label>
                <CaomeiInputGroup>
                    <CaomeiAutoComplete
                        id="translationId"
                        :model-value="post.translationId ?? undefined"
                        :options="postsForTranslation"
                        :placeholder="$t('pages.admin.posts.translation_group_hint')"
                        dropdown
                        @update:model-value="onTranslationIdChange"
                        @complete="(query: string) => emit('search-posts', {query})"
                    />
                </CaomeiInputGroup>
            </div>

            <div class="form-group">
                <label for="slug" class="form-label">{{ $t('pages.admin.posts.slug') }}</label>
                <CaomeiInputGroup>
                    <CaomeiInput
                        id="slug"
                        v-model="post.slug"
                        :invalid="Boolean(errors.slug)"
                    />
                    <AppTooltip :content="$t('pages.admin.posts.ai.generate_slug')">
                        <CaomeiButton
                            id="ai-slug-btn"
                            icon-only
                            variant="ghost"
                            tone="neutral"
                            :label="$t('pages.admin.posts.ai.generate_slug')"
                            :loading="aiLoading.slug"
                            @click="emit('suggest-slug')"
                        >
                            <template #icon>
                                <Sparkles :size="14" />
                            </template>
                        </CaomeiButton>
                    </AppTooltip>
                </CaomeiInputGroup>
                <small v-if="errors.slug" class="form-error">{{ errors.slug }}</small>
                <small v-else class="form-hint">{{ $t('pages.admin.posts.slug_hint') }}</small>
            </div>

            <div class="form-group">
                <label for="category" class="form-label">{{ $t('common.category') }}</label>
                <CaomeiSelect
                    :model-value="post.categoryId"
                    :options="categories"
                    option-label="name"
                    option-value="id"
                    :placeholder="$t('pages.admin.posts.category_placeholder')"
                    show-clear
                    @update:model-value="post.categoryId = typeof $event === 'string' ? $event : null"
                />
            </div>

            <div class="form-group">
                <div class="flex items-center justify-between mb-2">
                    <label for="tags" class="form-label mb-0">{{ $t('common.tags') }}</label>
                    <div class="settings-sidebar__tag-actions">
                        <AppTooltip v-if="post.tags?.length" :content="$t('pages.admin.posts.clear_tags')">
                            <CaomeiButton
                                id="clear-tags-btn"
                                icon-only
                                variant="ghost"
                                tone="danger"
                                size="sm"
                                rounded
                                :label="$t('pages.admin.posts.clear_tags')"
                                @click="confirmClearTags"
                            >
                                <template #icon>
                                    <Trash2 :size="14" />
                                </template>
                            </CaomeiButton>
                        </AppTooltip>
                        <AppTooltip :content="$t('pages.admin.posts.ai.recommend_tags')">
                            <CaomeiButton
                                id="ai-tags-btn"
                                icon-only
                                variant="ghost"
                                tone="neutral"
                                size="sm"
                                rounded
                                :label="$t('pages.admin.posts.ai.recommend_tags')"
                                :loading="aiLoading.tags"
                                @click="emit('recommend-tags')"
                            >
                                <template #icon>
                                    <Sparkles :size="14" />
                                </template>
                            </CaomeiButton>
                        </AppTooltip>
                    </div>
                </div>
                <CaomeiTagsInput
                    id="tags"
                    :model-value="tagModel"
                    :placeholder="$t('pages.admin.posts.tags_placeholder')"
                    @update:model-value="onTagModelUpdate"
                />
                <small class="form-hint">{{ $t('pages.admin.posts.tags_hint') }}</small>
            </div>

            <div class="form-group">
                <label for="copyright" class="form-label">{{ $t('pages.admin.posts.copyright') }}</label>
                <CaomeiSelect
                    id="copyright"
                    :model-value="post.copyright"
                    :options="licenseOptions"
                    option-label="label"
                    option-value="value"
                    :placeholder="defaultLicenseLabel"
                    show-clear
                    @update:model-value="post.copyright = typeof $event === 'string' ? $event : null"
                />
                <small class="form-hint">{{ $t('pages.admin.posts.copyright_hint') }}</small>
            </div>

            <div class="form-group">
                <label for="visibility" class="form-label">{{ $t('pages.admin.posts.visibility') }}</label>
                <CaomeiSelect
                    id="visibility"
                    :model-value="post.visibility"
                    :options="visibilityOptions"
                    option-label="label"
                    option-value="value"
                    @update:model-value="onVisibilityChange"
                />
                <small class="form-hint">{{ $t('pages.admin.posts.visibility_hint') }}</small>
            </div>

            <div class="form-group">
                <div class="settings-sidebar__toggle-row">
                    <div class="settings-sidebar__toggle-copy">
                        <label for="isPinned" class="form-label">{{ $t('pages.admin.posts.pinned') }}</label>
                        <small class="form-hint">{{ $t('pages.admin.posts.pinned_hint') }}</small>
                    </div>
                    <div class="settings-sidebar__toggle-control">
                        <CaomeiSwitch
                            id="isPinned"
                            v-model="post.isPinned"
                        />
                    </div>
                </div>
            </div>

            <div v-if="post.visibility === 'password'" class="form-group">
                <label for="password" class="form-label">{{ $t('pages.admin.posts.password') }}</label>
                <CaomeiInput
                    id="password"
                    :model-value="post.password ?? ''"
                    :placeholder="$t('pages.admin.posts.password_placeholder')"
                    @update:model-value="post.password = $event ?? null"
                />
            </div>

            <div class="form-group">
                <div class="flex items-center justify-between mb-2">
                    <label for="summary" class="form-label mb-0">{{ $t('common.summary') }}</label>
                    <AppTooltip :content="$t('pages.admin.posts.ai.generate_summary')">
                        <CaomeiButton
                            id="ai-summary-btn"
                            icon-only
                            variant="ghost"
                            tone="neutral"
                            size="sm"
                            rounded
                            :label="$t('pages.admin.posts.ai.generate_summary')"
                            :loading="aiLoading.summary"
                            @click="emit('suggest-summary')"
                        >
                            <template #icon>
                                <Sparkles :size="14" />
                            </template>
                        </CaomeiButton>
                    </AppTooltip>
                </div>
                <CaomeiTextarea
                    id="summary"
                    :model-value="post.summary ?? ''"
                    :rows="4"
                    :placeholder="$t('pages.admin.posts.summary_placeholder')"
                    resize="none"
                    :invalid="Boolean(errors.summary)"
                    @update:model-value="post.summary = $event ?? null"
                />
                <small v-if="errors.summary" class="form-error">{{ errors.summary }}</small>
            </div>

            <AdminPostsPostEditorMediaSettings v-model:post="post" />

            <CaomeiDivider />

            <div class="form-group">
                <CaomeiButton
                    block
                    variant="secondary"
                    tone="neutral"
                    :loading="exporting"
                    :disabled="!post.id"
                    @click="handleExport"
                >
                    <template #icon>
                        <Download :size="16" />
                    </template>
                    {{ $t('pages.admin.posts.export_as_markdown') }}
                </CaomeiButton>
            </div>
        </div>
        <div class="drawer-footer">
            <CaomeiButton
                variant="ghost"
                tone="neutral"
                @click="visible = false"
            >
                {{ $t('common.close') }}
            </CaomeiButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Download, Sparkles, Trash2, X } from '@lucide/vue'
import { useConfirm } from 'caomei-ui'
import { usePostExport } from '@/composables/use-post-export'
import type { PostEditorData } from '@/types/post-editor'

const post = defineModel<PostEditorData>('post', { required: true })

const props = defineProps<{
    errors: Record<string, string>
    categories: any[]
    aiLoading: any
    postsForTranslation: any[]
    languageOptions: any[]
    licenseOptions: any[]
    visibilityOptions: any[]
    defaultLicenseLabel: string
}>()

const emit = defineEmits(['search-posts', 'suggest-slug', 'recommend-tags', 'suggest-summary'])

const visible = defineModel<boolean>('visible', { default: false })
const isCompact = defineModel<boolean>('compact', { default: false })

const confirm = useConfirm()
const { exporting, exportPost } = usePostExport()
const { t } = useI18n()

const tagModel = computed(() => post.value.tags ?? [])

const onTagModelUpdate = (value: string[] | undefined) => {
    post.value.tags = Array.isArray(value) ? value : []
}

const onTranslationIdChange = (value: string | string[] | undefined) => {
    /* caomei `AutoComplete` 的清除按钮写空串（PrimeVue 写 null）。`translationId` 是
     * 「翻译簇键」参与 `IS NULL` / 相等匹配，空串会被当成合法簇键把所有清空过的文章串到一起，
     * 故必须归一为 null。 */
    const normalized = typeof value === 'string' ? value.trim() : ''
    post.value.translationId = normalized === '' ? null : normalized
}

const onVisibilityChange = (value: string | number | null | undefined) => {
    if (typeof value === 'string') {
        post.value.visibility = value as typeof post.value.visibility
    }
}

const handleExport = () => {
    if (!post.value.id) {
        return
    }

    exportPost(post.value.id, { slug: post.value.slug })
}

const confirmClearTags = () => {
    if (!post.value.tags.length) {
        return
    }

    void confirm.confirm({
        title: t('pages.admin.posts.clear_tags_confirm_title'),
        description: t('pages.admin.posts.clear_tags_confirm_message'),
        confirmLabel: t('common.delete'),
        cancelLabel: t('common.cancel'),
        tone: 'danger',
    }).then((confirmed) => {
        if (confirmed) {
            post.value.tags = []
        }
    })
}
</script>

<style lang="scss" scoped>
@use "@/styles/admin-form" as *;

.settings-sidebar {
    position: fixed;
    top: 4rem;
    right: -24rem;
    width: 20rem;
    height: calc(100vh - 4rem);
    background-color: var(--caomei-color-bg);
    display: flex;
    flex-direction: column;
    z-index: 100;
    transition: all 0.3s ease;
    box-shadow: -2px 0 8px rgb(0 0 0 / 0.05);

    &--visible {
        right: 0;
    }

    &--compact {
        width: 14rem;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
    }

    &__actions {
        display: flex;
        gap: 0.25rem;
    }

    &__tag-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    &__toggle-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
        gap: 1rem;
    }

    &__toggle-copy {
        min-width: 0;
    }

    &__toggle-control {
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        flex-shrink: 0;
        padding-top: 0.125rem;
    }

    &__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

.settings-form {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;

    .settings-sidebar--compact & {
        padding: 1rem 0.75rem;
        gap: 1rem;
    }

    .settings-sidebar--compact .settings-sidebar__toggle-row {
        grid-template-columns: 1fr;
        gap: 0.625rem;
    }

    .settings-sidebar--compact .settings-sidebar__toggle-control {
        justify-content: flex-start;
        padding-top: 0;
    }
}

.form-group {
    @include admin-form-stack(0.375rem);
}

.form-label {
    @include admin-form-label($weight: 500, $size: null, $margin-bottom: 0);
}

.form-hint {
    @include admin-form-hint($color: var(--m-surface-500));

    display: block;
}

.drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

.resize-none {
    resize: none;
}

</style>
