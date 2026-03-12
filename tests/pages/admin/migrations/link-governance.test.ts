import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'

const translations: Record<string, string> = {
    'pages.admin.link_governance.title': '迁移链接治理',
    'pages.admin.link_governance.overview_title': '治理报告记录',
    'pages.admin.link_governance.overview_description': '查看治理报告。',
    'pages.admin.link_governance.actions.refresh': '刷新',
    'pages.admin.link_governance.filters.mode': '执行模式',
    'pages.admin.link_governance.filters.status': '报告状态',
    'pages.admin.link_governance.filters.apply': '应用筛选',
    'pages.admin.link_governance.filters.reset': '重置筛选',
    'pages.admin.link_governance.empty': '暂无治理报告',
    'pages.admin.link_governance.modes.dry-run': '干跑',
    'pages.admin.link_governance.modes.apply': '执行',
    'pages.admin.link_governance.statuses.completed': '已完成',
    'pages.admin.link_governance.statuses.failed': '失败',
    'pages.admin.link_governance.columns.created_at': '创建时间',
    'pages.admin.link_governance.columns.mode': '模式',
    'pages.admin.link_governance.columns.status': '状态',
    'pages.admin.link_governance.columns.requested_by': '发起人',
    'pages.admin.link_governance.columns.summary': '摘要',
    'pages.admin.link_governance.columns.redirects': 'Redirect Seeds',
    'pages.admin.link_governance.summary.total': '总数',
    'pages.admin.link_governance.summary.failed': '失败',
    'pages.admin.link_governance.summary.needs_confirmation': '待确认',
    'common.actions': '操作',
    'common.close': '关闭',
}

function translate(key: string) {
    return translations[key] || key
}

const mockFetch = vi.fn((url: string) => {
    if (url === '/api/admin/migrations/link-governance/reports') {
        return Promise.resolve({
            data: {
                items: [
                    {
                        reportId: 'report-1',
                        mode: 'dry-run',
                        status: 'completed',
                        scopes: ['post-link'],
                        requestedByUserId: 'user-1',
                        requestedByName: 'Admin',
                        requestedByEmail: 'admin@example.com',
                        summary: {
                            total: 3,
                            resolved: 0,
                            rewritten: 2,
                            unchanged: 0,
                            skipped: 0,
                            failed: 0,
                            needsConfirmation: 1,
                        },
                        itemCount: 3,
                        redirectSeedCount: 1,
                        createdAt: '2026-03-12T09:00:00.000Z',
                        updatedAt: '2026-03-12T09:00:00.000Z',
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            },
        })
    }

    if (url === '/api/admin/migrations/link-governance/reports/report-1') {
        return Promise.resolve({
            data: {
                reportId: 'report-1',
                mode: 'dry-run',
                status: 'completed',
                scopes: ['post-link'],
                requestedByUserId: 'user-1',
                summary: {
                    total: 3,
                    resolved: 0,
                    rewritten: 2,
                    unchanged: 0,
                    skipped: 0,
                    failed: 0,
                    needsConfirmation: 1,
                },
                statistics: {
                    byScope: { 'post-link': 3 },
                    byContentType: { post: 3 },
                    byDomain: { local: 3 },
                },
                items: [],
                redirectSeeds: [],
                markdown: '# report',
            },
        })
    }

    return Promise.resolve({ data: null })
})

vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()

    return {
        ...actual,
        useAppApi: () => ({
            $appFetch: mockFetch,
        }),
        useRequestFeedback: () => ({
            showErrorToast: vi.fn(),
        }),
        useI18nDate: () => ({
            formatDateTime: (value: string) => value,
        }),
        definePageMeta: vi.fn(),
    }
})

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: translate,
            locale: ref('zh-CN'),
        }),
    }
})

describe('admin migration link governance page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should mount and render governance overview copy', async () => {
        const LinkGovernancePage = (await import('@/pages/admin/migrations/link-governance.vue')).default
        const wrapper = await mountSuspended(LinkGovernancePage, {
            global: {
                mocks: {
                    $t: translate,
                },
                stubs: {
                    AdminPageHeader: { template: '<div><slot name="actions" /></div>' },
                    Card: { template: '<div><slot name="content" /></div>' },
                    Button: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
                    Select: { template: '<div><slot /></div>' },
                    DataTable: { template: '<div><slot /><slot name="empty" /></div>' },
                    Column: { template: '<div><slot /></div>' },
                    Dialog: { template: '<div><slot /><slot name="footer" /></div>' },
                    Tag: { template: '<span><slot /></span>' },
                    ProgressSpinner: { template: '<div>spinner</div>' },
                },
            },
        })

        await flushPromises()

        expect(wrapper.text()).toContain('治理报告记录')
        expect(wrapper.text()).toContain('查看治理报告。')
    })
})
