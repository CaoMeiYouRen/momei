<template>
    <div class="installation-wizard">
        <Card class="installation-wizard__card">
            <template #title>
                <div class="installation-wizard__header">
                    <h1 class="installation-wizard__title">
                        {{ $t('installation.title') }}
                    </h1>
                </div>
            </template>
            <template #subtitle>
                <div class="installation-wizard__header">
                    <p class="installation-wizard__subtitle">
                        {{ $t('installation.subtitle') }}
                    </p>
                </div>
            </template>

            <template #content>
                <Stepper v-model:value="currentStep" :linear="true">
                    <StepList>
                        <Step value="1">
                            {{ $t('installation.steps.healthCheck') }}
                        </Step>
                        <Step value="2">
                            {{ $t('installation.steps.database') }}
                        </Step>
                        <Step value="3">
                            {{ $t('installation.steps.siteConfig') }}
                        </Step>
                        <Step value="4">
                            {{ $t('installation.steps.adminAccount') }}
                        </Step>
                        <Step value="5">
                            {{ $t('installation.steps.preview') }}
                        </Step>
                        <Step value="6">
                            {{ $t('installation.steps.complete') }}
                        </Step>
                    </StepList>

                    <StepPanels>
                        <StepPanel v-slot="{activateCallback}" value="1">
                            <StepHealthCheck
                                :installation-status="installationStatus"
                                @next="activateCallback('2')"
                            />
                        </StepPanel>

                        <StepPanel v-slot="{activateCallback}" value="2">
                            <StepDatabase
                                :db-init-loading="dbInitLoading"
                                :db-init-success="dbInitSuccess"
                                :db-init-error="dbInitError"
                                @prev="activateCallback('1')"
                                @next="dbInitSuccess ? activateCallback('3') : initDatabase()"
                            />
                        </StepPanel>

                        <StepPanel v-slot="{activateCallback}" value="3">
                            <StepSiteConfig
                                v-model:site-config="siteConfig"
                                :site-config-loading="siteConfigLoading"
                                :site-config-error="siteConfigError"
                                :field-errors="siteFieldErrors"
                                :language-options="languageOptions"
                                :env-settings="installationStatus?.envSettings || {}"
                                @prev="activateCallback('2')"
                                @next="saveSiteConfig(activateCallback)"
                            />
                        </StepPanel>

                        <StepPanel v-slot="{activateCallback}" value="4">
                            <StepAdminAccount
                                v-model:admin-data="adminData"
                                :admin-loading="adminLoading"
                                :admin-error="adminError"
                                :field-errors="adminFieldErrors"
                                @prev="activateCallback('3')"
                                @next="createAdmin(activateCallback)"
                            />
                        </StepPanel>

                        <StepPanel v-slot="{activateCallback}" value="5">
                            <StepExtraConfig
                                v-model:extra-config="extraConfig"
                                :extra-config-loading="extraConfigLoading"
                                :extra-config-error="extraConfigError"
                                :field-errors="extraFieldErrors"
                                :env-settings="installationStatus?.envSettings || {}"
                                @prev="activateCallback('4')"
                                @skip="activateCallback('6')"
                                @next="saveExtraConfig(activateCallback)"
                            />
                        </StepPanel>

                        <StepPanel value="6">
                            <StepComplete
                                :finalize-loading="finalizeLoading"
                                :finalize-success="finalizeSuccess"
                                :finalize-error="finalizeError"
                                @finalize="finalizeInstallation()"
                                @go-to-admin="navigateTo('/admin')"
                            />
                        </StepPanel>
                    </StepPanels>
                </Stepper>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import StepHealthCheck from '@/components/installation/step-health-check.vue'
import StepDatabase from '@/components/installation/step-database.vue'
import StepSiteConfig from '@/components/installation/step-site-config.vue'
import StepAdminAccount from '@/components/installation/step-admin-account.vue'
import StepExtraConfig from '@/components/installation/step-extra-config.vue'
import StepComplete from '@/components/installation/step-complete.vue'

definePageMeta({
    layout: 'installation',
})

const { t } = useI18n()

const currentStep = ref('1')
const installationStatus = ref<any>(null)

const dbInitLoading = ref(false)
const dbInitSuccess = ref(false)
const dbInitError = ref('')

const siteConfig = ref({
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    siteUrl: typeof window !== 'undefined' ? window.location.origin : '',
    siteCopyright: '',
    defaultLanguage: 'zh-CN',
})
const siteConfigLoading = ref(false)
const siteConfigError = ref('')
const siteFieldErrors = ref<Record<string, string>>({})

const languageOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en-US' },
]

const adminData = ref({
    name: '',
    email: '',
    password: '',
})
const adminLoading = ref(false)
const adminError = ref('')
const adminFieldErrors = ref<Record<string, string>>({})

const extraConfig = ref({
    aiProvider: 'openai',
    aiApiKey: '',
    aiModel: 'gpt-4o',
    aiEndpoint: '',
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPass: '',
    emailFrom: '',
    storageType: 'local',
    localStorageDir: 'public/uploads',
    localStorageBaseUrl: '/uploads',
    s3Endpoint: '',
    s3Bucket: '',
    s3Region: 'auto',
    s3AccessKey: '',
    s3SecretKey: '',
    s3BaseUrl: '',
    s3BucketPrefix: '',
    baiduAnalytics: '',
    googleAnalytics: '',
    clarityAnalytics: '',
})
const extraConfigLoading = ref(false)
const extraConfigError = ref('')
const extraFieldErrors = ref<Record<string, string>>({})

/**
 * 映射 Zod 错误到字段对象
 */
function mapFieldErrors(issues: any[]) {
    const errors: Record<string, string> = {}
    if (Array.isArray(issues)) {
        issues.forEach((issue) => {
            const field = issue.path[0]
            if (field) {
                errors[field] = issue.message
            }
        })
    }
    return errors
}

const finalizeLoading = ref(false)
const finalizeSuccess = ref(false)
const finalizeError = ref('')

async function fetchInstallationStatus() {
    try {
        const response: any = await $fetch('/api/install/status')
        installationStatus.value = response.data
        if (response.data?.installed && !finalizeSuccess.value) {
            navigateTo('/')
        }

        // 自动检测环境变量状态并回填
        if (response.data?.envSettings) {
            const env = response.data.envSettings

            // Site Config mapping
            const siteMap: Record<string, keyof typeof siteConfig.value> = {
                site_title: 'siteTitle',
                site_description: 'siteDescription',
                site_keywords: 'siteKeywords',
                site_url: 'siteUrl',
                site_copyright: 'siteCopyright',
                default_language: 'defaultLanguage' as any,
            }

            Object.entries(siteMap).forEach(([dbKey, configKey]) => {
                if (env[dbKey]) {
                    (siteConfig.value as any)[configKey] = env[dbKey].value
                }
            })

            // Extra Config mapping
            const extraMap: Record<string, keyof typeof extraConfig.value> = {
                ai_provider: 'aiProvider',
                ai_api_key: 'aiApiKey',
                ai_model: 'aiModel',
                ai_endpoint: 'aiEndpoint',
                email_host: 'emailHost',
                email_port: 'emailPort' as any,
                email_user: 'emailUser',
                email_pass: 'emailPass',
                email_from: 'emailFrom',
                storage_type: 'storageType',
                local_storage_dir: 'localStorageDir',
                local_storage_base_url: 'localStorageBaseUrl',
                s3_endpoint: 's3Endpoint',
                s3_bucket: 's3Bucket',
                s3_region: 's3Region',
                s3_access_key: 's3AccessKey',
                s3_secret_key: 's3SecretKey',
                s3_base_url: 's3BaseUrl',
                s3_bucket_prefix: 's3BucketPrefix',
                baidu_analytics: 'baiduAnalytics',
                google_analytics: 'googleAnalytics',
                clarity_analytics: 'clarityAnalytics',
            }

            Object.entries(extraMap).forEach(([dbKey, configKey]) => {
                if (env[dbKey]) {
                    if (configKey === 'emailPort') {
                        extraConfig.value.emailPort = parseInt(env[dbKey].value) || 587
                    } else {
                        (extraConfig.value as any)[configKey] = env[dbKey].value
                    }
                }
            })
        }
    } catch (error: any) {
        console.error('Failed to fetch installation status:', error)
    }
}

async function initDatabase() {
    dbInitLoading.value = true
    dbInitError.value = ''
    try {
        await $fetch('/api/install/init-db', { method: 'POST' })
        dbInitSuccess.value = true
    } catch (error: any) {
        dbInitError.value = error.data?.message || t('installation.database.error')
    } finally {
        dbInitLoading.value = false
    }
}

async function saveSiteConfig(activateCallback: (step: string) => void) {
    siteConfigLoading.value = true
    siteConfigError.value = ''
    siteFieldErrors.value = {}
    try {
        await $fetch('/api/install/setup-site', { method: 'POST', body: siteConfig.value })
        activateCallback('4')
    } catch (error: any) {
        siteConfigError.value = error.data?.statusMessage || error.data?.message || t('installation.siteConfig.error')
        if (error.data?.data) {
            siteFieldErrors.value = mapFieldErrors(error.data.data)
        }
    } finally {
        siteConfigLoading.value = false
    }
}

async function createAdmin(activateCallback: (step: string) => void) {
    adminLoading.value = true
    adminError.value = ''
    adminFieldErrors.value = {}
    try {
        await $fetch('/api/install/create-admin', { method: 'POST', body: adminData.value })
        activateCallback('5')
    } catch (error: any) {
        adminError.value = error.data?.statusMessage || error.data?.message || t('installation.adminAccount.error')
        if (error.data?.data) {
            adminFieldErrors.value = mapFieldErrors(error.data.data)
        }
    } finally {
        adminLoading.value = false
    }
}

async function saveExtraConfig(activateCallback: (step: string) => void) {
    extraConfigLoading.value = true
    extraConfigError.value = ''
    extraFieldErrors.value = {}
    try {
        await $fetch('/api/install/setup-extra', { method: 'POST', body: extraConfig.value })
        activateCallback('6')
    } catch (error: any) {
        extraConfigError.value = error.data?.statusMessage || error.data?.message || t('installation.preview.error')
        if (error.data?.data) {
            extraFieldErrors.value = mapFieldErrors(error.data.data)
        }
        // 可选配置，即使报错也允许进入下一步，除非是关键错误
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
    } catch (error: any) {
        finalizeError.value = error.data?.message || t('installation.complete.error')
    } finally {
        finalizeLoading.value = false
    }
}

onMounted(() => {
    fetchInstallationStatus()
})
</script>

<style scoped lang="scss">
.installation-wizard {
    &__card {
        background: var(--p-surface-0);
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
    }

    &__header {
        text-align: center;
        padding: 2rem 2rem 1rem;
    }

    &__title {
        font-size: 2rem;
        font-weight: 700;
        color: var(--p-text-color);
        margin: 0 0 0.5rem;
    }

    &__subtitle {
        font-size: 1rem;
        color: var(--p-text-muted-color);
        margin: 0;
    }

    .text-error {
        color: var(--p-error-color);
    }

    .p-error {
        font-size: 0.875rem;
        margin-top: 0.25rem;
    }

    :deep(.installation-wizard__step) {
        padding: 2rem;

        h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--p-text-color);
            margin: 0 0 0.5rem;
        }

        > p {
            color: var(--p-text-muted-color);
            margin: 0 0 2rem;
        }
    }

    :deep(.installation-wizard__field) {
        margin-bottom: 2rem;
        display: flex;
        align-items: center;
        gap: 1rem;

        label {
            font-weight: 500;
        }
    }

    :deep(.installation-wizard__checks-grid) {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;

        .check-card {
            padding: 1.25rem;
            border: 1px solid var(--p-content-border-color);
            border-radius: var(--p-border-radius-md);
            background-color: var(--p-content-background);
            transition: all 0.2s;

            &:hover {
                border-color: var(--p-primary-color);
                box-shadow: 0 4px 6px -1px var(--p-primary-100);
            }

            &--warning {
                border-color: var(--p-orange-300);
                background-color: var(--p-orange-50);

                &:hover {
                    border-color: var(--p-orange-500);
                }

                .check-card__header {
                    color: var(--p-orange-600);
                }
            }

            &__header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1rem;
                font-weight: 600;
                color: var(--p-primary-color);

                i {
                    font-size: 1.25rem;
                }
            }

            &__content {
                .status-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 1.1rem;
                    font-weight: 500;
                    margin-bottom: 0.5rem;

                    i {
                        font-size: 1.25rem;
                    }
                }

                .status-detail {
                    font-size: 0.875rem;
                    color: var(--p-text-muted-color);
                }

                .status-warning {
                    font-size: 0.75rem;
                    color: var(--p-orange-600);
                    margin-top: 0.5rem;
                    line-height: 1.4;
                }
            }
        }
    }

    :deep(.installation-wizard__loading) {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin: 3rem 0;
    }

    :deep(.installation-wizard__form) {
        .form-field {
            margin-bottom: 1.5rem;

            label {
                display: block;
                font-weight: 500;
                margin-bottom: 0.5rem;
                color: var(--p-text-color);
            }

            small {
                display: block;
                margin-top: 0.25rem;
                color: var(--p-text-muted-color);
                font-size: 0.875rem;
            }
        }
    }

    :deep(.installation-wizard__complete) {
        margin: 2rem 0;

        .env-code {
            display: block;
            padding: 1rem;
            background: var(--p-surface-100);
            border-radius: 0.5rem;
            font-family: monospace;
            margin-top: 1rem;
        }
    }

    :deep(.installation-wizard__actions) {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--p-surface-border);
    }
}

:global(.dark) {
    .installation-wizard {
        &__card {
            background: var(--p-surface-900);
        }
    }
}
</style>
