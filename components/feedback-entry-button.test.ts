import { beforeEach, describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import FeedbackEntryButton from '@/components/feedback-entry-button.vue'

const mockOpenFeedbackEntry = vi.fn()
const mockShouldShowFeedbackEntry = ref(true)

vi.mock('@/composables/use-feedback-entry', () => ({
    useFeedbackEntry: () => ({
        openFeedbackEntry: mockOpenFeedbackEntry,
        shouldShowFeedbackEntry: mockShouldShowFeedbackEntry,
    }),
}))

describe('FeedbackEntryButton', () => {
    beforeEach(() => {
        mockOpenFeedbackEntry.mockClear()
        mockShouldShowFeedbackEntry.value = true
    })

    it('renders when the feedback entry is enabled and triggers navigation', async () => {
        const wrapper = await mountSuspended(FeedbackEntryButton, {
            global: {
                stubs: {
                    Button: {
                        template: '<button class="feedback-entry">feedback</button>',
                    },
                },
            },
        })

        expect(wrapper.find('.feedback-entry').exists()).toBe(true)

        await wrapper.find('.feedback-entry').trigger('click')
        expect(mockOpenFeedbackEntry).toHaveBeenCalledTimes(1)
    })

    it('stays hidden when the feedback entry is disabled', async () => {
        mockShouldShowFeedbackEntry.value = false

        const wrapper = await mountSuspended(FeedbackEntryButton, {
            global: {
                stubs: {
                    Button: true,
                },
            },
        })

        expect(wrapper.find('.feedback-entry-button').exists()).toBe(false)
    })
})
