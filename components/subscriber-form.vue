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
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.subscriber-form {
    @include card-base($spacing-xl);
    @include hover-lift;

    background: linear-gradient(135deg, var(--p-surface-50) 0%, var(--p-surface-100) 100%);
    max-width: 600px;
    margin: 0 auto;

    &__title {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: $spacing-sm;
        color: var(--p-text-color);
        letter-spacing: -0.025em;
    }

    &__desc {
        color: var(--p-text-muted-color);
        font-size: 1rem;
        margin-bottom: $spacing-xl;
        line-height: 1.6;
    }

    &__body {
        max-width: 600px;
    }

    &__input-group {
        display: flex;
        flex-direction: column;
        gap: $spacing-sm;

        @include respond-to("sm") {
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
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border-radius: $border-radius-md;
        border: 1px solid var(--p-surface-300);
        transition: border-color $transition-fast, box-shadow $transition-fast;

        &:focus {
            border-color: var(--p-primary-500);
            box-shadow: 0 0 0 2px var(--p-primary-100);
        }
    }

    &__submit {
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        border-radius: $border-radius-md;
        white-space: nowrap;
        justify-content: center;
    }

    &__message {
        animation: slide-in $transition-base;
    }
}

@keyframes slide-in {
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
    transition: opacity $transition-base;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

:global(.dark) .subscriber-form {
    background: linear-gradient(135deg, var(--p-surface-0) 0%, var(--p-surface-50) 100%);
    border-color: var(--p-surface-100);
    box-shadow: 0 4px 20px rgb(0 0 0 / 0.2);

    /* 内部输入框样式 */
    &__input {
        background: var(--p-surface-100);
        border-color: var(--p-surface-200);

        &:focus {
            background: var(--p-surface-200);
        }
    }
}
</style>
