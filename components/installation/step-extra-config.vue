<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.preview.title') }}</h2>
        <p>{{ $t('installation.preview.description') }}</p>

        <Accordion multiple>
            <!-- AI 配置 -->
            <AccordionPanel value="0">
                <AccordionHeader>{{ $t('installation.preview.sections.ai') }}</AccordionHeader>
                <AccordionContent>
                    <div class="installation-wizard__form">
                        <div class="form-field">
                            <label for="ai_provider">
                                {{ $t('installation.preview.ai.provider') }}
                                <Tag
                                    v-if="isLocked('ai_provider')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
                                />
                            </label>
                            <Select
                                id="ai_provider"
                                v-model="extraConfig.aiProvider"
                                :options="['openai', 'groq', 'ollama', 'anthropic', 'google']"
                                :disabled="isLocked('ai_provider')"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="ai_model">
                                {{ $t('installation.preview.ai.model') }}
                                <Tag
                                    v-if="isLocked('ai_model')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
                                />
                            </label>
                            <InputText
                                id="ai_model"
                                v-model="extraConfig.aiModel"
                                :disabled="isLocked('ai_model')"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="ai_api_key">
                                {{ $t('installation.preview.ai.apiKey') }}
                                <Tag
                                    v-if="isLocked('ai_api_key')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
                                />
                            </label>
                            <Password
                                id="ai_api_key"
                                v-model="extraConfig.aiApiKey"
                                :toggle-mask="true"
                                :disabled="isLocked('ai_api_key')"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="ai_endpoint">
                                {{ $t('installation.preview.ai.endpoint') }}
                                <Tag
                                    v-if="isLocked('ai_endpoint')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
                                />
                            </label>
                            <InputText
                                id="ai_endpoint"
                                v-model="extraConfig.aiEndpoint"
                                :disabled="isLocked('ai_endpoint')"
                                fluid
                            />
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
                                <Tag
                                    v-if="isLocked('email_host')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
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
                                <Tag
                                    v-if="isLocked('email_port')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
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
                                <Tag
                                    v-if="isLocked('email_user')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
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
                                <Tag
                                    v-if="isLocked('email_pass')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
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
                                <Tag
                                    v-if="isLocked('email_from')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
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
                                <Tag
                                    v-if="isLocked('storage_type')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
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
                        <template v-if="extraConfig.storageType === 'local'">
                            <div class="form-field">
                                <label for="storage_dir">
                                    {{ $t('installation.preview.storage.localDir') }}
                                    <Tag
                                        v-if="isLocked('local_storage_dir')"
                                        severity="info"
                                        value="ENV"
                                        class="ml-2"
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
                                    {{ $t('installation.preview.storage.localUrl') }}
                                    <Tag
                                        v-if="isLocked('local_storage_base_url')"
                                        severity="info"
                                        value="ENV"
                                        class="ml-2"
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
                                    <Tag
                                        v-if="isLocked('s3_endpoint')"
                                        severity="info"
                                        value="ENV"
                                        class="ml-2"
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
                                    <Tag
                                        v-if="isLocked('s3_bucket')"
                                        severity="info"
                                        value="ENV"
                                        class="ml-2"
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
                                    <Tag
                                        v-if="isLocked('s3_region')"
                                        severity="info"
                                        value="ENV"
                                        class="ml-2"
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
                                    <Tag
                                        v-if="isLocked('s3_access_key')"
                                        severity="info"
                                        value="ENV"
                                        class="ml-2"
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
                                    <Tag
                                        v-if="isLocked('s3_secret_key')"
                                        severity="info"
                                        value="ENV"
                                        class="ml-2"
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
                                <Tag
                                    v-if="isLocked('baidu_analytics')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
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
                                <Tag
                                    v-if="isLocked('google_analytics')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
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
                                <Tag
                                    v-if="isLocked('clarity_analytics')"
                                    severity="info"
                                    value="ENV"
                                    class="ml-2"
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
const extraConfig = defineModel<any>('extraConfig', { required: true })
const props = defineProps<{
    extraConfigLoading: boolean
    envSettings: Record<string, any>
}>()
defineEmits(['prev', 'skip', 'next'])

const isLocked = (key: string) => !!props.envSettings[key]
</script>
