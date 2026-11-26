<template>
    <div class="comment-form">
        <div v-if="parentId" class="comment-form__replying-to">
            <span>{{ $t('comments.replying_to') }} @{{ replyToName }}</span>
            <CaomeiButton
                variant="ghost"
                rounded
                icon-only
                size="sm"
                :label="$t('common.cancel')"
                @click="$emit('cancel-reply')"
            >
                <template #icon>
                    <X :size="14" />
                </template>
            </CaomeiButton>
        </div>

        <form @submit.prevent="handleSubmit">
            <div v-if="!user" class="comment-form__guest-info">
                <div class="comment-form__field">
                    <label for="nickname">{{ $t('comments.nickname') }}*</label>
                    <CaomeiInput
                        id="nickname"
                        v-model="form.authorName"
                        autocomplete="nickname"
                        enterkeyhint="next"
                        :placeholder="$t('comments.nickname_placeholder')"
                        required
                    />
                </div>
                <div class="comment-form__field">
                    <label for="email">{{ $t('comments.email') }}*</label>
                    <CaomeiInput
                        id="email"
                        v-model="form.authorEmail"
                        type="email"
                        autocomplete="email"
                        inputmode="email"
                        enterkeyhint="next"
                        :placeholder="$t('comments.email_placeholder')"
                        required
                    />
                </div>
                <div class="comment-form__field">
                    <label for="website">{{ $t('comments.website') }}</label>
                    <CaomeiInput
                        id="website"
                        v-model="form.authorUrl"
                        type="url"
                        autocomplete="url"
                        inputmode="url"
                        enterkeyhint="next"
                        :placeholder="$t('comments.website_placeholder')"
                    />
                </div>
            </div>

            <div class="comment-form__content">
                <CaomeiTextarea
                    v-model="form.content"
                    enterkeyhint="enter"
                    :placeholder="user ? $t('comments.content_placeholder_logged_in') : $t('comments.content_placeholder_guest')"
                    :rows="4"
                    required
                    auto-resize
                />
            </div>

            <div class="comment-form__footer">
                <p v-if="!user" class="comment-form__tip">
                    {{ $t('comments.guest_tip') }}
                </p>
                <CaomeiButton
                    type="submit"
                    class="comment-form__submit"
                    :loading="submitting"
                >
                    <template #icon>
                        <Send :size="16" />
                    </template>
                    {{ $t('comments.submit') }}
                </CaomeiButton>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { Send, X } from '@lucide/vue'
import { authClient } from '@/lib/auth-client'

const { t } = useI18n()
const toast = useToast()
const session = authClient.useSession()
const user = computed(() => session.value?.data?.user)

const props = defineProps<{
    postId: string
    parentId?: string | null
    replyToName?: string
}>()

const emit = defineEmits<{
    (e: 'success'): void
    (e: 'cancel-reply'): void
}>()

const submitting = ref(false)

const form = ref({
    authorName: '',
    authorEmail: '',
    authorUrl: '',
    content: '',
})

// 初始化用户信息
watchEffect(() => {
    if (user.value) {
        form.value.authorName = user.value.name || ''
        form.value.authorEmail = user.value.email || ''
    } else if (import.meta.browser) {
        // 尝试从本地存储读取游客信息
        const saved = localStorage.getItem('momei_guest_info')
        if (saved) {
            try {
                const data = JSON.parse(saved)
                form.value.authorName = data.name || ''
                form.value.authorEmail = data.email || ''
                form.value.authorUrl = data.url || ''
            } catch (e) {}
        }
    }
})

const handleSubmit = async () => {
    submitting.value = true
    try {
        const payload = {
            ...form.value,
            postId: props.postId,
            parentId: props.parentId || null,
        }

        await $fetch(`/api/posts/${props.postId}/comments`, {
            method: 'POST',
            body: payload,
        })

        // 保存游客信息到本地
        if (!user.value) {
            localStorage.setItem('momei_guest_info', JSON.stringify({
                name: form.value.authorName,
                email: form.value.authorEmail,
                url: form.value.authorUrl,
            }))
        }

        form.value.content = ''
        toast.show({
            tone: 'success',
            title: t('common.success'),
            description: user.value ? t('common.save_success') : t('comments.pending_audit'),
            duration: 5000,
        })
        emit('success')
    } catch (error: any) {
        console.error('Comment submission failed:', error)
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: error.statusMessage || error.message || t('common.unexpected_error'),
            duration: 3000,
        })
    } finally {
        submitting.value = false
    }
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

/* 公开评论框的移动端可用性：输入字号 ≥16px 防止 iOS 聚焦缩放，提交按钮补足触控高度。 */
@media (width <= 768px), (pointer: coarse) {
    .comment-form {
        :deep(input),
        :deep(textarea) {
            font-size: 16px;
        }

        /* 子组件根节点带自己的 scope id，需通过 :deep 命中。 */
        :deep(.comment-form__submit) {
            min-height: 44px;
        }
    }
}

.comment-form {
  @include card-base($spacing-lg);

  margin-top: $spacing-xl;

  &__replying-to {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    padding: $spacing-sm $spacing-md;
    background-color: var(--m-primary-100);
    border-radius: $border-radius-md;
    font-size: var(--m-font-size-sm);
    color: var(--m-primary-700);
  }

  &__guest-info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: $spacing-md;
    margin-bottom: $spacing-md;

    @media (width <= 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__field {
    @include form-field;
  }

  &__content {
    margin-bottom: $spacing-md;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: $spacing-md;
  }

  &__tip {
    font-size: var(--m-font-size-xs);
    color: var(--caomei-color-text-muted);
    margin: 0;
  }
}
</style>
