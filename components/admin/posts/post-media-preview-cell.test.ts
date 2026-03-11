import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import PostMediaPreviewCell from './post-media-preview-cell.vue'
import { PostStatus, PostVisibility, type Post } from '@/types/post'

const stubs = {
    Button: {
        template: '<button :class="icon" @click="$emit(\'click\')"><slot /></button>',
        props: ['icon', 'ariaLabel', 'text', 'rounded', 'severity'],
        emits: ['click'],
    },
    Image: {
        template: '<img class="cover-image" :src="src" :alt="alt" />',
        props: ['src', 'alt', 'preview'],
    },
}

vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
}))

function createPost(overrides: Partial<Post> = {}): Post {
    const basePost: Post = {
        id: 'post-id',
        title: 'Test Post',
        content: 'Content',
        slug: 'test-post',
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
        views: 0,
        language: 'zh-CN',
        summary: null,
        coverImage: null,
        metadata: null,
        translations: null,
        author: null,
        category: null,
        tags: null,
        translationId: null,
    }

    return {
        ...basePost,
        ...overrides,
    }
}

describe('PostMediaPreviewCell', () => {
    it('prefers fallback-chain cover media in aggregate mode', async () => {
        const wrapper = await mountSuspended(PostMediaPreviewCell, {
            props: {
                mode: 'cover',
                preferredLocale: 'zh-TW',
                post: createPost({
                    id: 'primary-post',
                    language: 'zh-CN',
                    coverImage: '/covers/fallback-cover.png',
                    translations: [
                        createPost({
                            id: 'english-post',
                            language: 'en-US',
                            coverImage: '/covers/english-cover.png',
                        }),
                    ],
                }),
            },
            global: {
                stubs,
            },
        })

        const image = wrapper.get('img.cover-image')
        expect(image.attributes('src')).toBe('/covers/fallback-cover.png')
        expect(wrapper.html()).not.toContain('pages.admin.posts.media.cover_available')
        expect(wrapper.text()).toContain('简体中文')
    })

    it('renders previewable audio from fallback translations', async () => {
        const wrapper = await mountSuspended(PostMediaPreviewCell, {
            props: {
                mode: 'audio',
                preferredLocale: 'ko-KR',
                post: createPost({
                    id: 'primary-post',
                    language: 'zh-CN',
                    translations: [
                        createPost({
                            id: 'english-post',
                            language: 'en-US',
                            metadata: {
                                audio: {
                                    url: '/audio/en-preview.mp3',
                                    duration: 75,
                                    size: 2048,
                                },
                            },
                        }),
                    ],
                }),
            },
            global: {
                stubs,
            },
        })

        expect(wrapper.html()).not.toContain('pages.admin.posts.media.audio_available')
        expect(wrapper.text()).toContain('英语')

        await wrapper.get('button.pi-play').trigger('click')

        const audio = wrapper.get('audio')
        expect(audio.attributes('src')).toBe('/audio/en-preview.mp3')
        expect(wrapper.html()).toContain('00:01:15')
    })
})
