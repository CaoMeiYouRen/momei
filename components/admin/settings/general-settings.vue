<template>
    <div class="settings-form">
        <div class="form-field">
            <label for="site_title" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.site_title') }}
                <i
                    v-if="metadata.site_title?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="site_title"
                v-model="settings.site_title"
                :disabled="metadata.site_title?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="site_description" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.site_description') }}
                <i
                    v-if="metadata.site_description?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <Textarea
                id="site_description"
                v-model="settings.site_description"
                :disabled="metadata.site_description?.isLocked"
                rows="3"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="site_keywords" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.site_keywords') }}
                <i
                    v-if="metadata.site_keywords?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="site_keywords"
                v-model="settings.site_keywords"
                :disabled="metadata.site_keywords?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="site_copyright" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.site_copyright') }}
                <i
                    v-if="metadata.site_copyright?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="site_copyright"
                v-model="settings.site_copyright"
                :disabled="metadata.site_copyright?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="default_language" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.default_language') }}
                <i
                    v-if="metadata.default_language?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <Select
                id="default_language"
                v-model="settings.default_language"
                :options="languageOptions"
                option-label="label"
                option-value="value"
                :disabled="metadata.default_language?.isLocked"
                fluid
            />
        </div>

        <Divider align="left">
            <b>{{ $t('pages.admin.settings.system.sections.branding') }}</b>
        </Divider>

        <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
            <div class="form-field">
                <label for="site_logo" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.site_logo') }}
                    <i
                        v-if="metadata.site_logo?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <div class="flex gap-4 items-center">
                    <AppUploader
                        id="site_logo"
                        v-model="settings.site_logo"
                        :disabled="metadata.site_logo?.isLocked"
                    />
                    <Image
                        v-if="settings.site_logo"
                        :src="settings.site_logo"
                        width="48"
                        preview
                        class="border rounded shadow-sm"
                    />
                </div>
            </div>
            <div class="form-field">
                <label for="site_favicon" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.site_favicon') }}
                    <i
                        v-if="metadata.site_favicon?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <div class="flex gap-4 items-center">
                    <AppUploader
                        id="site_favicon"
                        v-model="settings.site_favicon"
                        :disabled="metadata.site_favicon?.isLocked"
                    />
                    <Image
                        v-if="settings.site_favicon"
                        :src="settings.site_favicon"
                        width="48"
                        preview
                        class="border rounded shadow-sm"
                    />
                </div>
            </div>
        </div>

        <Divider align="left">
            <b>{{ $t('pages.admin.settings.system.sections.footer') }}</b>
        </Divider>

        <div class="form-field">
            <label for="icp_license_number" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.icp_license_number') }}
                <i
                    v-if="metadata.icp_license_number?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="icp_license_number"
                v-model="settings.icp_license_number"
                :disabled="metadata.icp_license_number?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="public_security_number" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.public_security_number') }}
                <i
                    v-if="metadata.public_security_number?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="public_security_number"
                v-model="settings.public_security_number"
                :disabled="metadata.public_security_number?.isLocked"
                fluid
            />
        </div>

        <Divider align="left">
            <b>{{ $t('pages.admin.settings.system.sections.live2d') }}</b>
        </Divider>

        <div class="form-field">
            <label for="live2d_enabled" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.live2d_enabled') }}
                <i
                    v-if="metadata.live2d_enabled?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <ToggleSwitch
                id="live2d_enabled"
                v-model="settings.live2d_enabled"
                :disabled="metadata.live2d_enabled?.isLocked"
            />
        </div>

        <template v-if="settings.live2d_enabled">
            <div class="form-field">
                <label for="live2d_script_url" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.live2d_script_url') }}
                    <i
                        v-if="metadata.live2d_script_url?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="live2d_script_url"
                    v-model="settings.live2d_script_url"
                    :disabled="metadata.live2d_script_url?.isLocked"
                    :placeholder="$t('pages.admin.settings.system.hints.live2d_script_url')"
                    fluid
                />
            </div>

            <div class="form-field">
                <label for="live2d_model_url" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.live2d_model_url') }}
                    <i
                        v-if="metadata.live2d_model_url?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="live2d_model_url"
                    v-model="settings.live2d_model_url"
                    :disabled="metadata.live2d_model_url?.isLocked"
                    :placeholder="$t('pages.admin.settings.system.hints.live2d_model_url')"
                    fluid
                />
            </div>

            <div class="form-field">
                <label for="live2d_options_json" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.live2d_options_json') }}
                    <i
                        v-if="metadata.live2d_options_json?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <Textarea
                    id="live2d_options_json"
                    v-model="settings.live2d_options_json"
                    :disabled="metadata.live2d_options_json?.isLocked"
                    :placeholder="$t('pages.admin.settings.system.hints.live2d_options_json')"
                    rows="8"
                    fluid
                />
            </div>

            <div class="form-field">
                <label for="live2d_mobile_enabled" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.live2d_mobile_enabled') }}
                    <i
                        v-if="metadata.live2d_mobile_enabled?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <ToggleSwitch
                    id="live2d_mobile_enabled"
                    v-model="settings.live2d_mobile_enabled"
                    :disabled="metadata.live2d_mobile_enabled?.isLocked"
                />
            </div>

            <div class="form-field">
                <label for="live2d_min_width" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.live2d_min_width') }}
                    <i
                        v-if="metadata.live2d_min_width?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputNumber
                    id="live2d_min_width"
                    v-model="settings.live2d_min_width"
                    :disabled="metadata.live2d_min_width?.isLocked"
                    :min="320"
                    :max="2560"
                    :step="1"
                    fluid
                />
            </div>

            <div class="form-field">
                <label for="live2d_data_saver_block" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.live2d_data_saver_block') }}
                    <i
                        v-if="metadata.live2d_data_saver_block?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <ToggleSwitch
                    id="live2d_data_saver_block"
                    v-model="settings.live2d_data_saver_block"
                    :disabled="metadata.live2d_data_saver_block?.isLocked"
                />
            </div>
        </template>

        <Divider align="left">
            <b>{{ $t('pages.admin.settings.system.sections.canvas_nest') }}</b>
        </Divider>

        <div class="form-field">
            <label for="canvas_nest_enabled" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.canvas_nest_enabled') }}
                <i
                    v-if="metadata.canvas_nest_enabled?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <ToggleSwitch
                id="canvas_nest_enabled"
                v-model="settings.canvas_nest_enabled"
                :disabled="metadata.canvas_nest_enabled?.isLocked"
            />
        </div>

        <template v-if="settings.canvas_nest_enabled">
            <div class="form-field">
                <label for="canvas_nest_options_json" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.canvas_nest_options_json') }}
                    <i
                        v-if="metadata.canvas_nest_options_json?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <Textarea
                    id="canvas_nest_options_json"
                    v-model="settings.canvas_nest_options_json"
                    :disabled="metadata.canvas_nest_options_json?.isLocked"
                    :placeholder="$t('pages.admin.settings.system.hints.canvas_nest_options_json')"
                    rows="6"
                    fluid
                />
            </div>

            <div class="form-field">
                <label for="canvas_nest_mobile_enabled" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.canvas_nest_mobile_enabled') }}
                    <i
                        v-if="metadata.canvas_nest_mobile_enabled?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <ToggleSwitch
                    id="canvas_nest_mobile_enabled"
                    v-model="settings.canvas_nest_mobile_enabled"
                    :disabled="metadata.canvas_nest_mobile_enabled?.isLocked"
                />
            </div>

            <div class="form-field">
                <label for="canvas_nest_min_width" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.canvas_nest_min_width') }}
                    <i
                        v-if="metadata.canvas_nest_min_width?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputNumber
                    id="canvas_nest_min_width"
                    v-model="settings.canvas_nest_min_width"
                    :disabled="metadata.canvas_nest_min_width?.isLocked"
                    :min="320"
                    :max="2560"
                    :step="1"
                    fluid
                />
            </div>

            <div class="form-field">
                <label for="canvas_nest_data_saver_block" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.canvas_nest_data_saver_block') }}
                    <i
                        v-if="metadata.canvas_nest_data_saver_block?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <ToggleSwitch
                    id="canvas_nest_data_saver_block"
                    v-model="settings.canvas_nest_data_saver_block"
                    :disabled="metadata.canvas_nest_data_saver_block?.isLocked"
                />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
const settings = defineModel<any>('settings', { required: true })

defineProps<{
    metadata: any
}>()

const languageOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en-US' },
]
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
