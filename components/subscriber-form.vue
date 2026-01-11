<template>
    <div class="subscriber-form">
        <h3 class="subscriber-form__title">
            {{ $t('components.subscriber_form.title') }}
        </h3>
        <p class="subscriber-form__desc">
            {{ $t('components.subscriber_form.description') }}
        </p>

        <form class="subscriber-form__body" @submit.prevent="handleSubmit">
            <div class="flex gap-2">
                <IconField icon-position="left" class="flex-1">
                    <InputIcon class="pi pi-envelope" />
                    <InputText
                        v-model="email"
                        type="email"
                        :placeholder="$t('components.subscriber_form.placeholder')"
                        required
                        class="w-full"
                        :disabled="loading"
                    />
                </IconField>
                <Button
                    type="submit"
                    :label="loading ? $t('components.subscriber_form.submitting') : $t('components.subscriber_form.submit')"
                    :loading="loading"
                />
            </div>
            <Message
                v-if="message"
                :severity="messageType"
                size="small"
                variant="simple"
                class="mt-2"
            >
                {{ message }}
            </Message>
        </form>
    </div>
</template>

<script setup lang="ts">
import { authClient } from '@/lib/auth-client'

const { t, locale } = useI18n()
const email = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'secondary'>('secondary')

// 如果用户已登录，预填充其邮箱
const session = authClient.useSession()
watchEffect(() => {
    if (session.value?.data?.user?.email && !email.value) {
        email.value = session.value.data.user.email
    }
})

const handleSubmit = async () => {
    if (!email.value) return

    loading.value = true
    message.value = ''
    try {
        const res = await $fetch('/api/subscribe', {
            method: 'POST',
            body: {
                email: email.value,
                language: locale.value,
            },
        })

        if (res.code === 200) {
            message.value = t('components.subscriber_form.success')
            messageType.value = 'success'
            // 订阅成功后不一定需要清空，如果是已登录用户可能还想看到自己的邮箱，
            // 但为了交互反馈，清空或者保持都可以。这里选择清空。
            if (!session.value?.data?.user?.email) {
                email.value = ''
            }
        }
    } catch (error: any) {
        // 后端现在统一返回 200 (幂等)，所以通常不会走到 error
        // 除非是验证失败或其他意外错误
        message.value = error.data?.message || t('common.unexpected_error')
        messageType.value = 'error'
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
.subscriber-form {
    padding: 1.5rem;
    background: var(--surface-section);
    border-radius: 12px;
    border: 1px solid var(--surface-border);

    &__title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--text-color);
    }

    &__desc {
        color: var(--text-color-secondary);
        font-size: 0.875rem;
        margin-bottom: 1.25rem;
    }

    &__body {
        max-width: 500px;
    }
}

:global(.dark) .subscriber-form {
    background: var(--surface-card);
}
</style>
