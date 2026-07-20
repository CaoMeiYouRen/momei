import { validateApiKeyRequest } from '@/server/utils/validate-api-key'

/**
 * 获取全局 MCP Transport 实例
 */
function getMcpTransport() {
    return (globalThis as Record<string, unknown>).__momei_mcp_transport as
        | { handleRequest: (request: Request, options?: { authInfo?: unknown, parsedBody?: unknown }) => Promise<Response> }
        | undefined
}

/**
 * MCP HTTP 端点处理器
 *
 * 处理 GET（SSE 流建立）、POST（JSON-RPC 调用）和 DELETE（会话终止）请求。
 * 请求必须先通过 API Key 鉴权。
 */
export default defineEventHandler(async (event) => {
    const transport = getMcpTransport()

    if (!transport) {
        throw createError({ statusCode: 503, statusMessage: 'MCP HTTP endpoint is not available' })
    }

    // 复用外部 API Key 鉴权（与 /api/external/* 一致的验证逻辑）
    await validateApiKeyRequest(event)

    // 将 h3 event 转为 Web Standard Request，委托给 MCP Transport 处理
    // 使用 h3 提供的 getRequestURL 等方法构造 Request 对象
    const url = getRequestURL(event)
    const method = event.method
    const reqHeaders = new Headers(getHeaders(event) as Record<string, string>)

    // 读取请求体（仅对 POST 等方法）
    let body: BodyInit | undefined
    if (method !== 'GET' && method !== 'HEAD') {
        const rawBody = await readRawBody(event)
        if (rawBody) {
            body = rawBody
        }
    }

    const webRequest = new Request(url, {
        method,
        headers: reqHeaders,
        body: body ?? undefined,
    })

    const response = await transport.handleRequest(webRequest)

    // 将 Web Response 转换为 h3 响应
    setResponseStatus(event, response.status, response.statusText)

    // 复制响应头
    const contentType = response.headers.get('content-type')
    if (contentType) {
        setHeader(event, 'Content-Type', contentType)
    }
    const cacheControl = response.headers.get('cache-control')
    if (cacheControl) {
        setHeader(event, 'Cache-Control', cacheControl)
    }

    // 返回响应体
    if (response.body) {
        return response.body
    }

    return null
})
