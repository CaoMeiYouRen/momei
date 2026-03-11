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
                            <Tag
                                severity="contrast"
                                :value="$t(`installation.setupChecklist.mode.${installationMode}`)"
                            />
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
                                    <i :class="item.icon" />
                                </span>
                                <strong>{{ $t(item.titleKey) }}</strong>
                            </li>
                        </ul>

                        <p class="installation-wizard__focus-later">
                            {{ $t('installation.setupChecklist.laterHint') }}
                        </p>
                    </div>
                </section>

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
                                :license-options="licenseOptions"
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
                                :checklist-mode="installationMode"
                                :follow-up-items="setupChecklist.later"
                                @finalize="finalizeInstallation()"
                                @go-to-admin="openAdminSettings()"
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
        border: 1px solid var(--p-content-border-color);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--p-primary-50) 32%, var(--p-surface-0) 68%);
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
        color: var(--p-text-color);
    }

    &__quick-start-description,
    &__setup-summary-description {
        margin: 0.25rem 0 0;
        color: var(--p-text-muted-color);
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
        background: color-mix(in srgb, var(--p-surface-0) 86%, var(--p-primary-50) 14%);
        border: 1px solid color-mix(in srgb, var(--p-content-border-color) 76%, white 24%);

        strong {
            color: var(--p-text-color);
            font-size: 0.92rem;
        }
    }

    &__focus-later {
        margin: 0;
        color: var(--p-text-muted-color);
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
        background: color-mix(in srgb, var(--p-primary-color) 12%, white 88%);
        color: var(--p-primary-color);
    }

    .text-error {
        color: var(--p-error-color);
    }

    :deep(.form-field) {
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
        color: var(--p-red-500);
        font-size: 0.8125rem;
        line-height: 1.5;
    }

    :deep(.installation-wizard__field-lock) {
        display: block;
        margin-top: 0.25rem;
        color: var(--p-orange-500);
        font-size: 0.8125rem;
        line-height: 1.5;
    }

    :deep(.p-tag) {
        font-size: 0.75rem;
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

            small:not(.installation-wizard__field-error, .installation-wizard__field-lock) {
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

    :deep(.installation-wizard__follow-up) {
        margin-top: 1.5rem;
        padding: 1rem;
        border-radius: 0.875rem;
        background: color-mix(in srgb, var(--p-primary-50) 42%, var(--p-surface-0) 58%);
        border: 1px solid var(--p-content-border-color);

        h3 {
            margin: 0;
            font-size: 1rem;
            font-weight: 700;
            color: var(--p-text-color);
        }

        > p {
            margin: 0.5rem 0 0;
            color: var(--p-text-muted-color);
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
        border: 1px solid var(--p-content-border-color);
        border-radius: 0.75rem;
        background: var(--p-content-background);
        color: var(--p-text-color);
        text-align: left;
        cursor: pointer;
        transition: border-color 0.2s ease, transform 0.2s ease;

        &:hover {
            transform: translateY(-1px);
            border-color: var(--p-primary-color);
        }

        strong,
        small,
        span {
            display: block;
        }

        small {
            margin-top: 0.3rem;
            color: var(--p-text-muted-color);
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
        background: color-mix(in srgb, var(--p-primary-color) 12%, white 88%);
        color: var(--p-primary-color);
    }

    :deep(.installation-wizard__follow-up-cta) {
        color: var(--p-primary-color);
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
        border-top: 1px solid var(--p-surface-border);
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
        &__card {
            background: var(--p-surface-900);
        }

        &__language-bar,
        &__setup-summary {
            background: color-mix(in srgb, var(--p-primary-900) 32%, var(--p-surface-900) 68%);
        }

        &__focus-item {
            background: color-mix(in srgb, var(--p-surface-900) 82%, var(--p-primary-900) 18%);
        }

        &__setup-icon,
        :deep(.installation-wizard__follow-up-icon) {
            background: color-mix(in srgb, var(--p-primary-color) 20%, var(--p-surface-900) 80%);
        }

        :deep(.installation-wizard__follow-up) {
            background: color-mix(in srgb, var(--p-primary-900) 28%, var(--p-surface-900) 72%);
        }

        :deep(.installation-wizard__follow-up-action) {
            background: var(--p-surface-800);
        }
    }
}
</style>
