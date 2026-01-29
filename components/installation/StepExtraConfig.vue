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
                            <label for="ai_provider">{{ $t('installation.preview.ai.provider') }}</label>
                            <Select
                                id="ai_provider"
                                v-model="extraConfig.aiProvider"
                                :options="['openai', 'groq', 'ollama', 'anthropic', 'google']"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="ai_model">{{ $t('installation.preview.ai.model') }}</label>
                            <InputText
                                id="ai_model"
                                v-model="extraConfig.aiModel"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="ai_api_key">{{ $t('installation.preview.ai.apiKey') }}</label>
                            <Password
                                id="ai_api_key"
                                v-model="extraConfig.aiApiKey"
                                :toggle-mask="true"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="ai_endpoint">{{ $t('installation.preview.ai.endpoint') }}</label>
                            <InputText
                                id="ai_endpoint"
                                v-model="extraConfig.aiEndpoint"
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
                            <label for="email_host">{{ $t('installation.preview.email.host') }}</label>
                            <InputText
                                id="email_host"
                                v-model="extraConfig.emailHost"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="email_port">{{ $t('installation.preview.email.port') }}</label>
                            <InputNumber
                                id="email_port"
                                v-model="extraConfig.emailPort"
                                :use-grouping="false"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="email_user">{{ $t('installation.preview.email.user') }}</label>
                            <InputText
                                id="email_user"
                                v-model="extraConfig.emailUser"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="email_pass">{{ $t('installation.preview.email.pass') }}</label>
                            <Password
                                id="email_pass"
                                v-model="extraConfig.emailPass"
                                :toggle-mask="true"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="email_from">{{ $t('installation.preview.email.from') }}</label>
                            <InputText
                                id="email_from"
                                v-model="extraConfig.emailFrom"
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
                            <label for="storage_type">{{ $t('installation.preview.storage.type') }}</label>
                            <Select
                                id="storage_type"
                                v-model="extraConfig.storageType"
                                :options="['local', 's3', 'r2']"
                                fluid
                            />
                        </div>
                        <template v-if="extraConfig.storageType === 'local'">
                            <div class="form-field">
                                <label for="storage_dir">{{ $t('installation.preview.storage.localDir') }}</label>
                                <InputText
                                    id="storage_dir"
                                    v-model="extraConfig.localStorageDir"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="storage_url">{{ $t('installation.preview.storage.localUrl') }}</label>
                                <InputText
                                    id="storage_url"
                                    v-model="extraConfig.localStorageBaseUrl"
                                    fluid
                                />
                            </div>
                        </template>
                        <template v-else>
                            <div class="form-field">
                                <label for="s3_endpoint">{{ $t('installation.preview.storage.s3Endpoint') }}</label>
                                <InputText
                                    id="s3_endpoint"
                                    v-model="extraConfig.s3Endpoint"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="s3_bucket">{{ $t('installation.preview.storage.s3Bucket') }}</label>
                                <InputText
                                    id="s3_bucket"
                                    v-model="extraConfig.s3Bucket"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="s3_region">{{ $t('installation.preview.storage.s3Region') }}</label>
                                <InputText
                                    id="s3_region"
                                    v-model="extraConfig.s3Region"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="s3_key">{{ $t('installation.preview.storage.s3AccessKey') }}</label>
                                <Password
                                    id="s3_key"
                                    v-model="extraConfig.s3AccessKey"
                                    :toggle-mask="true"
                                    fluid
                                />
                            </div>
                            <div class="form-field">
                                <label for="s3_secret">{{ $t('installation.preview.storage.s3SecretKey') }}</label>
                                <Password
                                    id="s3_secret"
                                    v-model="extraConfig.s3SecretKey"
                                    :toggle-mask="true"
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
                            <label for="baidu_analytics">{{ $t('installation.preview.analytics.baidu') }}</label>
                            <InputText
                                id="baidu_analytics"
                                v-model="extraConfig.baiduAnalytics"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="google_analytics">{{ $t('installation.preview.analytics.google') }}</label>
                            <InputText
                                id="google_analytics"
                                v-model="extraConfig.googleAnalytics"
                                fluid
                            />
                        </div>
                        <div class="form-field">
                            <label for="clarity_analytics">{{ $t('installation.preview.analytics.clarity') }}</label>
                            <InputText
                                id="clarity_analytics"
                                v-model="extraConfig.clarityAnalytics"
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
defineProps<{
    extraConfigLoading: boolean
}>()
defineEmits(['prev', 'skip', 'next'])
</script>
