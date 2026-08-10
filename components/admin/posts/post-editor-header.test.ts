import { describe, it, expect } from 'vitest'
import { nextTick, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PostEditorHeader from './post-editor-header.vue'
import { PostStatus } from '@/types/post'
import type { PerspectiveMode } from '@/types/ai'

/**
 * SplitButton stub: 渲染主按钮 + 下拉按钮；点击下拉按钮渲染 model 菜单，点击菜单项触发 command。
 * 保持与真实 SplitButton 相同的按钮数量（主按钮 + 下拉按钮 = 2）。
 */
const SplitButtonStub = {
    template: `
        <div class="split-button-stub">
            <button class="split-button-default" @click="$emit('click', $event)" />
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
    props: ['model', 'loading', 'icon'],
    emits: ['click'],
    data() {
        return { menuOpen: false }
    },
}

/** Popover stub: 直接渲染默认 slot，通过 show/hide 控制可见性 */
const PopoverStub = {
    template: '<div class="popover-stub" v-if="visible"><slot /></div>',
    props: ['class'],
    setup(_props: Record<string, unknown>, { expose }: { expose: (api: Record<string, unknown>) => void }) {
        const visible = ref(false)
        expose({
            show: () => { visible.value = true },
            hide: () => { visible.value = false },
        })
        return { visible }
    },
}

const stubs = {
    AppVoiceInputTrigger: {
        template: '<button class="voice-trigger-stub" />',
    },
    AdminPostsPostDistributionButton: {
        template: '<button class="distribution-button-stub" />',
    },
    SplitButton: SplitButtonStub,
    Popover: PopoverStub,
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
        expect((input.element as HTMLInputElement).value).toBe('Test Post')
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
        expect(rightBar.findComponent({ name: 'Tag' }).exists()).toBe(true)
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
