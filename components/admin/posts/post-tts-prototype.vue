<!--
  TTS 前端直出原型组件 (原型) — 仅火山引擎

  用途: 展示"前端调火山 TTS API（JWT 鉴权）→ 解析音频 → 直传 OSS"的最小闭环。
        独立于现有 post-tts-dialog.vue，仅用于原型验证，不进入生产 UI。
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import { useTTSVolcengineDirect } from '@/composables/use-tts-volcengine-direct'
import type { TTSVolcengineDirectParams } from '@/composables/use-tts-volcengine-direct'

const props = defineProps<{
    content: string
    postId?: string | null
    language?: string
}>()

const emit = defineEmits<{
    (e: 'completed', payload: { audioUrl: string }): void
}>()

const { t } = useI18n()
const visible = defineModel<boolean>('visible', { default: false })

// ---- 参数选择 ----
const voice = ref<string>('zh_female_shuangkuaisisi_moon_bigtts')

const voiceOptions = [
    { label: 'Vivi 2.0 (女声)', value: 'zh_female_vv_uranus_bigtts' },
    { label: '小何 2.0 (女声)', value: 'zh_female_xiaohe_uranus_bigtts' },
    { label: '云舟 2.0 (男声)', value: 'zh_male_m191_uranus_bigtts' },
    { label: 'Tim (英-男)', value: 'en_male_tim_uranus_bigtts' },
    { label: 'Dacey (英-女)', value: 'en_female_dacey_uranus_bigtts' },
    { label: '灿灿 Mars (女声)', value: 'saturn_zh_female_cancan_mars_bigtts' },
    { label: '爽朗少年 (男声)', value: 'saturn_zh_male_shuanglangshaonian_tob' },
    { label: '知性灿灿 (女声)', value: 'saturn_zh_female_cancan_tob' },
]

// ---- TTS 直连 ----
const {
    progress,
    error: ttsError,
    isGenerating,
    generateAndUpload,
} = useTTSVolcengineDirect()

const resultAudioUrl = ref<string | null>(null)

async function handleGenerate() {
    resultAudioUrl.value = null

    const params: TTSVolcengineDirectParams = {
        mode: 'speech',
        text: props.content,
        voice: voice.value,
        speed: 1.0,
        volume: 1.0,
        language: props.language,
        postId: props.postId ?? null,
    }

    try {
        const result = await generateAndUpload(params)
        resultAudioUrl.value = result.audioUrl
    } catch {
        // 错误已在 composable 内通过 toast 展示
    }
}

function handleConfirm() {
    if (resultAudioUrl.value) {
        emit('completed', { audioUrl: resultAudioUrl.value })
    }
    visible.value = false
}

function handleCancel() {
    resultAudioUrl.value = null
    visible.value = false
}

const isCompleted = computed(() => progress.value === 100 && resultAudioUrl.value !== null)
</script>

<template>
    <Dialog
        v-model:visible="visible"
        :header="t('admin.post.tts.generate_title') + ' [原型]'"
        :modal="true"
        :style="{ width: '520px' }"
        :draggable="false"
        @hide="handleCancel"
    >
        <div class="tts-prototype">
            <!-- 音色选择 -->
            <div class="tts-prototype__field">
                <label class="tts-prototype__label">{{ t('admin.post.tts.voice') }}</label>
                <Select
                    v-model="voice"
                    :options="voiceOptions"
                    option-label="label"
                    option-value="value"
                    :disabled="isGenerating"
                    class="tts-prototype__select"
                />
            </div>

            <!-- 合成文本预览 -->
            <div class="tts-prototype__field">
                <label class="tts-prototype__label">{{ t('admin.post.tts.manuscript') }}</label>
                <Textarea
                    :model-value="content"
                    :rows="4"
                    readonly
                    auto-resize
                    class="tts-prototype__textarea"
                />
            </div>

            <!-- 进度 & 错误 -->
            <div v-if="isGenerating || ttsError" class="tts-prototype__status">
                <ProgressBar
                    v-if="progress > 0 && progress < 100"
                    :value="progress"
                    class="tts-prototype__progress"
                />
                <Message
                    v-if="ttsError"
                    severity="error"
                    :closable="false"
                >
                    {{ ttsError }}
                </Message>
            </div>

            <!-- 音频预览 -->
            <div v-if="isCompleted" class="tts-prototype__preview">
                <Message severity="success" :closable="false">
                    {{ t('admin.post.tts.completed') }}
                </Message>
                <audio
                    v-if="resultAudioUrl"
                    :src="resultAudioUrl"
                    controls
                    class="tts-prototype__audio"
                />
            </div>

            <!-- 提示 -->
            <Message
                v-if="!isGenerating && !isCompleted && !ttsError"
                severity="info"
                :closable="false"
            >
                火山引擎 JWT 直连：前端获取临时凭证后直调火山 TTS API，浏览器接收音频并直传 OSS。
            </Message>
        </div>

        <template #footer>
            <Button
                :label="t('common.cancel')"
                severity="secondary"
                :disabled="isGenerating"
                @click="handleCancel"
            />
            <Button
                v-if="!isCompleted"
                :label="isGenerating ? `${t('admin.post.tts.processing')} (${progress}%)` : t('admin.post.tts.start_generate')"
                :loading="isGenerating"
                :disabled="isGenerating || !content"
                @click="handleGenerate"
            />
            <Button
                v-else
                :label="t('admin.post.tts.attach_success')"
                @click="handleConfirm"
            />
        </template>
    </Dialog>
</template>

<style lang="scss" scoped>
.tts-prototype {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);

    &__field {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-1);
    }

    &__label {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--text-color-secondary);
    }

    &__select {
        width: 100%;
    }

    &__textarea {
        width: 100%;
        font-size: var(--font-size-sm);
    }

    &__status {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2);
    }

    &__progress {
        height: 8px;
    }

    &__preview {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-3);
    }

    &__audio {
        width: 100%;
        height: 40px;
    }
}
</style>
