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

const DEFAULT_UMAMI_SCRIPT_URL = 'https://analytics.umami.is/script.js'

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

function parseUmamiAnalytics(rawValue: unknown) {
    if (typeof rawValue !== 'string') {
        return {
            websiteId: '',
            scriptUrl: DEFAULT_UMAMI_SCRIPT_URL,
        }
    }

    const trimmedRaw = rawValue.trim()
    if (!trimmedRaw) {
        return {
            websiteId: '',
            scriptUrl: DEFAULT_UMAMI_SCRIPT_URL,
        }
    }

    try {
        const parsed = JSON.parse(trimmedRaw) as Record<string, unknown>
        const websiteId = typeof parsed.websiteId === 'string'
            ? parsed.websiteId.trim()
            : ''
        const scriptUrl = typeof parsed.scriptUrl === 'string'
            ? parsed.scriptUrl.trim()
            : ''

        return {
            websiteId,
            scriptUrl: scriptUrl || DEFAULT_UMAMI_SCRIPT_URL,
        }
    } catch {
        return {
            websiteId: trimmedRaw,
            scriptUrl: DEFAULT_UMAMI_SCRIPT_URL,
        }
    }
}

function updateUmamiAnalytics(partial: { websiteId?: string, scriptUrl?: string }) {
    const current = parseUmamiAnalytics(settings.value.umami_analytics)
    const websiteId = (partial.websiteId ?? current.websiteId).trim()
    const scriptUrl = (partial.scriptUrl ?? current.scriptUrl).trim()

    if (!websiteId && !scriptUrl) {
        settings.value.umami_analytics = ''
        return
    }

    settings.value.umami_analytics = JSON.stringify({
        websiteId,
        scriptUrl: scriptUrl || DEFAULT_UMAMI_SCRIPT_URL,
    })
}

const umamiWebsiteId = computed({
    get: () => parseUmamiAnalytics(settings.value.umami_analytics).websiteId,
    set: (value: string) => updateUmamiAnalytics({ websiteId: value }),
})

const umamiScriptUrl = computed({
    get: () => parseUmamiAnalytics(settings.value.umami_analytics).scriptUrl,
    set: (value: string) => updateUmamiAnalytics({ scriptUrl: value }),
})
</script>
