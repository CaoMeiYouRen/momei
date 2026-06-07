import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AnalyticsSettings from './analytics-settings.vue'

const stubs = {
    SettingFormField: {
        props: ['fieldKey', 'inputId', 'metadata'],
        template: '<div class="setting-field" :data-field-key="fieldKey"><slot /></div>',
    },
    InputText: {
        props: ['id', 'modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template: '<input :id="id" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)">',
    },
}

describe('AnalyticsSettings', () => {
    it('updates analytics ids and respects locked fields', async () => {
        const settings = reactive({
            umami_analytics: '',
            baidu_analytics: 'baidu-id',
            google_analytics: 'google-id',
            clarity_analytics: 'clarity-id',
        })

        const wrapper = await mountSuspended(AnalyticsSettings, {
            props: {
                settings,
                metadata: {
                    umami_analytics: { isLocked: false },
                    baidu_analytics: { isLocked: false },
                    google_analytics: { isLocked: true },
                    clarity_analytics: { isLocked: false },
                },
            },
            global: {
                stubs,
            },
        })

        await wrapper.get('#umami_analytics_website_id').setValue('umami-website-id')
        await wrapper.get('#umami_analytics_script_url').setValue('https://analytics.example.com/script.js')
        await wrapper.get('#baidu_analytics').setValue('baidu-new')
        await wrapper.get('#clarity_analytics').setValue('clarity-new')

        expect(settings.umami_analytics).toBe('{"websiteId":"umami-website-id","scriptUrl":"https://analytics.example.com/script.js"}')
        expect(settings.baidu_analytics).toBe('baidu-new')
        expect(settings.clarity_analytics).toBe('clarity-new')
        expect((wrapper.get('#google_analytics').element as HTMLInputElement).disabled).toBe(true)
        expect(wrapper.findAll('.setting-field')).toHaveLength(5)
    })
})
