import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { MomeiApi } from '../lib/api'
import type { MomeiApiConfig } from '../lib/config'
import { getErrorMessage } from '../lib/error'

function extractTagNames(post: Record<string, unknown>) {
    const tags = Array.isArray(post.tags) ? post.tags : []
    return tags
        .map((tag) => {
            if (typeof tag === 'string') {
                return tag
            }

            if (tag && typeof tag === 'object' && typeof (tag as { name?: unknown }).name === 'string') {
                return (tag as { name: string }).name
            }

            return null
        })
        .filter((tag): tag is string => Boolean(tag))
}

export function registerAutomationTools(server: McpServer, config: MomeiApiConfig): void {
    const api = new MomeiApi(config)

    server.registerTool(
        'suggest_titles',
        {
            description: 'Suggest titles for an existing post',
            inputSchema: {
                postId: z.string(),
            },
        },
        async ({ postId }) => {
            try {
                const post = await api.getPost(postId)
                const result = await api.suggestTitles({
                    content: post.data.content,
                    language: post.data.language,
                })
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'recommend_tags',
        {
            description: 'Recommend tags for an existing post',
            inputSchema: {
                postId: z.string(),
            },
        },
        async ({ postId }) => {
            try {
                const post = await api.getPost(postId)
                const result = await api.recommendTags({
                    content: post.data.content,
                    existingTags: extractTagNames(post.data),
                    language: post.data.language,
                })
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'recommend_categories',
        {
            description: 'Recommend categories for an existing post in a target language',
            inputSchema: {
                postId: z.string(),
                targetLanguage: z.string(),
                sourceLanguage: z.string().optional(),
                limit: z.number().int().min(1).max(10).optional(),
            },
        },
        async ({ postId, targetLanguage, sourceLanguage, limit }) => {
            try {
                const result = await api.recommendCategories({
                    postId,
                    targetLanguage,
                    sourceLanguage,
                    limit,
                })
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'translate_post',
        {
            description: 'Translate a post into another language and create or update the translated draft',
            inputSchema: {
                sourcePostId: z.string(),
                targetLanguage: z.string(),
                sourceLanguage: z.string().optional(),
                targetPostId: z.string().optional(),
                scopes: z.array(z.enum(['title', 'content', 'summary', 'category', 'tags', 'coverImage', 'audio'])).optional(),
                targetStatus: z.enum(['draft', 'pending']).optional(),
                slugStrategy: z.enum(['source', 'translate', 'ai']).optional(),
                categoryStrategy: z.enum(['cluster', 'suggest']).optional(),
                confirmationMode: z.enum(['auto', 'require', 'confirmed']).optional(),
                previewTaskId: z.string().optional(),
                approvedSlug: z.string().optional(),
                approvedCategoryId: z.string().optional(),
            },
        },
        async (params) => {
            try {
                const result = await api.translatePost(params)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'generate_cover_image',
        {
            description: 'Generate a cover image and auto-attach it to the post',
            inputSchema: {
                postId: z.string(),
                prompt: z.string().min(1),
                model: z.string().optional(),
                size: z.string().optional(),
                aspectRatio: z.string().optional(),
                quality: z.enum(['standard', 'hd']).optional(),
                style: z.enum(['vivid', 'natural']).optional(),
            },
        },
        async ({ postId, prompt, model, size, aspectRatio, quality, style }) => {
            try {
                const result = await api.generateCoverImage({
                    postId,
                    prompt,
                    model,
                    size,
                    aspectRatio,
                    quality,
                    style,
                    n: 1,
                })
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'generate_post_audio',
        {
            description: 'Generate TTS or podcast audio and auto-attach it to the post',
            inputSchema: {
                postId: z.string(),
                voice: z.string().min(1),
                provider: z.string().optional(),
                mode: z.enum(['speech', 'podcast']).optional(),
                model: z.string().optional(),
                script: z.string().optional(),
            },
        },
        async ({ postId, voice, provider, mode, model, script }) => {
            try {
                const result = await api.createTTSTask({
                    postId,
                    voice,
                    provider,
                    mode,
                    model,
                    script,
                })
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'get_ai_task',
        {
            description: 'Get the current status or final result of an automation task',
            inputSchema: {
                taskId: z.string(),
            },
        },
        async ({ taskId }) => {
            try {
                const result = await api.getAITask(taskId)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'validate_import_post',
        {
            description: 'Validate import path aliases for a post before importing',
            inputSchema: {
                title: z.string(),
                content: z.string(),
                language: z.string().optional(),
                slug: z.string().optional(),
                abbrlink: z.string().optional(),
                permalink: z.string().optional(),
                sourceFile: z.string().optional(),
            },
        },
        async (data) => {
            try {
                const result = await api.validateImportPost(data)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'dry_run_link_governance',
        {
            description: 'Preview link governance changes without applying them',
            inputSchema: {
                scopes: z.array(z.enum(['asset-url', 'post-link', 'category-link', 'tag-link', 'archive-link', 'page-link', 'permalink-rule'])),
                filters: z.object({
                    domains: z.array(z.string()).optional(),
                    pathPrefixes: z.array(z.string()).optional(),
                    contentTypes: z.array(z.enum(['post', 'category', 'tag', 'page', 'asset-record'])).optional(),
                }).optional(),
                options: z.object({
                    reportFormat: z.enum(['json', 'markdown']).optional(),
                    validationMode: z.enum(['static', 'static+online']).optional(),
                    allowRelativeLinks: z.boolean().optional(),
                }).optional(),
            },
        },
        async (request) => {
            try {
                const result = await api.dryRunLinkGovernance(request)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'apply_link_governance',
        {
            description: 'Apply link governance changes to rewrite or redirect links',
            inputSchema: {
                scopes: z.array(z.enum(['asset-url', 'post-link', 'category-link', 'tag-link', 'archive-link', 'page-link', 'permalink-rule'])),
                filters: z.object({
                    domains: z.array(z.string()).optional(),
                    pathPrefixes: z.array(z.string()).optional(),
                    contentTypes: z.array(z.enum(['post', 'category', 'tag', 'page', 'asset-record'])).optional(),
                }).optional(),
                seeds: z.array(z.object({
                    source: z.string(),
                    sourceKind: z.enum(['absolute', 'root-relative', 'relative', 'path-rule']),
                    matchMode: z.enum(['exact', 'prefix', 'pattern']),
                    scope: z.enum(['asset-url', 'post-link', 'category-link', 'tag-link', 'archive-link', 'page-link', 'permalink-rule']),
                    targetType: z.enum(['asset', 'post', 'category', 'tag', 'archive', 'page']),
                    targetRef: z.record(z.string(), z.unknown()),
                    redirectMode: z.enum(['rewrite-only', 'redirect-seed', 'alias-only']).optional(),
                    notes: z.string().optional(),
                })).optional(),
                options: z.object({
                    reportFormat: z.enum(['json', 'markdown']).optional(),
                    validationMode: z.enum(['static', 'static+online']).optional(),
                    allowRelativeLinks: z.boolean().optional(),
                    skipConfirmation: z.boolean().optional(),
                }).optional(),
            },
        },
        async (request) => {
            try {
                const result = await api.applyLinkGovernance(request)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )

    server.registerTool(
        'get_link_governance_report',
        {
            description: 'Get a link governance report by ID',
            inputSchema: {
                reportId: z.string(),
            },
        },
        async ({ reportId }) => {
            try {
                const result = await api.getLinkGovernanceReport(reportId)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: unknown) {
                return { content: [{ type: 'text', text: getErrorMessage(error) }], isError: true }
            }
        },
    )
}
