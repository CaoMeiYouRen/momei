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
                <!-- 步骤指示器 -->
                <Stepper v-model:value="currentStep" :linear="true">
                    <!-- Step 1: 环境检查 -->
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
                        <!-- Step 1: 环境检查 -->
                        <StepPanel v-slot="{activateCallback}" value="1">
                            <div class="installation-wizard__step">
                                <h2>{{ $t('installation.healthCheck.title') }}</h2>
                                <p>{{ $t('installation.healthCheck.description') }}</p>

                                <div class="installation-wizard__field">
                                    <label>{{ $t('installation.healthCheck.language') }}</label>
                                    <LanguageSwitcher class="installation-wizard__lang-switcher" />
                                </div>

                                <div v-if="installationStatus" class="installation-wizard__checks-grid">
                                    <div class="check-card">
                                        <div class="check-card__header">
                                            <i class="pi pi-server" />
                                            <span>{{ $t('installation.healthCheck.database') }}</span>
                                        </div>
                                        <div class="check-card__content">
                                            <div class="status-row">
                                                <span>{{ installationStatus.databaseType }}</span>
                                                <i
                                                    :class="installationStatus.databaseConnected ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"
                                                />
                                            </div>
                                            <div class="status-detail">
                                                {{ $t('installation.healthCheck.dbVersion') }}: {{ installationStatus.databaseVersion }}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="check-card" :class="{'check-card--warning': !installationStatus.isNodeVersionSafe}">
                                        <div class="check-card__header">
                                            <i class="pi pi-code" />
                                            <span>{{ $t('installation.healthCheck.node') }}</span>
                                        </div>
                                        <div class="check-card__content">
                                            <div class="status-row">
                                                <span>{{ installationStatus.nodeVersion }}</span>
                                                <i
                                                    :class="installationStatus.isNodeVersionSafe ? 'pi pi-check-circle text-green-500' : 'pi pi-exclamation-triangle text-orange-500'"
                                                />
                                            </div>
                                            <div class="status-detail">
                                                {{ $t('installation.healthCheck.os') }}: {{ installationStatus.os }}
                                            </div>
                                            <div v-if="!installationStatus.isNodeVersionSafe" class="status-warning">
                                                {{ $t('installation.healthCheck.nodeVersionWarning') }}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="check-card">
                                        <div class="check-card__header">
                                            <i class="pi pi-cloud" />
                                            <span>{{ $t('installation.healthCheck.serverless') }}</span>
                                        </div>
                                        <div class="check-card__content">
                                            <div class="status-row">
                                                <span>{{ installationStatus.isServerless ? $t('installation.healthCheck.enabled') : $t('installation.healthCheck.disabled') }}</span>
                                                <i
                                                    :class="installationStatus.isServerless ? 'pi pi-info-circle text-blue-500' : 'pi pi-check-circle text-green-500'"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="installation-wizard__loading">
                                    <ProgressSpinner style="width: 50px; height: 50px" />
                                    <p>{{ $t('common.loading') }}</p>
                                </div>

                                <div class="installation-wizard__actions">
                                    <Button
                                        :label="$t('common.next')"
                                        icon="pi pi-arrow-right"
                                        icon-pos="right"
                                        :disabled="!installationStatus || !installationStatus?.databaseConnected"
                                        :loading="!installationStatus"
                                        @click="activateCallback('2')"
                                    />
                                </div>
                            </div>
                        </StepPanel>

                        <!-- Step 2: 数据库初始化 -->
                        <StepPanel v-slot="{activateCallback}" value="2">
                            <div class="installation-wizard__step">
                                <h2>{{ $t('installation.database.title') }}</h2>
                                <p>{{ $t('installation.database.description') }}</p>

                                <Message v-if="dbInitError" severity="error">
                                    {{ dbInitError }}
                                </Message>
                                <Message v-else-if="dbInitSuccess" severity="success">
                                    {{ $t('installation.database.success') }}
                                </Message>

                                <div class="installation-wizard__actions">
                                    <Button
                                        :label="$t('common.prev')"
                                        severity="secondary"
                                        icon="pi pi-arrow-left"
                                        @click="activateCallback('1')"
                                    />
                                    <Button
                                        :label="dbInitSuccess ? $t('common.next') : $t('installation.database.initialize')"
                                        icon="pi pi-arrow-right"
                                        icon-pos="right"
                                        :loading="dbInitLoading"
                                        @click="dbInitSuccess ? activateCallback('3') : initDatabase()"
                                    />
                                </div>
                            </div>
                        </StepPanel>

                        <!-- Step 3: 站点配置 -->
                        <StepPanel v-slot="{activateCallback}" value="3">
                            <div class="installation-wizard__step">
                                <h2>{{ $t('installation.siteConfig.title') }}</h2>
                                <p>{{ $t('installation.siteConfig.description') }}</p>

                                <form class="installation-wizard__form" @submit.prevent="saveSiteConfig(activateCallback)">
                                    <div class="form-field">
                                        <label for="siteTitle">{{ $t('installation.siteConfig.siteTitle') }} *</label>
                                        <InputText
                                            id="siteTitle"
                                            v-model="siteConfig.siteTitle"
                                            required
                                            :placeholder="$t('installation.siteConfig.siteTitlePlaceholder')"
                                        />
                                    </div>

                                    <div class="form-field">
                                        <label for="siteDescription">{{ $t('installation.siteConfig.siteDescription') }} *</label>
                                        <Textarea
                                            id="siteDescription"
                                            v-model="siteConfig.siteDescription"
                                            required
                                            rows="3"
                                            :placeholder="$t('installation.siteConfig.siteDescriptionPlaceholder')"
                                        />
                                    </div>

                                    <div class="form-field">
                                        <label for="siteKeywords">{{ $t('installation.siteConfig.siteKeywords') }}</label>
                                        <InputText
                                            id="siteKeywords"
                                            v-model="siteConfig.siteKeywords"
                                            :placeholder="$t('installation.siteConfig.siteKeywordsPlaceholder')"
                                        />
                                    </div>

                                    <div class="form-field">
                                        <label for="siteCopyright">{{ $t('installation.siteConfig.siteCopyright') }}</label>
                                        <InputText
                                            id="siteCopyright"
                                            v-model="siteConfig.siteCopyright"
                                            :placeholder="$t('installation.siteConfig.siteCopyrightPlaceholder')"
                                        />
                                    </div>

                                    <div class="form-field">
                                        <label for="defaultLanguage">{{ $t('installation.siteConfig.defaultLanguage') }} *</label>
                                        <Select
                                            id="defaultLanguage"
                                            v-model="siteConfig.defaultLanguage"
                                            :options="languageOptions"
                                            option-label="label"
                                            option-value="value"
                                            required
                                        />
                                    </div>

                                    <Message v-if="siteConfigError" severity="error">
                                        {{ siteConfigError }}
                                    </Message>

                                    <div class="installation-wizard__actions">
                                        <Button
                                            :label="$t('common.prev')"
                                            severity="secondary"
                                            icon="pi pi-arrow-left"
                                            type="button"
                                            @click="activateCallback('2')"
                                        />
                                        <Button
                                            :label="$t('common.next')"
                                            icon="pi pi-arrow-right"
                                            icon-pos="right"
                                            type="submit"
                                            :loading="siteConfigLoading"
                                        />
                                    </div>
                                </form>
                            </div>
                        </StepPanel>

                        <!-- Step 4: 管理员创建 -->
                        <StepPanel v-slot="{activateCallback}" value="4">
                            <div class="installation-wizard__step">
                                <h2>{{ $t('installation.adminAccount.title') }}</h2>
                                <p>{{ $t('installation.adminAccount.description') }}</p>

                                <form class="installation-wizard__form" @submit.prevent="createAdmin(activateCallback)">
                                    <div class="form-field">
                                        <label for="adminName">{{ $t('installation.adminAccount.name') }} *</label>
                                        <InputText
                                            id="adminName"
                                            v-model="adminData.name"
                                            required
                                            :placeholder="$t('installation.adminAccount.namePlaceholder')"
                                        />
                                    </div>

                                    <div class="form-field">
                                        <label for="adminEmail">{{ $t('installation.adminAccount.email') }} *</label>
                                        <InputText
                                            id="adminEmail"
                                            v-model="adminData.email"
                                            type="email"
                                            required
                                            :placeholder="$t('installation.adminAccount.emailPlaceholder')"
                                        />
                                    </div>

                                    <div class="form-field">
                                        <label for="adminPassword">{{ $t('installation.adminAccount.password') }} *</label>
                                        <Password
                                            id="adminPassword"
                                            v-model="adminData.password"
                                            required
                                            toggle-mask
                                            :placeholder="$t('installation.adminAccount.passwordPlaceholder')"
                                            :feedback="true"
                                        />
                                        <small>{{ $t('installation.adminAccount.passwordHint') }}</small>
                                    </div>

                                    <Message v-if="adminError" severity="error">
                                        {{ adminError }}
                                    </Message>

                                    <div class="installation-wizard__actions">
                                        <Button
                                            :label="$t('common.prev')"
                                            severity="secondary"
                                            icon="pi pi-arrow-left"
                                            type="button"
                                            @click="activateCallback('3')"
                                        />
                                        <Button
                                            :label="$t('common.next')"
                                            icon="pi pi-arrow-right"
                                            icon-pos="right"
                                            type="submit"
                                            :loading="adminLoading"
                                        />
                                    </div>
                                </form>
                            </div>
                        </StepPanel>

                        <!-- Step 5: 可选功能配置 -->
                        <StepPanel v-slot="{activateCallback}" value="5">
                            <div class="installation-wizard__step">
                                <h2>{{ $t('installation.preview.title') }}</h2>
                                <p>{{ $t('installation.preview.description') }}</p>

                                <Message severity="info" class="mb-4">
                                    {{ $t('installation.preview.optional') }}
                                </Message>

                                <Accordion :multiple="true">
                                    <!-- AI 助手 -->
                                    <AccordionPanel value="ai">
                                        <AccordionHeader>
                                            <div class="flex gap-2 items-center">
                                                <i class="pi pi-sparkles text-primary" />
                                                <span>{{ $t('installation.preview.ai.title') }}</span>
                                            </div>
                                        </AccordionHeader>
                                        <AccordionContent>
                                            <p class="mb-4 text-muted-color text-sm">
                                                {{ $t('installation.preview.ai.desc') }}
                                            </p>
                                            <div class="installation-wizard__form">
                                                <div class="form-field">
                                                    <label>{{ $t('installation.preview.ai.provider') }}</label>
                                                    <Select v-model="extraConfig.aiProvider" :options="['openai', 'anthropic', 'google', 'deepseek']" />
                                                </div>
                                                <div class="form-field">
                                                    <label>{{ $t('installation.preview.ai.apiKey') }}</label>
                                                    <Password
                                                        v-model="extraConfig.aiApiKey"
                                                        toggle-mask
                                                        :feedback="false"
                                                    />
                                                </div>
                                                <div class="gap-4 grid grid-cols-2">
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.ai.model') }}</label>
                                                        <InputText v-model="extraConfig.aiModel" placeholder="gpt-4o" />
                                                    </div>
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.ai.endpoint') }}</label>
                                                        <InputText v-model="extraConfig.aiEndpoint" />
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionPanel>

                                    <!-- 邮件服务 -->
                                    <AccordionPanel value="email">
                                        <AccordionHeader>
                                            <div class="flex gap-2 items-center">
                                                <i class="pi pi-envelope text-primary" />
                                                <span>{{ $t('installation.preview.email.title') }}</span>
                                            </div>
                                        </AccordionHeader>
                                        <AccordionContent>
                                            <p class="mb-4 text-muted-color text-sm">
                                                {{ $t('installation.preview.email.desc') }}
                                            </p>
                                            <div class="installation-wizard__form">
                                                <div class="gap-4 grid grid-cols-3">
                                                    <div class="col-span-2 form-field">
                                                        <label>{{ $t('installation.preview.email.host') }}</label>
                                                        <InputText v-model="extraConfig.emailHost" placeholder="smtp.example.com" />
                                                    </div>
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.email.port') }}</label>
                                                        <InputNumber v-model="extraConfig.emailPort" :use-grouping="false" />
                                                    </div>
                                                </div>
                                                <div class="gap-4 grid grid-cols-2">
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.email.user') }}</label>
                                                        <InputText v-model="extraConfig.emailUser" />
                                                    </div>
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.email.pass') }}</label>
                                                        <Password
                                                            v-model="extraConfig.emailPass"
                                                            toggle-mask
                                                            :feedback="false"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionPanel>

                                    <!-- 文件存储 -->
                                    <AccordionPanel value="storage">
                                        <AccordionHeader>
                                            <div class="flex gap-2 items-center">
                                                <i class="pi pi-database text-primary" />
                                                <span>{{ $t('installation.preview.storage.title') }}</span>
                                            </div>
                                        </AccordionHeader>
                                        <AccordionContent>
                                            <p class="mb-4 text-muted-color text-sm">
                                                {{ $t('installation.preview.storage.desc') }}
                                            </p>
                                            <div class="installation-wizard__form">
                                                <div class="flex form-field gap-4 mb-4">
                                                    <div class="flex items-center">
                                                        <RadioButton
                                                            v-model="extraConfig.storageType"
                                                            input-id="storageLocal"
                                                            value="local"
                                                        />
                                                        <label for="storageLocal" class="mb-0 ml-2">{{ $t('installation.preview.storage.local') }}</label>
                                                    </div>
                                                    <div class="flex items-center">
                                                        <RadioButton
                                                            v-model="extraConfig.storageType"
                                                            input-id="storageS3"
                                                            value="s3"
                                                        />
                                                        <label for="storageS3" class="mb-0 ml-2">{{ $t('installation.preview.storage.s3') }}</label>
                                                    </div>
                                                </div>

                                                <!-- 本地存储配置 -->
                                                <div v-if="extraConfig.storageType === 'local'" class="gap-4 grid grid-cols-2">
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.storage.localDir') }}</label>
                                                        <InputText v-model="extraConfig.localStorageDir" placeholder="public/uploads" />
                                                    </div>
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.storage.localBaseUrl') }}</label>
                                                        <InputText v-model="extraConfig.localStorageBaseUrl" placeholder="/uploads" />
                                                    </div>
                                                </div>

                                                <!-- S3 存储配置 -->
                                                <div v-if="extraConfig.storageType === 's3'" class="gap-4 grid grid-cols-2">
                                                    <div class="col-span-2 form-field">
                                                        <label>{{ $t('installation.preview.storage.s3Endpoint') }}</label>
                                                        <InputText v-model="extraConfig.s3Endpoint" placeholder="https://<accountid>.r2.cloudflarestorage.com" />
                                                    </div>
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.storage.s3Bucket') }}</label>
                                                        <InputText v-model="extraConfig.s3Bucket" />
                                                    </div>
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.storage.s3Region') }}</label>
                                                        <InputText v-model="extraConfig.s3Region" placeholder="auto" />
                                                    </div>
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.storage.s3AccessKey') }}</label>
                                                        <InputText v-model="extraConfig.s3AccessKey" />
                                                    </div>
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.storage.s3SecretKey') }}</label>
                                                        <Password
                                                            v-model="extraConfig.s3SecretKey"
                                                            toggle-mask
                                                            :feedback="false"
                                                        />
                                                    </div>
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.storage.s3BaseUrl') }}</label>
                                                        <InputText v-model="extraConfig.s3BaseUrl" placeholder="https://pub-xxxx.r2.dev" />
                                                    </div>
                                                    <div class="form-field">
                                                        <label>{{ $t('installation.preview.storage.s3BucketPrefix') }}</label>
                                                        <InputText v-model="extraConfig.s3BucketPrefix" placeholder="uploads/" />
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionPanel>

                                    <!-- 统计分析 -->
                                    <AccordionPanel value="analytics">
                                        <AccordionHeader>
                                            <div class="flex gap-2 items-center">
                                                <i class="pi pi-chart-line text-primary" />
                                                <span>{{ $t('installation.preview.analytics.title') }}</span>
                                            </div>
                                        </AccordionHeader>
                                        <AccordionContent>
                                            <p class="mb-4 text-muted-color text-sm">
                                                {{ $t('installation.preview.analytics.desc') }}
                                            </p>
                                            <div class="installation-wizard__form">
                                                <div class="form-field">
                                                    <label>{{ $t('installation.preview.analytics.baidu') }}</label>
                                                    <InputText v-model="extraConfig.baiduAnalytics" />
                                                </div>
                                                <div class="form-field">
                                                    <label>{{ $t('installation.preview.analytics.google') }}</label>
                                                    <InputText v-model="extraConfig.googleAnalytics" />
                                                </div>
                                                <div class="form-field">
                                                    <label>{{ $t('installation.preview.analytics.clarity') }}</label>
                                                    <InputText v-model="extraConfig.clarityAnalytics" />
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionPanel>
                                </Accordion>

                                <div class="installation-wizard__actions mt-6">
                                    <Button
                                        :label="$t('common.prev')"
                                        severity="secondary"
                                        icon="pi pi-arrow-left"
                                        @click="activateCallback('4')"
                                    />
                                    <div class="flex gap-2">
                                        <Button
                                            :label="$t('installation.preview.skip')"
                                            severity="secondary"
                                            text
                                            @click="activateCallback('6')"
                                        />
                                        <Button
                                            :label="$t('installation.preview.next')"
                                            icon="pi pi-arrow-right"
                                            icon-pos="right"
                                            :loading="extraConfigLoading"
                                            @click="saveExtraConfig(activateCallback)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </StepPanel>

                        <!-- Step 6: 完成 -->
                        <StepPanel value="6">
                            <div class="installation-wizard__step">
                                <h2>{{ $t('installation.complete.title') }}</h2>
                                <p>{{ $t('installation.complete.description') }}</p>

                                <Message v-if="finalizeError" severity="error">
                                    {{ finalizeError }}
                                </Message>
                                <Message v-else-if="finalizeSuccess" severity="success">
                                    {{ $t('installation.complete.success') }}
                                </Message>

                                <div v-if="finalizeSuccess" class="installation-wizard__complete">
                                    <Message severity="warn">
                                        {{ $t('installation.complete.envHint') }}
                                    </Message>
                                    <code class="env-code">MOMEI_INSTALLED=true</code>
                                </div>

                                <div class="installation-wizard__actions">
                                    <Button
                                        v-if="!finalizeSuccess"
                                        :label="$t('installation.complete.finalize')"
                                        icon="pi pi-check"
                                        icon-pos="right"
                                        :loading="finalizeLoading"
                                        @click="finalizeInstallation()"
                                    />
                                    <Button
                                        v-else
                                        :label="$t('installation.complete.goToAdmin')"
                                        icon="pi pi-arrow-right"
                                        icon-pos="right"
                                        @click="navigateTo('/admin')"
                                    />
                                </div>
                            </div>
                        </StepPanel>
                    </StepPanels>
                </Stepper>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
// 显示引入 PrimeVue 组件以确保在 Nuxt 环境中正确识别
import Card from 'primevue/card'
import Stepper from 'primevue/stepper'
import StepList from 'primevue/steplist'
import Step from 'primevue/step'
import StepPanels from 'primevue/steppanels'
import StepPanel from 'primevue/steppanel'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Password from 'primevue/password'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import InputNumber from 'primevue/inputnumber'
import RadioButton from 'primevue/radiobutton'

definePageMeta({
    layout: 'installation',
})

const { t, locale } = useI18n()

// 当前步骤
const currentStep = ref('1')

// 安装状态
const installationStatus = ref<any>(null)

// Step 2: 数据库初始化
const dbInitLoading = ref(false)
const dbInitSuccess = ref(false)
const dbInitError = ref('')

// Step 3: 站点配置
const siteConfig = ref({
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    siteCopyright: '',
    defaultLanguage: 'zh-CN',
})
const siteConfigLoading = ref(false)
const siteConfigError = ref('')

const languageOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en-US' },
]

// Step 4: 管理员创建
const adminData = ref({
    name: '',
    email: '',
    password: '',
})
const adminLoading = ref(false)
const adminError = ref('')

// Step 5: 可选功能配置
const extraConfig = ref({
    // AI
    aiProvider: 'openai',
    aiApiKey: '',
    aiModel: 'gpt-4o',
    aiEndpoint: '',
    // Email
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPass: '',
    emailFrom: '',
    // Storage
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
    // Analytics
    baiduAnalytics: '',
    googleAnalytics: '',
    clarityAnalytics: '',
})
const extraConfigLoading = ref(false)

// Step 6: 完成
const finalizeLoading = ref(false)
const finalizeSuccess = ref(false)
const finalizeError = ref('')

// 获取安装状态
async function fetchInstallationStatus() {
    try {
        const response: any = await $fetch('/api/install/status')
        installationStatus.value = response.data

        // 如果系统已安装，且当前不是在展示“安装成功”的最后一步，则重定向到首页
        if (response.data?.installed && !finalizeSuccess.value) {
            navigateTo('/')
        }
    } catch (error: any) {
        console.error('Failed to fetch installation status:', error)
    }
}

// 初始化数据库
async function initDatabase() {
    dbInitLoading.value = true
    dbInitError.value = ''

    try {
        await $fetch('/api/install/init-db', {
            method: 'POST',
        })
        dbInitSuccess.value = true
    } catch (error: any) {
        dbInitError.value = error.data?.message || t('installation.database.error')
    } finally {
        dbInitLoading.value = false
    }
}

// 保存站点配置
async function saveSiteConfig(activateCallback: (step: string) => void) {
    siteConfigLoading.value = true
    siteConfigError.value = ''

    try {
        await $fetch('/api/install/setup-site', {
            method: 'POST',
            body: siteConfig.value,
        })
        activateCallback('4')
    } catch (error: any) {
        siteConfigError.value = error.data?.message || t('installation.siteConfig.error')
    } finally {
        siteConfigLoading.value = false
    }
}

// 创建管理员
async function createAdmin(activateCallback: (step: string) => void) {
    adminLoading.value = true
    adminError.value = ''

    try {
        await $fetch('/api/install/create-admin', {
            method: 'POST',
            body: adminData.value,
        })
        activateCallback('5')
    } catch (error: any) {
        adminError.value = error.data?.message || t('installation.adminAccount.error')
    } finally {
        adminLoading.value = false
    }
}

// 保存可选配置
async function saveExtraConfig(activateCallback: (step: string) => void) {
    extraConfigLoading.value = true
    try {
        // 由于当前后端尚未完全实现所有设置项的持久化接口，这里先模拟保存过程
        // 实际上这些配置后续可以保存到 Setting 实体中
        await new Promise((resolve) => setTimeout(resolve, 800))
        activateCallback('6')
    } catch (error: any) {
        // 预留错误处理
        activateCallback('6') // 选配失败不应阻碍主流程
    } finally {
        extraConfigLoading.value = false
    }
}

// 完成安装
async function finalizeInstallation() {
    finalizeLoading.value = true
    finalizeError.value = ''

    try {
        await $fetch('/api/install/finalize', {
            method: 'POST',
        })
        finalizeSuccess.value = true
    } catch (error: any) {
        finalizeError.value = error.data?.message || t('installation.complete.error')
    } finally {
        finalizeLoading.value = false
    }
}

// 页面加载时获取安装状态
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

    &__step {
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

    &__field {
        margin-bottom: 2rem;
        display: flex;
        align-items: center;
        gap: 1rem;

        label {
            font-weight: 500;
        }
    }

    &__checks-grid {
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

    &__checks {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin: 2rem 0;

        .check-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1rem;

            i {
                font-size: 1.5rem;
            }
        }
    }

    &__loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin: 3rem 0;
    }

    &__form {
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

    &__preview {
        margin: 2rem 0;

        p {
            margin: 1rem 0;
            color: var(--p-text-muted-color);
        }
    }

    &__complete {
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

    &__actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--p-surface-border);
    }
}

// 暗色模式适配
:global(.dark) {
    .installation-wizard {
        &__card {
            background: var(--p-surface-900);
        }

        &__complete .env-code {
            background: var(--p-surface-800);
        }

        .check-card--warning {
            background-color: rgb(251 146 60 / 0.1);
            border-color: var(--p-orange-800);

            .status-warning {
                color: var(--p-orange-400);
            }
        }
    }
}
</style>
