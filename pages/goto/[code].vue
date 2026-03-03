<template>
    <div class="redirect-gate">
        <div v-if="pending" class="loading">
            <ProgressSpinner />
            <p>{{ $t('redirect.loading') }}</p>
        </div>

        <div v-else-if="error" class="error">
            <i class="pi pi-exclamation-triangle" />
            <h2>{{ $t('redirect.error.title') }}</h2>
            <p>{{ error }}</p>
            <Button
                :label="$t('redirect.back_home')"
                icon="pi pi-home"
                @click="navigateTo(localePath('/'))"
            />
        </div>

        <div v-else-if="data" class="redirect-info">
            <div class="icon">
                <i class="pi pi-external-link" />
            </div>

            <h2>{{ $t('redirect.leaving_site') }}</h2>

            <div class="target-info">
                <img
                    v-if="data.favicon"
                    :src="data.favicon"
                    class="favicon"
                    alt=""
                    onerror="this.style.display='none'"
                >
                <span class="url">{{ data.url }}</span>
            </div>

            <div v-if="countdown > 0" class="countdown">
                {{ $t('redirect.auto_continue', {seconds: countdown}) }}
            </div>

            <div class="actions">
                <Button
                    :label="$t('redirect.continue_now')"
                    @click="navigateToUrl"
                />
                <Button
                    :label="$t('redirect.cancel')"
                    severity="secondary"
                    @click="$router.back()"
                />
            </div>

            <p class="disclaimer">
                {{ $t('redirect.disclaimer') }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocalePath } from '#i18n'

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()

const code = route.params.code as string
const countdown = ref(3)
let timer: ReturnType<typeof setInterval> | null = null
let redirectTimer: ReturnType<typeof setTimeout> | null = null

const { data, pending, error } = await useFetch<{
    url: string
    favicon: string
    title: string
    showRedirectPage: boolean
}>(`/api/goto/${code}`)

function navigateToUrl() {
    if (data.value?.url) {
        window.location.href = data.value.url
    }
}

onMounted(() => {
    if (data.value?.url && data.value.showRedirectPage !== false) {
        // 开始倒计时
        timer = setInterval(() => {
            countdown.value--
            if (countdown.value <= 0) {
                if (timer) clearInterval(timer)
                navigateToUrl()
            }
        }, 1000)

        // 3秒后自动跳转
        redirectTimer = setTimeout(() => {
            navigateToUrl()
        }, 3000)
    } else if (data.value?.url) {
        // 如果不需要显示跳转页，直接跳转
        navigateToUrl()
    }
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
    if (redirectTimer) clearTimeout(redirectTimer)
})
</script>

<style scoped lang="scss">
.redirect-gate {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;

    .loading,
    .error,
    .redirect-info {
        text-align: center;
        max-width: 500px;
        width: 100%;
    }

    .icon {
        font-size: 3rem;
        color: var(--primary-color);
        margin-bottom: 1rem;
    }

    .error {
        .icon {
            color: var(--error-color);
        }

        h2 {
            margin: 1rem 0;
        }

        p {
            color: var(--text-color-secondary);
            margin-bottom: 1.5rem;
        }
    }

    .target-info {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem;
        background: var(--surface-ground);
        border-radius: var(--border-radius);
        margin: 1.5rem 0;

        .favicon {
            width: 1.5rem;
            height: 1.5rem;
            flex-shrink: 0;
        }

        .url {
            font-family: monospace;
            word-break: break-all;
            font-size: 0.9rem;
            color: var(--text-color);
        }
    }

    .countdown {
        font-size: 1.1rem;
        color: var(--primary-color);
        font-weight: 500;
        margin: 1rem 0;
    }

    .actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin: 2rem 0;
        flex-wrap: wrap;
    }

    .disclaimer {
        font-size: 0.875rem;
        color: var(--text-color-secondary);
        line-height: 1.5;
    }

    h2 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }
}
</style>
