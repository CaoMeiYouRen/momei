<template>
    <div class="redirect-gate">
        <div v-if="pending" class="loading">
            <ProgressSpinner />
            <p>{{ $t('redirect.loading') }}</p>
        </div>

        <div v-else-if="errorMessage" class="error">
            <i class="pi pi-exclamation-triangle" />
            <h2>{{ $t('redirect.error.title') }}</h2>
            <p>{{ errorMessage }}</p>
            <Button
                :label="$t('redirect.back_home')"
                icon="pi pi-home"
                @click="navigateTo(localePath('/'))"
            />
        </div>

        <div v-else-if="redirectData" class="redirect-info">
            <div class="icon">
                <i class="pi pi-external-link" />
            </div>

            <h2>{{ $t('redirect.leaving_site') }}</h2>

            <div class="target-info">
                <img
                    v-if="redirectData.favicon"
                    :src="redirectData.favicon"
                    class="favicon"
                    alt=""
                    onerror="this.style.display='none'"
                >
                <span class="url">{{ redirectData.url }}</span>
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
                    @click="handleCancel"
                />
            </div>

            <p class="disclaimer">
                {{ $t('redirect.disclaimer') }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { ApiResponse } from '@/types/api'
import { useRoute, useRouter } from 'vue-router'
import { useLocalePath } from '#i18n'

interface RedirectData {
    url: string
    favicon: string
    title: string
    showRedirectPage: boolean
}

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()

const code = route.params.code as string
const countdown = ref(3)
let timer: ReturnType<typeof setInterval> | null = null

const { data: response, pending, error } = await useFetch<ApiResponse<RedirectData>>(`/api/goto/${code}`)

const redirectData = computed<RedirectData | null>(() => {
    if (response.value?.code !== 200 || !response.value.data) {
        return null
    }

    return response.value.data
})

const errorMessage = computed(() => {
    if (error.value) {
        return error.value.message
    }

    if (response.value && response.value.code !== 200) {
        return t('redirect.error.message')
    }

    return ''
})

function navigateToUrl() {
    if (redirectData.value?.url) {
        window.location.href = redirectData.value.url
    }
}

function handleCancel() {
    if (window.history.length > 1) {
        router.back()
        return
    }

    navigateTo(localePath('/'))
}

onMounted(() => {
    if (redirectData.value?.url && redirectData.value.showRedirectPage !== false) {
        // 开始倒计时
        timer = setInterval(() => {
            countdown.value--
            if (countdown.value <= 0) {
                if (timer) clearInterval(timer)
                navigateToUrl()
            }
        }, 1000)
    } else if (redirectData.value?.url) {
        // 如果不需要显示跳转页，直接跳转
        navigateToUrl()
    }
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
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
