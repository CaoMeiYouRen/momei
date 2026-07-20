#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerAutomationTools } from './tools/automation.js'
import { registerPostTools } from './tools/posts.js'
import { registerTaxonomyTools } from './tools/taxonomy.js'
import { registerSnippetTools } from './tools/snippets.js'
import { loadConfig, type MomeiApiConfig } from './lib/config.js'

// Re-export tool registration functions and config for external use
export { registerPostTools } from './tools/posts.js'
export { registerTaxonomyTools } from './tools/taxonomy.js'
export { registerSnippetTools } from './tools/snippets.js'
export { registerAutomationTools } from './tools/automation.js'
export { loadConfig } from './lib/config.js'
export type { MomeiApiConfig } from './lib/config.js'

export const SERVER_NAME = 'momei-blog'
export const SERVER_VERSION = '1.0.0'

// ============================================================
// HTTP Transport Support
// ============================================================

export interface CreateMcpHttpServerOptions {
    /** Momei REST API base URL (default: http://localhost:3000) */
    apiUrl?: string
    /** API Key for Momei REST API authentication */
    apiKey?: string
    /** Whether to register dangerous tools (delete operations) */
    enableDangerousTools?: boolean
    /** Custom session ID generator (default: crypto.randomUUID) */
    sessionIdGenerator?: () => string
}

/**
 * Minimal transport interface for Streamable HTTP.
 * Compatible with WebStandardStreamableHTTPServerTransport.handleRequest().
 */
export interface McpTransport {
    handleRequest(request: Request, options?: { authInfo?: unknown, parsedBody?: unknown }): Promise<Response>
}

export interface McpHttpServer {
    /** The Streamable HTTP transport instance (for route handler delegation) */
    transport: McpTransport
    /** The underlying McpServer instance */
    server: McpServer
    /** Cleanly close the server and transport */
    close(): Promise<void>
}

/**
 * Creates an MCP server configured for Streamable HTTP transport.
 *
 * This is the programmatic entry point for embedding MCP in a host application
 * (e.g., Nuxt/Nitro plugin). It returns the transport and server so the caller
 * can handle lifecycle and route delegation.
 *
 * Usage:
 * ```typescript
 * const mcp = await createMcpHttpServer({ apiKey: '...' })
 * // Store transport for route handler
 * // await mcp.close() on shutdown
 * ```
 */
export async function createMcpHttpServer(options: CreateMcpHttpServerOptions = {}): Promise<McpHttpServer> {
    const { WebStandardStreamableHTTPServerTransport: Transport } = await import(
        '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
    )

    const config: MomeiApiConfig = {
        apiUrl: options.apiUrl || process.env.MOMEI_API_URL || 'http://localhost:3000',
        apiKey: options.apiKey || process.env.MOMEI_API_KEY || '',
        enableDangerousTools: options.enableDangerousTools ?? process.env.MOMEI_ENABLE_DANGEROUS_TOOLS === 'true',
    }

    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    })

    // Register tools
    registerPostTools(server, config)
    registerTaxonomyTools(server, config)
    registerSnippetTools(server, config)
    registerAutomationTools(server, config)

    // Create transport
    const transport = new Transport({
        sessionIdGenerator: options.sessionIdGenerator ?? (() => crypto.randomUUID()),
    })

    // Connect
    await server.connect(transport)

    return {
        transport,
        server,
        async close() {
            await server.close()
        },
    }
}

// ============================================================
// Stdio Mode (CLI entry point)
// ============================================================

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
