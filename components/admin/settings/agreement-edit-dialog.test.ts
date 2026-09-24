import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import AgreementEditDialog from '@/components/admin/settings/agreement-edit-dialog.vue'

/**
 * 视觉验证回归「单元层」基线（迁移方案 §8.2 第 ① 层）：浮层目标组件结构契约。
 *
 * 该组件是截图层「浮层」目标（`/admin/settings` → 协议管理 → 新增）的渲染载体。
 * 断言只覆盖**迁移无关的结构 / 行为契约**（对话框角色、label 与控件 id 绑定、
 * `update:formData` 与 `save` 事件），不绑定 PrimeVue 内部类名，
 * 确保迁移到 caomei-ui 后同型断言仍应通过。
 */

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string) => key,
            locale: ref('zh-CN'),
        }),
    }
})

const baseFormData = {
    language: 'zh-CN',
    version: '2026.01',
    versionDescription: '说明',
    content: '# 内容',
    sourceAgreementId: null,
}

function mountDialog(overrides: Record<string, unknown> = {}) {
    return mountSuspended(AgreementEditDialog, {
        props: {
            visible: true,
            isEditMode: false,
            formData: baseFormData,
            languageOptions: [{ label: '简体中文', value: 'zh-CN' }],
            currentAuthoritativeOptions: [],
            isReferenceLanguage: true,
            generatingAIDraft: false,
            saving: false,
            localeCode: 'zh-CN',
            ...overrides,
        },
        global: {
            // Dialog 默认 teleport 到 body；内联渲染以便在 wrapper 内断言结构
            stubs: { teleport: true },
        },
    })
}

describe('agreement-edit-dialog 结构契约（视觉回归单元层基线）', () => {
    it('渲染对话框，且字段 label[for] 与控件 id 绑定成立', async () => {
        const wrapper = await mountDialog()

        expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

        // 迁移无关的可访问性契约：label 的 for 与控件 id 一一对应
        for (const id of ['language', 'version', 'versionDescription', 'sourceAgreementId']) {
            expect(wrapper.find(`label[for="${id}"]`).exists()).toBe(true)
            expect(wrapper.find(`#${id}`).exists()).toBe(true)
        }
        // 协议内容字段的标签存在（编辑器本体在 ClientOnly 内，不在断言范围）
        expect(wrapper.find('label[for="content"]').exists()).toBe(true)
    })

    it('编辑态与创建态渲染不同（模式契约）', async () => {
        const create = await mountDialog()
        const edit = await mountDialog({ isEditMode: true })

        const createText = create.find('[role="dialog"]').text()
        const editText = edit.find('[role="dialog"]').text()

        expect(createText.length).toBeGreaterThan(0)
        expect(editText).not.toBe(createText)
    })

    it('字段变更经 v-model 契约发出 update:formData', async () => {
        const wrapper = await mountDialog()

        await wrapper.find('#version').setValue('2027.02')

        const emitted = wrapper.emitted('update:formData')
        expect(emitted).toBeTruthy()
        expect(emitted?.at(-1)?.[0]).toMatchObject({ version: '2027.02' })
    })

    it('保存按钮触发 save 事件', async () => {
        const wrapper = await mountDialog()

        // 保存为页脚最后一个动作按钮（footer 顺序：AI 草案 / 取消 / 保存）
        const buttons = wrapper.findAll('button')
        expect(buttons.length).toBeGreaterThanOrEqual(3)
        const saveButton = buttons.at(-1)
        expect(saveButton).toBeTruthy()
        await saveButton?.trigger('click')

        expect(wrapper.emitted('save')).toBeTruthy()
    })
})
