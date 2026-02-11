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
                <Button
                    v-if="isVoiceSupported"
                    id="ai-voice-btn"
                    v-tooltip="isListening ? $t('pages.admin.posts.ai.voice_stop') : $t('pages.admin.posts.ai.voice_input')"
                    :icon="isListening ? 'pi pi-stop-circle' : 'pi pi-microphone'"
                    text
                    outlined
                    :severity="isListening ? 'danger' : 'secondary'"
                    :class="{'pulse-animation': isListening}"
                    @click="handleVoiceClick($event)"
                />
            </ButtonGroup>
            <AdminPostsPostEditorVoiceOverlay
                ref="voiceOp"
                v-model:mode="voiceMode"
                :is-listening="isListening"
                :interim-transcript="interimTranscript"
                :final-transcript="finalTranscript"
                :error="voiceError"
                :refining="refiningVoice"
                :is-loading-model="isLoadingModel"
                :model-progress="modelProgress"
                :is-model-ready="isModelReady"
                @stop="stopListening()"
                @retry="resetVoice(); startListening(post.language)"
                @insert="handleVoiceInsert"
                @refine="handleVoiceRefine"
                @hide="stopListening()"
            />
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
                        'translation-badge--missing': !hasTranslation(l.code)
                    }"
                    @click="emit('handle-translation', l.code)"
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
            <AdminPostsWechatsyncButton :post="post" :is-new="isNew" />
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
    </div>
</template>

<script setup lang="ts">
import { formatMarkdown } from '@/utils/shared/markdown'
import { usePostEditorVoice } from '@/composables/use-post-editor-voice'

const post = defineModel<any>('post', { required: true })

const { t } = useI18n()

const isScheduled = computed(() => {
    return post.value.publishedAt && new Date(post.value.publishedAt) > new Date()
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
    aiLoading: any
    titleSuggestions: string[]
}>()

const emit = defineEmits([
    'suggest-titles',
    'select-title',
    'handle-translation',
    'preview',
    'save',
    'open-settings',
    'open-history',
    'translate-content',
])

const localePath = useLocalePath()

const titleOp = ref<any>(null)
const translateOp = ref<any>(null)
const voiceOp = ref<any>(null)

const refiningVoice = ref(false)
const {
    isListening,
    isSupported: isVoiceSupported,
    interimTranscript,
    finalTranscript,
    error: voiceError,
    mode: voiceMode,
    isLoadingModel,
    modelProgress,
    isModelReady,
    startListening,
    stopListening,
    reset: resetVoice,
} = usePostEditorVoice()

const handleVoiceClick = (event: any) => {
    if (isListening.value) {
        stopListening()
    } else {
        voiceOp.value?.show(event)
        startListening(post.value.language)
    }
}

const handleVoiceInsert = (text: string) => {
    if (!text) return
    const content = post.value.content || ''
    post.value.content = content + (content.length > 0 && !content.endsWith('\n') ? '\n\n' : content.length > 0 && content.endsWith('\n') && !content.endsWith('\n\n') ? '\n' : '') + text
    voiceOp.value?.hide()
    resetVoice()
}

const handleVoiceRefine = async (text: string) => {
    if (!text) return
    refiningVoice.value = true
    try {
        const { data } = await $fetch('/api/ai/refine-voice', {
            method: 'POST',
            body: {
                content: text,
                language: post.value.language,
            },
        })
        handleVoiceInsert(data as string)
    } catch (e) {
        console.error('Refine voice error:', e)
        // Fallback to direct insert if AI fails
        handleVoiceInsert(text)
    } finally {
        refiningVoice.value = false
    }
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
