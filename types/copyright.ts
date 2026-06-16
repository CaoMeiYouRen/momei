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
