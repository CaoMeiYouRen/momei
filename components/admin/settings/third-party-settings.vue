<template>
    <div class="third-party-settings">
        <div class="third-party-settings__section">
            <h3 class="third-party-settings__section-title">
                {{ $t('pages.admin.settings.system.sections.memos') }}
            </h3>

            <SettingFormField
                field-key="memos_enabled"
                input-id="memos_enabled"
                :metadata="metadata.memos_enabled"
                inline
            >
                <ToggleSwitch
                    id="memos_enabled"
                    v-model="settings.memos_enabled"
                    :true-value="'true'"
                    :false-value="'false'"
                    :disabled="metadata.memos_enabled?.isLocked"
                />
            </SettingFormField>

            <div v-if="settings.memos_enabled === 'true'" class="third-party-settings__sub-fields">
                <SettingFormField
                    field-key="memos_instance_url"
                    input-id="memos_instance_url"
                    :metadata="metadata.memos_instance_url"
                >
                    <InputText
                        id="memos_instance_url"
                        v-model="settings.memos_instance_url"
                        :placeholder="$t('pages.admin.settings.system.hints.memos_instance_url')"
                        :disabled="metadata.memos_instance_url?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="memos_access_token"
                    input-id="memos_access_token"
                    :metadata="metadata.memos_access_token"
                >
                    <Password
                        id="memos_access_token"
                        v-model="settings.memos_access_token"
                        :placeholder="$t('pages.admin.settings.system.hints.memos_access_token')"
                        :disabled="metadata.memos_access_token?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="memos_default_visibility"
                    input-id="memos_default_visibility"
                    :metadata="metadata.memos_default_visibility"
                >
                    <Select
                        id="memos_default_visibility"
                        v-model="settings.memos_default_visibility"
                        :options="visibilityOptions"
                        option-label="label"
                        option-value="value"
                        :disabled="metadata.memos_default_visibility?.isLocked"
                        fluid
                    />
                </SettingFormField>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'

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
