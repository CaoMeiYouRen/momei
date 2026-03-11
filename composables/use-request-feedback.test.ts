import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const { mockToast } = vi.hoisted(() => ({
    mockToast: {
        add: vi.fn(),
    },
}))

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => `translated:${key}`,
}))

mockNuxtImport('useToast', () => () => mockToast)

import { useRequestFeedback } from './use-request-feedback'

describe('useRequestFeedback', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows translated success toast details', () => {
        const { showSuccessToast } = useRequestFeedback()

        showSuccessToast('pages.admin.posts.tts.attach_success')

        expect(mockToast.add).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'translated:common.success',
            detail: 'translated:pages.admin.posts.tts.attach_success',
            life: 3000,
        })
    })

    it('prefers stable i18nKey from request payload for error toasts', () => {
        const { showErrorToast } = useRequestFeedback()

        showErrorToast(
            {
                data: {
                    i18nKey: 'pages.admin.posts.podcast.probe_metadata_failed',
                },
            },
            {
                fallbackKey: 'common.error',
            },
        )

        expect(mockToast.add).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'translated:common.error',
            detail: 'translated:pages.admin.posts.podcast.probe_metadata_failed',
            life: 3000,
        })
    })

    it('maps status codes before falling back', () => {
        const { showErrorToast } = useRequestFeedback()

        showErrorToast(
            {
                statusCode: 404,
            },
            {
                fallbackKey: 'common.error',
                statusKeyMap: {
                    '404': 'common.not_found',
                },
            },
        )

        expect(mockToast.add).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'translated:common.error',
            detail: 'translated:common.not_found',
            life: 3000,
        })
    })
})
