<template>
    <div class="settings-form">
        <div class="form-field">
            <label for="github_client_id" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.github_client_id') }}
                <i
                    v-if="metadata.github_client_id?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="github_client_id"
                v-model="settings.github_client_id"
                :disabled="metadata.github_client_id?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="github_client_secret" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.github_client_secret') }}
                <i
                    v-if="metadata.github_client_secret?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <Password
                id="github_client_secret"
                v-model="settings.github_client_secret"
                :disabled="metadata.github_client_secret?.isLocked"
                :toggle-mask="true"
                fluid
            />
        </div>

        <Divider />

        <div class="form-field">
            <label for="google_client_id" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.google_client_id') }}
                <i
                    v-if="metadata.google_client_id?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="google_client_id"
                v-model="settings.google_client_id"
                :disabled="metadata.google_client_id?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="google_client_secret" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.google_client_secret') }}
                <i
                    v-if="metadata.google_client_secret?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <Password
                id="google_client_secret"
                v-model="settings.google_client_secret"
                :disabled="metadata.google_client_secret?.isLocked"
                :toggle-mask="true"
                fluid
            />
        </div>

        <Divider />

        <div class="form-field">
            <label for="discord_client_id" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.discord_client_id') }}
                <i
                    v-if="metadata.discord_client_id?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="discord_client_id"
                v-model="settings.discord_client_id"
                :disabled="metadata.discord_client_id?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="discord_client_secret" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.discord_client_secret') }}
                <i
                    v-if="metadata.discord_client_secret?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <Password
                id="discord_client_secret"
                v-model="settings.discord_client_secret"
                :disabled="metadata.discord_client_secret?.isLocked"
                :toggle-mask="true"
                fluid
            />
        </div>
    </div>
</template>

<script setup lang="ts">
const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()
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
