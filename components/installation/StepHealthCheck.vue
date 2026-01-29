<template>
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
                @click="onNext"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

defineProps<{
    installationStatus: any
}>()

const emit = defineEmits(['next'])
const onNext = () => emit('next')
</script>
