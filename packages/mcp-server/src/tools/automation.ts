import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { MomeiApi } from '../lib/api'
import type { MomeiApiConfig } from '../lib/config'

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

export function registerAutomationTools(server: McpServer, config: MomeiApiConfig) {
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
            } catch (error: any) {
                return { content: [{ type: 'text', text: error.message }], isError: true }
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
            } catch (error: any) {
                return { content: [{ type: 'text', text: error.message }], isError: true }
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
            },
        },
        async (params) => {
            try {
                const result = await api.translatePost(params)
                return {
                    content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
                }
            } catch (error: any) {
                return { content: [{ type: 'text', text: error.message }], isError: true }
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
            } catch (error: any) {
                return { content: [{ type: 'text', text: error.message }], isError: true }
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
            } catch (error: any) {
                return { content: [{ type: 'text', text: error.message }], isError: true }
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
            } catch (error: any) {
                return { content: [{ type: 'text', text: error.message }], isError: true }
            }
        },
    )
}
