export type ArchiveMonth = { month: number, count: number }
export type ArchiveYear = { year: number, months: ArchiveMonth[] }
export type ApiResponse<T = any> = { code: number, message?: string, data?: T }
