import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ConfirmDeleteDialog from './confirm-delete-dialog.vue'

const DialogStub = defineComponent({
    props: {
        visible: { type: Boolean, default: false },
        header: { type: String, default: '' },
    },
    emits: ['update:visible'],
    setup(props, { slots }) {
        return () => props.visible
            ? h('div', { class: 'dialog-stub', 'data-header': props.header }, [
                slots.default?.(),
                h('div', { class: 'dialog-footer' }, slots.footer?.()),
            ])
            : null
    },
})

const ButtonStub = defineComponent({
    inheritAttrs: false,
    props: {
        label: { type: String, default: '' },
        loading: { type: Boolean, default: false },
    },
    emits: ['click'],
    template: '<button type="button" v-bind="$attrs" :label="label" :loading="loading" @click="$emit(\'click\')">{{ label }}</button>',
})

describe('ConfirmDeleteDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders custom title and message, emits confirm, and reacts to exposed methods', async () => {
        const wrapper = await mountSuspended(ConfirmDeleteDialog, {
            props: {
                visible: false,
                title: 'Delete post',
                message: 'This action cannot be undone',
            },
            global: {
                stubs: {
                    Dialog: DialogStub,
                    Button: ButtonStub,
                },
            },
        })

        const exposed = (wrapper.vm as any).$?.exposed
            ?? (wrapper.vm as any).$?.subTree?.component?.exposed

        exposed.open()
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('update:visible')?.at(-1)).toEqual([true])
        expect(wrapper.find('.dialog-stub').attributes('data-header')).toBe('Delete post')
        expect(wrapper.text()).toContain('This action cannot be undone')

        exposed.setLoading(true)
        await wrapper.vm.$nextTick()
        expect(wrapper.findAll('button')[1]!.attributes('loading')).toBe('true')

        await wrapper.findAll('button')[1]!.trigger('click')
        expect(wrapper.emitted('confirm')).toHaveLength(1)

        exposed.close()
        await wrapper.vm.$nextTick()
        expect(wrapper.emitted('update:visible')?.at(-1)).toEqual([false])
    })

    it('falls back to default title and message and closes from the cancel button', async () => {
        const wrapper = await mountSuspended(ConfirmDeleteDialog, {
            props: {
                visible: true,
            },
            global: {
                stubs: {
                    Dialog: DialogStub,
                    Button: ButtonStub,
                },
            },
        })

        expect(wrapper.find('.dialog-stub').attributes('data-header')).toContain('删除')

        await wrapper.findAll('button')[0]!.trigger('click')
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    })
})
