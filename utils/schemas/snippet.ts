import { z } from 'zod'
import { SnippetStatus } from '../../types/snippet'

export const snippetBodySchema = z.object({
    content: z.string().min(1),
    media: z.array(z.string()).optional(),
    audioUrl: z.string().optional(),
    source: z.string().max(50).optional().default('web'),
    status: z.enum([
        SnippetStatus.INBOX,
        SnippetStatus.CONVERTED,
        SnippetStatus.ARCHIVED,
    ] as [SnippetStatus, ...SnippetStatus[]]).optional().default(SnippetStatus.INBOX),
    metadata: z.any().optional(),
})

export const snippetUpdateSchema = snippetBodySchema.partial()

export type SnippetBodyInput = z.infer<typeof snippetBodySchema>
export type SnippetUpdateInput = z.infer<typeof snippetUpdateSchema>
