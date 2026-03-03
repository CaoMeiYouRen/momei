import { BaseAdAdapter, AdError } from './base'
import { AdPlacement } from '@/server/entities/ad-placement'

/**
 * 腾讯广告适配器配置接口
 */
interface TencentConfig {
    appId: string // 腾讯广告应用 ID
    placementId?: string // 默认广告位 ID
}

/**
 * 腾讯广告适配器
 * 支持广点通（腾讯广告）展示广告
 *
 * 文档: https://e.qq.com/dev/
 *
 * @author Claude Code
 * @date 2026-03-03
 */
export class TencentAdapter extends BaseAdAdapter {
    override id = 'tencent'
    override name = '腾讯广告 (广点通)'
    override supportedLocales = ['zh-CN'] // 主要支持中文

    /**
     * 验证配置
     */
    protected override async validateConfig(config: TencentConfig): Promise<void> {
        if (!config.appId) {
            throw new AdError('Tencent App ID is required')
        }

        // 验证 appId 格式 (腾讯广告 App ID 格式)
        const appIdPattern = /^\d+$/
        if (!appIdPattern.test(config.appId)) {
            throw new AdError('Invalid Tencent App ID format. Expected numeric ID')
        }
    }

    /**
     * 验证凭据
     */
    override async verifyCredentials(): Promise<boolean> {
        return !!(this.config as TencentConfig).appId
    }

    /**
     * 获取腾讯广告初始化脚本
     */
    override getScript(): string {
        const appId = (this.config as TencentConfig).appId
        // 腾讯广告 SDK 初始化脚本
        return `
<script>
window.TencentGDT = window.TencentGDT || [];
window.TencentGDT.push({
    app_id: '${appId}',
    placement_id: window.tencentAdPlacementId || '',
    type: 'native', // 原生广告类型
    count: 1,
    muid: '', // 可选的用户标识
};
(function() {
    var doc = document;
    var script = doc.createElement('script');
    script.src = '//qzs.qq.com/qzone/biz/res/i.js';
    script.async = true;
    var s = doc.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(script, s);
})();
</script>
        `.trim()
    }

    /**
     * 获取广告位 HTML
     */
    override getPlacementHtml(placement: AdPlacement): string {
        const config = this.config as TencentConfig
        const metadata = placement.metadata

        if (!metadata) {
            throw new AdError('Ad placement metadata is required for Tencent')
        }

        const placementId = metadata.placementId || config.placementId
        const width = metadata.width || 300
        const height = metadata.height || 250
        const adType = metadata.adType || 'banner' // banner, native, feed, etc.

        if (!placementId) {
            throw new AdError('Tencent placement ID is required in placement metadata or config')
        }

        // 根据广告类型返回不同的 HTML
        if (adType === 'native') {
            return this.getNativeAdHtml(placementId)
        }

        return this.getBannerAdHtml(placementId, width, height)
    }

    /**
     * 获取 Banner 广告 HTML
     */
    private getBannerAdHtml(placementId: string, width: number, height: number): string {
        return `
<!-- 腾讯广告 Banner 位 -->
<div id="tencent_ad_${placementId}" style="width:${width}px;height:${height}px;display:inline-block;">
    <script type="text/javascript">
        (function() {
            var containerId = 'tencent_ad_${placementId}';
            var container = document.getElementById(containerId);
            if (container && window.TencentGDT) {
                window.TencentGDT.push({
                    placement_id: '${placementId}',
                    container_id: containerId,
                    type: 'banner',
                    display: 'inlay-fix'
                });
            }
        })();
    </script>
</div>
        `.trim()
    }

    /**
     * 获取原生广告 HTML
     */
    private getNativeAdHtml(placementId: string): string {
        return `
<!-- 腾讯广告原生位 -->
<div class="tencent-native-ad" data-placement-id="${placementId}">
    <script type="text/javascript">
        (function() {
            if (window.TencentGDT) {
                window.TencentGDT.push({
                    placement_id: '${placementId}',
                    type: 'native',
                    count: 1
                });
            }
        })();
    </script>
</div>
        `.trim()
    }

    /**
     * 获取广告单元配置
     */
    getAdUnitConfig(placementId: string, width: number, height: number) {
        return {
            appId: (this.config as TencentConfig).appId,
            placementId,
            width,
            height,
            adapterId: this.id,
        }
    }
}

/**
 * 腾讯广告适配器工厂函数
 */
export function createTencentAdapter(config?: TencentConfig): TencentAdapter {
    const adapter = new TencentAdapter('tencent', '腾讯广告 (广点通)', ['zh-CN'])
    if (config) {
        // Initialize asynchronously but don't wait here
        adapter.initialize(config).catch((err) => {
            console.error('Failed to initialize Tencent adapter:', err)
        })
    }
    return adapter
}
