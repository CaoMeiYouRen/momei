/**
 * AI 图像分辨率与宽高比转换逻辑
 */

/**
 * 将语义化尺寸 (1K, 2K, 4K, 512px) 映射为缩放系数
 */
export function getSemanticScale(size: string): number {
    const s = size.toUpperCase()
    if (s === '2K') {
        return 2
    }
    if (s === '4K') {
        return 4
    }
    if (s === '512PX') {
        return 0.5
    }
    return 1 // 默认 1K
}

/**
 * 校验并归一化宽高比 (如 '16:9', '1:1')
 */
export function normalizeAspectRatio(ratio: string, validRatios?: string[]): string {
    const normalized = ratio.replace(/\s+/g, '')
    if (validRatios && !validRatios.includes(normalized)) {
        return '1:1'
    }
    return normalized
}

/**
 * 根据基础分辨率和宽高比计算像素尺寸
 * @param baseResolution 基础边的像素 (如 1024)
 * @param aspectRatio 宽高比字符串 (如 '16:9')
 * @returns { width: number, height: number }
 */
export function calculateDimension(baseResolution: number, aspectRatio: string): { width: number, height: number } {
    switch (aspectRatio) {
        case '16:9':
            return { width: Math.round(baseResolution * 1.77), height: baseResolution }
        case '9:16':
            return { width: baseResolution, height: Math.round(baseResolution * 1.77) }
        case '4:3':
            return { width: Math.round(baseResolution * 1.33), height: baseResolution }
        case '3:4':
            return { width: baseResolution, height: Math.round(baseResolution * 1.33) }
        case '3:2':
            return { width: Math.round(baseResolution * 1.5), height: baseResolution }
        case '2:3':
            return { width: baseResolution, height: Math.round(baseResolution * 1.5) }
        default:
            return { width: baseResolution, height: baseResolution }
    }
}
