<template>
    <div class="admin-notifications">
        <CaomeiMessage
            v-if="demoPreview"
            tone="primary"
            :closable="false"
            class="mb-4"
        >
            {{ $t('pages.admin.settings.system.demo_preview.description') }}
        </CaomeiMessage>

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
                <CaomeiTag :tone="webPush.isConfigured ? 'success' : 'warning'">
                    {{ webPush.isConfigured
                        ? $t('pages.admin.settings.system.notifications.web_push.status_ready')
                        : $t('pages.admin.settings.system.notifications.web_push.status_incomplete') }}
                </CaomeiTag>
            </div>

            <div class="admin-notifications__status-panel">
                <CaomeiMessage
                    :tone="webPush.isConfigured ? 'success' : 'warning'"
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
                </CaomeiMessage>

                <div class="admin-notifications__field-grid">
                    <SettingFormField
                        field-key="web_push_vapid_subject"
                        input-id="web-push-subject"
                        :metadata="webPush.subject"
                    >
                        <SettingInput
                            id="web-push-subject"
                            v-model="webPush.subject.value"
                            :disabled="webPush.subject.isLocked"
                        />
                    </SettingFormField>

                    <SettingFormField
                        field-key="web_push_vapid_public_key"
                        input-id="web-push-public-key"
                        :metadata="webPush.publicKey"
                    >
                        <SettingTextarea
                            id="web-push-public-key"
                            v-model="webPush.publicKey.value"
                            :disabled="webPush.publicKey.isLocked"
                            :rows="4"
                            auto-resize
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

        <CaomeiDataTable
            :data="settings"
            :columns="columns"
            class="mt-4"
        >
            <template #cell-event="{row}">
                <span class="font-medium">{{ $t(`pages.admin.settings.system.notifications.events.${row.event}`) }}</span>
            </template>
            <template #cell-isEmailEnabled="{row}">
                <CaomeiSwitch v-model="row.isEmailEnabled" />
            </template>
            <template #cell-isBrowserEnabled="{row}">
                <CaomeiSwitch v-model="row.isBrowserEnabled" />
            </template>
        </CaomeiDataTable>

        <AdminFloatingActions
            :primary-label="$t('common.save')"
            :primary-loading="saving"
            :primary-disabled="saving || !isDirty"
            :secondary-label="shouldShowFeedbackEntry ? $t('common.feedback') : ''"
            :status-label="actionStatusLabel"
            :status-tone="actionStatusTone"
            @primary-click="save"
            @secondary-click="openFeedbackEntry"
        />
    </div>
</template>

<script setup lang="ts">
import SettingInput from '@/components/admin/settings/setting-input.vue'
import SettingTextarea from '@/components/admin/settings/setting-textarea.vue'
import { ref, onMounted } from 'vue'
import AdminFloatingActions from '@/components/admin/admin-floating-actions.vue'
import { useFeedbackEntry } from '@/composables/use-feedback-entry'
import { useUnsavedChangesGuard } from '@/composables/use-unsaved-changes-guard'
import { stableSerialize } from '@/utils/shared/stable-serialize'
import type { DataTableColumn } from 'caomei-ui'
import { useToast } from 'caomei-ui'
import { useI18n } from 'vue-i18n'
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'
import type { SettingLockReason, SettingSource } from '@/types/setting'
import { getErrorDetail } from '@/utils/shared/error-detail'

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
const { openFeedbackEntry, shouldShowFeedbackEntry } = useFeedbackEntry({ includeAdmin: true })

const settings = ref<AdminNotificationSettingItem[]>([])

const columns = computed<DataTableColumn<AdminNotificationSettingItem>[]>(() => [
    { key: 'event', header: t('pages.admin.settings.system.notifications.event') },
    { key: 'isEmailEnabled', header: t('pages.admin.settings.system.notifications.email'), headerClass: 'text-center', bodyClass: 'text-center' },
    { key: 'isBrowserEnabled', header: t('pages.admin.settings.system.notifications.browser'), headerClass: 'text-center', bodyClass: 'text-center' },
])
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
const initialNotificationSnapshot = ref(stableSerialize({
    items: [],
    webPush: {
        subject: '',
        publicKey: '',
    },
}))

const buildNotificationComparableState = () => ({
    items: settings.value,
    webPush: {
        subject: webPush.value.subject.value,
        publicKey: webPush.value.publicKey.value,
    },
})

const syncInitialNotificationSnapshot = () => {
    initialNotificationSnapshot.value = stableSerialize(buildNotificationComparableState())
}

const isDirty = computed(() => stableSerialize(buildNotificationComparableState()) !== initialNotificationSnapshot.value)
const actionStatusLabel = computed(() => isDirty.value
    ? t('pages.admin.settings.system.floating_actions.unsaved')
    : t('pages.admin.settings.system.floating_actions.saved'))
const actionStatusTone = computed<'warn' | 'success'>(() => isDirty.value ? 'warn' : 'success')

function getFieldDescription(field: AdminNotificationWebPushField, unlockedHint: string) {
    if (field.isLocked) {
        return `${t('pages.admin.settings.system.hints.env_locked')} (${field.envKey})`
    }

    return unlockedHint
}

const load = async () => {
    loading.value = true
    try {
        const response = await $appFetch<AdminNotificationResponse>('/api/admin/settings/notifications/admin')
        settings.value = response.data.items || []
        demoPreview.value = Boolean(response.data.demoPreview)
        webPush.value = response.data.webPush || defaultWebPushState
        syncInitialNotificationSnapshot()
    } catch (error) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: getErrorDetail(error, t('common.error_loading')),
            duration: 5000,
        })
    } finally {
        loading.value = false
    }
}

const save = async () => {
    if (!isDirty.value) {
        return
    }

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
        syncInitialNotificationSnapshot()
        toast.show({
            tone: 'success',
            title: t('common.success'),
            description: t('common.save_success'),
            duration: 3000,
        })
    } catch (error) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: getErrorDetail(error, t('common.save_failed')),
            duration: 5000,
        })
    } finally {
        saving.value = false
    }
}

onMounted(load)

useUnsavedChangesGuard({
    isDirty,
    message: computed(() => t('pages.admin.settings.system.floating_actions.leave_confirm')),
})
</script>

<style lang="scss" scoped>
.admin-notifications {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding-bottom: 7rem;

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
