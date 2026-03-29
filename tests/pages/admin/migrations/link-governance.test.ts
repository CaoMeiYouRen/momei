import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'

const translations: Record<string, string> = {
    'pages.admin.link_governance.title': '迁移链接治理',
    'pages.admin.link_governance.overview_title': '治理报告记录',
    'pages.admin.link_governance.overview_description': '查看治理报告。',
    'pages.admin.link_governance.execution.title': '执行治理',
    'pages.admin.link_governance.execution.description': '执行 dry-run 或 apply。',
    'pages.admin.link_governance.execution.scopes': '治理范围',
    'pages.admin.link_governance.execution.content_types': '内容类型',
    'pages.admin.link_governance.execution.domains': '域名过滤',
    'pages.admin.link_governance.execution.domains_placeholder': 'legacy.example.com',
    'pages.admin.link_governance.execution.path_prefixes': '路径前缀过滤',
    'pages.admin.link_governance.execution.path_prefixes_placeholder': '/assets',
    'pages.admin.link_governance.execution.validation_mode': '校验模式',
    'pages.admin.link_governance.execution.report_format': '报告格式',
    'pages.admin.link_governance.execution.allow_relative_links': '允许相对链接',
    'pages.admin.link_governance.execution.confirm_apply': '确认写入',
    'pages.admin.link_governance.report_list.title': '治理报告',
    'pages.admin.link_governance.actions.refresh': '刷新',
    'pages.admin.link_governance.actions.dry_run': '开始干跑',
    'pages.admin.link_governance.actions.apply_now': '执行改写',
    'pages.admin.link_governance.actions.export_json': '导出 JSON',
    'pages.admin.link_governance.actions.export_markdown': '导出 Markdown',
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
    'pages.admin.link_governance.scopes.asset-url': '资源链接',
    'pages.admin.link_governance.content_types.post': '文章',
    'pages.admin.link_governance.validation_modes.static': '静态校验',
    'pages.admin.link_governance.validation_modes.static+online': '静态 + 在线探测',
    'pages.admin.link_governance.report_formats.json': 'JSON',
    'pages.admin.link_governance.report_formats.markdown': 'Markdown',
    'common.actions': '操作',
    'common.close': '关闭',
    'pages.admin.link_governance.messages.dry_run_success': '干跑完成',
    'pages.admin.link_governance.messages.apply_success': '执行完成',
    'pages.admin.link_governance.messages.run_failed': '执行失败',
    'pages.admin.link_governance.detail.redirect_seeds': 'Redirect Seeds',
    'pages.admin.link_governance.detail.empty_redirect_seeds': '暂无 redirect seeds',
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

    if (url === '/api/admin/migrations/link-governance/dry-run') {
        return Promise.resolve({
            data: {
                reportId: 'report-new',
                mode: 'dry-run',
                status: 'completed',
                scopes: ['asset-url'],
                requestedByUserId: 'admin-1',
                summary: {
                    total: 2,
                    resolved: 0,
                    rewritten: 2,
                    unchanged: 0,
                    skipped: 0,
                    failed: 0,
                    needsConfirmation: 0,
                },
                statistics: {
                    byScope: { 'asset-url': 2 },
                    byContentType: { post: 2 },
                    byDomain: { 'legacy.example.com': 2 },
                },
                items: [],
                redirectSeeds: [],
                markdown: '# report-new',
            },
        })
    }

    return Promise.resolve({ data: null })
})

const mockShowSuccessToast = vi.fn()

const buttonStub = {
    name: 'Button',
    emits: ['click'],
    props: ['label', 'disabled'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
}

function createGlobalStubs() {
    return {
        AdminPageHeader: { template: '<div><slot name="actions" /></div>' },
        Card: { template: '<div><slot name="content" /></div>' },
        Button: buttonStub,
        Select: { template: '<div><slot /></div>' },
        MultiSelect: { template: '<div><slot /></div>' },
        InputText: { template: '<input />' },
        Checkbox: { template: '<input type="checkbox" />' },
        DataTable: { template: '<div><slot /><slot name="empty" /></div>' },
        Column: { template: '<div><slot /></div>' },
        Dialog: { template: '<div><slot /><slot name="footer" /></div>' },
        Tag: { template: '<span><slot /></span>' },
        ProgressSpinner: { template: '<div>spinner</div>' },
    }
}

vi.mock('#imports', async (importOriginal) => {
    const actual = await importOriginal<typeof import('#imports')>()

    return {
        ...actual,
        useAppApi: () => ({
            $appFetch: mockFetch,
        }),
        useRequestFeedback: () => ({
            showErrorToast: vi.fn(),
            showSuccessToast: mockShowSuccessToast,
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

vi.stubGlobal('useAppApi', () => ({
    $appFetch: mockFetch,
}))

vi.stubGlobal('useRequestFeedback', () => ({
    showErrorToast: vi.fn(),
    showSuccessToast: mockShowSuccessToast,
}))

vi.stubGlobal('useI18nDate', () => ({
    formatDateTime: (value: string) => value,
}))

vi.stubGlobal('definePageMeta', vi.fn())

describe('admin migration link governance page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        const NativeURL = globalThis.URL
        class MockURL extends NativeURL {}

        Object.assign(MockURL, NativeURL, {
            createObjectURL: vi.fn(() => 'blob:mock'),
            revokeObjectURL: vi.fn(),
        })

        vi.stubGlobal('URL', MockURL)
    })

    it('should mount and render governance overview copy', async () => {
        const LinkGovernancePage = (await import('@/pages/admin/migrations/link-governance.vue')).default
        const wrapper = await mountSuspended(LinkGovernancePage, {
            global: {
                mocks: {
                    $t: translate,
                },
                stubs: createGlobalStubs(),
            },
        })

        await flushPromises()

        expect(wrapper.text()).toContain('治理报告记录')
        expect(wrapper.text()).toContain('查看治理报告。')
    })

    it('should render execution actions and keep apply disabled before confirmation', async () => {
        const LinkGovernancePage = (await import('@/pages/admin/migrations/link-governance.vue')).default
        const wrapper = await mountSuspended(LinkGovernancePage, {
            global: {
                mocks: {
                    $t: translate,
                },
                stubs: createGlobalStubs(),
            },
        })

        await flushPromises()

        const dryRunButton = wrapper.findAll('button').find((button) => button.text() === '开始干跑')
        const applyButton = wrapper.findAll('button').find((button) => button.text() === '执行改写')

        expect(dryRunButton).toBeDefined()
        expect(applyButton).toBeDefined()
        expect(applyButton?.attributes('disabled')).toBeDefined()
    })

    it('should normalize domains and path prefixes before sending the dry-run payload', async () => {
        const LinkGovernancePage = (await import('@/pages/admin/migrations/link-governance.vue')).default
        const wrapper = await mountSuspended(LinkGovernancePage, {
            global: {
                mocks: {
                    $t: translate,
                },
                stubs: createGlobalStubs(),
            },
        })

        await flushPromises()

        const viewModel = wrapper.vm as unknown as {
            executionForm: {
                domainsText: string
                pathPrefixesText: string
            }
            buildExecutionRequest: (mode: 'dry-run' | 'apply') => {
                filters: {
                    domains?: string[]
                    pathPrefixes?: string[]
                }
            }
        }

        viewModel.executionForm.domainsText = ' legacy.example.com,\nlegacy.example.com ,, cdn.example.com '
        viewModel.executionForm.pathPrefixesText = ' /assets\n/assets, /images '

        const request = viewModel.buildExecutionRequest('dry-run')

        expect(request).toMatchObject({
            filters: {
                domains: ['legacy.example.com', 'cdn.example.com'],
                pathPrefixes: ['/assets', '/images'],
            },
        })
    })
})
