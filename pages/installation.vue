<template>
    <div class="installation-wizard">
        <CaomeiCard
            class="installation-wizard__card"
            variant="elevated"
            padding="none"
        >
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

            <div class="installation-wizard__body">
                <section class="installation-wizard__quick-start">
                    <div class="installation-wizard__language-bar">
                        <div>
                            <h2 class="installation-wizard__quick-start-title">
                                {{ $t('installation.languagePrompt.title') }}
                            </h2>
                            <p class="installation-wizard__quick-start-description">
                                {{ $t('installation.languagePrompt.description') }}
                            </p>
                        </div>

                        <div class="installation-wizard__field">
                            <label>{{ $t('installation.healthCheck.language') }}</label>
                            <LanguageSwitcher class="installation-wizard__lang-switcher" />
                        </div>
                    </div>

                    <div class="installation-wizard__setup-summary">
                        <div class="installation-wizard__setup-summary-intro">
                            <CaomeiTag tone="neutral">
                                {{ $t(`installation.setupChecklist.mode.${installationMode}`) }}
                            </CaomeiTag>
                            <div>
                                <h2 class="installation-wizard__setup-summary-title">
                                    {{ $t('installation.setupChecklist.summaryTitle') }}
                                </h2>
                                <p class="installation-wizard__setup-summary-description">
                                    {{ $t(`installation.setupChecklist.summary.${installationMode}`) }}
                                </p>
                            </div>
                        </div>

                        <ul class="installation-wizard__focus-list">
                            <li
                                v-for="item in immediateChecklist"
                                :key="item.key"
                                class="installation-wizard__focus-item"
                            >
                                <span class="installation-wizard__setup-icon">
                                    <component
                                        :is="INSTALLATION_CHECKLIST_ICONS[item.icon]"
                                        :size="18"
                                        aria-hidden="true"
                                    />
                                </span>
                                <strong>{{ $t(item.titleKey) }}</strong>
                            </li>
                        </ul>

                        <p class="installation-wizard__focus-later">
                            {{ $t('installation.setupChecklist.laterHint') }}
                        </p>
                    </div>
                </section>

                <CaomeiStepper
                    v-model="currentStep"
                    :linear="true"
                    class="installation-wizard__stepper"
                >
                    <CaomeiStepperList>
                        <CaomeiStepperItem
                            v-for="item in steps"
                            :key="item.value"
                            :step="item.value"
                            :completed="currentStep > item.value"
                            :disabled="item.value !== currentStep"
                        >
                            <CaomeiStepperTrigger>
                                <CaomeiStepperIndicator>
                                    <Check v-if="currentStep > item.value" :size="14" />
                                    <template v-else>
                                        {{ item.value }}
                                    </template>
                                </CaomeiStepperIndicator>
                                <CaomeiStepperTitle>{{ $t(item.labelKey) }}</CaomeiStepperTitle>
                            </CaomeiStepperTrigger>
                            <CaomeiStepperSeparator v-if="item.value < steps.length" />
                        </CaomeiStepperItem>
                    </CaomeiStepperList>
                </CaomeiStepper>

                <div class="installation-wizard__panels">
                    <StepHealthCheck
                        v-if="currentStep === 1"
                        :installation-status="installationStatus"
                        @next="goToStep(2)"
                    />

                    <StepDatabase
                        v-else-if="currentStep === 2"
                        :db-init-loading="dbInitLoading"
                        :db-init-success="dbInitSuccess"
                        :db-init-error="dbInitError"
                        @prev="goToStep(1)"
                        @next="handleDatabaseNext"
                    />

                    <StepSiteConfig
                        v-else-if="currentStep === 3"
                        v-model:site-config="siteConfig"
                        :site-config-loading="siteConfigLoading"
                        :site-config-error="siteConfigError"
                        :field-errors="siteFieldErrors"
                        :language-options="languageOptions"
                        :license-options="licenseOptions"
                        :env-settings="installationStatus?.envSettings || {}"
                        @prev="goToStep(2)"
                        @next="saveSiteConfig(goToStep)"
                    />

                    <StepAdminAccount
                        v-else-if="currentStep === 4"
                        v-model:admin-data="adminData"
                        :admin-loading="adminLoading"
                        :admin-error="adminError"
                        :field-errors="adminFieldErrors"
                        @prev="goToStep(3)"
                        @next="createAdmin(goToStep)"
                    />

                    <StepExtraConfig
                        v-else-if="currentStep === 5"
                        v-model:extra-config="extraConfig"
                        :extra-config-loading="extraConfigLoading"
                        :extra-config-error="extraConfigError"
                        :field-errors="extraFieldErrors"
                        :env-settings="installationStatus?.envSettings || {}"
                        @prev="goToStep(4)"
                        @skip="goToStep(6)"
                        @next="saveExtraConfig(goToStep)"
                    />

                    <StepComplete
                        v-else-if="currentStep === 6"
                        :finalize-loading="finalizeLoading"
                        :finalize-success="finalizeSuccess"
                        :finalize-error="finalizeError"
                        :checklist-mode="installationMode"
                        :follow-up-items="setupChecklist.later"
                        @finalize="finalizeInstallation()"
                        @go-to-admin="openAdminSettings()"
                    />
                </div>
            </div>
        </CaomeiCard>
    </div>
</template>

<script setup lang="ts">
import { Check } from '@lucide/vue'
import { INSTALLATION_CHECKLIST_ICONS } from '@/components/installation/checklist-icons'
import StepHealthCheck from '@/components/installation/step-health-check.vue'
import StepDatabase from '@/components/installation/step-database.vue'
import StepSiteConfig from '@/components/installation/step-site-config.vue'
import StepAdminAccount from '@/components/installation/step-admin-account.vue'
import StepExtraConfig from '@/components/installation/step-extra-config.vue'
import StepComplete from '@/components/installation/step-complete.vue'
import { useInstallationWizard } from '@/composables/use-installation-wizard'

definePageMeta({
    layout: 'installation',
})

const {
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
    initDatabase,
    saveSiteConfig,
    createAdmin,
    saveExtraConfig,
    finalizeInstallation,
    openAdminSettings,
} = useInstallationWizard()

const steps = [
    { value: 1, labelKey: 'installation.steps.healthCheck' },
    { value: 2, labelKey: 'installation.steps.database' },
    { value: 3, labelKey: 'installation.steps.siteConfig' },
    { value: 4, labelKey: 'installation.steps.adminAccount' },
    { value: 5, labelKey: 'installation.steps.preview' },
    { value: 6, labelKey: 'installation.steps.complete' },
] as const

/**
 * 步骤切换。caomei 的 `CaomeiStepper` 用数字步号（1 基），由页面统一持有；
 * `useInstallationWizard` 的保存动作以回调形式回到这里，避免组件内部反向持有步号语义。
 */
const goToStep = (step: number) => {
    currentStep.value = step
}

/** 数据库步骤：初始化成功后进入下一步，否则先触发初始化。 */
const handleDatabaseNext = () => {
    if (dbInitSuccess.value) {
        goToStep(3)
        return
    }

    void initDatabase()
}
</script>

<style scoped lang="scss">
.installation-wizard {
    &__card {
        /* 外壳样式全部交给 `CaomeiCard`：只通过它的覆盖钩子改圆角与阴影，
         * 避免与库内 `.caomei-card--elevated` 的同特异性规则比拼加载顺序。 */
        --caomei-card-radius: 1rem;
        --caomei-card-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
    }

    &__header {
        /* `CaomeiCard` 的自定义 `#header` 外层是 flex 容器；不占满会把本块压缩成内容宽度，
         * 标题 / 副标题随之左对齐（迁移前 PrimeVue 标题是居中的）。 */
        flex: 1;
        width: 100%;
        text-align: center;

        /* 迁移前标题与副标题各占一个 PrimeVue 插槽，两个插槽都带 `.installation-wizard__header`
         * 的 `2rem` 内边距（外加 card body 的 1.5rem）；合并成单个 header 后按原总高还原。 */
        padding: 3.5rem 1.5rem 1rem;
    }

    &__body {
        padding: 0 1.5rem 1.5rem;
    }

    &__title {
        font-size: 2rem;
        font-weight: 700;
        color: var(--caomei-color-text);

        /* 0.5rem 标题下边距 + PrimeVue `.p-card-title` 的 1rem + 副标题插槽的 2rem 内边距。 */
        margin: 0 0 3.5rem;
    }

    &__subtitle {
        font-size: 1rem;
        line-height: 1.5;
        color: var(--caomei-color-text-muted);

        /* PrimeVue `.p-card-subtitle` 自带的行高与下边距，合并后需显式补回。 */
        margin: 0 0 0.5rem;
    }

    &__quick-start {
        display: grid;
        gap: 1rem;
        margin: 0 0 1.5rem;
    }

    &__language-bar,
    &__setup-summary {
        display: grid;
        gap: 0.875rem;
        padding: 1rem 1.25rem;
        border: 1px solid var(--caomei-color-border);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--m-primary-50) 32%, var(--m-surface-0) 68%);
    }

    &__language-bar {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
    }

    &__quick-start-title,
    &__setup-summary-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: var(--caomei-color-text);
    }

    &__quick-start-description,
    &__setup-summary-description {
        margin: 0.25rem 0 0;
        color: var(--caomei-color-text-muted);
        line-height: 1.5;
    }

    &__setup-summary-intro {
        display: grid;
        gap: 0.75rem;
    }

    &__focus-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
    }

    &__focus-item {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 0.625rem;
        padding: 0.75rem 0.875rem;
        border-radius: 0.875rem;
        background: color-mix(in srgb, var(--m-surface-0) 86%, var(--m-primary-50) 14%);
        border: 1px solid color-mix(in srgb, var(--caomei-color-border) 76%, white 24%);

        strong {
            color: var(--caomei-color-text);
            font-size: 0.92rem;
        }
    }

    &__focus-later {
        margin: 0;
        color: var(--caomei-color-text-muted);
        font-size: 0.875rem;
        line-height: 1.5;
    }

    &__setup-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.75rem;
        background: color-mix(in srgb, var(--caomei-color-primary) 12%, white 88%);
        color: var(--caomei-color-primary);
    }

    .text-error {
        color: var(--caomei-color-danger);
    }

    :deep(.form-field) {
        /* caomei 的选择器 / 数字框默认带 20rem / 12rem 上限，迁移前 PrimeVue `fluid` 为 100%；
         * token 在字段外层声明，靠继承落到 `.caomei-*-field`（写在组件标签上会静默无效）。 */
        --caomei-select-max-width: 100%;
        --caomei-input-number-max-width: 100%;

        display: grid;
        gap: 0.45rem;
        margin-bottom: 1rem;

        label {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
            font-weight: 600;
        }
    }

    :deep(.installation-wizard__step-message) {
        margin-bottom: 1rem;
    }

    :deep(.installation-wizard__field-error) {
        display: block;
        margin-top: 0.25rem;
        color: var(--m-red-500);
        font-size: 0.8125rem;
        line-height: 1.5;
    }

    :deep(.installation-wizard__field-lock) {
        display: block;
        margin-top: 0.25rem;
        color: var(--m-orange-500);
        font-size: 0.8125rem;
        line-height: 1.5;
    }

    :deep(.caomei-tag) {
        /* 迁移前 `.p-tag` 是 12px 字号 + 4px/8px 内边距（约 24px 高）；
         * caomei 默认取控件高度档（36px），此处按 token 回落到原尺寸。 */
        --caomei-tag-height: 1.5rem;
        --caomei-tag-padding-x: 0.5rem;

        font-size: 0.75rem;
    }

    &__stepper {
        margin-bottom: 1rem;
    }

    :deep(.caomei-stepper__separator) {
        /* 分隔线取固定短长度，把剩余宽度让给标题区；默认 `flex: 1 1 auto`
         * 会与触发器平分每步宽度，长标签被压成多行。 */
        flex: 0 0 1rem;
    }

    :deep(.caomei-stepper__trigger) {
        /* 6 步在 800px 容器内等分后每步约 120px，标题区约 60px；
         * 允许换行并居中，避免长标签（日 / 韩语更长）溢出到相邻步骤。 */
        flex: 1 1 auto;
        min-width: 0;
        justify-content: center;
    }

    :deep(.caomei-stepper__title) {
        font-size: 0.75rem;
        font-weight: 500;
        line-height: 1.3;
        text-align: center;
    }

    :deep(.installation-wizard__step) {
        padding: 2rem;

        h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--caomei-color-text);
            margin: 0 0 0.5rem;
        }

        > p {
            color: var(--caomei-color-text-muted);
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
            border: 1px solid var(--caomei-color-border);
            background-color: var(--m-surface-0);
            transition: all 0.2s;

            &:hover {
                border-color: var(--caomei-color-primary);
                box-shadow: 0 4px 6px -1px var(--m-primary-100);
            }

            &--warning {
                border-color: var(--m-orange-300);
                background-color: var(--m-orange-50);

                &:hover {
                    border-color: var(--m-orange-500);
                }

                .check-card__header {
                    color: var(--m-orange-600);
                }
            }

            &__header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1rem;
                font-weight: 600;
                color: var(--caomei-color-primary);
            }

            &__content {
                .status-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 1.1rem;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                }

                .status-detail {
                    font-size: 0.875rem;
                    color: var(--caomei-color-text-muted);
                }

                .status-warning {
                    font-size: 0.75rem;
                    color: var(--m-orange-600);
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
                color: var(--caomei-color-text);
            }

            small:not(.installation-wizard__field-error, .installation-wizard__field-lock) {
                display: block;
                margin-top: 0.25rem;
                color: var(--caomei-color-text-muted);
                font-size: 0.875rem;
            }
        }
    }

    :deep(.installation-wizard__complete) {
        margin: 2rem 0;

        .env-code {
            display: block;
            padding: 1rem;
            background: var(--m-surface-100);
            border-radius: 0.5rem;
            font-family: monospace;
            margin-top: 1rem;
        }
    }

    :deep(.installation-wizard__follow-up) {
        margin-top: 1.5rem;
        padding: 1rem;
        border-radius: 0.875rem;
        background: color-mix(in srgb, var(--m-primary-50) 42%, var(--m-surface-0) 58%);
        border: 1px solid var(--caomei-color-border);

        h3 {
            margin: 0;
            font-size: 1rem;
            font-weight: 700;
            color: var(--caomei-color-text);
        }

        > p {
            margin: 0.5rem 0 0;
            color: var(--caomei-color-text-muted);
            line-height: 1.6;
        }
    }

    :deep(.installation-wizard__follow-up-list) {
        display: grid;
        gap: 0.75rem;
        margin-top: 1rem;
    }

    :deep(.installation-wizard__follow-up-action) {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.75rem;
        align-items: center;
        width: 100%;
        padding: 0.875rem 1rem;
        border: 1px solid var(--caomei-color-border);
        border-radius: 0.75rem;
        background: var(--m-surface-0);
        color: var(--caomei-color-text);
        text-align: left;
        cursor: pointer;
        transition: border-color 0.2s ease, transform 0.2s ease;

        &:hover {
            transform: translateY(-1px);
            border-color: var(--caomei-color-primary);
        }

        strong,
        small,
        span {
            display: block;
        }

        small {
            margin-top: 0.3rem;
            color: var(--caomei-color-text-muted);
            font-size: 0.8rem;
        }
    }

    :deep(.installation-wizard__follow-up-icon) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--caomei-color-primary) 12%, white 88%);
        color: var(--caomei-color-primary);
    }

    :deep(.installation-wizard__follow-up-cta) {
        color: var(--caomei-color-primary);
        font-size: 0.875rem;
        font-weight: 600;
        white-space: nowrap;
    }

    :deep(.installation-wizard__actions) {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 2rem;
    }
}

@media (width <= 768px) {
    .installation-wizard {
        &__language-bar {
            grid-template-columns: 1fr;
        }

        &__setup-summary {
            padding: 1rem;
        }

        &__focus-list {
            grid-template-columns: 1fr;
        }

        :deep(.installation-wizard__follow-up-action) {
            grid-template-columns: auto 1fr;

            .installation-wizard__follow-up-cta {
                grid-column: 2;
            }
        }
    }
}

:global(.dark) {
    .installation-wizard {
        &__language-bar,
        &__setup-summary {
            background: color-mix(in srgb, var(--m-primary-900) 32%, var(--m-surface-900) 68%);
        }

        &__focus-item {
            background: color-mix(in srgb, var(--m-surface-900) 82%, var(--m-primary-900) 18%);
        }

        &__setup-icon,
        :deep(.installation-wizard__follow-up-icon) {
            background: color-mix(in srgb, var(--caomei-color-primary) 20%, var(--m-surface-900) 80%);
        }

        :deep(.installation-wizard__follow-up) {
            background: color-mix(in srgb, var(--m-primary-900) 28%, var(--m-surface-900) 72%);
        }

        :deep(.installation-wizard__follow-up-action) {
            background: var(--m-surface-800);
        }
    }
}
</style>
