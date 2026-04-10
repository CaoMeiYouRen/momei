<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.healthCheck.title') }}</h2>
        <p>{{ $t('installation.healthCheck.description') }}</p>
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
                    <span>{{ $t('installation.healthCheck.runtime') }}</span>
                </div>
                <div class="check-card__content">
                    <div class="status-row">
                        <span>{{ runtimeLabel }}</span>
                        <i
                            :class="installationStatus.deploymentDiagnostics.platformSupported ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-red-500'"
                        />
                    </div>
                    <div class="status-detail">
                        {{ installationStatus.isServerless ? $t('installation.healthCheck.serverlessEnabled') : $t('installation.healthCheck.serverlessDisabled') }}
                    </div>
                    <div v-if="!installationStatus.deploymentDiagnostics.platformSupported" class="status-warning">
                        {{ $t('installation.healthCheck.platformUnsupported') }}
                    </div>
                </div>
            </div>
        </div>

        <section v-if="installationStatus" class="installation-wizard__diagnostics">
            <div
                class="installation-wizard__diagnostics-summary"
                :class="{'installation-wizard__diagnostics-summary--blocker': hasBlockingIssues}"
            >
                <p class="installation-wizard__diagnostics-title">
                    {{ hasBlockingIssues ? $t('installation.healthCheck.summary.blocked') : $t('installation.healthCheck.summary.ready') }}
                </p>
                <p class="installation-wizard__diagnostics-text">
                    {{ $t('installation.healthCheck.summary.counts', {
                        blockers: installationStatus.deploymentDiagnostics.blockerCount,
                        warnings: installationStatus.deploymentDiagnostics.warningCount
                    }) }}
                </p>
            </div>

            <ul
                v-if="installationStatus.deploymentDiagnostics.issues.length > 0"
                class="installation-wizard__diagnostics-list"
            >
                <li
                    v-for="issue in installationStatus.deploymentDiagnostics.issues"
                    :key="issue.code"
                    class="installation-wizard__diagnostics-item"
                    :class="`installation-wizard__diagnostics-item--${issue.severity}`"
                >
                    <div class="installation-wizard__diagnostics-item-header">
                        <strong>{{ $t(`installation.healthCheck.issues.${issue.code}.title`) }}</strong>
                        <span class="installation-wizard__diagnostics-badge">
                            {{ $t(`installation.healthCheck.severity.${issue.severity}`) }}
                        </span>
                    </div>
                    <p class="installation-wizard__diagnostics-item-text">
                        {{ $t(`installation.healthCheck.issues.${issue.code}.description`) }}
                    </p>
                    <p v-if="issue.envKeys.length > 0" class="installation-wizard__diagnostics-item-env">
                        {{ $t('installation.healthCheck.envKeysLabel') }}: {{ issue.envKeys.join(', ') }}
                    </p>
                </li>
            </ul>

            <div class="installation-wizard__diagnostics-resources">
                <a
                    v-for="resource in resourceLinks"
                    :key="resource.key"
                    class="installation-wizard__diagnostics-resource"
                    :href="resource.href"
                    :target="resource.external ? '_blank' : undefined"
                    :rel="resource.external ? 'noopener noreferrer' : undefined"
                >
                    {{ $t(resource.labelKey) }}
                </a>
            </div>
        </section>

        <div v-else class="installation-wizard__loading">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <p>{{ $t('common.loading') }}</p>
        </div>

        <div class="installation-wizard__actions">
            <Button
                :label="$t('common.next')"
                icon="pi pi-arrow-right"
                icon-pos="right"
                :disabled="!installationStatus || !installationStatus?.databaseConnected || hasBlockingIssues"
                :loading="!installationStatus"
                @click="onNext"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import type { InstallationDiagnostics, InstallationRuntime } from '@/utils/shared/installation-diagnostics'
import { buildInstallationDocResources } from '@/utils/shared/installation-doc-links'

interface InstallationStatusView {
    databaseConnected: boolean
    databaseType: string
    databaseVersion: string
    isServerless: boolean
    isNodeVersionSafe: boolean
    nodeVersion: string
    os: string
    runtime: InstallationRuntime
    deploymentDiagnostics: InstallationDiagnostics
}

const props = defineProps<{
    installationStatus: InstallationStatusView | null
}>()

const { t, locale } = useI18n()

const runtimeLabelKeyMap: Record<InstallationRuntime, string> = {
    'local-dev': 'installation.healthCheck.runtimeLabels.local-dev',
    docker: 'installation.healthCheck.runtimeLabels.docker',
    'self-hosted-node': 'installation.healthCheck.runtimeLabels.self-hosted-node',
    vercel: 'installation.healthCheck.runtimeLabels.vercel',
    netlify: 'installation.healthCheck.runtimeLabels.netlify',
    cloudflare: 'installation.healthCheck.runtimeLabels.cloudflare',
    'aws-lambda': 'installation.healthCheck.runtimeLabels.aws-lambda',
    zeabur: 'installation.healthCheck.runtimeLabels.zeabur',
    unknown: 'installation.healthCheck.runtimeLabels.unknown',
}

const runtimeLabel = computed(() => {
    const runtime = props.installationStatus?.runtime || 'unknown'
    return t(runtimeLabelKeyMap[runtime])
})

const hasBlockingIssues = computed(() => props.installationStatus?.deploymentDiagnostics.hasBlockingIssues ?? false)

const resourceLinks = computed(() => buildInstallationDocResources({
    locale: unref(locale),
    issues: props.installationStatus?.deploymentDiagnostics.issues ?? [],
}))

const emit = defineEmits(['next'])
const onNext = () => emit('next')
</script>

<style scoped lang="scss">
.installation-wizard {
    &__diagnostics {
        margin-top: 1.25rem;
        display: grid;
        gap: 1rem;
    }

    &__diagnostics-summary {
        padding: 1rem 1.125rem;
        border-radius: 0.875rem;
        border: 1px solid color-mix(in srgb, var(--p-primary-color) 30%, transparent);
        background: color-mix(in srgb, var(--p-primary-color) 8%, var(--p-surface-0));

        &--blocker {
            border-color: color-mix(in srgb, #ef4444 45%, transparent);
            background: color-mix(in srgb, #ef4444 8%, var(--p-surface-0));
        }
    }

    &__diagnostics-title,
    &__diagnostics-text,
    &__diagnostics-item-text,
    &__diagnostics-item-env {
        margin: 0;
    }

    &__diagnostics-title {
        font-weight: 700;
    }

    &__diagnostics-text,
    &__diagnostics-item-text,
    &__diagnostics-item-env {
        color: var(--p-text-muted-color);
        line-height: 1.6;
    }

    &__diagnostics-list {
        display: grid;
        gap: 0.75rem;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    &__diagnostics-item {
        display: grid;
        gap: 0.45rem;
        padding: 0.9rem 1rem;
        border-radius: 0.875rem;
        border: 1px solid var(--p-content-border-color);
        background: var(--p-surface-0);

        &--blocker {
            border-color: color-mix(in srgb, #ef4444 45%, transparent);
        }

        &--warning {
            border-color: color-mix(in srgb, #f59e0b 45%, transparent);
        }
    }

    &__diagnostics-item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
    }

    &__diagnostics-badge {
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--p-primary-color) 12%, var(--p-surface-0));
        color: var(--p-text-muted-color);
        font-size: 0.75rem;
        white-space: nowrap;
    }

    &__diagnostics-resources {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    &__diagnostics-resource {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.5rem;
        padding: 0.55rem 0.9rem;
        border-radius: 999px;
        border: 1px solid var(--p-content-border-color);
        color: inherit;
        text-decoration: none;
        transition: border-color 0.2s ease, background-color 0.2s ease;

        &:hover {
            border-color: var(--p-primary-color);
            background: color-mix(in srgb, var(--p-primary-color) 8%, var(--p-surface-0));
        }
    }
}
</style>
