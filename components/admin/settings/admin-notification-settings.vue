<template>
    <div class="admin-notifications">
        <Message
            v-if="demoPreview"
            severity="info"
            :closable="false"
            class="mb-4"
        >
            {{ $t('pages.admin.settings.system.demo_preview.description') }}
        </Message>

        <div class="admin-notifications__web-push">
            <div class="admin-notifications__section-header">
                <div class="admin-notifications__section-copy">
                    <h4 class="admin-notifications__section-title">
                        {{ $t('pages.admin.settings.system.notifications.web_push.title') }}
                    </h4>
                    <p class="admin-notifications__description">
                        {{ $t('pages.admin.settings.system.notifications.web_push.description') }}
                    </p>
                </div>
                <Tag :severity="webPush.isConfigured ? 'success' : 'warn'">
                    {{ webPush.isConfigured
                        ? $t('pages.admin.settings.system.notifications.web_push.status_ready')
                        : $t('pages.admin.settings.system.notifications.web_push.status_incomplete') }}
                </Tag>
            </div>

            <div class="admin-notifications__status-panel">
                <Message
                    :severity="webPush.isConfigured ? 'success' : 'warn'"
                    :closable="false"
                    class="admin-notifications__status-message"
                >
                    <div class="admin-notifications__status-copy">
                        <span>{{ $t('pages.admin.settings.system.notifications.web_push.private_key_status') }}</span>
                        <strong>
                            {{ webPush.privateKeyConfigured
                                ? $t('pages.admin.settings.system.notifications.web_push.private_key_ready')
                                : $t('pages.admin.settings.system.notifications.web_push.private_key_missing') }}
                        </strong>
                    </div>
                </Message>

                <div class="admin-notifications__field-grid">
                    <SettingFormField
                        field-key="web_push_vapid_subject"
                        input-id="web-push-subject"
                        :metadata="webPush.subject"
                    >
                        <InputText
                            id="web-push-subject"
                            v-model="webPush.subject.value"
                            :disabled="webPush.subject.isLocked"
                            fluid
                        />
                    </SettingFormField>

                    <SettingFormField
                        field-key="web_push_vapid_public_key"
                        input-id="web-push-public-key"
                        :metadata="webPush.publicKey"
                    >
                        <Textarea
                            id="web-push-public-key"
                            v-model="webPush.publicKey.value"
                            :disabled="webPush.publicKey.isLocked"
                            rows="4"
                            auto-resize
                            fluid
                        />
                    </SettingFormField>
                </div>

                <p class="admin-notifications__helper">
                    {{ $t('pages.admin.settings.system.notifications.web_push.private_key_hint') }}
                </p>
            </div>
        </div>

        <div class="mb-4">
            <h3 class="font-bold mb-2 text-xl">
                {{ $t('pages.admin.settings.system.notifications.title') }}
            </h3>
            <p class="text-muted-color">
                {{ $t('pages.admin.settings.system.notifications.description') }}
            </p>
        </div>

        <DataTable :value="settings" class="mt-4">
            <Column
                field="event"
                :header="$t('pages.admin.settings.system.notifications.event')"
            >
                <template #body="{data}">
                    <span class="font-medium">{{ $t(`pages.admin.settings.system.notifications.events.${data.event}`) }}</span>
                </template>
            </Column>
            <Column
                field="isEmailEnabled"
                :header="$t('pages.admin.settings.system.notifications.email')"
                class="text-center"
            >
                <template #body="{data}">
                    <ToggleSwitch v-model="data.isEmailEnabled" />
                </template>
            </Column>
            <Column
                field="isBrowserEnabled"
                :header="$t('pages.admin.settings.system.notifications.browser')"
                class="text-center"
            >
                <template #body="{data}">
                    <ToggleSwitch v-model="data.isBrowserEnabled" />
                </template>
            </Column>
        </DataTable>

        <div class="flex justify-content-end mt-4">
            <Button
                :label="$t('common.save')"
                icon="pi pi-check"
                :loading="saving"
                @click="save"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'
import type { SettingLockReason, SettingSource } from '@/types/setting'

interface AdminNotificationSettingItem {
    event: string
    isEmailEnabled: boolean
    isBrowserEnabled: boolean
}

interface AdminNotificationWebPushField {
    value: string
    source: SettingSource
    isLocked: boolean
    envKey: string | null
    defaultUsed: boolean
    lockReason: SettingLockReason | null
    requiresRestart: boolean
}

interface AdminNotificationWebPushState {
    subject: AdminNotificationWebPushField
    publicKey: AdminNotificationWebPushField
    privateKeyConfigured: boolean
    isConfigured: boolean
}

interface AdminNotificationResponse {
    data: {
        items: AdminNotificationSettingItem[]
        demoPreview?: boolean
        webPush?: AdminNotificationWebPushState
    }
}

const { t } = useI18n()
const toast = useToast()
const { $appFetch } = useAppApi()

const settings = ref<AdminNotificationSettingItem[]>([])
const loading = ref(false)
const saving = ref(false)
const demoPreview = ref(false)
const defaultWebPushState: AdminNotificationWebPushState = {
    subject: {
        value: '',
        source: 'default',
        isLocked: false,
        envKey: null,
        defaultUsed: true,
        lockReason: null,
        requiresRestart: false,
    },
    publicKey: {
        value: '',
        source: 'default',
        isLocked: false,
        envKey: null,
        defaultUsed: true,
        lockReason: null,
        requiresRestart: false,
    },
    privateKeyConfigured: false,
    isConfigured: false,
}

const webPush = ref<AdminNotificationWebPushState>(defaultWebPushState)

function getFieldDescription(field: AdminNotificationWebPushField, unlockedHint: string) {
    if (field.isLocked) {
        return `${t('pages.admin.settings.system.hints.env_locked')} (${field.envKey})`
    }

    return unlockedHint
}

function getErrorDetail(error: unknown, fallback: string) {
    const candidate = error as {
        data?: { message?: string, statusMessage?: string }
        statusMessage?: string
        message?: string
    }

    return candidate?.data?.message
        || candidate?.data?.statusMessage
        || candidate?.statusMessage
        || candidate?.message
        || fallback
}

const load = async () => {
    loading.value = true
    try {
        const response = await $appFetch<AdminNotificationResponse>('/api/admin/settings/notifications/admin')
        settings.value = response.data.items || []
        demoPreview.value = Boolean(response.data.demoPreview)
        webPush.value = response.data.webPush || defaultWebPushState
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: getErrorDetail(error, t('common.error_loading')),
            life: 5000,
        })
    } finally {
        loading.value = false
    }
}

const save = async () => {
    saving.value = true
    try {
        await $appFetch('/api/admin/settings/notifications/admin', {
            method: 'PUT',
            body: {
                items: settings.value,
                webPush: {
                    subject: webPush.value.subject.value,
                    publicKey: webPush.value.publicKey.value,
                },
            },
        })
        await load()
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('common.save_success'),
            life: 3000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: getErrorDetail(error, t('common.save_failed')),
            life: 5000,
        })
    } finally {
        saving.value = false
    }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.admin-notifications {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    &__web-push {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.25rem;
        border: 1px solid var(--p-surface-border);
        border-radius: 1rem;
        background: var(--p-surface-0);
        box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
    }

    &__section-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;

        @media (width <= 768px) {
            flex-direction: column;
        }
    }

    &__section-copy {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;
    }

    &__section-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }

    &__description {
        margin: 0;
        color: var(--p-text-muted-color);
        line-height: 1.6;
    }

    &__status-message {
        margin: 0;
    }

    &__status-panel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        border-radius: 0.875rem;
        background: color-mix(in srgb, var(--p-surface-50) 78%, white);
        border: 1px solid color-mix(in srgb, var(--p-surface-border) 88%, white);
    }

    &__status-copy {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
    }

    &__field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;

        @media (width <= 768px) {
            grid-template-columns: 1fr;
        }
    }

    &__helper {
        margin: 0;
        font-size: 0.875rem;
        color: var(--p-text-muted-color);
        line-height: 1.5;
    }
}
</style>
