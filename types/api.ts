/**
 * 通用 API 响应接口
 */
export interface ApiResponse<T = any> {
    code: number
    data: T
    message?: string
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
