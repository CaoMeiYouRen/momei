import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { MomeiApi } from '../lib/api'
import type { MomeiApiConfig } from '../lib/config'
import { getErrorMessage } from '../lib/error'

export function registerSnippetTools(server: McpServer, config: MomeiApiConfig): void {
    const api = new MomeiApi(config)

    server.registerTool(
        'list_snippets',
        {
            description: 'List snippets (ideas/inspirations) with filtering',
            inputSchema: {
                status: z.enum(['inbox', 'converted', 'archived']).optional(),
                source: z.string().optional(),
                search: z.string().optional().describe('Search in content'),
                page: z.number().int().min(1).default(1),
                limit: z.number().int().min(1).max(100).default(10),
            },
        },
        async (params) => {
            try {
                const result = await api.listSnippets(params)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'create_snippet',
        {
            description: 'Create a new snippet (idea/inspiration)',
            inputSchema: {
                content: z.string().min(1),
                media: z.array(z.string()).optional().describe('Media attachment URLs'),
                audioUrl: z.string().optional(),
                source: z.string().optional().default('web').describe('Source (web, api, cli, etc.)'),
                status: z.enum(['inbox', 'converted', 'archived']).optional().default('inbox'),
            },
        },
        async (data) => {
            try {
                const result = await api.createSnippet({ ...data, status: data.status || 'inbox' })
                return {
                    content: [{ type: 'text', text: `Snippet created successfully! ID: ${result.data.id}` }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'get_snippet',
        {
            description: 'Get detailed information about a specific snippet',
            inputSchema: {
                id: z.string().describe('The ID of the snippet'),
            },
        },
        async ({ id }) => {
            try {
                const result = await api.getSnippet(id)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'update_snippet',
        {
            description: 'Update an existing snippet',
            inputSchema: {
                id: z.string(),
                content: z.string().optional(),
                media: z.array(z.string()).optional(),
                audioUrl: z.string().optional(),
                source: z.string().optional(),
                status: z.enum(['inbox', 'converted', 'archived']).optional(),
            },
        },
        async ({ id, ...data }) => {
            try {
                await api.updateSnippet(id, data)
                return {
                    content: [{ type: 'text', text: `Snippet ${id} updated successfully.` }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'convert_snippet_to_post',
        {
            description: 'Convert an inbox snippet into a new blog post draft',
            inputSchema: {
                id: z.string().describe('The ID of the snippet to convert'),
            },
        },
        async ({ id }) => {
            try {
                const result = await api.convertSnippetToPost(id)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    if (config.enableDangerousTools) {
        server.registerTool(
            'delete_snippet',
            {
                description: 'Delete a snippet (DANGEROUS: Physical deletion)',
                inputSchema: {
                    id: z.string(),
                },
            },
            async ({ id }) => {
                try {
                    await api.deleteSnippet(id)
                    return {
                        content: [{ type: 'text', text: `Snippet ${id} deleted successfully.` }],
                    }
                } catch (error: unknown) {
                    return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
                }
            },
        )
    }
}
