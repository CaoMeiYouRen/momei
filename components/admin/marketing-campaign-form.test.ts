import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { h, onMounted, ref } from 'vue'
import { caomeiComponentStubs } from '../../tests/helpers/caomei-component-stubs'
import MarketingCampaignForm from './marketing-campaign-form.vue'

/**
 * `/admin/marketing` 推送表单（路由自有组件）的迁移契约用例。
 *
 * 覆盖：在册族控件（`Select` / `InputText` / `Button`）迁移后的 prop 语义、`id` 透传（`<label for>`
 * 关联依赖它）、以及**刻意保留 PrimeVue 的族**（`RadioButton` / `MultiSelect` / `DatePicker`，B3 / B4）。
 */

const { fetchMock, toastAdd } = vi.hoisted(() => ({
    fetchMock: vi.fn(),
    toastAdd: vi.fn(),
}))

vi.mock('ofetch', () => ({ $fetch: fetchMock }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: fetchMock }))

vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
    locale: ref('zh-CN'),
    locales: ref([{ code: 'zh-CN' }]),
}))
/* 自动导入的 `useToast` 走 `mockNuxtImport`（`vi.stubGlobal` 对 Nuxt 自动导入解析不生效）。 */
mockNuxtImport('useToast', () => () => ({ add: toastAdd }))

/* 保留族（RadioButton / MultiSelect / DatePicker）与懒加载编辑器用轻量桩：本用例只断言
 * 「这些未迁移族仍在原位」，不验其内部实现。 */
const retainedStubs = {
    // 编辑器桩需保持 `v-model` 语义（挂载时回写正文），否则保存路径的 `content` 恒为空、无法覆盖写请求。
    AdminMavonEditorClient: {
        props: ['modelValue', 'placeholder'],
        emits: ['update:modelValue'],
        setup(_, { emit }) {
            onMounted(() => emit('update:modelValue', '正文内容'))

            return () => h('div', { class: 'mavon-editor' })
        },
    },
    // 保留族桩需保持 `v-model` 双向语义，否则「切换到按条件定向」这一分支无法在用例内驱动。
    RadioButton: {
        template: '<input type="radio" class="p-radiobutton" :id="inputId" :checked="modelValue === value" @change="$emit(\'update:modelValue\', value)" />',
        props: ['modelValue', 'value', 'inputId', 'name'],
        emits: ['update:modelValue'],
    },
    MultiSelect: { template: '<div class="p-multiselect" />' },
    DatePicker: { template: '<div class="p-datepicker" />' },
}

const mountForm = async (props: Record<string, unknown> = {}) => {
    fetchMock.mockResolvedValue({ data: { items: [], total: 0 } })

    const wrapper = await mountSuspended(MarketingCampaignForm, {
        props,
        global: { stubs: { ...caomeiComponentStubs, ...retainedStubs } },
    })

    await flushPromises()

    return wrapper
}

describe('MarketingCampaignForm', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        toastAdd.mockReset()
    })

    it('类型选择：`Select` → `CaomeiSelect`，`fluid` 在 caomei 侧删除，`id` 透传以维持 `<label for>` 关联', async () => {
        const wrapper = await mountForm()
        const select = wrapper.find('.caomei-select')

        expect(select.exists()).toBe(true)
        expect(select.attributes('data-id')).toBe('type')
        // caomei 字段默认 `width: 100%`（§6.2「全宽」行），故 `fluid` 不应作为落到根元素上的未知属性残留。
        expect(select.attributes('fluid')).toBeUndefined()
        expect(wrapper.find('label[for="type"]').exists()).toBe(true)
    })

    it('标题输入：`InputText` → `CaomeiInput`，同样保留 `id` 与删除 `fluid`', async () => {
        const wrapper = await mountForm()
        const input = wrapper.find('.caomei-input')

        expect(input.exists()).toBe(true)
        expect(input.attributes('data-id')).toBe('title')
        expect(input.attributes('fluid')).toBeUndefined()
        expect(wrapper.find('label[for="title"]').exists()).toBe(true)
    })

    it('刻意保留 PrimeVue 的族仍在原位（RadioButton ×2 / MultiSelect ×2 / DatePicker ×1，属 B3 / B4）', async () => {
        const wrapper = await mountForm()

        expect(wrapper.findAll('.p-radiobutton')).toHaveLength(2)
        expect(wrapper.findAll('.p-datepicker')).toHaveLength(1)
        // MultiSelect 仅在选择「按条件定向」后渲染（迁移前后一致的 `v-if`）。
        expect(wrapper.findAll('.p-multiselect')).toHaveLength(0)

        // 迁移前后的 `v-if="targetType === 'criteria'"`：切到「按条件定向」后两个 MultiSelect 才渲染。
        await wrapper.findAll('input[type="radio"]')[1]?.setValue()
        await flushPromises()

        expect(wrapper.findAll('.p-multiselect')).toHaveLength(2)
    })

    it('动作按钮：`outlined + severity` → `variant="secondary"` + `tone`；实底保存按钮沿用 caomei 默认 `primary`', async () => {
        const wrapper = await mountForm()
        const buttons = wrapper.findAll('.caomei-button')

        expect(buttons).toHaveLength(3)
        expect(buttons.map((button) => [button.attributes('data-variant'), button.attributes('data-tone')])).toEqual([
            ['secondary', 'primary'],
            ['secondary', 'neutral'],
            ['', ''],
        ])
    })

    it('动作按钮：可见文案落默认插槽（`CaomeiButton` 的 `label` 只映射 aria-label）', async () => {
        const wrapper = await mountForm()
        const { $t } = wrapper.vm as unknown as { $t: (key: string) => string }
        const texts = wrapper.findAll('.caomei-button').map((button) => button.text())

        expect(texts).toEqual([
            $t('pages.admin.marketing.form.send_test'),
            $t('common.cancel'),
            $t('common.save'),
        ])
    })

    it('发送测试按钮：`icon="pi pi-send"` → `#icon` 插槽内 lucide 图标', async () => {
        const wrapper = await mountForm()
        const sendTest = wrapper.findAll('.caomei-button')[0]

        expect(sendTest?.find('svg').exists()).toBe(true)
        expect(sendTest?.attributes('data-loading')).toBe('false')
    })

    it('挂载时并行加载分类与标签（迁移不改变依赖加载契约）', async () => {
        await mountForm()

        expect(fetchMock).toHaveBeenCalledWith('/api/categories', { query: { limit: 500, aggregate: true, language: 'zh-CN' } })
        expect(fetchMock).toHaveBeenCalledWith('/api/tags', { query: { limit: 500, aggregate: true, language: 'zh-CN' } })
    })

    it('保存：标题为空时早返回（不发写请求，仅提示校验失败）', async () => {
        const wrapper = await mountForm()
        fetchMock.mockClear()

        await wrapper.findAll('.caomei-button')[2]?.trigger('click')
        await flushPromises()

        // 标题空 → `handleSave` 的早返回分支：不应发出任何写请求。
        expect(fetchMock).not.toHaveBeenCalledWith('/api/admin/marketing/campaigns', expect.objectContaining({ method: 'POST' }))
        expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }))
    })

    it('保存：填写标题后 POST 创建，payload 含类型 / 标题 / 正文 / 目标条件 / 排期', async () => {
        const wrapper = await mountForm()
        fetchMock.mockClear()

        await wrapper.find('.caomei-input input').setValue('新推送')
        await wrapper.findAll('.caomei-button')[2]?.trigger('click')
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/marketing/campaigns', {
            method: 'POST',
            body: {
                type: 'FEATURE',
                title: '新推送',
                content: '正文内容',
                targetCriteria: {},
                scheduledAt: null,
            },
        })
        expect(wrapper.emitted('save')).toBeTruthy()
    })

    it('保存：编辑态走 PUT 到带 id 的地址', async () => {
        fetchMock.mockImplementation((url: string) => {
            if (url === '/api/admin/marketing/campaigns/c-1') {
                return Promise.resolve({
                    data: {
                        id: 'c-1',
                        type: 'FEATURE',
                        title: '回显标题',
                        content: '正文',
                        scheduledAt: null,
                        targetCriteria: { categoryIds: [], tagIds: [] },
                    },
                })
            }

            return Promise.resolve({ data: { items: [], total: 0 } })
        })

        const wrapper = await mountSuspended(MarketingCampaignForm, {
            props: { campaignId: 'c-1' },
            global: { stubs: { ...caomeiComponentStubs, ...retainedStubs } },
        })
        await flushPromises()
        fetchMock.mockClear()

        await wrapper.findAll('.caomei-button')[2]?.trigger('click')
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/marketing/campaigns/c-1', expect.objectContaining({ method: 'PUT' }))
    })

    it('回显：传入 `campaignId` 时请求详情并填充标题', async () => {
        fetchMock.mockImplementation((url: string) => {
            if (url === '/api/admin/marketing/campaigns/c-1') {
                return Promise.resolve({
                    data: {
                        id: 'c-1',
                        type: 'FEATURE',
                        title: '回显标题',
                        content: '正文',
                        scheduledAt: null,
                        targetCriteria: { categoryIds: [], tagIds: [] },
                    },
                })
            }

            return Promise.resolve({ data: { items: [], total: 0 } })
        })

        const wrapper = await mountSuspended(MarketingCampaignForm, {
            props: { campaignId: 'c-1' },
            global: { stubs: { ...caomeiComponentStubs, ...retainedStubs } },
        })

        await flushPromises()

        expect((wrapper.find('.caomei-input input').element as HTMLInputElement).value).toBe('回显标题')
    })
})
