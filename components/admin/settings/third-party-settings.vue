<template>
    <div class="third-party-settings">
        <div class="third-party-settings__section">
            <h3 class="third-party-settings__section-title">
                {{ $t('pages.admin.settings.system.sections.memos') }}
            </h3>

            <div class="third-party-settings__field third-party-settings__field--switch">
                <div class="third-party-settings__label-group">
                    <label for="memos_enabled">
                        {{ $t('pages.admin.settings.system.keys.memos_enabled') }}
                    </label>
                    <i
                        v-if="metadata.memos_enabled?.isLocked"
                        v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                        class="lock-icon pi pi-lock"
                    />
                </div>
                <ToggleSwitch
                    id="memos_enabled"
                    v-model="settings.memos_enabled"
                    :true-value="'true'"
                    :false-value="'false'"
                    :disabled="metadata.memos_enabled?.isLocked"
                />
            </div>

            <div v-if="settings.memos_enabled === 'true'" class="third-party-settings__sub-fields">
                <div class="third-party-settings__field">
                    <div class="third-party-settings__label-group">
                        <label for="memos_instance_url">
                            {{ $t('pages.admin.settings.system.keys.memos_instance_url') }}
                        </label>
                        <i
                            v-if="metadata.memos_instance_url?.isLocked"
                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                            class="lock-icon pi pi-lock"
                        />
                    </div>
                    <InputText
                        id="memos_instance_url"
                        v-model="settings.memos_instance_url"
                        :placeholder="$t('pages.admin.settings.system.hints.memos_instance_url')"
                        :disabled="metadata.memos_instance_url?.isLocked"
                        fluid
                    />
                </div>

                <div class="third-party-settings__field">
                    <div class="third-party-settings__label-group">
                        <label for="memos_access_token">
                            {{ $t('pages.admin.settings.system.keys.memos_access_token') }}
                        </label>
                        <i
                            v-if="metadata.memos_access_token?.isLocked"
                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                            class="lock-icon pi pi-lock"
                        />
                    </div>
                    <Password
                        id="memos_access_token"
                        v-model="settings.memos_access_token"
                        :placeholder="$t('pages.admin.settings.system.hints.memos_access_token')"
                        :disabled="metadata.memos_access_token?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </div>

                <div class="third-party-settings__field">
                    <div class="third-party-settings__label-group">
                        <label for="memos_default_visibility">
                            {{ $t('pages.admin.settings.system.keys.memos_default_visibility') }}
                        </label>
                        <i
                            v-if="metadata.memos_default_visibility?.isLocked"
                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                            class="lock-icon pi pi-lock"
                        />
                    </div>
                    <Select
                        id="memos_default_visibility"
                        v-model="settings.memos_default_visibility"
                        :options="visibilityOptions"
                        option-label="label"
                        option-value="value"
                        :disabled="metadata.memos_default_visibility?.isLocked"
                        fluid
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()

const visibilityOptions = computed(() => [
    { label: t('pages.admin.settings.system.memos.visibility.PUBLIC'), value: 'PUBLIC' },
    { label: t('pages.admin.settings.system.memos.visibility.PROTECTED'), value: 'PROTECTED' },
    { label: t('pages.admin.settings.system.memos.visibility.PRIVATE'), value: 'PRIVATE' },
])
</script>

<style lang="scss" scoped>
.third-party-settings {
    &__section {
        margin-bottom: 2rem;
    }

    &__section-title {
        font-size: 1.125rem;
        font-weight: 600;
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid var(--p-surface-border);
    }

    &__field {
        margin-bottom: 1.5rem;

        &--switch {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
    }

    &__label-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;

        label {
            font-weight: 500;
        }

        .lock-icon {
            font-size: 0.75rem;
            color: var(--p-orange-500);
        }
    }

    &__field--switch &__label-group {
        margin-bottom: 0;
    }

    &__sub-fields {
        margin-top: 1.5rem;
        padding-left: 1rem;
        border-left: 2px solid var(--p-primary-50);
    }
}

:global(.dark) {
    .third-party-settings {
        &__sub-fields {
            border-left-color: var(--p-primary-900-opacity-20);
        }
    }
}
</style>
