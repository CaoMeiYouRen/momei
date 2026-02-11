import { watch, computed, type Ref } from 'vue'
import { useLocalStorage, useDebounceFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import type { PostEditorData } from '@/types/post-editor'

/**
 * 文章编辑器自动保存 Composable
 *
 * 职责：
 * 1. 自动将编辑器中的内容（标题、正文、摘要等）保存到 LocalStorage。
 * 2. 在编辑器加载时检测本地是否有未保存的更新。
 * 3. 支持恢复本地草稿。
 * 4. 在成功保存至服务器后清除本地草稿。
 */
export function usePostEditorAutoSave(
    post: Ref<PostEditorData>,
    isNew: Ref<boolean>,
) {
    // 生成 LocalStorage 的 Key
    // 规范: momei-draft-{language}-{translationId|id|new}
    const draftKey = computed(() => {
        const lang = post.value.language || 'zh-CN'
        // 优先使用文章真实 ID，其次是 translationId (处理翻译中的草稿)，最后是 new
        const idPart = (!isNew.value && post.value.id) ? post.value.id : (post.value.translationId || 'new')
        return `momei-draft-${lang}-${idPart}`
    })

    // 使用 vueuse 的 useLocalStorage，它会自动同步 reactive 数据与磁盘
    // 我们手动管理此变量的生命周期
    const localDraft = useLocalStorage<any>(draftKey, null)

    /**
     * 执行本地保存
     */
    const saveToLocal = useDebounceFn(() => {
        // 如果标题和内容都为空，说明可能是刚加载或者是清空了，不执行保存
        if (!post.value.title && (!post.value.content || post.value.content.length === 0)) { return }

        localDraft.value = {
            title: post.value.title,
            content: post.value.content,
            summary: post.value.summary,
            coverImage: post.value.coverImage,
            categoryId: post.value.categoryId,
            tags: JSON.parse(JSON.stringify(post.value.tags || [])), // 深拷贝确保响应性隔离
            lastSavedAt: Date.now(),
        }
    }, 2000) // 2秒防抖

    // 监听关键字段变化触发保存
    watch(() => [
        post.value.title,
        post.value.content,
        post.value.summary,
        post.value.coverImage,
        post.value.categoryId,
        post.value.tags,
    ], () => {
        saveToLocal()
    }, { deep: true })

    /**
     * 清除本地草稿
     */
    const clearLocalDraft = () => {
        localDraft.value = null
    }

    /**
     * 检查是否系统存在更新的本地草稿
     * @returns boolean 是否需要弹出恢复对话框
     */
    const hasRecoverableDraft = () => {
        if (!localDraft.value) { return false }

        const lastSavedAt = localDraft.value.lastSavedAt
        // post.updatedAt 是服务器返回的时间
        const serverUpdatedAt = post.value.updatedAt ? new Date(post.value.updatedAt).getTime() : 0

        // 逻辑：本地草稿比服务器时间更新超过 30 秒（容许小幅时钟误差）
        return lastSavedAt > serverUpdatedAt + 30000
    }

    /**
     * 恢复草稿数据到当前编辑器
     */
    const recoverDraft = () => {
        if (!localDraft.value) { return }

        const draft = localDraft.value
        if (draft.title !== undefined) { post.value.title = draft.title }
        if (draft.content !== undefined) { post.value.content = draft.content }
        if (draft.summary !== undefined) { post.value.summary = draft.summary }
        if (draft.coverImage !== undefined) { post.value.coverImage = draft.coverImage }
        if (draft.categoryId !== undefined) { post.value.categoryId = draft.categoryId }
        if (draft.tags !== undefined) { post.value.tags = JSON.parse(JSON.stringify(draft.tags)) }
    }

    return {
        draftKey,
        localDraft,
        hasRecoverableDraft,
        recoverDraft,
        clearLocalDraft,
    }
}
