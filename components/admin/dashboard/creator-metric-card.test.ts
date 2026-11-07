import { Ban, Circle, Eye, File, FileCheck, PenSquare, Share2 } from '@lucide/vue'
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
                icon: FileCheck,
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
                icon: Share2,
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
                icon: Ban,
            },
        })

        expect(wrapper.text()).toContain('—')
    })

    it('renders with warm tone', async () => {
        const wrapper = await mountSuspended(CreatorMetricCard, {
            props: {
                label: '草稿',
                value: 5,
                icon: PenSquare,
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
                icon: File,
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
                icon: Eye,
            },
        })

        const icon = wrapper.find('.dashboard-metric-card__icon')
        expect(icon.exists()).toBe(true)
        expect(icon.element.tagName.toLowerCase()).toBe('svg')
        expect(icon.classes()).toContain('lucide-eye')
    })

    it('handles zero value correctly', async () => {
        const wrapper = await mountSuspended(CreatorMetricCard, {
            props: {
                label: '零',
                value: 0,
                icon: Circle,
            },
        })

        expect(wrapper.text()).toContain('0')
    })
})
