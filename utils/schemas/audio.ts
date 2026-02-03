import { z } from 'zod'

export const audioProbeQuerySchema = z.object({
    url: z.url(),
})

export type AudioProbeQueryInput = z.infer<typeof audioProbeQuerySchema>
