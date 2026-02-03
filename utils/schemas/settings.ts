import { z } from 'zod'
import { isValidCustomUrl } from '../shared/validate'

const isHexColor = (val: string) => /^#([A-Fa-f0-9]{3}){1,2}$/.test(val)

export const themeUpdateSchema = z.object({
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
    themeLogoUrl: z.string().optional().nullable().refine((val) => !val || isValidCustomUrl(val), {
        message: 'Logo URL source is not in the whitelist',
    }),
    themeFaviconUrl: z.string().optional().nullable().refine((val) => !val || isValidCustomUrl(val), {
        message: 'Favicon URL source is not in the whitelist',
    }),
    themeMourningMode: z.union([z.boolean(), z.string()]).optional().nullable(),
    themeBackgroundType: z.string().optional().nullable(),
    themeBackgroundValue: z.string().optional().nullable().refine((val) => !val || isHexColor(val) || isValidCustomUrl(val), {
        message: 'Background value must be a valid HEX color or a whitelisted URL',
    }),
})

export type ThemeUpdateInput = z.infer<typeof themeUpdateSchema>
