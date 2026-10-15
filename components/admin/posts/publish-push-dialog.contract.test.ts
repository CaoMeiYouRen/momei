import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import PublishPushDialog from './publish-push-dialog.vue'
import PublishPushDialogV2 from './publish-push-dialog-v2.vue'

/**
 * 发布确认浮层：**两版契约等价**测试（V1 与 V2 跑同一套行为断言）。
 *
 * 为什么要「同一套断言跑两版」：
 * - 本族的择库方式是**消费处静态择库**（见 `publish-push-dialog-v2.vue` 注释）——B2 目标路由 `/admin/posts`
 *   在自身迁移批次直接用 V2，编辑器 `/admin/posts/[id]` 继续用 V1（本批只交付壳）。因此「V2 与 V1 行为一致」是**可替换性的前提**，
 *   而不是实现细节；把它写成同一套断言，替换失误（少传一个 prop、少转发一个事件、`open()` 语义漂移）
 *   会同时打到两版之一。
 * - V1 在本次重构中把状态搬入共享 composable（`usePublishPushDialog`），此前**没有直接单测**；
 *   本文件同时补齐 V1 的覆盖。
 *
 * 差异只在模板层（组件来源与按钮文案承载方式），故按钮定位按「`label` 属性或可见文本」双通道匹配。
 */

const DialogStub = defineComponent({
    name: 'Dialog',
    props: {
        visible: { type: Boolean, default: false },
        header: { type: String, default: '' },
        modal: { type: Boolean, default: false },
        style: { type: Object, default: () => ({}) },
    },
    emits: ['update:visible'],
    setup(props, { slots }) {
        return () => props.visible
            ? h('div', {
                class: 'dialog',
                'data-header': props.header,
                'data-width': String(props.style.width ?? ''),
                'data-modal': String(props.modal),
            }, [slots.default?.(), h('div', { class: 'dialog-footer' }, slots.footer?.())])
            : null
    },
})

const RadioButtonStub = defineComponent({
    name: 'RadioButton',
    props: {
        modelValue: { type: [String, null], default: null },
        value: { type: [String, null], default: null },
        inputId: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('input', {
            class: 'radio',
            type: 'radio',
            'data-input-id': props.inputId,
            checked: props.modelValue === props.value,
            onChange: () => emit('update:modelValue', props.value),
        })
    },
})

const DatePickerStub = defineComponent({
    name: 'DatePicker',
    props: { modelValue: { type: [Date, null], default: null } },
    emits: ['update:modelValue'],
    setup: () => () => h('div', { class: 'datepicker' }),
})

/** PrimeVue `Button` stub：`label` 映射到 `data-label`（可见文案由组件内部渲染）。 */
const ButtonStub = defineComponent({
    name: 'Button',
    props: { label: { type: String, default: '' }, loading: { type: Boolean, default: false } },
    emits: ['click'],
    setup(props, { emit }) {
        return () => h('button', {
            class: 'p-button',
            type: 'button',
            'data-label': props.label,
            'data-loading': String(props.loading),
            onClick: () => {
                if (!props.loading) {
                    emit('click')
                }
            },
        })
    },
})

/** caomei `Button` stub：可见文案落默认插槽。 */
const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: { label: { type: String, default: '' }, loading: { type: Boolean, default: false } },
    emits: ['click'],
    setup(props, { emit, slots }) {
        return () => h('button', {
            class: 'caomei-button',
            type: 'button',
            'data-label': props.label,
            'data-loading': String(props.loading),
            onClick: () => {
                if (!props.loading) {
                    emit('click')
                }
            },
        }, [slots.default?.()])
    },
})

const stubs = {
    Dialog: DialogStub,
    RadioButton: RadioButtonStub,
    DatePicker: DatePickerStub,
    Button: ButtonStub,
    CaomeiButton: CaomeiButtonStub,
}

const variants = [
    { label: 'V1（PrimeVue）', component: PublishPushDialog },
    { label: 'V2（caomei-ui）', component: PublishPushDialogV2 },
] as const

type Wrapper = Awaited<ReturnType<typeof mountDialog>>

async function mountDialog(component: (typeof variants)[number]['component']) {
    const wrapper = await mountSuspended(component, {
        props: { visible: true },
        global: { stubs },
    })
    await nextTick()

    return wrapper
}

/** 按「`label` 属性或可见文本」双通道定位页脚按钮（两版承载方式不同）。 */
function findFooterButton(wrapper: Wrapper, text: string) {
    const found = wrapper.findAll('.dialog-footer button').find(
        (button) => button.attributes('data-label') === text || button.text() === text,
    )

    if (!found) {
        const available = wrapper.findAll('.dialog-footer button')
            .map((button) => `"${button.text()}"(label=${button.attributes('data-label') ?? '-'})`)
            .join(', ')
        throw new Error(`未找到页脚按钮「${text}」；当前：${available || '(无)'}`)
    }

    return found
}

function exposed(wrapper: Wrapper) {
    return wrapper.vm as unknown as { open: (options?: unknown) => void }
}

describe.each(variants)('发布确认浮层契约（$label）', ({ component }) => {
    it('open() 置可见并按入参回填选项', async () => {
        // 以 `visible: false` 挂载，才能观察到 `open()` 引发的可见性变化
        const wrapper = await mountSuspended(component, {
            props: { visible: false },
            global: { stubs },
        })
        await nextTick()

        exposed(wrapper).open({ pushOption: 'now', criteria: { categoryIds: ['c1'] } })
        await nextTick()

        expect(wrapper.emitted('update:visible')?.[0]).toEqual([true])

        await findFooterButton(wrapper, '确认发布').trigger('click')

        const payload = wrapper.emitted('confirm')?.[0]?.[0] as { pushOption: string, pushCriteria: unknown, publishedAt: unknown }
        expect(payload.pushOption).toBe('now')
        expect(payload.pushCriteria).toEqual({ categoryIds: ['c1'] })
        expect(payload.publishedAt).toBeInstanceOf(Date)
    })

    it('open() 缺省入参回到「不推送 + 当前时间」', async () => {
        const wrapper = await mountDialog(component)

        exposed(wrapper).open()
        await nextTick()
        await findFooterButton(wrapper, '确认发布').trigger('click')

        const payload = wrapper.emitted('confirm')?.[0]?.[0] as { pushOption: string, publishedAt: Date }
        expect(payload.pushOption).toBe('none')
        expect(payload.publishedAt).toBeInstanceOf(Date)
    })

    it('非法日期回退为当前时间而非 NaN 日期', async () => {
        const wrapper = await mountDialog(component)

        exposed(wrapper).open({ publishedAt: 'not-a-date' })
        await nextTick()
        await findFooterButton(wrapper, '确认发布').trigger('click')

        const payload = wrapper.emitted('confirm')?.[0]?.[0] as { publishedAt: Date }
        expect(payload.publishedAt).toBeInstanceOf(Date)
        expect(Number.isNaN(payload.publishedAt.getTime())).toBe(false)
    })

    it('目标切到「全部用户」时载荷不带圈选条件', async () => {
        const wrapper = await mountDialog(component)

        exposed(wrapper).open({ pushOption: 'draft', criteria: { tagIds: ['t1'] } })
        await nextTick()

        const targetAll = wrapper.findAll('.radio').find((radio) => radio.attributes('data-input-id') === 'target_all')
        expect(targetAll).toBeTruthy()
        await targetAll!.trigger('change')
        await nextTick()

        await findFooterButton(wrapper, '确认发布').trigger('click')

        const payload = wrapper.emitted('confirm')?.[0]?.[0] as { pushCriteria: unknown }
        expect(payload.pushCriteria).toEqual({})
    })

    it('取消按钮关闭浮层', async () => {
        const wrapper = await mountDialog(component)

        await findFooterButton(wrapper, '取消').trigger('click')
        await nextTick()

        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    })

    it('loading 时确认按钮不派发 confirm', async () => {
        const wrapper = await mountSuspended(component, {
            props: { visible: true, loading: true },
            global: { stubs },
        })
        await nextTick()

        const confirm = findFooterButton(wrapper, '确认发布')
        expect(confirm.attributes('data-loading')).toBe('true')

        await confirm.trigger('click')
        expect(wrapper.emitted('confirm')).toBeUndefined()
    })

    it('浮层标题与宽度、三档推送选项 input-id 集合一致', async () => {
        const wrapper = await mountDialog(component)

        // 浮层标题 / 宽度 / 模态与 V1 完全一致（同一 i18n 键与同一 `35rem` 宽度）
        const dialog = wrapper.find('.dialog')
        expect(dialog.attributes('data-header')).toBe('pages.admin.posts.publish_confirm_title')
        expect(dialog.attributes('data-width')).toBe('35rem')
        expect(dialog.attributes('data-modal')).toBe('true')

        expect(
            wrapper.findAll('.radio').map((radio) => radio.attributes('data-input-id')),
        ).toEqual(['push_none', 'push_draft', 'push_now'])

        exposed(wrapper).open({ pushOption: 'draft' })
        await nextTick()
        expect(
            wrapper.findAll('.radio').map((radio) => radio.attributes('data-input-id')),
        ).toEqual(['push_none', 'push_draft', 'push_now', 'target_all', 'target_criteria'])
    })

    it('按条件圈选时显示 criteria 提示文案', async () => {
        const wrapper = await mountDialog(component)

        exposed(wrapper).open({ pushOption: 'draft' })
        await nextTick()

        expect(wrapper.find('.publish-dialog__criteria-hint').text()).toBe('pages.admin.posts.push_criteria_hint')
    })

    it('「不推送」时不显示目标选择区', async () => {
        const wrapper = await mountDialog(component)

        expect(wrapper.find('.publish-dialog__target-selection').exists()).toBe(false)

        exposed(wrapper).open({ pushOption: 'now' })
        await nextTick()
        expect(wrapper.find('.publish-dialog__target-selection').exists()).toBe(true)
    })
})
