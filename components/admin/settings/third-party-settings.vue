<template>
    <div class="third-party-settings">
        <div class="third-party-settings__section">
            <h3 class="third-party-settings__section-title">
                {{ $t('pages.admin.settings.system.sections.memos') }}
            </h3>

            <SettingFormField
                field-key="memos_enabled"
                input-id="memos_enabled"
                :metadata="metadata.memos_enabled"
                inline
            >
                <ToggleSwitch
                    id="memos_enabled"
                    v-model="memosEnabled"
                    :disabled="metadata.memos_enabled?.isLocked"
                />
            </SettingFormField>

            <div v-if="memosEnabled" class="third-party-settings__sub-fields">
                <SettingFormField
                    field-key="memos_instance_url"
                    input-id="memos_instance_url"
                    :metadata="metadata.memos_instance_url"
                >
                    <InputText
                        id="memos_instance_url"
                        v-model="settings.memos_instance_url"
                        :placeholder="$t('pages.admin.settings.system.hints.memos_instance_url')"
                        :disabled="metadata.memos_instance_url?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="memos_access_token"
                    input-id="memos_access_token"
                    :metadata="metadata.memos_access_token"
                >
                    <Password
                        id="memos_access_token"
                        v-model="settings.memos_access_token"
                        :placeholder="$t('pages.admin.settings.system.hints.memos_access_token')"
                        :disabled="metadata.memos_access_token?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="memos_default_visibility"
                    input-id="memos_default_visibility"
                    :metadata="metadata.memos_default_visibility"
                >
                    <Select
                        id="memos_default_visibility"
                        v-model="settings.memos_default_visibility"
                        :options="visibilityOptions"
                        option-label="label"
                        option-value="value"
                        :disabled="metadata.memos_default_visibility?.isLocked"
                        fluid
                    />
                </SettingFormField>
            </div>
        </div>

        <div class="third-party-settings__section">
            <h3 class="third-party-settings__section-title">
                {{ $t('pages.admin.settings.system.sections.listmonk') }}
            </h3>

            <SettingFormField
                field-key="listmonk_enabled"
                input-id="listmonk_enabled"
                :metadata="metadata.listmonk_enabled"
                inline
            >
                <ToggleSwitch
                    id="listmonk_enabled"
                    v-model="listmonkEnabled"
                    :disabled="metadata.listmonk_enabled?.isLocked"
                />
            </SettingFormField>

            <div v-if="listmonkEnabled" class="third-party-settings__sub-fields">
                <SettingFormField
                    field-key="listmonk_instance_url"
                    input-id="listmonk_instance_url"
                    :metadata="metadata.listmonk_instance_url"
                >
                    <InputText
                        id="listmonk_instance_url"
                        v-model="settings.listmonk_instance_url"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_instance_url')"
                        :disabled="metadata.listmonk_instance_url?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_username"
                    input-id="listmonk_username"
                    :metadata="metadata.listmonk_username"
                >
                    <InputText
                        id="listmonk_username"
                        v-model="settings.listmonk_username"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_username')"
                        :disabled="metadata.listmonk_username?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_access_token"
                    input-id="listmonk_access_token"
                    :metadata="metadata.listmonk_access_token"
                >
                    <Password
                        id="listmonk_access_token"
                        v-model="settings.listmonk_access_token"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_access_token')"
                        :disabled="metadata.listmonk_access_token?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_default_list_ids"
                    input-id="listmonk_default_list_ids"
                    :metadata="metadata.listmonk_default_list_ids"
                >
                    <InputText
                        id="listmonk_default_list_ids"
                        v-model="settings.listmonk_default_list_ids"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_default_list_ids')"
                        :disabled="metadata.listmonk_default_list_ids?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_category_list_map"
                    input-id="listmonk_category_list_map"
                    :metadata="metadata.listmonk_category_list_map"
                >
                    <Textarea
                        id="listmonk_category_list_map"
                        v-model="settings.listmonk_category_list_map"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_category_list_map')"
                        :disabled="metadata.listmonk_category_list_map?.isLocked"
                        rows="4"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_tag_list_map"
                    input-id="listmonk_tag_list_map"
                    :metadata="metadata.listmonk_tag_list_map"
                >
                    <Textarea
                        id="listmonk_tag_list_map"
                        v-model="settings.listmonk_tag_list_map"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_tag_list_map')"
                        :disabled="metadata.listmonk_tag_list_map?.isLocked"
                        rows="4"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="listmonk_template_id"
                    input-id="listmonk_template_id"
                    :metadata="metadata.listmonk_template_id"
                >
                    <InputText
                        id="listmonk_template_id"
                        v-model="settings.listmonk_template_id"
                        :placeholder="$t('pages.admin.settings.system.hints.listmonk_template_id')"
                        :disabled="metadata.listmonk_template_id?.isLocked"
                        fluid
                    />
                </SettingFormField>
            </div>
        </div>

        <div class="third-party-settings__section">
            <h3 class="third-party-settings__section-title">
                {{ $t('pages.admin.settings.system.sections.hexo_repository_sync') }}
            </h3>

            <SettingFormField
                field-key="hexo_sync_enabled"
                input-id="hexo_sync_enabled"
                :metadata="metadata.hexo_sync_enabled"
                inline
            >
                <ToggleSwitch
                    id="hexo_sync_enabled"
                    v-model="hexoSyncEnabled"
                    :disabled="metadata.hexo_sync_enabled?.isLocked"
                />
            </SettingFormField>

            <div v-if="hexoSyncEnabled" class="third-party-settings__sub-fields">
                <SettingFormField
                    field-key="hexo_sync_provider"
                    input-id="hexo_sync_provider"
                    :metadata="metadata.hexo_sync_provider"
                >
                    <Select
                        id="hexo_sync_provider"
                        v-model="settings.hexo_sync_provider"
                        :options="hexoProviderOptions"
                        option-label="label"
                        option-value="value"
                        :disabled="metadata.hexo_sync_provider?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="hexo_sync_owner"
                    input-id="hexo_sync_owner"
                    :metadata="metadata.hexo_sync_owner"
                >
                    <InputText
                        id="hexo_sync_owner"
                        v-model="settings.hexo_sync_owner"
                        :placeholder="$t('pages.admin.settings.system.hints.hexo_sync_owner')"
                        :disabled="metadata.hexo_sync_owner?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="hexo_sync_repo"
                    input-id="hexo_sync_repo"
                    :metadata="metadata.hexo_sync_repo"
                >
                    <InputText
                        id="hexo_sync_repo"
                        v-model="settings.hexo_sync_repo"
                        :placeholder="$t('pages.admin.settings.system.hints.hexo_sync_repo')"
                        :disabled="metadata.hexo_sync_repo?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="hexo_sync_branch"
                    input-id="hexo_sync_branch"
                    :metadata="metadata.hexo_sync_branch"
                >
                    <InputText
                        id="hexo_sync_branch"
                        v-model="settings.hexo_sync_branch"
                        :placeholder="$t('pages.admin.settings.system.hints.hexo_sync_branch')"
                        :disabled="metadata.hexo_sync_branch?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="hexo_sync_posts_dir"
                    input-id="hexo_sync_posts_dir"
                    :metadata="metadata.hexo_sync_posts_dir"
                >
                    <InputText
                        id="hexo_sync_posts_dir"
                        v-model="settings.hexo_sync_posts_dir"
                        :placeholder="$t('pages.admin.settings.system.hints.hexo_sync_posts_dir')"
                        :disabled="metadata.hexo_sync_posts_dir?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="hexo_sync_access_token"
                    input-id="hexo_sync_access_token"
                    :metadata="metadata.hexo_sync_access_token"
                >
                    <Password
                        id="hexo_sync_access_token"
                        v-model="settings.hexo_sync_access_token"
                        :placeholder="$t('pages.admin.settings.system.hints.hexo_sync_access_token')"
                        :disabled="metadata.hexo_sync_access_token?.isLocked"
                        :toggle-mask="true"
                        fluid
                    />
                </SettingFormField>
            </div>
        </div>

        <div class="third-party-settings__section">
            <h3 class="third-party-settings__section-title">
                {{ $t('pages.admin.settings.system.sections.external_feeds') }}
            </h3>

            <SettingFormField
                field-key="external_feed_enabled"
                input-id="external_feed_enabled"
                :metadata="metadata.external_feed_enabled"
                inline
            >
                <ToggleSwitch
                    id="external_feed_enabled"
                    v-model="externalFeedEnabled"
                    :disabled="metadata.external_feed_enabled?.isLocked"
                />
            </SettingFormField>

            <div v-if="externalFeedEnabled" class="third-party-settings__sub-fields">
                <div class="third-party-settings__toolbar">
                    <p class="third-party-settings__toolbar-hint">
                        {{ $t('pages.admin.settings.system.external_feeds.refresh_cache_hint') }}
                    </p>

                    <Button
                        class="third-party-settings__refresh-button"
                        icon="pi pi-refresh"
                        severity="secondary"
                        :label="$t('pages.admin.settings.system.external_feeds.refresh_cache')"
                        :loading="refreshingExternalFeeds"
                        @click="refreshExternalFeedCache"
                    />
                </div>

                <SettingFormField
                    field-key="external_feed_home_enabled"
                    input-id="external_feed_home_enabled"
                    :metadata="metadata.external_feed_home_enabled"
                    inline
                >
                    <ToggleSwitch
                        id="external_feed_home_enabled"
                        v-model="externalFeedHomeEnabled"
                        :disabled="metadata.external_feed_home_enabled?.isLocked"
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="external_feed_home_limit"
                    input-id="external_feed_home_limit"
                    :metadata="metadata.external_feed_home_limit"
                    :description="$t('pages.admin.settings.system.hints.external_feed_home_limit')"
                >
                    <InputNumber
                        id="external_feed_home_limit"
                        v-model="settings.external_feed_home_limit"
                        :disabled="metadata.external_feed_home_limit?.isLocked"
                        :min="1"
                        :max="12"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="external_feed_cache_ttl_seconds"
                    input-id="external_feed_cache_ttl_seconds"
                    :metadata="metadata.external_feed_cache_ttl_seconds"
                    :description="$t('pages.admin.settings.system.hints.external_feed_cache_ttl_seconds')"
                >
                    <InputText
                        id="external_feed_cache_ttl_seconds"
                        v-model="settings.external_feed_cache_ttl_seconds"
                        :disabled="metadata.external_feed_cache_ttl_seconds?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="external_feed_stale_while_error_seconds"
                    input-id="external_feed_stale_while_error_seconds"
                    :metadata="metadata.external_feed_stale_while_error_seconds"
                    :description="$t('pages.admin.settings.system.hints.external_feed_stale_while_error_seconds')"
                >
                    <InputText
                        id="external_feed_stale_while_error_seconds"
                        v-model="settings.external_feed_stale_while_error_seconds"
                        :disabled="metadata.external_feed_stale_while_error_seconds?.isLocked"
                        fluid
                    />
                </SettingFormField>

                <SettingFormField
                    field-key="external_feed_sources"
                    input-id="external_feed_sources"
                    :metadata="metadata.external_feed_sources"
                    :description="$t('pages.admin.settings.system.hints.external_feed_sources')"
                >
                    <Textarea
                        id="external_feed_sources"
                        v-model="settings.external_feed_sources"
                        :disabled="metadata.external_feed_sources?.isLocked"
                        rows="10"
                        fluid
                    />
                </SettingFormField>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'
import { toBoolean } from '@/utils/shared/coerce'

const { t } = useI18n()
const { $appFetch } = useAppApi()
const { showErrorToast, showSuccessToast } = useRequestFeedback()

const settings = defineModel<any>('settings', { required: true })
defineProps<{ metadata: any }>()

interface ExternalFeedRefreshResponse {
    data: {
        refreshedAt: string
        sourceCount: number
        snapshotCount: number
        failureCount: number
    }
}

function createToggleModel(key: 'memos_enabled' | 'listmonk_enabled' | 'hexo_sync_enabled' | 'external_feed_enabled' | 'external_feed_home_enabled') {
    return computed({
        get: () => toBoolean(settings.value?.[key]),
        set: (value: boolean) => {
            if (settings.value) {
                settings.value[key] = value
            }
        },
    })
}

const memosEnabled = createToggleModel('memos_enabled')
const listmonkEnabled = createToggleModel('listmonk_enabled')
const hexoSyncEnabled = createToggleModel('hexo_sync_enabled')
const externalFeedEnabled = createToggleModel('external_feed_enabled')
const externalFeedHomeEnabled = createToggleModel('external_feed_home_enabled')
const refreshingExternalFeeds = ref(false)

async function refreshExternalFeedCache() {
    refreshingExternalFeeds.value = true

    try {
        await $appFetch<ExternalFeedRefreshResponse>('/api/admin/external-feed/refresh', {
            method: 'POST',
        })
        showSuccessToast('pages.admin.settings.system.external_feeds.refresh_cache_success')
    } catch (error) {
        showErrorToast(error, {
            fallbackKey: 'pages.admin.settings.system.external_feeds.refresh_cache_failed',
        })
    } finally {
        refreshingExternalFeeds.value = false
    }
}

const visibilityOptions = computed(() => [
    { label: t('pages.admin.settings.system.memos.visibility.PUBLIC'), value: 'PUBLIC' },
    { label: t('pages.admin.settings.system.memos.visibility.PROTECTED'), value: 'PROTECTED' },
    { label: t('pages.admin.settings.system.memos.visibility.PRIVATE'), value: 'PRIVATE' },
])

const hexoProviderOptions = computed(() => [
    { label: t('pages.admin.settings.system.hexo_sync.providers.github'), value: 'github' },
    { label: t('pages.admin.settings.system.hexo_sync.providers.gitee'), value: 'gitee' },
])
</script>

<style lang="scss" scoped>
.third-party-settings {
    &__section {
        margin-bottom: 2rem;
    }

    &__section-title {
        font-size: 1.125rem;
        font-weight: 600;
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid var(--p-surface-border);
    }

    &__sub-fields {
        margin-top: 1.5rem;
        padding-left: 1rem;
        border-left: 2px solid var(--p-primary-50);
    }

    &__toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    &__toolbar-hint {
        margin: 0;
        color: var(--p-text-muted-color);
    }

    &__refresh-button {
        flex-shrink: 0;
    }
}

:global(.dark) {
    .third-party-settings {
        &__sub-fields {
            border-left-color: var(--p-primary-900-opacity-20);
        }

        &__toolbar-hint {
            color: var(--p-surface-400);
        }
    }
}
</style>
