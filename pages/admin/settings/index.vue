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
                <Tabs value="general">
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
                    </TabPanels>
                </Tabs>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import GeneralSettings from '@/components/admin/settings/GeneralSettings.vue'
import AISettings from '@/components/admin/settings/AISettings.vue'
import EmailSettings from '@/components/admin/settings/EmailSettings.vue'
import StorageSettings from '@/components/admin/settings/StorageSettings.vue'
import AnalyticsSettings from '@/components/admin/settings/AnalyticsSettings.vue'
import AuthSettings from '@/components/admin/settings/AuthSettings.vue'
import SecuritySettings from '@/components/admin/settings/SecuritySettings.vue'
import LimitsSettings from '@/components/admin/settings/LimitsSettings.vue'

const { t } = useI18n()
const toast = useToast()
const { $appFetch } = useAppApi()

const loading = ref(true)
const saving = ref(false)
const settings = ref<Record<string, any>>({})
const metadata = ref<Record<string, { isLocked: boolean, source: string, description: string }>>({})

const loadSettings = async () => {
    try {
        const { data } = await $appFetch('/api/admin/settings')
        const obj: Record<string, any> = {}
        const meta: Record<string, any> = {}

        data.forEach((s: any) => {
            let val: any = s.value
            if (val === 'true') {
                val = true
            } else if (val === 'false') {
                val = false
            } else if (s.key === 'posts_per_page') {
                val = parseInt(val) || 10
            } else if (s.key === 'email_port') {
                val = parseInt(val) || 587
            }
            obj[s.key] = val
            meta[s.key] = {
                isLocked: s.isLocked,
                source: s.source,
                description: s.description,
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
            body: payload,
        })
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
