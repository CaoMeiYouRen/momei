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
                        <Tab value="analytics">
                            {{ $t('pages.admin.settings.system.tabs.analytics') }}
                        </Tab>
                    </TabList>
                    <TabPanels>
                        <!-- General Settings -->
                        <TabPanel value="general">
                            <div class="settings-form">
                                <div class="form-field">
                                    <label for="site_title">{{ $t('pages.admin.settings.system.keys.site_title') }}</label>
                                    <InputText
                                        id="site_title"
                                        v-model="settings.site_title"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="site_description">{{ $t('pages.admin.settings.system.keys.site_description') }}</label>
                                    <Textarea
                                        id="site_description"
                                        v-model="settings.site_description"
                                        rows="3"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="site_keywords">{{ $t('pages.admin.settings.system.keys.site_keywords') }}</label>
                                    <InputText
                                        id="site_keywords"
                                        v-model="settings.site_keywords"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="site_copyright">{{ $t('pages.admin.settings.system.keys.site_copyright') }}</label>
                                    <InputText
                                        id="site_copyright"
                                        v-model="settings.site_copyright"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="default_language">{{ $t('pages.admin.settings.system.keys.default_language') }}</label>
                                    <Select
                                        id="default_language"
                                        v-model="settings.default_language"
                                        :options="languageOptions"
                                        option-label="label"
                                        option-value="value"
                                        fluid
                                    />
                                </div>
                            </div>
                        </TabPanel>

                        <!-- AI Settings -->
                        <TabPanel value="ai">
                            <div class="settings-form">
                                <div class="form-field-row">
                                    <label for="ai_enabled">{{ $t('pages.admin.settings.system.keys.ai_enabled') }}</label>
                                    <div class="flex gap-2 items-center">
                                        <ToggleSwitch id="ai_enabled" v-model="settings.ai_enabled" />
                                        <small class="text-surface-500">{{ $t('pages.admin.settings.system.hints.ai_enabled') }}</small>
                                    </div>
                                </div>
                                <div v-if="settings.ai_enabled" class="sub-form">
                                    <div class="form-field">
                                        <label for="ai_provider">{{ $t('pages.admin.settings.system.keys.ai_provider') }}</label>
                                        <Select
                                            id="ai_provider"
                                            v-model="settings.ai_provider"
                                            :options="aiProviders"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="ai_api_key">{{ $t('pages.admin.settings.system.keys.ai_api_key') }}</label>
                                        <Password
                                            id="ai_api_key"
                                            v-model="settings.ai_api_key"
                                            :feedback="false"
                                            toggle-mask
                                            fluid
                                        />
                                        <small class="text-surface-500">{{ $t('pages.admin.settings.system.hints.masked_unchanged') }}</small>
                                    </div>
                                    <div class="form-field">
                                        <label for="ai_model">{{ $t('pages.admin.settings.system.keys.ai_model') }}</label>
                                        <InputText
                                            id="ai_model"
                                            v-model="settings.ai_model"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="ai_endpoint">{{ $t('pages.admin.settings.system.keys.ai_endpoint') }}</label>
                                        <InputText
                                            id="ai_endpoint"
                                            v-model="settings.ai_endpoint"
                                            fluid
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        <!-- Email Settings -->
                        <TabPanel value="email">
                            <div class="settings-form">
                                <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
                                    <div class="form-field">
                                        <label for="email_host">{{ $t('pages.admin.settings.system.keys.email_host') }}</label>
                                        <InputText
                                            id="email_host"
                                            v-model="settings.email_host"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="email_port">{{ $t('pages.admin.settings.system.keys.email_port') }}</label>
                                        <InputText
                                            id="email_port"
                                            v-model="settings.email_port"
                                            fluid
                                        />
                                    </div>
                                </div>
                                <div class="form-field">
                                    <label for="email_user">{{ $t('pages.admin.settings.system.keys.email_user') }}</label>
                                    <InputText
                                        id="email_user"
                                        v-model="settings.email_user"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="email_pass">{{ $t('pages.admin.settings.system.keys.email_pass') }}</label>
                                    <Password
                                        id="email_pass"
                                        v-model="settings.email_pass"
                                        :feedback="false"
                                        toggle-mask
                                        fluid
                                    />
                                    <small class="text-surface-500">{{ $t('pages.admin.settings.system.hints.masked_unchanged') }}</small>
                                </div>
                                <div class="form-field">
                                    <label for="email_from">{{ $t('pages.admin.settings.system.keys.email_from') }}</label>
                                    <InputText
                                        id="email_from"
                                        v-model="settings.email_from"
                                        fluid
                                    />
                                </div>
                            </div>
                        </TabPanel>

                        <!-- Storage Settings -->
                        <TabPanel value="storage">
                            <div class="settings-form">
                                <div class="form-field">
                                    <label for="storage_type">{{ $t('pages.admin.settings.system.keys.storage_type') }}</label>
                                    <Select
                                        id="storage_type"
                                        v-model="settings.storage_type"
                                        :options="storageTypes"
                                        option-label="label"
                                        option-value="value"
                                        fluid
                                    />
                                </div>

                                <!-- Local Storage -->
                                <div v-if="settings.storage_type === 'local'" class="sub-form">
                                    <div class="form-field">
                                        <label for="local_storage_dir">{{ $t('pages.admin.settings.system.keys.local_storage_dir') }}</label>
                                        <InputText
                                            id="local_storage_dir"
                                            v-model="settings.local_storage_dir"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="local_storage_base_url">{{ $t('pages.admin.settings.system.keys.local_storage_base_url') }}</label>
                                        <InputText
                                            id="local_storage_base_url"
                                            v-model="settings.local_storage_base_url"
                                            fluid
                                        />
                                    </div>
                                </div>

                                <!-- S3 Storage -->
                                <div v-if="settings.storage_type === 's3'" class="sub-form">
                                    <div class="form-field">
                                        <label for="s3_endpoint">{{ $t('pages.admin.settings.system.keys.s3_endpoint') }}</label>
                                        <InputText
                                            id="s3_endpoint"
                                            v-model="settings.s3_endpoint"
                                            fluid
                                        />
                                    </div>
                                    <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
                                        <div class="form-field">
                                            <label for="s3_bucket">{{ $t('pages.admin.settings.system.keys.s3_bucket') }}</label>
                                            <InputText
                                                id="s3_bucket"
                                                v-model="settings.s3_bucket"
                                                fluid
                                            />
                                        </div>
                                        <div class="form-field">
                                            <label for="s3_region">{{ $t('pages.admin.settings.system.keys.s3_region') }}</label>
                                            <InputText
                                                id="s3_region"
                                                v-model="settings.s3_region"
                                                fluid
                                            />
                                        </div>
                                    </div>
                                    <div class="form-field">
                                        <label for="s3_access_key">{{ $t('pages.admin.settings.system.keys.s3_access_key') }}</label>
                                        <Password
                                            id="s3_access_key"
                                            v-model="settings.s3_access_key"
                                            :feedback="false"
                                            toggle-mask
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="s3_secret_key">{{ $t('pages.admin.settings.system.keys.s3_secret_key') }}</label>
                                        <Password
                                            id="s3_secret_key"
                                            v-model="settings.s3_secret_key"
                                            :feedback="false"
                                            toggle-mask
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="s3_base_url">{{ $t('pages.admin.settings.system.keys.s3_base_url') }}</label>
                                        <InputText
                                            id="s3_base_url"
                                            v-model="settings.s3_base_url"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="s3_bucket_prefix">{{ $t('pages.admin.settings.system.keys.s3_bucket_prefix') }}</label>
                                        <InputText
                                            id="s3_bucket_prefix"
                                            v-model="settings.s3_bucket_prefix"
                                            fluid
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        <!-- Analytics Settings -->
                        <TabPanel value="analytics">
                            <div class="settings-form">
                                <div class="form-field">
                                    <label for="baidu_analytics">{{ $t('pages.admin.settings.system.keys.baidu_analytics') }}</label>
                                    <InputText
                                        id="baidu_analytics"
                                        v-model="settings.baidu_analytics"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="google_analytics">{{ $t('pages.admin.settings.system.keys.google_analytics') }}</label>
                                    <InputText
                                        id="google_analytics"
                                        v-model="settings.google_analytics"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="clarity_analytics">{{ $t('pages.admin.settings.system.keys.clarity_analytics') }}</label>
                                    <InputText
                                        id="clarity_analytics"
                                        v-model="settings.clarity_analytics"
                                        fluid
                                    />
                                </div>
                            </div>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const toast = useToast()
const { $appFetch } = useAppApi()

definePageMeta({
    // auth.global.ts handles authentication
})

const loading = ref(true)
const saving = ref(false)
const settings = ref<Record<string, any>>({})

const languageOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en-US' },
]

const aiProviders = ['openai', 'anthropic', 'google', 'deepseek', 'groq', 'custom']

const storageTypes = [
    { label: '本地存储 (Local)', value: 'local' },
    { label: '对象存储 (S3)', value: 's3' },
]

// 转换扁平的 API 返回为键值对对象
const loadSettings = async () => {
    try {
        const { data } = await $appFetch('/api/admin/settings')
        const obj: Record<string, any> = {}
        data.forEach((s: any) => {
            // 类型转换
            let val: any = s.value
            if (val === 'true') val = true
            if (val === 'false') val = false
            obj[s.key] = val
        })
        settings.value = obj
    } catch (error) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.error_loading'), life: 3000 })
    } finally {
        loading.value = false
    }
}

const saveSettings = async () => {
    saving.value = true
    try {
        // 转换回字符串以保存，或者后端 setSettings 能自动处理
        const payload: Record<string, string> = {}
        Object.entries(settings.value).forEach(([key, val]) => {
            payload[key] = String(val)
        })

        await $appFetch('/api/admin/settings', {
            method: 'PUT',
            body: payload,
        })
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.save_success'), life: 3000 })

        // 保存后刷新站点配置，让页面标题等即时生效
        const { fetchSiteConfig } = useMomeiConfig()
        await fetchSiteConfig()
    } catch (error) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.save_failed'), life: 3000 })
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
  max-width: 800px;
  margin: 0 auto;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 500;
    font-size: 0.95rem;
  }
}

.form-field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  label {
    font-weight: 500;
  }
}

.sub-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  background-color: var(--p-surface-50);
  border-radius: var(--p-content-border-radius);
}

:global(.dark) .sub-form {
  background-color: var(--p-surface-900);
}
</style>
