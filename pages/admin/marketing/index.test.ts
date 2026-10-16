import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import MarketingPage from './index.vue'

/**
 * `/admin/marketing` 页面用例：钉住「迁移后仍保留的接线」。
 *
 * 页面本体只有 1 处在册族（创建按钮），但它是列表与表单两个自有组件的宿主：统计卡片刷新、
 * 编辑时把 `campaignId` 传给表单、保存后刷新列表与统计——这些接线不随迁移改变，却很容易在
 * 迁移改动（模板重排）中被打断，故按调用点逐条加钉。
 */

const { fetchMock, listRefresh } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    listRefresh: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: fetchMock }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: fetchMock }))

vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }))

const listStub = defineComponent({
    name: 'MarketingCampaignList',
    emits: ['edit', 'changed'],
    setup(_, { expose, emit }) {
        expose({ refresh: listRefresh })

        return () => h('div', { class: 'marketing-list' }, [
            h('button', { class: 'emit-edit', onClick: () => emit('edit', 'c-9') }, 'edit'),
            h('button', { class: 'emit-changed', onClick: () => emit('changed') }, 'changed'),
        ])
    },
})

const formStub = defineComponent({
    name: 'MarketingCampaignForm',
    props: { campaignId: { type: String, default: null } },
    emits: ['save', 'cancel'],
    setup(props, { emit }) {
        return () => h('div', { class: 'marketing-form', 'data-campaign-id': props.campaignId ?? '' }, [
            h('button', { class: 'emit-save', onClick: () => emit('save') }, 'save'),
        ])
    },
})

const cardStub = defineComponent({
    name: 'Card',
    setup(_, { slots }) {
        return () => h('div', { class: 'p-card' }, slots.content?.())
    },
})

const dialogStub = defineComponent({
    name: 'Dialog',
    props: { visible: { type: Boolean, default: false }, header: { type: String, default: '' } },
    setup(props, { slots }) {
        return () => props.visible
            ? h('div', { class: 'p-dialog' }, [
                h('span', { class: 'p-dialog-title' }, props.header),
                slots.default?.(),
            ])
            : null
    },
})

const stubs = {
    AdminPageHeader: {
        template: '<div class="admin-header"><slot name="actions" /></div>',
        props: ['title'],
    },
    Card: cardStub as unknown as Record<string, unknown>,
    Dialog: dialogStub as unknown as Record<string, unknown>,
    MarketingCampaignList: listStub as unknown as Record<string, unknown>,
    MarketingCampaignForm: formStub as unknown as Record<string, unknown>,
}

const mountPage = async (stats: Record<string, number> = { totalSubscribers: 7, marketingSubscribers: 3, totalCampaigns: 2 }) => {
    fetchMock.mockResolvedValue({ data: stats })

    const wrapper = await mountSuspended(MarketingPage, { global: { stubs } })
    await flushPromises()

    return wrapper
}

describe('MarketingPage', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        listRefresh.mockReset()
    })

    it('创建按钮：`icon="pi pi-plus"` → `CaomeiButton` + `#icon` 插槽内 lucide；可见文案落默认插槽', async () => {
        const wrapper = await mountPage()
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }
        const button = wrapper.find('.admin-header .caomei-button')

        expect(button.exists()).toBe(true)
        expect(button.text()).toBe($t('pages.admin.marketing.create_btn'))
        expect(button.find('svg').exists()).toBe(true)
    })

    it('统计卡片：仍为 PrimeVue `Card`（B4 展示族），三张卡片的标签与取值来自 `/api/admin/marketing/stats`', async () => {
        const wrapper = await mountPage()
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/marketing/stats')
        expect(wrapper.findAll('.p-card')).toHaveLength(3)
        expect(wrapper.text()).toContain($t('pages.admin.marketing.stats.total_subscribers'))
        expect(wrapper.text()).toContain('7')
        expect(wrapper.text()).toContain('3')
        expect(wrapper.text()).toContain('2')
    })

    it('弹窗：仍为 PrimeVue `Dialog`（浮层豁免），创建态标题用 `create_campaign`', async () => {
        const wrapper = await mountPage()
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }

        expect(wrapper.find('.p-dialog').exists()).toBe(false)

        await wrapper.find('.admin-header .caomei-button').trigger('click')
        await flushPromises()

        expect(wrapper.find('.p-dialog-title').text()).toBe($t('pages.admin.marketing.create_campaign'))
        expect(wrapper.find('.marketing-form').attributes('data-campaign-id')).toBe('')
    })

    it('编辑接线：列表 `@edit` 把 campaignId 传进表单，标题切为 `edit_campaign`', async () => {
        const wrapper = await mountPage()
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }

        await wrapper.find('.emit-edit').trigger('click')
        await flushPromises()

        expect(wrapper.find('.marketing-form').attributes('data-campaign-id')).toBe('c-9')
        expect(wrapper.find('.p-dialog-title').text()).toBe($t('pages.admin.marketing.edit_campaign'))
    })

    it('保存接线：表单 `@save` 关闭弹窗、刷新列表并重取统计', async () => {
        const wrapper = await mountPage()
        fetchMock.mockClear()

        await wrapper.find('.emit-edit').trigger('click')
        await flushPromises()
        await wrapper.find('.emit-save').trigger('click')
        await flushPromises()

        expect(wrapper.find('.p-dialog').exists()).toBe(false)
        expect(listRefresh).toHaveBeenCalled()
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/marketing/stats')
    })

    it('编辑态复位：保存关闭弹窗后重开，标题与 `campaignId` 回到创建态', async () => {
        const wrapper = await mountPage()
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }

        await wrapper.find('.emit-edit').trigger('click')
        await flushPromises()
        expect(wrapper.find('.marketing-form').attributes('data-campaign-id')).toBe('c-9')

        await wrapper.find('.emit-save').trigger('click')
        await flushPromises()
        await wrapper.find('.admin-header .caomei-button').trigger('click')
        await flushPromises()

        expect(wrapper.find('.marketing-form').attributes('data-campaign-id')).toBe('')
        expect(wrapper.find('.p-dialog-title').text()).toBe($t('pages.admin.marketing.create_campaign'))
    })

    it('统计刷新接线：列表 `@changed` 触发统计重取', async () => {
        const wrapper = await mountPage()
        fetchMock.mockClear()

        await wrapper.find('.emit-changed').trigger('click')
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/marketing/stats')
    })
})
