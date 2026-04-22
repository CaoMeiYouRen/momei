import { computed, onMounted, ref } from 'vue'
import type { ApiResponse } from '@/server/utils/response'
import type { InstallationDiagnostics, InstallationRuntime } from '@/utils/shared/installation-diagnostics'
import type { InstallationEnvSetting } from '@/utils/shared/installation-env-setting'
import { APP_ENABLED_LOCALES } from '@/i18n/config/locale-registry'
import { isCopyrightType } from '@/types/copyright'
import { getCopyrightLicenseOptions, resolveDefaultCopyrightLicense } from '@/utils/shared/copyright-options'
import { getInstallationChecklist, type InstallationChecklistMode } from '@/utils/shared/installation-checklist'
import {
    coerceInstallationLocalizedSiteFieldValue,
    DEFAULT_INSTALLATION_EXTRA_CONFIG,
    DEFAULT_INSTALLATION_SITE_CONFIG,
    INSTALLATION_EXTRA_ENV_BACKFILL_MAP,
    INSTALLATION_SITE_ENV_BACKFILL_MAP,
    type InstallationExtraConfigModel,
    type InstallationExtraFieldErrors,
    type InstallationSiteConfigModel,
    type InstallationSiteFieldErrors,
} from '@/utils/shared/installation-settings'
import {
    extractValidationIssues,
    mapValidationIssues,
    resolveRequestErrorMessage,
} from '@/utils/shared/request-feedback'
import { queueSetupJourneyStage } from '@/utils/web/setup-journey'

interface InstallationStatusState {
    installed: boolean
    databaseConnected: boolean
    hasUsers: boolean
    hasInstallationFlag: boolean
    envInstallationFlag: boolean
    nodeVersion: string
    os: string
    databaseType: string
    databaseVersion: string
    isServerless: boolean
    isNodeVersionSafe: boolean
    runtime: InstallationRuntime
    envSettings: Record<string, InstallationEnvSetting>
    deploymentDiagnostics: InstallationDiagnostics
}

interface AdminCreationForm {
    name: string
    email: string
    password: string
}

type InstallationStepActivator = (step: string) => void

export function useInstallationWizard() {
    const { t } = useI18n()
    const config = useRuntimeConfig()
    const localePath = useLocalePath()

    const currentStep = ref('1')
    const installationStatus = ref<InstallationStatusState | null>(null)
    const installationMode = computed<InstallationChecklistMode>(() => config.public.demoMode ? 'demo' : 'production')
    const setupChecklist = computed(() => getInstallationChecklist(installationMode.value))
    const immediateChecklist = computed(() => setupChecklist.value.immediate)

    const dbInitLoading = ref(false)
    const dbInitSuccess = ref(false)
    const dbInitError = ref('')

    const siteConfig = ref<InstallationSiteConfigModel>({
        ...DEFAULT_INSTALLATION_SITE_CONFIG,
        siteUrl: import.meta.client ? window.location.origin : '',
        postCopyright: resolveDefaultCopyrightLicense((config.public.postCopyright || config.public.defaultCopyright)),
    })
    const siteConfigLoading = ref(false)
    const siteConfigError = ref('')
    const siteFieldErrors = ref<InstallationSiteFieldErrors>({})

    const languageOptions = computed(() => APP_ENABLED_LOCALES.map((locale) => ({
        label: t(`common.languages.${locale.code}`),
        value: locale.code,
    })))
    const licenseOptions = computed(() => getCopyrightLicenseOptions(t))

    const adminData = ref<AdminCreationForm>({
        name: '',
        email: '',
        password: '',
    })
    const adminLoading = ref(false)
    const adminError = ref('')
    const adminFieldErrors = ref<Partial<Record<keyof AdminCreationForm, string>>>({})

    const extraConfig = ref<InstallationExtraConfigModel>({
        ...DEFAULT_INSTALLATION_EXTRA_CONFIG,
    })
    const extraConfigLoading = ref(false)
    const extraConfigError = ref('')
    const extraFieldErrors = ref<InstallationExtraFieldErrors>({})

    const finalizeLoading = ref(false)
    const finalizeSuccess = ref(false)
    const finalizeError = ref('')

    const applyEnvSettingsBackfill = (envSettings: Record<string, InstallationEnvSetting>) => {
        Object.entries(INSTALLATION_SITE_ENV_BACKFILL_MAP).forEach(([settingKey, configKey]) => {
            const envValue = envSettings[settingKey]?.value
            if (!envValue) {
                return
            }

            if (configKey === 'siteTitle') {
                siteConfig.value.siteTitle = coerceInstallationLocalizedSiteFieldValue('siteTitle', envValue)
                return
            }

            if (configKey === 'siteDescription') {
                siteConfig.value.siteDescription = coerceInstallationLocalizedSiteFieldValue('siteDescription', envValue)
                return
            }

            if (configKey === 'siteKeywords') {
                siteConfig.value.siteKeywords = coerceInstallationLocalizedSiteFieldValue('siteKeywords', envValue)
                return
            }

            if (configKey === 'siteCopyrightOwner') {
                siteConfig.value.siteCopyrightOwner = coerceInstallationLocalizedSiteFieldValue('siteCopyrightOwner', envValue)
                return
            }

            if (configKey === 'postCopyright') {
                siteConfig.value.postCopyright = isCopyrightType(envValue)
                    ? envValue
                    : siteConfig.value.postCopyright
                return
            }

            siteConfig.value[configKey] = envValue
        })

        Object.entries(INSTALLATION_EXTRA_ENV_BACKFILL_MAP).forEach(([settingKey, configKey]) => {
            const envValue = envSettings[settingKey]?.value
            if (!envValue) {
                return
            }

            if (configKey === 'emailPort') {
                extraConfig.value.emailPort = Number.parseInt(envValue, 10) || 587
                return
            }

            extraConfig.value[configKey] = envValue
        })
    }

    async function fetchInstallationStatus() {
        try {
            const response = await $fetch<ApiResponse<InstallationStatusState>>('/api/install/status')
            installationStatus.value = response.data || null

            if (response.data?.installed && !finalizeSuccess.value) {
                void navigateTo('/')
            }

            if (response.data?.envSettings) {
                applyEnvSettingsBackfill(response.data.envSettings)
            }
        } catch (error) {
            console.error('Failed to fetch installation status:', error)
        }
    }

    async function initDatabase() {
        dbInitLoading.value = true
        dbInitError.value = ''
        try {
            await $fetch('/api/install/init-db', { method: 'POST' })
            dbInitSuccess.value = true
        } catch (error) {
            dbInitError.value = resolveRequestErrorMessage(error, {
                fallbackKey: 'installation.database.error',
            }, t)
        } finally {
            dbInitLoading.value = false
        }
    }

    async function saveSiteConfig(activateCallback: InstallationStepActivator) {
        siteConfigLoading.value = true
        siteConfigError.value = ''
        siteFieldErrors.value = {}
        try {
            await $fetch('/api/install/setup-site', { method: 'POST', body: siteConfig.value })
            activateCallback('4')
        } catch (error) {
            siteConfigError.value = resolveRequestErrorMessage(error, {
                fallbackKey: 'installation.siteConfig.error',
            }, t)
            siteFieldErrors.value = mapValidationIssues<keyof InstallationSiteConfigModel>(extractValidationIssues(error))
        } finally {
            siteConfigLoading.value = false
        }
    }

    async function createAdmin(activateCallback: InstallationStepActivator) {
        adminLoading.value = true
        adminError.value = ''
        adminFieldErrors.value = {}
        try {
            await $fetch('/api/install/create-admin', { method: 'POST', body: adminData.value })
            activateCallback('5')
        } catch (error) {
            adminError.value = resolveRequestErrorMessage(error, {
                fallbackKey: 'installation.adminAccount.error',
            }, t)
            adminFieldErrors.value = mapValidationIssues<string>(extractValidationIssues(error))
        } finally {
            adminLoading.value = false
        }
    }

    async function saveExtraConfig(activateCallback: InstallationStepActivator) {
        extraConfigLoading.value = true
        extraConfigError.value = ''
        extraFieldErrors.value = {}
        try {
            await $fetch('/api/install/setup-extra', { method: 'POST', body: extraConfig.value })
            activateCallback('6')
        } catch (error) {
            extraConfigError.value = resolveRequestErrorMessage(error, {
                fallbackKey: 'installation.preview.error',
            }, t)
            extraFieldErrors.value = mapValidationIssues<keyof InstallationExtraConfigModel>(extractValidationIssues(error))

            if (Object.keys(extraFieldErrors.value).length === 0) {
                activateCallback('6')
            }
        } finally {
            extraConfigLoading.value = false
        }
    }

    async function finalizeInstallation() {
        finalizeLoading.value = true
        finalizeError.value = ''
        try {
            await $fetch('/api/install/finalize', { method: 'POST' })
            finalizeSuccess.value = true
        } catch (error) {
            finalizeError.value = resolveRequestErrorMessage(error, {
                fallbackKey: 'installation.complete.error',
            }, t)
        } finally {
            finalizeLoading.value = false
        }
    }

    function openAdminSettings() {
        queueSetupJourneyStage('admin')

        const target = localePath({
            path: '/login',
            query: {
                redirect: localePath({
                    path: '/admin/settings',
                    query: { tab: 'general' },
                }),
            },
        })

        return navigateWithReloadFallback(target)
    }

    async function navigateWithReloadFallback(target: string) {
        try {
            await navigateTo(target)
        } catch {
            if (import.meta.client) {
                window.location.assign(target)
            }
        }
    }

    onMounted(() => {
        void fetchInstallationStatus()
    })

    return {
        currentStep,
        installationStatus,
        installationMode,
        setupChecklist,
        immediateChecklist,
        dbInitLoading,
        dbInitSuccess,
        dbInitError,
        siteConfig,
        siteConfigLoading,
        siteConfigError,
        siteFieldErrors,
        languageOptions,
        licenseOptions,
        adminData,
        adminLoading,
        adminError,
        adminFieldErrors,
        extraConfig,
        extraConfigLoading,
        extraConfigError,
        extraFieldErrors,
        finalizeLoading,
        finalizeSuccess,
        finalizeError,
        fetchInstallationStatus,
        initDatabase,
        saveSiteConfig,
        createAdmin,
        saveExtraConfig,
        finalizeInstallation,
        openAdminSettings,
    }
}
