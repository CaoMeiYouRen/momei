<template>
    <div class="settings-form">
        <SettingFormField
            field-key="ai_provider"
            input-id="ai_provider"
            :metadata="metadata.ai_provider"
        >
            <Select
                id="ai_provider"
                v-model="settings.ai_provider"
                :options="aiProviders"
                :disabled="metadata.ai_provider?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="ai_model"
            input-id="ai_model"
            :metadata="metadata.ai_model"
        >
            <InputText
                id="ai_model"
                v-model="settings.ai_model"
                :disabled="metadata.ai_model?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="ai_api_key"
            input-id="ai_api_key"
            :metadata="metadata.ai_api_key"
        >
            <Password
                id="ai_api_key"
                v-model="settings.ai_api_key"
                :disabled="metadata.ai_api_key?.isLocked"
                :toggle-mask="true"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="ai_endpoint"
            input-id="ai_endpoint"
            :metadata="metadata.ai_endpoint"
        >
            <InputText
                id="ai_endpoint"
                v-model="settings.ai_endpoint"
                :disabled="metadata.ai_endpoint?.isLocked"
                fluid
            />
        </SettingFormField>

        <Divider class="my-8" />

        <SettingFormField
            input-id="ai_image_enabled"
            :label="$t('pages.admin.settings.system.keys.ai_image_title')"
            :description="$t('pages.admin.settings.system.keys.ai_image_description')"
            :metadata="metadata.ai_image_enabled"
            inline
        >
            <ToggleSwitch
                id="ai_image_enabled"
                v-model="settings.ai_image_enabled"
                :disabled="metadata.ai_image_enabled?.isLocked"
            />
        </SettingFormField>

        <div v-if="settings.ai_image_enabled" class="ai-settings__group">
            <SettingFormField
                field-key="ai_image_provider"
                input-id="ai_image_provider"
                :metadata="metadata.ai_image_provider"
            >
                <Select
                    id="ai_image_provider"
                    v-model="settings.ai_image_provider"
                    :options="aiImageProviders"
                    :disabled="metadata.ai_image_provider?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="ai_image_model"
                input-id="ai_image_model"
                :metadata="metadata.ai_image_model"
            >
                <InputText
                    id="ai_image_model"
                    v-model="settings.ai_image_model"
                    :disabled="metadata.ai_image_model?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="ai_image_api_key"
                input-id="ai_image_api_key"
                :metadata="metadata.ai_image_api_key"
            >
                <Password
                    id="ai_image_api_key"
                    v-model="settings.ai_image_api_key"
                    :disabled="metadata.ai_image_api_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="ai_image_endpoint"
                input-id="ai_image_endpoint"
                :metadata="metadata.ai_image_endpoint"
            >
                <InputText
                    id="ai_image_endpoint"
                    v-model="settings.ai_image_endpoint"
                    :disabled="metadata.ai_image_endpoint?.isLocked"
                    fluid
                />
            </SettingFormField>
        </div>

        <Divider class="my-8" />

        <SettingFormField
            input-id="asr_enabled"
            :label="$t('pages.admin.settings.system.keys.ai_asr_title')"
            :description="$t('pages.admin.settings.system.keys.ai_asr_description')"
            :metadata="metadata.asr_enabled"
            inline
        >
            <ToggleSwitch
                id="asr_enabled"
                v-model="settings.asr_enabled"
                :disabled="metadata.asr_enabled?.isLocked"
            />
        </SettingFormField>

        <div v-if="settings.asr_enabled" class="ai-settings__group">
            <SettingFormField
                field-key="asr_provider"
                input-id="asr_provider"
                :metadata="metadata.asr_provider"
            >
                <Select
                    id="asr_provider"
                    v-model="settings.asr_provider"
                    :options="asrProviders"
                    option-label="label"
                    option-value="value"
                    :disabled="metadata.asr_provider?.isLocked"
                    fluid
                />
            </SettingFormField>

            <div v-if="settings.asr_provider === 'siliconflow'" class="ai-settings__provider-group">
                <SettingFormField
                    field-key="asr_api_key"
                    input-id="asr_api_key"
                    :metadata="metadata.asr_api_key"
                >
                    <Password
                        id="asr_api_key"
                        v-model="settings.asr_api_key"
                        :disabled="metadata.asr_api_key?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="asr_model"
                    input-id="asr_model"
                    :metadata="metadata.asr_model"
                >
                    <InputText
                        id="asr_model"
                        v-model="settings.asr_model"
                        :disabled="metadata.asr_model?.isLocked"
                        placeholder="FunAudioLLM/SenseVoiceSmall"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="asr_endpoint"
                    input-id="asr_endpoint"
                    :metadata="metadata.asr_endpoint"
                >
                    <InputText
                        id="asr_endpoint"
                        v-model="settings.asr_endpoint"
                        :disabled="metadata.asr_endpoint?.isLocked"
                        fluid
                    />
                </SettingFormField>
            </div>

            <div v-if="settings.asr_provider === 'volcengine'" class="ai-settings__provider-group">
                <SettingFormField
                    field-key="asr_model"
                    input-id="asr_model"
                    :metadata="metadata.asr_model"
                >
                    <InputText
                        id="asr_model"
                        v-model="settings.asr_model"
                        :disabled="metadata.asr_model?.isLocked"
                        placeholder="volc.seedasr.sauc.duration"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="asr_endpoint"
                    input-id="asr_endpoint"
                    :metadata="metadata.asr_endpoint"
                >
                    <InputText
                        id="asr_endpoint"
                        v-model="settings.asr_endpoint"
                        :disabled="metadata.asr_endpoint?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="asr_volcengine_cluster_id"
                    input-id="asr_volcengine_cluster_id"
                    :metadata="metadata.asr_volcengine_cluster_id"
                >
                    <InputText
                        id="asr_volcengine_cluster_id"
                        v-model="settings.asr_volcengine_cluster_id"
                        :disabled="metadata.asr_volcengine_cluster_id?.isLocked"
                        fluid
                    />
                </SettingFormField>
            </div>
        </div>

        <div
            v-if="(settings.asr_enabled && settings.asr_provider === 'volcengine') || (settings.tts_enabled && settings.tts_provider === 'volcengine')"
            class="ai-settings__shared-group"
        >
            <Divider class="my-8" />

            <SettingFormField
                field-key="volcengine_app_id"
                input-id="volcengine_app_id"
                :metadata="metadata.volcengine_app_id"
            >
                <InputText
                    id="volcengine_app_id"
                    v-model="settings.volcengine_app_id"
                    :disabled="metadata.volcengine_app_id?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="volcengine_access_key"
                input-id="volcengine_access_key"
                :metadata="metadata.volcengine_access_key"
            >
                <InputText
                    id="volcengine_access_key"
                    v-model="settings.volcengine_access_key"
                    :disabled="metadata.volcengine_access_key?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="volcengine_secret_key"
                input-id="volcengine_secret_key"
                :metadata="metadata.volcengine_secret_key"
            >
                <Password
                    id="volcengine_secret_key"
                    v-model="settings.volcengine_secret_key"
                    :disabled="metadata.volcengine_secret_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </SettingFormField>
        </div>

        <Divider class="my-8" />

        <SettingFormField
            input-id="tts_enabled"
            :label="$t('pages.admin.settings.system.keys.ai_tts_title')"
            :description="$t('pages.admin.settings.system.keys.ai_tts_description')"
            :metadata="metadata.tts_enabled"
            inline
        >
            <ToggleSwitch
                id="tts_enabled"
                v-model="settings.tts_enabled"
                :disabled="metadata.tts_enabled?.isLocked"
            />
        </SettingFormField>

        <div v-if="settings.tts_enabled" class="ai-settings__group">
            <SettingFormField
                field-key="tts_provider"
                input-id="tts_provider"
                :metadata="metadata.tts_provider"
            >
                <Select
                    id="tts_provider"
                    v-model="settings.tts_provider"
                    :options="ttsProviders"
                    option-label="label"
                    option-value="value"
                    :disabled="metadata.tts_provider?.isLocked"
                    fluid
                />
            </SettingFormField>

            <div v-if="settings.tts_provider !== 'volcengine'" class="ai-settings__provider-group">
                <SettingFormField
                    field-key="tts_api_key"
                    input-id="tts_api_key"
                    :metadata="metadata.tts_api_key"
                >
                    <Password
                        id="tts_api_key"
                        v-model="settings.tts_api_key"
                        :disabled="metadata.tts_api_key?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="tts_model"
                    input-id="tts_model"
                    :metadata="metadata.tts_model"
                >
                    <InputText
                        id="tts_model"
                        v-model="settings.tts_model"
                        :disabled="metadata.tts_model?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="tts_endpoint"
                    input-id="tts_endpoint"
                    :metadata="metadata.tts_endpoint"
                >
                    <InputText
                        id="tts_endpoint"
                        v-model="settings.tts_endpoint"
                        :disabled="metadata.tts_endpoint?.isLocked"
                        fluid
                    />
                </SettingFormField>
            </div>

            <div v-if="settings.tts_provider === 'volcengine'" class="ai-settings__provider-group">
                <SettingFormField
                    field-key="tts_model"
                    input-id="tts_model"
                    :metadata="metadata.tts_model"
                >
                    <InputText
                        id="tts_model"
                        v-model="settings.tts_model"
                        :disabled="metadata.tts_model?.isLocked"
                        fluid
                    />
                </SettingFormField>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'

const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
const aiProviders = ['openai', 'groq', 'ollama', 'anthropic', 'google']
const aiImageProviders = ['openai', 'gemini', 'stable-diffusion', 'doubao', 'siliconflow']
const asrProviders = [
    { label: 'SiliconFlow (Batch)', value: 'siliconflow' },
    { label: 'Volcengine (Streaming)', value: 'volcengine' },
]
const ttsProviders = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'SiliconFlow', value: 'siliconflow' },
    { label: 'Volcengine', value: 'volcengine' },
]
</script>

<style lang="scss" scoped>
.ai-settings {
    &__group,
    &__provider-group,
    &__shared-group {
        display: flex;
        flex-direction: column;
    }
}
</style>
