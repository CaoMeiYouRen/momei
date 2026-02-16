<template>
    <div class="settings-form">
        <div class="form-field">
            <label for="ai_provider" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.ai_provider') }}
                <i
                    v-if="metadata.ai_provider?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <Select
                id="ai_provider"
                v-model="settings.ai_provider"
                :options="aiProviders"
                :disabled="metadata.ai_provider?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="ai_model" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.ai_model') }}
                <i
                    v-if="metadata.ai_model?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="ai_model"
                v-model="settings.ai_model"
                :disabled="metadata.ai_model?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="ai_api_key" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.ai_api_key') }}
                <i
                    v-if="metadata.ai_api_key?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <Password
                id="ai_api_key"
                v-model="settings.ai_api_key"
                :disabled="metadata.ai_api_key?.isLocked"
                :toggle-mask="true"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="ai_endpoint" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.ai_endpoint') }}
                <i
                    v-if="metadata.ai_endpoint?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="ai_endpoint"
                v-model="settings.ai_endpoint"
                :disabled="metadata.ai_endpoint?.isLocked"
                fluid
            />
        </div>

        <Divider />

        <div class="form-field-sticky mb-6">
            <div class="flex items-center justify-between">
                <div class="flex flex-col gap-1">
                    <span class="font-bold text-lg">{{ $t('pages.admin.settings.system.keys.ai_image_title') }}</span>
                    <span class="text-sm text-surface-500">{{ $t('pages.admin.settings.system.keys.ai_image_description') }}</span>
                </div>
                <InputSwitch
                    id="ai_image_enabled"
                    v-model="settings.ai_image_enabled"
                    :disabled="metadata.ai_image_enabled?.isLocked"
                />
            </div>
        </div>

        <div v-if="settings.ai_image_enabled" class="ai-image-settings">
            <div class="form-field">
                <label for="ai_image_provider" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.ai_image_provider') }}
                    <i
                        v-if="metadata.ai_image_provider?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <Select
                    id="ai_image_provider"
                    v-model="settings.ai_image_provider"
                    :options="aiImageProviders"
                    :disabled="metadata.ai_image_provider?.isLocked"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="ai_image_model" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.ai_image_model') }}
                    <i
                        v-if="metadata.ai_image_model?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="ai_image_model"
                    v-model="settings.ai_image_model"
                    :disabled="metadata.ai_image_model?.isLocked"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="ai_image_api_key" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.ai_image_api_key') }}
                    <i
                        v-if="metadata.ai_image_api_key?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <Password
                    id="ai_image_api_key"
                    v-model="settings.ai_image_api_key"
                    :disabled="metadata.ai_image_api_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="ai_image_endpoint" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.ai_image_endpoint') }}
                    <i
                        v-if="metadata.ai_image_endpoint?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="ai_image_endpoint"
                    v-model="settings.ai_image_endpoint"
                    :disabled="metadata.ai_image_endpoint?.isLocked"
                    fluid
                />
            </div>
        </div>

        <Divider />

        <div class="form-field-sticky mb-6">
            <div class="flex items-center justify-between">
                <div class="flex flex-col gap-1">
                    <span class="font-bold text-lg">{{ $t('pages.admin.settings.system.keys.ai_asr_title') }}</span>
                    <span class="text-sm text-surface-500">{{ $t('pages.admin.settings.system.keys.ai_asr_description') }}</span>
                </div>
            </div>
        </div>

        <div class="ai-asr-settings">
            <div class="form-field">
                <label for="asr_provider" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.asr_provider') }}
                    <i
                        v-if="metadata.asr_provider?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <Select
                    id="asr_provider"
                    v-model="settings.asr_provider"
                    :options="asrProviders"
                    :disabled="metadata.asr_provider?.isLocked"
                    fluid
                />
            </div>

            <Fieldset legend="SiliconFlow (Batch)" class="mb-4">
                <div class="form-field">
                    <label for="asr_siliconflow_api_key" class="flex gap-2 items-center">
                        {{ $t('pages.admin.settings.system.keys.asr_siliconflow_api_key') }}
                        <i
                            v-if="metadata.asr_siliconflow_api_key?.isLocked"
                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                            class="pi pi-lock text-orange-500 text-xs"
                        />
                    </label>
                    <Password
                        id="asr_siliconflow_api_key"
                        v-model="settings.asr_siliconflow_api_key"
                        :disabled="metadata.asr_siliconflow_api_key?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </div>
                <div class="form-field">
                    <label for="asr_siliconflow_model" class="flex gap-2 items-center">
                        {{ $t('pages.admin.settings.system.keys.asr_siliconflow_model') }}
                        <i
                            v-if="metadata.asr_siliconflow_model?.isLocked"
                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                            class="pi pi-lock text-orange-500 text-xs"
                        />
                    </label>
                    <InputText
                        id="asr_siliconflow_model"
                        v-model="settings.asr_siliconflow_model"
                        :disabled="metadata.asr_siliconflow_model?.isLocked"
                        placeholder="FunAudioLLM/SenseVoiceSmall"
                        fluid
                    />
                </div>
            </Fieldset>

            <Fieldset legend="Volcengine (Real-time Streaming)">
                <div class="form-field">
                    <label for="asr_volcengine_app_id" class="flex gap-2 items-center">
                        {{ $t('pages.admin.settings.system.keys.asr_volcengine_app_id') }}
                        <i
                            v-if="metadata.asr_volcengine_app_id?.isLocked"
                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                            class="pi pi-lock text-orange-500 text-xs"
                        />
                    </label>
                    <InputText
                        id="asr_volcengine_app_id"
                        v-model="settings.asr_volcengine_app_id"
                        :disabled="metadata.asr_volcengine_app_id?.isLocked"
                        fluid
                    />
                </div>
                <div class="form-field">
                    <label for="asr_volcengine_access_key" class="flex gap-2 items-center">
                        {{ $t('pages.admin.settings.system.keys.asr_volcengine_access_key') }}
                        <i
                            v-if="metadata.asr_volcengine_access_key?.isLocked"
                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                            class="pi pi-lock text-orange-500 text-xs"
                        />
                    </label>
                    <InputText
                        id="asr_volcengine_access_key"
                        v-model="settings.asr_volcengine_access_key"
                        :disabled="metadata.asr_volcengine_access_key?.isLocked"
                        fluid
                    />
                </div>
                <div class="form-field">
                    <label for="asr_volcengine_secret_key" class="flex gap-2 items-center">
                        {{ $t('pages.admin.settings.system.keys.asr_volcengine_secret_key') }}
                        <i
                            v-if="metadata.asr_volcengine_secret_key?.isLocked"
                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                            class="pi pi-lock text-orange-500 text-xs"
                        />
                    </label>
                    <Password
                        id="asr_volcengine_secret_key"
                        v-model="settings.asr_volcengine_secret_key"
                        :disabled="metadata.asr_volcengine_secret_key?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </div>
            </Fieldset>
        </div>

        <Divider />

        <div class="form-field-sticky mb-6">
            <div class="flex items-center justify-between">
                <div class="flex flex-col gap-1">
                    <span class="font-bold text-lg">{{ $t('pages.admin.settings.system.keys.ai_tts_title') }}</span>
                    <span class="text-sm text-surface-500">{{ $t('pages.admin.settings.system.keys.ai_tts_description') }}</span>
                </div>
                <InputSwitch
                    id="tts_enabled"
                    v-model="settings.tts_enabled"
                    :disabled="metadata.tts_enabled?.isLocked"
                />
            </div>
        </div>

        <div v-if="settings.tts_enabled" class="ai-tts-settings">
            <div class="form-field">
                <label for="tts_provider" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.tts_provider') }}
                    <i
                        v-if="metadata.tts_provider?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <Select
                    id="tts_provider"
                    v-model="settings.tts_provider"
                    :options="ttsProviders"
                    :disabled="metadata.tts_provider?.isLocked"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="tts_api_key" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.tts_api_key') }}
                    <i
                        v-if="metadata.tts_api_key?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <Password
                    id="tts_api_key"
                    v-model="settings.tts_api_key"
                    :disabled="metadata.tts_api_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="tts_model" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.tts_model') }}
                    <i
                        v-if="metadata.tts_model?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="tts_model"
                    v-model="settings.tts_model"
                    :disabled="metadata.tts_model?.isLocked"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="tts_endpoint" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.tts_endpoint') }}
                    <i
                        v-if="metadata.tts_endpoint?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="tts_endpoint"
                    v-model="settings.tts_endpoint"
                    :disabled="metadata.tts_endpoint?.isLocked"
                    fluid
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
const aiProviders = ['openai', 'groq', 'ollama', 'anthropic', 'google']
const aiImageProviders = ['openai', 'gemini', 'stable-diffusion', 'doubao']
const asrProviders = ['siliconflow', 'volcengine']
const ttsProviders = ['openai', 'siliconflow']
</script>

<style lang="scss" scoped>
.form-field {
    margin-bottom: 1.5rem;

    label {
        display: block;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }
}
</style>
