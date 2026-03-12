import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PostHistoryPanel from './post-history-panel.vue'
import { PostVisibility } from '@/types/post'
import { PostVersionDiffField, PostVersionSource } from '@/types/post-version'

const mockAppFetch = vi.fn()
const mockToastAdd = vi.fn()
const mockConfirmRequire = vi.fn(({ accept }: { accept?: () => void }) => accept?.())

vi.mock('primevue/usetoast', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/usetoast')>()

    return {
        ...actual,
        useToast: () => ({
            add: mockToastAdd,
        }),
    }
})

vi.mock('primevue/useconfirm', async (importOriginal) => {
    const actual = await importOriginal<typeof import('primevue/useconfirm')>()

    return {
        ...actual,
        useConfirm: () => ({
            require: mockConfirmRequire,
        }),
    }
})

vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-i18n')>()

    return {
        ...actual,
        useI18n: () => ({
            t: (key: string, params?: { fields?: string }) => params?.fields ? `${key}:${params.fields}` : key,
        }),
    }
})

vi.mock('@/composables/use-i18n-date', () => ({
    useI18nDate: () => ({
        formatDateTime: (value: string) => value,
    }),
}))

vi.stubGlobal('$fetch', mockAppFetch)

const SelectStub = defineComponent({
    props: {
        modelValue: {
            type: String,
            default: '',
        },
        options: {
            type: Array,
            default: () => [],
        },
        optionLabel: {
            type: String,
            default: 'label',
        },
        optionValue: {
            type: String,
            default: 'value',
        },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        return () => h('select', {
            value: props.modelValue,
            onChange: (event: Event) => emit('update:modelValue', (event.target as HTMLSelectElement).value),
        }, (props.options as Record<string, string>[]).map((option) => h('option', {
            key: option[props.optionValue],
            value: option[props.optionValue],
        }, option[props.optionLabel])))
    },
})

describe('PostHistoryPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        const versionDetail = {
            id: 'version-1',
            postId: 'post-1',
            sequence: 1,
            parentVersionId: null,
            restoredFromVersionId: null,
            source: PostVersionSource.EDIT,
            commitSummary: 'edit:content',
            changedFields: [PostVersionDiffField.CONTENT],
            snapshotHash: 'hash-1',
            createdAt: '2026-03-12T00:00:00.000Z',
            authorId: 'user-1',
            author: { id: 'user-1', name: 'Tester', image: null },
            snapshot: {
                title: 'Version Title',
                content: 'Version Content',
                summary: 'Version Summary',
                coverImage: null,
                categoryId: null,
                tagIds: [],
                visibility: PostVisibility.PUBLIC,
                copyright: null,
                metaVersion: 1,
                metadata: null,
                language: 'zh-CN',
                translationId: 'translation-1',
            },
        }

        mockAppFetch.mockImplementation((url: string, options?: { method?: string }) => {
            if (url === '/api/admin/posts/post-1/versions') {
                return Promise.resolve({
                    data: [
                        {
                            id: 'version-1',
                            postId: 'post-1',
                            sequence: 1,
                            parentVersionId: null,
                            restoredFromVersionId: null,
                            source: PostVersionSource.EDIT,
                            commitSummary: 'edit:content',
                            changedFields: [PostVersionDiffField.CONTENT],
                            snapshotHash: 'hash-1',
                            createdAt: '2026-03-12T00:00:00.000Z',
                            authorId: 'user-1',
                            author: { id: 'user-1', name: 'Tester', image: null },
                        },
                    ],
                })
            }

            if (url === '/api/admin/posts/post-1/versions/version-1') {
                return Promise.resolve({ data: versionDetail })
            }

            if (url === '/api/admin/posts/post-1/versions/version-1/diff') {
                return Promise.resolve({
                    data: {
                        currentVersion: versionDetail,
                        compareVersion: null,
                        compareTarget: 'current',
                        items: [
                            {
                                field: PostVersionDiffField.CONTENT,
                                kind: 'text',
                                changed: true,
                                oldValue: 'Current Content',
                                newValue: 'Version Content',
                                parts: [
                                    { value: 'Current Content', removed: true },
                                    { value: 'Version Content', added: true },
                                ],
                            },
                        ],
                    },
                })
            }

            if (url === '/api/admin/posts/post-1/versions/version-1/restore' && options?.method === 'POST') {
                return Promise.resolve({
                    data: {
                        restored: true,
                        post: {
                            id: 'post-1',
                            title: 'Version Title',
                            content: 'Version Content',
                            summary: 'Version Summary',
                            coverImage: null,
                            categoryId: null,
                            visibility: PostVisibility.PUBLIC,
                            copyright: null,
                            metaVersion: 1,
                            metadata: null,
                            tags: [],
                        },
                        version: versionDetail,
                    },
                })
            }

            return Promise.resolve({ data: null })
        })
    })

    it('loads version list and emits restored post payload', async () => {
        const wrapper = await mountSuspended(PostHistoryPanel, {
            props: {
                postId: 'post-1',
                visible: false,
            },
            global: {
                mocks: {
                    $t: (key: string) => key,
                },
                stubs: {
                    Drawer: { template: '<div><slot /><slot name="footer" /></div>' },
                    ProgressSpinner: { template: '<div />' },
                    Tag: { template: '<div><slot /></div>' },
                    Avatar: { template: '<div />' },
                    Button: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
                    Select: SelectStub,
                },
            },
        })

        await wrapper.setProps({ visible: true })
        await flushPromises()
        await flushPromises()
        expect(mockAppFetch).toHaveBeenCalledWith('/api/admin/posts/post-1/versions')

        await wrapper.find('.history-item__main').trigger('click')
        await flushPromises()
        expect(mockAppFetch).toHaveBeenCalledWith('/api/admin/posts/post-1/versions/version-1')

        const restoreButton = wrapper.findAll('button')[0]
        await restoreButton.trigger('click')
        await flushPromises()

        expect(mockConfirmRequire).toHaveBeenCalled()
        expect(mockAppFetch).toHaveBeenCalledWith('/api/admin/posts/post-1/versions/version-1/restore', { method: 'POST' })
        expect(wrapper.emitted('restore')?.[0]?.[0]).toMatchObject({
            title: 'Version Title',
            content: 'Version Content',
        })
    })
})
