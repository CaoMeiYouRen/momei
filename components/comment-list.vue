<template>
    <div class="comment-system">
        <div class="comment-system__header">
            <h3 class="comment-system__title">
                {{ $t('comments.title') }}
                <span v-if="totalCount > 0" class="comment-system__count">({{ totalCount }})</span>
            </h3>
        </div>

        <!-- 发表评论表单 -->
        <CommentForm
            :post-id="postId"
            :parent-id="activeReplyId"
            :reply-to-name="activeReplyName"
            @success="handleSuccess"
            @cancel-reply="resetReply"
        />

        <div v-if="loading" class="comment-system__loading">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem" />
        </div>

        <div v-else-if="comments.length > 0" class="comment-system__list">
            <CommentItem
                v-for="comment in comments"
                :key="comment.id"
                :comment="comment"
                @reply="handleReply"
            />
        </div>

        <div v-else class="comment-system__empty">
            <p>{{ $t('comments.no_comments') }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Comment } from '@/types/comment'

const props = defineProps<{
    postId: string
}>()

const comments = ref<Comment[]>([])
const totalCount = ref(0)
const loading = ref(true)

const activeReplyId = ref<string | null>(null)
const activeReplyName = ref<string>('')

// 获取评论列表
const fetchComments = async () => {
    loading.value = true
    try {
        let email = ''
        if (import.meta.browser) {
            const saved = localStorage.getItem('momei_guest_info')
            if (saved) {
                try {
                    email = JSON.parse(saved).email || ''
                } catch (e) {}
            }
        }

        const response = await $fetch<{ code: number, data: Comment[] }>(`/api/posts/${props.postId}/comments`, {
            query: email ? { email } : undefined,
        })
        if (response.code === 200) {
            comments.value = response.data
            // 简单计算总数（含回复）
            totalCount.value = countComments(response.data)
        }
    } catch (error) {
        console.error('Failed to fetch comments:', error)
    } finally {
        loading.value = false
    }
}

const countComments = (list: Comment[]): number => {
    let count = list.length
    list.forEach((item) => {
        if (item.replies && item.replies.length > 0) {
            count += countComments(item.replies)
        }
    })
    return count
}

const handleReply = (comment: Comment) => {
    activeReplyId.value = comment.id
    activeReplyName.value = comment.authorName
    // 滚动到表单
    document.querySelector('.comment-form')?.scrollIntoView({ behavior: 'smooth' })
}

const resetReply = () => {
    activeReplyId.value = null
    activeReplyName.value = ''
}

const handleSuccess = () => {
    resetReply()
    fetchComments()
}

onMounted(() => {
    fetchComments()
})
</script>

<style lang="scss" scoped>
.comment-system {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--p-content-border-color);

  &__header {
    margin-bottom: 1.5rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }

  &__count {
    font-size: 1rem;
    font-weight: 400;
    color: var(--p-text-color-secondary);
    margin-left: 0.5rem;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: 3rem 0;
    color: var(--p-primary-color);
  }

  &__list {
    margin-top: 2rem;
  }

  &__empty {
    padding: 3rem 0;
    text-align: center;
    color: var(--p-text-color-secondary);
    font-style: italic;
  }
}
</style>
