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
                <Button
                    id="ai-title-btn"
                    v-tooltip="$t('pages.admin.posts.ai.suggest_titles')"
                    icon="pi pi-sparkles"
                    text
                    outlined
                    :loading="aiLoading.title"
                    @click="emit('suggest-titles', $event)"
                />
                <Button
                    id="ai-rewrite-btn"
                    v-tooltip="$t('pages.admin.posts.ai.rewrite_tooltip')"
                    icon="pi pi-pencil"
                    text
                    outlined
                    :loading="aiLoading.rewrite"
                    @click="rewriteOp.toggle($event)"
                />
                <Button
                    id="ai-review-btn"
                    v-tooltip="$t('pages.admin.posts.ai.review')"
                    icon="pi pi-search"
                    text
                    outlined
                    :loading="aiLoading.review"
                    :badge="reviewSuggestions.length > 0 ? String(reviewSuggestions.length) : undefined"
                    @click="emit('review-content')"
                />
                <Button
                    id="ai-translate-btn"
                    v-tooltip="$t('pages.admin.posts.ai.translate')"
                    icon="pi pi-language"
                    text
                    outlined
                    :loading="aiLoading.translate"
                    @click="translateOp.toggle($event)"
                />
                <Button
                    id="format-markdown-btn"
                    v-tooltip="$t('pages.admin.posts.ai.format_markdown')"
                    icon="pi pi-align-left"
                    text
                    outlined
                    @click="handleFormatMarkdown"
                />
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
            <Popover ref="translateOp" class="translate-menu">
                <div class="translate-menu__content">
                    <div
                        v-for="l in locales"
                        :key="l.code"
                        class="translate-menu__item"
                        :class="{
                            'translate-menu__item--active':
                                post.language === l.code
                        }"
                        @click="handleTranslateSelection(l.code)"
                    >
                        <div class="translate-menu__item-left">
                            <i
                                :class="getLangIcon(l.code)"
                                class="translate-menu__flag"
                            />
                            <span class="translate-menu__lang-name">{{
                                l.name || l.code.toUpperCase()
                            }}</span>
                        </div>
                        <div class="translate-menu__item-right">
                            <Tag
                                v-if="post.language === l.code"
                                :value="$t('common.current')"
                                severity="info"
                                size="small"
                                class="translate-menu__status-tag"
                            />
                            <Tag
                                v-else-if="hasTranslation(l.code)"
                                :value="$t('common.switch')"
                                severity="success"
                                size="small"
                                class="translate-menu__status-tag"
                            />
                            <Tag
                                v-else
                                :value="$t('common.ai_translate')"
                                severity="warn"
                                size="small"
                                class="translate-menu__status-tag"
                            />
                        </div>
                    </div>
                    <Divider class="my-2" />
                    <div class="translate-menu__footer">
                        <Button
                            :label="
                                $t('pages.admin.posts.ai.translate_current')
                            "
                            icon="pi pi-sparkles"
                            text
                            size="small"
                            class="translate-menu__footer-btn"
                            @click="handleTranslateSelection(null)"
                        />
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
    </div>
</template>

<script setup lang="ts">
import { formatMarkdown } from '@/utils/shared/markdown-formatter'
import PostEditorReviewPanel from '@/components/admin/posts/post-editor-review-panel.vue'

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
    (e: 'update:review-panel-visible', visible: boolean): void
}>()

const localePath = useLocalePath()

const titleOp = ref<any>(null)
const translateOp = ref<any>(null)
const rewriteOp = ref<any>(null)

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

const handleTranslateSelection = (langCode: string | null) => {
    translateOp.value?.hide()
    if (langCode === null) {
        emit('translate-content', null)
        return
    }

    if (langCode === post.value.language) return

    const existingTrans = props.hasTranslation(langCode)
    if (existingTrans) {
        emit('handle-translation', langCode)
    } else {
        emit('translate-content', langCode)
    }
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
}

.status-tag {
    font-weight: 600;
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

.translate-menu {
    &__content {
        min-width: 220px;
        padding: 0.25rem;
    }

    &__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.625rem 0.75rem;
        border-radius: var(--p-border-radius-md);
        cursor: pointer;
        transition: all 0.2s ease;
        gap: 1.5rem;

        &:hover {
            background-color: var(--p-surface-100);
        }

        &--active {
            background-color: var(--p-primary-50);
            cursor: default;

            &:hover {
                background-color: var(--p-primary-50);
            }
        }
    }

    &__item-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    &__flag {
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
    }

    &__lang-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--p-surface-900);
    }

    &__status-tag {
        font-size: 0.7rem;
        padding: 0.15rem 0.4rem;
        font-weight: 600;
    }

    &__footer {
        padding-top: 0.25rem;
    }

    &__footer-btn {
        width: 100%;
        justify-content: flex-start;
        font-weight: 500;
        color: var(--p-primary-color);
        padding: 0.5rem 0.75rem;

        &:hover {
            background-color: var(--p-primary-50);
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
    .translate-menu {
        &__item:hover {
            background-color: var(--p-surface-800);
        }

        &__item--active {
            background-color: var(--p-primary-900-opacity-20);
        }

        &__lang-name {
            color: var(--p-surface-100);
        }

        &__footer-btn:hover {
            background-color: var(--p-primary-900-opacity-20);
        }
    }

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
