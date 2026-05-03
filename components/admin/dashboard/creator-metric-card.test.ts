import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CreatorMetricCard from './creator-metric-card.vue'

const translate = (key: string, _params?: Record<string, string | number>) => key

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
            locale: { value: 'zh-CN' },
        }),
    }
})

describe('CreatorMetricCard', () => {
    it('renders label and number value', async () => {
        const wrapper = await mountSuspended(CreatorMetricCard, {
            props: {
                label: '已发布文章',
                value: 42,
                icon: 'pi pi-file-check',
            },
        })

        expect(wrapper.text()).toContain('已发布文章')
        expect(wrapper.text()).toContain('42')
    })

    it('renders percent format', async () => {
        const wrapper = await mountSuspended(CreatorMetricCard, {
            props: {
                label: '分发成功率',
                value: 0.85,
                icon: 'pi pi-share-alt',
                format: 'percent',
            },
        })

        expect(wrapper.text()).toContain('85%')
    })

    it('renders string value as-is', async () => {
        const wrapper = await mountSuspended(CreatorMetricCard, {
            props: {
                label: '空数据',
                value: '—',
                icon: 'pi pi-ban',
            },
        })

        expect(wrapper.text()).toContain('—')
    })

    it('renders with warm tone', async () => {
        const wrapper = await mountSuspended(CreatorMetricCard, {
            props: {
                label: '草稿',
                value: 5,
                icon: 'pi pi-pen-to-square',
                tone: 'warm',
            },
        })

        const card = wrapper.find('.dashboard-metric-card')
        expect(card.classes()).toContain('dashboard-metric-card--warm')
    })

    it('renders with neutral tone by default', async () => {
        const wrapper = await mountSuspended(CreatorMetricCard, {
            props: {
                label: '已发布',
                value: 0,
                icon: 'pi pi-file',
            },
        })

        const card = wrapper.find('.dashboard-metric-card')
        expect(card.classes()).toContain('dashboard-metric-card--neutral')
    })

    it('renders icon element', async () => {
        const wrapper = await mountSuspended(CreatorMetricCard, {
            props: {
                label: 'Test',
                value: 1,
                icon: 'pi pi-eye',
            },
        })

        const icon = wrapper.find('.dashboard-metric-card__icon')
        expect(icon.exists()).toBe(true)
        expect(icon.classes()).toContain('pi-eye')
    })

    it('handles zero value correctly', async () => {
        const wrapper = await mountSuspended(CreatorMetricCard, {
            props: {
                label: '零',
                value: 0,
                icon: 'pi pi-circle',
            },
        })

        expect(wrapper.text()).toContain('0')
    })
})
