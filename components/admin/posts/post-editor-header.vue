<template>
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
                @focus="rememberFocusedEditorElement"
            />
            <ButtonGroup class="ai-tools-group">
                <!-- AI 写作 SplitButton: 主按钮→改写风格选择, 下拉→标题建议/续写/扩写/缩写 -->
                <SplitButton
                    id="ai-writing-btn"
                    ref="writingBtnRef"
                    v-tooltip="$t('pages.admin.posts.ai.ai_writing')"
                    icon="pi pi-pencil"
                    text
                    outlined
                    :loading="writingLoading"
                    :model="writingMenuItems"
                    @click="showRewritePopover"
                />
                <!-- AI 审校: 触发审查 + 视角检查（编辑视角） -->
                <Button
                    id="ai-review-btn"
                    v-tooltip="$t('pages.admin.posts.ai.review')"
                    icon="pi pi-search"
                    text
                    outlined
                    :loading="aiLoading.review || aiLoading.perspective"
                    :badge="reviewSuggestions.length > 0 ? String(reviewSuggestions.length) : undefined"
                    @click="handleReviewClick"
                />
                <!-- AI 翻译: SplitButton with language selection -->
                <SplitButton
                    id="ai-translate-btn"
                    v-tooltip="$t('pages.admin.posts.ai.translate')"
                    icon="pi pi-language"
                    text
                    outlined
                    :loading="aiLoading.translate"
                    :model="translateMenuItems"
                    @click="emit('translate-content', null)"
                />
                <!-- 格式化 Markdown -->
                <Button
                    id="format-markdown-btn"
                    v-tooltip="$t('pages.admin.posts.ai.format_markdown')"
                    icon="pi pi-align-left"
                    text
                    outlined
                    @click="handleFormatMarkdown"
                />
                <!-- 语音输入 -->
                <AppVoiceInputTrigger
                    id="ai-voice-btn"
                    v-model="post.content"
                    :language="post.language"
                    :show-refine-action="true"
                    button-class="top-bar__voice-trigger"
                />
            </ButtonGroup>
            <Popover ref="rewriteOp" class="rewrite-menu">
                <div class="rewrite-menu__content">
                    <div class="rewrite-menu__title">
                        {{ $t('pages.admin.posts.ai.rewrite_style_title') }}
                    </div>
                    <div
                        v-for="style in rewriteStyles"
                        :key="style.value"
                        class="rewrite-menu__item"
                        @click="handleRewriteSelect(style.value as string)"
                    >
                        <i :class="style.icon" class="rewrite-menu__item-icon" />
                        <div class="rewrite-menu__item-text">
                            <div class="rewrite-menu__item-label">
                                {{ style.label }}
                            </div>
                            <div class="rewrite-menu__item-desc">
                                {{ style.desc }}
                            </div>
                        </div>
                    </div>
                </div>
            </Popover>
            <Popover ref="titleOp" class="title-suggestions-panel">
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
            </Popover>
            <small v-if="errors.title" class="p-error">{{
                errors.title
            }}</small>
        </div>
        <div class="top-bar-right">
            <div class="mr-4 translation-status-bar">
                <Tag
                    v-for="l in locales"
                    :key="l.code"
                    v-tooltip="l.name"
                    :value="l.code.toUpperCase()"
                    :severity="post.language === l.code ? 'success' : 'secondary'"
                    class="translation-badge"
                    :class="{
                        'translation-badge--active': post.language === l.code,
                        'translation-badge--missing': !hasTranslation(l.code),
                        'translation-badge--disabled': props.hasUnsavedContent
                    }"
                    @mousedown.capture="rememberActiveEditorElement(); onTranslationBadgeMousedown(l.code, $event)"
                    @click="onTranslationBadgeClick(l.code)"
                />
            </div>
            <Tag
                v-if="post.status"
                :value="getStatusLabel(post.status)"
                :severity="getStatusSeverity(post.status)"
                class="mr-2 status-tag"
            />
            <span v-if="saving" class="saving-text">{{
                $t("common.saving")
            }}</span>
            <AdminPostsPostDistributionButton ref="distributionButtonRef" :post="post" />
            <slot name="audit" />
            <Button
                v-if="!isNew || post.id"
                :label="$t('common.preview')"
                icon="pi pi-external-link"
                text
                @click="emit('preview')"
            />
            <Button
                :label="$t('common.save')"
                icon="pi pi-save"
                text
                :loading="saving"
                @click="emit('save', false)"
            />
            <Button
                :label="publishButtonLabel"
                icon="pi pi-send"
                :loading="saving"
                severity="contrast"
                @click="emit('save', true)"
            />
            <Button
                v-tooltip="$t('common.drag_drop_help')"
                icon="pi pi-info-circle"
                text
                rounded
                severity="secondary"
            />
            <Button
                v-if="!isNew || post.id"
                v-tooltip="$t('pages.admin.posts.history_versions')"
                icon="pi pi-history"
                text
                rounded
                @click="emit('open-history')"
            />
            <Button
                v-tooltip="$t('common.settings')"
                icon="pi pi-cog"
                text
                rounded
                @click="emit('open-settings')"
            />
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
            @close="emit('update:perspective-panel-visible', false)"
            @switch-mode="(mode) => emit('perspective-check', mode)"
        />
    </div>
</template>

<script setup lang="ts">
import { formatMarkdown } from '@/utils/shared/markdown-formatter'
import PostEditorReviewPanel from '@/components/admin/posts/post-editor-review-panel.vue'
import PostEditorPerspectivePanel from '@/components/admin/posts/post-editor-perspective-panel.vue'
import type { PerspectiveMode, PerspectiveCheckItem } from '@/types/ai'
import type { MenuItem } from 'primevue/menuitem'

const post = defineModel<any>('post', { required: true })

const { t } = useI18n()
const { isFuture } = useI18nDate()

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
    (e: 'continue-content'): void
    (e: 'expand-content'): void
    (e: 'condense-content'): void
    (e: 'update:review-panel-visible', visible: boolean): void
    (e: 'update:perspective-panel-visible', visible: boolean): void
}>()

const localePath = useLocalePath()

const titleOp = ref<any>(null)
const rewriteOp = ref<any>(null)
const writingBtnRef = ref<any>(null)

/** True when any AI writing operation is loading */
const writingLoading = computed(() =>
    props.aiLoading.title || props.aiLoading.rewrite || props.aiLoading.continue
    || props.aiLoading.expand || props.aiLoading.condense,
)

/** Get the AI Writing SplitButton's root DOM element via template ref */
const getWritingBtnEl = (): HTMLElement | null => {
    return (writingBtnRef.value as any)?.$el ?? document.getElementById('ai-writing-btn')
}

/**
 * Show the rewrite style Popover anchored to the AI Writing SplitButton.
 * Uses the template ref for reliable DOM access.
 */
const showRewritePopover = () => {
    const el = getWritingBtnEl()
    if (el) {
        const event = new MouseEvent('click', { bubbles: true })
        Object.defineProperty(event, 'currentTarget', { value: el, writable: false })
        rewriteOp.value?.show?.(event, el)
    }
}

/** Menu items for the AI 写作 SplitButton (改写为主按钮, 菜单含标题建议/续写/扩写/缩写) */
const writingMenuItems = computed<MenuItem[]>(() => [
    {
        label: t('pages.admin.posts.ai.suggest_titles'),
        icon: 'pi pi-sparkles',
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
        icon: 'pi pi-forward',
        command: () => { emit('continue-content') },
    },
    {
        label: t('pages.admin.posts.ai.expand'),
        icon: 'pi pi-arrow-right',
        command: () => { emit('expand-content') },
    },
    {
        label: t('pages.admin.posts.ai.condense'),
        icon: 'pi pi-arrow-left',
        command: () => { emit('condense-content') },
    },
])

/** Menu items for the AI 翻译 SplitButton */
const translateMenuItems = computed<MenuItem[]>(() =>
    props.locales.map((l: any) => ({
        label: l.name || l.code.toUpperCase(),
        icon: getLangIcon(l.code),
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

const rewriteStyles = [
    {
        value: 'casual' as const,
        icon: 'pi pi-comments',
        label: t('pages.admin.posts.ai.rewrite_style_casual'),
        desc: t('pages.admin.posts.ai.rewrite_style_casual_desc'),
    },
    {
        value: 'formal' as const,
        icon: 'pi pi-building',
        label: t('pages.admin.posts.ai.rewrite_style_formal'),
        desc: t('pages.admin.posts.ai.rewrite_style_formal_desc'),
    },
    {
        value: 'academic' as const,
        icon: 'pi pi-book',
        label: t('pages.admin.posts.ai.rewrite_style_academic'),
        desc: t('pages.admin.posts.ai.rewrite_style_academic_desc'),
    },
    {
        value: 'technical' as const,
        icon: 'pi pi-cog',
        label: t('pages.admin.posts.ai.rewrite_style_technical'),
        desc: t('pages.admin.posts.ai.rewrite_style_technical_desc'),
    },
    {
        value: 'creative' as const,
        icon: 'pi pi-palette',
        label: t('pages.admin.posts.ai.rewrite_style_creative'),
        desc: t('pages.admin.posts.ai.rewrite_style_creative_desc'),
    },
    {
        value: 'concise' as const,
        icon: 'pi pi-compass',
        label: t('pages.admin.posts.ai.rewrite_style_concise'),
        desc: t('pages.admin.posts.ai.rewrite_style_concise_desc'),
    },
]

const handleRewriteSelect = (style: string) => {
    rewriteOp.value?.hide()
    emit('rewrite-content', style)
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
        const toast = useToast()
        toast.add({
            severity: 'warn',
            summary: t('common.warn'),
            detail: t('pages.admin.posts.save_current_first'),
            life: 3000,
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

const getLangIcon = (code: string) => {
    if (code.startsWith('zh')) return 'fi fi-cn'
    if (code.startsWith('en')) return 'fi fi-us'
    if (code.startsWith('ja')) return 'fi fi-jp'
    return 'pi pi-globe'
}

defineExpose({
    titleOp,
    openDistribution: async () => {
        await distributionButtonRef.value?.openDialog?.()
    },
})
</script>

<style lang="scss" scoped>
.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    height: 4rem;
    border-bottom: 1px solid var(--p-surface-border);
    background-color: var(--p-surface-card);
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
        box-shadow: 0 0 0 2px var(--p-surface-200);
    }

    &--missing {
        opacity: 0.4;
        background-color: transparent !important;
        border: 1px dashed var(--p-surface-border) !important;
        color: var(--p-text-muted-color) !important;
    }

    &--disabled {
        pointer-events: none;
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.ai-tools-group {
    margin-left: 0.5rem;
    flex-shrink: 0;
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
    color: var(--p-surface-500);
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
            background-color: var(--p-surface-hover);
        }

        & + & {
            border-top: 1px solid var(--p-surface-border);
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
        color: var(--p-text-muted-color);
        border-bottom: 1px solid var(--p-surface-border);
        margin-bottom: 0.25rem;
    }

    &__item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        border-radius: var(--p-border-radius-md);
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
            background-color: var(--p-surface-hover);
        }

        &:last-child {
            margin-bottom: 0;
        }
    }

    &__item-icon {
        font-size: 1.1rem;
        margin-top: 0.125rem;
        color: var(--p-primary-color);
    }

    &__item-text {
        flex: 1;
    }

    &__item-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--p-text-color);
    }

    &__item-desc {
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
        margin-top: 0.125rem;
        line-height: 1.4;
    }
}

:global(.dark) {
    .rewrite-menu {
        &__item:hover {
            background-color: var(--p-surface-800);
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
