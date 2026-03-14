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
                <Button
                    v-tooltip="isCompact ? $t('common.expand') : $t('common.collapse')"
                    :icon="isCompact ? 'pi pi-chevron-left' : 'pi pi-chevron-right'"
                    text
                    rounded
                    severity="secondary"
                    @click="isCompact = !isCompact"
                />
                <Button
                    icon="pi pi-times"
                    text
                    rounded
                    severity="secondary"
                    @click="visible = false"
                />
            </div>
        </div>
        <div class="settings-form">
            <div class="form-group">
                <label for="language" class="form-label">{{ $t('pages.admin.posts.language') }}</label>
                <Select
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
                <InputGroup>
                    <AutoComplete
                        id="translationId"
                        v-model="post.translationId"
                        :suggestions="postsForTranslation"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.posts.translation_group_hint')"
                        dropdown
                        fluid
                        @complete="emit('search-posts', $event)"
                    />
                </InputGroup>
            </div>

            <div class="form-group">
                <label for="slug" class="form-label">{{ $t('pages.admin.posts.slug') }}</label>
                <InputGroup>
                    <InputText
                        id="slug"
                        v-model="post.slug"
                        :class="{'p-invalid': errors.slug}"
                    />
                    <Button
                        id="ai-slug-btn"
                        v-tooltip="$t('pages.admin.posts.ai.generate_slug')"
                        icon="pi pi-sparkles"
                        severity="secondary"
                        text
                        :loading="aiLoading.slug"
                        @click="emit('suggest-slug')"
                    />
                </InputGroup>
                <small v-if="errors.slug" class="p-error">{{ errors.slug }}</small>
                <small v-else class="form-hint">{{ $t('pages.admin.posts.slug_hint') }}</small>
            </div>

            <div class="form-group">
                <label for="category" class="form-label">{{ $t('common.category') }}</label>
                <Select
                    v-model="post.categoryId"
                    :options="categories"
                    option-label="name"
                    option-value="id"
                    :placeholder="$t('pages.admin.posts.category_placeholder')"
                    show-clear
                />
            </div>

            <div class="form-group">
                <div class="flex items-center justify-between mb-2">
                    <label for="tags" class="form-label mb-0">{{ $t('common.tags') }}</label>
                    <div class="settings-sidebar__tag-actions">
                        <Button
                            v-if="post.tags?.length"
                            id="clear-tags-btn"
                            v-tooltip="$t('pages.admin.posts.clear_tags')"
                            icon="pi pi-trash"
                            size="small"
                            text
                            rounded
                            severity="danger"
                            @click="confirmClearTags"
                        />
                        <Button
                            id="ai-tags-btn"
                            v-tooltip="$t('pages.admin.posts.ai.recommend_tags')"
                            icon="pi pi-sparkles"
                            size="small"
                            text
                            rounded
                            :loading="aiLoading.tags"
                            @click="emit('recommend-tags')"
                        />
                    </div>
                </div>
                <AutoComplete
                    v-model="post.tags"
                    multiple
                    :suggestions="filteredTags"
                    :placeholder="$t('pages.admin.posts.tags_placeholder')"
                    @complete="emit('search-tags', $event)"
                />
                <small class="form-hint">{{ $t('pages.admin.posts.tags_hint') }}</small>
            </div>

            <div class="form-group">
                <label for="copyright" class="form-label">{{ $t('pages.admin.posts.copyright') }}</label>
                <Select
                    id="copyright"
                    v-model="post.copyright"
                    :options="licenseOptions"
                    option-label="label"
                    option-value="value"
                    :placeholder="defaultLicenseLabel"
                    show-clear
                />
                <small class="form-hint">{{ $t('pages.admin.posts.copyright_hint') }}</small>
            </div>

            <div class="form-group">
                <label for="visibility" class="form-label">{{ $t('pages.admin.posts.visibility') }}</label>
                <Select
                    id="visibility"
                    v-model="post.visibility"
                    :options="visibilityOptions"
                    option-label="label"
                    option-value="value"
                />
                <small class="form-hint">{{ $t('pages.admin.posts.visibility_hint') }}</small>
            </div>

            <div class="form-group">
                <div class="settings-sidebar__toggle-row">
                    <div>
                        <label for="isPinned" class="form-label">{{ $t('pages.admin.posts.pinned') }}</label>
                        <small class="form-hint">{{ $t('pages.admin.posts.pinned_hint') }}</small>
                    </div>
                    <ToggleSwitch
                        v-model="post.isPinned"
                        input-id="isPinned"
                    />
                </div>
            </div>

            <div v-if="post.visibility === 'password'" class="form-group">
                <label for="password" class="form-label">{{ $t('pages.admin.posts.password') }}</label>
                <InputText
                    id="password"
                    v-model="post.password"
                    :placeholder="$t('pages.admin.posts.password_placeholder')"
                />
            </div>

            <div class="form-group">
                <div class="flex items-center justify-between mb-2">
                    <label for="summary" class="form-label mb-0">{{ $t('common.summary') }}</label>
                    <Button
                        id="ai-summary-btn"
                        v-tooltip="$t('pages.admin.posts.ai.generate_summary')"
                        icon="pi pi-sparkles"
                        size="small"
                        text
                        rounded
                        :loading="aiLoading.summary"
                        @click="emit('suggest-summary')"
                    />
                </div>
                <Textarea
                    id="summary"
                    v-model="post.summary"
                    rows="4"
                    :placeholder="$t('pages.admin.posts.summary_placeholder')"
                    class="resize-none"
                    :class="{'p-invalid': errors.summary}"
                />
                <small v-if="errors.summary" class="p-error">{{ errors.summary }}</small>
            </div>

            <AdminPostsPostEditorMediaSettings v-model:post="post" />

            <Divider />

            <div class="form-group">
                <Button
                    :label="$t('pages.admin.posts.export_as_markdown')"
                    icon="pi pi-download"
                    severity="secondary"
                    outlined
                    fluid
                    :loading="exporting"
                    :disabled="!post.id"
                    @click="handleExport"
                />
            </div>
        </div>
        <div class="drawer-footer">
            <Button
                :label="$t('common.close')"
                text
                severity="secondary"
                @click="visible = false"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm'
import { usePostExport } from '@/composables/use-post-export'
import type { PostEditorData } from '@/types/post-editor'

const post = defineModel<PostEditorData>('post', { required: true })

const props = defineProps<{
    errors: Record<string, string>
    categories: any[]
    filteredTags: string[]
    aiLoading: any
    postsForTranslation: any[]
    languageOptions: any[]
    licenseOptions: any[]
    visibilityOptions: any[]
    defaultLicenseLabel: string
}>()

const emit = defineEmits(['search-posts', 'suggest-slug', 'recommend-tags', 'search-tags', 'suggest-summary'])

const visible = defineModel<boolean>('visible', { default: false })
const isCompact = defineModel<boolean>('compact', { default: false })

const confirm = useConfirm()
const { exporting, exportPost } = usePostExport()
const { t } = useI18n()

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

    confirm.require({
        message: t('pages.admin.posts.clear_tags_confirm_message'),
        header: t('pages.admin.posts.clear_tags_confirm_title'),
        icon: 'pi pi-exclamation-triangle',
        acceptProps: {
            label: t('common.delete'),
            severity: 'danger',
        },
        rejectProps: {
            label: t('common.cancel'),
            severity: 'secondary',
            text: true,
        },
        accept: () => {
            post.value.tags = []
        },
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
    background-color: var(--p-surface-card);
    border-left: 1px solid var(--p-surface-border);
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
        border-bottom: 1px solid var(--p-surface-border);
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
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
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
}

.form-group {
    @include admin-form-stack(0.375rem);
}

.form-label {
    @include admin-form-label($weight: 500, $size: null, $margin-bottom: 0);
}

.form-hint {
    @include admin-form-hint($color: var(--p-surface-500));
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
