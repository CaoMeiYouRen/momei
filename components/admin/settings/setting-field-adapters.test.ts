import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SettingInput from './setting-input.vue'
import SettingPassword from './setting-password.vue'
import SettingTextarea from './setting-textarea.vue'

const CaomeiInputStub = {
    props: { modelValue: { type: String, default: '' }, disabled: Boolean },
    emits: ['update:modelValue'],
    template: '<input class="field-stub" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}

const stubs = {
    CaomeiInput: CaomeiInputStub,
    CaomeiPassword: CaomeiInputStub,
    CaomeiTextarea: CaomeiInputStub,
}

/**
 * 设置字段适配层的边界契约。
 *
 * 背景（迁移方案 §6.2 执行提示 5）：caomei 字段组件的 `modelValue` 只接受 `string | undefined`，
 * 而设置项通用类型允许 `null`。适配层必须做到两件事，否则会出现「控件不可编辑」或
 * 「回写 null 后又变成空串」的隐蔽漂移：
 * 1. 读取：`null` / `undefined` / 数字一律归一为字符串（空串或十进制文本）；
 * 2. 回写：始终回写 `string`。
 */
const adapters = [
    ['SettingInput', SettingInput],
    ['SettingPassword', SettingPassword],
    ['SettingTextarea', SettingTextarea],
] as const

describe('设置字段适配层', () => {
    for (const [name, component] of adapters) {
        it(`${name} 把 null 归一为空串并回写 string`, async () => {
            const wrapper = await mountSuspended(component, {
                props: { modelValue: null },
                global: { stubs },
            })

            const field = wrapper.get('.field-stub')
            expect((field.element as HTMLInputElement).value).toBe('')

            await field.setValue('填充值')
            expect(wrapper.emitted('update:modelValue')).toEqual([['填充值']])
        })
    }

    it('透传 id / disabled 等原生属性', async () => {
        const wrapper = await mountSuspended(SettingInput, {
            props: { modelValue: null },
            attrs: { id: 'field-id', disabled: true },
            global: { stubs },
        })

        const field = wrapper.get('#field-id')
        expect((field.element as HTMLInputElement).disabled).toBe(true)
    })

    it('数字值按十进制文本渲染（不丢失可编辑性）', async () => {
        const wrapper = await mountSuspended(SettingInput, {
            props: { modelValue: 42 },
            global: { stubs },
        })

        expect((wrapper.get('.field-stub').element as HTMLInputElement).value).toBe('42')
    })

    it('空串回写仍是 string，不会回写 null', async () => {
        const wrapper = await mountSuspended(SettingInput, {
            props: { modelValue: '原值' },
            global: { stubs },
        })

        await wrapper.get('.field-stub').setValue('')
        const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0]

        expect(emitted).toBe('')
        expect(typeof emitted).toBe('string')
    })
})
