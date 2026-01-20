import { z } from 'zod'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/utils/shared/roles'
import { setSettings } from '@/server/services/setting'
import { isValidCustomUrl } from '@/server/utils/security'

const isHexColor = (val: string) => /^#([A-Fa-f0-9]{3}){1,2}$/.test(val)

const themeUpdateSchema = z.object({
    themePreset: z.string().optional().nullable(),
    themePrimaryColor: z.string().optional().nullable(),
    themeAccentColor: z.string().optional().nullable(),
    themeSurfaceColor: z.string().optional().nullable(),
    themeTextColor: z.string().optional().nullable(),
    themeDarkPrimaryColor: z.string().optional().nullable(),
    themeDarkAccentColor: z.string().optional().nullable(),
    themeDarkSurfaceColor: z.string().optional().nullable(),
    themeDarkTextColor: z.string().optional().nullable(),
    themeBorderRadius: z.string().optional().nullable(),
    themeLogoUrl: z.string().optional().nullable().refine((val) => isValidCustomUrl(val), {
        message: 'Logo URL source is not in the whitelist',
    }),
    themeFaviconUrl: z.string().optional().nullable().refine((val) => isValidCustomUrl(val), {
        message: 'Favicon URL source is not in the whitelist',
    }),
    themeMourningMode: z.union([z.boolean(), z.string()]).optional().nullable(),
    themeBackgroundType: z.string().optional().nullable(),
    themeBackgroundValue: z.string().optional().nullable().refine((val) => !val || isHexColor(val) || isValidCustomUrl(val), {
        message: 'Background value must be a valid HEX color or a whitelisted URL',
    }),
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
        if (value === undefined) {
            continue
        }
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
