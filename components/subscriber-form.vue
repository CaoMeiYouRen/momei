<template>
    <div class="subscriber-form">
        <h3 class="subscriber-form__title">
            {{ $t('components.subscriber_form.title') }}
        </h3>
        <p class="subscriber-form__desc">
            {{ $t('components.subscriber_form.description') }}
        </p>

        <form class="subscriber-form__body" @submit.prevent="handleSubmit">
            <div class="subscriber-form__input-group">
                <IconField icon-position="left" class="subscriber-form__field">
                    <InputIcon class="pi pi-envelope" />
                    <InputText
                        v-model="email"
                        type="email"
                        :placeholder="$t('components.subscriber_form.placeholder')"
                        required
                        class="subscriber-form__input"
                        :disabled="loading"
                    />
                </IconField>
                <Button
                    type="submit"
                    :label="loading ? $t('components.subscriber_form.submitting') : $t('components.subscriber_form.submit')"
                    :loading="loading"
                    class="subscriber-form__submit"
                />
            </div>
            <transition name="fade">
                <Message
                    v-if="message"
                    :severity="messageType"
                    size="small"
                    variant="simple"
                    class="mt-3 subscriber-form__message"
                >
                    {{ message }}
                </Message>
            </transition>
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
    padding: 2.5rem;
    background: linear-gradient(135deg, var(--p-surface-50) 0%, var(--p-surface-100) 100%);
    border-radius: 16px;
    border: 1px solid var(--p-surface-200);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
    }

    &__title {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
        color: var(--p-text-color);
        letter-spacing: -0.025em;
    }

    &__desc {
        color: var(--p-text-muted-color);
        font-size: 1rem;
        margin-bottom: 2rem;
        line-height: 1.6;
    }

    &__body {
        max-width: 600px;
    }

    &__input-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;

        @media (min-width: 640px) {
            flex-direction: row;
            align-items: stretch;
        }
    }

    &__field {
        flex: 1;
    }

    &__input {
        width: 100%;
        height: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem !important;
        border-radius: 8px !important;
        border: 1px solid var(--p-surface-300) !important;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
            border-color: var(--p-primary-500) !important;
            box-shadow: 0 0 0 2px var(--p-primary-100) !important;
        }
    }

    &__submit {
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        border-radius: 8px !important;
        white-space: nowrap;
        justify-content: center;
    }

    &__message {
        animation: slideIn 0.3s ease-out;
    }
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

:global(.dark) .subscriber-form {
    background: linear-gradient(135deg, var(--p-surface-900) 0%, var(--p-surface-950) 100%);
    border-color: var(--p-surface-800);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

    &__input {
        background: var(--p-surface-800) !important;
        border-color: var(--p-surface-700) !important;

        &:focus {
            background: var(--p-surface-900) !important;
        }
    }
}
</style>
