import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StatsOverview from './stats-overview.vue'

const translate = (key: string, params?: Record<string, string | number>) => {
    if (key === 'pages.admin.ai.alerts.details.cost_usage') {
        return `${params?.used}/${params?.limit}`
    }

    return key
}

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
        }),
    }
})

describe('StatsOverview', () => {
    it('renders unified AI cost display in overview and alerts', async () => {
        const wrapper = await mountSuspended(StatsOverview, {
            props: {
                loading: false,
                costDisplay: {
                    currencyCode: 'CNY',
                    currencySymbol: '¥',
                    quotaUnitPrice: 0.1,
                },
                stats: {
                    overview: {
                        totalTasks: 12,
                        estimatedCost: 4.5,
                        actualCost: 3.5,
                        estimatedQuotaUnits: 28,
                        quotaUnits: 25,
                        avgDurationMs: 1200,
                        successRate: 0.75,
                        failureRate: 0.25,
                    },
                    statusStats: [{ status: 'completed', count: 9 }],
                    typeStats: [],
                    categoryStats: [],
                    chargeStatusStats: [],
                    failureStageStats: [],
                    modelStats: [],
                    topUsers: [],
                    dailyTrend: [],
                    alerts: [{
                        dedupeKey: 'cost_usage:user-1:all:month:0.8',
                        kind: 'cost_usage',
                        severity: 'warning',
                        period: 'month',
                        scope: 'all',
                        subjectType: 'user',
                        subjectValue: 'user-1',
                        threshold: 0.8,
                        usedValue: 8,
                        limitValue: 10,
                    }],
                    costDisplay: {
                        currencyCode: 'CNY',
                        currencySymbol: '¥',
                        quotaUnitPrice: 0.1,
                    },
                },
            },
            global: {
                mocks: {
                    $t: translate,
                },
                stubs: {
                    Card: { template: '<div><slot name="title" /><slot name="content" /></div>' },
                    Tag: { props: ['value'], template: '<span>{{ value }}</span>' },
                },
            },
        })

        expect(wrapper.text()).toContain('¥3.50')
        expect(wrapper.text()).toContain('¥8.00/¥10.00')
    })
})
