import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createLegacyToastApi } from '@/tests/helpers/caomei-service-mocks'
import { settleUi } from '@/tests/helpers/ui-interaction'
import type { SettingAuditItem } from '@/types/setting'

const { appFetchMock, toastAddMock } = vi.hoisted(() => ({
    appFetchMock: vi.fn(),
    toastAddMock: vi.fn(),
}))

const translations: Record<string, string> = {
    'pages.admin.settings.system.audit_logs.sources.admin': '管理后台',
    'pages.admin.settings.system.audit_logs.reasons.manual': '手动调整',
    'pages.admin.settings.system.audit_logs.actions.create': '创建',
    'pages.admin.settings.system.audit_logs.actions.update': '更新',
}

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => translations[key] ?? key,
}))

mockNuxtImport('useAppApi', () => () => ({
    $appFetch: appFetchMock,
}))

mockNuxtImport('useI18nDate', () => () => ({
    formatDateTime: (value: string) => `formatted:${value}`,
}))

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()

    return {
        ...actual,
        useToast: () => createLegacyToastApi(toastAddMock),
    }
})

const CaomeiDataTableStub = {
    props: {
        data: Array,
        columns: Array,
        loading: Boolean,
        paginator: Boolean,
        lazy: Boolean,
        rows: Number,
        totalRecords: Number,
    },
    emits: ['page'],
    template: `
        <div class="table-stub">
            <div v-for="row in data" :key="row.id" class="row-stub" :data-key="row.settingKey">
                <span class="cell-time"><slot name="cell-time" :row="row" /></span>
                <span class="cell-action"><slot name="cell-action" :row="row" /></span>
                <span class="cell-old-value"><slot name="cell-oldValue" :row="row" /></span>
                <span class="cell-new-value"><slot name="cell-newValue" :row="row" /></span>
                <span class="cell-effective-source"><slot name="cell-effectiveSource" :row="row" /></span>
                <span class="cell-operator"><slot name="cell-operator" :row="row" /></span>
                <span class="cell-source"><slot name="cell-source" :row="row" /></span>
                <span class="cell-reason"><slot name="cell-reason" :row="row" /></span>
            </div>
            <div v-if="!data.length" class="empty-stub"><slot name="empty" /></div>
            <button class="next-page" type="button" @click="$emit('page', { page: 2, rows: 20 })">next</button>
        </div>
    `,
}

const stubs = {
    CaomeiButton: {
        props: ['label', 'variant'],
        template: '<button class="refresh-button" type="button" @click="$emit(\'click\')"><slot name="icon" /><slot /></button>',
    },
    CaomeiTag: {
        props: ['tone'],
        template: '<span class="tag-stub" :data-tone="tone"><slot /></span>',
    },
    CaomeiDataTable: CaomeiDataTableStub,
}

const baseItem: SettingAuditItem = {
    id: 'audit-1',
    settingKey: 'site_title',
    action: 'create',
    oldValue: null,
    newValue: '墨梅',
    maskType: 'none',
    effectiveSource: 'db',
    isOverriddenByEnv: false,
    source: 'admin',
    reason: 'manual',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    createdAt: '2026-11-26T10:00:00.000Z',
    operator: { id: 'user-1', name: 'Admin', email: 'admin@example.com' } as SettingAuditItem['operator'],
}

const envItem: SettingAuditItem = {
    ...baseItem,
    id: 'audit-2',
    settingKey: 'site_description',
    action: 'update',
    oldValue: '',
    newValue: '描述',
    effectiveSource: 'env',
    isOverriddenByEnv: true,
    source: 'unknown-source',
    reason: null,
    operator: { id: 'user-2', name: '', email: 'editor@example.com' } as SettingAuditItem['operator'],
}

const anonymousItem: SettingAuditItem = {
    ...baseItem,
    id: 'audit-3',
    settingKey: 'site_keywords',
    action: 'update',
    oldValue: 'old',
    newValue: null,
    operator: null,
} as SettingAuditItem

async function mountComponent() {
    const { default: SettingAuditLogList } = await import('./setting-audit-log-list.vue')

    const wrapper = await mountSuspended(SettingAuditLogList, {
        global: {
            stubs,
            mocks: {
                $t: (key: string) => translations[key] ?? key,
            },
        },
    })
    await settleUi()

    return wrapper
}

describe('SettingAuditLogList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        appFetchMock.mockResolvedValue({
            code: 200,
            data: {
                items: [baseItem, envItem, anonymousItem],
                total: 3,
                page: 1,
                limit: 10,
                totalPages: 1,
                demoPreview: true,
            },
        })
    })

    it('loads audit logs on mount and renders every cell variant', async () => {
        const wrapper = await mountComponent()

        expect(appFetchMock).toHaveBeenCalledWith('/api/admin/settings/audit-logs', {
            query: { page: 1, limit: 10 },
        })

        const rows = wrapper.findAll('.row-stub')
        expect(rows).toHaveLength(3)

        // 第一行：create / null 旧值 / db 来源 / 具名操作者
        expect(rows[0]?.find('.cell-time').text()).toBe('formatted:2026-11-26T10:00:00.000Z')
        expect(rows[0]?.find('.cell-action').text()).toBe('创建')
        expect(rows[0]?.find('.cell-old-value').text()).toBe('pages.admin.settings.system.audit_logs.value_states.unset')
        expect(rows[0]?.find('.cell-new-value').text()).toBe('墨梅')
        expect(rows[0]?.find('.cell-effective-source .tag-stub').attributes('data-tone')).toBe('success')
        expect(rows[0]?.find('.cell-operator').text()).toContain('Admin')
        expect(rows[0]?.find('.cell-operator').text()).toContain('admin@example.com')
        expect(rows[0]?.find('.cell-source').text()).toBe('管理后台')
        expect(rows[0]?.find('.cell-reason').text()).toBe('手动调整')

        // 第二行：update / 空字符串旧值 / env 来源覆盖 / 未翻译来源与空原因
        expect(rows[1]?.find('.cell-action').text()).toBe('更新')
        expect(rows[1]?.find('.cell-old-value').text()).toBe('pages.admin.settings.system.audit_logs.value_states.empty_string')
        expect(rows[1]?.find('.cell-effective-source .tag-stub').attributes('data-tone')).toBe('warning')
        expect(rows[1]?.find('.cell-effective-source').text()).toContain('pages.admin.settings.system.audit_logs.overridden_by_env')
        expect(rows[1]?.find('.cell-operator').text()).toContain('editor@example.com')
        expect(rows[1]?.find('.cell-source').text()).toBe('unknown-source')
        expect(rows[1]?.find('.cell-reason').text()).toBe('pages.admin.settings.system.audit_logs.value_states.unset')

        // 第三行：无操作者 / null 新值
        expect(rows[2]?.find('.cell-operator').text()).toBe('-')
        expect(rows[2]?.find('.cell-new-value').text()).toBe('pages.admin.settings.system.audit_logs.value_states.unset')

        expect(wrapper.find('.setting-audit-log-list__demo-note').exists()).toBe(true)
        const table = wrapper.findComponent(CaomeiDataTableStub)
        expect(table.props('totalRecords')).toBe(3)
        expect(table.props('rows')).toBe(10)
        expect(table.props('paginator')).toBe(true)
        expect(table.props('lazy')).toBe(true)
    })

    it('reloads when the refresh button is clicked', async () => {
        const wrapper = await mountComponent()
        appFetchMock.mockClear()

        await wrapper.find('.refresh-button').trigger('click')
        await settleUi()

        expect(appFetchMock).toHaveBeenCalledWith('/api/admin/settings/audit-logs', {
            query: { page: 1, limit: 10 },
        })
    })

    it('updates page state and reloads when the table emits a page event', async () => {
        const wrapper = await mountComponent()
        appFetchMock.mockClear()

        await wrapper.find('.next-page').trigger('click')
        await settleUi()

        expect(appFetchMock).toHaveBeenCalledWith('/api/admin/settings/audit-logs', {
            query: { page: 2, limit: 20 },
        })
    })

    it('renders the empty state when no logs are returned', async () => {
        appFetchMock.mockResolvedValue({
            code: 200,
            data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 },
        })

        const wrapper = await mountComponent()

        expect(wrapper.findAll('.row-stub')).toHaveLength(0)
        expect(wrapper.find('.empty-stub').text()).toBe('pages.admin.settings.system.audit_logs.empty')
        expect(wrapper.find('.setting-audit-log-list__demo-note').exists()).toBe(false)
    })

    it('falls back to an empty list when the payload omits items and total', async () => {
        appFetchMock.mockResolvedValue({ code: 200, data: {} })

        const wrapper = await mountComponent()

        expect(wrapper.findAll('.row-stub')).toHaveLength(0)
        expect(wrapper.find('.table-stub').exists()).toBe(true)
    })

    it('shows a danger toast when loading fails', async () => {
        const error = new Error('boom') as Error & { data?: { message?: string } }
        error.data = { message: '审计日志加载失败' }
        appFetchMock.mockRejectedValue(error)

        const wrapper = await mountComponent()

        expect(toastAddMock).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            detail: '审计日志加载失败',
        }))
        expect(wrapper.findAll('.row-stub')).toHaveLength(0)
    })

    it('exposes refresh through defineExpose', async () => {
        const wrapper = await mountComponent()
        appFetchMock.mockClear()

        await (wrapper.vm as unknown as { refresh: () => Promise<void> }).refresh()
        await settleUi()

        expect(appFetchMock).toHaveBeenCalledTimes(1)
    })
})
