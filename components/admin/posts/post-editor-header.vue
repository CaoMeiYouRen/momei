<template>
    <div class="top-bar">
        <div class="top-bar-left">
            <AppTooltip :content="$t('pages.admin.posts.back_to_list')">
                <CaomeiButton
                    icon-only
                    variant="ghost"
                    tone="neutral"
                    rounded
                    :label="$t('pages.admin.posts.back_to_list')"
                    @click="navigateTo(localePath('/admin/posts'))"
                >
                    <template #icon>
                        <ArrowLeft :size="16" />
                    </template>
                </CaomeiButton>
            </AppTooltip>
            <CaomeiInput
                v-model="post.title"
                :placeholder="$t('pages.admin.posts.title_placeholder')"
                class="title-input"
                :invalid="Boolean(errors.title)"
                @focus="rememberFocusedEditorElement"
            />
            <CaomeiButtonGroup class="ai-tools-group">
                <!-- AI 写作 SplitButton: 主按钮→改写风格选择, 下拉→标题建议/续写/扩写/缩写 -->
                <AppTooltip :content="$t('pages.admin.posts.ai.ai_writing')">
                    <CaomeiSplitButton
                        id="ai-writing-btn"
                        ref="writingBtnRef"
                        variant="secondary"
                        tone="neutral"
                        :label="$t('pages.admin.posts.ai.ai_writing')"
                        :loading="writingLoading"
                        :model="writingMenuItems"
                        @click="showRewritePopover"
                    >
                        <template #icon>
                            <Pencil :size="16" />
                        </template>
                    </CaomeiSplitButton>
                </AppTooltip>
                <!-- AI 审校: 触发审查 + 视角检查（编辑视角），badge 显示合并总数 -->
                <AppTooltip :content="$t('pages.admin.posts.ai.review')">
                    <CaomeiButton
                        id="ai-review-btn"
                        icon-only
                        variant="secondary"
                        tone="neutral"
                        icon-position="end"
                        :label="$t('pages.admin.posts.ai.review')"
                        :loading="aiLoading.review || aiLoading.perspective"
                        :badge="combinedFindings > 0 ? String(combinedFindings) : undefined"
                        @click="handleReviewClick"
                    >
                        <template #icon>
                            <Search :size="16" />
                        </template>
                    </CaomeiButton>
                </AppTooltip>
                <!-- AI 翻译: SplitButton with language selection -->
                <AppTooltip :content="$t('pages.admin.posts.ai.translate')">
                    <CaomeiSplitButton
                        id="ai-translate-btn"
                        variant="secondary"
                        tone="neutral"
                        :label="$t('pages.admin.posts.ai.translate')"
                        :loading="aiLoading.translate"
                        :model="translateMenuItems"
                        @click="emit('translate-content', null)"
                    >
                        <template #icon>
                            <Languages :size="16" />
                        </template>
                    </CaomeiSplitButton>
                </AppTooltip>
                <!-- 格式化 Markdown -->
                <AppTooltip :content="$t('pages.admin.posts.ai.format_markdown')">
                    <CaomeiButton
                        id="format-markdown-btn"
                        icon-only
                        variant="secondary"
                        tone="neutral"
                        :label="$t('pages.admin.posts.ai.format_markdown')"
                        @click="handleFormatMarkdown"
                    >
                        <template #icon>
                            <AlignLeft :size="16" />
                        </template>
                    </CaomeiButton>
                </AppTooltip>
                <!-- 语音输入 -->
                <AppVoiceInputTrigger
                    id="ai-voice-btn"
                    v-model="post.content"
                    :language="post.language"
                    :show-refine-action="true"
                    :button-text="false"
                    button-class="top-bar__voice-trigger"
                />
            </CaomeiButtonGroup>
            <CaomeiPopover
                :open="rewriteOpen"
                @update:open="rewriteOpen = $event"
            >
                <CaomeiPopoverTrigger as-child>
                    <span
                        class="rewrite-popover-anchor"
                        :style="rewriteAnchorStyle"
                        aria-hidden="true"
                    />
                </CaomeiPopoverTrigger>
                <CaomeiPopoverContent
                    side="bottom"
                    align="start"
                    class="rewrite-menu"
                    :style="{padding: 0}"
                >
                    <div class="rewrite-menu__content">
                        <div class="rewrite-menu__title">
                            {{
                                pendingStyleAction === 'rewrite'
                                    ? $t('pages.admin.posts.ai.rewrite_style_title')
                                    : $t('pages.admin.posts.ai.style_select_title')
                            }}
                        </div>
                        <div
                            v-for="style in rewriteStyles"
                            :key="style.value"
                            class="rewrite-menu__item"
                            @click="handleRewriteSelect(style.value as string)"
                        >
                            <component
                                :is="style.icon"
                                :size="18"
                                class="rewrite-menu__item-icon"
                            />
                            <div class="rewrite-menu__item-text">
                                <div class="rewrite-menu__item-label">
                                    {{ $t(style.labelKey) }}
                                </div>
                                <div class="rewrite-menu__item-desc">
                                    {{ $t(style.descKey) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </CaomeiPopoverContent>
            </CaomeiPopover>
            <CaomeiPopover
                :open="titleOpen"
                @update:open="titleOpen = $event"
            >
                <CaomeiPopoverTrigger as-child>
                    <span
                        class="title-popover-anchor"
                        :style="titleAnchorStyle"
                        aria-hidden="true"
                    />
                </CaomeiPopoverTrigger>
                <CaomeiPopoverContent
                    side="bottom"
                    align="start"
                    class="title-suggestions-panel"
                    :style="{padding: 0}"
                >
                    <ul class="suggestion-list">
                        <li
                            v-for="(suggestion, index) in titleSuggestions"
                            :key="index"
                            class="suggestion-item"
                            @click="emit('select-title', suggestion)"
                        >
                            {{ suggestion }}
                        </li>
                    </ul>
                </CaomeiPopoverContent>
            </CaomeiPopover>
            <small v-if="errors.title" class="form-error">{{
                errors.title
            }}</small>
        </div>
        <div class="top-bar-right">
            <div class="mr-4 translation-status-bar">
                <AppTooltip
                    v-for="l in locales"
                    :key="l.code"
                    :content="l.name"
                >
                    <CaomeiTag
                        :tone="post.language === l.code ? 'success' : 'neutral'"
                        class="translation-badge"
                        :class="{
                            'translation-badge--active': post.language === l.code,
                            'translation-badge--missing': !hasTranslation(l.code),
                            'translation-badge--disabled': props.hasUnsavedContent
                        }"
                        @mousedown.capture="rememberActiveEditorElement(); onTranslationBadgeMousedown(l.code, $event)"
                        @click="onTranslationBadgeClick(l.code)"
                    >
                        {{ l.code.toUpperCase() }}
                    </CaomeiTag>
                </AppTooltip>
            </div>
            <CaomeiTag
                v-if="post.status"
                :tone="severityToTone(getStatusSeverity(post.status))"
                class="mr-2 status-tag"
            >
                {{ getStatusLabel(post.status) }}
            </CaomeiTag>
            <span v-if="saving" class="saving-text">{{
                $t("common.saving")
            }}</span>
            <AdminPostsPostDistributionButton ref="distributionButtonRef" :post="post" />
            <slot name="audit" />
            <CaomeiButton
                v-if="!isNew || post.id"
                variant="ghost"
                tone="neutral"
                @click="emit('preview')"
            >
                <template #icon>
                    <ExternalLink :size="16" />
                </template>
                {{ $t('common.preview') }}
            </CaomeiButton>
            <CaomeiButton
                variant="ghost"
                tone="neutral"
                :loading="saving"
                @click="emit('save', false)"
            >
                <template #icon>
                    <Save :size="16" />
                </template>
                {{ $t('common.save') }}
            </CaomeiButton>
            <CaomeiButton
                tone="neutral"
                :loading="saving"
                @click="emit('save', true)"
            >
                <template #icon>
                    <Send :size="16" />
                </template>
                {{ publishButtonLabel }}
            </CaomeiButton>
            <AppTooltip :content="$t('common.drag_drop_help')">
                <CaomeiButton
                    icon-only
                    variant="ghost"
                    tone="neutral"
                    rounded
                    :label="$t('common.drag_drop_help')"
                >
                    <template #icon>
                        <Info :size="16" />
                    </template>
                </CaomeiButton>
            </AppTooltip>
            <AppTooltip v-if="!isNew || post.id" :content="$t('pages.admin.posts.history_versions')">
                <CaomeiButton
                    icon-only
                    variant="ghost"
                    tone="neutral"
                    rounded
                    :label="$t('pages.admin.posts.history_versions')"
                    @click="emit('open-history')"
                >
                    <template #icon>
                        <History :size="16" />
                    </template>
                </CaomeiButton>
            </AppTooltip>
            <AppTooltip :content="$t('common.settings')">
                <CaomeiButton
                    icon-only
                    variant="ghost"
                    tone="neutral"
                    rounded
                    :label="$t('common.settings')"
                    @click="emit('open-settings')"
                >
                    <template #icon>
                        <Settings :size="16" />
                    </template>
                </CaomeiButton>
            </AppTooltip>
        </div>

        <PostEditorReviewPanel
            :visible="reviewPanelVisible"
            :suggestions="reviewSuggestions"
            @close="emit('update:review-panel-visible', false)"
        />
        <PostEditorPerspectivePanel
            :visible="perspectivePanelVisible"
            :results="perspectiveResults"
            :mode="perspectiveMode"
            :style="reviewPanelVisible && perspectivePanelVisible ? 'right: 26rem' : undefined"
            @close="emit('update:perspective-panel-visible', false)"
            @switch-mode="(mode) => emit('perspective-check', mode)"
        />
    </div>
</template>

<script setup lang="ts">
import {
    AlignLeft,
    ArrowLeft,
    ArrowRight,
    ExternalLink,
    Forward,
    History,
    Info,
    Languages,
    Pencil,
    Save,
    Search,
    Send,
    Settings,
    Sparkles,
} from '@lucide/vue'
import { useToast } from 'caomei-ui'
import { useAnchoredPopover } from '@/composables/use-anchored-popover'
import { formatMarkdown } from '@/utils/shared/markdown-formatter'
import { severityToTone } from '@/utils/shared/ui-tone'
import { POST_EDITOR_REWRITE_STYLES as rewriteStyles } from './post-editor-rewrite-styles'
import PostEditorReviewPanel from '@/components/admin/posts/post-editor-review-panel.vue'
import PostEditorPerspectivePanel from '@/components/admin/posts/post-editor-perspective-panel.vue'
import type { PerspectiveMode, PerspectiveCheckItem } from '@/types/ai'
import type { DropdownMenuModelItem } from 'caomei-ui'

const post = defineModel<any>('post', { required: true })

const { t } = useI18n()
const { isFuture } = useI18nDate()
const toast = useToast()

const isScheduled = computed(() => {
    return isFuture(post.value.publishedAt)
})

const publishButtonLabel = computed(() => {
    if (isScheduled.value) {
        return t('common.schedule_publish')
    }
    return t('common.publish')
})

const props = defineProps<{
    errors: Record<string, string>
    locales: any[]
    hasTranslation: (lang: string) => any
    getStatusLabel: (status: string) => string
    getStatusSeverity: (status: string) => string
    saving: boolean
    isNew: boolean
    hasUnsavedContent: boolean
    aiLoading: any
    titleSuggestions: string[]
    reviewSuggestions: any[]
    reviewPanelVisible: boolean
    perspectiveResults: PerspectiveCheckItem[]
    perspectivePanelVisible: boolean
    perspectiveMode: PerspectiveMode
}>()

const emit = defineEmits<{
    (e: 'suggest-titles', event: Event): void
    (e: 'select-title', suggestion: string): void
    (e: 'handle-translation', lang: string): void
    (e: 'preview'): void
    (e: 'save', publish: boolean): void
    (e: 'open-settings'): void
    (e: 'open-history'): void
    (e: 'translate-content', lang: string | null): void
    (e: 'rewrite-content', style: string): void
    (e: 'review-content'): void
    (e: 'perspective-check', mode: PerspectiveMode): void
    (e: 'continue-content', style: string): void
    (e: 'expand-content', style: string): void
    (e: 'condense-content', style: string): void
    (e: 'update:review-panel-visible', visible: boolean): void
    (e: 'update:perspective-panel-visible', visible: boolean): void
}>()

const localePath = useLocalePath()

const { open: rewriteOpen, anchorStyle: rewriteAnchorStyle, show: showRewriteAnchor, hide: hideRewrite } = useAnchoredPopover()
const { open: titleOpen, anchorStyle: titleAnchorStyle, show: showTitleAnchor, hide: hideTitle } = useAnchoredPopover()

const titleOp = {
    show: (event: Event, target?: EventTarget | null) => showTitleAnchor(target ?? event),
    hide: hideTitle,
}
const writingBtnRef = ref<any>(null)

/** True when any AI writing operation is loading */
const writingLoading = computed(() =>
    props.aiLoading.title || props.aiLoading.rewrite || props.aiLoading.continue
    || props.aiLoading.expand || props.aiLoading.condense,
)

/** Combined findings count (review suggestions + perspective items) */
const combinedFindings = computed(() =>
    props.reviewSuggestions.length + props.perspectiveResults.length,
)

/** Get the AI Writing SplitButton's root DOM element via template ref */
const getWritingBtnEl = (): HTMLElement | null => {
    return (writingBtnRef.value as any)?.$el ?? document.getElementById('ai-writing-btn')
}

/** 当前等待选择风格的 AI 写作动作（改写/续写/扩写/缩写） */
const pendingStyleAction = ref<'rewrite' | 'continue' | 'expand' | 'condense'>('rewrite')

watch(rewriteOpen, (value) => {
    if (!value) {
        pendingStyleAction.value = 'rewrite'
    }
})

/**
 * Show the rewrite style Popover anchored to the AI Writing SplitButton.
 * Uses the template ref for reliable DOM access.
 */
const showStylePopover = (action: 'rewrite' | 'continue' | 'expand' | 'condense') => {
    pendingStyleAction.value = action
    const el = getWritingBtnEl()
    if (el) {
        showRewriteAnchor(el)
    }
}

const showRewritePopover = () => {
    showStylePopover('rewrite')
}

/** Menu items for the AI 写作 SplitButton (改写为主按钮, 菜单含标题建议/续写/扩写/缩写) */
const writingMenuItems = computed<DropdownMenuModelItem[]>(() => [
    {
        label: t('pages.admin.posts.ai.suggest_titles'),
        icon: Sparkles,
        command: () => {
            // Get anchor via template ref for reliable DOM access
            const anchor = getWritingBtnEl()
            if (anchor) {
                const event = new MouseEvent('click', { bubbles: true })
                Object.defineProperty(event, 'currentTarget', { value: anchor, writable: false })
                emit('suggest-titles', event)
            }
        },
    },
    {
        label: t('pages.admin.posts.ai.continue'),
        icon: Forward,
        command: () => { showStylePopover('continue') },
    },
    {
        label: t('pages.admin.posts.ai.expand'),
        icon: ArrowRight,
        command: () => { showStylePopover('expand') },
    },
    {
        label: t('pages.admin.posts.ai.condense'),
        icon: ArrowLeft,
        command: () => { showStylePopover('condense') },
    },
])

/** Menu items for the AI 翻译 SplitButton */
const translateMenuItems = computed<DropdownMenuModelItem[]>(() =>
    props.locales.map((l: any) => ({
        label: l.name || l.code.toUpperCase(),
        icon: Languages,
        command: () => {
            if (l.code === post.value.language) return
            const existingTrans = props.hasTranslation(l.code)
            if (existingTrans) {
                emit('handle-translation', l.code)
            } else {
                emit('translate-content', l.code)
            }
        },
    })),
)

const handleRewriteSelect = (style: string) => {
    hideRewrite()
    const action = pendingStyleAction.value
    if (action === 'continue') {
        emit('continue-content', style)
    } else if (action === 'expand') {
        emit('expand-content', style)
    } else if (action === 'condense') {
        emit('condense-content', style)
    } else {
        emit('rewrite-content', style)
    }
}

/**
 * Handle AI 审校 click: triggers both review + perspective check (editor mode).
 * Both panels remain accessible; calls are parallel.
 */
const handleReviewClick = () => {
    emit('review-content')
    emit('perspective-check', 'editor')
}

const distributionButtonRef = ref<{ openDialog?: () => Promise<void> } | null>(null)
const lastFocusedEditorElement = ref<HTMLElement | null>(null)

const rememberFocusedEditorElement = (event: FocusEvent) => {
    const target = event.target

    if (target instanceof HTMLElement) {
        lastFocusedEditorElement.value = target
    }
}

const rememberActiveEditorElement = () => {
    const activeElement = document.activeElement

    if (activeElement instanceof HTMLElement && activeElement !== document.body) {
        lastFocusedEditorElement.value = activeElement
    }
}

const blurEditorBeforeTranslation = async () => {
    const activeElement = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const candidate = activeElement && activeElement !== document.body
        ? activeElement
        : lastFocusedEditorElement.value

    if (candidate && candidate.isConnected) {
        candidate.blur()
        await nextTick()
    }
}

const onTranslationBadgeMousedown = (langCode: string, event: MouseEvent) => {
    if (props.hasUnsavedContent) {
        event.stopPropagation()
        event.preventDefault()
        toast.show({
            tone: 'warning',
            title: t('common.warn'),
            description: t('pages.admin.posts.save_current_first'),
            duration: 3000,
        })
    }
}

const onTranslationBadgeClick = async (langCode: string) => {
    await blurEditorBeforeTranslation()

    emit('handle-translation', langCode)
}

const handleFormatMarkdown = async () => {
    if (post.value.content) {
        post.value.content = await formatMarkdown(post.value.content)
    }
}

defineExpose({
    titleOp,
    openDistribution: async () => {
        await distributionButtonRef.value?.openDialog?.()
    },
})
</script>

<style lang="scss" scoped>
@use './post-editor-header-toolbar' as *;

/* `CaomeiPopoverTrigger` 会给触发器元素套上默认的按钮外观（边框 / 背景 / 最小尺寸）。
 * 本文件的两个锚点只用于固定定位承接 `useAnchoredPopover()` 的坐标，首帧尚无内联尺寸，
 * 不加复位会在顶栏留下两个 26×36 的空盒子（迁移前 PrimeVue `Popover.show(target)` 无触发器元素）。 */
.rewrite-popover-anchor,
.title-popover-anchor {
    width: 0;
    height: 0;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: hidden;
}

.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    height: 4rem;
    background-color: var(--caomei-color-bg);
    flex-shrink: 0;
    position: relative;
    z-index: 200;

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

    &__voice-trigger {
        min-width: auto;
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
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    font-weight: 700;
    user-select: none;

    &:hover {
        opacity: 0.8;
    }

    &--active {
        box-shadow: 0 0 0 2px var(--m-surface-200);
    }

    &--missing {
        opacity: 0.4;
        background-color: transparent !important;
        color: var(--caomei-color-text-muted) !important;
    }

    &--disabled {
        pointer-events: none;
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.status-tag {
    font-weight: 600;
}

.title-input {
    font-size: 1.25rem;
    font-weight: 700;
    flex: 1;
    min-width: 8rem;
    border: none;
    box-shadow: none;
    background: transparent;

    &:focus {
        box-shadow: none;
    }
}

.saving-text {
    font-size: 0.875rem;
    color: var(--m-surface-500);
    margin-right: 0.5rem;
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
        }

        & + & {
        }
    }
}

.rewrite-menu {
    &__content {
        min-width: 220px;
        padding: 0.5rem;
    }

    &__title {
        font-size: 0.875rem;
        font-weight: 600;
        padding: 0.5rem 0.75rem;
        color: var(--caomei-color-text-muted);
        margin-bottom: 0.25rem;
    }

    &__item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
        }

        &:last-child {
            margin-bottom: 0;
        }
    }

    &__item-icon {
        font-size: 1.1rem;
        margin-top: 0.125rem;
        color: var(--caomei-color-primary);
    }

    &__item-text {
        flex: 1;
    }

    &__item-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--caomei-color-text);
    }

    &__item-desc {
        font-size: 0.75rem;
        color: var(--caomei-color-text-muted);
        margin-top: 0.125rem;
        line-height: 1.4;
    }
}

:global(.dark) {
    .rewrite-menu {
        &__item:hover {
            background-color: var(--m-surface-800);
        }
    }
}

.pulse-animation {
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.2);
        opacity: 0.7;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
