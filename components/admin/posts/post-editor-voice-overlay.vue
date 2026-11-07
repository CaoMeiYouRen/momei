<template>
    <CaomeiPopover
        :open="open"
        @update:open="open = $event"
    >
        <CaomeiPopoverTrigger as-child>
            <span
                class="voice-popover-anchor"
                :style="anchorStyle"
                aria-hidden="true"
            />
        </CaomeiPopoverTrigger>
        <CaomeiPopoverContent
            side="bottom"
            align="end"
            class="voice-popover"
        >
            <div class="voice-popover__card">
                <div class="voice-popover__header">
                    <span class="voice-popover__title">
                        <Mic
                            :size="18"
                            class="voice-popover__icon"
                            :class="{'voice-popover__icon--listening': isListening}"
                        />
                        {{ isListening ? $t('common.voice.listening') : $t('pages.admin.posts.ai.voice_input') }}
                    </span>
                    <CaomeiSelectButton
                        :model-value="internalMode"
                        :options="modeOptions"
                        option-label="label"
                        option-value="value"
                        size="sm"
                        :disabled="isListening"
                        @update:model-value="onModeChange"
                    />
                </div>

                <div class="voice-popover__content">
                    <div v-if="isLoadingModel" class="voice-popover__loading">
                        <span class="mb-2 text-sm">{{ $t('pages.admin.posts.ai.voice_model_loading') }}</span>
                        <CaomeiProgressBar
                            :value="Math.round(modelProgress)"
                            class="w-full"
                            style="height: 6px"
                        />
                    </div>
                    <!-- 模型确认对话框区域 -->
                    <div v-else-if="showLoadConfirm" class="voice-popover__confirm-panel">
                        <div class="flex font-bold gap-2 items-center mb-2 text-orange-500">
                            <Info :size="16" />
                            <span>{{ $t('pages.admin.posts.ai.voice_load_confirm_title') }}</span>
                        </div>
                        <p class="leading-relaxed mb-4 opacity-80 text-sm">
                            {{ confirmMessage }}
                        </p>
                        <div class="flex gap-2 justify-end">
                            <CaomeiButton
                                variant="ghost"
                                tone="neutral"
                                size="sm"
                                @click="internalMode = 'web-speech'"
                            >
                                {{ $t('common.cancel') }}
                            </CaomeiButton>
                            <CaomeiButton
                                size="sm"
                                @click="handleLoadModel"
                            >
                                {{ $t('pages.admin.posts.ai.voice_load_confirm_btn') }}
                            </CaomeiButton>
                        </div>
                    </div>
                    <div v-else-if="error" class="voice-popover__error">
                        <CircleAlert :size="16" />
                        <span>{{ errorText }}</span>
                        <CaomeiButton
                            variant="ghost"
                            tone="neutral"
                            size="sm"
                            @click="$emit('retry')"
                        >
                            {{ $t('pages.admin.posts.ai.voice_retry') }}
                        </CaomeiButton>
                    </div>
                    <div v-else class="voice-popover__transcript">
                        <span class="voice-popover__final">{{ finalTranscript }}</span>
                        <span class="voice-popover__interim">{{ interimTranscript }}</span>
                        <div
                            v-if="!finalTranscript && !interimTranscript && isListening"
                            class="voice-popover__placeholder"
                        >
                            ...
                        </div>
                        <div
                            v-if="!isListening && !finalTranscript && !interimTranscript && mode !== 'web-speech'"
                            class="voice-popover__placeholder"
                        >
                            {{ $t('pages.admin.posts.ai.voice_model_ready') }}
                        </div>
                    </div>
                </div>

                <div class="voice-popover__footer">
                    <template v-if="isListening">
                        <CaomeiButton
                            tone="danger"
                            @click="$emit('stop')"
                        >
                            <template #icon>
                                <CircleStop :size="16" />
                            </template>
                            {{ $t('common.voice.stop') }}
                        </CaomeiButton>
                    </template>
                    <template v-else-if="finalTranscript">
                        <AppTooltip :content="$t('pages.admin.posts.ai.voice_retry')">
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                tone="neutral"
                                :label="$t('pages.admin.posts.ai.voice_retry')"
                                @click="$emit('retry')"
                            >
                                <template #icon>
                                    <RefreshCw :size="16" />
                                </template>
                            </CaomeiButton>
                        </AppTooltip>
                        <CaomeiButton
                            variant="secondary"
                            tone="neutral"
                            @click="$emit('insert', finalTranscript)"
                        >
                            {{ $t('pages.admin.posts.ai.voice_insert') }}
                        </CaomeiButton>
                        <CaomeiButton
                            :loading="refining"
                            @click="$emit('refine', finalTranscript)"
                        >
                            <template #icon>
                                <Sparkles :size="16" />
                            </template>
                            {{ $t('pages.admin.posts.ai.voice_refine_insert') }}
                        </CaomeiButton>
                        <CaomeiButton
                            tone="primary"
                            variant="secondary"
                            :loading="refining"
                            @click="$emit('scaffold', finalTranscript)"
                        >
                            <template #icon>
                                <List :size="16" />
                            </template>
                            {{ $t('pages.admin.posts.ai.voice_scaffold_insert') }}
                        </CaomeiButton>
                    </template>
                    <template v-else>
                        <CaomeiButton
                            :loading="isLoadingModel"
                            :disabled="isLoadingModel || (mode !== 'web-speech' && !isModelReady) || showLoadConfirm"
                            @click="$emit('start')"
                        >
                            <template #icon>
                                <Mic :size="16" />
                            </template>
                            {{ $t('common.voice.start_record') }}
                        </CaomeiButton>
                    </template>
                </div>
            </div>
        </CaomeiPopoverContent>
    </CaomeiPopover>
</template>

<script setup lang="ts">
import { CircleAlert, CircleStop, Info, List, Mic, RefreshCw, Sparkles } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useAnchoredPopover } from '@/composables/use-anchored-popover'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    isListening: boolean
    interimTranscript: string
    finalTranscript: string
    error: string
    refining: boolean
    mode: 'web-speech' | 'cloud-batch' | 'cloud-stream'
    isLoadingModel: boolean
    modelProgress: number
    isModelReady: boolean
    cloudConfig: {
        enabled: boolean
        siliconflow: boolean
        volcengine: boolean
    }
}>()

const emit = defineEmits(['stop', 'retry', 'insert', 'refine', 'scaffold', 'hide', 'update:mode', 'start', 'load-model'])

const { t } = useI18n()
const { open, anchorStyle, show, hide, toggle } = useAnchoredPopover()

const internalMode = ref(props.mode)

watch(open, (value) => {
    if (!value) {
        emit('hide')
    }
})
const onModeChange = (value: string | number | Array<string | number> | undefined) => {
    if (typeof value === 'string') {
        internalMode.value = value as typeof internalMode.value
    }
}

watch(() => props.mode, (newMode) => {
    internalMode.value = newMode as any
})
watch(internalMode, (newMode) => {
    emit('update:mode', newMode)
})

const modeOptions = computed(() => {
    const options = [
        { label: t('common.voice.mode_basic'), value: 'web-speech' },
    ]

    if (props.cloudConfig?.siliconflow) {
        options.push({ label: t('pages.admin.posts.ai.voice_mode_cloud_batch'), value: 'cloud-batch' })
    }

    if (props.cloudConfig?.volcengine) {
        options.push({ label: t('pages.admin.posts.ai.voice_mode_cloud_stream'), value: 'cloud-stream' })
    }

    return options
})

const showLoadConfirm = computed(() => {
    return false // No longer need local model loading confirm
})

const confirmMessage = computed(() => {
    return ''
})

const handleLoadModel = () => {
    emit('load-model')
}

defineExpose({
    toggle,
    show,
    hide,
})

const errorText = computed(() => {
    if (props.error === 'permission_denied') {
        return t('pages.admin.posts.ai.voice_permission_denied')
    }
    return t('pages.admin.posts.ai.voice_error')
})
</script>

<style lang="scss" scoped>

@use "@/styles/voice-popover" as *;

/* `CaomeiPopoverTrigger` 会给触发器元素套上默认的按钮外观（边框 / 背景 / 最小尺寸）。
 * 本文件的锚点只用于固定定位承接 `useAnchoredPopover()` 的坐标，首帧尚无内联尺寸，
 * 不加复位会在顶栏留下两个 26×36 的空盒子（迁移前 PrimeVue `Popover.show(target)` 无触发器元素）。 */
.voice-popover-anchor {
    width: 0;
    height: 0;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: hidden;
}

.voice-popover {
    &__confirm-panel {
        padding: 0.25rem;
        display: flex;
        flex-direction: column;
    }
}
</style>
