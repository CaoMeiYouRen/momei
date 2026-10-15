import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import PublishPushDialogV2 from './publish-push-dialog-v2.vue'

/**
 * 过渡组件 `PublishPushDialogV2`（caomei-ui 版）的单元契约。
 *
 * 本族采用**消费处静态择库**（见组件内注释）。状态与语义（`open()` 回填、日期容错、
 * `confirm` 载荷形状）与 V1 共用 `usePublishPushDialog`，本文件同时锁住这三点，
 * 避免「第二份 `open()` 语义」在后续维护中漂移。
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
            ? h('div', { class: 'p-dialog', 'data-header': props.header, 'data-width': String(props.style.width) }, [
                h('div', { class: 'p-dialog-content' }, slots.default?.()),
                h('div', { class: 'p-dialog-footer' }, slots.footer?.()),
            ])
            : null
    },
})

const RadioButtonStub = defineComponent({
    name: 'RadioButton',
    props: {
        modelValue: { type: [String, null], default: null },
        value: { type: [String, null], default: null },
        inputId: { type: String, default: '' },
        name: { type: String, default: '' },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('input', {
            class: 'p-radiobutton',
            type: 'radio',
            'data-input-id': props.inputId,
            'data-name': props.name,
            checked: props.modelValue === props.value,
            onChange: () => emit('update:modelValue', props.value),
        })
    },
})

const DatePickerStub = defineComponent({
    name: 'DatePicker',
    props: { modelValue: { type: [Date, null], default: null }, fluid: { type: Boolean, default: false } },
    emits: ['update:modelValue'],
    setup: () => () => h('div', { class: 'p-datepicker' }),
})

const CaomeiButtonStub = defineComponent({
    name: 'CaomeiButton',
    props: {
        label: { type: String, default: '' },
        variant: { type: String, default: '' },
        tone: { type: String, default: '' },
        loading: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
        return () => h('button', {
            class: 'caomei-button',
            type: 'button',
            'data-label': props.label,
            'data-variant': props.variant,
            'data-tone': props.tone,
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
    CaomeiButton: CaomeiButtonStub,
}

async function mountDialog(props: Record<string, unknown> = {}) {
    const wrapper = await mountSuspended(PublishPushDialogV2, {
        props: { visible: true, ...props },
        global: { stubs },
    })
    await nextTick()

    return wrapper
}

describe('PublishPushDialogV2', () => {
    it('浮层壳与表单控件保持 PrimeVue（不在本批在册族）', async () => {
        const wrapper = await mountDialog()

        expect(wrapper.find('.p-dialog').exists()).toBe(true)
        expect(wrapper.find('.p-dialog').attributes('data-width')).toBe('35rem')
        expect(wrapper.find('.p-datepicker').exists()).toBe(true)
        // 推送选项 3 个；目标选择区在「不推送」时隐藏（V1 口径），故初始仅 3 个
        expect(wrapper.findAll('.p-radiobutton')).toHaveLength(3)

        ;(wrapper.vm as unknown as { open: (options?: unknown) => void }).open({ pushOption: 'now' })
        await nextTick()
        expect(wrapper.findAll('.p-radiobutton')).toHaveLength(5)
    })

    it('页脚按钮：可见文案落默认插槽，变体为 ghost / tone=neutral', async () => {
        const wrapper = await mountDialog()
        const [cancel, confirm] = wrapper.findAll('.caomei-button')

        expect(cancel!.attributes('data-label')).toBe('')
        expect(cancel!.attributes('data-variant')).toBe('ghost')
        expect(cancel!.text()).toBe('取消')

        expect(confirm!.attributes('data-label')).toBe('')
        // V1 的 `severity="contrast"` → caomei `tone="neutral"`（§6.2 有损近似）
        expect(confirm!.attributes('data-tone')).toBe('neutral')
    })

    it('取消按钮关闭浮层', async () => {
        const wrapper = await mountDialog()
        const [cancel] = wrapper.findAll('.caomei-button')

        await cancel!.trigger('click')
        await nextTick()

        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    })

    it('确认按钮派发 confirm，默认按「条件圈选」并回传初始条件', async () => {
        const wrapper = await mountDialog()
        const criteria = { categoryIds: ['c1'], tagIds: ['t1'] }

        ;(wrapper.vm as unknown as { open: (options?: unknown) => void }).open({ pushOption: 'now', criteria })
        await nextTick()

        const [, confirm] = wrapper.findAll('.caomei-button')
        await confirm!.trigger('click')

        const payload = wrapper.emitted('confirm')?.[0]?.[0] as {
            pushOption: string
            pushCriteria: unknown
            publishedAt: unknown
        }
        expect(payload.pushOption).toBe('now')
        expect(payload.pushCriteria).toEqual(criteria)
        expect(payload.publishedAt).toBeInstanceOf(Date)
    })

    it('目标切到「全部用户」时 confirm 载荷不带圈选条件', async () => {
        const wrapper = await mountDialog()
        ;(wrapper.vm as unknown as { open: (options?: unknown) => void }).open({
            pushOption: 'now',
            criteria: { categoryIds: ['c1'] },
        })
        await nextTick()

        const targetAll = wrapper.findAll('.p-radiobutton').find(
            (radio) => radio.attributes('data-input-id') === 'target_all',
        )
        expect(targetAll).toBeTruthy()
        await targetAll!.trigger('change')
        await nextTick()

        const [, confirm] = wrapper.findAll('.caomei-button')
        await confirm!.trigger('click')

        const payload = wrapper.emitted('confirm')?.[0]?.[0] as { pushCriteria: unknown }
        expect(payload.pushCriteria).toEqual({})
    })

    it('open() 回填状态并置可见；非法日期回退为当前时间而非 null', async () => {
        const wrapper = await mountDialog({ visible: false })

        const exposed = wrapper.vm as unknown as { open: (options?: unknown) => void }
        exposed.open({ pushOption: 'draft', publishedAt: 'not-a-date' })
        await nextTick()

        expect(wrapper.emitted('update:visible')?.[0]).toEqual([true])

        const [confirm] = wrapper.findAll('.caomei-button').slice(-1)
        await confirm!.trigger('click')
        const payload = wrapper.emitted('confirm')?.[0]?.[0] as { pushOption: string, publishedAt: Date }
        expect(payload.pushOption).toBe('draft')
        expect(payload.publishedAt).toBeInstanceOf(Date)
        expect(Number.isNaN(payload.publishedAt.getTime())).toBe(false)
    })

    it('open() 缺省参数时回到「不推送」并补当前时间', async () => {
        const wrapper = await mountDialog({ visible: false })

        ;(wrapper.vm as unknown as { open: (options?: unknown) => void }).open()
        await nextTick()

        const [confirm] = wrapper.findAll('.caomei-button').slice(-1)
        await confirm!.trigger('click')

        const payload = wrapper.emitted('confirm')?.[0]?.[0] as { pushOption: string, publishedAt: Date }
        expect(payload.pushOption).toBe('none')
        expect(payload.publishedAt).toBeInstanceOf(Date)
    })

    it('loading 时确认按钮进入 loading 且不派发 confirm', async () => {
        const wrapper = await mountDialog({ loading: true })
        const [, confirm] = wrapper.findAll('.caomei-button')

        expect(confirm!.attributes('data-loading')).toBe('true')
        await confirm!.trigger('click')

        expect(wrapper.emitted('confirm')).toBeUndefined()
    })

    it('非 none 选项才显示目标选择区（V1 口径）', async () => {
        const wrapper = await mountDialog()

        expect(wrapper.find('.publish-dialog__target-selection').exists()).toBe(false)

        ;(wrapper.vm as unknown as { open: (options?: unknown) => void }).open({ pushOption: 'draft' })
        await nextTick()

        expect(wrapper.find('.publish-dialog__target-selection').exists()).toBe(true)
    })
})
