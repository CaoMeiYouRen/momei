<template>
    <div class="settings-form">
        <LocalizedSettingEditor
            v-model="settings.site_title"
            field-key="site_title"
            input-id="site_title"
            :metadata="metadata.site_title"
        />

        <SettingFormField
            field-key="site_name"
            input-id="site_name"
            :metadata="metadata.site_name"
            :description="$t('pages.admin.settings.system.hints.site_name')"
        >
            <SettingInput
                id="site_name"
                v-model="settings.site_name"
                :disabled="metadata.site_name?.isLocked"
            />
        </SettingFormField>

        <LocalizedSettingEditor
            v-model="settings.site_description"
            field-key="site_description"
            input-id="site_description"
            :metadata="metadata.site_description"
            multiline
            :rows="3"
        />

        <LocalizedSettingEditor
            v-model="settings.site_keywords"
            field-key="site_keywords"
            input-id="site_keywords"
            :metadata="metadata.site_keywords"
            string-list
            :description="$t('pages.admin.settings.system.localized.keywords_description')"
        />

        <SettingFormField
            field-key="post_copyright"
            input-id="post_copyright"
            :metadata="metadata.post_copyright"
            :description="$t('pages.admin.settings.system.hints.post_copyright')"
        >
            <CaomeiSelect
                id="post_copyright"
                v-model="settings.post_copyright"
                :options="copyrightOptions"
                option-label="label"
                option-value="value"
                :disabled="metadata.post_copyright?.isLocked"
            />
        </SettingFormField>

        <LocalizedSettingEditor
            v-model="settings.site_copyright_owner"
            field-key="site_copyright_owner"
            input-id="site_copyright_owner"
            :metadata="metadata.site_copyright_owner"
            :description="$t('pages.admin.settings.system.hints.site_copyright_owner')"
        />

        <SettingFormField
            field-key="site_copyright_start_year"
            input-id="site_copyright_start_year"
            :metadata="metadata.site_copyright_start_year"
            :description="$t('pages.admin.settings.system.hints.site_copyright_start_year')"
        >
            <SettingInput
                id="site_copyright_start_year"
                v-model="settings.site_copyright_start_year"
                :disabled="metadata.site_copyright_start_year?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="default_language"
            input-id="default_language"
            :metadata="metadata.default_language"
        >
            <CaomeiSelect
                id="default_language"
                v-model="settings.default_language"
                :options="languageOptions"
                option-label="label"
                option-value="value"
                :disabled="metadata.default_language?.isLocked"
            />
        </SettingFormField>

        <CaomeiDivider align="left">
            <b>{{ $t('pages.admin.settings.system.sections.branding') }}</b>
        </CaomeiDivider>

        <div class="settings-form__media-grid">
            <SettingFormField
                field-key="site_logo"
                input-id="site_logo"
                :metadata="metadata.site_logo"
            >
                <div class="settings-form__media-row">
                    <AppUploader
                        id="site_logo"
                        v-model="settings.site_logo"
                        :disabled="metadata.site_logo?.isLocked"
                    />
                    <CaomeiImage
                        v-if="settings.site_logo"
                        :src="settings.site_logo"
                        preview
                        class="settings-form__preview"
                        style="width: 48px"
                    />
                </div>
            </SettingFormField>

            <SettingFormField
                field-key="site_favicon"
                input-id="site_favicon"
                :metadata="metadata.site_favicon"
            >
                <div class="settings-form__media-row">
                    <AppUploader
                        id="site_favicon"
                        v-model="settings.site_favicon"
                        :disabled="metadata.site_favicon?.isLocked"
                    />
                    <CaomeiImage
                        v-if="settings.site_favicon"
                        :src="settings.site_favicon"
                        preview
                        class="settings-form__preview"
                        style="width: 48px"
                    />
                </div>
            </SettingFormField>
        </div>

        <LocalizedSettingEditor
            v-model="settings.site_operator"
            field-key="site_operator"
            input-id="site_operator"
            :metadata="metadata.site_operator"
        />

        <SettingFormField
            field-key="contact_email"
            input-id="contact_email"
            :metadata="metadata.contact_email"
        >
            <SettingInput
                id="contact_email"
                v-model="settings.contact_email"
                :disabled="metadata.contact_email?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="feedback_url"
            input-id="feedback_url"
            :metadata="metadata.feedback_url"
            :description="$t('pages.admin.settings.system.hints.feedback_url')"
        >
            <SettingInput
                id="feedback_url"
                v-model="settings.feedback_url"
                :disabled="metadata.feedback_url?.isLocked"
            />
        </SettingFormField>

        <CaomeiDivider align="left">
            <b>{{ $t('pages.admin.settings.system.sections.footer') }}</b>
        </CaomeiDivider>

        <SettingFormField
            field-key="show_compliance_info"
            input-id="show_compliance_info"
            :metadata="metadata.show_compliance_info"
            inline
        >
            <CaomeiSwitch
                id="show_compliance_info"
                v-model="settings.show_compliance_info"
                :disabled="metadata.show_compliance_info?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="icp_license_number"
            input-id="icp_license_number"
            :metadata="metadata.icp_license_number"
        >
            <SettingInput
                id="icp_license_number"
                v-model="settings.icp_license_number"
                :disabled="metadata.icp_license_number?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="public_security_number"
            input-id="public_security_number"
            :metadata="metadata.public_security_number"
        >
            <SettingInput
                id="public_security_number"
                v-model="settings.public_security_number"
                :disabled="metadata.public_security_number?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="footer_code"
            input-id="footer_code"
            :metadata="metadata.footer_code"
            :description="$t('pages.admin.settings.system.hints.footer_code')"
        >
            <SettingTextarea
                id="footer_code"
                v-model="settings.footer_code"
                :disabled="metadata.footer_code?.isLocked"
                :rows="4"
            />
        </SettingFormField>

        <CaomeiDivider align="left">
            <b>{{ $t('pages.admin.settings.system.sections.friend_links') }}</b>
        </CaomeiDivider>

        <SettingFormField
            field-key="friend_links_enabled"
            input-id="friend_links_enabled"
            :metadata="metadata.friend_links_enabled"
            inline
        >
            <CaomeiSwitch
                id="friend_links_enabled"
                v-model="settings.friend_links_enabled"
                :disabled="metadata.friend_links_enabled?.isLocked"
            />
        </SettingFormField>

        <template v-if="settings.friend_links_enabled">
            <SettingFormField
                field-key="friend_links_application_enabled"
                input-id="friend_links_application_enabled"
                :metadata="metadata.friend_links_application_enabled"
                inline
            >
                <CaomeiSwitch
                    id="friend_links_application_enabled"
                    v-model="settings.friend_links_application_enabled"
                    :disabled="metadata.friend_links_application_enabled?.isLocked"
                />
            </SettingFormField>

            <SettingFormField
                field-key="friend_links_footer_enabled"
                input-id="friend_links_footer_enabled"
                :metadata="metadata.friend_links_footer_enabled"
                inline
            >
                <CaomeiSwitch
                    id="friend_links_footer_enabled"
                    v-model="settings.friend_links_footer_enabled"
                    :disabled="metadata.friend_links_footer_enabled?.isLocked"
                />
            </SettingFormField>

            <SettingFormField
                field-key="friend_links_footer_limit"
                input-id="friend_links_footer_limit"
                :metadata="metadata.friend_links_footer_limit"
                :description="$t('pages.admin.settings.system.hints.friend_links_footer_limit')"
            >
                <CaomeiInputNumber
                    id="friend_links_footer_limit"
                    v-model="settings.friend_links_footer_limit"
                    :disabled="metadata.friend_links_footer_limit?.isLocked"
                    :min="1"

                    :controls="false"
                />
            </SettingFormField>

            <SettingFormField
                field-key="friend_links_check_interval_minutes"
                input-id="friend_links_check_interval_minutes"
                :metadata="metadata.friend_links_check_interval_minutes"
                :description="$t('pages.admin.settings.system.hints.friend_links_check_interval_minutes')"
            >
                <SettingInput
                    id="friend_links_check_interval_minutes"
                    v-model="settings.friend_links_check_interval_minutes"
                    :disabled="metadata.friend_links_check_interval_minutes?.isLocked"
                />
            </SettingFormField>

            <LocalizedSettingEditor
                v-model="settings.friend_links_application_guidelines"
                field-key="friend_links_application_guidelines"
                input-id="friend_links_application_guidelines"
                :metadata="metadata.friend_links_application_guidelines"
                :description="$t('pages.admin.settings.system.hints.friend_links_application_guidelines')"
                multiline
                :rows="5"
            />
        </template>

        <CaomeiDivider align="left">
            <b>{{ $t('pages.admin.settings.system.sections.travellings') }}</b>
        </CaomeiDivider>

        <SettingFormField
            field-key="travellings_enabled"
            input-id="travellings_enabled"
            :metadata="metadata.travellings_enabled"
            inline
        >
            <CaomeiSwitch
                id="travellings_enabled"
                v-model="settings.travellings_enabled"
                :disabled="metadata.travellings_enabled?.isLocked"
            />
        </SettingFormField>

        <template v-if="settings.travellings_enabled">
            <SettingFormField
                field-key="travellings_header_enabled"
                input-id="travellings_header_enabled"
                :metadata="metadata.travellings_header_enabled"
                :description="$t('pages.admin.settings.system.hints.travellings_header_enabled')"
                inline
            >
                <CaomeiSwitch
                    id="travellings_header_enabled"
                    v-model="settings.travellings_header_enabled"
                    :disabled="metadata.travellings_header_enabled?.isLocked"
                />
            </SettingFormField>

            <SettingFormField
                field-key="travellings_footer_enabled"
                input-id="travellings_footer_enabled"
                :metadata="metadata.travellings_footer_enabled"
                :description="$t('pages.admin.settings.system.hints.travellings_footer_enabled')"
                inline
            >
                <CaomeiSwitch
                    id="travellings_footer_enabled"
                    v-model="settings.travellings_footer_enabled"
                    :disabled="metadata.travellings_footer_enabled?.isLocked"
                />
            </SettingFormField>

            <SettingFormField
                field-key="travellings_sidebar_enabled"
                input-id="travellings_sidebar_enabled"
                :metadata="metadata.travellings_sidebar_enabled"
                :description="$t('pages.admin.settings.system.hints.travellings_sidebar_enabled')"
                inline
            >
                <CaomeiSwitch
                    id="travellings_sidebar_enabled"
                    v-model="settings.travellings_sidebar_enabled"
                    :disabled="metadata.travellings_sidebar_enabled?.isLocked"
                />
            </SettingFormField>
        </template>

        <CaomeiDivider align="left">
            <b>{{ $t('pages.admin.settings.system.sections.live2d') }}</b>
        </CaomeiDivider>

        <SettingFormField
            field-key="live2d_enabled"
            input-id="live2d_enabled"
            :metadata="metadata.live2d_enabled"
            inline
        >
            <CaomeiSwitch
                id="live2d_enabled"
                v-model="settings.live2d_enabled"
                :disabled="metadata.live2d_enabled?.isLocked"
            />
        </SettingFormField>

        <template v-if="settings.live2d_enabled">
            <SettingFormField
                field-key="live2d_script_url"
                input-id="live2d_script_url"
                :metadata="metadata.live2d_script_url"
            >
                <SettingInput
                    id="live2d_script_url"
                    v-model="settings.live2d_script_url"
                    :disabled="metadata.live2d_script_url?.isLocked"
                    :placeholder="$t('pages.admin.settings.system.hints.live2d_script_url')"
                />
            </SettingFormField>

            <SettingFormField
                field-key="live2d_model_url"
                input-id="live2d_model_url"
                :metadata="metadata.live2d_model_url"
            >
                <SettingInput
                    id="live2d_model_url"
                    v-model="settings.live2d_model_url"
                    :disabled="metadata.live2d_model_url?.isLocked"
                    :placeholder="$t('pages.admin.settings.system.hints.live2d_model_url')"
                />
            </SettingFormField>

            <SettingFormField
                field-key="live2d_options_json"
                input-id="live2d_options_json"
                :metadata="metadata.live2d_options_json"
            >
                <SettingTextarea
                    id="live2d_options_json"
                    v-model="settings.live2d_options_json"
                    :disabled="metadata.live2d_options_json?.isLocked"
                    :placeholder="$t('pages.admin.settings.system.hints.live2d_options_json')"
                    :rows="8"
                />
            </SettingFormField>

            <SettingFormField
                field-key="live2d_mobile_enabled"
                input-id="live2d_mobile_enabled"
                :metadata="metadata.live2d_mobile_enabled"
                inline
            >
                <CaomeiSwitch
                    id="live2d_mobile_enabled"
                    v-model="settings.live2d_mobile_enabled"
                    :disabled="metadata.live2d_mobile_enabled?.isLocked"
                />
            </SettingFormField>

            <SettingFormField
                field-key="live2d_min_width"
                input-id="live2d_min_width"
                :metadata="metadata.live2d_min_width"
            >
                <CaomeiInputNumber
                    id="live2d_min_width"
                    v-model="settings.live2d_min_width"
                    :disabled="metadata.live2d_min_width?.isLocked"
                    :min="320"
                    :max="2560"
                    :step="1"

                    :controls="false"
                />
            </SettingFormField>

            <SettingFormField
                field-key="live2d_data_saver_block"
                input-id="live2d_data_saver_block"
                :metadata="metadata.live2d_data_saver_block"
                inline
            >
                <CaomeiSwitch
                    id="live2d_data_saver_block"
                    v-model="settings.live2d_data_saver_block"
                    :disabled="metadata.live2d_data_saver_block?.isLocked"
                />
            </SettingFormField>
        </template>

        <CaomeiDivider align="left">
            <b>{{ $t('pages.admin.settings.system.sections.canvas_nest') }}</b>
        </CaomeiDivider>

        <SettingFormField
            field-key="canvas_nest_enabled"
            input-id="canvas_nest_enabled"
            :metadata="metadata.canvas_nest_enabled"
            inline
        >
            <CaomeiSwitch
                id="canvas_nest_enabled"
                v-model="settings.canvas_nest_enabled"
                :disabled="metadata.canvas_nest_enabled?.isLocked"
            />
        </SettingFormField>

        <template v-if="settings.canvas_nest_enabled">
            <SettingFormField
                field-key="canvas_nest_options_json"
                input-id="canvas_nest_options_json"
                :metadata="metadata.canvas_nest_options_json"
            >
                <SettingTextarea
                    id="canvas_nest_options_json"
                    v-model="settings.canvas_nest_options_json"
                    :disabled="metadata.canvas_nest_options_json?.isLocked"
                    :placeholder="$t('pages.admin.settings.system.hints.canvas_nest_options_json')"
                    :rows="6"
                />
            </SettingFormField>

            <SettingFormField
                field-key="canvas_nest_mobile_enabled"
                input-id="canvas_nest_mobile_enabled"
                :metadata="metadata.canvas_nest_mobile_enabled"
                inline
            >
                <CaomeiSwitch
                    id="canvas_nest_mobile_enabled"
                    v-model="settings.canvas_nest_mobile_enabled"
                    :disabled="metadata.canvas_nest_mobile_enabled?.isLocked"
                />
            </SettingFormField>

            <SettingFormField
                field-key="canvas_nest_min_width"
                input-id="canvas_nest_min_width"
                :metadata="metadata.canvas_nest_min_width"
            >
                <CaomeiInputNumber
                    id="canvas_nest_min_width"
                    v-model="settings.canvas_nest_min_width"
                    :disabled="metadata.canvas_nest_min_width?.isLocked"
                    :min="320"
                    :max="2560"
                    :step="1"

                    :controls="false"
                />
            </SettingFormField>

            <SettingFormField
                field-key="canvas_nest_data_saver_block"
                input-id="canvas_nest_data_saver_block"
                :metadata="metadata.canvas_nest_data_saver_block"
                inline
            >
                <CaomeiSwitch
                    id="canvas_nest_data_saver_block"
                    v-model="settings.canvas_nest_data_saver_block"
                    :disabled="metadata.canvas_nest_data_saver_block?.isLocked"
                />
            </SettingFormField>
        </template>

        <CaomeiDivider align="left">
            <b>{{ $t('pages.admin.settings.system.sections.effects_performance') }}</b>
        </CaomeiDivider>

        <SettingFormField
            field-key="effects_mobile_enabled"
            input-id="effects_mobile_enabled"
            :metadata="metadata.effects_mobile_enabled"
            inline
        >
            <CaomeiSwitch
                id="effects_mobile_enabled"
                v-model="settings.effects_mobile_enabled"
                :disabled="metadata.effects_mobile_enabled?.isLocked"
            />
        </SettingFormField>

        <SettingFormField
            field-key="effects_min_width"
            input-id="effects_min_width"
            :metadata="metadata.effects_min_width"
        >
            <CaomeiInputNumber
                id="effects_min_width"
                v-model="settings.effects_min_width"
                :disabled="metadata.effects_min_width?.isLocked"
                :min="320"
                :max="2560"
                :step="1"

                :controls="false"
            />
        </SettingFormField>

        <SettingFormField
            field-key="effects_data_saver_block"
            input-id="effects_data_saver_block"
            :metadata="metadata.effects_data_saver_block"
            inline
        >
            <CaomeiSwitch
                id="effects_data_saver_block"
                v-model="settings.effects_data_saver_block"
                :disabled="metadata.effects_data_saver_block?.isLocked"
            />
        </SettingFormField>
    </div>
</template>

<script setup lang="ts">
import SettingInput from '@/components/admin/settings/setting-input.vue'
import SettingTextarea from '@/components/admin/settings/setting-textarea.vue'
import LocalizedSettingEditor from '@/components/admin/settings/localized-setting-editor.vue'
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'
import { APP_ENABLED_LOCALES } from '@/i18n/config/locale-registry'
import { getCopyrightLicenseOptions } from '@/utils/shared/copyright-options'
import type { AdminLanguageCode, GeneralSettingsMetadata, GeneralSettingsModel } from '@/types/setting'

const settings = defineModel<GeneralSettingsModel>('settings', { required: true })

defineProps<{
    metadata: GeneralSettingsMetadata
}>()

const { t } = useI18n()

const languageOptions = computed<Array<{ label: string, value: AdminLanguageCode }>>(() => {
    return APP_ENABLED_LOCALES.map((locale) => ({
        label: locale.nativeName,
        value: locale.code,
    }))
})

const copyrightOptions = computed(() => getCopyrightLicenseOptions(t))
</script>

<style lang="scss" scoped>
.settings-form {
    &__media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1rem;
    }

    &__media-row {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
    }

    &__preview {
        border: 1px solid var(--caomei-color-border);
        border-radius: 0.75rem;
        box-shadow: var(--m-shadow-popover);
    }
}
</style>
