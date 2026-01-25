import { parseFromTokenizer } from 'music-metadata'
import { makeTokenizer } from '@tokenizer/http'
import logger from './logger'

// 常见的音频容器名到标准 MIME 类型映射
const MIME_MAP: Record<string, string> = {
    MPEG: 'audio/mpeg',
    MP4: 'audio/mp4',
    matroska: 'audio/webm',
    Ogg: 'audio/ogg',
    WAV: 'audio/wav',
    FLAC: 'audio/flac',
    AIFF: 'audio/x-aiff',
    AAC: 'audio/aac',
}

export async function probeRemoteAudio(url: string) {
    logger.info(`[AudioProbe] 开始探测音频元数据: ${url}`)
    try {
        // 1. 获取基础 HTTP 信息（通常比流式解析更快）
        const headResponse = await fetch(url, { method: 'HEAD' }).catch((e) => {
            logger.warn(`[AudioProbe] HEAD 请求失败，将仅依赖流式解析: ${e.message}`)
            return null
        })
        const headerMimeType = headResponse?.headers.get('content-type')?.split(';')[0]
        const headerSize = headResponse?.headers.get('content-length')

        // 2. 创建一个支持 Range 请求的 Tokenizer
        const tokenizer = await makeTokenizer(url)

        // 3. 使用 parseFromTokenizer 进行流式解析
        const metadata = await parseFromTokenizer(tokenizer)
        logger.info(`[AudioProbe] 成功解析元数据: container=${metadata.format.container}, duration=${metadata.format.duration}s`)

        // 4. 统一 MIME 类型识别逻辑
        let finalMimeType = headerMimeType
        const container = metadata.format.container || ''
        if (!finalMimeType || finalMimeType === 'application/octet-stream' || finalMimeType === 'MPEG') {
            finalMimeType = MIME_MAP[container] || container || headerMimeType
        }

        return {
            mimeType: finalMimeType || null,
            size: tokenizer.fileInfo.size || (headerSize ? parseInt(headerSize, 10) : null),
            duration: metadata.format.duration ? Math.round(metadata.format.duration) : null,
        }
    } catch (error: any) {
        logger.warn(`[AudioProbe] 流式解析失败，尝试回退模式: ${error.message}`)
        // 如果流式解析失败，退回到基础的 HEAD 请求获取基本信息
        try {
            const response = await fetch(url, { method: 'HEAD' })
            if (!response.ok) {
                logger.error(`[AudioProbe] 回退请求也已失败: ${response.statusText}`)
                return { mimeType: null, size: null, duration: null }
            }

            return {
                mimeType: response.headers.get('content-type')?.split(';')[0] || null,
                size: parseInt(response.headers.get('content-length') || '0', 10) || null,
                duration: null,
            }
        } catch (e: any) {
            logger.error(`[AudioProbe] 探测完全失败: ${e.message}`)
            throw new Error(`Audio probe failed: ${error.message}`)
        }
    }
}
