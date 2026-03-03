import { AdFormat, type AdPlacementMetadata } from '@/types/ad'
import { sanitizeHtmlToText } from '@/server/utils/html'

/**
 * Generate ad code for specified adapter
 */
export function generateAdCode(
    adapterId: string,
    metadata: AdPlacementMetadata & { publisherId?: string, appId?: string },
): string {
    switch (adapterId) {
        case 'adsense':
            return generateAdSenseCode(metadata)
        case 'baidu':
            return generateBaiduCode(metadata)
        case 'tencent':
            return generateTencentCode(metadata)
        default:
            return '<div class="ad-placeholder">Ad not available</div>'
    }
}

/**
 * Generate Google AdSense ad code
 */
function generateAdSenseCode(metadata: AdPlacementMetadata & { publisherId?: string }): string {
    const { slot = '', publisherId = '' } = metadata

    return `
        <ins class="adsbygoogle"
             style="display:block"
             data-ad-client="${publisherId}"
             data-ad-slot="${slot}"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>
             (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
    `.trim()
}

/**
 * Generate Baidu Union ad code
 */
function generateBaiduCode(metadata: AdPlacementMetadata & { publisherId?: string }): string {
    const { slot = '', publisherId = '' } = metadata

    return `
        <script type="text/javascript">
            var cpro_id = "${publisherId}";
            var cpro_slot = "${slot}";
        </script>
        <script src="https://cpro.baidustatic.com/cpro/ui/c.js" type="text/javascript"></script>
    `.trim()
}

/**
 * Generate Tencent Ads ad code
 */
function generateTencentCode(metadata: AdPlacementMetadata & { appId?: string }): string {
    const { slot = '', appId = '' } = metadata

    return `
        <script type="text/javascript">
            var tencent_ad = {
                app_id: "${appId}",
                placement_id: "${slot}"
            };
        </script>
        <script src="https://qzonestyle.gtimg.cn/qzone/biz/ad/tad.js" type="text/javascript"></script>
    `.trim()
}

/**
 * Validate ad configuration
 */
export function validateAdConfig(
    adapterId: string,
    config: Record<string, any>,
): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    switch (adapterId) {
        case 'adsense':
            if (!config.publisherId) {
                errors.push('Publisher ID is required')
            }
            break
        case 'baidu':
            if (!config.publisherId) {
                errors.push('Publisher ID is required')
            }
            if (!config.tokenId) {
                errors.push('Token ID is required')
            }
            break
        case 'tencent':
            if (!config.appId) {
                errors.push('App ID is required')
            }
            if (!config.placementId) {
                errors.push('Placement ID is required')
            }
            break
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Sanitize metadata to prevent XSS
 */
export function sanitizeMetadata(metadata: Record<string, any> | null): Record<string, any> {
    if (!metadata) {
        return {}
    }

    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeHtmlToText(value)
        } else {
            sanitized[key] = value
        }
    }

    return sanitized
}

/**
 * Format ad size as string
 */
export function formatAdSize(width: number | string, height: number | string): string {
    if (width === 'auto' || height === 'auto' || width === '100%' || height === '100%') {
        return 'responsive'
    }

    return `${width}x${height}`
}

/**
 * Parse targeting rules from JSON string
 */
export function parseTargetingRules(rulesStr: string): Record<string, any> {
    try {
        if (!rulesStr || rulesStr.trim() === '') {
            return {}
        }
        return JSON.parse(rulesStr)
    } catch {
        return {}
    }
}

/**
 * Check if ad format is supported by adapter
 */
export function isAdFormatSupported(adapterId: string, format: AdFormat): boolean {
    const supportedFormats: Record<string, AdFormat[]> = {
        adsense: [AdFormat.DISPLAY, AdFormat.NATIVE, AdFormat.RESPONSIVE],
        baidu: [AdFormat.DISPLAY, AdFormat.NATIVE],
        tencent: [AdFormat.DISPLAY, AdFormat.NATIVE, AdFormat.VIDEO, AdFormat.RESPONSIVE],
    }

    return supportedFormats[adapterId]?.includes(format) ?? false
}
