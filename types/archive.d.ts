export interface ArchiveMonth { month: number, count: number }
export interface ArchiveYear { year: number, months: ArchiveMonth[] }
export interface ApiResponse<T = any> { code: number, message?: string, data?: T, locale?: string }
