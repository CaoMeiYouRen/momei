import { isServerlessEnvironment } from '../utils/env'
import logger from '@/server/utils/logger'

const MCP_HTTP_TAG = 'MCP-HTTP'

/**
 * MCP HTTP 传输与本体挂载插件
 *
 * 在主应用 Nitro 进程中挂载 MCP HTTP 服务，复用 /api/mcp 端点。
 * 默认关闭（通过 MOMEI_ENABLE_MCP_HTTP=true 启用），未启用时不加载 SDK。
 * Serverless 环境自动静默降级。
 * 工具注册与底层 Server 管理委托给 momei-mcp-server 包的 createMcpHttpServer。
 */
export default defineNitroPlugin((nitroApp) => {
    if (process.env.MOMEI_ENABLE_MCP_HTTP !== 'true') {
        return
    }

    if (isServerlessEnvironment()) {
        logger.info(`[${MCP_HTTP_TAG}] Skipped: SSE not supported in serverless environment.`)
        return
    }

    void (async () => {
        try {
            const { createMcpHttpServer, SERVER_NAME, SERVER_VERSION } = await import('momei-mcp-server')

            const { transport, server } = await createMcpHttpServer({
                apiUrl: process.env.MOMEI_API_URL,
                apiKey: process.env.MOMEI_API_KEY,
                enableDangerousTools: process.env.MOMEI_ENABLE_DANGEROUS_TOOLS === 'true',
            })

            ;(globalThis as Record<string, unknown>).__momei_mcp_transport = transport

            nitroApp.hooks.hook('close', async () => {
                try {
                    await server.close()
                    logger.info(`[${MCP_HTTP_TAG}] Server closed successfully.`)
                } catch (err) {
                    logger.error(`[${MCP_HTTP_TAG}] Error closing server:`, err)
                }
            })

            const dangerousTools = process.env.MOMEI_ENABLE_DANGEROUS_TOOLS === 'true'
            logger.info(`[${MCP_HTTP_TAG}] ${SERVER_NAME} v${SERVER_VERSION} mounted at /api/mcp. Dangerous tools: ${dangerousTools}`)
        } catch (err) {
            logger.error(`[${MCP_HTTP_TAG}] Failed to initialize MCP HTTP server:`, err)
        }
    })()
})
