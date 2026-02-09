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
    </div>
</template>

<script setup lang="ts">
const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
const aiProviders = ['openai', 'groq', 'ollama', 'anthropic', 'google']
const aiImageProviders = ['openai', 'gemini', 'stable-diffusion', 'doubao']
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
