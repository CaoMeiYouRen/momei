import { z } from 'zod'

export const dispatchPostHexoRepositorySyncSchema = z.object({
    operation: z.enum(['sync', 'retry']).default('sync'),
})
