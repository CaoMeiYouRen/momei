<template>
    <div v-if="settings" class="admin-system-settings">
        <AdminPageHeader :title="$t('pages.admin.settings.system.title')" />

        <Card>
            <template #content>
                <Message
                    v-if="isDemoPreview"
                    severity="info"
                    :closable="false"
                    class="admin-system-settings__demo-notice"
                >
                    <div class="admin-system-settings__demo-copy">
                        <strong>{{ $t('pages.admin.settings.system.demo_preview.title') }}</strong>
                        <p>{{ $t('pages.admin.settings.system.demo_preview.description') }}</p>
                    </div>
                </Message>

                <SetupFollowUpCard
                    v-if="showSetupFollowUp"
                    @open-tab="openSuggestedTab"
                    @continue-editor="continueToEditor"
                    @dismiss="dismissSetupFollowUp"
                />

                <SettingExplanationCard :stats="smartModeStats" />

                <Tabs v-model:value="activeTab">
                    <AdminFloatingActions
                        v-if="showPageActionsBar"
                        :primary-label="showPagePrimaryAction ? $t('common.save') : ''"
                        primary-icon="pi pi-check"
                        :primary-loading="saving"
                        :primary-disabled="pagePrimaryDisabled"
                        :secondary-label="shouldShowFeedbackEntry ? $t('common.feedback') : ''"
                        secondary-icon="pi pi-question-circle"
                        :status-label="pageActionStatusLabel"
                        :status-tone="pageActionStatusTone"
                        @primary-click="saveSettings"
                        @secondary-click="openFeedbackEntry"
                    />

                    <TabList>
                        <Tab value="general">
                            {{ $t('pages.admin.settings.system.tabs.general') }}
                        </Tab>
                        <Tab value="ai">
                            {{ $t('pages.admin.settings.system.tabs.ai') }}
                        </Tab>
                        <Tab value="email">
                            {{ $t('pages.admin.settings.system.tabs.email') }}
                        </Tab>
                        <Tab value="storage">
                            {{ $t('pages.admin.settings.system.tabs.storage') }}
                        </Tab>
                        <Tab value="auth">
                            {{ $t('pages.admin.settings.system.tabs.auth') }}
                        </Tab>
                        <Tab value="security">
                            {{ $t('pages.admin.settings.system.tabs.security') }}
                        </Tab>
                        <Tab value="limits">
                            {{ $t('pages.admin.settings.system.tabs.limits') }}
                        </Tab>
                        <Tab value="analytics">
                            {{ $t('pages.admin.settings.system.tabs.analytics') }}
                        </Tab>
                        <Tab value="agreements">
                            {{ $t('pages.admin.settings.system.tabs.agreements') }}
                        </Tab>
                        <Tab value="notifications">
                            {{ $t('pages.admin.settings.system.tabs.notifications') }}
                        </Tab>
                        <Tab value="commercial">
                            {{ $t('pages.admin.settings.system.tabs.commercial') }}
                        </Tab>
                        <Tab value="audit_logs">
                            {{ $t('pages.admin.settings.system.tabs.audit_logs') }}
                        </Tab>
                        <Tab value="third_party">
                            {{ $t('pages.admin.settings.system.tabs.third_party') }}
                        </Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel value="general">
                            <GeneralSettings v-model:settings="settings" :metadata="metadata" />
                        </TabPanel>

                        <TabPanel value="ai">
                            <AISettings v-model:settings="settings" :metadata="metadata" />
                        </TabPanel>

                        <TabPanel value="email">
                            <EmailSettings v-model:settings="settings" :metadata="metadata" />
                        </TabPanel>

                        <TabPanel value="storage">
                            <StorageSettings v-model:settings="settings" :metadata="metadata" />
                        </TabPanel>

                        <TabPanel value="analytics">
                            <AnalyticsSettings v-model:settings="settings" :metadata="metadata" />
                        </TabPanel>

                        <TabPanel value="auth">
                            <AuthSettings v-model:settings="settings" :metadata="metadata" />
                        </TabPanel>

                        <TabPanel value="security">
                            <SecuritySettings v-model:settings="settings" :metadata="metadata" />
                        </TabPanel>

                        <TabPanel value="limits">
                            <LimitsSettings v-model:settings="settings" :metadata="metadata" />
                        </TabPanel>

                        <TabPanel value="agreements">
                            <AgreementsSettings />
                        </TabPanel>

                        <TabPanel value="notifications">
                            <AdminNotificationSettings />
                        </TabPanel>

                        <TabPanel value="commercial">
                            <CommercialSettings />
                        </TabPanel>

                        <TabPanel value="audit_logs">
                            <SettingAuditLogList />
                        </TabPanel>

                        <TabPanel value="third_party">
                            <ThirdPartySettings v-model:settings="settings" :metadata="metadata" />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'admin',
})

import GeneralSettings from '@/components/admin/settings/general-settings.vue'
import AISettings from '@/components/admin/settings/ai-settings.vue'
import EmailSettings from '@/components/admin/settings/email-settings.vue'
import StorageSettings from '@/components/admin/settings/storage-settings.vue'
import AnalyticsSettings from '@/components/admin/settings/analytics-settings.vue'
import AuthSettings from '@/components/admin/settings/auth-settings.vue'
import SecuritySettings from '@/components/admin/settings/security-settings.vue'
import AdminNotificationSettings from '@/components/admin/settings/admin-notification-settings.vue'
import LimitsSettings from '@/components/admin/settings/limits-settings.vue'
import AgreementsSettings from '@/components/admin/settings/agreements-settings.vue'
import CommercialSettings from '@/components/admin/settings/commercial-settings.vue'
import SettingAuditLogList from '@/components/admin/settings/setting-audit-log-list.vue'
import SettingExplanationCard from '@/components/admin/settings/setting-explanation-card.vue'
import SetupFollowUpCard from '@/components/admin/settings/setup-follow-up-card.vue'
import ThirdPartySettings from '@/components/admin/settings/third-party-settings.vue'
import { useFeedbackEntry } from '@/composables/use-feedback-entry'
import { useUnsavedChangesGuard } from '@/composables/use-unsaved-changes-guard'
import { buildAdminSettingsTabLocation, resolveAdminSettingsTab, type AdminSettingsTab } from '@/utils/shared/admin-settings-tabs'
import { stableSerialize } from '@/utils/shared/stable-serialize'
import { clearQueuedSetupJourneyStage, getQueuedSetupJourneyStage, queueSetupJourneyStage } from '@/utils/web/setup-journey'
import type { SettingItem, SettingLockReason, SettingSource } from '@/types/setting'

const { t } = useI18n()
const { showErrorToast, showSuccessToast } = useRequestFeedback()
const { $appFetch } = useAppApi()
const route = useRoute()
const localePath = useLocalePath()
const { openFeedbackEntry, shouldShowFeedbackEntry } = useFeedbackEntry({ includeAdmin: true })

type SettingFormValue = string | number | boolean | null

interface SettingMetadata {
    isLocked: boolean
    source: SettingSource
    description: string
    envKey: string | null
    defaultUsed: boolean
    lockReason: SettingLockReason | null
    requiresRestart: boolean
}

interface SettingsApiResponse {
    data: {
        items: SettingItem[]
        demoPreview?: boolean
    }
}

const loading = ref(true)
const saving = ref(false)
const activeTab = ref<AdminSettingsTab>('general')
const isDemoPreview = ref(false)
const settings = ref<Record<string, SettingFormValue>>({})
const metadata = ref<Record<string, SettingMetadata>>({})
const showSetupFollowUp = ref(false)
const initialPayloadSnapshot = ref(stableSerialize({}))

const genericSaveTabs = new Set<AdminSettingsTab>([
    'general',
    'ai',
    'email',
    'storage',
    'analytics',
    'auth',
    'security',
    'limits',
    'third_party',
])

const numberSettingFallbacks: Record<string, number> = {
    posts_per_page: 10,
    email_port: 587,
    email_daily_limit: 100,
    email_single_user_daily_limit: 5,
    email_limit_window: 86400,
    live2d_min_width: 1024,
    canvas_nest_min_width: 1024,
    effects_min_width: 1024,
    comment_interval: 0,
    upload_daily_limit: 100,
    upload_single_user_daily_limit: 5,
    upload_limit_window: 86400,
    friend_links_footer_limit: 6,
    friend_links_check_interval_minutes: 1440,
    local_storage_min_free_space: 104857600,
}

function normalizeFormValue(setting: SettingItem): SettingFormValue {
    if (setting.value === 'true') {
        return true
    }

    if (setting.value === 'false') {
        return false
    }

    if (setting.key in numberSettingFallbacks) {
        const fallback = numberSettingFallbacks[setting.key] ?? 0
        const parsedValue = Number.parseInt(setting.value ?? '', 10)
        return Number.isNaN(parsedValue) ? fallback : parsedValue
    }

    return setting.value
}

function buildSettingsPayload() {
    const payload: Record<string, string> = {}

    Object.entries(settings.value).forEach(([key, value]) => {
        if (metadata.value[key]?.isLocked) {
            return
        }

        payload[key] = String(value)
    })

    return payload
}

function syncInitialPayloadSnapshot() {
    initialPayloadSnapshot.value = stableSerialize(buildSettingsPayload())
}

const isDirty = computed(() => stableSerialize(buildSettingsPayload()) !== initialPayloadSnapshot.value)
const showPageActionsBar = computed(() => activeTab.value !== 'commercial' && activeTab.value !== 'notifications')
const showPagePrimaryAction = computed(() => isDirty.value || genericSaveTabs.has(activeTab.value))
const pagePrimaryDisabled = computed(() => !showPagePrimaryAction.value || saving.value || !isDirty.value)
const pageActionStatusLabel = computed(() => {
    if (isDirty.value) {
        return t('pages.admin.settings.system.floating_actions.unsaved')
    }

    return t('pages.admin.settings.system.floating_actions.saved')
})
const pageActionStatusTone = computed<'warn' | 'success'>(() => isDirty.value ? 'warn' : 'success')

const smartModeStats = computed(() => {
    const items = Object.values(metadata.value)

    return {
        locked: items.filter((item) => item.isLocked).length,
        defaultUsed: items.filter((item) => item.defaultUsed).length,
        requiresRestart: items.filter((item) => item.requiresRestart).length,
        sources: {
            env: items.filter((item) => item.source === 'env').length,
            db: items.filter((item) => item.source === 'db').length,
            default: items.filter((item) => item.source === 'default').length,
        } satisfies Record<SettingSource, number>,
    }
})

const loadSettings = async () => {
    try {
        const { data } = await $appFetch<SettingsApiResponse>('/api/admin/settings')
        const obj: Record<string, SettingFormValue> = {}
        const meta: Record<string, SettingMetadata> = {}
        const items = data.items || []

        isDemoPreview.value = Boolean(data.demoPreview)

        items.forEach((setting) => {
            obj[setting.key] = normalizeFormValue(setting)
            meta[setting.key] = {
                isLocked: setting.isLocked,
                source: setting.source,
                description: setting.description,
                envKey: setting.envKey ?? null,
                defaultUsed: setting.defaultUsed ?? false,
                lockReason: setting.lockReason ?? null,
                requiresRestart: setting.requiresRestart ?? false,
            }
        })
        settings.value = obj
        metadata.value = meta
        syncInitialPayloadSnapshot()
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.error_loading' })
    } finally {
        loading.value = false
    }
}

const saveSettings = async () => {
    if (!isDirty.value) {
        return
    }

    saving.value = true
    try {
        await $appFetch('/api/admin/settings', {
            method: 'PUT',
            body: {
                settings: buildSettingsPayload(),
                reason: 'system_settings_update',
                source: 'admin_ui',
            },
        })
        await loadSettings()
        showSuccessToast('common.save_success')
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.error_saving' })
    } finally {
        saving.value = false
    }
}

const openSuggestedTab = (tab: AdminSettingsTab) => {
    activeTab.value = tab
}

const dismissSetupFollowUp = () => {
    clearQueuedSetupJourneyStage()
    showSetupFollowUp.value = false
}

const continueToEditor = async () => {
    queueSetupJourneyStage('editor')
    showSetupFollowUp.value = false
    await navigateTo(localePath('/admin/posts/new'))
}

useUnsavedChangesGuard({
    isDirty,
    message: computed(() => t('pages.admin.settings.system.floating_actions.leave_confirm')),
})

onMounted(() => {
    void loadSettings()

    if (getQueuedSetupJourneyStage() === 'admin') {
        showSetupFollowUp.value = true
    }
})

watch(() => route.query.tab, (nextTab) => {
    activeTab.value = resolveAdminSettingsTab(nextTab)
}, { immediate: true })

watch(activeTab, async (nextTab) => {
    if (resolveAdminSettingsTab(route.query.tab) === nextTab) {
        return
    }

    await navigateTo({
        ...buildAdminSettingsTabLocation(route, nextTab),
    }, {
        replace: true,
    })
})
</script>

<style lang="scss" scoped>
.admin-system-settings {
    max-width: 1000px;
    margin: 0 auto;
    padding-bottom: 7rem;

    &__demo-notice {
        margin-bottom: 1rem;
    }

    &__demo-copy {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        p {
            margin: 0;
        }
    }
}
</style>
