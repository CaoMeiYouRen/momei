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
                        <!-- General Settings -->
                        <TabPanel value="general">
                            <div class="settings-form">
                                <div class="form-field">
                                    <label for="site_title" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.site_title') }}
                                        <i
                                            v-if="metadata.site_title?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="site_title"
                                        v-model="settings.site_title"
                                        :disabled="metadata.site_title?.isLocked"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="site_description" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.site_description') }}
                                        <i
                                            v-if="metadata.site_description?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <Textarea
                                        id="site_description"
                                        v-model="settings.site_description"
                                        :disabled="metadata.site_description?.isLocked"
                                        rows="3"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="site_keywords" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.site_keywords') }}
                                        <i
                                            v-if="metadata.site_keywords?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="site_keywords"
                                        v-model="settings.site_keywords"
                                        :disabled="metadata.site_keywords?.isLocked"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="site_copyright" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.site_copyright') }}
                                        <i
                                            v-if="metadata.site_copyright?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="site_copyright"
                                        v-model="settings.site_copyright"
                                        :disabled="metadata.site_copyright?.isLocked"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="default_language" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.default_language') }}
                                        <i
                                            v-if="metadata.default_language?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <Select
                                        id="default_language"
                                        v-model="settings.default_language"
                                        :options="languageOptions"
                                        option-label="label"
                                        option-value="value"
                                        :disabled="metadata.default_language?.isLocked"
                                        fluid
                                    />
                                </div>

                                <Divider align="left">
                                    <b>{{ $t('pages.admin.settings.system.sections.branding') }}</b>
                                </Divider>

                                <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
                                    <div class="form-field">
                                        <label for="site_logo" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.site_logo') }}
                                            <i
                                                v-if="metadata.site_logo?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <div class="flex gap-2">
                                            <InputText
                                                id="site_logo"
                                                v-model="settings.site_logo"
                                                :disabled="metadata.site_logo?.isLocked"
                                                placeholder="/logo.png"
                                                class="flex-1"
                                            />
                                            <Button
                                                v-if="!metadata.site_logo?.isLocked"
                                                icon="pi pi-upload"
                                                severity="secondary"
                                                @click="() => {}"
                                            />
                                        </div>
                                    </div>
                                    <div class="form-field">
                                        <label for="site_favicon" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.site_favicon') }}
                                            <i
                                                v-if="metadata.site_favicon?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <div class="flex gap-2">
                                            <InputText
                                                id="site_favicon"
                                                v-model="settings.site_favicon"
                                                :disabled="metadata.site_favicon?.isLocked"
                                                placeholder="/favicon.ico"
                                                class="flex-1"
                                            />
                                            <Button
                                                v-if="!metadata.site_favicon?.isLocked"
                                                icon="pi pi-upload"
                                                severity="secondary"
                                                @click="() => {}"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div class="form-field">
                                    <label for="site_operator" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.site_operator') }}
                                        <i
                                            v-if="metadata.site_operator?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="site_operator"
                                        v-model="settings.site_operator"
                                        :disabled="metadata.site_operator?.isLocked"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="contact_email" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.contact_email') }}
                                        <i
                                            v-if="metadata.contact_email?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="contact_email"
                                        v-model="settings.contact_email"
                                        :disabled="metadata.contact_email?.isLocked"
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
                                        <i
                                            v-if="metadata.ai_enabled?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500"
                                        />
                                        <ToggleSwitch
                                            id="ai_enabled"
                                            v-model="settings.ai_enabled"
                                            :disabled="metadata.ai_enabled?.isLocked"
                                        />
                                        <small class="text-surface-500">{{ $t('pages.admin.settings.system.hints.ai_enabled') }}</small>
                                    </div>
                                </div>
                                <div v-if="settings.ai_enabled" class="sub-form">
                                    <div class="form-field">
                                        <label for="ai_provider" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.ai_provider') }}
                                            <i
                                                v-if="metadata.ai_provider?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <Select
                                            id="ai_provider"
                                            v-model="settings.ai_provider"
                                            :options="aiProviders"
                                            :disabled="metadata.ai_provider?.isLocked"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="ai_api_key" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.ai_api_key') }}
                                            <i
                                                v-if="metadata.ai_api_key?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <Password
                                            id="ai_api_key"
                                            v-model="settings.ai_api_key"
                                            :feedback="false"
                                            toggle-mask
                                            :disabled="metadata.ai_api_key?.isLocked"
                                            fluid
                                        />
                                        <small class="text-surface-500">{{ $t('pages.admin.settings.system.hints.masked_unchanged') }}</small>
                                    </div>
                                    <div class="form-field">
                                        <label for="ai_model" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.ai_model') }}
                                            <i
                                                v-if="metadata.ai_model?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputText
                                            id="ai_model"
                                            v-model="settings.ai_model"
                                            :disabled="metadata.ai_model?.isLocked"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="ai_endpoint" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.ai_endpoint') }}
                                            <i
                                                v-if="metadata.ai_endpoint?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputText
                                            id="ai_endpoint"
                                            v-model="settings.ai_endpoint"
                                            :disabled="metadata.ai_endpoint?.isLocked"
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
                                        <label for="email_host" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.email_host') }}
                                            <i
                                                v-if="metadata.email_host?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputText
                                            id="email_host"
                                            v-model="settings.email_host"
                                            :disabled="metadata.email_host?.isLocked"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="email_port" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.email_port') }}
                                            <i
                                                v-if="metadata.email_port?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputNumber
                                            id="email_port"
                                            v-model="settings.email_port"
                                            :use-grouping="false"
                                            :disabled="metadata.email_port?.isLocked"
                                            fluid
                                        />
                                    </div>
                                </div>
                                <div class="form-field">
                                    <label for="email_user" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.email_user') }}
                                        <i
                                            v-if="metadata.email_user?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="email_user"
                                        v-model="settings.email_user"
                                        :disabled="metadata.email_user?.isLocked"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="email_pass" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.email_pass') }}
                                        <i
                                            v-if="metadata.email_pass?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <Password
                                        id="email_pass"
                                        v-model="settings.email_pass"
                                        :feedback="false"
                                        toggle-mask
                                        :disabled="metadata.email_pass?.isLocked"
                                        fluid
                                    />
                                    <small class="text-surface-500">{{ $t('pages.admin.settings.system.hints.masked_unchanged') }}</small>
                                </div>
                                <div class="form-field">
                                    <label for="email_from" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.email_from') }}
                                        <i
                                            v-if="metadata.email_from?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="email_from"
                                        v-model="settings.email_from"
                                        :disabled="metadata.email_from?.isLocked"
                                        fluid
                                    />
                                </div>
                            </div>
                        </TabPanel>

                        <!-- Storage Settings -->
                        <TabPanel value="storage">
                            <div class="settings-form">
                                <div class="form-field">
                                    <label for="storage_type" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.storage_type') }}
                                        <i
                                            v-if="metadata.storage_type?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <Select
                                        id="storage_type"
                                        v-model="settings.storage_type"
                                        :options="storageTypes"
                                        option-label="label"
                                        option-value="value"
                                        :disabled="metadata.storage_type?.isLocked"
                                        fluid
                                    />
                                </div>

                                <!-- Local Storage -->
                                <div v-if="settings.storage_type === 'local'" class="sub-form">
                                    <div class="form-field">
                                        <label for="local_storage_dir" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.local_storage_dir') }}
                                            <i
                                                v-if="metadata.local_storage_dir?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputText
                                            id="local_storage_dir"
                                            v-model="settings.local_storage_dir"
                                            :disabled="metadata.local_storage_dir?.isLocked"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="local_storage_base_url" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.local_storage_base_url') }}
                                            <i
                                                v-if="metadata.local_storage_base_url?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputText
                                            id="local_storage_base_url"
                                            v-model="settings.local_storage_base_url"
                                            :disabled="metadata.local_storage_base_url?.isLocked"
                                            fluid
                                        />
                                    </div>
                                </div>

                                <!-- S3 Storage -->
                                <div v-if="settings.storage_type === 's3'" class="sub-form">
                                    <div class="form-field">
                                        <label for="s3_endpoint" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.s3_endpoint') }}
                                            <i
                                                v-if="metadata.s3_endpoint?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputText
                                            id="s3_endpoint"
                                            v-model="settings.s3_endpoint"
                                            :disabled="metadata.s3_endpoint?.isLocked"
                                            fluid
                                        />
                                    </div>
                                    <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
                                        <div class="form-field">
                                            <label for="s3_bucket" class="flex gap-2 items-center">
                                                {{ $t('pages.admin.settings.system.keys.s3_bucket') }}
                                                <i
                                                    v-if="metadata.s3_bucket?.isLocked"
                                                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                    class="pi pi-lock text-orange-500 text-xs"
                                                />
                                            </label>
                                            <InputText
                                                id="s3_bucket"
                                                v-model="settings.s3_bucket"
                                                :disabled="metadata.s3_bucket?.isLocked"
                                                fluid
                                            />
                                        </div>
                                        <div class="form-field">
                                            <label for="s3_region" class="flex gap-2 items-center">
                                                {{ $t('pages.admin.settings.system.keys.s3_region') }}
                                                <i
                                                    v-if="metadata.s3_region?.isLocked"
                                                    v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                    class="pi pi-lock text-orange-500 text-xs"
                                                />
                                            </label>
                                            <InputText
                                                id="s3_region"
                                                v-model="settings.s3_region"
                                                :disabled="metadata.s3_region?.isLocked"
                                                fluid
                                            />
                                        </div>
                                    </div>
                                    <div class="form-field">
                                        <label for="s3_access_key" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.s3_access_key') }}
                                            <i
                                                v-if="metadata.s3_access_key?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <Password
                                            id="s3_access_key"
                                            v-model="settings.s3_access_key"
                                            :feedback="false"
                                            toggle-mask
                                            :disabled="metadata.s3_access_key?.isLocked"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="s3_secret_key" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.s3_secret_key') }}
                                            <i
                                                v-if="metadata.s3_secret_key?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <Password
                                            id="s3_secret_key"
                                            v-model="settings.s3_secret_key"
                                            :feedback="false"
                                            toggle-mask
                                            :disabled="metadata.s3_secret_key?.isLocked"
                                            fluid
                                        />
                                        <small class="text-surface-500">{{ $t('pages.admin.settings.system.hints.masked_unchanged') }}</small>
                                    </div>
                                    <div class="form-field">
                                        <label for="s3_base_url" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.s3_base_url') }}
                                            <i
                                                v-if="metadata.s3_base_url?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputText
                                            id="s3_base_url"
                                            v-model="settings.s3_base_url"
                                            :disabled="metadata.s3_base_url?.isLocked"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="s3_bucket_prefix" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.s3_bucket_prefix') }}
                                            <i
                                                v-if="metadata.s3_bucket_prefix?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputText
                                            id="s3_bucket_prefix"
                                            v-model="settings.s3_bucket_prefix"
                                            :disabled="metadata.s3_bucket_prefix?.isLocked"
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
                                    <label for="baidu_analytics" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.baidu_analytics') }}
                                        <i
                                            v-if="metadata.baidu_analytics?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="baidu_analytics"
                                        v-model="settings.baidu_analytics"
                                        :disabled="metadata.baidu_analytics?.isLocked"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="google_analytics" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.google_analytics') }}
                                        <i
                                            v-if="metadata.google_analytics?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="google_analytics"
                                        v-model="settings.google_analytics"
                                        :disabled="metadata.google_analytics?.isLocked"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="clarity_analytics" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.clarity_analytics') }}
                                        <i
                                            v-if="metadata.clarity_analytics?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="clarity_analytics"
                                        v-model="settings.clarity_analytics"
                                        :disabled="metadata.clarity_analytics?.isLocked"
                                        fluid
                                    />
                                </div>
                            </div>
                        </TabPanel>

                        <!-- Auth Settings -->
                        <TabPanel value="auth">
                            <div class="settings-form">
                                <div class="form-field-row">
                                    <label for="allow_registration">{{ $t('pages.admin.settings.system.keys.allow_registration') }}</label>
                                    <div class="flex gap-2 items-center">
                                        <i
                                            v-if="metadata.allow_registration?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500"
                                        />
                                        <ToggleSwitch
                                            id="allow_registration"
                                            v-model="settings.allow_registration"
                                            :disabled="metadata.allow_registration?.isLocked"
                                        />
                                    </div>
                                </div>
                                <div class="form-field-row">
                                    <label for="anonymous_login_enabled">{{ $t('pages.admin.settings.system.keys.anonymous_login_enabled') }}</label>
                                    <div class="flex gap-2 items-center">
                                        <i
                                            v-if="metadata.anonymous_login_enabled?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500"
                                        />
                                        <ToggleSwitch
                                            id="anonymous_login_enabled"
                                            v-model="settings.anonymous_login_enabled"
                                            :disabled="metadata.anonymous_login_enabled?.isLocked"
                                        />
                                    </div>
                                </div>

                                <Divider align="left">
                                    <b>{{ $t('pages.admin.settings.system.sections.social_auth') }}</b>
                                </Divider>
                                <Message
                                    severity="info"
                                    size="small"
                                    :closable="false"
                                >
                                    {{ $t('pages.admin.settings.system.hints.auth_notice') }}
                                </Message>

                                <Divider align="left">
                                    <span class="text-surface-500 text-xs">{{ $t('pages.admin.settings.system.keys.github_oauth') }}</span>
                                </Divider>
                                <div class="form-field">
                                    <label for="github_client_id" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.github_client_id') }}
                                        <i
                                            v-if="metadata.github_client_id?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="github_client_id"
                                        v-model="settings.github_client_id"
                                        :disabled="metadata.github_client_id?.isLocked"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="github_client_secret" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.github_client_secret') }}
                                        <i
                                            v-if="metadata.github_client_secret?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <Password
                                        id="github_client_secret"
                                        v-model="settings.github_client_secret"
                                        :disabled="metadata.github_client_secret?.isLocked"
                                        toggle-mask
                                        :feedback="false"
                                        fluid
                                    />
                                </div>

                                <Divider align="left">
                                    <b>{{ $t('pages.admin.settings.system.keys.google_oauth') }}</b>
                                </Divider>
                                <div class="form-field">
                                    <label for="google_client_id" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.google_client_id') }}
                                        <i
                                            v-if="metadata.google_client_id?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="google_client_id"
                                        v-model="settings.google_client_id"
                                        :disabled="metadata.google_client_id?.isLocked"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="google_client_secret" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.google_client_secret') }}
                                        <i
                                            v-if="metadata.google_client_secret?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <Password
                                        id="google_client_secret"
                                        v-model="settings.google_client_secret"
                                        :disabled="metadata.google_client_secret?.isLocked"
                                        toggle-mask
                                        :feedback="false"
                                        fluid
                                    />
                                </div>
                            </div>
                        </TabPanel>

                        <!-- Security Settings -->
                        <TabPanel value="security">
                            <div class="settings-form">
                                <div class="form-field">
                                    <label for="captcha_provider" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.captcha_provider') }}
                                        <i
                                            v-if="metadata.captcha_provider?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <Select
                                        id="captcha_provider"
                                        v-model="settings.captcha_provider"
                                        :options="captchaProviders"
                                        option-label="label"
                                        option-value="value"
                                        :disabled="metadata.captcha_provider?.isLocked"
                                        fluid
                                    />
                                </div>
                                <div v-if="settings.captcha_provider && settings.captcha_provider !== 'none'" class="sub-form">
                                    <div class="form-field">
                                        <label for="captcha_site_key" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.captcha_site_key') }}
                                            <i
                                                v-if="metadata.captcha_site_key?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputText
                                            id="captcha_site_key"
                                            v-model="settings.captcha_site_key"
                                            :disabled="metadata.captcha_site_key?.isLocked"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="captcha_secret_key" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.captcha_secret_key') }}
                                            <i
                                                v-if="metadata.captcha_secret_key?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <Password
                                            id="captcha_secret_key"
                                            v-model="settings.captcha_secret_key"
                                            :disabled="metadata.captcha_secret_key?.isLocked"
                                            toggle-mask
                                            :feedback="false"
                                            fluid
                                        />
                                    </div>
                                </div>

                                <Divider align="left">
                                    <b>{{ $t('pages.admin.settings.system.sections.compliance') }}</b>
                                </Divider>
                                <div class="form-field-row">
                                    <label for="show_compliance_info">{{ $t('pages.admin.settings.system.keys.show_compliance_info') }}</label>
                                    <div class="flex gap-2 items-center">
                                        <i
                                            v-if="metadata.show_compliance_info?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500"
                                        />
                                        <ToggleSwitch
                                            id="show_compliance_info"
                                            v-model="settings.show_compliance_info"
                                            :disabled="metadata.show_compliance_info?.isLocked"
                                        />
                                    </div>
                                </div>
                                <div v-if="settings.show_compliance_info" class="sub-form">
                                    <div class="form-field">
                                        <label for="icp_license_number" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.icp_license_number') }}
                                            <i
                                                v-if="metadata.icp_license_number?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputText
                                            id="icp_license_number"
                                            v-model="settings.icp_license_number"
                                            :disabled="metadata.icp_license_number?.isLocked"
                                            fluid
                                        />
                                    </div>
                                    <div class="form-field">
                                        <label for="public_security_number" class="flex gap-2 items-center">
                                            {{ $t('pages.admin.settings.system.keys.public_security_number') }}
                                            <i
                                                v-if="metadata.public_security_number?.isLocked"
                                                v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                                class="pi pi-lock text-orange-500 text-xs"
                                            />
                                        </label>
                                        <InputText
                                            id="public_security_number"
                                            v-model="settings.public_security_number"
                                            :disabled="metadata.public_security_number?.isLocked"
                                            fluid
                                        />
                                    </div>
                                </div>
                                <div class="form-field">
                                    <label for="footer_code" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.footer_code') }}
                                        <i
                                            v-if="metadata.footer_code?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <Textarea
                                        id="footer_code"
                                        v-model="settings.footer_code"
                                        :disabled="metadata.footer_code?.isLocked"
                                        rows="3"
                                        fluid
                                    />
                                </div>
                            </div>
                        </TabPanel>

                        <!-- Limits Settings -->
                        <TabPanel value="limits">
                            <div class="settings-form">
                                <div class="form-field">
                                    <label for="max_upload_size" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.max_upload_size') }}
                                        <i
                                            v-if="metadata.max_upload_size?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="max_upload_size"
                                        v-model="settings.max_upload_size"
                                        :disabled="metadata.max_upload_size?.isLocked"
                                        placeholder="e.g. 4.5MiB"
                                        fluid
                                    />
                                    <small class="text-surface-500">{{ $t('pages.admin.settings.system.hints.max_upload_size') }}</small>
                                </div>
                                <div class="form-field">
                                    <label for="max_audio_upload_size" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.max_audio_upload_size') }}
                                        <i
                                            v-if="metadata.max_audio_upload_size?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputText
                                        id="max_audio_upload_size"
                                        v-model="settings.max_audio_upload_size"
                                        :disabled="metadata.max_audio_upload_size?.isLocked"
                                        placeholder="e.g. 100MiB"
                                        fluid
                                    />
                                </div>
                                <div class="form-field">
                                    <label for="posts_per_page" class="flex gap-2 items-center">
                                        {{ $t('pages.admin.settings.system.keys.posts_per_page') }}
                                        <i
                                            v-if="metadata.posts_per_page?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500 text-xs"
                                        />
                                    </label>
                                    <InputNumber
                                        id="posts_per_page"
                                        v-model="settings.posts_per_page"
                                        :disabled="metadata.posts_per_page?.isLocked"
                                        :min="1"
                                        :max="100"
                                        fluid
                                    />
                                </div>
                                <div class="form-field-row">
                                    <label for="email_require_verification">{{ $t('pages.admin.settings.system.keys.email_require_verification') }}</label>
                                    <div class="flex gap-2 items-center">
                                        <i
                                            v-if="metadata.email_require_verification?.isLocked"
                                            v-tooltip="$t('pages.admin.settings.system.hints.env_locked')"
                                            class="pi pi-lock text-orange-500"
                                        />
                                        <ToggleSwitch
                                            id="email_require_verification"
                                            v-model="settings.email_require_verification"
                                            :disabled="metadata.email_require_verification?.isLocked"
                                        />
                                    </div>
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
const metadata = ref<Record<string, { isLocked: boolean, source: string, description: string }>>({})

const languageOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en-US' },
]

const aiProviders = ['openai', 'anthropic', 'google', 'deepseek', 'groq', 'custom']

const captchaProviders = [
    { label: 'None', value: '' },
    { label: 'Cloudflare Turnstile', value: 'cloudflare-turnstile' },
    { label: 'Google reCAPTCHA', value: 'google-recaptcha' },
    { label: 'hCaptcha', value: 'hcaptcha' },
    { label: 'CaptchaFox', value: 'captchafox' },
]

const storageTypes = [
    { label: '本地存储 (Local)', value: 'local' },
    { label: '对象存储 (S3)', value: 's3' },
]

// 转换扁平的 API 返回为键值对对象
const loadSettings = async () => {
    try {
        const { data } = await $appFetch('/api/admin/settings')
        const obj: Record<string, any> = {}
        const meta: Record<string, any> = {}

        data.forEach((s: any) => {
            // 类型转换
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
        // 转换回字符串以保存，并发过滤掉被环境变量锁定的字段
        const payload: Record<string, string> = {}
        Object.entries(settings.value).forEach(([key, val]) => {
            // 如果该字段被 ENV 锁定，则不发送请求给后端进行更新（后端也会有校验）
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
