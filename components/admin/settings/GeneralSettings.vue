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
            <label for="icp_info" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.icp_info') }}
                <i
                    v-if="metadata.icp_info?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="icp_info"
                v-model="settings.icp_info"
                :disabled="metadata.icp_info?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="security_info" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.security_info') }}
                <i
                    v-if="metadata.security_info?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="security_info"
                v-model="settings.security_info"
                :disabled="metadata.security_info?.isLocked"
                fluid
            />
        </div>
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
