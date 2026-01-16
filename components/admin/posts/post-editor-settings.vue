<template>
    <Drawer
        v-model:visible="visible"
        :header="$t('pages.admin.posts.settings_title')"
        position="right"
        class="settings-drawer"
    >
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
                    <Button
                        v-tooltip="$t('pages.admin.posts.ai.recommend_tags')"
                        icon="pi pi-sparkles"
                        size="small"
                        text
                        rounded
                        :loading="aiLoading.tags"
                        @click="emit('recommend-tags')"
                    />
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
                <div class="flex items-center justify-between mb-2">
                    <label for="summary" class="form-label mb-0">{{ $t('common.summary') }}</label>
                    <Button
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

            <div class="form-group">
                <label for="cover" class="form-label">{{ $t('pages.admin.posts.cover_image') }}</label>
                <InputText
                    id="cover"
                    v-model="post.coverImage"
                    placeholder="https://..."
                />
            </div>
        </div>
        <template #footer>
            <div class="drawer-footer">
                <Button
                    :label="$t('common.close')"
                    text
                    severity="secondary"
                    @click="visible = false"
                />
            </div>
        </template>
    </Drawer>
</template>

<script setup lang="ts">
const post = defineModel<any>('post', { required: true })

const props = defineProps<{
    errors: Record<string, string>
    categories: any[]
    filteredTags: string[]
    aiLoading: any
    postsForTranslation: any[]
    languageOptions: any[]
    licenseOptions: any[]
    defaultLicenseLabel: string
}>()

const emit = defineEmits(['search-posts', 'suggest-slug', 'recommend-tags', 'search-tags', 'suggest-summary'])

const visible = defineModel<boolean>('visible', { default: false })
</script>

<style lang="scss" scoped>
.settings-drawer {
    width: 24rem;
}

.settings-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-weight: 500;
}

.form-hint {
    color: var(--p-surface-500);
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
