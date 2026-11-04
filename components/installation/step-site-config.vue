<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.siteConfig.title') }}</h2>
        <p>{{ $t('installation.siteConfig.description') }}</p>

        <CaomeiMessage
            v-if="siteConfigError && !Object.keys(fieldErrors).length"
            tone="danger"
            :closable="false"
            class="installation-wizard__step-message"
        >
            {{ siteConfigError }}
        </CaomeiMessage>

        <div class="installation-wizard__form">
            <div class="form-field">
                <label for="site_title">
                    {{ $t('installation.siteConfig.siteTitle') }}
                    <span class="ml-1 text-error">*</span>
                    <InstallationFieldStatus
                        v-if="isLocked(settingKeys.siteTitle)"
                        :field-key="settingKeys.siteTitle"
                        :env-setting="envSettings[settingKeys.siteTitle]"
                    />
                </label>
                <CaomeiInput
                    id="site_title"
                    :model-value="localizedFieldValues.siteTitle"
                    :disabled="isLocked(settingKeys.siteTitle)"
                    :invalid="!!fieldErrors.siteTitle"
                    @update:model-value="updateLocalizedField('siteTitle', $event)"
                />
                <small v-if="fieldErrors.siteTitle" class="installation-wizard__field-error">{{ fieldErrors.siteTitle }}</small>
                <small v-else-if="isLocked(settingKeys.siteTitle)" class="installation-wizard__field-lock">{{ getLockMessage(settingKeys.siteTitle) }}</small>
            </div>
            <div class="form-field">
                <label for="default_language">
                    {{ $t('installation.siteConfig.defaultLanguage') }}
                    <span class="ml-1 text-error">*</span>
                    <InstallationFieldStatus
                        v-if="isLocked(settingKeys.defaultLanguage)"
                        :field-key="settingKeys.defaultLanguage"
                        :env-setting="envSettings[settingKeys.defaultLanguage]"
                    />
                </label>
                <CaomeiSelect
                    id="default_language"
                    v-model="defaultLanguageModel"
                    :options="languageOptions"
                    option-label="label"
                    option-value="value"
                    :disabled="isLocked(settingKeys.defaultLanguage)"
                    :invalid="!!fieldErrors.defaultLanguage"
                />
                <div v-if="fieldErrors.defaultLanguage" class="installation-wizard__field-error">
                    {{ fieldErrors.defaultLanguage }}
                </div>
                <small v-else-if="isLocked(settingKeys.defaultLanguage)" class="installation-wizard__field-lock">{{ getLockMessage(settingKeys.defaultLanguage) }}</small>
            </div>
            <div class="form-field">
                <label for="site_url">
                    {{ $t('installation.siteConfig.siteUrl') }}
                    <InstallationFieldStatus
                        v-if="isLocked(settingKeys.siteUrl)"
                        :field-key="settingKeys.siteUrl"
                        :env-setting="envSettings[settingKeys.siteUrl]"
                    />
                </label>
                <CaomeiInput
                    id="site_url"
                    v-model="siteConfig.siteUrl"
                    :placeholder="$t('installation.siteConfig.siteUrlPlaceholder')"
                    :disabled="isLocked(settingKeys.siteUrl)"
                    :invalid="!!fieldErrors.siteUrl"
                />
                <div v-if="fieldErrors.siteUrl" class="installation-wizard__field-error">
                    {{ fieldErrors.siteUrl }}
                </div>
                <small v-else-if="isLocked(settingKeys.siteUrl)" class="installation-wizard__field-lock">{{ getLockMessage(settingKeys.siteUrl) }}</small>
            </div>
            <div class="form-field">
                <label for="site_description">
                    {{ $t('installation.siteConfig.siteDescription') }}
                    <InstallationFieldStatus
                        v-if="isLocked(settingKeys.siteDescription)"
                        :field-key="settingKeys.siteDescription"
                        :env-setting="envSettings[settingKeys.siteDescription]"
                    />
                </label>
                <CaomeiTextarea
                    id="site_description"
                    :model-value="localizedFieldValues.siteDescription"
                    :rows="3"
                    :disabled="isLocked(settingKeys.siteDescription)"
                    :invalid="!!fieldErrors.siteDescription"
                    @update:model-value="updateLocalizedField('siteDescription', $event)"
                />
                <div v-if="fieldErrors.siteDescription" class="installation-wizard__field-error">
                    {{ fieldErrors.siteDescription }}
                </div>
                <small v-else-if="isLocked(settingKeys.siteDescription)" class="installation-wizard__field-lock">{{ getLockMessage(settingKeys.siteDescription) }}</small>
            </div>
            <div class="form-field">
                <label for="site_keywords">
                    {{ $t('installation.siteConfig.siteKeywords') }}
                    <InstallationFieldStatus
                        v-if="isLocked(settingKeys.siteKeywords)"
                        :field-key="settingKeys.siteKeywords"
                        :env-setting="envSettings[settingKeys.siteKeywords]"
                    />
                </label>
                <CaomeiInput
                    id="site_keywords"
                    :model-value="localizedFieldValues.siteKeywords"
                    :disabled="isLocked(settingKeys.siteKeywords)"
                    :invalid="!!fieldErrors.siteKeywords"
                    @update:model-value="updateLocalizedField('siteKeywords', $event)"
                />
                <div v-if="fieldErrors.siteKeywords" class="installation-wizard__field-error">
                    {{ fieldErrors.siteKeywords }}
                </div>
                <small v-else-if="isLocked(settingKeys.siteKeywords)" class="installation-wizard__field-lock">{{ getLockMessage(settingKeys.siteKeywords) }}</small>
            </div>
            <div class="form-field">
                <label for="post_copyright">
                    {{ $t('installation.siteConfig.postCopyright') }}
                    <InstallationFieldStatus
                        v-if="isLocked(settingKeys.postCopyright)"
                        :field-key="settingKeys.postCopyright"
                        :env-setting="envSettings[settingKeys.postCopyright]"
                    />
                </label>
                <CaomeiSelect
                    id="post_copyright"
                    v-model="postCopyrightModel"
                    :options="licenseOptions"
                    option-label="label"
                    option-value="value"
                    :disabled="isLocked(settingKeys.postCopyright)"
                    :invalid="!!fieldErrors.postCopyright"
                />
                <div v-if="fieldErrors.postCopyright" class="installation-wizard__field-error">
                    {{ fieldErrors.postCopyright }}
                </div>
                <small v-else-if="isLocked(settingKeys.postCopyright)" class="installation-wizard__field-lock">{{ getLockMessage(settingKeys.postCopyright) }}</small>
            </div>
            <div class="form-field">
                <label for="site_copyright_owner">
                    {{ $t('installation.siteConfig.siteCopyrightOwner') }}
                    <InstallationFieldStatus
                        v-if="isLocked(settingKeys.siteCopyrightOwner)"
                        :field-key="settingKeys.siteCopyrightOwner"
                        :env-setting="envSettings[settingKeys.siteCopyrightOwner]"
                    />
                </label>
                <CaomeiInput
                    id="site_copyright_owner"
                    :model-value="localizedFieldValues.siteCopyrightOwner"
                    :disabled="isLocked(settingKeys.siteCopyrightOwner)"
                    :invalid="!!fieldErrors.siteCopyrightOwner"
                    @update:model-value="updateLocalizedField('siteCopyrightOwner', $event)"
                />
                <div v-if="fieldErrors.siteCopyrightOwner" class="installation-wizard__field-error">
                    {{ fieldErrors.siteCopyrightOwner }}
                </div>
                <small v-else-if="isLocked(settingKeys.siteCopyrightOwner)" class="installation-wizard__field-lock">{{ getLockMessage(settingKeys.siteCopyrightOwner) }}</small>
            </div>
            <div class="form-field">
                <label for="site_copyright_start_year">
                    {{ $t('installation.siteConfig.siteCopyrightStartYear') }}
                    <InstallationFieldStatus
                        v-if="isLocked(settingKeys.siteCopyrightStartYear)"
                        :field-key="settingKeys.siteCopyrightStartYear"
                        :env-setting="envSettings[settingKeys.siteCopyrightStartYear]"
                    />
                </label>
                <CaomeiInput
                    id="site_copyright_start_year"
                    v-model="siteConfig.siteCopyrightStartYear"
                    :disabled="isLocked(settingKeys.siteCopyrightStartYear)"
                    :invalid="!!fieldErrors.siteCopyrightStartYear"
                />
                <div v-if="fieldErrors.siteCopyrightStartYear" class="installation-wizard__field-error">
                    {{ fieldErrors.siteCopyrightStartYear }}
                </div>
                <small v-else-if="isLocked(settingKeys.siteCopyrightStartYear)" class="installation-wizard__field-lock">{{ getLockMessage(settingKeys.siteCopyrightStartYear) }}</small>
            </div>
        </div>

        <div class="installation-wizard__actions">
            <CaomeiButton
                variant="ghost"
                :label="$t('common.prev')"
                @click="$emit('prev')"
            >
                <template #icon>
                    <ArrowLeft :size="16" />
                </template>
                {{ $t('common.prev') }}
            </CaomeiButton>
            <CaomeiButton
                :label="$t('common.next')"
                :loading="siteConfigLoading"
                @click="$emit('next')"
            >
                <template #icon>
                    <ArrowRight :size="16" />
                </template>
                {{ $t('common.next') }}
            </CaomeiButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import { resolveInstallationEnvLockMessage, type InstallationEnvSetting } from '@/utils/shared/installation-env-setting'
import {
    INSTALLATION_SITE_SETTING_KEYS,
    resolveInstallationLocalizedSiteFieldInputValue,
    updateInstallationLocalizedSiteFieldValue,
    type InstallationLocalizedSiteFieldKey,
    type InstallationSiteConfigModel,
    type InstallationSiteFieldErrors,
} from '@/utils/shared/installation-settings'
import type { CopyrightLicenseOption } from '@/utils/shared/copyright-options'
import type { AdminLanguageCode } from '@/types/setting'

const siteConfig = defineModel<InstallationSiteConfigModel>('siteConfig', { required: true })
const props = defineProps<{
    siteConfigLoading: boolean
    siteConfigError: string
    fieldErrors: InstallationSiteFieldErrors
    languageOptions: any[]
    licenseOptions: CopyrightLicenseOption[]
    envSettings: Record<string, InstallationEnvSetting | undefined>
}>()
defineEmits(['prev', 'next'])

const { locale, t } = useI18n()
const settingKeys = INSTALLATION_SITE_SETTING_KEYS

const localizedFieldValues = computed<Record<InstallationLocalizedSiteFieldKey, string>>(() => ({
    siteTitle: resolveInstallationLocalizedSiteFieldInputValue('siteTitle', siteConfig.value.siteTitle, locale.value),
    siteDescription: resolveInstallationLocalizedSiteFieldInputValue('siteDescription', siteConfig.value.siteDescription, locale.value),
    siteKeywords: resolveInstallationLocalizedSiteFieldInputValue('siteKeywords', siteConfig.value.siteKeywords, locale.value),
    siteCopyrightOwner: resolveInstallationLocalizedSiteFieldInputValue('siteCopyrightOwner', siteConfig.value.siteCopyrightOwner, locale.value),
}))

const defaultLanguageModel = computed({
    get: () => siteConfig.value.defaultLanguage,
    set: (value: string | number | null | undefined) => {
        if (typeof value === 'string') {
            siteConfig.value.defaultLanguage = value as AdminLanguageCode
        }
    },
})

const postCopyrightModel = computed({
    get: () => siteConfig.value.postCopyright,
    set: (value: string | number | null | undefined) => {
        if (typeof value === 'string') {
            siteConfig.value.postCopyright = value as InstallationSiteConfigModel['postCopyright']
        }
    },
})

const isLocked = (key: string) => !!props.envSettings[key]
const getLockMessage = (key: string) => resolveInstallationEnvLockMessage(t, key, props.envSettings[key])

function updateLocalizedField(fieldKey: InstallationLocalizedSiteFieldKey, value?: string) {
    switch (fieldKey) {
        case 'siteTitle':
            siteConfig.value.siteTitle = updateInstallationLocalizedSiteFieldValue('siteTitle', siteConfig.value.siteTitle, locale.value, value ?? '')
            return
        case 'siteDescription':
            siteConfig.value.siteDescription = updateInstallationLocalizedSiteFieldValue('siteDescription', siteConfig.value.siteDescription, locale.value, value ?? '')
            return
        case 'siteKeywords':
            siteConfig.value.siteKeywords = updateInstallationLocalizedSiteFieldValue('siteKeywords', siteConfig.value.siteKeywords, locale.value, value ?? '')
            return
        case 'siteCopyrightOwner':
            siteConfig.value.siteCopyrightOwner = updateInstallationLocalizedSiteFieldValue('siteCopyrightOwner', siteConfig.value.siteCopyrightOwner, locale.value, value ?? '')
            return
        default:
            return
    }
}
</script>
