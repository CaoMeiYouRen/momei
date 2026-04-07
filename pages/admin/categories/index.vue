<template>
    <AdminTaxonomyPage :config="categoryTaxonomyConfig" />
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import AdminTaxonomyPage from '@/components/admin/admin-taxonomy-page.vue'
import { categoryBodySchema, categoryUpdateSchema } from '@/utils/schemas/category'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'
import type { Category } from '@/types/category'

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const categoryTaxonomyConfig = markRaw({
    endpoint: '/api/categories',
    titleKey: 'pages.admin.categories.title',
    createKey: 'pages.admin.categories.create',
    searchPlaceholderKey: 'pages.admin.categories.search_placeholder',
    deleteConfirmTitleKey: 'pages.admin.categories.delete_confirm_title',
    deleteConfirmKey: 'pages.admin.categories.delete_confirm',
    saveSuccessKey: 'pages.admin.categories.save_success',
    deleteSuccessKey: 'pages.admin.categories.delete_success',
    syncToAllLanguagesKey: 'pages.admin.categories.sync_to_all_languages',
    createSchema: categoryBodySchema,
    updateSchema: categoryUpdateSchema,
    showParentField: true,
    showDescriptionField: true,
    buildEmptyForm: (lang: string) => ({
        id: null,
        name: '',
        slug: '',
        description: '',
        parentId: null,
        language: lang,
        translationId: null,
    }),
    buildFormFromItem: (item: Category) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description || '',
        parentId: item.parentId || null,
        language: item.language,
        translationId: resolveTranslationClusterId(item.translationId, item.slug),
    }),
    buildMissingTranslationDraft: (item: Category, langCode: string) => ({
        id: null,
        name: '',
        slug: item.slug,
        description: '',
        parentId: item.parentId || null,
        language: langCode,
        translationId: resolveTranslationClusterId(item.translationId, item.slug, item.id),
    }),
})
</script>
