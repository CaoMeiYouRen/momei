import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

export function usePostExport() {
    const { t } = useI18n()
    const toast = useToast()
    const exporting = ref(false)

    const exportPost = async (id: string, slug?: string) => {
        try {
            exporting.value = true
            const response = await fetch(`/api/posts/${id}/export`)
            if (!response.ok) { throw new Error('Export failed') }
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url

            // 尝试从响应头获取文件名
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = `${slug || id}.md`
            if (contentDisposition) {
                const filenameMatch = /filename\*?=['"]?(?:UTF-8'')?([^'"]+)['"]?/.exec(contentDisposition)
                if (filenameMatch?.[1]) {
                    filename = decodeURIComponent(filenameMatch[1])
                }
            }

            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            toast.add({ severity: 'success', summary: t('pages.admin.posts.export_success'), life: 3000 })
        } catch (error) {
            console.error(error)
            toast.add({ severity: 'error', summary: t('pages.admin.posts.export_error'), life: 3000 })
        } finally {
            exporting.value = false
        }
    }

    const exportBatch = async (ids: string[]) => {
        if (!ids || ids.length === 0) { return }
        try {
            exporting.value = true
            const response = await fetch('/api/posts/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            })
            if (!response.ok) { throw new Error('Batch export failed') }
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `momei-export-${new Date().toISOString().split('T')[0]}.zip`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
            toast.add({ severity: 'success', summary: t('pages.admin.posts.export_success'), life: 3000 })
        } catch (error) {
            console.error(error)
            toast.add({ severity: 'error', summary: t('pages.admin.posts.export_error'), life: 3000 })
        } finally {
            exporting.value = false
        }
    }

    return {
        exporting,
        exportPost,
        exportBatch,
    }
}
