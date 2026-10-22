const BROTLI_ENCODING_PATTERN = /(?:^|,)\s*(?:br|brotli)\s*(?:,|$)/i

export class UnsafeContentEncodingError extends Error {
    readonly contentEncoding: string

    constructor(contentEncoding: string) {
        super(`不支持 Brotli 编码的响应: ${contentEncoding}`)
        this.name = 'UnsafeContentEncodingError'
        this.contentEncoding = contentEncoding
    }
}

/**
 * 判断 Content-Encoding 是否包含 Brotli（支持 `gzip, br` 这类多段编码）
 */
export function isBrotliEncoding(contentEncoding: string | null | undefined): boolean {
    if (!contentEncoding) {
        return false
    }
    return BROTLI_ENCODING_PATTERN.test(contentEncoding)
}

/**
 * 发起请求，并在读取 body 前拒绝 Brotli 编码的响应。
 *
 * Node.js 24.22.1 / 22.23.4 之前的 zlib Brotli 解码器存在越界写入
 * （CVE-2026-111497），且 `fetch` 会根据响应头自动解压 br，无法通过
 * `Accept-Encoding` 请求头关闭。这里在读取 body 之前检查 `Content-Encoding`，
 * 命中 br 立即取消流并抛出错误，尽量降低响应进入 Node 解压器的概率。
 * 该防护是纵深防御，不能替代 24.22.1 / 22.23.4 / 26.12.1 的运行时下限。
 */
export async function fetchWithoutBrotli(url: string, init?: Parameters<typeof fetch>[1]): Promise<Response> {
    const response = await fetch(url, init)
    const contentEncoding = response.headers.get('content-encoding')
    if (isBrotliEncoding(contentEncoding)) {
        // 取消未消费的 body，避免后续数据继续进入解压器；
        // 取消失败（例如 body 已被消费）不影响拒绝结果
        await response.body?.cancel().catch(() => undefined)
        throw new UnsafeContentEncodingError(contentEncoding as string)
    }
    return response
}
