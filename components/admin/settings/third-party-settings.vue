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
                    v-model="memosEnabled"
                    :disabled="metadata.memos_enabled?.isLocked"
                />
            </SettingFormField>

            <div v-if="memosEnabled" class="third-party-settings__sub-fields">
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

        <div class="third-party-settings__section">
            <h3 class="third-party-settings__section-title">
                {{ $t('pages.admin.settings.system.sections.listmonk') }}
            </h3>

            <SettingFormField
                field-key="listmonk_enabled"
                input-id="listmonk_enabled"
                :metadata="metadata.listmonk_enabled"
                inline
            >
                <ToggleSwitch
                    id="listmonk_enabled"
                    v-model="listmonkEnabled"
                    :disabled="metadata.listmonk_enabled?.isLocked"
                />
            </SettingFormField>

            <div v-if="listmonkEnabled" class="third-party-settings__sub-fields">
                <SettingFormField
                    field-key="listmonk_instance_url"
                    input-id="listmonk_instance_url"
                    :metadata="metadata.listmonk_instance_url"
                >
                    <InputText
                        id="listmonk_instance_url"
                        v-model="settings.listmonk_instance_url"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_instance_url')"
                        :disabled="metadata.listmonk_instance_url?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_username"
                    input-id="listmonk_username"
                    :metadata="metadata.listmonk_username"
                >
                    <InputText
                        id="listmonk_username"
                        v-model="settings.listmonk_username"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_username')"
                        :disabled="metadata.listmonk_username?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_access_token"
                    input-id="listmonk_access_token"
                    :metadata="metadata.listmonk_access_token"
                >
                    <Password
                        id="listmonk_access_token"
                        v-model="settings.listmonk_access_token"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_access_token')"
                        :disabled="metadata.listmonk_access_token?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_default_list_ids"
                    input-id="listmonk_default_list_ids"
                    :metadata="metadata.listmonk_default_list_ids"
                >
                    <InputText
                        id="listmonk_default_list_ids"
                        v-model="settings.listmonk_default_list_ids"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_default_list_ids')"
                        :disabled="metadata.listmonk_default_list_ids?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_category_list_map"
                    input-id="listmonk_category_list_map"
                    :metadata="metadata.listmonk_category_list_map"
                >
                    <Textarea
                        id="listmonk_category_list_map"
                        v-model="settings.listmonk_category_list_map"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_category_list_map')"
                        :disabled="metadata.listmonk_category_list_map?.isLocked"
                        rows="4"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_tag_list_map"
                    input-id="listmonk_tag_list_map"
                    :metadata="metadata.listmonk_tag_list_map"
                >
                    <Textarea
                        id="listmonk_tag_list_map"
                        v-model="settings.listmonk_tag_list_map"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_tag_list_map')"
                        :disabled="metadata.listmonk_tag_list_map?.isLocked"
                        rows="4"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_template_id"
                    input-id="listmonk_template_id"
                    :metadata="metadata.listmonk_template_id"
                >
                    <InputText
                        id="listmonk_template_id"
                        v-model="settings.listmonk_template_id"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_template_id')"
                        :disabled="metadata.listmonk_template_id?.isLocked"
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
import { toBoolean } from '@/utils/shared/coerce'

const { t } = useI18n()

const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()

function createToggleModel(key: 'memos_enabled' | 'listmonk_enabled') {
    return computed({
        get: () => toBoolean(settings.value?.[key]),
        set: (value: boolean) => {
            if (settings.value) {
                settings.value[key] = value
            }
        },
    })
}

const memosEnabled = createToggleModel('memos_enabled')
const listmonkEnabled = createToggleModel('listmonk_enabled')

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
