#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
    loadConfig,
    registerAutomationTools,
    registerPostTools,
    registerSnippetTools,
    registerTaxonomyTools,
    SERVER_NAME,
    SERVER_VERSION,
} from './index.js'

/**
 * Stdio CLI 入口（`momei-mcp` 可执行文件）。
 *
 * 与库入口 `index.ts` 严格分离：`index.ts` 只导出 API，不含任何顶层副作用，
 * 可被宿主应用（如 Nuxt Nitro 插件）安全 import；本文件才是 CLI 的 `main()` 启动点。
 */
async function main() {
    const config = loadConfig()

    if (!config.apiKey) {
        console.error('Error: MOMEI_API_KEY environment variable is required')
        process.exit(1)
    }

    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    })

    // Register Tools
    registerPostTools(server, config)
    registerTaxonomyTools(server, config)
    registerSnippetTools(server, config)
    registerAutomationTools(server, config)

    // Use stdio transport
    const transport = new StdioServerTransport()
    await server.connect(transport)

    console.error(`Momei MCP Server v${SERVER_VERSION} running on stdio`)
    console.error(`Connected to: ${config.apiUrl}`)
    if (config.enableDangerousTools) {
        console.error('WARNING: Dangerous tools (delete) are ENABLED.')
    }
}

main().catch((error) => {
    console.error('Fatal error starting MCP server:', error)
    process.exit(1)
})
