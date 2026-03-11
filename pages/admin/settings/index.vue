<template>
    <div v-if="settings" class="admin-system-settings">
        <AdminPageHeader :title="$t('pages.admin.settings.system.title')">
            <template #actions>
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-check"
                    :loading="saving"
                    @click="saveSettings"
                />
            </template>
        </AdminPageHeader>

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

                <SettingExplanationCard :stats="smartModeStats" />

                <Tabs v-model:value="activeTab">
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
import ThirdPartySettings from '@/components/admin/settings/third-party-settings.vue'
import { resolveAdminSettingsTab, type AdminSettingsTab } from '@/utils/shared/admin-settings-tabs'
import type { SettingItem, SettingLockReason, SettingSource } from '@/types/setting'

const { t } = useI18n()
const { showErrorToast, showSuccessToast } = useRequestFeedback()
const { $appFetch } = useAppApi()
const route = useRoute()

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
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.error_loading' })
    } finally {
        loading.value = false
    }
}

const saveSettings = async () => {
    saving.value = true
    try {
        const payload: Record<string, string> = {}
        Object.entries(settings.value).forEach(([key, val]) => {
            if (metadata.value[key]?.isLocked) {
                return
            }
            payload[key] = String(val)
        })

        await $appFetch('/api/admin/settings', {
            method: 'PUT',
            body: {
                settings: payload,
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

onMounted(() => {
    loadSettings()
})

watch(() => route.query.tab, (nextTab) => {
    activeTab.value = resolveAdminSettingsTab(nextTab)
}, { immediate: true })
</script>

<style lang="scss" scoped>
.admin-system-settings {
    max-width: 1000px;
    margin: 0 auto;

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
