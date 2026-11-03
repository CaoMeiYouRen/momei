import { describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ThemeGalleryDialog from './theme-gallery-dialog.vue'

const { mockFetch } = vi.hoisted(() => ({
    mockFetch: vi.fn().mockResolvedValue({
        data: [
        {
            id: 'theme-1',
            name: '深海主题',
            description: '深色自定义方案',
            isActive: true,
            isSystem: false,
            previewImage: '',
        },
        {
            id: 'theme-2',
            name: '系统默认',
            description: '',
            isActive: false,
            isSystem: true,
            previewImage: '',
        },
        ],
    }),
}))

vi.mock('ofetch', () => ({ $fetch: mockFetch }))
vi.mock('#build/fetch.mjs', () => ({ $fetch: mockFetch }))

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<any>()
    return {
        ...actual,
        useToast: () => ({ show: vi.fn() }),
    }
})

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<any>()
    return {
        ...actual,
        useI18n: () => ({ t: (key: string) => key }),
    }
})

const stubs = {
    CaomeiDialog: {
        props: { open: Boolean },
        template: '<div v-if="open" class="dialog"><slot /></div>',
    },
    CaomeiDataView: {
        props: { value: { type: Array, default: () => [] }, layout: String },
        template: '<div class="data-view"><slot name="grid" :items="value" /></div>',
    },
    CaomeiCard: {
        template: '<div class="card"><slot name="header" /><slot /><slot name="footer" /></div>',
    },
    CaomeiTag: {
        template: '<span class="tag"><slot /></span>',
    },
    CaomeiButton: {
        props: ['label', 'disabled', 'iconOnly'],
        template: '<button class="card-button"><slot /></button>',
    },
    AppTooltip: {
        template: '<div><slot /></div>',
    },
}

/**
 * 主题画廊的结构契约。
 *
 * 该弹窗不在 parity / 基线层 / E2E 任一视觉门禁内，因此这里至少锁住「卡片必须渲染
 * 主题名与当前 / 系统标签」——`CaomeiCard` 的 `#header` 会整段替换默认头（含 title 槽），
 * 若把标题行放进 `#title` 会静默消失（2026-11-03 审计发现）。
 */
describe('ThemeGalleryDialog', () => {
    it('渲染主题名与状态标签（标题不得被 header 槽吞掉）', async () => {
        const wrapper = await mountSuspended(ThemeGalleryDialog, {
            props: { modelValue: false },
            global: { stubs },
        })

        /* 组件在 `modelValue` 变为 true 时才拉取列表（与真实页面的打开时序一致）。 */
        await wrapper.setProps({ modelValue: true })
        await flushPromises()

        expect(wrapper.text()).toContain('深海主题')
        expect(wrapper.text()).toContain('系统默认')
        // 两个标签：当前 / 系统
        expect(wrapper.findAll('.tag')).toHaveLength(2)
        // 卡片内的操作按钮：预览 / 应用 / 删除（系统主题无删除）→ 3 + 2 = 5
        expect(wrapper.findAll('.card-button')).toHaveLength(5)
    })
})
