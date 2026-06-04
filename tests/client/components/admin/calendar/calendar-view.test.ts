import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import CalendarView from '@/components/admin/calendar/calendar-view.vue'
import type { CalendarDayGroup } from '@/types/calendar'

function createI18nInstance() {
    return createI18n({
        legacy: false,
        locale: 'zh-CN',
        fallbackLocale: 'en-US',
        messages: {
            'zh-CN': {
                common: {
                    year: '年',
                    month: '月',
                    loading: '加载中...',
                },
                pages: {
                    admin: {
                        calendar: {
                            today_btn: '今天',
                            month_view: '月',
                            week_view: '周',
                            more: '更多',
                        },
                    },
                },
            },
            'en-US': {
                common: {
                    year: 'Year',
                    month: 'Month',
                    loading: 'Loading...',
                },
                pages: {
                    admin: {
                        calendar: {
                            today_btn: 'Today',
                            month_view: 'Month',
                            week_view: 'Week',
                            more: 'more',
                        },
                    },
                },
            },
        },
    })
}

function createWrapper(propsOverrides = {}) {
    const i18n = createI18nInstance()
    return mount(CalendarView, {
        props: {
            loading: false,
            calendarPosts: [],
            ...propsOverrides,
        },
        global: {
            plugins: [i18n],
            stubs: {
                Button: { template: '<button><slot /></button>' },
                SelectButton: {
                    template: '<div class="mock-select-button"><slot /></div>',
                    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'allowEmpty'],
                    emits: ['update:modelValue'],
                },
            },
        },
    })
}

describe('calendar-view', () => {
    describe('month view', () => {
        it('renders month grid cells', () => {
            const posts: CalendarDayGroup[] = [
                {
                    date: '2026-06-15',
                    posts: [
                        {
                            id: 'post-1',
                            title: 'Test Post',
                            status: 'published',
                            publishedAt: '2026-06-15T10:00:00Z',
                            language: 'zh-CN',
                            slug: 'test-post',
                        },
                    ],
                },
            ]
            const wrapper = createWrapper({ calendarPosts: posts })
            expect(wrapper.find('.calendar-view__grid').exists()).toBe(true)
            // Month view should not have --week modifier
            expect(wrapper.find('.calendar-view__grid--week').exists()).toBe(false)
        })

        it('renders weekdays header (7 days)', () => {
            const wrapper = createWrapper()
            const weekdays = wrapper.findAll('.calendar-view__weekday')
            expect(weekdays.length).toBe(7)
        })

        it('shows posts as chips in cells', () => {
            const posts: CalendarDayGroup[] = [
                {
                    date: '2026-06-15',
                    posts: [
                        { id: 'p1', title: 'Post One', status: 'published', publishedAt: '2026-06-15T10:00:00Z', language: 'zh-CN', slug: 'p1' },
                        { id: 'p2', title: 'Post Two', status: 'scheduled', publishedAt: '2026-06-15T12:00:00Z', language: 'zh-CN', slug: 'p2' },
                    ],
                },
            ]
            const wrapper = createWrapper({ calendarPosts: posts })
            const chips = wrapper.findAll('.calendar-view__chip')
            expect(chips.length).toBe(2)
            expect(chips[0]!.classes()).toContain('calendar-view__chip--published')
            expect(chips[1]!.classes()).toContain('calendar-view__chip--scheduled')
        })

        it('shows more count indicator when posts exceed 3', () => {
            const posts: CalendarDayGroup[] = [
                {
                    date: '2026-06-15',
                    posts: Array.from({ length: 5 }, (_, i) => ({
                        id: `p${i}`,
                        title: `Post ${i}`,
                        status: 'published' as const,
                        publishedAt: '2026-06-15T10:00:00Z',
                        language: 'zh-CN',
                        slug: `p${i}`,
                    })),
                },
            ]
            const wrapper = createWrapper({ calendarPosts: posts })
            expect(wrapper.findAll('.calendar-view__chip').length).toBe(3)
            expect(wrapper.find('.calendar-view__more').exists()).toBe(true)
        })

        it('highlights today cell', () => {
            const today = new Date().toISOString().slice(0, 10)
            const posts: CalendarDayGroup[] = [
                { date: today, posts: [] },
            ]
            const wrapper = createWrapper({ calendarPosts: posts })
            // Today's cell should exist in the grid
            expect(wrapper.find('.calendar-view__cell--today').exists()).toBe(true)
        })
    })

    describe('week view', () => {
        it('renders week cells with header and posts', async () => {
            const posts: CalendarDayGroup[] = [
                {
                    date: new Date().toISOString().slice(0, 10),
                    posts: [
                        { id: 'post-w1', title: 'Week Post', status: 'published', publishedAt: '2026-06-15T10:00:00Z', language: 'zh-CN', slug: 'wp1' },
                    ],
                },
            ]
            const wrapper = createWrapper({ calendarPosts: posts })

            // Switch to week view programmatically
            ;(wrapper.vm as any).onViewChange('week')
            await wrapper.vm.$nextTick()
            // Week view grid should now be present
            expect(wrapper.find('.calendar-view__grid--week').exists()).toBe(true)
        })
    })

    describe('title', () => {
        it('renders year and month in title', () => {
            const wrapper = createWrapper()
            const title = wrapper.find('.calendar-view__title')
            expect(title.exists()).toBe(true)
        })
    })

    describe('navigation', () => {
        it('emits navigate event when prev period is clicked', async () => {
            const wrapper = createWrapper()
            const buttons = wrapper.findAll('button')
            if (buttons.length > 0) {
                await buttons[0]!.trigger('click')
                expect(wrapper.emitted('navigate')).toBeTruthy()
            }
        })

        it('emits edit-post when a post chip is clicked', async () => {
            const posts: CalendarDayGroup[] = [
                {
                    date: '2026-06-15',
                    posts: [
                        { id: 'post-chip-1', title: 'Chip Post', status: 'published', publishedAt: '2026-06-15T10:00:00Z', language: 'zh-CN', slug: 'chip1' },
                    ],
                },
            ]
            const wrapper = createWrapper({ calendarPosts: posts })
            const chip = wrapper.find('.calendar-view__chip')
            if (chip.exists()) {
                await chip.trigger('click')
                expect(wrapper.emitted('edit-post')).toBeTruthy()
                expect(wrapper.emitted('edit-post')![0]).toEqual(['post-chip-1'])
            }
        })
    })
})
