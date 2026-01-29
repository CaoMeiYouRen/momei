<template>
    <div class="settings-form">
        <div class="form-field">
            <label for="email_host" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.email_host') }}
                <i
                    v-if="metadata.email_host?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="email_host"
                v-model="settings.email_host"
                :disabled="metadata.email_host?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="email_port" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.email_port') }}
                <i
                    v-if="metadata.email_port?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputNumber
                id="email_port"
                v-model="settings.email_port"
                :disabled="metadata.email_port?.isLocked"
                fluid
                :use-grouping="false"
            />
        </div>
        <div class="form-field">
            <label for="email_user" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.email_user') }}
                <i
                    v-if="metadata.email_user?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="email_user"
                v-model="settings.email_user"
                :disabled="metadata.email_user?.isLocked"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="email_pass" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.email_pass') }}
                <i
                    v-if="metadata.email_pass?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <Password
                id="email_pass"
                v-model="settings.email_pass"
                :disabled="metadata.email_pass?.isLocked"
                :toggle-mask="true"
                fluid
            />
        </div>
        <div class="form-field">
            <label for="email_from" class="flex gap-2 items-center">
                {{ $t('pages.admin.settings.system.keys.email_from') }}
                <i
                    v-if="metadata.email_from?.isLocked"
                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                    class="pi pi-lock text-orange-500 text-xs"
                />
            </label>
            <InputText
                id="email_from"
                v-model="settings.email_from"
                :disabled="metadata.email_from?.isLocked"
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
