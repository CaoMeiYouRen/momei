<template>
    <div class="installation-wizard">
        <Card class="installation-wizard__card">
            <!-- 头部 -->
            <template #header>
                <div class="installation-wizard__header">
                    <h1 class="installation-wizard__title">
                        {{ $t('installation.title') }}
                    </h1>
                    <p class="installation-wizard__subtitle">
                        {{ $t('installation.subtitle') }}
                    </p>
                </div>
            </template>

            <!-- 步骤指示器 -->
            <Stepper v-model:value="currentStep" linear>
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
                    <StepPanel v-slot="{ activateCallback }" value="1">
                        <div class="installation-wizard__step">
                            <h2>{{ $t('installation.healthCheck.title') }}</h2>
                            <p>{{ $t('installation.healthCheck.description') }}</p>

                            <div class="installation-wizard__checks">
                                <div class="check-item">
                                    <i
                                        :class="[
                                            'pi',
                                            installationStatus?.databaseConnected ? 'pi-check-circle' : 'pi-times-circle',
                                        ]"
                                        :style="{ color: installationStatus?.databaseConnected ? 'var(--p-green-500)' : 'var(--p-red-500)' }"
                                    />
                                    <span>{{ $t('installation.healthCheck.database') }}</span>
                                </div>
                                <div class="check-item">
                                    <i class="pi pi-check-circle" style="color: var(--p-green-500)" />
                                    <span>{{ $t('installation.healthCheck.node') }}</span>
                                </div>
                            </div>

                            <div class="installation-wizard__actions">
                                <Button
                                    :label="$t('common.next')"
                                    icon="pi pi-arrow-right"
                                    icon-pos="right"
                                    :disabled="!installationStatus?.databaseConnected"
                                    @click="activateCallback('2')"
                                />
                            </div>
                        </div>
                    </StepPanel>

                    <!-- Step 2: 数据库初始化 -->
                    <StepPanel v-slot="{ activateCallback }" value="2">
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
                                    :label="$t('common.previous')"
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
                    <StepPanel v-slot="{ activateCallback }" value="3">
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
                                        :label="$t('common.previous')"
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
                    <StepPanel v-slot="{ activateCallback }" value="4">
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
                                        :label="$t('common.previous')"
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

                    <!-- Step 5: 功能预览 -->
                    <StepPanel v-slot="{ activateCallback }" value="5">
                        <div class="installation-wizard__step">
                            <h2>{{ $t('installation.preview.title') }}</h2>
                            <p>{{ $t('installation.preview.description') }}</p>

                            <div class="installation-wizard__preview">
                                <Message severity="info">
                                    {{ $t('installation.preview.optional') }}
                                </Message>

                                <p>{{ $t('installation.preview.aiHint') }}</p>
                                <p>{{ $t('installation.preview.seoHint') }}</p>
                            </div>

                            <div class="installation-wizard__actions">
                                <Button
                                    :label="$t('common.previous')"
                                    severity="secondary"
                                    icon="pi pi-arrow-left"
                                    @click="activateCallback('4')"
                                />
                                <Button
                                    :label="$t('installation.preview.skip')"
                                    icon="pi pi-arrow-right"
                                    icon-pos="right"
                                    @click="activateCallback('6')"
                                />
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
        </Card>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'installation',
})

const { t } = useI18n()

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

// Step 6: 完成
const finalizeLoading = ref(false)
const finalizeSuccess = ref(false)
const finalizeError = ref('')

// 获取安装状态
async function fetchInstallationStatus() {
    try {
        const response = await $fetch('/api/install/status')
        installationStatus.value = response.data
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
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 10%), 0 2px 4px -1px rgb(0 0 0 / 6%);
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
    }
}
</style>
