import { mountSuspended } from '@nuxt/test-utils/runtime'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import {
    CaomeiButton,
    CaomeiDropdownMenu,
    CaomeiDropdownMenuContent,
    CaomeiDropdownMenuItem,
    CaomeiDropdownMenuTrigger,
} from 'caomei-ui'
import AppTooltip from './app-tooltip.vue'

const CaomeiTooltipProviderStub = defineComponent({
    props: {
        delayDuration: {
            type: Number,
            default: 700,
        },
    },
    template: '<div class="stub-provider" :data-delay="delayDuration"><slot /></div>',
})

const CaomeiTooltipStub = defineComponent({
    props: {
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    template: '<div class="stub-tooltip" :data-disabled="String(disabled)"><slot /></div>',
})

const CaomeiTooltipTriggerStub = defineComponent({
    props: {
        asChild: {
            type: Boolean,
            default: false,
        },
        unstyled: {
            type: Boolean,
            default: false,
        },
    },
    template: '<span class="stub-trigger" :data-as-child="String(asChild)" :data-unstyled="String(unstyled)"><slot /></span>',
})

const CaomeiTooltipContentStub = defineComponent({
    props: {
        side: {
            type: String,
            default: 'top',
        },
        ariaLabel: {
            type: String,
            default: undefined,
        },
    },
    template: '<span class="stub-content" :data-side="side" :aria-label="ariaLabel"><slot /></span>',
})

const stubs = {
    CaomeiTooltipProvider: CaomeiTooltipProviderStub,
    CaomeiTooltip: CaomeiTooltipStub,
    CaomeiTooltipTrigger: CaomeiTooltipTriggerStub,
    CaomeiTooltipContent: CaomeiTooltipContentStub,
}

const mountTooltip = async (props: Record<string, unknown>) => mountSuspended(AppTooltip, {
    props,
    slots: {
        default: '<button type="button" class="target">动作</button>',
    },
    global: {
        stubs,
    },
})

describe('AppTooltip', () => {
    it('以 as-child 无样式触发器包住既有元素，并按默认 top 渲染面板', async () => {
        const wrapper = await mountTooltip({ content: '查看详情' })

        const trigger = wrapper.get('.stub-trigger')
        expect(trigger.attributes('data-as-child')).toBe('true')
        expect(trigger.attributes('data-unstyled')).toBe('true')
        expect(trigger.find('.target').exists()).toBe(true)

        const content = wrapper.get('.stub-content')
        expect(content.attributes('data-side')).toBe('top')
        expect(content.text()).toBe('查看详情')
        expect(content.attributes('aria-label')).toBe('查看详情')
        expect(wrapper.get('.stub-provider').attributes('data-delay')).toBe('0')
        expect(wrapper.get('.stub-tooltip').attributes('data-disabled')).toBe('false')
    })

    it('把原指令修饰符映射为面板方向', async () => {
        const wrapper = await mountTooltip({ content: '左侧说明', side: 'left' })

        expect(wrapper.get('.stub-content').attributes('data-side')).toBe('left')
    })

    it('内容为空时不展示面板，且不传可访问名', async () => {
        const wrapper = await mountTooltip({ content: '' })

        expect(wrapper.get('.stub-tooltip').attributes('data-disabled')).toBe('true')
        expect(wrapper.get('.stub-content').attributes('aria-label')).toBeUndefined()
        expect(wrapper.find('.target').exists()).toBe(true)
    })

    it('内容为 null 时按缺失处理', async () => {
        const wrapper = await mountTooltip({ content: null })

        expect(wrapper.get('.stub-tooltip').attributes('data-disabled')).toBe('true')
    })

    it('把外层 as-child 触发器透传的 attrs 落到触发元素上', async () => {
        const wrapper = await mountTooltip({ content: '菜单', 'aria-haspopup': 'menu', 'data-state': 'closed' })

        const trigger = wrapper.get('.stub-trigger')
        expect(trigger.attributes('aria-haspopup')).toBe('menu')
        expect(trigger.attributes('data-state')).toBe('closed')
    })
})

/**
 * 真实组件链路：`DropdownMenuTrigger as-child` 把 aria / 事件以 attrs 传给 AppTooltip，
 * 必须继续落到 `CaomeiTooltipTrigger` 下的按钮上（jsdom 下只能验证 attrs 与事件，
 * 弹层开合与定位由 2d 的浏览器回归覆盖）。
 *
 * 已知契约偏差（2d 复核）：两个触发器的 `data-state` 同名，内层 tooltip 的值会覆盖外层
 * 菜单的 `open` 值；当前唯一消费方是下拉触发器 `[data-state='open']` 底色，且被 `:hover`
 * 规则掩盖，故不改结构，改为在 2d 视觉回归中确认。
 */
describe('AppTooltip 嵌在 as-child 触发器内', () => {
    it('不吞掉外层触发器的 aria 与事件处理器', async () => {
        let clicked = 0

        const Host = defineComponent({
            setup() {
                return () => h(CaomeiDropdownMenu, null, {
                    default: () => [
                        h(CaomeiDropdownMenuTrigger, { asChild: true }, {
                            default: () => h(AppTooltip, {
                                content: '管理员',
                                onClick: () => {
                                    clicked += 1
                                },
                            }, {
                                default: () => h('button', { id: 'trigger-btn', type: 'button' }, '菜单'),
                            }),
                        }),
                        h(CaomeiDropdownMenuContent, null, {
                            default: () => h(CaomeiDropdownMenuItem, null, { default: () => '项' }),
                        }),
                    ],
                })
            },
        })

        const wrapper = mount(Host, { attachTo: document.body })
        const button = wrapper.get('#trigger-btn')

        expect(button.attributes('aria-haspopup')).toBe('menu')

        await button.trigger('click')
        expect(clicked).toBe(1)

        wrapper.unmount()
    })
})

describe('AppTooltip 包裹组件子节点', () => {
    it('attrs 与事件落到 CaomeiButton 渲染出的真实按钮上', async () => {
        let clicked = 0

        const Host = defineComponent({
            setup() {
                return () => h(AppTooltip, {
                    content: '上传',
                    'data-probe': 'tooltip-target',
                    onClick: () => {
                        clicked += 1
                    },
                }, {
                    default: () => h(CaomeiButton, { label: '上传' }),
                })
            },
        })

        const wrapper = mount(Host, { attachTo: document.body })
        const button = wrapper.get('button')

        expect(button.attributes('data-probe')).toBe('tooltip-target')

        await button.trigger('click')
        expect(clicked).toBe(1)

        wrapper.unmount()
    })
})
