<template>
    <div class="comment-form">
        <div v-if="parentId" class="comment-form__replying-to">
            <span>{{ $t('comments.replying_to') }} @{{ replyToName }}</span>
            <Button
                icon="pi pi-times"
                severity="secondary"
                text
                rounded
                size="small"
                @click="$emit('cancel-reply')"
            />
        </div>

        <form @submit.prevent="handleSubmit">
            <div v-if="!user" class="comment-form__guest-info">
                <div class="comment-form__field">
                    <label for="nickname">{{ $t('comments.nickname') }}*</label>
                    <InputText
                        id="nickname"
                        v-model="form.authorName"
                        :placeholder="$t('comments.nickname_placeholder')"
                        required
                        fluid
                    />
                </div>
                <div class="comment-form__field">
                    <label for="email">{{ $t('comments.email') }}*</label>
                    <InputText
                        id="email"
                        v-model="form.authorEmail"
                        type="email"
                        :placeholder="$t('comments.email_placeholder')"
                        required
                        fluid
                    />
                </div>
                <div class="comment-form__field">
                    <label for="website">{{ $t('comments.website') }}</label>
                    <InputText
                        id="website"
                        v-model="form.authorUrl"
                        type="url"
                        :placeholder="$t('comments.website_placeholder')"
                        fluid
                    />
                </div>
            </div>

            <div class="comment-form__content">
                <Textarea
                    v-model="form.content"
                    :placeholder="user ? $t('comments.content_placeholder_logged_in') : $t('comments.content_placeholder_guest')"
                    rows="4"
                    required
                    auto-resize
                    fluid
                />
            </div>

            <div class="comment-form__footer">
                <p v-if="!user" class="comment-form__tip">
                    {{ $t('comments.guest_tip') }}
                </p>
                <Button
                    type="submit"
                    :label="$t('comments.submit')"
                    :loading="submitting"
                    icon="pi pi-send"
                />
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
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

const form = reactive({
    authorName: '',
    authorEmail: '',
    authorUrl: '',
    content: '',
})

// 初始化用户信息
watchEffect(() => {
    if (user.value) {
        form.authorName = user.value.name || ''
        form.authorEmail = user.value.email || ''
    } else if (import.meta.browser) {
        // 尝试从本地存储读取游客信息
        const saved = localStorage.getItem('momei_guest_info')
        if (saved) {
            try {
                const data = JSON.parse(saved)
                form.authorName = data.name || ''
                form.authorEmail = data.email || ''
                form.authorUrl = data.url || ''
            } catch (e) {}
        }
    }
})

const handleSubmit = async () => {
    submitting.value = true
    try {
        const payload = {
            ...form,
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
                name: form.authorName,
                email: form.authorEmail,
                url: form.authorUrl,
            }))
        }

        form.content = ''
        toast.add({
            severity: 'success',
            summary: t('success'),
            detail: user.value ? t('save_success') : t('comments.pending_audit'),
            life: 5000,
        })
        emit('success')
    } catch (error: any) {
        console.error('Comment submission failed:', error)
        toast.add({
            severity: 'error',
            summary: t('error'),
            detail: error.statusMessage || error.message || t('unexpected_error'),
            life: 3000,
        })
    } finally {
        submitting.value = false
    }
}
</script>

<style lang="scss" scoped>
.comment-form {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 0.75rem;
  background-color: var(--p-surface-0);
  border: 1px solid var(--p-surface-border);

  &__replying-to {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
    background-color: var(--p-primary-100);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: var(--p-primary-700);
  }

  &__guest-info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;

    @media (width <= 768px) {
      grid-template-columns: 1fr;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;

    label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--p-text-color-secondary);
    }
  }

  &__content {
    margin-bottom: 1rem;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
  }

  &__tip {
    font-size: 0.75rem;
    color: var(--p-text-color-secondary);
    margin: 0;
  }
}
</style>
