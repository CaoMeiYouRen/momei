import { z } from 'zod'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/utils/shared/roles'
import { setSettings } from '@/server/services/setting'

const themeUpdateSchema = z.object({
    theme_preset: z.string().optional().nullable(),
    theme_primary_color: z.string().optional().nullable(),
    theme_accent_color: z.string().optional().nullable(),
    theme_border_radius: z.string().optional().nullable(),
    theme_logo_url: z.string().optional().nullable(),
    theme_favicon_url: z.string().optional().nullable(),
    theme_mourning_mode: z.union([z.boolean(), z.string()]).optional().nullable(),
    theme_background_type: z.string().optional().nullable(),
    theme_background_value: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || !isAdmin(session.user.role)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readValidatedBody(event, (b) => themeUpdateSchema.parse(b))

    const settingsToSave: Record<string, string | null> = {}
    for (const [key, value] of Object.entries(body)) {
        if (value === undefined) { continue }
        if (value === null) {
            settingsToSave[key] = null
        } else {
            settingsToSave[key] = typeof value === 'string' ? value : JSON.stringify(value)
        }
    }

    await setSettings(settingsToSave)

    return {
        code: 200,
        message: 'Theme settings updated successfully',
    }
})
