import type { CopyrightType } from '@/types/copyright'
import { resolveCopyrightType } from '@/types/copyright'

export interface CopyrightLicenseOption {
    label: string
    value: CopyrightType
}

export function getCopyrightLicenseOptions(
    t: (key: string) => string,
): CopyrightLicenseOption[] {
    return [
        'all-rights-reserved',
        'cc-by',
        'cc-by-sa',
        'cc-by-nd',
        'cc-by-nc',
        'cc-by-nc-sa',
        'cc-by-nc-nd',
        'cc-zero',
    ].map((value) => ({
        label: t(`components.post.copyright.licenses.${value}`),
        value: resolveCopyrightType(value),
    }))
}

export function resolveDefaultCopyrightLicense(value?: string | null): CopyrightType {
    return resolveCopyrightType(value)
}
