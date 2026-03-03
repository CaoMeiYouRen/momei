import { BaseAdAdapter, AdError } from './base'
import { AdPlacement } from '@/server/entities/ad-placement'

/**
 * 百度联盟适配器配置接口
 */
interface BaiduConfig {
    slotId: string // 百度联盟推广位 ID
    userId?: string // 百度联盟用户 ID (可选，某些高级功能需要)
}

/**
 * 百度联盟广告适配器
 * 支持百度联盟展示广告
 *
 * 文档: https://union.baidu.com/customer/center/product
 *
 * @author Claude Code
 * @date 2026-03-03
 */
export class BaiduAdapter extends BaseAdAdapter {
    override id = 'baidu'
    override name = '百度联盟'
    override supportedLocales = ['zh-CN'] // 仅支持中文

    /**
     * 验证配置
     */
    protected override async validateConfig(config: BaiduConfig): Promise<void> {
        if (!config.slotId) {
            throw new AdError('Baidu slot ID is required')
        }

        // 验证 slotId 格式 (通常是数字或特定格式)
        // 百度联盟 slotId 格式可能是: u123456 或纯数字
        if (typeof config.slotId !== 'string' || config.slotId.trim().length === 0) {
            throw new AdError('Invalid Baidu slot ID format')
        }
    }

    /**
     * 验证凭据
     */
    override async verifyCredentials(): Promise<boolean> {
        return !!(this.config as BaiduConfig).slotId
    }

    /**
     * 获取百度联盟初始化脚本
     */
    override getScript(): string {
        // 百度联盟使用的是异步加载脚本
        return `<script type="text/javascript" src="https://cpro.baidustatic.com/cpro/ui/c.js"></script>`
    }

    /**
     * 获取广告位 HTML
     */
    override getPlacementHtml(placement: AdPlacement): string {
        const config = this.config as BaiduConfig
        const metadata = placement.metadata

        if (!metadata) {
            throw new AdError('Ad placement metadata is required for Baidu')
        }

        const slotId = metadata.slotId || config.slotId
        const width = metadata.width || 300
        const height = metadata.height || 250

        if (!slotId) {
            throw new AdError('Baidu slot ID is required in placement metadata or config')
        }

        // 百度联盟标准嵌入代码
        return `
<!-- 百度联盟广告位 -->
<script type="text/javascript">
    (function() {
        var s = "_" + Math.random().toString(36).slice(2);
        document.write('<div id="' + s + '"></div>');
        (window.slotbydup = window.slotbydup || []).push({
            id: '${slotId}',
            container: s,
            size: '${width}*${height}',
            display: 'inlay-fix'
        });
    })();
</script>
        `.trim()
    }

    /**
     * 获取广告单元配置
     */
    getAdUnitConfig(slotId: string, width: number, height: number) {
        return {
            slotId,
            width,
            height,
            adapterId: this.id,
        }
    }
}

/**
 * 百度联盟适配器工厂函数
 */
export function createBaiduAdapter(config?: BaiduConfig): BaiduAdapter {
    const adapter = new BaiduAdapter('baidu', '百度联盟', ['zh-CN'])
    if (config) {
        // Initialize asynchronously but don't wait here
        adapter.initialize(config).catch((err) => {
            console.error('Failed to initialize Baidu adapter:', err)
        })
    }
    return adapter
}
