<template>
    <div class="settings-form">
        <SettingFormField
            field-key="umami_analytics"
            input-id="umami_analytics_website_id"
            :metadata="metadata.umami_analytics"
        >
            <InputText
                id="umami_analytics_website_id"
                v-model="umamiWebsiteId"
                :disabled="metadata.umami_analytics?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="umami_analytics_script_url"
            input-id="umami_analytics_script_url"
            :metadata="metadata.umami_analytics"
        >
            <InputText
                id="umami_analytics_script_url"
                v-model="umamiScriptUrl"
                :disabled="metadata.umami_analytics?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="baidu_analytics"
            input-id="baidu_analytics"
            :metadata="metadata.baidu_analytics"
        >
            <InputText
                id="baidu_analytics"
                v-model="settings.baidu_analytics"
                :disabled="metadata.baidu_analytics?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="google_analytics"
            input-id="google_analytics"
            :metadata="metadata.google_analytics"
        >
            <InputText
                id="google_analytics"
                v-model="settings.google_analytics"
                :disabled="metadata.google_analytics?.isLocked"
                fluid
            />
        </SettingFormField>

        <SettingFormField
            field-key="clarity_analytics"
            input-id="clarity_analytics"
            :metadata="metadata.clarity_analytics"
        >
            <InputText
                id="clarity_analytics"
                v-model="settings.clarity_analytics"
                :disabled="metadata.clarity_analytics?.isLocked"
                fluid
            />
        </SettingFormField>
    </div>
</template>

<script setup lang="ts">
import SettingFormField from '@/components/admin/settings/setting-form-field.vue'
import type { SettingFormValue, SettingMetadataMap } from '@/types/setting'
import {
    DEFAULT_UMAMI_SCRIPT_URL,
    parseUmamiAnalyticsOptions,
    stringifyUmamiAnalyticsOptions,
} from '@/utils/shared/umami-analytics'

interface AnalyticsSettingsFields {
    umami_analytics: string | null
    baidu_analytics: string | null
    google_analytics: string | null
    clarity_analytics: string | null
}

type AnalyticsSettingsModel = Record<string, SettingFormValue> & Partial<AnalyticsSettingsFields>

const settings = defineModel<AnalyticsSettingsModel>('settings', { required: true })
defineProps<{
    metadata: SettingMetadataMap<keyof AnalyticsSettingsFields>
}>()

function updateUmamiAnalytics(partial: { websiteId?: string, scriptUrl?: string }) {
    const current = parseUmamiAnalyticsOptions(settings.value.umami_analytics) || {
        websiteId: '',
        scriptUrl: DEFAULT_UMAMI_SCRIPT_URL,
    }
    const websiteId = (partial.websiteId ?? current.websiteId).trim()
    const scriptUrl = (partial.scriptUrl ?? current.scriptUrl).trim()

    settings.value.umami_analytics = stringifyUmamiAnalyticsOptions({
        websiteId,
        scriptUrl,
    })
}

const umamiWebsiteId = computed({
    get: () => parseUmamiAnalyticsOptions(settings.value.umami_analytics)?.websiteId || '',
    set: (value: string) => updateUmamiAnalytics({ websiteId: value }),
})

const umamiScriptUrl = computed({
    get: () => parseUmamiAnalyticsOptions(settings.value.umami_analytics)?.scriptUrl || DEFAULT_UMAMI_SCRIPT_URL,
    set: (value: string) => updateUmamiAnalytics({ scriptUrl: value }),
})
</script>
