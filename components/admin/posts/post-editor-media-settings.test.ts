import { flushPromises } from '@vue/test-utils'
import { defineComponent, nextTick, reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PostEditorMediaSettings from './post-editor-media-settings.vue'
import { PostStatus, PostVisibility } from '@/types/post'
import type { PostEditorData } from '@/types/post-editor'

const mockFetch = vi.fn()
const mockShowErrorToast = vi.fn()
const mockShowSuccessToast = vi.fn()

const AppUploaderStub = defineComponent({
    name: 'AppUploader',
    props: {
        id: {
            type: String,
            default: '',
        },
        modelValue: {
            type: String,
            default: null,
        },
    },
    emits: ['update:modelValue'],
    template: '<div :data-uploader="id"></div>',
})

const AiImageGeneratorStub = defineComponent({
    name: 'AdminPostsAiImageGenerator',
    props: {
        articleTitle: {
            type: String,
            default: '',
        },
        articleSummary: {
            type: String,
            default: '',
        },
        articleContent: {
            type: String,
            default: '',
        },
        language: {
            type: String,
            default: '',
        },
        postId: {
            type: String,
            default: '',
        },
        translationId: {
            type: String,
            default: null,
        },
    },
    emits: ['generated'],
    template: '<div class="ai-image-generator-stub"></div>',
})

const PostTtsDialogStub = defineComponent({
    name: 'AdminPostsPostTtsDialog',
    props: {
        postId: {
            type: String,
            default: '',
        },
        content: {
            type: String,
            default: '',
        },
        language: {
            type: String,
            default: '',
        },
        translationId: {
            type: String,
            default: null,
        },
    },
    emits: ['completed'],
    template: '<div class="post-tts-dialog-stub"></div>',
})

vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('useRequestFeedback', () => ({
    showErrorToast: mockShowErrorToast,
    showSuccessToast: mockShowSuccessToast,
}))

function createPost(overrides: Partial<PostEditorData> = {}): PostEditorData {
    return {
        title: 'Target Title',
        content: 'Translated content',
        summary: 'Translated summary',
        slug: 'target-title',
        status: PostStatus.DRAFT,
        visibility: PostVisibility.PUBLIC,
        views: 0,
        language: 'en-US',
        translationId: 'cluster-1',
        tags: [],
        id: 'post-1',
        coverImage: '/covers/current.png',
        metadata: {},
        ...overrides,
    }
}

describe('PostEditorMediaSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockResolvedValue({
            code: 200,
            data: {
                size: 2048,
                mimeType: 'audio/mpeg',
                duration: 120,
            },
        })
    })

    it('passes locale-aware cover generator props from the editor state', async () => {
        const post = reactive(createPost()) as PostEditorData
        const wrapper = await mountSuspended(PostEditorMediaSettings, {
            props: {
                post,
            },
            global: {
                directives: {
                    tooltip: () => undefined,
                },
                mocks: {
                    $t: (key: string) => key,
                },
                stubs: {
                    Divider: true,
                    Button: true,
                    Image: true,
                    InputText: true,
                    InputNumber: true,
                    AppUploader: AppUploaderStub,
                    AdminPostsAiImageGenerator: AiImageGeneratorStub,
                    AdminPostsPostTtsDialog: PostTtsDialogStub,
                },
            },
        })

        const generator = wrapper.findComponent(AiImageGeneratorStub)
        const ttsDialog = wrapper.findComponent(PostTtsDialogStub)

        expect(generator.props()).toMatchObject({
            articleTitle: 'Target Title',
            articleSummary: 'Translated summary',
            articleContent: 'Translated content',
            language: 'en-US',
            postId: 'post-1',
            translationId: 'cluster-1',
        })
        expect(ttsDialog.props()).toMatchObject({
            postId: 'post-1',
            content: 'Translated content',
            language: 'en-US',
            translationId: 'cluster-1',
        })
    })

    it('binds regenerated audio to the current locale and probes metadata', async () => {
        const post = reactive(createPost({
            metadata: {
                audio: {
                    url: '/audio/old.mp3',
                    language: 'en-US',
                    translationId: 'cluster-1',
                    postId: 'post-1',
                    mode: 'speech',
                },
            },
            audioUrl: '/audio/old.mp3',
        })) as PostEditorData
        const wrapper = await mountSuspended(PostEditorMediaSettings, {
            props: {
                post,
            },
            global: {
                directives: {
                    tooltip: () => undefined,
                },
                mocks: {
                    $t: (key: string) => key,
                },
                stubs: {
                    Divider: true,
                    Button: true,
                    Image: true,
                    InputText: true,
                    InputNumber: true,
                    AppUploader: AppUploaderStub,
                    AdminPostsAiImageGenerator: AiImageGeneratorStub,
                    AdminPostsPostTtsDialog: PostTtsDialogStub,
                },
            },
        })

        wrapper.findComponent(PostTtsDialogStub).vm.$emit('completed', {
            audioUrl: '/audio/generated.mp3',
            provider: 'openai',
            voice: 'alloy',
            mode: 'podcast',
        })
        await flushPromises()

        const legacyAudio = post as unknown as {
            audioUrl?: string | null
            audioDuration?: number | null
            audioSize?: number | null
            audioMimeType?: string | null
        }

        expect(legacyAudio.audioUrl).toBe('/audio/generated.mp3')
        expect(legacyAudio.audioDuration).toBe(120)
        expect(legacyAudio.audioSize).toBe(2048)
        expect(legacyAudio.audioMimeType).toBe('audio/mpeg')
        expect(post.metadata?.audio).toMatchObject({
            url: '/audio/generated.mp3',
            language: 'en-US',
            translationId: 'cluster-1',
            postId: 'post-1',
            mode: 'podcast',
            duration: 120,
            size: 2048,
            mimeType: 'audio/mpeg',
        })
        expect(post.metadata?.tts).toMatchObject({
            provider: 'openai',
            voice: 'alloy',
            language: 'en-US',
            translationId: 'cluster-1',
            postId: 'post-1',
            mode: 'podcast',
        })
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/audio/probe', {
            query: { url: '/audio/generated.mp3' },
        })
    })

    it('unbinds stale audio and cover bindings when the editor clears assets manually', async () => {
        const post = reactive(createPost({
            coverImage: '/covers/current.png',
            metadata: {
                cover: {
                    url: '/covers/current.png',
                    source: 'ai',
                    language: 'en-US',
                    translationId: 'cluster-1',
                    postId: 'post-1',
                },
                audio: {
                    url: '/audio/current.mp3',
                    duration: 66,
                    size: 512,
                    mimeType: 'audio/mpeg',
                    language: 'en-US',
                    translationId: 'cluster-1',
                    postId: 'post-1',
                    mode: 'speech',
                },
                tts: {
                    provider: 'openai',
                    voice: 'alloy',
                    language: 'en-US',
                    translationId: 'cluster-1',
                    postId: 'post-1',
                    mode: 'speech',
                },
            },
            audioUrl: '/audio/current.mp3',
            audioDuration: 66,
            audioSize: 512,
            audioMimeType: 'audio/mpeg',
        })) as PostEditorData
        const wrapper = await mountSuspended(PostEditorMediaSettings, {
            props: {
                post,
            },
            global: {
                directives: {
                    tooltip: () => undefined,
                },
                mocks: {
                    $t: (key: string) => key,
                },
                stubs: {
                    Divider: true,
                    Button: true,
                    Image: true,
                    InputText: true,
                    InputNumber: true,
                    AppUploader: AppUploaderStub,
                    AdminPostsAiImageGenerator: AiImageGeneratorStub,
                    AdminPostsPostTtsDialog: PostTtsDialogStub,
                },
            },
        })

        const uploaders = wrapper.findAllComponents(AppUploaderStub)
        uploaders[1]!.vm.$emit('update:modelValue', null)
        uploaders[0]!.vm.$emit('update:modelValue', null)
        await nextTick()

        const legacyAudio = post as unknown as {
            audioUrl?: string | null
            audioDuration?: number | null
            audioSize?: number | null
            audioMimeType?: string | null
        }

        expect(legacyAudio.audioUrl).toBeNull()
        expect(legacyAudio.audioDuration).toBeNull()
        expect(legacyAudio.audioSize).toBeNull()
        expect(legacyAudio.audioMimeType).toBeNull()
        expect(post.metadata?.audio).toBeUndefined()
        expect(post.metadata?.tts).toBeUndefined()
        expect(post.metadata?.cover).toBeUndefined()
    })
})
