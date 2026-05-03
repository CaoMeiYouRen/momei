import { useI18n } from 'vue-i18n'
import type { AdLocation } from '@/types/ad'

/**
 * 广告注入 Composable
 * 用于在文章内容中注入广告
 *
 * @author Claude Code
 * @date 2026-03-03
 */
export function useAdInjection() {
    const { locale } = useI18n()

    /**
     * 在文章内容中注入广告
     * @param content 文章 HTML 内容
     * @param context 文章上下文
     * @returns 注入后的 HTML
     */
    async function injectAds(
        content: string,
    ): Promise<string> {
        try {
            // 获取中部和底部广告位
            const response = await $fetch<{
                data: {
                    id: string
                    location: AdLocation
                    name: string
                    metadata: Record<string, unknown>
                }[]
            }>('/api/ads/placements', {
                params: {
                    location: 'content_middle', // 先获取中部广告
                    locale: locale.value,
                },
            })

            if (!response.data?.length) {
                return content // 没有广告位，返回原内容
            }

            const placements = response.data
            const parser = new DOMParser()
            const doc = parser.parseFromString(content, 'text/html')
            const paragraphs = doc.querySelectorAll('p')

            if (paragraphs.length === 0) {
                return content
            }

            // 在约 50% 位置插入广告
            const middleIndex = Math.floor(paragraphs.length * 0.5)
            const placement = placements[0] // 取优先级最高的

            if (placement && paragraphs[middleIndex]) {
                const adDiv = doc.createElement('div')
                adDiv.className = `ad-injected ad-${placement.location}`
                adDiv.setAttribute('data-ad-placement-id', placement.id)
                adDiv.innerHTML = generateAdPlaceholder(placement)

                paragraphs[middleIndex].after(adDiv)
            }

            return doc.body.innerHTML
        } catch (error) {
            console.warn('Failed to inject ads:', error)
            return content
        }
    }

    /**
     * 生成广告占位符 HTML
     */
    function generateAdPlaceholder(placement: {
        id: string
        location: AdLocation
        name: string
        metadata: Record<string, unknown>
    }): string {
        return `
            <div class="ad-placeholder" data-placement-id="${placement.id}">
                <div class="ad-placeholder__label">Advertisement</div>
                <div class="ad-placeholder__content" data-adapter="adsense" data-slot="${(placement.metadata as { slot?: string }).slot || ''}">
                    Loading ad...
                </div>
            </div>
        `.trim()
    }

    /**
     * 获取指定位置的广告位
     */
    async function getPlacementsByLocation(
        location: AdLocation,
        context?: {
            categories?: string[]
            tags?: string[]
        },
    ) {
        const params = new URLSearchParams({
            location,
            locale: locale.value,
        })

        if (context?.categories) {
            context.categories.forEach((cat) => params.append('categories', cat))
        }
        if (context?.tags) {
            context.tags.forEach((tag) => params.append('tags', tag))
        }

        const response = await $fetch<{
            data: {
                id: string
                name: string
                location: AdLocation
                format: string
                adapterId: string
                metadata: Record<string, unknown>
                customCss: string | null
            }[]
        }>(`/api/ads/placements?${params.toString()}`)

        return response.data || []
    }

    return {
        injectAds,
        getPlacementsByLocation,
    }
}
