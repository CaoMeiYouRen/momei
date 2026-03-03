import { AdPlacement } from '@/server/entities/ad-placement'
import { BaseAdAdapter, AdError } from './base'

/**
 * Google AdSense 适配器配置接口
 */
interface AdSenseConfig {
    clientId: string // ca-pub-XXXXXXXXXXXXXXXX
}

/**
 * Google AdSense 广告适配器
 * 支持 Google AdSense 自动广告和手动广告位
 *
 * @author Claude Code
 * @date 2026-03-03
 */
export class AdSenseAdapter extends BaseAdAdapter {
    override id = 'adsense'
    override name = 'Google AdSense'
    override supportedLocales = ['*'] // 支持所有地区

    /**
     * 验证配置
     */
    protected override async validateConfig(config: AdSenseConfig): Promise<void> {
        if (!config.clientId) {
            throw new AdError('AdSense Client ID is required')
        }

        // 验证 Client ID 格式 (ca-pub-XXXXXXXXXXXXXXXX)
        const clientIdPattern = /^ca-pub-\d{16}$/
        if (!clientIdPattern.test(config.clientId)) {
            throw new AdError('Invalid AdSense Client ID format. Expected format: ca-pub-XXXXXXXXXXXXXXXX')
        }
    }

    /**
     * 验证凭据
     * 注意：AdSense 无法通过 API 验证，这里只检查配置是否存在
     */
    override async verifyCredentials(): Promise<boolean> {
        return !!(this.config as AdSenseConfig).clientId
    }

    /**
     * 获取 AdSense 初始化脚本
     */
    override getScript(): string {
        const clientId = (this.config as AdSenseConfig).clientId
        return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}" crossorigin="anonymous"></script>`
    }

    /**
     * 获取广告位 HTML
     */
    override getPlacementHtml(placement: AdPlacement): string {
        const clientId = (this.config as AdSenseConfig).clientId
        const metadata = placement.metadata

        if (!metadata) {
            throw new AdError('Ad placement metadata is required for AdSense')
        }

        const slot = metadata.slot
        const format = metadata.format || 'responsive'

        if (!slot) {
            throw new AdError('AdSense slot ID is required in placement metadata')
        }

        const displayStyle = format === 'responsive' ? 'block' : 'inline-block'
        const dataAdFormat = format === 'auto' ? 'auto' : format

        return `
<ins class="adsbygoogle"
     style="display:${displayStyle}"
     data-ad-client="${clientId}"
     data-ad-slot="${slot}"
     data-ad-format="${dataAdFormat}"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        `.trim()
    }

    /**
     * 获取广告单元配置
     */
    getAdUnitConfig(slot: string) {
        return {
            clientId: (this.config as AdSenseConfig).clientId,
            slot,
        }
    }
}

/**
 * AdSense 适配器工厂函数
 */
export function createAdSenseAdapter(): AdSenseAdapter {
    return new AdSenseAdapter('adsense', 'Google AdSense', ['*'])
}
