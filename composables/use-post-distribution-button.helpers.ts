import { type ComputedRef, type Ref } from 'vue'
import type { Post } from '@/types/post'
import {
    type MemosDistributionPreview,
    type WechatSyncDistributionPreviewGroup,
} from '@/utils/shared/post-distribution-preview'
import { renderDistributionPreviewHtml } from '@/utils/shared/post-distribution-preview-renderer'
import {
    createMemosExpandedPreview,
    createWechatSyncExpandedPreview,
    type ExpandedDistributionPreview,
} from '@/utils/web/post-distribution-dialog'

type TranslateFn = ReturnType<typeof useI18n>['t']

export type DistributionSourcePost = Omit<Post, 'tags'> & {
    tags?: Post['tags'] | string[] | null
}

type StructuredDistributionTag = NonNullable<NonNullable<Post['tags']>[number]>

function preferLiveDistributionValue<T>(liveValue: T | undefined, fetchedValue: T): T {
    return liveValue === undefined ? fetchedValue : liveValue
}

function preferFetchedRelationValue<T>(liveValue: T | null | undefined, fetchedValue: T): T {
    return liveValue ?? fetchedValue
}

function normalizeDistributionSourceTag(tag: string | StructuredDistributionTag): StructuredDistributionTag | null {
    if (typeof tag === 'string') {
        const normalizedTag = tag.trim()
        return normalizedTag
            ? { id: normalizedTag, name: normalizedTag, slug: normalizedTag }
            : null
    }

    const normalizedName = tag.name?.trim()
    if (!normalizedName) {
        return null
    }

    const normalizedSlug = tag.slug?.trim() || normalizedName
    const normalizedId = tag.id?.trim() || normalizedSlug

    return {
        id: normalizedId,
        name: normalizedName,
        slug: normalizedSlug,
    }
}

function resolveDistributionSourceTags(
    liveTags: DistributionSourcePost['tags'],
    fetchedTags: Post['tags'],
): Post['tags'] {
    if (Array.isArray(liveTags)) {
        return liveTags
            .map((tag) => normalizeDistributionSourceTag(tag as string | StructuredDistributionTag))
            .filter((tag): tag is StructuredDistributionTag => Boolean(tag))
    }

    return fetchedTags
}

export function mergeDistributionSourcePost(livePost: DistributionSourcePost | null, fetchedPost: Post | null): Post | null {
    if (!livePost) {
        return fetchedPost
    }

    if (!fetchedPost) {
        const { tags: liveTags, ...restLivePost } = livePost

        return {
            ...restLivePost,
            tags: resolveDistributionSourceTags(liveTags, null),
        }
    }

    return {
        ...fetchedPost,
        ...livePost,
        author: preferFetchedRelationValue(livePost.author, fetchedPost.author),
        authorId: preferLiveDistributionValue(livePost.authorId, fetchedPost.authorId),
        category: preferFetchedRelationValue(livePost.category, fetchedPost.category),
        categoryId: preferLiveDistributionValue(livePost.categoryId, fetchedPost.categoryId),
        coverImage: preferLiveDistributionValue(livePost.coverImage, fetchedPost.coverImage),
        copyright: preferLiveDistributionValue(livePost.copyright, fetchedPost.copyright),
        metadata: preferLiveDistributionValue(livePost.metadata, fetchedPost.metadata),
        summary: preferLiveDistributionValue(livePost.summary, fetchedPost.summary),
        tags: resolveDistributionSourceTags(livePost.tags, fetchedPost.tags),
        translationId: preferLiveDistributionValue(livePost.translationId, fetchedPost.translationId),
    }
}

export function createExpandedPreviewController(options: {
    expandedPreview: Ref<ExpandedDistributionPreview | null>
    expandedPreviewVisible: Ref<boolean>
    memosPreview: ComputedRef<MemosDistributionPreview | null>
    showErrorToast: (...args: Parameters<ReturnType<typeof useRequestFeedback>['showErrorToast']>) => void
    showSuccessToast: (...args: Parameters<ReturnType<typeof useRequestFeedback>['showSuccessToast']>) => void
    t: TranslateFn
}) {
    function renderPreviewValue(value?: string | null) {
        return value?.trim() || options.t('pages.admin.posts.distribution.preview.empty')
    }

    function renderPreviewMarkdownHtml(
        value?: string | null,
        contentProfile?: ExpandedDistributionPreview['contentProfile'],
    ) {
        return renderDistributionPreviewHtml(
            value,
            options.t('pages.admin.posts.distribution.preview.empty'),
            { contentProfile },
        )
    }

    function openExpandedPreview(preview: ExpandedDistributionPreview) {
        options.expandedPreview.value = preview
        options.expandedPreviewVisible.value = true
    }

    function closeExpandedPreview() {
        options.expandedPreviewVisible.value = false
    }

    function openMemosPreviewDialog() {
        if (!options.memosPreview.value) {
            return
        }

        openExpandedPreview(createMemosExpandedPreview(options.memosPreview.value, options.t))
    }

    function openWechatSyncPreviewDialog(group: WechatSyncDistributionPreviewGroup) {
        openExpandedPreview(createWechatSyncExpandedPreview(group, options.t))
    }

    function resolveCurrentPreviewRenderResult(currentPreview: ExpandedDistributionPreview | null) {
        if (!currentPreview?.finalMarkdown?.trim()) {
            options.showErrorToast(new Error(options.t('pages.admin.posts.distribution.preview.empty')), {
                fallbackKey: 'pages.admin.posts.distribution.preview.copy_formatted_failed',
            })
            return null
        }

        if (!import.meta.client || !navigator.clipboard) {
            options.showErrorToast(new Error(options.t('common.error_loading')), {
                fallbackKey: 'pages.admin.posts.distribution.preview.copy_formatted_failed',
            })
            return null
        }

        const markdown = currentPreview.finalMarkdown.trim()
        const html = renderDistributionPreviewHtml(
            markdown,
            options.t('pages.admin.posts.distribution.preview.empty'),
            { contentProfile: currentPreview.contentProfile },
        )

        return {
            markdown,
            html,
        }
    }

    async function copyExpandedPreviewContent() {
        const currentPreview = options.expandedPreview.value
        const renderResult = resolveCurrentPreviewRenderResult(currentPreview)
        if (!renderResult) {
            return
        }

        const { markdown, html } = renderResult

        try {
            if (typeof navigator.clipboard.write === 'function' && typeof ClipboardItem !== 'undefined') {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/plain': new Blob([markdown], { type: 'text/plain' }),
                        'text/html': new Blob([html], { type: 'text/html' }),
                    }),
                ])
            } else {
                await navigator.clipboard.writeText(markdown)
            }
            options.showSuccessToast('pages.admin.posts.distribution.preview.copy_formatted_success')
        } catch (error) {
            options.showErrorToast(error, {
                fallbackKey: 'pages.admin.posts.distribution.preview.copy_formatted_failed',
            })
        }
    }

    async function copyExpandedPreviewRenderedHtml() {
        const currentPreview = options.expandedPreview.value
        const renderResult = resolveCurrentPreviewRenderResult(currentPreview)
        if (!renderResult) {
            return
        }

        try {
            await navigator.clipboard.writeText(renderResult.html)
            options.showSuccessToast('pages.admin.posts.distribution.preview.copy_rendered_html_success')
        } catch (error) {
            options.showErrorToast(error, {
                fallbackKey: 'pages.admin.posts.distribution.preview.copy_rendered_html_failed',
            })
        }
    }

    return {
        copyExpandedPreviewContent,
        copyExpandedPreviewRenderedHtml,
        closeExpandedPreview,
        openMemosPreviewDialog,
        openWechatSyncPreviewDialog,
        openExpandedPreview,
        renderPreviewMarkdownHtml,
        renderPreviewValue,
    }
}
