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
                <SettingExplanationCard :stats="smartModeStats" :items="smartModeItems" />

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
import type { SettingItem, SettingLockReason, SettingSource } from '@/types/setting'

const { t } = useI18n()
const toast = useToast()
const { $appFetch } = useAppApi()

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
    data: SettingItem[]
}

const loading = ref(true)
const saving = ref(false)
const activeTab = ref('general')
const settings = ref<Record<string, SettingFormValue>>({})
const metadata = ref<Record<string, SettingMetadata>>({})

const numberSettingFallbacks: Record<string, number> = {
    posts_per_page: 10,
    email_port: 587,
    live2d_min_width: 1024,
    canvas_nest_min_width: 1024,
    effects_min_width: 1024,
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

function getSmartModeMessage(key: string, item: SettingMetadata) {
    if (item.lockReason === 'env_override') {
        return t('pages.admin.settings.system.smart_mode.messages.env_override', {
            envKey: item.envKey ?? key.toUpperCase(),
        })
    }

    if (item.lockReason === 'forced_env_lock') {
        return t('pages.admin.settings.system.smart_mode.messages.forced_env_lock')
    }

    if (item.defaultUsed) {
        return t('pages.admin.settings.system.smart_mode.messages.default_used')
    }

    if (item.requiresRestart) {
        return t('pages.admin.settings.system.smart_mode.messages.restart_required')
    }

    return item.description || t('pages.admin.settings.system.smart_mode.messages.db_active')
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

const smartModeItems = computed(() => {
    return Object.entries(metadata.value)
        .filter(([, item]) => item.isLocked || item.defaultUsed || item.requiresRestart)
        .sort(([, left], [, right]) => {
            const leftScore = Number(left.isLocked) * 4 + Number(left.defaultUsed) * 2 + Number(left.requiresRestart)
            const rightScore = Number(right.isLocked) * 4 + Number(right.defaultUsed) * 2 + Number(right.requiresRestart)
            return rightScore - leftScore
        })
        .slice(0, 12)
        .map(([key, item]) => ({
            key,
            label: t(`pages.admin.settings.system.keys.${key}`),
            source: item.source,
            message: getSmartModeMessage(key, item),
        }))
})

const loadSettings = async () => {
    try {
        const { data } = await $appFetch<SettingsApiResponse>('/api/admin/settings')
        const obj: Record<string, SettingFormValue> = {}
        const meta: Record<string, SettingMetadata> = {}

        data.forEach((setting) => {
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
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.error_loading'), life: 3000 })
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
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.save_success'), life: 3000 })
    } catch (error) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.error_saving'), life: 3000 })
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadSettings()
})
</script>

<style lang="scss" scoped>
.admin-system-settings {
    max-width: 1000px;
    margin: 0 auto;
}
</style>
