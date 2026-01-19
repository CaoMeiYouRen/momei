<script setup lang="ts">
/**
 * 验证码组件，支持多种提供者
 * 目前支持：cloudflare-turnstile, google-recaptcha, hcaptcha, captchafox
 */
const config = useRuntimeConfig()
const provider = config.public.authCaptcha?.provider as
    | 'cloudflare-turnstile'
    | 'google-recaptcha'
    | 'hcaptcha'
    | 'captchafox'
    | undefined
const siteKey = config.public.authCaptcha?.siteKey

const emit = defineEmits<{
    'update:modelValue': [value: string]
    error: [error: any]
    expire: []
}>()

defineProps<{
    modelValue: string
}>()

const container = ref<HTMLElement | null>(null)
const widgetId = ref<any>(null)

const isEnabled = computed(() => !!(provider && siteKey))

const onVerify = (token: string) => {
    emit('update:modelValue', token)
}

const onExpire = () => {
    emit('update:modelValue', '')
    emit('expire')
}

const onError = (error: any) => {
    emit('error', error)
}

const loadScript = (src: string, onLoad: () => void) => {
    // 检查是否已存在
    const scripts = document.getElementsByTagName('script')
    for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i]
        if (s && s.src === src) {
            if (s.getAttribute('data-loaded') === 'true') {
                onLoad()
            } else {
                s.addEventListener('load', onLoad)
            }
            return
        }
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => {
        script.setAttribute('data-loaded', 'true')
        onLoad()
    }
    document.head.appendChild(script)
}

const renderCaptcha = () => {
    if (!container.value || !isEnabled.value) return

    switch (provider) {
        case 'cloudflare-turnstile':
            if (window.turnstile) {
                widgetId.value = window.turnstile.render(container.value!, {
                    sitekey: siteKey,
                    callback: onVerify,
                    'expired-callback': onExpire,
                    'error-callback': onError,
                })
            } else {
                loadScript(
                    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
                    renderCaptcha,
                )
            }
            break
        case 'google-recaptcha':
            if (window.grecaptcha) {
                window.grecaptcha.ready(() => {
                    widgetId.value = window.grecaptcha!.render(
                        container.value!,
                        {
                            sitekey: siteKey,
                            callback: onVerify,
                            'expired-callback': onExpire,
                            'error-callback': onError,
                        },
                    )
                })
            } else {
                loadScript(
                    'https://www.google.com/recaptcha/api.js?render=explicit',
                    renderCaptcha,
                )
            }
            break
        case 'hcaptcha':
            if (window.hcaptcha) {
                widgetId.value = window.hcaptcha.render(container.value!, {
                    sitekey: siteKey,
                    callback: onVerify,
                    'expired-callback': onExpire,
                    'error-callback': onError,
                })
            } else {
                loadScript(
                    'https://js.hcaptcha.com/1/api.js?render=explicit',
                    renderCaptcha,
                )
            }
            break
        case 'captchafox':
            if (window.captchafox) {
                widgetId.value = window.captchafox.render(container.value!, {
                    sitekey: siteKey,
                    onVerify,
                    onExpire,
                    onError,
                })
            } else {
                loadScript(
                    'https://cfox.app/js/api.js?render=explicit',
                    renderCaptcha,
                )
            }
            break
    }
}

onMounted(() => {
    if (isEnabled.value) {
        renderCaptcha()
    }
})

onUnmounted(() => {
    if (!widgetId.value) return
    try {
        if (provider === 'cloudflare-turnstile') {
            window.turnstile?.remove(widgetId.value)
        } else if (provider === 'hcaptcha') {
            window.hcaptcha?.remove(widgetId.value)
        }
    } catch (e) {
        console.warn('Failed to remove captcha widget:', e)
    }
})

// 为外部提供重置方法
defineExpose({
    reset: () => {
        emit('update:modelValue', '')
        if (!widgetId.value) return
        try {
            if (provider === 'cloudflare-turnstile') {
                window.turnstile?.reset(widgetId.value)
            } else if (provider === 'google-recaptcha') {
                window.grecaptcha?.reset(widgetId.value)
            } else if (provider === 'hcaptcha') {
                window.hcaptcha?.reset(widgetId.value)
            } else if (provider === 'captchafox') {
                window.captchafox?.reset(widgetId.value)
            }
        } catch (e) {
            console.warn('Failed to reset captcha widget:', e)
        }
    },
})
</script>

<template>
    <div
        v-if="isEnabled"
        ref="container"
        class="app-captcha"
    />
</template>

<script lang="ts">
// 扩展 Window 接口以支持验证码 SDK
declare global {
    interface Window {
        turnstile?: {
            render: (el: HTMLElement, options: any) => string
            reset: (id: string) => void
            remove: (id: string) => void
        }
        grecaptcha?: {
            ready: (cb: () => void) => void
            render: (el: HTMLElement, options: any) => any
            reset: (id: any) => void
        }
        hcaptcha?: {
            render: (el: HTMLElement, options: any) => string
            reset: (id: string) => void
            remove: (id: string) => void
        }
        captchafox?: {
            render: (el: HTMLElement, options: any) => string
            reset: (id: string) => void
        }
    }
}
</script>

<style lang="scss" scoped>
.app-captcha {
    margin: 1rem 0;
    display: flex;
    justify-content: center;
    min-height: 74px; // 预留高度，防止布局抖动
}
</style>
