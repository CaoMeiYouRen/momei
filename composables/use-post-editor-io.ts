import { ref, type Ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import yaml from 'js-yaml'
import type { PostFrontMatter, PostEditorData, CategoryOption } from '@/types/post-editor'

export function usePostEditorIO(
    post: Ref<PostEditorData>,
    selectedTags: Ref<string[]>,
    categories: Ref<CategoryOption[]>,
    md: Ref<any>,
) {
    const { t } = useI18n()
    const toast = useToast()
    const isDragging = ref(false)

    const uploadFile = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        const { data } = await $fetch<{
            code: number
            data: { url: string }[]
        }>('/api/upload', {
            method: 'POST',
            body: formData,
        })

        return data?.[0]?.url
    }

    const imgAdd = async (pos: number, $file: File) => {
        try {
            const url = await uploadFile($file)
            if (url) {
                md.value?.$img2Url(pos, url)
            }
        } catch (error) {
            console.error('Upload failed', error)
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('pages.admin.posts.upload_failed'),
                life: 3000,
            })
        }
    }

    const handleMarkdownImport = (file: File) => {
        const reader = new FileReader()
        reader.readAsText(file, 'utf-8')
        reader.onload = () => {
            const markdown = reader.result as string
            if (!markdown) {
                toast.add({
                    severity: 'warn',
                    summary: t('common.warn'),
                    detail: t('pages.admin.posts.file_empty'),
                    life: 3000,
                })
                return
            }

            try {
                let data: any = {}
                let content = markdown

                const match = markdown.match(
                    /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/,
                )
                if (match) {
                    try {
                        data = yaml.load(match[1] || '') || {}
                        content = match[2] || ''
                    } catch (e) {
                        console.warn(
                            'YAML parse failed, importing as plain content',
                            e,
                        )
                    }
                }

                const frontMatter = data as PostFrontMatter

                post.value.content = content.trim()
                if (frontMatter.title) {
                    post.value.title = frontMatter.title
                }
                if (frontMatter.slug || frontMatter.abbrlink) {
                    post.value.slug = (frontMatter.slug
                        || frontMatter.abbrlink) as string
                }
                if (frontMatter.description || frontMatter.desc) {
                    post.value.summary = (frontMatter.description
                        || frontMatter.desc) as string
                }
                if (
                    frontMatter.image
                    || frontMatter.cover
                    || frontMatter.thumb
                ) {
                    post.value.coverImage = (frontMatter.image
                        || frontMatter.cover
                        || frontMatter.thumb) as string
                }
                if (frontMatter.copyright || frontMatter.license) {
                    post.value.copyright = (frontMatter.copyright
                        || frontMatter.license) as string
                }
                if (frontMatter.language || frontMatter.lang) {
                    post.value.language = (frontMatter.language
                        || frontMatter.lang) as string
                }

                if (frontMatter.audio || frontMatter.audio_url) {
                    post.value.audioUrl = (frontMatter.audio || frontMatter.audio_url) as string
                }
                if (frontMatter.audio_duration) {
                    post.value.audioDuration = frontMatter.audio_duration
                }
                if (frontMatter.audio_size) {
                    post.value.audioSize = frontMatter.audio_size
                }
                if (frontMatter.audio_mime_type) {
                    post.value.audioMimeType = frontMatter.audio_mime_type
                }

                if (frontMatter.tags) {
                    if (Array.isArray(frontMatter.tags)) {
                        selectedTags.value = frontMatter.tags
                    } else if (typeof frontMatter.tags === 'string') {
                        selectedTags.value = [frontMatter.tags]
                    }
                }

                if (frontMatter.categories || frontMatter.category) {
                    const rawCat =
                        frontMatter.categories || frontMatter.category
                    const catName = Array.isArray(rawCat) ? rawCat[0] : rawCat

                    if (catName && typeof catName === 'string') {
                        const foundCat = categories.value.find(
                            (c: any) =>
                                c.name.toLowerCase() === catName.toLowerCase(),
                        )
                        if (foundCat) {
                            post.value.categoryId = foundCat.id
                        } else {
                            toast.add({
                                severity: 'info',
                                summary: t('common.info'),
                                detail: t(
                                    'pages.admin.posts.category_not_found',
                                    { name: catName },
                                ),
                                life: 3000,
                            })
                        }
                    }
                }

                toast.add({
                    severity: 'success',
                    summary: t('common.success'),
                    detail: t('pages.admin.posts.import_success'),
                    life: 3000,
                })
            } catch (e) {
                console.error('Failed to parse markdown file', e)
                toast.add({
                    severity: 'error',
                    summary: t('common.error'),
                    detail: t('pages.admin.posts.parse_failed'),
                    life: 3000,
                })
            }
        }
    }

    const handleImageUpload = async (file: File) => {
        try {
            const url = await uploadFile(file)
            if (url) {
                post.value.content += `\n![${file.name}](${url})\n`
                toast.add({
                    severity: 'success',
                    summary: t('common.success'),
                    detail: t('pages.admin.posts.image_upload_success'),
                    life: 3000,
                })
            }
        } catch (error) {
            console.error('Upload failed', error)
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('pages.admin.posts.upload_failed'),
                life: 3000,
            })
        }
    }

    const onDragOver = (e: DragEvent) => {
        if (e.dataTransfer?.types?.includes('Files')) {
            isDragging.value = true
        }
    }

    const onDragLeave = (e: DragEvent) => {
        if (
            e.currentTarget
            && (e.relatedTarget === null
                || !(e.currentTarget as HTMLElement).contains(
                    e.relatedTarget as Node,
                ))
        ) {
            isDragging.value = false
        }
    }

    const onDrop = async (e: DragEvent) => {
        isDragging.value = false
        const files = e.dataTransfer?.files
        if (!files || files.length === 0) {
            return
        }

        for (let i = 0; i < files.length; i++) {
            const file = files.item(i)
            if (!file) {
                continue
            }

            if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
                handleMarkdownImport(file)
            } else if (file.type.startsWith('image/')) {
                await handleImageUpload(file)
            } else {
                toast.add({
                    severity: 'warn',
                    summary: t('common.warn'),
                    detail: t('pages.admin.posts.unsupported_file_type', {
                        name: file.name,
                    }),
                    life: 3000,
                })
            }
        }
    }

    return {
        isDragging,
        onDragOver,
        onDragLeave,
        onDrop,
        imgAdd,
        uploadFile,
    }
}
