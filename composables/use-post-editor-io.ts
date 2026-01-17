import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { load } from 'js-yaml'

export function usePostEditorIO(post: any, selectedTags: any, categories: any, md: any) {
    const { t } = useI18n()
    const toast = useToast()
    const isDragging = ref(false)

    const uploadFile = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        const { data } = await $fetch<{ code: number, data: { url: string }[] }>('/api/upload', {
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
            let markdown = reader.result as string
            if (!markdown) {
                toast.add({
                    severity: 'warn',
                    summary: t('common.warn'),
                    detail: t('pages.admin.posts.file_empty'),
                    life: 3000,
                })
                return
            }

            const metaReg = /---\r?\n([\s\S]*?)\r?\n---/
            const metaText = markdown.match(metaReg)
            markdown = markdown.replace(/\r\n/g, '\n').replace(/\t/g, '    ').trim()

            let frontMatter: any = {}
            if (metaText?.[1]) {
                try {
                    frontMatter = load(metaText[1]) || {}
                } catch (e) {
                    console.error('Failed to parse front matter', e)
                    toast.add({
                        severity: 'warn',
                        summary: t('common.warn'),
                        detail: t('pages.admin.posts.parse_front_matter_failed'),
                        life: 3000,
                    })
                }
            }

            const content = markdown.replace(metaReg, '').trim()

            post.value.content = content
            if (frontMatter.title) {
                post.value.title = frontMatter.title
            }
            if (frontMatter.slug || frontMatter.abbrlink) {
                post.value.slug = frontMatter.slug || frontMatter.abbrlink
            }
            if (frontMatter.description || frontMatter.desc) {
                post.value.summary = frontMatter.description || frontMatter.desc
            }
            if (frontMatter.image || frontMatter.cover || frontMatter.thumb) {
                post.value.coverImage = frontMatter.image || frontMatter.cover || frontMatter.thumb
            }
            if (frontMatter.copyright || frontMatter.license) {
                post.value.copyright = frontMatter.copyright || frontMatter.license
            }
            if (frontMatter.language || frontMatter.lang) {
                post.value.language = frontMatter.language || frontMatter.lang
            }

            if (frontMatter.tags) {
                if (Array.isArray(frontMatter.tags)) {
                    selectedTags.value = frontMatter.tags
                } else if (typeof frontMatter.tags === 'string') {
                    selectedTags.value = [frontMatter.tags]
                }
            }

            if (frontMatter.categories || frontMatter.category) {
                const catName = Array.isArray(frontMatter.categories) ? frontMatter.categories[0] : (frontMatter.categories || frontMatter.category)
                if (catName) {
                    const foundCat = categories.value.find((c: any) => c.name.toLowerCase() === catName.toLowerCase())
                    if (foundCat) {
                        post.value.categoryId = foundCat.id
                    } else {
                        toast.add({
                            severity: 'info',
                            summary: t('common.info'),
                            detail: t('pages.admin.posts.category_not_found', { name: catName }),
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
        if (e.currentTarget && (e.relatedTarget === null || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))) {
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
                    detail: t('pages.admin.posts.unsupported_file_type', { name: file.name }),
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
