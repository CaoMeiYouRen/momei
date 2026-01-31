<template>
    <div class="legal-page">
        <div class="legal-page__container">
            <h1 class="legal-page__title">
                {{ $t('pages.privacy_policy.title') }}
            </h1>
            <p class="legal-page__meta">
                {{ $t('pages.privacy_policy.last_updated') }}
            </p>

            <!-- 显示默认示例警告 -->
            <div v-if="isDefault" class="default-notice">
                <p class="default-notice__text">
                    ⚠️ {{ $t('legal.notice') }}
                </p>
            </div>

            <Divider />

            <div
                v-if="content"
                class="legal-page__content"
                v-html="sanitizeHtml(content)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import DOMPurify from 'dompurify'

const content = ref<string>('')
const isDefault = ref(false)
const { t } = useI18n()

useHead({
    title: t('pages.privacy_policy.title'),
})

/**
 * 对 HTML 内容进行清洁，防止 XSS 攻击
 * @param dirty 需要清洁的 HTML 字符串
 * @returns 清洁后的 HTML 字符串
 */
function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty)
}

onMounted(async () => {
    try {
        const { data } = await $fetch<any>('/api/public/agreements/privacy-policy')
        if (data) {
            content.value = data.content
            isDefault.value = data.isDefault || false
        }
    } catch (error) {
        console.error('Failed to fetch privacy policy:', error)
        content.value = getDefaultContent()
        isDefault.value = true
    }
})

function getDefaultContent(): string {
    return `<section>
        <h2>1. 概述</h2>
        <p>本隐私政策说明了本网站如何收集、使用和保护您的个人信息。</p>
    </section>`
}
</script>

<style lang="scss" scoped>
.legal-page {
    padding: 2rem 1rem;
    min-height: 100vh;
    background-color: var(--p-surface-0);

    &__container {
        max-width: 800px;
        margin: 0 auto;
    }

    &__title {
        font-size: 2.25rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: var(--p-text-color);
    }

    &__meta {
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
        margin-bottom: 2rem;
    }

    &__content {
        line-height: 1.75;
        color: var(--p-text-color);

        section {
            margin-bottom: 2rem;
        }

        h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--p-content-border-color);
        }

        p {
            margin-bottom: 1rem;
        }

        ul {
            padding-left: 1.5rem;
            margin-bottom: 1rem;
        }

        .notice {
            background-color: var(--p-surface-100);
            padding: 1rem;
            border-left: 4px solid var(--p-primary-color);
            border-radius: 4px;
            font-style: italic;
        }
    }
}

.default-notice {
    background-color: var(--p-surface-100);
    border-left: 4px solid var(--p-warn-color);
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-radius: 4px;

    &__text {
        color: var(--p-warn-600);
        font-weight: 600;
        margin: 0;
    }
}

:global(.dark) .legal-page {
    background-color: var(--p-surface-950);
}

:global(.dark) .default-notice {
    background-color: var(--p-surface-800);
}
</style>
