import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

export function usePostEditorAI(post: any, allTags: any, selectedTags: any) {
    const { t } = useI18n()
    const toast = useToast()

    const aiLoading = ref({
        title: false,
        summary: false,
        tags: false,
        slug: false,
    })

    const titleSuggestions = ref<string[]>([])
    const titleOp = ref<any>(null)

    const suggestTitles = async (event: any) => {
        if (!post.value.content || post.value.content.length < 10) {
            toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('pages.admin.posts.content_too_short'), life: 3000 })
            return
        }

        const currentTarget = event.currentTarget || event.target

        aiLoading.value.title = true
        try {
            const { data } = await $fetch('/api/ai/suggest-titles', {
                method: 'POST',
                body: {
                    content: post.value.content,
                    language: post.value.language,
                },
            })
            titleSuggestions.value = (data as string[]) || []
            if (titleSuggestions.value.length > 0) {
                titleOp.value?.show(event, currentTarget)
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

    const suggestSlug = async () => {
        if (!post.value.title || !post.value.content || post.value.content.length < 10) {
            toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('pages.admin.posts.content_too_short'), life: 3000 })
            return
        }

        aiLoading.value.slug = true
        try {
            const { data } = await $fetch('/api/ai/suggest-slug', {
                method: 'POST',
                body: {
                    title: post.value.title,
                    content: post.value.content,
                },
            })
            post.value.slug = data as string
        } catch (error) {
            console.error('AI Slug error:', error)
            toast.add({ severity: 'error', summary: t('common.error'), detail: t('pages.admin.posts.ai_error'), life: 3000 })
        } finally {
            aiLoading.value.slug = false
        }
    }

    const suggestSummary = async () => {
        if (!post.value.content || post.value.content.length < 10) {
            toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('pages.admin.posts.content_too_short'), life: 3000 })
            return
        }

        aiLoading.value.summary = true
        try {
            const { data } = await $fetch('/api/ai/summarize', {
                method: 'POST',
                body: {
                    content: post.value.content,
                    language: post.value.language,
                },
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
            const { data } = await $fetch('/api/ai/recommend-tags', {
                method: 'POST',
                body: {
                    content: post.value.content,
                    existingTags: allTags.value,
                    language: post.value.language,
                },
            })
            const recommended = data as string[]
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

    return {
        aiLoading,
        titleSuggestions,
        titleOp,
        suggestTitles,
        selectTitle,
        suggestSlug,
        suggestSummary,
        recommendTags,
    }
}
