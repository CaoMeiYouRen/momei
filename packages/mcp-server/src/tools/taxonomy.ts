import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { MomeiApi } from '../lib/api'
import type { MomeiApiConfig } from '../lib/config'
import { getErrorMessage } from '../lib/error'

export function registerTaxonomyTools(server: McpServer, config: MomeiApiConfig): void {
    const api = new MomeiApi(config)

    // ===== Category Tools =====

    server.registerTool(
        'list_categories',
        {
            description: 'List categories with filtering and pagination',
            inputSchema: {
                language: z.string().optional(),
                search: z.string().optional().describe('Search in name'),
                parentId: z.string().optional(),
                aggregate: z.boolean().optional().describe('Aggregate translations'),
                page: z.number().int().min(1).default(1),
                limit: z.number().int().min(1).max(100).default(10),
            },
        },
        async (params) => {
            try {
                const result = await api.listCategories(params)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'create_category',
        {
            description: 'Create a new category',
            inputSchema: {
                name: z.string().min(1).max(100),
                slug: z.string().min(1).max(100),
                description: z.string().optional(),
                parentId: z.string().optional(),
                language: z.string().default('zh-CN'),
                translationId: z.string().optional(),
            },
        },
        async (data) => {
            try {
                const result = await api.createCategory(data)
                return {
                    content: [{ type: 'text', text: `Category created successfully! ID: ${result.data.id}` }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'update_category',
        {
            description: 'Update an existing category',
            inputSchema: {
                id: z.string(),
                name: z.string().optional(),
                slug: z.string().optional(),
                description: z.string().optional(),
                parentId: z.string().optional(),
                language: z.string().optional(),
                translationId: z.string().optional(),
            },
        },
        async ({ id, ...data }) => {
            try {
                await api.updateCategory(id, data)
                return {
                    content: [{ type: 'text', text: `Category ${id} updated successfully.` }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    // Delete category as dangerous tool
    if (config.enableDangerousTools) {
        server.registerTool(
            'delete_category',
            {
                description: 'Delete a category (DANGEROUS: Cannot be undone if posts exist)',
                inputSchema: {
                    id: z.string(),
                },
            },
            async ({ id }) => {
                try {
                    await api.deleteCategory(id)
                    return {
                        content: [{ type: 'text', text: `Category ${id} deleted successfully.` }],
                    }
                } catch (error: unknown) {
                    return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
                }
            },
        )
    }

    // ===== Tag Tools =====

    server.registerTool(
        'list_tags',
        {
            description: 'List tags with filtering and pagination',
            inputSchema: {
                language: z.string().optional(),
                search: z.string().optional().describe('Search in name'),
                aggregate: z.boolean().optional().describe('Aggregate translations'),
                page: z.number().int().min(1).default(1),
                limit: z.number().int().min(1).max(100).default(10),
            },
        },
        async (params) => {
            try {
                const result = await api.listTags(params)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'create_tag',
        {
            description: 'Create a new tag',
            inputSchema: {
                name: z.string().min(1).max(100),
                slug: z.string().min(1).max(100),
                language: z.string().default('zh-CN'),
                translationId: z.string().optional(),
            },
        },
        async (data) => {
            try {
                const result = await api.createTag(data)
                return {
                    content: [{ type: 'text', text: `Tag created successfully! ID: ${result.data.id}` }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'update_tag',
        {
            description: 'Update an existing tag',
            inputSchema: {
                id: z.string(),
                name: z.string().optional(),
                slug: z.string().optional(),
                language: z.string().optional(),
                translationId: z.string().optional(),
            },
        },
        async ({ id, ...data }) => {
            try {
                await api.updateTag(id, data)
                return {
                    content: [{ type: 'text', text: `Tag ${id} updated successfully.` }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    if (config.enableDangerousTools) {
        server.registerTool(
            'delete_tag',
            {
                description: 'Delete a tag (DANGEROUS: Removes tag from all posts)',
                inputSchema: {
                    id: z.string(),
                },
            },
            async ({ id }) => {
                try {
                    await api.deleteTag(id)
                    return {
                        content: [{ type: 'text', text: `Tag ${id} deleted successfully.` }],
                    }
                } catch (error: unknown) {
                    return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
                }
            },
        )
    }
}
