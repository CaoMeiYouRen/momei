<!-- eslint-disable max-lines -->
<template>
    <div class="settings-form">
        <SettingFormField
            field-key="ai_provider"
            input-id="ai_provider"
            :metadata="metadata.ai_provider"
        >
            <Select
                id="ai_provider"
                v-model="settings.ai_provider"
                :options="aiProviders"
                :disabled="metadata.ai_provider?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="ai_model"
            input-id="ai_model"
            :metadata="metadata.ai_model"
        >
            <InputText
                id="ai_model"
                v-model="settings.ai_model"
                :disabled="metadata.ai_model?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="ai_api_key"
            input-id="ai_api_key"
            :metadata="metadata.ai_api_key"
        >
            <Password
                id="ai_api_key"
                v-model="settings.ai_api_key"
                :disabled="metadata.ai_api_key?.isLocked"
                :toggle-mask="true"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="ai_endpoint"
            input-id="ai_endpoint"
            :metadata="metadata.ai_endpoint"
        >
            <InputText
                id="ai_endpoint"
                v-model="settings.ai_endpoint"
                :disabled="metadata.ai_endpoint?.isLocked"
                fluid
            />
        </SettingFormField>

        <Divider class="my-8" />

        <SettingFormField
            input-id="ai_quota_enabled"
            :label="$t('pages.admin.settings.system.keys.ai_quota_title')"
            :description="$t('pages.admin.settings.system.keys.ai_quota_description')"
            :metadata="metadata.ai_quota_enabled"
            inline
        >
            <ToggleSwitch
                id="ai_quota_enabled"
                v-model="settings.ai_quota_enabled"
                :disabled="metadata.ai_quota_enabled?.isLocked"
            />
        </SettingFormField>

        <div v-if="settings.ai_quota_enabled" class="ai-settings__group">
            <SettingFormField
                field-key="ai_quota_policies"
                input-id="ai_quota_policies"
                :label="$t('pages.admin.settings.system.keys.ai_quota_policies')"
                :description="$t('pages.admin.settings.system.hints.ai_quota_policies_description')"
                :metadata="metadata.ai_quota_policies"
            >
                <div class="ai-settings__policy-editor">
                    <template v-if="!quotaPoliciesParseError">
                        <div class="ai-settings__section-header">
                            <div>
                                <h4 class="ai-settings__section-title">
                                    {{ $t('pages.admin.settings.system.ai_editor.basic_quota_title') }}
                                </h4>
                                <p class="ai-settings__section-description">
                                    {{ $t('pages.admin.settings.system.ai_editor.basic_quota_description') }}
                                </p>
                            </div>
                            <Button
                                icon="pi pi-plus"
                                :label="$t('pages.admin.settings.system.ai_editor.add_basic_policy')"
                                size="small"
                                :disabled="metadata.ai_quota_policies?.isLocked"
                                @click="addBasicQuotaPolicy"
                            />
                        </div>

                        <div v-if="!basicQuotaPolicies.length" class="ai-settings__empty-state">
                            {{ $t('pages.admin.settings.system.ai_editor.basic_quota_empty') }}
                        </div>

                        <div
                            v-for="(policy, index) in basicQuotaPolicies"
                            :key="`quota-policy-${index}`"
                            class="ai-settings__policy-card"
                        >
                            <div class="ai-settings__policy-card-header">
                                <div>
                                    <h5 class="ai-settings__policy-card-title">
                                        {{ $t('pages.admin.settings.system.ai_editor.basic_policy_label', {index: index + 1}) }}
                                    </h5>
                                    <p class="ai-settings__policy-card-description">
                                        {{ $t('pages.admin.settings.system.ai_editor.basic_policy_help') }}
                                    </p>
                                </div>
                                <Button
                                    icon="pi pi-trash"
                                    severity="secondary"
                                    text
                                    size="small"
                                    :disabled="metadata.ai_quota_policies?.isLocked"
                                    @click="removeBasicQuotaPolicy(index)"
                                />
                            </div>

                            <div class="ai-settings__policy-grid">
                                <div class="ai-settings__field">
                                    <label class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.subject_type') }}
                                    </label>
                                    <Select
                                        v-model="policy.subjectType"
                                        :options="basicSubjectTypeOptions"
                                        option-label="label"
                                        option-value="value"
                                        :disabled="metadata.ai_quota_policies?.isLocked"
                                        fluid
                                        @update:model-value="onBasicPolicySubjectTypeChange(policy)"
                                    />
                                </div>

                                <div class="ai-settings__field">
                                    <label class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.subject_value') }}
                                    </label>
                                    <Select
                                        v-if="policy.subjectType === 'role'"
                                        v-model="policy.subjectValue"
                                        :options="roleOptions"
                                        option-label="label"
                                        option-value="value"
                                        :disabled="metadata.ai_quota_policies?.isLocked"
                                        fluid
                                    />
                                    <InputText
                                        v-else
                                        v-model="policy.subjectValue"
                                        :disabled="true"
                                        fluid
                                    />
                                </div>

                                <div class="ai-settings__field">
                                    <label class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.scope') }}
                                    </label>
                                    <Select
                                        v-model="policy.scope"
                                        :options="quotaScopeOptions"
                                        option-label="label"
                                        option-value="value"
                                        :disabled="metadata.ai_quota_policies?.isLocked"
                                        fluid
                                    />
                                </div>

                                <div class="ai-settings__field">
                                    <label class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.period') }}
                                    </label>
                                    <Select
                                        v-model="policy.period"
                                        :options="quotaPeriodOptions"
                                        option-label="label"
                                        option-value="value"
                                        :disabled="metadata.ai_quota_policies?.isLocked"
                                        fluid
                                    />
                                </div>

                                <div class="ai-settings__field">
                                    <label class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.max_requests') }}
                                    </label>
                                    <InputNumber
                                        v-model="policy.maxRequests"
                                        :disabled="metadata.ai_quota_policies?.isLocked"
                                        :min="0"
                                        fluid
                                        show-buttons
                                        :use-grouping="false"
                                    />
                                </div>

                                <div class="ai-settings__field">
                                    <label class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.max_quota_units') }}
                                    </label>
                                    <InputNumber
                                        v-model="policy.maxQuotaUnits"
                                        :disabled="metadata.ai_quota_policies?.isLocked"
                                        :min="0"
                                        fluid
                                        show-buttons
                                        :use-grouping="false"
                                    />
                                </div>

                                <div class="ai-settings__field">
                                    <label class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.max_actual_cost') }}
                                    </label>
                                    <InputNumber
                                        v-model="policy.maxActualCost"
                                        :disabled="metadata.ai_quota_policies?.isLocked"
                                        :min="0"
                                        :min-fraction-digits="2"
                                        :max-fraction-digits="2"
                                        fluid
                                        :use-grouping="false"
                                    />
                                </div>

                                <div class="ai-settings__field">
                                    <label class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.max_concurrent_heavy_tasks') }}
                                    </label>
                                    <InputNumber
                                        v-model="policy.maxConcurrentHeavyTasks"
                                        :disabled="metadata.ai_quota_policies?.isLocked"
                                        :min="0"
                                        fluid
                                        show-buttons
                                        :use-grouping="false"
                                    />
                                </div>
                            </div>

                            <div class="ai-settings__policy-flags">
                                <div class="ai-settings__toggle-field">
                                    <span class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.enabled') }}
                                    </span>
                                    <ToggleSwitch
                                        v-model="policy.enabled"
                                        :disabled="metadata.ai_quota_policies?.isLocked"
                                    />
                                </div>

                                <div class="ai-settings__toggle-field">
                                    <span class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.is_exempt') }}
                                    </span>
                                    <ToggleSwitch
                                        v-model="policy.isExempt"
                                        :disabled="metadata.ai_quota_policies?.isLocked"
                                    />
                                </div>
                            </div>
                        </div>

                        <Accordion value="advanced-json">
                            <AccordionPanel value="advanced-json">
                                <AccordionHeader>
                                    {{ $t('pages.admin.settings.system.ai_editor.advanced_json_title') }}
                                </AccordionHeader>
                                <AccordionContent>
                                    <p class="ai-settings__section-description ai-settings__section-description--spaced">
                                        {{ $t('pages.admin.settings.system.ai_editor.advanced_json_description') }}
                                    </p>
                                    <Textarea
                                        id="ai_quota_policies"
                                        v-model="advancedQuotaPoliciesJson"
                                        :disabled="metadata.ai_quota_policies?.isLocked"
                                        rows="12"
                                        auto-resize
                                        fluid
                                    />
                                    <p v-if="advancedQuotaPoliciesError" class="ai-settings__error">
                                        {{ advancedQuotaPoliciesError }}
                                    </p>
                                </AccordionContent>
                            </AccordionPanel>
                        </Accordion>
                    </template>

                    <template v-else>
                        <p class="ai-settings__error">
                            {{ quotaPoliciesParseError }}
                        </p>
                        <Textarea
                            id="ai_quota_policies"
                            v-model="settings.ai_quota_policies"
                            :disabled="metadata.ai_quota_policies?.isLocked"
                            rows="14"
                            auto-resize
                            fluid
                        />
                    </template>
                </div>
            </SettingFormField>

            <p class="ai-settings__hint">
                {{ $t('pages.admin.settings.system.hints.ai_quota_policies') }}
            </p>

            <SettingFormField
                field-key="ai_alert_thresholds"
                input-id="ai_alert_thresholds"
                :label="$t('pages.admin.settings.system.keys.ai_alert_thresholds')"
                :description="$t('pages.admin.settings.system.hints.ai_alert_thresholds_description')"
                :metadata="metadata.ai_alert_thresholds"
            >
                <div class="ai-settings__alert-editor">
                    <template v-if="!alertThresholdsParseError">
                        <div class="ai-settings__toggle-field ai-settings__toggle-field--panel">
                            <div>
                                <h4 class="ai-settings__section-title">
                                    {{ $t('pages.admin.settings.system.ai_editor.alerts_title') }}
                                </h4>
                                <p class="ai-settings__section-description">
                                    {{ $t('pages.admin.settings.system.ai_editor.alerts_description') }}
                                </p>
                            </div>
                            <ToggleSwitch
                                v-model="alertThresholdForm.enabled"
                                :disabled="metadata.ai_alert_thresholds?.isLocked"
                            />
                        </div>

                        <div class="ai-settings__policy-grid">
                            <div class="ai-settings__field ai-settings__field--wide">
                                <label class="ai-settings__field-label">
                                    {{ $t('pages.admin.settings.system.ai_editor.quota_usage_ratios') }}
                                </label>
                                <MultiSelect
                                    v-model="alertThresholdForm.quotaUsageRatios"
                                    :options="quotaRatioOptions"
                                    option-label="label"
                                    option-value="value"
                                    display="chip"
                                    append-to="body"
                                    :disabled="metadata.ai_alert_thresholds?.isLocked || !alertThresholdForm.enabled"
                                    fluid
                                />
                            </div>

                            <div class="ai-settings__field ai-settings__field--wide">
                                <label class="ai-settings__field-label">
                                    {{ $t('pages.admin.settings.system.ai_editor.cost_usage_ratios') }}
                                </label>
                                <MultiSelect
                                    v-model="alertThresholdForm.costUsageRatios"
                                    :options="costRatioOptions"
                                    option-label="label"
                                    option-value="value"
                                    display="chip"
                                    append-to="body"
                                    :disabled="metadata.ai_alert_thresholds?.isLocked || !alertThresholdForm.enabled"
                                    fluid
                                />
                            </div>

                            <div class="ai-settings__field">
                                <label class="ai-settings__field-label">
                                    {{ $t('pages.admin.settings.system.ai_editor.dedupe_window_minutes') }}
                                </label>
                                <InputNumber
                                    v-model="alertThresholdForm.dedupeWindowMinutes"
                                    :disabled="metadata.ai_alert_thresholds?.isLocked || !alertThresholdForm.enabled"
                                    :min="1"
                                    :max="44640"
                                    fluid
                                    show-buttons
                                    :use-grouping="false"
                                />
                            </div>

                            <div class="ai-settings__field">
                                <label class="ai-settings__field-label">
                                    {{ $t('pages.admin.settings.system.ai_editor.max_alerts') }}
                                </label>
                                <InputNumber
                                    v-model="alertThresholdForm.maxAlerts"
                                    :disabled="metadata.ai_alert_thresholds?.isLocked || !alertThresholdForm.enabled"
                                    :min="1"
                                    :max="100"
                                    fluid
                                    show-buttons
                                    :use-grouping="false"
                                />
                            </div>
                        </div>

                        <div class="ai-settings__subsection">
                            <div class="ai-settings__toggle-field ai-settings__toggle-field--panel">
                                <div>
                                    <h5 class="ai-settings__policy-card-title">
                                        {{ $t('pages.admin.settings.system.ai_editor.failure_burst_title') }}
                                    </h5>
                                    <p class="ai-settings__policy-card-description">
                                        {{ $t('pages.admin.settings.system.ai_editor.failure_burst_description') }}
                                    </p>
                                </div>
                                <ToggleSwitch
                                    v-model="alertThresholdForm.failureBurst.enabled"
                                    :disabled="metadata.ai_alert_thresholds?.isLocked || !alertThresholdForm.enabled"
                                />
                            </div>

                            <div class="ai-settings__policy-grid">
                                <div class="ai-settings__field">
                                    <label class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.window_minutes') }}
                                    </label>
                                    <InputNumber
                                        v-model="alertThresholdForm.failureBurst.windowMinutes"
                                        :disabled="metadata.ai_alert_thresholds?.isLocked || !alertThresholdForm.enabled || !alertThresholdForm.failureBurst.enabled"
                                        :min="1"
                                        :max="1440"
                                        fluid
                                        show-buttons
                                        :use-grouping="false"
                                    />
                                </div>

                                <div class="ai-settings__field">
                                    <label class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.max_failures') }}
                                    </label>
                                    <InputNumber
                                        v-model="alertThresholdForm.failureBurst.maxFailures"
                                        :disabled="metadata.ai_alert_thresholds?.isLocked || !alertThresholdForm.enabled || !alertThresholdForm.failureBurst.enabled"
                                        :min="1"
                                        :max="1000"
                                        fluid
                                        show-buttons
                                        :use-grouping="false"
                                    />
                                </div>

                                <div class="ai-settings__field ai-settings__field--wide">
                                    <label class="ai-settings__field-label">
                                        {{ $t('pages.admin.settings.system.ai_editor.failure_categories') }}
                                    </label>
                                    <MultiSelect
                                        v-model="alertThresholdForm.failureBurst.categories"
                                        :options="alertCategoryOptions"
                                        option-label="label"
                                        option-value="value"
                                        display="chip"
                                        append-to="body"
                                        :disabled="metadata.ai_alert_thresholds?.isLocked || !alertThresholdForm.enabled || !alertThresholdForm.failureBurst.enabled"
                                        fluid
                                    />
                                </div>
                            </div>
                        </div>
                    </template>

                    <template v-else>
                        <p class="ai-settings__error">
                            {{ alertThresholdsParseError }}
                        </p>
                        <Textarea
                            id="ai_alert_thresholds"
                            v-model="settings.ai_alert_thresholds"
                            :disabled="metadata.ai_alert_thresholds?.isLocked"
                            rows="10"
                            auto-resize
                            fluid
                        />
                    </template>
                </div>
            </SettingFormField>
        </div>

        <Divider class="my-8" />

        <SettingFormField
            input-id="ai_image_enabled"
            :label="$t('pages.admin.settings.system.keys.ai_image_title')"
            :description="$t('pages.admin.settings.system.keys.ai_image_description')"
            :metadata="metadata.ai_image_enabled"
            inline
        >
            <ToggleSwitch
                id="ai_image_enabled"
                v-model="settings.ai_image_enabled"
                :disabled="metadata.ai_image_enabled?.isLocked"
            />
        </SettingFormField>

        <div v-if="settings.ai_image_enabled" class="ai-settings__group">
            <SettingFormField
                field-key="ai_image_provider"
                input-id="ai_image_provider"
                :metadata="metadata.ai_image_provider"
            >
                <Select
                    id="ai_image_provider"
                    v-model="settings.ai_image_provider"
                    :options="aiImageProviders"
                    :disabled="metadata.ai_image_provider?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="ai_image_model"
                input-id="ai_image_model"
                :metadata="metadata.ai_image_model"
            >
                <InputText
                    id="ai_image_model"
                    v-model="settings.ai_image_model"
                    :disabled="metadata.ai_image_model?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="ai_image_api_key"
                input-id="ai_image_api_key"
                :metadata="metadata.ai_image_api_key"
            >
                <Password
                    id="ai_image_api_key"
                    v-model="settings.ai_image_api_key"
                    :disabled="metadata.ai_image_api_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="ai_image_endpoint"
                input-id="ai_image_endpoint"
                :metadata="metadata.ai_image_endpoint"
            >
                <InputText
                    id="ai_image_endpoint"
                    v-model="settings.ai_image_endpoint"
                    :disabled="metadata.ai_image_endpoint?.isLocked"
                    fluid
                />
            </SettingFormField>
        </div>

        <Divider class="my-8" />

        <SettingFormField
            input-id="asr_enabled"
            :label="$t('pages.admin.settings.system.keys.ai_asr_title')"
            :description="$t('pages.admin.settings.system.keys.ai_asr_description')"
            :metadata="metadata.asr_enabled"
            inline
        >
            <ToggleSwitch
                id="asr_enabled"
                v-model="settings.asr_enabled"
                :disabled="metadata.asr_enabled?.isLocked"
            />
        </SettingFormField>

        <div v-if="settings.asr_enabled" class="ai-settings__group">
            <SettingFormField
                field-key="asr_provider"
                input-id="asr_provider"
                :metadata="metadata.asr_provider"
            >
                <Select
                    id="asr_provider"
                    v-model="settings.asr_provider"
                    :options="asrProviders"
                    option-label="label"
                    option-value="value"
                    :disabled="metadata.asr_provider?.isLocked"
                    fluid
                />
            </SettingFormField>

            <div v-if="settings.asr_provider === 'siliconflow'" class="ai-settings__provider-group">
                <SettingFormField
                    field-key="asr_api_key"
                    input-id="asr_api_key"
                    :metadata="metadata.asr_api_key"
                >
                    <Password
                        id="asr_api_key"
                        v-model="settings.asr_api_key"
                        :disabled="metadata.asr_api_key?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="asr_model"
                    input-id="asr_model"
                    :metadata="metadata.asr_model"
                >
                    <InputText
                        id="asr_model"
                        v-model="settings.asr_model"
                        :disabled="metadata.asr_model?.isLocked"
                        placeholder="FunAudioLLM/SenseVoiceSmall"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="asr_endpoint"
                    input-id="asr_endpoint"
                    :metadata="metadata.asr_endpoint"
                >
                    <InputText
                        id="asr_endpoint"
                        v-model="settings.asr_endpoint"
                        :disabled="metadata.asr_endpoint?.isLocked"
                        fluid
                    />
                </SettingFormField>
            </div>

            <div v-if="settings.asr_provider === 'volcengine'" class="ai-settings__provider-group">
                <SettingFormField
                    field-key="asr_model"
                    input-id="asr_model"
                    :metadata="metadata.asr_model"
                >
                    <InputText
                        id="asr_model"
                        v-model="settings.asr_model"
                        :disabled="metadata.asr_model?.isLocked"
                        placeholder="volc.seedasr.sauc.duration"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="asr_endpoint"
                    input-id="asr_endpoint"
                    :metadata="metadata.asr_endpoint"
                >
                    <InputText
                        id="asr_endpoint"
                        v-model="settings.asr_endpoint"
                        :disabled="metadata.asr_endpoint?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="asr_volcengine_cluster_id"
                    input-id="asr_volcengine_cluster_id"
                    :metadata="metadata.asr_volcengine_cluster_id"
                >
                    <InputText
                        id="asr_volcengine_cluster_id"
                        v-model="settings.asr_volcengine_cluster_id"
                        :disabled="metadata.asr_volcengine_cluster_id?.isLocked"
                        fluid
                    />
                </SettingFormField>
            </div>
        </div>

        <div
            v-if="(settings.asr_enabled && settings.asr_provider === 'volcengine') || (settings.tts_enabled && settings.tts_provider === 'volcengine')"
            class="ai-settings__shared-group"
        >
            <!-- <Divider class="my-8" /> -->

            <SettingFormField
                field-key="volcengine_app_id"
                input-id="volcengine_app_id"
                :metadata="metadata.volcengine_app_id"
            >
                <InputText
                    id="volcengine_app_id"
                    v-model="settings.volcengine_app_id"
                    :disabled="metadata.volcengine_app_id?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="volcengine_access_key"
                input-id="volcengine_access_key"
                :metadata="metadata.volcengine_access_key"
            >
                <InputText
                    id="volcengine_access_key"
                    v-model="settings.volcengine_access_key"
                    :disabled="metadata.volcengine_access_key?.isLocked"
                    fluid
                />
            </SettingFormField>

            <SettingFormField
                field-key="volcengine_secret_key"
                input-id="volcengine_secret_key"
                :metadata="metadata.volcengine_secret_key"
            >
                <Password
                    id="volcengine_secret_key"
                    v-model="settings.volcengine_secret_key"
                    :disabled="metadata.volcengine_secret_key?.isLocked"
                    :toggle-mask="true"
                    fluid
                />
            </SettingFormField>
        </div>

        <Divider class="my-8" />

        <SettingFormField
            input-id="tts_enabled"
            :label="$t('pages.admin.settings.system.keys.ai_tts_title')"
            :description="$t('pages.admin.settings.system.keys.ai_tts_description')"
            :metadata="metadata.tts_enabled"
            inline
        >
            <ToggleSwitch
                id="tts_enabled"
                v-model="settings.tts_enabled"
                :disabled="metadata.tts_enabled?.isLocked"
            />
        </SettingFormField>

        <div v-if="settings.tts_enabled" class="ai-settings__group">
            <SettingFormField
                field-key="tts_provider"
                input-id="tts_provider"
                :metadata="metadata.tts_provider"
            >
                <Select
                    id="tts_provider"
                    v-model="settings.tts_provider"
                    :options="ttsProviders"
                    option-label="label"
                    option-value="value"
                    :disabled="metadata.tts_provider?.isLocked"
                    fluid
                />
            </SettingFormField>

            <div v-if="settings.tts_provider !== 'volcengine'" class="ai-settings__provider-group">
                <SettingFormField
                    field-key="tts_api_key"
                    input-id="tts_api_key"
                    :metadata="metadata.tts_api_key"
                >
                    <Password
                        id="tts_api_key"
                        v-model="settings.tts_api_key"
                        :disabled="metadata.tts_api_key?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="tts_model"
                    input-id="tts_model"
                    :metadata="metadata.tts_model"
                >
                    <InputText
                        id="tts_model"
                        v-model="settings.tts_model"
                        :disabled="metadata.tts_model?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="tts_endpoint"
                    input-id="tts_endpoint"
                    :metadata="metadata.tts_endpoint"
                >
                    <InputText
                        id="tts_endpoint"
                        v-model="settings.tts_endpoint"
                        :disabled="metadata.tts_endpoint?.isLocked"
                        fluid
                    />
                </SettingFormField>
            </div>

            <div v-if="settings.tts_provider === 'volcengine'" class="ai-settings__provider-group">
                <SettingFormField
                    field-key="tts_model"
                    input-id="tts_model"
                    :metadata="metadata.tts_model"
                >
                    <InputText
                        id="tts_model"
                        v-model="settings.tts_model"
                        :disabled="metadata.tts_model?.isLocked"
                        fluid
                    />
                </SettingFormField>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type {
    AIAlertThresholdSettings,
    AIQuotaPolicy,
    AIQuotaPolicyPeriod,
    AIQuotaPolicyScope,
    AIQuotaPolicySubjectType,
} from '@/types/ai'
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'
import { aiAlertThresholdsSchema, aiQuotaPoliciesSchema } from '@/utils/schemas/ai'

type BasicQuotaPolicy = {
    subjectType: Extract<AIQuotaPolicySubjectType, 'global' | 'role'>
    subjectValue: string
    scope: AIQuotaPolicyScope
    period: AIQuotaPolicyPeriod
    maxRequests: number | null
    maxQuotaUnits: number | null
    maxActualCost: number | null
    maxConcurrentHeavyTasks: number | null
    isExempt: boolean
    enabled: boolean
}

type AlertThresholdFormState = {
    enabled: boolean
    quotaUsageRatios: number[]
    costUsageRatios: number[]
    failureBurst: {
        enabled: boolean
        windowMinutes: number | null
        maxFailures: number | null
        categories: Array<'all' | 'text' | 'image' | 'asr' | 'tts' | 'podcast'>
    }
    dedupeWindowMinutes: number | null
    maxAlerts: number | null
}

type ParsedQuotaPolicy = Omit<AIQuotaPolicy, 'scope'> & {
    scope: string
}

const settings = defineModel<any>('settings', { required: true })
const props = defineProps<{ metadata: any }>()
const { t } = useI18n()
const aiProviders = ['openai', 'groq', 'ollama', 'anthropic', 'google']
const aiImageProviders = ['openai', 'gemini', 'stable-diffusion', 'doubao', 'siliconflow']
const asrProviders = [
    { label: 'SiliconFlow (Batch)', value: 'siliconflow' },
    { label: 'Volcengine (Streaming)', value: 'volcengine' },
]
const ttsProviders = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'SiliconFlow', value: 'siliconflow' },
    { label: 'Volcengine', value: 'volcengine' },
]

const defaultAlertThresholds = aiAlertThresholdsSchema.parse({})

const basicQuotaPolicies = ref<BasicQuotaPolicy[]>([])
const advancedQuotaPoliciesJson = ref('[]')
const advancedQuotaPoliciesError = ref('')
const quotaPoliciesParseError = ref('')
const alertThresholdsParseError = ref('')
const syncingQuotaEditors = ref(false)
const syncingAlertEditors = ref(false)
const writingQuotaSettings = ref(false)
const writingAlertSettings = ref(false)

const alertThresholdForm = ref<AlertThresholdFormState>(createDefaultAlertThresholdForm())

const basicSubjectTypeOptions = computed(() => [
    { label: t('pages.admin.settings.system.ai_editor.subject_type_global'), value: 'global' },
    { label: t('pages.admin.settings.system.ai_editor.subject_type_role'), value: 'role' },
])

const roleOptions = computed(() => [
    { label: t('pages.admin.settings.system.ai_editor.role_user'), value: 'user' },
    { label: t('pages.admin.settings.system.ai_editor.role_author'), value: 'author' },
    { label: t('pages.admin.settings.system.ai_editor.role_admin'), value: 'admin' },
    { label: t('pages.admin.settings.system.ai_editor.role_editor'), value: 'editor' },
    { label: t('pages.admin.settings.system.ai_editor.role_subscriber'), value: 'subscriber' },
])

const quotaScopeOptions = computed(() => [
    { label: t('pages.admin.settings.system.ai_editor.scope_all'), value: 'all' },
    { label: t('pages.admin.settings.system.ai_editor.scope_text'), value: 'text' },
    { label: t('pages.admin.settings.system.ai_editor.scope_image'), value: 'image' },
    { label: t('pages.admin.settings.system.ai_editor.scope_asr'), value: 'asr' },
    { label: t('pages.admin.settings.system.ai_editor.scope_tts'), value: 'tts' },
    { label: t('pages.admin.settings.system.ai_editor.scope_podcast'), value: 'podcast' },
])

const quotaPeriodOptions = computed(() => [
    { label: t('pages.admin.settings.system.ai_editor.period_day'), value: 'day' },
    { label: t('pages.admin.settings.system.ai_editor.period_month'), value: 'month' },
])

const quotaRatioOptions = computed(() => createRatioOptions([0.5, 0.8, 0.9, 1], alertThresholdForm.value.quotaUsageRatios))
const costRatioOptions = computed(() => createRatioOptions([0.5, 0.8, 0.9, 1], alertThresholdForm.value.costUsageRatios))

const alertCategoryOptions = computed(() => [
    { label: t('pages.admin.settings.system.ai_editor.scope_all'), value: 'all' },
    { label: t('pages.admin.settings.system.ai_editor.scope_text'), value: 'text' },
    { label: t('pages.admin.settings.system.ai_editor.scope_image'), value: 'image' },
    { label: t('pages.admin.settings.system.ai_editor.scope_asr'), value: 'asr' },
    { label: t('pages.admin.settings.system.ai_editor.scope_tts'), value: 'tts' },
    { label: t('pages.admin.settings.system.ai_editor.scope_podcast'), value: 'podcast' },
])

function createDefaultAlertThresholdForm(): AlertThresholdFormState {
    return {
        enabled: defaultAlertThresholds.enabled ?? true,
        quotaUsageRatios: [...(defaultAlertThresholds.quotaUsageRatios ?? [0.5, 0.8, 1])],
        costUsageRatios: [...(defaultAlertThresholds.costUsageRatios ?? [0.8, 1])],
        failureBurst: {
            enabled: defaultAlertThresholds.failureBurst?.enabled ?? true,
            windowMinutes: defaultAlertThresholds.failureBurst?.windowMinutes ?? 10,
            maxFailures: defaultAlertThresholds.failureBurst?.maxFailures ?? 3,
            categories: [...(defaultAlertThresholds.failureBurst?.categories ?? ['image', 'asr', 'tts', 'podcast'])],
        },
        dedupeWindowMinutes: defaultAlertThresholds.dedupeWindowMinutes ?? 1440,
        maxAlerts: defaultAlertThresholds.maxAlerts ?? 10,
    }
}

function createDefaultBasicQuotaPolicy(): BasicQuotaPolicy {
    return {
        subjectType: 'global',
        subjectValue: 'default',
        scope: 'all',
        period: 'day',
        maxRequests: null,
        maxQuotaUnits: null,
        maxActualCost: null,
        maxConcurrentHeavyTasks: null,
        isExempt: false,
        enabled: true,
    }
}

function normalizeNumber(value?: number | null): number | null {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return null
    }

    return value
}

function sanitizeRatioValues(values: number[], fallback: number[]): number[] {
    const normalized = Array.from(new Set(values.filter((value) => value > 0 && value <= 1))).sort((left, right) => left - right)
    return normalized.length ? normalized : [...fallback]
}

function createRatioOptions(baseValues: number[], selectedValues: number[]) {
    const values = Array.from(new Set([...baseValues, ...selectedValues])).sort((left, right) => left - right)
    return values.map((value) => ({
        label: `${Math.round(value * 100)}%`,
        value,
    }))
}

function serializeQuotaPolicies(basicPolicies: BasicQuotaPolicy[], advancedPolicies: AIQuotaPolicy[]) {
    const basic = basicPolicies.map((policy) => {
        const serialized: AIQuotaPolicy = {
            subjectType: policy.subjectType,
            subjectValue: policy.subjectType === 'global' ? 'default' : policy.subjectValue,
            scope: policy.scope,
            period: policy.period,
            enabled: policy.enabled,
            isExempt: policy.isExempt,
        }

        if (policy.maxRequests !== null) {
            serialized.maxRequests = policy.maxRequests
        }

        if (policy.maxQuotaUnits !== null) {
            serialized.maxQuotaUnits = policy.maxQuotaUnits
        }

        if (policy.maxActualCost !== null) {
            serialized.maxActualCost = policy.maxActualCost
        }

        if (policy.maxConcurrentHeavyTasks !== null) {
            serialized.maxConcurrentHeavyTasks = policy.maxConcurrentHeavyTasks
        }

        return serialized
    })

    return JSON.stringify([...basic, ...advancedPolicies], null, 2)
}

function normalizeParsedQuotaPolicy(policy: ParsedQuotaPolicy): AIQuotaPolicy {
    return {
        ...policy,
        scope: policy.scope as AIQuotaPolicyScope,
    }
}

function syncQuotaEditorsFromSettings(rawValue: unknown) {
    syncingQuotaEditors.value = true

    try {
        const source = typeof rawValue === 'string' && rawValue.trim()
            ? rawValue
            : '[]'
        const parsed = JSON.parse(source)
        const result = aiQuotaPoliciesSchema.safeParse(parsed)

        if (!result.success) {
            quotaPoliciesParseError.value = t('pages.admin.settings.system.ai_editor.invalid_quota_json')
            basicQuotaPolicies.value = []
            advancedQuotaPoliciesJson.value = source
            return
        }

        quotaPoliciesParseError.value = ''
        advancedQuotaPoliciesError.value = ''

        const normalizedPolicies = result.data.map((policy) => normalizeParsedQuotaPolicy(policy as ParsedQuotaPolicy))
        const basicPolicies = normalizedPolicies.filter((policy) => policy.subjectType === 'global' || policy.subjectType === 'role')
        const advancedPolicies = normalizedPolicies.filter((policy) => {
            return policy.subjectType === 'user'
                || policy.subjectType === 'trust_level'
                || String(policy.scope).startsWith('type:')
        })

        basicQuotaPolicies.value = basicPolicies.map((policy) => ({
            subjectType: policy.subjectType as BasicQuotaPolicy['subjectType'],
            subjectValue: policy.subjectType === 'global' ? 'default' : policy.subjectValue,
            scope: policy.scope,
            period: policy.period,
            maxRequests: normalizeNumber(policy.maxRequests),
            maxQuotaUnits: normalizeNumber(policy.maxQuotaUnits),
            maxActualCost: normalizeNumber(policy.maxActualCost),
            maxConcurrentHeavyTasks: normalizeNumber(policy.maxConcurrentHeavyTasks),
            isExempt: policy.isExempt ?? false,
            enabled: policy.enabled ?? true,
        }))
        advancedQuotaPoliciesJson.value = JSON.stringify(advancedPolicies, null, 2)
    } catch {
        quotaPoliciesParseError.value = t('pages.admin.settings.system.ai_editor.invalid_quota_json')
        basicQuotaPolicies.value = []
        advancedQuotaPoliciesJson.value = typeof rawValue === 'string' ? rawValue : '[]'
    } finally {
        syncingQuotaEditors.value = false
    }
}

function syncAlertEditorFromSettings(rawValue: unknown) {
    syncingAlertEditors.value = true

    try {
        const source = typeof rawValue === 'string' && rawValue.trim()
            ? rawValue
            : '{}'
        const parsed = JSON.parse(source)
        const result = aiAlertThresholdsSchema.safeParse(parsed)

        if (!result.success) {
            alertThresholdsParseError.value = t('pages.admin.settings.system.ai_editor.invalid_alert_json')
            alertThresholdForm.value = createDefaultAlertThresholdForm()
            return
        }

        alertThresholdsParseError.value = ''

        alertThresholdForm.value = {
            enabled: result.data.enabled ?? true,
            quotaUsageRatios: sanitizeRatioValues(result.data.quotaUsageRatios ?? [], defaultAlertThresholds.quotaUsageRatios ?? [0.5, 0.8, 1]),
            costUsageRatios: sanitizeRatioValues(result.data.costUsageRatios ?? [], defaultAlertThresholds.costUsageRatios ?? [0.8, 1]),
            failureBurst: {
                enabled: result.data.failureBurst?.enabled ?? true,
                windowMinutes: result.data.failureBurst?.windowMinutes ?? 10,
                maxFailures: result.data.failureBurst?.maxFailures ?? 3,
                categories: [...(result.data.failureBurst?.categories ?? ['image', 'asr', 'tts', 'podcast'])],
            },
            dedupeWindowMinutes: result.data.dedupeWindowMinutes ?? 1440,
            maxAlerts: result.data.maxAlerts ?? 10,
        }
    } catch {
        alertThresholdsParseError.value = t('pages.admin.settings.system.ai_editor.invalid_alert_json')
        alertThresholdForm.value = createDefaultAlertThresholdForm()
    } finally {
        syncingAlertEditors.value = false
    }
}

function updateQuotaSettingsFromEditors() {
    if (syncingQuotaEditors.value) {
        return
    }

    try {
        const parsedAdvanced = JSON.parse(advancedQuotaPoliciesJson.value || '[]')
        const result = aiQuotaPoliciesSchema.safeParse(parsedAdvanced)

        if (!result.success) {
            advancedQuotaPoliciesError.value = t('pages.admin.settings.system.ai_editor.invalid_advanced_json')
            writingQuotaSettings.value = true
            settings.value.ai_quota_policies = advancedQuotaPoliciesJson.value
            return
        }

        advancedQuotaPoliciesError.value = ''
        const advancedPolicies = result.data.map((policy) => normalizeParsedQuotaPolicy(policy as ParsedQuotaPolicy))
        writingQuotaSettings.value = true
        settings.value.ai_quota_policies = serializeQuotaPolicies(basicQuotaPolicies.value, advancedPolicies)
    } catch {
        advancedQuotaPoliciesError.value = t('pages.admin.settings.system.ai_editor.invalid_advanced_json')
        writingQuotaSettings.value = true
        settings.value.ai_quota_policies = advancedQuotaPoliciesJson.value
    }
}

function updateAlertSettingsFromEditor() {
    if (syncingAlertEditors.value) {
        return
    }

    writingAlertSettings.value = true
    settings.value.ai_alert_thresholds = JSON.stringify({
        enabled: alertThresholdForm.value.enabled,
        quotaUsageRatios: sanitizeRatioValues(alertThresholdForm.value.quotaUsageRatios, defaultAlertThresholds.quotaUsageRatios ?? [0.5, 0.8, 1]),
        costUsageRatios: sanitizeRatioValues(alertThresholdForm.value.costUsageRatios, defaultAlertThresholds.costUsageRatios ?? [0.8, 1]),
        failureBurst: {
            enabled: alertThresholdForm.value.failureBurst.enabled,
            windowMinutes: alertThresholdForm.value.failureBurst.windowMinutes ?? 10,
            maxFailures: alertThresholdForm.value.failureBurst.maxFailures ?? 3,
            categories: alertThresholdForm.value.failureBurst.categories.length
                ? alertThresholdForm.value.failureBurst.categories
                : [...(defaultAlertThresholds.failureBurst?.categories ?? ['image', 'asr', 'tts', 'podcast'])],
        },
        dedupeWindowMinutes: alertThresholdForm.value.dedupeWindowMinutes ?? 1440,
        maxAlerts: alertThresholdForm.value.maxAlerts ?? 10,
    }, null, 2)
}

function addBasicQuotaPolicy() {
    basicQuotaPolicies.value = [...basicQuotaPolicies.value, createDefaultBasicQuotaPolicy()]
}

function removeBasicQuotaPolicy(index: number) {
    basicQuotaPolicies.value = basicQuotaPolicies.value.filter((_, itemIndex) => itemIndex !== index)
}

function onBasicPolicySubjectTypeChange(policy: BasicQuotaPolicy) {
    if (policy.subjectType === 'global') {
        policy.subjectValue = 'default'
        return
    }

    if (!roleOptions.value.some((option) => option.value === policy.subjectValue)) {
        policy.subjectValue = 'user'
    }
}

watch(() => settings.value.ai_quota_policies, (value) => {
    if (writingQuotaSettings.value) {
        writingQuotaSettings.value = false
        return
    }

    syncQuotaEditorsFromSettings(value)
}, { immediate: true })

watch(() => settings.value.ai_alert_thresholds, (value) => {
    if (writingAlertSettings.value) {
        writingAlertSettings.value = false
        return
    }

    syncAlertEditorFromSettings(value)
}, { immediate: true })

watch(basicQuotaPolicies, () => {
    updateQuotaSettingsFromEditors()
}, { deep: true })

watch(advancedQuotaPoliciesJson, () => {
    updateQuotaSettingsFromEditors()
})

watch(alertThresholdForm, () => {
    updateAlertSettingsFromEditor()
}, { deep: true })

watch(() => settings.value.ai_quota_enabled, (enabled) => {
    if (!enabled || props.metadata.ai_quota_policies?.isLocked) {
        return
    }

    if (!basicQuotaPolicies.value.length && !advancedQuotaPoliciesJson.value.trim()) {
        basicQuotaPolicies.value = [createDefaultBasicQuotaPolicy()]
    }
})
</script>

<style lang="scss" scoped>
.ai-settings {
    &__group,
    &__provider-group,
    &__shared-group {
        display: flex;
        flex-direction: column;
    }

    &__hint {
        margin: 0 0 1.5rem;
        color: var(--p-text-muted-color);
        line-height: 1.6;
        white-space: pre-line;
    }

    &__policy-editor,
    &__alert-editor {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    &__section-header,
    &__policy-card-header,
    &__toggle-field,
    &__toggle-field--panel {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
    }

    &__section-title,
    &__policy-card-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
    }

    &__section-description,
    &__policy-card-description {
        margin: 0.35rem 0 0;
        color: var(--p-text-muted-color);
        line-height: 1.6;
    }

    &__section-description--spaced {
        margin-bottom: 1rem;
    }

    &__empty-state,
    &__subsection,
    &__policy-card {
        padding: 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 1rem;
        background: color-mix(in srgb, var(--p-surface-0) 92%, var(--p-primary-100));
    }

    &__policy-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    &__field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__field--wide {
        grid-column: 1 / -1;
    }

    &__field-label {
        font-size: 0.9rem;
        font-weight: 600;
    }

    &__policy-flags {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-top: 1rem;
    }

    &__toggle-field {
        padding: 0.875rem 1rem;
        border: 1px solid var(--p-content-border-color);
        border-radius: 0.875rem;
        background: var(--p-surface-0);
    }

    &__toggle-field--panel {
        padding: 1rem;
        align-items: flex-start;
    }

    &__error {
        margin: 0;
        color: var(--p-red-500);
        line-height: 1.5;
    }
}

@media (width <= 768px) {
    .ai-settings {
        &__section-header,
        &__policy-card-header,
        &__toggle-field,
        &__toggle-field--panel {
            flex-direction: column;
            align-items: stretch;
        }

        &__policy-grid {
            grid-template-columns: 1fr;
        }
    }
}
</style>
