import { describe, it, expect, vi } from 'vitest'
import { defineComponent, inject, nextTick, provide, toRef, type Ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PostEditorHeader from './post-editor-header.vue'

/* 该组件仅以 stub 渲染；显式 mock 掉真实模块，避免其传递依赖
 * （`use-post-distribution-button` → `distribution-template` → locale JSON）
 * 在测试环境触发 `virtual:intlify-i18n` 解析失败（见 backlog 的本地 vitest 缓存项）。 */
vi.mock('@/components/admin/posts/post-distribution-button.vue', () => ({
    default: {
        name: 'AdminPostsPostDistributionButton',
        template: '<button class="distribution-button-stub" />',
    },
}))
import { PostStatus } from '@/types/post'
import type { PerspectiveMode } from '@/types/ai'

/**
 * SplitButton stub: 渲染主按钮 + 下拉按钮；点击下拉按钮渲染 model 菜单，点击菜单项触发 command。
 * 保持与真实 `CaomeiSplitButton` 相同的按钮数量（主按钮 + 下拉按钮 = 2）。
 */
const SplitButtonStub = {
    template: `
        <div class="split-button-stub">
            <button class="split-button-default" @click="$emit('click', $event)"><slot name="icon" /></button>
            <button class="split-button-menu" @click="menuOpen = !menuOpen" />
            <ul v-if="menuOpen" class="split-button-menu-list">
                <li
                    v-for="item in model"
                    :key="item.label"
                    class="split-button-menu-item"
                    @click="menuOpen = false; item.command && item.command()"
                >
                    {{ item.label }}
                </li>
            </ul>
        </div>
    `,
    props: ['model', 'loading', 'label'],
    emits: ['click'],
    data() {
        return { menuOpen: false }
    },
}

/** CaomeiPopover stub：把 `open` 通过 provide 传给 content，模拟真实浮层的条件渲染。 */
const PopoverStub = defineComponent({
    props: { open: { type: Boolean, default: false } },
    setup(props, { slots }) {
        provide('test-popover-open', toRef(props, 'open'))
        return () => slots.default?.()
    },
})

const PopoverTriggerStub = defineComponent({
    template: '<span class="popover-trigger-stub"><slot /></span>',
})

const PopoverContentStub = defineComponent({
    setup(_, { slots }) {
        const open = inject<Ref<boolean>>('test-popover-open')
        return () => (open?.value ? slots.default?.() : null)
    },
})

const stubs = {
    AppVoiceInputTrigger: {
        template: '<button class="voice-trigger-stub" />',
    },
    AdminPostsPostDistributionButton: {
        template: '<button class="distribution-button-stub" />',
    },
    CaomeiSplitButton: SplitButtonStub,
    CaomeiPopover: PopoverStub,
    CaomeiPopoverTrigger: PopoverTriggerStub,
    CaomeiPopoverContent: PopoverContentStub,
}

describe('PostEditorHeader', () => {
    const mockPost = {
        title: 'Test Post',
        content: '# Test Content',
        status: PostStatus.DRAFT,
        language: 'zh-CN',
    }

    const defaultProps = {
        post: mockPost,
        errors: {},
        locales: [
            { code: 'zh-CN', name: '中文' },
            { code: 'en-US', name: 'English' },
        ],
        hasTranslation: () => null,
        getStatusLabel: (status: string) => status,
        getStatusSeverity: () => 'info',
        saving: false,
        isNew: true,
        hasUnsavedContent: false,
        aiLoading: {},
        titleSuggestions: [],
        reviewSuggestions: [],
        reviewPanelVisible: false,
        perspectiveResults: [],
        perspectivePanelVisible: false,
        perspectiveMode: 'editor' as PerspectiveMode,
    }

    const mountHeader = (props = defaultProps) => mountSuspended(PostEditorHeader, {
        props,
        global: {
            mocks: {
                $t: (key: string) => key,
            },
            stubs,
        },
    })

    it('renders title input correctly', async () => {
        const wrapper = await mountHeader()

        const input = wrapper.find('.title-input')
        expect(input.exists()).toBe(true)

        // `CaomeiInput` 的 `$attrs`（含 class）落在内层 input 上。
        const inputElement = input.element as HTMLInputElement
        const value = inputElement.tagName === 'INPUT'
            ? inputElement.value
            : (wrapper.find('.title-input input').element as HTMLInputElement).value
        expect(value).toBe('Test Post')
    })

    it('groups AI tools in ButtonGroup (5 consolidated entries)', async () => {
        const wrapper = await mountHeader()

        const aiGroup = wrapper.find('.ai-tools-group')
        expect(aiGroup.exists()).toBe(true)
        // 5 entries: AI 写作 (SplitButton→2 buttons), AI 审校 (1), AI 翻译 (SplitButton→2), 格式化 (1), 语音 input (1) = 7 button elements total
        expect(aiGroup.findAll('button').length).toBe(7)
        // Verify the 5 key entry points exist
        const buttons = aiGroup.findAll('button')
        expect(buttons.length).toBeGreaterThanOrEqual(5)
    })

    it('renders status tag and translation badges in right bar', async () => {
        const wrapper = await mountHeader({
            ...defaultProps,
            post: { ...mockPost, status: PostStatus.PUBLISHED },
        })

        const rightBar = wrapper.find('.top-bar-right')
        expect(rightBar.findComponent({ name: 'CaomeiTag' }).exists()).toBe(true)
        expect(rightBar.find('.translation-status-bar').exists()).toBe(true)
    })

    it('emits translation switch after clicking a language badge', async () => {
        const wrapper = await mountHeader({
            ...defaultProps,
            post: { ...mockPost, title: '', content: '' },
        })

        await wrapper.find('.title-input').trigger('focus')
        await wrapper.findAll('.translation-badge')[1]?.trigger('click')
        await nextTick()

        expect(wrapper.emitted('handle-translation')).toEqual([['en-US']])
    })

    describe('AI writing style popover', () => {
        const openMenuAndClickItem = async (wrapper: any, label: string) => {
            const writingGroup = wrapper.find('#ai-writing-btn')
            await writingGroup.find('.split-button-menu').trigger('click')
            await nextTick()
            const items = wrapper.findAll('.split-button-menu-item')
            const target = items.find((item) => item.text().includes(label))
            expect(target).toBeDefined()
            await target?.trigger('click')
            await nextTick()
        }

        it('opens rewrite style popover with rewrite title on main button click and emits rewrite-content', async () => {
            const wrapper = await mountHeader()

            await wrapper.find('#ai-writing-btn .split-button-default').trigger('click')
            await nextTick()

            const title = wrapper.find('.rewrite-menu__title')
            expect(title.text()).toBe('pages.admin.posts.ai.rewrite_style_title')

            await wrapper.findAll('.rewrite-menu__item')[0]?.trigger('click')
            await nextTick()

            expect(wrapper.emitted('rewrite-content')).toEqual([['casual']])
        })

        it('opens generic style popover from continue menu item and emits continue-content with style', async () => {
            const wrapper = await mountHeader()

            await openMenuAndClickItem(wrapper, 'pages.admin.posts.ai.continue')

            expect(wrapper.find('.rewrite-menu__title').text())
                .toBe('pages.admin.posts.ai.style_select_title')

            await wrapper.findAll('.rewrite-menu__item')[0]?.trigger('click')
            await nextTick()

            expect(wrapper.emitted('continue-content')).toEqual([['casual']])
        })

        it('emits expand-content with selected style from expand menu item', async () => {
            const wrapper = await mountHeader()

            await openMenuAndClickItem(wrapper, 'pages.admin.posts.ai.expand')

            // 选择"正式风格"（第 2 项）
            await wrapper.findAll('.rewrite-menu__item')[1]?.trigger('click')
            await nextTick()

            expect(wrapper.emitted('expand-content')).toEqual([['formal']])
        })

        it('emits condense-content with selected style from condense menu item', async () => {
            const wrapper = await mountHeader()

            await openMenuAndClickItem(wrapper, 'pages.admin.posts.ai.condense')

            // 选择"技术风格"（第 4 项）
            await wrapper.findAll('.rewrite-menu__item')[3]?.trigger('click')
            await nextTick()

            expect(wrapper.emitted('condense-content')).toEqual([['technical']])
        })
    })
})
