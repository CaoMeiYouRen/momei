<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.posts.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('pages.admin.posts.create')"
                    icon="pi pi-plus"
                    @click="navigateTo(localePath('/admin/posts/new'))"
                />
            </template>
        </AdminPageHeader>

        <div class="admin-content-card">
            <div class="admin-filters">
                <IconField icon-position="left">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model="filters.search"
                        :placeholder="$t('pages.admin.posts.search_placeholder')"
                        @input="onFilterChange"
                    />
                </IconField>
                <div class="admin-filters__right">
                    <div class="aggregate-toggle">
                        <ToggleSwitch
                            v-model="filters.aggregate"
                            input-id="aggregate-switch"
                            @change="onFilterChange"
                        />
                        <label for="aggregate-switch" class="cursor-pointer">{{ $t('common.aggregate_translations') }}</label>
                    </div>
                    <Select
                        v-model="filters.status"
                        :options="statuses"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.admin.posts.status')"
                        show-clear
                        class="status-select"
                        @change="load"
                    />
                </div>
            </div>

            <DataTable
                :value="items"
                :loading="loading"
                lazy
                :total-records="pagination.total"
                :rows="pagination.limit"
                paginator
                :rows-per-page-options="[5, 10, 20]"
                table-style="min-width: 50rem"
                @page="onPage"
                @sort="onSort"
            >
                <Column
                    field="title"
                    :header="$t('common.title')"
                    sortable
                    header-style="min-width: 15rem"
                />
                <Column
                    field="author.name"
                    :header="$t('common.author')"
                    class="hidden lg:table-cell"
                    header-style="min-width: 8rem"
                />
                <Column
                    field="status"
                    :header="$t('pages.admin.posts.status')"
                    sortable
                    class="hidden md:table-cell"
                    header-style="min-width: 7rem"
                >
                    <template #body="slotProps">
                        <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getStatusSeverity(slotProps.data.status)" />
                    </template>
                </Column>
                <Column
                    field="audioUrl"
                    :header="$t('pages.admin.posts.podcast_column')"
                    header-class="text-center"
                    body-class="text-center"
                    header-style="min-width: 5rem"
                >
                    <template #body="{data}">
                        <i v-if="data.audioUrl" class="pi pi-headphones text-primary" />
                    </template>
                </Column>
                <Column
                    field="translations"
                    :header="$t('common.translation_status')"
                    header-style="min-width: 8rem"
                    header-class="text-center"
                    body-class="text-center"
                >
                    <template #body="{data}">
                        <div class="justify-content-center translation-badges">
                            <Badge
                                v-for="lang in availableLocalesList"
                                :key="lang.code"
                                v-tooltip="$t('common.languages.' + lang.code)"
                                :value="lang.code.toUpperCase()"
                                :severity="hasTranslation(data, lang.code) ? 'success' : 'secondary'"
                                class="translation-badge"
                                :class="{'translation-badge--missing': !hasTranslation(data, lang.code)}"
                                @click="handleTranslationClick(data, lang.code)"
                            />
                        </div>
                    </template>
                </Column>
                <Column
                    field="category.name"
                    :header="$t('common.category')"
                    class="hidden sm:table-cell"
                    header-style="min-width: 8rem"
                />
                <Column
                    v-if="!filters.aggregate"
                    field="language"
                    :header="$t('common.language')"
                    sortable
                >
                    <template #body="{data}">
                        <Tag :value="$t(`common.languages.${data.language}`)" severity="secondary" />
                    </template>
                </Column>
                <Column
                    field="views"
                    :header="$t('common.views')"
                    sortable
                    style="width: 6rem"
                    header-class="text-center"
                    body-class="text-center"
                />
                <Column
                    field="publishedAt"
                    :header="$t('common.published_at')"
                    sortable
                    header-style="min-width: 9rem"
                >
                    <template #body="slotProps">
                        <div class="user-created-at">
                            <span class="user-created-at__date">{{ formatDateTime(slotProps.data.publishedAt) }}</span>
                            <small v-if="slotProps.data.publishedAt" class="user-created-at__relative">{{ relativeTime(slotProps.data.publishedAt) }}</small>
                        </div>
                    </template>
                </Column>
                <Column
                    :header="$t('common.actions')"
                    :exportable="false"
                    style="min-width:8rem"
                >
                    <template #body="slotProps">
                        <Button
                            icon="pi pi-pencil"
                            text
                            rounded
                            severity="info"
                            @click="editPost(slotProps.data.id)"
                        />
                        <Button
                            icon="pi pi-trash"
                            text
                            rounded
                            severity="danger"
                            @click="confirmDelete(slotProps.data)"
                        />
                    </template>
                </Column>
                <template #empty>
                    <div class="empty-state">
                        {{ $t('pages.posts.empty') }}
                    </div>
                </template>
            </DataTable>
        </div>

        <ConfirmDeleteDialog
            ref="deleteDialog"
            @confirm="handleDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Post } from '@/types/post'
import { useAdminList } from '@/composables/use-admin-list'
import { useI18nDate } from '@/composables/use-i18n-date'

definePageMeta({
    middleware: 'author',
    layout: 'default',
})

const { t } = useI18n()
const localePath = useLocalePath()
const { formatDateTime, relativeTime } = useI18nDate()

const {
    items,
    loading,
    pagination,
    filters,
    onPage,
    onSort,
    onFilterChange,
    refresh: load,
} = useAdminList<Post, { search: string, status: string | null, aggregate: boolean }>({
    url: '/api/posts',
    initialFilters: {
        search: '',
        status: null,
        aggregate: true, // 默认开启聚合
    },
    initialSort: {
        field: 'publishedAt',
        order: 'desc',
    },
})

const { locales } = useI18n()
const availableLocalesList = computed(() => locales.value as { code: string, name: string }[])

const hasTranslation = (post: Post, lang: string) => {
    return post.translations?.some((t) => t.language === lang)
}

const isTranslationPublished = (post: Post, lang: string) => {
    return post.translations?.some((t) => t.language === lang && t.status === 'published')
}

const handleTranslationClick = (post: Post, lang: string) => {
    const translation = post.translations?.find((t) => t.language === lang)
    if (translation) {
        editPost(translation.id)
    } else {
        // 创建新翻译
        navigateTo({
            path: localePath('/admin/posts/new'),
            query: {
                translationId: post.translationId || post.id,
                language: lang,
            },
        })
    }
}

const statuses = computed(() => [
    { label: t('common.status.published'), value: 'published' },
    { label: t('common.status.draft'), value: 'draft' },
    { label: t('common.status.pending'), value: 'pending' },
    { label: t('common.status.rejected'), value: 'rejected' },
    { label: t('common.status.hidden'), value: 'hidden' },
])

const editPost = (id: string) => {
    navigateTo(localePath(`/admin/posts/${id}`))
}

const deleteDialog = ref()
const postToDelete = ref<Post | null>(null)

const confirmDelete = (post: Post) => {
    postToDelete.value = post
    deleteDialog.value.open()
}

const handleDelete = async () => {
    if (!postToDelete.value) return

    deleteDialog.value.setLoading(true)
    try {
        await $fetch(`/api/posts/${postToDelete.value.id}`, { method: 'DELETE' as any })
        deleteDialog.value.close()
        load()
    } catch (error) {
        console.error('Failed to delete post:', error)
    } finally {
        deleteDialog.value.setLoading(false)
    }
}

const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        published: t('common.status.published'),
        draft: t('common.status.draft'),
        pending: t('common.status.pending'),
        rejected: t('common.status.rejected'),
        hidden: t('common.status.hidden'),
    }
    return map[status] || status
}

const getStatusSeverity = (status: string) => {
    const map: Record<string, string | undefined> = {
        published: 'success',
        draft: 'secondary',
        pending: 'warn',
        rejected: 'danger',
        hidden: 'info',
    }
    return map[status] || 'info'
}
</script>

<style lang="scss" scoped>
.status-select {
    width: 10rem;
}

.empty-state {
    text-align: center;
    padding: 1rem;
}

.user-created-at {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &__relative {
        color: var(--p-text-muted-color);
        font-size: 0.75rem;
    }
}

.translation-badges {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;

    &.justify-content-center {
        justify-content: center;
    }
}

.translation-badge {
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.8;
    }

    &--missing {
        filter: grayscale(1) opacity(0.5);
    }
}
</style>
