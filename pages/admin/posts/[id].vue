<template>
    <div
        class="editor-layout"
        :class="{'drag-over': isDragging}"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
    >
        <!-- Top Bar -->
        <div class="top-bar">
            <div class="top-bar-left">
                <Button
                    v-tooltip="$t('pages.admin.posts.back_to_list')"
                    icon="pi pi-arrow-left"
                    text
                    rounded
                    @click="navigateTo(localePath('/admin/posts'))"
                />
                <InputText
                    v-model="post.title"
                    :placeholder="$t('pages.admin.posts.title_placeholder')"
                    class="title-input"
                    :class="{'p-invalid': errors.title}"
                />
                <Button
                    v-tooltip="$t('pages.admin.posts.ai.suggest_titles')"
                    icon="pi pi-sparkles"
                    text
                    rounded
                    :loading="aiLoading.title"
                    @click="suggestTitles"
                />
                <OverlayPanel ref="titleOp" class="title-suggestions-panel">
                    <ul class="suggestion-list">
                        <li
                            v-for="(suggestion, index) in titleSuggestions"
                            :key="index"
                            class="suggestion-item"
                            @click="selectTitle(suggestion)"
                        >
                            {{ suggestion }}
                        </li>
                    </ul>
                </OverlayPanel>
                <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
                <Tag
                    v-if="post.status"
                    :value="getStatusLabel(post.status)"
                    :severity="getStatusSeverity(post.status)"
                />
                <div class="ml-4 translation-status-bar">
                    <Badge
                        v-for="l in locales"
                        :key="l.code"
                        :value="l.code.toUpperCase()"
                        :severity="hasTranslation(l.code) ? 'success' : 'secondary'"
                        class="translation-badge"
                        :class="{
                            'translation-badge--active': post.language === l.code,
                            'translation-badge--missing': !hasTranslation(l.code)
                        }"
                        @click="handleTranslationClick(l.code)"
                    />
                </div>
            </div>
            <div class="top-bar-right">
                <span v-if="saving" class="saving-text">{{ $t('common.saving') }}</span>
                <Button
                    v-if="!isNew || post.id"
                    :label="$t('common.preview')"
                    icon="pi pi-external-link"
                    text
                    @click="handlePreview"
                />
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-save"
                    text
                    :loading="saving"
                    @click="savePost(false)"
                />
                <Button
                    :label="$t('common.publish')"
                    icon="pi pi-send"
                    :loading="saving"
                    severity="contrast"
                    @click="savePost(true)"
                />
                <Button
                    v-tooltip="$t('common.drag_drop_help')"
                    icon="pi pi-info-circle"
                    text
                    rounded
                    severity="secondary"
                />
                <Button
                    v-tooltip="$t('common.settings')"
                    icon="pi pi-cog"
                    text
                    rounded
                    @click="settingsVisible = true"
                />
            </div>
        </div>

        <!-- Editor Area -->
        <div class="editor-area" :class="{'editor-area--invalid': errors.content}">
            <ClientOnly>
                <mavon-editor
                    ref="md"
                    v-model="post.content"
                    class="mavon-editor"
                    :placeholder="$t('pages.admin.posts.content_placeholder')"
                    @img-add="imgAdd"
                />
            </ClientOnly>
            <div v-if="errors.content" class="editor-error-message">
                <small class="p-error">{{ errors.content }}</small>
            </div>
        </div>

        <!-- Settings Drawer -->
        <Drawer
            v-model:visible="settingsVisible"
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
                        {{ t('pages.admin.posts.translation_group') }}
                        <small class="text-secondary">({{ $t('common.optional') }})</small>
                    </label>
                    <InputGroup>
                        <AutoComplete
                            id="translationId"
                            v-model="post.translationId"
                            :suggestions="postsForTranslation"
                            option-label="label"
                            option-value="value"
                            :placeholder="t('pages.admin.posts.translation_group_hint')"
                            dropdown
                            fluid
                            @complete="searchPosts"
                        />
                        <Button
                            icon="pi pi-refresh"
                            severity="secondary"
                            text
                            @click="syncTranslationIdFromSlug"
                        />
                    </InputGroup>
                </div>

                <div class="form-group">
                    <label for="slug" class="form-label">{{ $t('pages.admin.posts.slug') }}</label>
                    <InputText
                        id="slug"
                        v-model="post.slug"
                        :class="{'p-invalid': errors.slug}"
                    />
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
                            @click="recommendTags"
                        />
                    </div>
                    <AutoComplete
                        v-model="selectedTags"
                        multiple
                        :suggestions="filteredTags"
                        :placeholder="$t('pages.admin.posts.tags_placeholder')"
                        @complete="searchTags"
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
                            @click="suggestSummary"
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
                        @click="settingsVisible = false"
                    />
                </div>
            </template>
        </Drawer>

        <!-- Drag Mask -->
        <div v-if="isDragging" class="drag-mask">
            <div class="drag-tip">
                <i class="pi pi-upload upload-icon" />
                <div class="upload-text">
                    {{ $t('common.drag_drop_tip') }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { load } from 'js-yaml'
import { createPostSchema, updatePostSchema } from '@/utils/schemas/post'
import { COPYRIGHT_LICENSES, type CopyrightType } from '@/types/copyright'

definePageMeta({
    layout: false,
})

const { t, locale, locales } = useI18n()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const { contentLanguage } = useAdminI18n()

const route = useRoute()
const router = useRouter()
const toast = useToast()

const md = ref<any>(null)

const languageOptions = computed(() => locales.value.map((l: any) => ({
    label: t(`common.languages.${l.code}`),
    value: l.code,
})))

const licenseOptions = computed(() => {
    return Object.keys(COPYRIGHT_LICENSES).map((key) => ({
        label: t(`components.post.copyright.licenses.${key}`),
        value: key,
    }))
})

const defaultLicenseLabel = computed(() => {
    const key = config.public.defaultCopyright || 'all-rights-reserved'
    return t(`components.post.copyright.licenses.${key}`)
})

interface Post {
    id?: string
    title: string
    content: string
    slug: string
    status: 'draft' | 'published' | 'pending' | 'rejected' | 'hidden'
    summary: string
    coverImage: string
    categoryId: string | null
    copyright: string | null
    tags: string[]
    language: string
    translationId: string | null
    // API response objects
    category?: any
    author?: any
}

const post = ref<Post>({
    title: '',
    content: '',
    slug: '',
    status: 'draft',
    summary: '',
    coverImage: '',
    categoryId: null,
    copyright: null,
    tags: [],
    language: (route.query.language as string) || contentLanguage.value || locale.value,
    translationId: (route.query.translationId as string) || null,
})

const translations = ref<any[]>([])

const hasTranslation = (langCode: string) => {
    if (post.value.language === langCode && !isNew.value) return post.value
    return translations.value.find((t) => t.language === langCode) || null
}

const handleTranslationClick = async (langCode: string) => {
    const trans = hasTranslation(langCode)
    if (trans && trans.id) {
        navigateTo(localePath(`/admin/posts/${trans.id}`))
    } else {
        // Confirm before creating new translation if current post is not saved
        if (isNew.value && !post.value.id) {
            toast.add({ severity: 'warn', summary: 'Warn', detail: t('pages.admin.posts.save_current_first'), life: 3000 })
            return
        }

        const newPostPath = localePath('/admin/posts/new')
        navigateTo({
            path: newPostPath,
            query: {
                language: langCode,
                translationId: post.value.translationId || post.value.id,
            },
        })
    }
}

const selectedTags = ref<string[]>([])
const filteredTags = ref<string[]>([])
const allTags = ref<string[]>([]) // Should be loaded from API

const settingsVisible = ref(false)
const aiLoading = ref({
    title: false,
    summary: false,
    tags: false,
})
const titleSuggestions = ref<string[]>([])
const titleOp = ref<any>(null)

const toggleTitleSuggestions = (event: any) => {
    titleOp.value?.toggle(event)
}

const suggestTitles = async (event: any) => {
    if (!post.value.content || post.value.content.length < 10) {
        toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('pages.admin.posts.content_too_short'), life: 3000 })
        return
    }

    aiLoading.value.title = true
    try {
        const { data } = await $fetch('/api/admin/ai/suggest-titles', {
            method: 'POST',
            body: { content: post.value.content },
        })
        titleSuggestions.value = (data as string[]) || []
        if (titleSuggestions.value.length > 0) {
            toggleTitleSuggestions(event)
        }
    } catch (error) {
        console.error('AI Title Suggestion error:', error)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('pages.admin.posts.ai_error'), life: 3000 })
    } finally {
        aiLoading.value.title = false
    }
}

const selectTitle = (suggestion: string) => {
    post.value.title = suggestion
    titleOp.value?.hide()
}

const suggestSummary = async () => {
    if (!post.value.content || post.value.content.length < 10) {
        toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('pages.admin.posts.content_too_short'), life: 3000 })
        return
    }

    aiLoading.value.summary = true
    try {
        const { data } = await $fetch('/api/admin/ai/summarize', {
            method: 'POST',
            body: { content: post.value.content },
        })
        post.value.summary = data as string
    } catch (error) {
        console.error('AI Summary error:', error)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('pages.admin.posts.ai_error'), life: 3000 })
    } finally {
        aiLoading.value.summary = false
    }
}

const recommendTags = async () => {
    if (!post.value.content || post.value.content.length < 10) {
        toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('pages.admin.posts.content_too_short'), life: 3000 })
        return
    }

    aiLoading.value.tags = true
    try {
        const { data } = await $fetch('/api/admin/ai/recommend-tags', {
            method: 'POST',
            body: {
                content: post.value.content,
                existingTags: allTags.value,
            },
        })
        const recommended = data as string[]
        // Add only those not already selected
        recommended.forEach((tag) => {
            if (!selectedTags.value.includes(tag)) {
                selectedTags.value.push(tag)
            }
        })
    } catch (error) {
        console.error('AI Tags error:', error)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('pages.admin.posts.ai_error'), life: 3000 })
    } finally {
        aiLoading.value.tags = false
    }
}

const saving = ref(false)
const categories = ref<{ id: string, name: string }[]>([])
const errors = ref<Record<string, string>>({})
const isDragging = ref(false)

const syncTranslationIdFromSlug = () => {
    if (post.value.slug) {
        post.value.translationId = post.value.slug
    }
}

const oldSlugValue = ref(post.value.slug)
watch(() => post.value.slug, (newSlug) => {
    // 仅在新建且 translationId 为空或等于旧 slug 时更新
    if (isNew.value && (!post.value.translationId || post.value.translationId === oldSlugValue.value)) {
        post.value.translationId = newSlug
    }
    oldSlugValue.value = newSlug
})

const postsForTranslation = ref<any[]>([])
const searchPosts = async (event: { query: string }) => {
    if (!event.query.trim()) return
    try {
        const { data } = await $fetch<{ data: { items: any[] } }>('/api/posts', {
            query: {
                search: event.query,
                limit: 10,
                scope: 'manage',
                // Exclude current post
            },
        })
        postsForTranslation.value = data.items
            .filter((p) => p.id !== post.value.id)
            .map((p) => ({
                label: `[${p.language}] ${p.title}`,
                value: p.translationId || p.id,
            }))
    } catch (error) {
        console.error('Failed to search posts', error)
    }
}

const isNew = computed(() => route.params.id === 'new' || !route.params.id)

const previewLink = computed(() => {
    if (isNew.value && !post.value.id) return null
    return localePath(`/posts/${post.value.slug || post.value.id}`)
})

const handlePreview = () => {
    if (previewLink.value) {
        window.open(previewLink.value, '_blank')
    }
}

const loadPost = async () => {
    if (isNew.value) {
        oldSlugValue.value = ''
        // If it's a new translation, we might want to pre-fill some fields from a source post
        if (route.query.translationId) {
            try {
                const { data } = await $fetch<any>(`/api/posts/${route.query.translationId}`)
                if (data) {
                    // Pre-fill categories, tags, etc.
                    post.value.categoryId = data.category?.id || null
                    post.value.tags = data.tags?.map((t: any) => t.name) || []
                    selectedTags.value = post.value.tags
                    post.value.translationId = data.translationId || data.id
                    post.value.slug = data.slug // Suggest same slug
                }
            } catch (e) {}
            // Also fetch other translations for the bar
            fetchTranslations(route.query.translationId as string)
        }
        return
    }
    try {
        const { data } = await $fetch<{ data: any }>(`/api/posts/${route.params.id}`)
        if (data) {
            post.value = {
                ...data,
                categoryId: data.category?.id || null,
                tags: data.tags?.map((t: any) => t.name) || [],
                language: data.language || 'zh-CN',
                translationId: data.translationId || null,
            }
            oldSlugValue.value = data.slug
            selectedTags.value = post.value.tags

            if (post.value.translationId) {
                fetchTranslations(post.value.translationId)
            }
        }
    } catch (error) {
        console.error('Failed to load post', error)
        // router.push('/admin/posts');
    }
}

const fetchTranslations = async (translationId: string) => {
    try {
        const { data } = await $fetch<any>('/api/posts', {
            query: { translationId, limit: 10, scope: 'manage' },
        })
        translations.value = data.items.filter((p: any) => p.id !== post.value.id)
    } catch (e) {
        console.error('Failed to fetch translations', e)
    }
}

const searchTags = (event: { query: string }) => {
    // In a real app, fetch from API
    // For now, just echo the query if not in list
    if (!event.query.trim().length) {
        filteredTags.value = [...allTags.value]
    } else {
        filteredTags.value = allTags.value.filter((tag) => {
            return tag.toLowerCase().startsWith(event.query.toLowerCase())
        })
        if (!filteredTags.value.includes(event.query)) {
            // Allow creating new tags implicitly by just typing
        }
    }
}
const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await $fetch<{ code: number, data: { url: string }[] }>('/api/upload', {
        method: 'POST',
        body: formData,
    })

    return data?.[0]?.url
}

const imgAdd = async (pos: number, $file: File) => {
    try {
        const url = await uploadFile($file)
        if (url) {
            md.value?.$img2Url(pos, url)
        }
    } catch (error) {
        console.error('Upload failed', error)
        toast.add({ severity: 'error', summary: 'Error', detail: t('common.upload_failed') || 'Upload failed', life: 3000 })
    }
}

const onDragOver = (e: DragEvent) => {
    if (e.dataTransfer?.types?.includes('Files')) {
        isDragging.value = true
    }
}

const onDragLeave = (e: DragEvent) => {
    // Prevent flickering when dragging over child elements
    if (e.currentTarget && (e.relatedTarget === null || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))) {
        isDragging.value = false
    }
}

const handleMarkdownImport = (file: File) => {
    const reader = new FileReader()
    reader.readAsText(file, 'utf-8')
    reader.onload = () => {
        let markdown = reader.result as string
        if (!markdown) {
            toast.add({ severity: 'warn', summary: 'Warning', detail: 'File is empty', life: 3000 })
            return
        }

        const metaReg = /---\r?\n([\s\S]*?)\r?\n---/
        // const removePattern2 = /^# \s*(.+)\n/
        const metaText = markdown.match(metaReg)
        markdown = markdown.replace(/\r\n/g, '\n').replace(/\t/g, '    ').trim()

        let frontMatter: any = {}
        if (metaText?.[1]) {
            try {
                frontMatter = load(metaText[1]) || {}
            } catch (e) {
                console.error('Failed to parse front matter', e)
                toast.add({ severity: 'warn', summary: 'Warning', detail: 'Failed to parse front matter', life: 3000 })
            }
        }

        const content = markdown.replace(metaReg, '').trim()

        // Update post data
        post.value.content = content
        if (frontMatter.title) post.value.title = frontMatter.title
        if (frontMatter.slug || frontMatter.abbrlink) post.value.slug = frontMatter.slug || frontMatter.abbrlink
        if (frontMatter.description || frontMatter.desc) post.value.summary = frontMatter.description || frontMatter.desc
        if (frontMatter.image || frontMatter.cover || frontMatter.thumb) post.value.coverImage = frontMatter.image || frontMatter.cover || frontMatter.thumb
        if (frontMatter.copyright || frontMatter.license) post.value.copyright = frontMatter.copyright || frontMatter.license
        if (frontMatter.language || frontMatter.lang) post.value.language = frontMatter.language || frontMatter.lang

        // Handle tags
        if (frontMatter.tags) {
            if (Array.isArray(frontMatter.tags)) {
                selectedTags.value = frontMatter.tags
            } else if (typeof frontMatter.tags === 'string') {
                selectedTags.value = [frontMatter.tags]
            }
        }

        // Handle category (try to match existing categories)
        if (frontMatter.categories || frontMatter.category) {
            const catName = Array.isArray(frontMatter.categories) ? frontMatter.categories[0] : (frontMatter.categories || frontMatter.category)
            if (catName) {
                const foundCat = categories.value.find((c) => c.name.toLowerCase() === catName.toLowerCase())
                if (foundCat) {
                    post.value.categoryId = foundCat.id
                } else {
                    // Optional: Create new category or just warn
                    toast.add({ severity: 'info', summary: 'Info', detail: `Category "${catName}" not found`, life: 3000 })
                }
            }
        }

        toast.add({ severity: 'success', summary: 'Success', detail: 'Markdown imported successfully', life: 3000 })
    }
}

const handleImageUpload = async (file: File) => {
    try {
        const url = await uploadFile(file)
        if (url) {
            // Insert image at the end of content
            post.value.content += `\n![${file.name}](${url})\n`
            toast.add({ severity: 'success', summary: 'Success', detail: 'Image uploaded', life: 3000 })
        }
    } catch (error) {
        console.error('Upload failed', error)
        toast.add({ severity: 'error', summary: 'Error', detail: t('common.upload_failed') || 'Upload failed', life: 3000 })
    }
}

const onDrop = async (e: DragEvent) => {
    isDragging.value = false
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
        const file = files.item(i)
        if (!file) continue

        if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
            handleMarkdownImport(file)
        } else if (file.type.startsWith('image/')) {
            await handleImageUpload(file)
        } else {
            toast.add({ severity: 'warn', summary: 'Warning', detail: `Unsupported file type: ${file.name}`, life: 3000 })
        }
    }
}

const savePost = async (publish = false) => {
    errors.value = {}

    // 构建提交数据，显式移除关联对象以避免 Zod 校验失败
    const payload: any = { ...post.value }
    delete payload.category
    delete payload.author
    payload.tags = selectedTags.value
    if (publish) {
        payload.status = 'published'
    }

    const schema = isNew.value ? createPostSchema : updatePostSchema
    const result = schema.safeParse(payload)

    if (!result.success) {
        result.error.issues.forEach((issue) => {
            errors.value[String(issue.path[0])] = issue.message
        })

        // Check if any error is in the drawer fields
        const drawerFields = ['language', 'translationId', 'slug', 'categoryId', 'category', 'tags', 'copyright', 'summary', 'coverImage']
        const hasDrawerError = result.error.issues.some((issue) => drawerFields.includes(String(issue.path[0])))
        if (hasDrawerError) {
            settingsVisible.value = true
        }

        const firstError = result.error.issues[0]
        const errorDetail = firstError ? `${String(firstError.path[0])}: ${firstError.message}` : t('common.validation_error')
        toast.add({ severity: 'error', summary: t('common.error'), detail: errorDetail, life: 5000 })
        return
    }

    saving.value = true
    try {
        if (isNew.value) {
            const response = await $fetch<{ code: number, data: any }>('/api/posts', {
                method: 'POST',
                body: payload,
            })
            if (response.code === 200 && response.data?.id) {
                post.value.id = response.data.id
                post.value.status = response.data.status
                toast.add({ severity: 'success', summary: 'Success', detail: t('common.save_success'), life: 3000 })
                // Replace route to edit mode without reloading
                router.replace(localePath(`/admin/posts/${response.data.id}`))
            }
        } else {
            await $fetch(`/api/posts/${route.params.id}`, {
                method: 'PUT' as any,
                body: payload,
            })
            if (publish) {
                post.value.status = 'published'
            }
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.save_success'), life: 3000 })
        }
    } catch (error: any) {
        console.error('Failed to save post', error)
        const serverMessage = error.data?.message || error.statusMessage || t('common.save_failed')
        toast.add({ severity: 'error', summary: t('common.error'), detail: serverMessage, life: 5000 })
    } finally {
        saving.value = false
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

const loadCategories = async () => {
    try {
        const response = await $fetch<{ data: { items: any[] } }>('/api/categories', {
            query: { limit: 100, language: post.value.language },
        })
        if (response.data) {
            categories.value = response.data.items
        }
    } catch (error) {
        console.error('Failed to load categories', error)
    }
}

const loadTags = async () => {
    try {
        const response = await $fetch<{ data: { items: any[] } }>('/api/tags', {
            query: { limit: 100, language: post.value.language },
        })
        if (response.data) {
            allTags.value = response.data.items.map((t: any) => t.name)
        }
    } catch (error) {
        console.error('Failed to load tags', error)
    }
}

watch(() => post.value.language, () => {
    loadCategories()
    loadTags()
})

onMounted(() => {
    loadPost()
    loadCategories()
    loadTags()
})
</script>

<style lang="scss" scoped>
.editor-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--p-surface-ground);
    position: relative;
}

.drag-mask {
    position: absolute;
    inset: 0;
    background-color: rgb(0 0 0 / 0.3);
    border: 3px dashed var(--p-primary-500);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    backdrop-filter: blur(2px);

    i {
        font-size: 4rem;
        color: var(--p-primary-500);
        margin-bottom: 1rem;
    }

    p {
        font-size: 1.5rem;
        color: var(--p-primary-500);
        font-weight: bold;
        text-shadow: 0 2px 4px rgb(0 0 0 / 0.5);
    }
}

.title-suggestions-panel {
    max-width: 400px;

    .suggestion-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .suggestion-item {
        padding: 0.75rem 1rem;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s;

        &:hover {
            background-color: var(--p-surface-hover);
        }

        & + & {
            border-top: 1px solid var(--p-surface-border);
        }
    }
}

.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    height: 4rem;
    border-bottom: 1px solid var(--p-surface-border);
    background-color: var(--p-surface-card);
    flex-shrink: 0;

    &-left {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
    }

    &-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
}

.translation-status-bar {
    display: flex;
    gap: 0.25rem;
    align-items: center;
}

.translation-badge {
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.75rem;

    &:hover {
        transform: translateY(-1px);
        opacity: 0.8;
    }

    &--active {
        box-shadow: 0 0 0 2px var(--p-primary-color);
    }

    &--missing {
        filter: grayscale(1) opacity(0.5);
    }
}

.title-input {
    font-size: 1.25rem;
    font-weight: 700;
    width: 100%;
    max-width: 40rem;
    border: none;
    box-shadow: none;
    background: transparent;

    &:focus {
        box-shadow: none;
    }
}

.saving-text {
    font-size: 0.875rem;
    color: var(--p-surface-500);
    margin-right: 0.5rem;
}

.editor-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;

    .mavon-editor {
        width: 100%;
        height: 100%;
        z-index: 1;
    }

    &--invalid {
        border: 1px solid var(--p-error-color);
    }
}

.editor-error-message {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    z-index: 10;
    background-color: var(--p-surface-card);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
}

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
