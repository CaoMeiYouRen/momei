/**
 * 通用 API 响应接口（统一事实源）。
 * 原在 `types/api.ts`、`types/archive.d.ts`、`server/utils/response.ts` 三处独立定义，现收敛至此。
 */
export interface ApiResponse<T = any> {
    code: number
    data: T
    message?: string
    locale?: string
}

/**
 * 分页请求参数
 */
export interface PageQuery {
    page?: number
    limit?: number
    search?: string
    orderBy?: string
    order?: 'ASC' | 'DESC'
    language?: string
    aggregate?: boolean
}
