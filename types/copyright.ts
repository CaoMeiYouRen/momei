export type CopyrightType =
    | 'all-rights-reserved' // 默认：所有权利保留，禁止转载
    | 'cc-by' // 署名 (BY)
    | 'cc-by-sa' // 署名-相同方式共享 (BY-SA)
    | 'cc-by-nd' // 署名-禁止演绎 (BY-ND)
    | 'cc-by-nc' // 署名-非商业性使用 (BY-NC)
    | 'cc-by-nc-sa' // 署名-非商业性使用-相同方式共享 (BY-NC-SA)
    | 'cc-by-nc-nd' // 署名-非商业性使用-禁止演绎 (BY-NC-ND)
    | 'cc-zero' // CC0 (零版权)

export interface LicenseMeta {
    id: CopyrightType
    url?: string
}

export const COPYRIGHT_LICENSES: Record<CopyrightType, LicenseMeta> = {
    'all-rights-reserved': {
        id: 'all-rights-reserved',
    },
    'cc-by': {
        id: 'cc-by',
        url: 'https://creativecommons.org/licenses/by/4.0/',
    },
    'cc-by-sa': {
        id: 'cc-by-sa',
        url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    'cc-by-nd': {
        id: 'cc-by-nd',
        url: 'https://creativecommons.org/licenses/by-nd/4.0/',
    },
    'cc-by-nc': {
        id: 'cc-by-nc',
        url: 'https://creativecommons.org/licenses/by-nc/4.0/',
    },
    'cc-by-nc-sa': {
        id: 'cc-by-nc-sa',
        url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    },
    'cc-by-nc-nd': {
        id: 'cc-by-nc-nd',
        url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    },
    'cc-zero': {
        id: 'cc-zero',
        url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
}
