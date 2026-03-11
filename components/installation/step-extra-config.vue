<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.preview.title') }}</h2>
        <p>{{ $t('installation.preview.description') }}</p>

        <Message
            v-if="extraConfigError && !Object.keys(fieldErrors).length"
            severity="error"
            :closable="false"
            class="installation-wizard__step-message"
        >
            {{ extraConfigError }}
        </Message>

        <Accordion multiple>
            <!-- AI 配置 -->
            <AccordionPanel value="0">
                <AccordionHeader>{{ $t('installation.preview.sections.ai') }}</AccordionHeader>
                <AccordionContent>
                    <div class="installation-wizard__form">
                        <div class="form-field">
                            <label for="ai_provider">
                                {{ $t('installation.preview.ai.provider') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('ai_provider')"
                                    field-key="ai_provider"
                                    :env-setting="envSettings.ai_provider"
                                />
                            </label>
                            <Select
                                id="ai_provider"
                                v-model="extraConfig.aiProvider"
                                :options="['openai', 'groq', 'ollama', 'anthropic', 'google']"
                                :disabled="isLocked('ai_provider')"
                                :invalid="!!fieldErrors.aiProvider"
                                fluid
                            />
                            <div v-if="fieldErrors.aiProvider" class="installation-wizard__field-error">
                                {{ fieldErrors.aiProvider }}
                            </div>
                        </div>
                        <div class="form-field">
                            <label for="ai_model">
                                {{ $t('installation.preview.ai.model') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('ai_model')"
                                    field-key="ai_model"
                                    :env-setting="envSettings.ai_model"
                                />
                            </label>
                            <InputText
                                id="ai_model"
                                v-model="extraConfig.aiModel"
                                :disabled="isLocked('ai_model')"
                                :invalid="!!fieldErrors.aiModel"
                                fluid
                            />
                            <div v-if="fieldErrors.aiModel" class="installation-wizard__field-error">
                                {{ fieldErrors.aiModel }}
                            </div>
                        </div>
                        <div class="form-field">
                            <label for="ai_api_key">
                                {{ $t('installation.preview.ai.apiKey') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('ai_api_key')"
                                    field-key="ai_api_key"
                                    :env-setting="envSettings.ai_api_key"
                                />
                            </label>
                            <Password
                                id="ai_api_key"
                                v-model="extraConfig.aiApiKey"
                                :toggle-mask="true"
                                :disabled="isLocked('ai_api_key')"
                                :invalid="!!fieldErrors.aiApiKey"
                                fluid
                            />
                            <div v-if="fieldErrors.aiApiKey" class="installation-wizard__field-error">
                                {{ fieldErrors.aiApiKey }}
                            </div>
                        </div>
                        <div class="form-field">
                            <label for="ai_endpoint">
                                {{ $t('installation.preview.ai.endpoint') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('ai_endpoint')"
                                    field-key="ai_endpoint"
                                    :env-setting="envSettings.ai_endpoint"
                                />
                            </label>
                            <InputText
                                id="ai_endpoint"
                                v-model="extraConfig.aiEndpoint"
                                :disabled="isLocked('ai_endpoint')"
                                :invalid="!!fieldErrors.aiEndpoint"
                                fluid
                            />
                            <div v-if="fieldErrors.aiEndpoint" class="installation-wizard__field-error">
                                {{ fieldErrors.aiEndpoint }}
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionPanel>

            <!-- 邮件配置 -->
            <AccordionPanel value="1">
                <AccordionHeader>{{ $t('installation.preview.sections.email') }}</AccordionHeader>
                <AccordionContent>
                    <div class="installation-wizard__form">
                        <div class="form-field">
                            <label for="email_host">
                                {{ $t('installation.preview.email.host') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('email_host')"
                                    field-key="email_host"
                                    :env-setting="envSettings.email_host"
                                />
                            </label>
                            <InputText
                                id="email_host"
                                v-model="extraConfig.emailHost"
                                :disabled="isLocked('email_host')"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="email_port">
                                {{ $t('installation.preview.email.port') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('email_port')"
                                    field-key="email_port"
                                    :env-setting="envSettings.email_port"
                                />
                            </label>
                            <InputNumber
                                id="email_port"
                                v-model="extraConfig.emailPort"
                                :use-grouping="false"
                                :disabled="isLocked('email_port')"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="email_user">
                                {{ $t('installation.preview.email.user') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('email_user')"
                                    field-key="email_user"
                                    :env-setting="envSettings.email_user"
                                />
                            </label>
                            <InputText
                                id="email_user"
                                v-model="extraConfig.emailUser"
                                :disabled="isLocked('email_user')"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="email_pass">
                                {{ $t('installation.preview.email.pass') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('email_pass')"
                                    field-key="email_pass"
                                    :env-setting="envSettings.email_pass"
                                />
                            </label>
                            <Password
                                id="email_pass"
                                v-model="extraConfig.emailPass"
                                :toggle-mask="true"
                                :disabled="isLocked('email_pass')"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="email_from">
                                {{ $t('installation.preview.email.from') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('email_from')"
                                    field-key="email_from"
                                    :env-setting="envSettings.email_from"
                                />
                            </label>
                            <InputText
                                id="email_from"
                                v-model="extraConfig.emailFrom"
                                :disabled="isLocked('email_from')"
                                fluid
                            />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionPanel>

            <!-- 存储配置 -->
            <AccordionPanel value="2">
                <AccordionHeader>{{ $t('installation.preview.sections.storage') }}</AccordionHeader>
                <AccordionContent>
                    <div class="installation-wizard__form">
                        <div class="form-field">
                            <label for="storage_type">
                                {{ $t('installation.preview.storage.type') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('storage_type')"
                                    field-key="storage_type"
                                    :env-setting="envSettings.storage_type"
                                />
                            </label>
                            <Select
                                id="storage_type"
                                v-model="extraConfig.storageType"
                                :options="['local', 's3', 'r2']"
                                :disabled="isLocked('storage_type')"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="asset_public_base_url">
                                {{ $t('installation.preview.storage.assetPublicBaseUrl') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('asset_public_base_url')"
                                    field-key="asset_public_base_url"
                                    :env-setting="envSettings.asset_public_base_url"
                                />
                            </label>
                            <InputText
                                id="asset_public_base_url"
                                v-model="extraConfig.assetPublicBaseUrl"
                                :disabled="isLocked('asset_public_base_url')"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="asset_object_prefix">
                                {{ $t('installation.preview.storage.assetObjectPrefix') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('asset_object_prefix')"
                                    field-key="asset_object_prefix"
                                    :env-setting="envSettings.asset_object_prefix"
                                />
                            </label>
                            <InputText
                                id="asset_object_prefix"
                                v-model="extraConfig.assetObjectPrefix"
                                :disabled="isLocked('asset_object_prefix')"
                                fluid
                            />
                        </div>
                        <template v-if="extraConfig.storageType === 'local'">
                            <div class="form-field">
                                <label for="storage_dir">
                                    {{ $t('installation.preview.storage.localDir') }}
                                    <InstallationFieldStatus
                                        v-if="isLocked('local_storage_dir')"
                                        field-key="local_storage_dir"
                                        :env-setting="envSettings.local_storage_dir"
                                    />
                                </label>
                                <InputText
                                    id="storage_dir"
                                    v-model="extraConfig.localStorageDir"
                                    :disabled="isLocked('local_storage_dir')"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="storage_url">
                                    {{ $t('installation.preview.storage.localBaseUrl') }}
                                    <InstallationFieldStatus
                                        v-if="isLocked('local_storage_base_url')"
                                        field-key="local_storage_base_url"
                                        :env-setting="envSettings.local_storage_base_url"
                                    />
                                </label>
                                <InputText
                                    id="storage_url"
                                    v-model="extraConfig.localStorageBaseUrl"
                                    :disabled="isLocked('local_storage_base_url')"
                                    fluid
                                />
                            </div>
                        </template>
                        <template v-else>
                            <div class="form-field">
                                <label for="s3_endpoint">
                                    {{ $t('installation.preview.storage.s3Endpoint') }}
                                    <InstallationFieldStatus
                                        v-if="isLocked('s3_endpoint')"
                                        field-key="s3_endpoint"
                                        :env-setting="envSettings.s3_endpoint"
                                    />
                                </label>
                                <InputText
                                    id="s3_endpoint"
                                    v-model="extraConfig.s3Endpoint"
                                    :disabled="isLocked('s3_endpoint')"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="s3_bucket">
                                    {{ $t('installation.preview.storage.s3Bucket') }}
                                    <InstallationFieldStatus
                                        v-if="isLocked('s3_bucket')"
                                        field-key="s3_bucket"
                                        :env-setting="envSettings.s3_bucket"
                                    />
                                </label>
                                <InputText
                                    id="s3_bucket"
                                    v-model="extraConfig.s3Bucket"
                                    :disabled="isLocked('s3_bucket')"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="s3_region">
                                    {{ $t('installation.preview.storage.s3Region') }}
                                    <InstallationFieldStatus
                                        v-if="isLocked('s3_region')"
                                        field-key="s3_region"
                                        :env-setting="envSettings.s3_region"
                                    />
                                </label>
                                <InputText
                                    id="s3_region"
                                    v-model="extraConfig.s3Region"
                                    :disabled="isLocked('s3_region')"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="s3_key">
                                    {{ $t('installation.preview.storage.s3AccessKey') }}
                                    <InstallationFieldStatus
                                        v-if="isLocked('s3_access_key')"
                                        field-key="s3_access_key"
                                        :env-setting="envSettings.s3_access_key"
                                    />
                                </label>
                                <Password
                                    id="s3_key"
                                    v-model="extraConfig.s3AccessKey"
                                    :toggle-mask="true"
                                    :disabled="isLocked('s3_access_key')"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="s3_secret">
                                    {{ $t('installation.preview.storage.s3SecretKey') }}
                                    <InstallationFieldStatus
                                        v-if="isLocked('s3_secret_key')"
                                        field-key="s3_secret_key"
                                        :env-setting="envSettings.s3_secret_key"
                                    />
                                </label>
                                <Password
                                    id="s3_secret"
                                    v-model="extraConfig.s3SecretKey"
                                    :toggle-mask="true"
                                    :disabled="isLocked('s3_secret_key')"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="s3_base_url">
                                    {{ $t('installation.preview.storage.s3BaseUrl') }}
                                    <InstallationFieldStatus
                                        v-if="isLocked('s3_base_url')"
                                        field-key="s3_base_url"
                                        :env-setting="envSettings.s3_base_url"
                                    />
                                </label>
                                <InputText
                                    id="s3_base_url"
                                    v-model="extraConfig.s3BaseUrl"
                                    :disabled="isLocked('s3_base_url')"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="s3_bucket_prefix">
                                    {{ $t('installation.preview.storage.s3BucketPrefix') }}
                                    <InstallationFieldStatus
                                        v-if="isLocked('s3_bucket_prefix')"
                                        field-key="s3_bucket_prefix"
                                        :env-setting="envSettings.s3_bucket_prefix"
                                    />
                                </label>
                                <InputText
                                    id="s3_bucket_prefix"
                                    v-model="extraConfig.s3BucketPrefix"
                                    :disabled="isLocked('s3_bucket_prefix')"
                                    fluid
                                />
                            </div>
                        </template>
                    </div>
                </AccordionContent>
            </AccordionPanel>

            <!-- 统计配置 -->
            <AccordionPanel value="3">
                <AccordionHeader>{{ $t('installation.preview.sections.analytics') }}</AccordionHeader>
                <AccordionContent>
                    <div class="installation-wizard__form">
                        <div class="form-field">
                            <label for="baidu_analytics">
                                {{ $t('installation.preview.analytics.baidu') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('baidu_analytics')"
                                    field-key="baidu_analytics"
                                    :env-setting="envSettings.baidu_analytics"
                                />
                            </label>
                            <InputText
                                id="baidu_analytics"
                                v-model="extraConfig.baiduAnalytics"
                                :disabled="isLocked('baidu_analytics')"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="google_analytics">
                                {{ $t('installation.preview.analytics.google') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('google_analytics')"
                                    field-key="google_analytics"
                                    :env-setting="envSettings.google_analytics"
                                />
                            </label>
                            <InputText
                                id="google_analytics"
                                v-model="extraConfig.googleAnalytics"
                                :disabled="isLocked('google_analytics')"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="clarity_analytics">
                                {{ $t('installation.preview.analytics.clarity') }}
                                <InstallationFieldStatus
                                    v-if="isLocked('clarity_analytics')"
                                    field-key="clarity_analytics"
                                    :env-setting="envSettings.clarity_analytics"
                                />
                            </label>
                            <InputText
                                id="clarity_analytics"
                                v-model="extraConfig.clarityAnalytics"
                                :disabled="isLocked('clarity_analytics')"
                                fluid
                            />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionPanel>
        </Accordion>

        <div class="installation-wizard__actions">
            <Button
                :label="$t('common.prev')"
                icon="pi pi-arrow-left"
                variant="text"
                @click="$emit('prev')"
            />
            <div class="flex gap-2">
                <Button
                    :label="$t('common.skip')"
                    variant="text"
                    @click="$emit('skip')"
                />
                <Button
                    :label="$t('common.save_next')"
                    icon="pi pi-arrow-right"
                    icon-pos="right"
                    :loading="extraConfigLoading"
                    @click="$emit('next')"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { InstallationEnvSetting } from '@/utils/shared/installation-env-setting'

const extraConfig = defineModel<any>('extraConfig', { required: true })
const props = defineProps<{
    extraConfigLoading: boolean
    extraConfigError: string
    fieldErrors: Record<string, string>
    envSettings: Record<string, InstallationEnvSetting | undefined>
}>()
defineEmits(['prev', 'skip', 'next'])

const isLocked = (key: string) => !!props.envSettings[key]
</script>
