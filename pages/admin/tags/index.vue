<template>
    <AdminTaxonomyPage :config="tagTaxonomyConfig" />
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import AdminTaxonomyPage from '@/components/admin/admin-taxonomy-page.vue'
import { tagBodySchema, tagUpdateSchema } from '@/utils/schemas/tag'
import { resolveTranslationClusterId } from '@/utils/shared/translation-cluster'
import type { Tag } from '@/types/tag'

definePageMeta({
    middleware: 'admin',
    layout: 'default',
})

const tagTaxonomyConfig = markRaw({
    endpoint: '/api/tags',
    titleKey: 'pages.admin.tags.title',
    createKey: 'pages.admin.tags.create',
    searchPlaceholderKey: 'pages.admin.tags.search_placeholder',
    deleteConfirmTitleKey: 'pages.admin.tags.delete_confirm_title',
    deleteConfirmKey: 'pages.admin.tags.delete_confirm',
    saveSuccessKey: 'pages.admin.tags.save_success',
    deleteSuccessKey: 'pages.admin.tags.delete_success',
    syncToAllLanguagesKey: 'pages.admin.tags.sync_to_all_languages',
    createSchema: tagBodySchema,
    updateSchema: tagUpdateSchema,
    buildEmptyForm: (lang: string) => ({
        id: null,
        name: '',
        slug: '',
        language: lang,
        translationId: null,
    }),
    buildFormFromItem: (item: Tag) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        language: item.language,
        translationId: resolveTranslationClusterId(item.translationId, item.slug),
    }),
    buildMissingTranslationDraft: (item: Tag, langCode: string) => ({
        id: null,
        name: '',
        slug: item.slug,
        language: langCode,
        translationId: resolveTranslationClusterId(item.translationId, item.slug, item.id),
    }),
})
</script>
