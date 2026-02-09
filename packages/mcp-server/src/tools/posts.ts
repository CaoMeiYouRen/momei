import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { MomeiApi } from '../lib/api'
import type { MomeiApiConfig } from '../lib/config'

export function registerPostTools(server: McpServer, config: MomeiApiConfig) {
    const api = new MomeiApi(config)

    // 1. List Posts
    server.registerTool(
        'list_posts',
        {
            description: 'List blog posts with filtering options',
            inputSchema: {
                status: z.enum(['draft', 'pending', 'published', 'rejected', 'hidden']).optional(),
                language: z.string().optional(),
                search: z.string().optional().describe('Search in title'),
                page: z.number().int().min(1).default(1),
                limit: z.number().int().min(1).max(100).default(10),
            },
        },
        async (params) => {
            try {
                const result = await api.listPosts(params)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: any) {
                return { content: [{ type: 'text', text: error.message }], isError: true }
            }
        },
    )

    // 2. Get Post
    server.registerTool(
        'get_post',
        {
            description: 'Get detailed information about a specific post',
            inputSchema: {
                id: z.string().describe('The ID of the post'),
            },
        },
        async ({ id }) => {
            try {
                const result = await api.getPost(id)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: any) {
                return { content: [{ type: 'text', text: error.message }], isError: true }
            }
        },
    )

    // 3. Create Post
    server.registerTool(
        'create_post',
        {
            description: 'Create a new blog post as draft',
            inputSchema: {
                title: z.string().min(1),
                content: z.string().min(1),
                language: z.string().default('zh-CN'),
                tags: z.array(z.string()).optional(),
                category: z.string().optional().describe('Category slug or ID'),
            },
        },
        async (data) => {
            try {
                const result = await api.createPost({ ...data, status: 'draft' })
                return {
                    content: [{ type: 'text', text: `Post created successfully! ID: ${result.data.id}` }],
                }
            } catch (error: any) {
                return { content: [{ type: 'text', text: error.message }], isError: true }
            }
        },
    )

    // 4. Update Post
    server.registerTool(
        'update_post',
        {
            description: 'Update an existing blog post',
            inputSchema: {
                id: z.string(),
                title: z.string().optional(),
                content: z.string().optional(),
                tags: z.array(z.string()).optional(),
            },
        },
        async ({ id, ...data }) => {
            try {
                const result = await api.updatePost(id, data)
                return {
                    content: [{ type: 'text', text: `Post ${id} updated successfully.` }],
                }
            } catch (error: any) {
                return { content: [{ type: 'text', text: error.message }], isError: true }
            }
        },
    )

    // 5. Publish Post
    server.registerTool(
        'publish_post',
        {
            description: 'Publish a post (move from draft/pending to published)',
            inputSchema: {
                id: z.string(),
            },
        },
        async ({ id }) => {
            try {
                await api.publishPost(id)
                return {
                    content: [{ type: 'text', text: `Post ${id} has been published.` }],
                }
            } catch (error: any) {
                return { content: [{ type: 'text', text: error.message }], isError: true }
            }
        },
    )

    // 6. Delete Post (Dangerous tool, conditionally registered)
    if (config.enableDangerousTools) {
        server.registerTool(
            'delete_post',
            {
                description: 'Delete a post (DANGEROUS: Physical deletion)',
                inputSchema: {
                    id: z.string(),
                },
            },
            async ({ id }) => {
                try {
                    await api.deletePost(id)
                    return {
                        content: [{ type: 'text', text: `Post ${id} deleted successfully.` }],
                    }
                } catch (error: any) {
                    return { content: [{ type: 'text', text: error.message }], isError: true }
                }
            },
        )
    }
}
