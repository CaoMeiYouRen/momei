<template>
    <div class="settings-form">
        <div class="form-field">
            <label for="enable_registration" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.enable_registration') }}
                <i
                    v-if="metadata.enable_registration?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <ToggleSwitch
                id="enable_registration"
                v-model="settings.enable_registration"
                :disabled="metadata.enable_registration?.isLocked"
            />
        </div>

        <div class="form-field">
            <label for="enable_captcha" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.enable_captcha') }}
                <i
                    v-if="metadata.enable_captcha?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <ToggleSwitch
                id="enable_captcha"
                v-model="settings.enable_captcha"
                :disabled="metadata.enable_captcha?.isLocked"
            />
        </div>

        <template v-if="settings.enable_captcha">
            <div class="form-field">
                <label for="captcha_type" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.captcha_type') }}
                    <i
                        v-if="metadata.captcha_type?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <Select
                    id="captcha_type"
                    v-model="settings.captcha_type"
                    :options="captchaTypes"
                    :disabled="metadata.captcha_type?.isLocked"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="turnstile_site_key" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.turnstile_site_key') }}
                    <i
                        v-if="metadata.turnstile_site_key?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <InputText
                    id="turnstile_site_key"
                    v-model="settings.turnstile_site_key"
                    :disabled="metadata.turnstile_site_key?.isLocked"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="turnstile_secret_key" class="flex gap-2 items-center">
                    {{ $t('pages.admin.settings.system.keys.turnstile_secret_key') }}
                    <i
                        v-if="metadata.turnstile_secret_key?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="pi pi-lock text-orange-500 text-xs"
                    />
                </label>
                <Password
                    id="turnstile_secret_key"
                    v-model="settings.turnstile_secret_key"
                    :disabled="metadata.turnstile_secret_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </div>
        </template>

        <Divider />

        <div class="form-field">
            <label for="enable_comment_review" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.enable_comment_review') }}
                <i
                    v-if="metadata.enable_comment_review?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <ToggleSwitch
                id="enable_comment_review"
                v-model="settings.enable_comment_review"
                :disabled="metadata.enable_comment_review?.isLocked"
            />
        </div>

        <div class="form-field">
            <label for="blacklisted_keywords" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.blacklisted_keywords') }}
                <i
                    v-if="metadata.blacklisted_keywords?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <Textarea
                id="blacklisted_keywords"
                v-model="settings.blacklisted_keywords"
                :disabled="metadata.blacklisted_keywords?.isLocked"
                rows="4"
                fluid
                :placeholder="$t('pages.admin.settings.system.hints.keywords_placeholder')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
const captchaTypes = ['turnstile', 'recaptcha', 'hcaptcha']
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
