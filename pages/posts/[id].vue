<template>
    <div class="post-detail">
        <div v-if="pending" class="post-detail__loading">
            <CaomeiSkeleton height="30rem" class="post-detail__skeleton-cover" />
            <div class="post-detail__skeleton-content">
                <div class="post-detail__skeleton-main">
                    <CaomeiSkeleton
                        width="60%"
                        height="3rem"
                        class="mb-4"
                    />
                    <CaomeiSkeleton
                        width="40%"
                        height="1.5rem"
                        class="mb-8"
                    />
                    <CaomeiSkeleton
                        v-for="i in 10"
                        :key="i"
                        height="1rem"
                        class="mb-2"
                    />
                </div>
                <div class="post-detail__skeleton-sidebar">
                    <CaomeiSkeleton height="20rem" />
                </div>
            </div>
        </div>

        <div v-else-if="error" class="post-detail__error">
            <div class="error-container">
                <div class="error-icon">
                    <Compass v-if="error.statusCode === 404" :size="48" />
                    <CircleAlert v-else :size="48" />
                </div>
                <h2 class="error-title">
                    {{ error.statusCode === 404 ? $t('pages.error.404_title') : $t('pages.error.title') }}
                </h2>
                <p class="error-message">
                    {{ error.statusCode === 404 ? $t('pages.error.404_desc') : (error.statusMessage || error.message) }}
                </p>
                <div class="error-actions">
                    <CaomeiButton
                        id="back-home-btn"
                        @click="navigateTo(localePath('/'))"
                    >
                        <template #icon>
                            <Home :size="16" />
                        </template>
                        {{ $t('pages.error.back_home') }}
                    </CaomeiButton>
                    <CaomeiButton
                        v-if="error.statusCode !== 404"
                        id="retry-btn"
                        variant="ghost"
                        @click="() => refresh()"
                    >
                        <template #icon>
                            <RotateCcw :size="16" />
                        </template>
                        {{ $t('pages.error.retry') }}
                    </CaomeiButton>
                </div>
            </div>
        </div>

        <div v-else-if="post" class="post-detail__content">
            <div
                v-if="post.status !== 'published'"
                class="post-detail__status-banner"
            >
                <CaomeiMessage
                    tone="warning"
                    :closable="false"
                >
                    <TriangleAlert :size="16" />
                    {{ $t('pages.posts.status_warning', {status: $t(`common.status.${post.status}`)}) }}
                </CaomeiMessage>
            </div>

            <div
                v-if="post.coverImage"
                class="post-detail__cover"
                @click="openLightbox(post.coverImage)"
            >
                <img
                    :src="post.coverImage"
                    :alt="post.title"
                    width="1200"
                    height="514"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                >
            </div>

            <div class="post-detail__layout">
                <aside class="post-detail__sidebar">
                    <AdPlacement
                        :location="AdLocation.SIDEBAR"
                        :context="{postId: post.id, categories: post.category?.id ? [post.category.id] : [], tags: post.tags?.map(t => t.id) || []}"
                    />
                    <div class="post-detail__sidebar-stack">
                        <div class="post-detail__sidebar-panel">
                            <TableOfContents :content="post.content" />
                        </div>
                        <div class="post-detail__sidebar-panel post-detail__sidebar-panel--travellings">
                            <TravellingsLink placement="sidebar" />
                        </div>
                    </div>
                </aside>

                <main class="post-detail__main">
                    <header class="post-detail__header">
                        <div class="post-detail__breadcrumb">
                            <NuxtLink :to="localePath('/')" class="breadcrumb-link">
                                {{ $t('common.home') }}
                            </NuxtLink>
                            <ChevronRight class="post-detail__breadcrumb-separator" :size="14" />
                            <NuxtLink :to="localePath('/posts')" class="breadcrumb-link">
                                {{ $t('pages.posts.title') }}
                            </NuxtLink>
                            <template v-if="post.category">
                                <ChevronRight class="post-detail__breadcrumb-separator" :size="14" />
                                <NuxtLink :to="localePath(`/categories/${post.category.slug}`)" class="breadcrumb-link">
                                    {{ post.category.name }}
                                </NuxtLink>
                            </template>
                            <ChevronRight class="post-detail__breadcrumb-separator" :size="14" />
                            <span class="truncate">{{ post.title }}</span>
                        </div>

                        <h1 class="post-detail__title">
                            {{ post.title }}
                        </h1>

                        <div class="post-detail__meta">
                            <div v-if="post.author" class="post-detail__author">
                                <AppAvatar
                                    :image="post.author.image"
                                    :email-hash="post.author.emailHash"
                                    :name="post.author.name"
                                    shape="circle"
                                />
                                <span class="font-medium">{{ post.author.name }}</span>
                            </div>
                            <span v-if="post.publishedAt" class="post-detail__meta-item">
                                <CalendarIcon :size="14" />
                                {{ formatDateTime(post.publishedAt) }}
                            </span>
                            <span class="post-detail__meta-item">
                                <Eye :size="14" />
                                {{ post.views }} {{ $t('common.views') }}
                            </span>
                            <span class="post-detail__meta-item">
                                <Pencil :size="14" />
                                {{ articleWordCount }} {{ $t('common.word_count') }}
                            </span>
                            <span class="post-detail__meta-item">
                                <Clock :size="14" />
                                {{ $t('common.minutes', {min: estimateReadingTime(post.content)}) }}
                            </span>
                            <NuxtLink
                                v-if="post.category"
                                :to="localePath(`/categories/${post.category.slug}`)"
                                class="post-detail__category"
                            >
                                <CaomeiTag tone="neutral">
                                    {{ post.category.name }}
                                </CaomeiTag>
                            </NuxtLink>
                        </div>
                    </header>

                    <section
                        v-if="articleSummary"
                        class="post-detail__summary"
                        :aria-label="$t('common.summary')"
                    >
                        <p class="post-detail__summary-label">
                            {{ $t('common.summary') }}
                        </p>
                        <p class="post-detail__summary-text">
                            {{ articleSummary }}
                        </p>
                    </section>

                    <template v-if="post.locked">
                        <div class="post-detail__locked">
                            <div class="post-detail__locked-card">
                                <Lock class="post-detail__locked-icon" :size="48" />
                                <h2 class="post-detail__locked-title">
                                    {{ $t(`pages.posts.locked.${post.reason?.toLowerCase()}`) }}
                                </h2>
                                <p class="post-detail__locked-desc">
                                    {{ $t(`pages.posts.locked.${post.reason?.toLowerCase()}_desc`) }}
                                </p>

                                <div v-if="post.reason === 'PASSWORD_REQUIRED'" class="post-detail__unlock-form">
                                    <div class="flex gap-2 w-full">
                                        <CaomeiInput
                                            v-model="password"
                                            type="password"
                                            :placeholder="$t('pages.posts.password_placeholder')"
                                            class="grow"
                                            @enter="unlockPost"
                                        />
                                        <CaomeiButton
                                            :loading="unlocking"
                                            @click="unlockPost"
                                        >
                                            {{ $t('common.confirm') }}
                                        </CaomeiButton>
                                    </div>
                                    <small v-if="unlockError" class="block form-error mt-2">
                                        {{ unlockError }}
                                    </small>
                                </div>

                                <div v-else class="post-detail__unlock-actions">
                                    <CaomeiButton
                                        v-if="post.reason === 'AUTH_REQUIRED'"
                                        @click="navigateTo(localePath('/login'))"
                                    >
                                        <template #icon>
                                            <User :size="16" />
                                        </template>
                                        {{ $t('pages.posts.login_to_read') }}
                                    </CaomeiButton>
                                    <div v-if="post.reason === 'SUBSCRIPTION_REQUIRED'" class="w-full">
                                        <SubscriberForm />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div v-if="post.audioUrl" class="post-detail__audio">
                            <audio controls>
                                <source :src="post.audioUrl" :type="post.audioMimeType || 'audio/mpeg'">
                                Your browser does not support the audio element.
                            </audio>
                        </div>

                        <AdPlacement
                            :location="AdLocation.CONTENT_TOP"
                            :context="{postId: post.id, categories: post.category?.id ? [post.category.id] : [], tags: post.tags?.map(t => t.id) || []}"
                        />

                        <ArticleContent :content="post.content" />

                        <AdPlacement
                            :location="AdLocation.CONTENT_MIDDLE"
                            :context="{postId: post.id, categories: post.category?.id ? [post.category.id] : [], tags: post.tags?.map(t => t.id) || []}"
                        />

                        <AdPlacement
                            :location="AdLocation.CONTENT_BOTTOM"
                            :context="{postId: post.id, categories: post.category?.id ? [post.category.id] : [], tags: post.tags?.map(t => t.id) || []}"
                        />
                    </template>

                    <ArticleCopyright
                        v-if="!post.locked"
                        :author-name="post.author?.name || post.author?.email || ''"
                        :url="fullUrl"
                        :license="post.copyright"
                    />

                    <ArticleShare
                        v-if="!post.locked"
                        :title="post.title"
                        :text="shareText"
                        :url="shareUrl"
                        :image="post.coverImage || null"
                    />

                    <ArticleSponsor
                        v-if="!post.locked"
                        :social-links="post.author?.socialLinks"
                        :donation-links="post.author?.donationLinks"
                    />

                    <footer class="post-detail__footer">
                        <div v-if="post.tags && post.tags.length > 0" class="post-detail__tags">
                            <NuxtLink
                                v-for="tag in post.tags"
                                :key="tag.id"
                                :to="localePath(`/tags/${tag.slug}`)"
                                class="post-detail__tag-link"
                            >
                                <CaomeiTag
                                    tone="primary"
                                    rounded
                                >
                                    {{ tag.name }}
                                </CaomeiTag>
                            </NuxtLink>
                        </div>
                        <section
                            v-if="!post.locked && post.relatedPosts && post.relatedPosts.length > 0"
                            class="post-detail__related"
                            :aria-labelledby="'related-posts-heading'"
                        >
                            <div class="post-detail__section-heading">
                                <div>
                                    <p class="post-detail__section-eyebrow">
                                        {{ $t('pages.posts.related.eyebrow') }}
                                    </p>
                                    <h2 id="related-posts-heading" class="post-detail__section-title">
                                        {{ $t('pages.posts.related.title') }}
                                    </h2>
                                </div>
                                <p class="post-detail__section-desc">
                                    {{ $t('pages.posts.related.description') }}
                                </p>
                            </div>

                            <div class="post-detail__related-grid">
                                <NuxtLink
                                    v-for="relatedPost in post.relatedPosts"
                                    :key="relatedPost.id"
                                    :to="buildRelatedPostPath(relatedPost)"
                                    class="post-detail__related-card"
                                >
                                    <div
                                        v-if="relatedPost.coverImage"
                                        class="post-detail__related-cover"
                                    >
                                        <img
                                            :src="relatedPost.coverImage"
                                            :alt="relatedPost.title"
                                            width="480"
                                            height="270"
                                            loading="lazy"
                                            decoding="async"
                                        >
                                    </div>

                                    <div class="post-detail__related-body">
                                        <div class="post-detail__related-meta">
                                            <span
                                                v-if="relatedPost.category"
                                                class="post-detail__related-chip"
                                            >
                                                {{ relatedPost.category.name }}
                                            </span>
                                            <span v-if="relatedPost.publishedAt" class="post-detail__related-date">
                                                <CalendarIcon :size="14" />
                                                {{ formatDateTime(relatedPost.publishedAt) }}
                                            </span>
                                        </div>

                                        <h3 class="post-detail__related-title">
                                            {{ relatedPost.title }}
                                        </h3>

                                        <p v-if="relatedPost.summary" class="post-detail__related-summary">
                                            {{ relatedPost.summary }}
                                        </p>

                                        <div
                                            v-if="relatedPost.tags && relatedPost.tags.length > 0"
                                            class="post-detail__related-tags"
                                        >
                                            <span
                                                v-for="tag in relatedPost.tags.slice(0, 2)"
                                                :key="tag.id"
                                                class="post-detail__related-tag"
                                            >
                                                #{{ tag.name }}
                                            </span>
                                        </div>
                                    </div>
                                </NuxtLink>
                            </div>
                        </section>
                        <nav
                            v-if="!post.locked && (post.previousPost || post.nextPost)"
                            class="post-detail__navigation"
                            :aria-label="$t('pages.posts.article_navigation.aria_label')"
                        >
                            <NuxtLink
                                v-if="post.previousPost"
                                :to="localePath(`/posts/${post.previousPost.slug}`)"
                                class="post-detail__nav-card post-detail__nav-card--previous"
                            >
                                <span class="post-detail__nav-label">
                                    <ArrowLeft :size="16" />
                                    {{ $t('pages.posts.article_navigation.previous') }}
                                </span>
                                <span class="post-detail__nav-title">{{ post.previousPost.title }}</span>
                                <span v-if="post.previousPost.summary" class="post-detail__nav-summary">
                                    {{ post.previousPost.summary }}
                                </span>
                                <span v-if="post.previousPost.publishedAt" class="post-detail__nav-meta">
                                    <CalendarIcon :size="14" />
                                    {{ formatDateTime(post.previousPost.publishedAt) }}
                                </span>
                            </NuxtLink>

                            <NuxtLink
                                v-if="post.nextPost"
                                :to="localePath(`/posts/${post.nextPost.slug}`)"
                                class="post-detail__nav-card post-detail__nav-card--next"
                            >
                                <span class="post-detail__nav-label">
                                    {{ $t('pages.posts.article_navigation.next') }}
                                    <ArrowRight :size="16" />
                                </span>
                                <span class="post-detail__nav-title">{{ post.nextPost.title }}</span>
                                <span v-if="post.nextPost.summary" class="post-detail__nav-summary">
                                    {{ post.nextPost.summary }}
                                </span>
                                <span v-if="post.nextPost.publishedAt" class="post-detail__nav-meta">
                                    <CalendarIcon :size="14" />
                                    {{ formatDateTime(post.nextPost.publishedAt) }}
                                </span>
                            </NuxtLink>
                        </nav>
                        <hr class="post-detail__divider">
                        <SubscriberForm v-if="!post.locked" />

                        <CommentList v-if="!post.locked" :post-id="post.id" />
                    </footer>
                </main>
            </div>
            <ReaderControls />
        </div>

        <CaomeiDialog
            :open="lightboxVisible"
            modal
            :show-header="false"
            :style="{background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, width: 'auto', maxWidth: '90vw', maxHeight: '90vh', overflow: 'hidden'}"
            @update:open="lightboxVisible = $event"
        >
            <div class="lightbox-wrapper" @click="lightboxVisible = false">
                <img :src="lightboxImage" class="lightbox-image">
            </div>
        </CaomeiDialog>
    </div>
</template>

<script setup lang="ts">
import {
    ArrowLeft,
    ArrowRight,
    Calendar as CalendarIcon,
    ChevronRight,
    CircleAlert,
    Clock,
    Compass,
    Eye,
    Home,
    Lock,
    Pencil,
    RotateCcw,
    TriangleAlert,
    User,
} from '@lucide/vue'
import { getLocaleRoutePrefix } from '@/i18n/config/locale-registry'
import type { ApiResponse } from '@/types/api'
import type { Post } from '@/types/post'
import type { DonationLink, SocialLink } from '@/utils/shared/commercial'
import { extractFaqItemsFromMarkdown, resolveCitableExcerpt } from '@/utils/shared/citable-content'
import { buildAbsoluteUrl, buildBreadcrumbListStructuredData, buildFaqPageStructuredData } from '@/utils/shared/seo'
import { buildShareCanonicalUrl } from '@/utils/shared/share'
import { isSnowflakeId } from '@/utils/shared/validate'
import { countWords, estimateReadingTime } from '@/utils/shared/post-stats'
import { AdLocation } from '@/types/ad'
import type { PostNavigationItem, PostRelatedItem } from '@/server/utils/post-detail'

interface PostDetailAuthor extends NonNullable<Post['author']> {
    email?: string | null
    socialLinks?: SocialLink[]
    donationLinks?: DonationLink[]
}

interface PostDetailResponse extends Omit<Post, 'author' | 'translations'> {
    author?: PostDetailAuthor | null
    previousPost?: PostNavigationItem | null
    nextPost?: PostNavigationItem | null
    relatedPosts?: PostRelatedItem[] | null
    translations?: {
        language: string
        slug: string
    }[] | null
}

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()
const setI18nParams = useSetI18nParams()
const { formatDateTime } = useI18nDate()
const { currentDescription } = useMomeiConfig()
const runtimeConfig = useRuntimeConfig()

const idOrSlug = route.params.id as string

function buildLocalizedContentPath(path: string, language?: string | null): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const prefix = getLocaleRoutePrefix(language)

    if (normalizedPath === '/') {
        return prefix || '/'
    }

    return `${prefix}${normalizedPath}`
}

const fullUrl = computed(() => {
    if (import.meta.server) {
        return useRequestURL().href
    }
    return window.location.href
})

const shareUrl = computed<string>(() => {
    if (!post.value?.id) {
        return fullUrl.value.split('#')[0] || fullUrl.value
    }

    const siteUrl = import.meta.server ? useRequestURL().origin : window.location.origin

    return buildShareCanonicalUrl({
        siteUrl,
        localePath,
        pageKind: 'post',
        slug: post.value.slug || null,
        id: post.value.id,
    })
})

const isId = isSnowflakeId(idOrSlug)
const endpoint = computed(() => {
    if (isId) {
        return `/api/posts/${idOrSlug}`
    }

    const requestedLanguage = typeof route.query.language === 'string' ? route.query.language.trim() : ''
    const search = requestedLanguage ? `?language=${encodeURIComponent(requestedLanguage)}` : ''
    return `/api/posts/slug/${idOrSlug}${search}`
})

const { data, pending, error, refresh } = await useAppFetch<ApiResponse<PostDetailResponse>>(() => endpoint.value)

const post = computed(() => data.value?.data)
const siteUrl = computed(() => runtimeConfig.public.siteUrl || 'https://momei.app')
const articleLanguage = computed(() => post.value?.language || null)
const articleSummary = computed(() => typeof post.value?.summary === 'string' ? post.value.summary.trim() : '')
const articleHomePath = computed(() => buildLocalizedContentPath('/', articleLanguage.value))
const articlePostsIndexPath = computed(() => buildLocalizedContentPath('/posts', articleLanguage.value))
const articleCategoryPath = computed(() => post.value?.category
    ? buildLocalizedContentPath(`/categories/${post.value.category.slug}`, articleLanguage.value)
    : null)
const articleCanonicalPath = computed(() => buildLocalizedContentPath(`/posts/${post.value?.slug || idOrSlug}`, articleLanguage.value))
const articleCanonicalUrl = computed(() => buildAbsoluteUrl(siteUrl.value, articleCanonicalPath.value))
const articleKeywordTags = computed(() => Array.isArray(post.value?.tags)
    ? post.value.tags.map((tag: { name: string }) => tag.name).filter(Boolean)
    : [])
const articleCitableExcerpt = computed(() => resolveCitableExcerpt({
    summary: articleSummary.value,
    content: post.value?.content,
    maxLength: 320,
}))
const articleAbout = computed(() => Array.from(new Set([
    post.value?.category?.name,
    ...articleKeywordTags.value,
].filter((value): value is string => Boolean(value)))))
const articleWordCount = computed(() => post.value?.content ? countWords(post.value.content) : null)
const articleSpeakableSelectors = computed(() => articleSummary.value
    ? ['.post-detail__summary-text', '.markdown-body p:first-of-type']
    : ['.markdown-body p:first-of-type'])
const articleFaqItems = computed(() => {
    const items = extractFaqItemsFromMarkdown(post.value?.content || '', 3)
    return items.length > 1 ? items : []
})
const articleStructuredData = computed(() => {
    if (!post.value?.title) {
        return []
    }

    const breadcrumbItems = [
        {
            name: t('common.home'),
            item: buildAbsoluteUrl(siteUrl.value, articleHomePath.value),
        },
        {
            name: t('pages.posts.title'),
            item: buildAbsoluteUrl(siteUrl.value, articlePostsIndexPath.value),
        },
    ]

    if (post.value.category && articleCategoryPath.value) {
        breadcrumbItems.push({
            name: post.value.category.name,
            item: buildAbsoluteUrl(siteUrl.value, articleCategoryPath.value),
        })
    }

    breadcrumbItems.push({
        name: post.value.title,
        item: articleCanonicalUrl.value,
    })

    return [
        buildBreadcrumbListStructuredData({ items: breadcrumbItems }),
        ...(articleFaqItems.value.length > 0
            ? [buildFaqPageStructuredData({ items: articleFaqItems.value })]
            : []),
    ]
})

const articleSeoDescription = computed(() => {
    const siteDescription = typeof currentDescription.value === 'string'
        ? currentDescription.value.trim()
        : t('app.description')

    return [articleCitableExcerpt.value, siteDescription].filter(Boolean).join(' ')
})

const shareText = computed(() => {
    return articleCitableExcerpt.value || currentDescription.value || t('app.description')
})

const lightboxVisible = ref(false)
const lightboxImage = ref('')

const openLightbox = (image: string) => {
    lightboxImage.value = image
    lightboxVisible.value = true
}

const buildRelatedPostPath = (relatedPost: PostRelatedItem) => localePath({
    path: `/posts/${relatedPost.slug}`,
    query: {
        language: relatedPost.language,
    },
})

const password = ref('')
const unlocking = ref(false)
const unlockError = ref('')

const unlockPost = async () => {
    if (!password.value || !post.value?.id) return
    unlocking.value = true
    unlockError.value = ''
    try {
        const res = await $fetch<ApiResponse<{ verified: boolean }>>(`/api/posts/${post.value.id}/verify-password`, {
            method: 'POST',
            body: { password: password.value },
        })
        if (res.code === 200) {
            await refresh()
            password.value = ''
        }
    } catch (e: any) {
        unlockError.value = e.data?.statusMessage || t('common.error')
    } finally {
        unlocking.value = false
    }
}

watch(post, (newPost) => {
    if (newPost?.translations) {
        const params: Record<string, any> = {}
        newPost.translations.forEach((tr: any) => {
            params[tr.language] = { id: tr.slug }
        })
        setI18nParams(params)
    }
}, { immediate: true })

usePageSeo({
    type: 'article',
    title: () => post.value?.title || t('pages.posts.title'),
    locale: () => articleLanguage.value,
    description: () => articleSeoDescription.value,
    path: () => articleCanonicalPath.value,
    image: () => post.value?.coverImage || null,
    publishedAt: () => post.value?.publishedAt || post.value?.createdAt || null,
    updatedAt: () => post.value?.updatedAt || post.value?.publishedAt || null,
    section: () => post.value?.category?.name || null,
    tags: () => articleKeywordTags.value,
    authorName: () => post.value?.author?.name || null,
    abstract: () => articleCitableExcerpt.value || null,
    about: () => articleAbout.value,
    wordCount: () => articleWordCount.value,
    speakableSelectors: () => articleSpeakableSelectors.value,
    structuredData: () => articleStructuredData.value,
})

useHead(() => ({
    link: post.value?.slug
        ? [{ rel: 'canonical', href: articleCanonicalUrl.value }]
        : [],
}))

onMounted(async () => {
    if (!post.value?.id) {
        return
    }

    if (import.meta.browser) { // 只在客户端执行
        const postId = post.value.id
        const storageKey = `momei_view_${postId}`

        if (!sessionStorage.getItem(storageKey)) {
            try {
                const res = await $fetch<{ code: number, data: { views: number } }>(`/api/posts/${postId}/views`, {
                    method: 'POST',
                })
                if (res.code === 200 && data.value?.data) {
                    data.value.data.views = res.data.views
                    sessionStorage.setItem(storageKey, '1')
                }
            } catch (error) {
                console.error('Failed to increment view count:', error)
            }
        }
    }
})
</script>

<style lang="scss" scoped src="./post-detail.scss"></style>
