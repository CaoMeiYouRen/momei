import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

interface AdminAiFormItem {
    id: string | null
    name: string
    slug: string
    translationId: string
}

const mockToast = {
    add: vi.fn(),
}

const mockFetch = vi.fn()
const mockIsPureEnglish = vi.fn()

mockNuxtImport('useI18n', () => () => ({
    t: (key: string) => key,
    locales: ref([
        { code: 'zh-CN' },
        { code: 'en-US' },
        { code: 'ja-JP' },
    ]),
}))

mockNuxtImport('useToast', () => () => mockToast)

vi.mock('@/utils/shared/validate', () => ({
    isPureEnglish: (...args: unknown[]) => mockIsPureEnglish(...args),
}))

vi.stubGlobal('$fetch', mockFetch)

import { useAdminAI } from './use-admin-ai'

function createForms() {
    return ref<Record<string, AdminAiFormItem>>({
        'zh-CN': { id: null, name: '源名称', slug: '', translationId: '' },
        'en-US': { id: null, name: '', slug: '', translationId: '' },
        'ja-JP': { id: null, name: '', slug: '', translationId: '' },
    })
}

describe('useAdminAI', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockReset()
        mockIsPureEnglish.mockReset()
    })

    it('无可用源语言时 translateName 应提示 warning', async () => {
        const multiForm = createForms()
        multiForm.value['zh-CN']!.name = ''
        const activeTab = ref('zh-CN')
        const { translateName } = useAdminAI(multiForm, activeTab)

        await translateName('en-US')

        expect(mockToast.add).toHaveBeenCalledWith({
            severity: 'warn',
            summary: 'common.warn',
            detail: 'common.no_source_content',
            life: 3000,
        })
    })

    it('translateName 成功时应写入目标语言名称并重置 loading', async () => {
        mockFetch.mockResolvedValueOnce({
            data: 'Translated Name',
        })

        const multiForm = createForms()
        const activeTab = ref('zh-CN')
        const { translateName, aiLoading } = useAdminAI(multiForm, activeTab)

        await translateName('en-US')

        expect(mockFetch).toHaveBeenCalledWith('/api/ai/translate-name', {
            method: 'POST',
            body: {
                name: '源名称',
                targetLanguage: 'common.languages.en-US',
            },
        })
        expect(multiForm.value['en-US']!.name).toBe('Translated Name')
        expect(aiLoading.value['en-US']?.name).toBe(false)
    })

    it('generateSlug 失败时应提示 error 并回收 loading', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            // mute expected error output
        })
        mockFetch.mockRejectedValueOnce(new Error('slug_failed'))

        const multiForm = createForms()
        multiForm.value['en-US']!.name = 'Target Name'
        const activeTab = ref('en-US')
        const { generateSlug, aiLoading } = useAdminAI(multiForm, activeTab)

        await generateSlug('en-US')

        expect(errorSpy).toHaveBeenCalledWith('AI Slug error:', expect.any(Error))
        expect(mockToast.add).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'common.error',
            detail: 'pages.admin.posts.ai_error',
            life: 3000,
        })
        expect(aiLoading.value['en-US']?.slug).toBe(false)
    })

    it('英文源内容同步时应直接复制名称、slug 和 translationId', async () => {
        mockIsPureEnglish.mockReturnValue(true)

        const multiForm = createForms()
        multiForm.value['zh-CN']!.name = 'English Source'
        multiForm.value['zh-CN']!.slug = 'english-source'
        multiForm.value['ja-JP']!.id = 'existing-id'
        const activeTab = ref('zh-CN')
        const { syncAIAllLanguages } = useAdminAI(multiForm, activeTab)

        await syncAIAllLanguages()

        expect(multiForm.value['en-US']).toMatchObject({
            name: 'English Source',
            slug: 'english-source',
            translationId: 'english-source',
        })
        expect(multiForm.value['ja-JP']).toMatchObject({
            id: 'existing-id',
            name: '',
            slug: '',
            translationId: '',
        })
    })

    it('非英文源内容同步时应先翻译名称再生成 slug，并共享 translationId', async () => {
        mockIsPureEnglish.mockReturnValue(false)
        mockFetch
            .mockResolvedValueOnce({ data: 'source-slug' })
            .mockResolvedValueOnce({ data: 'Translated EN' })
            .mockResolvedValueOnce({ data: 'translated-en' })
            .mockResolvedValueOnce({ data: 'Translated JA' })
            .mockResolvedValueOnce({ data: 'translated-ja' })

        const multiForm = createForms()
        const activeTab = ref('zh-CN')
        const { syncAIAllLanguages } = useAdminAI(multiForm, activeTab)

        await syncAIAllLanguages()

        expect(multiForm.value['zh-CN']!.translationId).toBe('source-slug')
        expect(multiForm.value['en-US']).toMatchObject({
            name: 'Translated EN',
            slug: 'translated-en',
            translationId: 'source-slug',
        })
        expect(multiForm.value['ja-JP']).toMatchObject({
            name: 'Translated JA',
            slug: 'translated-ja',
            translationId: 'source-slug',
        })
    })
})
