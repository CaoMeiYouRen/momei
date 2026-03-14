<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.siteConfig.title') }}</h2>
        <p>{{ $t('installation.siteConfig.description') }}</p>

        <Message
            v-if="siteConfigError && !Object.keys(fieldErrors).length"
            severity="error"
            :closable="false"
            class="installation-wizard__step-message"
        >
            {{ siteConfigError }}
        </Message>

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
                <InputText
                    id="site_title"
                    v-model="siteConfig.siteTitle"
                    :disabled="isLocked(settingKeys.siteTitle)"
                    :invalid="!!fieldErrors.siteTitle"
                    fluid
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
                <Select
                    id="default_language"
                    v-model="siteConfig.defaultLanguage"
                    :options="languageOptions"
                    option-label="label"
                    option-value="value"
                    :disabled="isLocked(settingKeys.defaultLanguage)"
                    :invalid="!!fieldErrors.defaultLanguage"
                    fluid
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
                <InputText
                    id="site_url"
                    v-model="siteConfig.siteUrl"
                    :placeholder="$t('installation.siteConfig.siteUrlPlaceholder')"
                    :disabled="isLocked(settingKeys.siteUrl)"
                    :invalid="!!fieldErrors.siteUrl"
                    fluid
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
                <Textarea
                    id="site_description"
                    v-model="siteConfig.siteDescription"
                    rows="3"
                    :disabled="isLocked(settingKeys.siteDescription)"
                    :invalid="!!fieldErrors.siteDescription"
                    fluid
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
                <InputText
                    id="site_keywords"
                    v-model="siteConfig.siteKeywords"
                    :disabled="isLocked(settingKeys.siteKeywords)"
                    :invalid="!!fieldErrors.siteKeywords"
                    fluid
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
                <Select
                    id="post_copyright"
                    v-model="siteConfig.postCopyright"
                    :options="licenseOptions"
                    option-label="label"
                    option-value="value"
                    :disabled="isLocked(settingKeys.postCopyright)"
                    :invalid="!!fieldErrors.postCopyright"
                    fluid
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
                <InputText
                    id="site_copyright_owner"
                    v-model="siteConfig.siteCopyrightOwner"
                    :disabled="isLocked(settingKeys.siteCopyrightOwner)"
                    :invalid="!!fieldErrors.siteCopyrightOwner"
                    fluid
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
                <InputText
                    id="site_copyright_start_year"
                    v-model="siteConfig.siteCopyrightStartYear"
                    :disabled="isLocked(settingKeys.siteCopyrightStartYear)"
                    :invalid="!!fieldErrors.siteCopyrightStartYear"
                    fluid
                />
                <div v-if="fieldErrors.siteCopyrightStartYear" class="installation-wizard__field-error">
                    {{ fieldErrors.siteCopyrightStartYear }}
                </div>
                <small v-else-if="isLocked(settingKeys.siteCopyrightStartYear)" class="installation-wizard__field-lock">{{ getLockMessage(settingKeys.siteCopyrightStartYear) }}</small>
            </div>
        </div>

        <div class="installation-wizard__actions">
            <Button
                :label="$t('common.prev')"
                icon="pi pi-arrow-left"
                variant="text"
                @click="$emit('prev')"
            />
            <Button
                :label="$t('common.next')"
                icon="pi pi-arrow-right"
                icon-pos="right"
                :loading="siteConfigLoading"
                @click="$emit('next')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { resolveInstallationEnvLockMessage, type InstallationEnvSetting } from '@/utils/shared/installation-env-setting'
import { INSTALLATION_SITE_SETTING_KEYS, type InstallationSiteConfigModel, type InstallationSiteFieldErrors } from '@/utils/shared/installation-settings'
import type { CopyrightLicenseOption } from '@/utils/shared/copyright-options'

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

const { t } = useI18n()
const settingKeys = INSTALLATION_SITE_SETTING_KEYS

const isLocked = (key: string) => !!props.envSettings[key]
const getLockMessage = (key: string) => resolveInstallationEnvLockMessage(t, key, props.envSettings[key])
</script>
