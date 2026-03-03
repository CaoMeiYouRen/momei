<template>
    <div
        v-if="shouldShow"
        class="ad-placement"
        :class="`ad-${location}`"
        :style="customStyle"
    >
        <div v-if="showLabel" class="ad-placement__label">
            {{ $t('common.advertisement') }}
        </div>
        <div
            class="ad-placement__content"
            :data-ad-location="location"
            v-html="placementHtml"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useFetch } from '#app'
import { useI18n } from 'vue-i18n'
import type { AdLocation } from '@/types/ad'

interface AdPlacementData {
    id: string
    name: string
    location: AdLocation
    format: string
    adapterId: string
    metadata: Record<string, any>
    customCss: string | null
}

const props = defineProps<{
    location: AdLocation
    context?: {
        postId?: string
        categories?: string[]
        tags?: string[]
    }
    showLabel?: boolean
}>()

const { locale } = useI18n()

// 获取广告位配置
const { data: placement, pending } = await useFetch<AdPlacementData>(() => {
    const params = new URLSearchParams({
        location: props.location,
        locale: locale.value,
    } as Record<string, string>)

    // 添加可选的上下文参数
    if (props.context?.categories) {
        props.context.categories.forEach((cat) => params.append('categories', cat))
    }
    if (props.context?.tags) {
        props.context.tags.forEach((tag) => params.append('tags', tag))
    }

    return `/api/ads/placements?${params.toString()}`
})

// 检查是否应该展示
const shouldShow = computed(() => {
    return !pending.value && placement.value
})

// 广告位 HTML（带适配器渲染）
const placementHtml = computed(() => {
    if (!placement.value) return ''

    // 如果适配器返回的是纯 HTML，直接使用
    // 这里假设后端已经渲染好了 HTML
    // 后端也可以只返回元数据，让前端用适配器渲染
    return generateAdHtml(placement.value)
})

// 自定义样式
const customStyle = computed(() => {
    if (!placement.value?.customCss) return undefined
    try {
        // 注意：在生产环境中需要 CSP 安全检查
        return placement.value.customCss
    } catch {
        return undefined
    }
})

// 生成广告 HTML
function generateAdHtml(data: AdPlacementData): string {
    const { adapterId, metadata } = data

    // 根据不同适配器生成 HTML
    // 这里为了简化，假设后端已经处理好了 HTML 渲染
    // 实际使用时可以改为前端渲染
    return `<div class="ad-slot" data-adapter="${adapterId}" data-slot="${metadata.slot || ''}">Advertisement</div>`
}

// 加载适配器脚本（如果需要）
onMounted(() => {
    if (placement.value?.adapterId) {
        loadAdapterScript(placement.value.adapterId)
    }
})

// 加载适配器脚本
async function loadAdapterScript(adapterId: string) {
    // 检查是否已加载
    if (document.querySelector(`script[data-ad-adapter="${adapterId}"]`)) {
        return
    }

    try {
        const { data } = await useFetch<{ script: string }>(`/api/ads/script?adapter=${adapterId}`)
        if (data.value?.script) {
            const script = document.createElement('script')
            script.innerHTML = data.value.script
            script.setAttribute('data-ad-adapter', adapterId)
            document.head.appendChild(script)
        }
    } catch (error) {
        console.warn(`Failed to load ad adapter script: ${adapterId}`, error)
    }
}
</script>

<style scoped lang="scss">
.ad-placement {
    margin: 2rem 0;
    text-align: center;

    &__label {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
        margin-bottom: 0.5rem;
    }

    &__content {
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;

        // 广告加载失败的样式
        &:empty::before {
            content: '';
        }
    }

    // 不同位置的样式
    &.ad-header {
        margin: 1rem 0;
    }

    &.ad-sidebar {
        margin: 1rem 0;
        padding: 1rem 0;
        border-top: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
    }

    &.ad-content_top {
        margin: 1rem 0 2rem;
    }

    &.ad-content_middle {
        margin: 2rem 0;
        clear: both;
    }

    &.ad-content_bottom {
        margin: 2rem 0 1rem;
    }

    &.ad-footer {
        margin: 1rem 0;
        padding: 1rem 0;
        border-top: 1px solid var(--border-color);
    }
}
</style>
