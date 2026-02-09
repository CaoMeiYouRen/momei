#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerPostTools } from './tools/posts.js'
import { loadConfig } from './lib/config.js'

const SERVER_NAME = 'momei-blog'
const SERVER_VERSION = '1.0.0'

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
