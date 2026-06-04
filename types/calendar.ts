/** 管线阶段（仅草稿） */
export type PipelineStage = 'ideation' | 'writing' | 'ready'

/** 日历帖子查询参数 */
export interface CalendarPostsQuery {
    startDate: string
    endDate: string
}

/** 日历日分组 */
export interface CalendarDayGroup {
    date: string
    posts: CalendarPostItem[]
}

/** 日历帖子摘要 */
export interface CalendarPostItem {
    id: string
    title: string
    status: string
    publishedAt: string | null
    language: string
    slug: string
}

/** 日历 API 响应 */
export interface CalendarPostsResponse {
    groups: CalendarDayGroup[]
}

/** 看板 API 响应 */
export interface KanbanResponse {
    ideation: KanbanCard[]
    writing: KanbanCard[]
    ready: KanbanCard[]
}

/** 看板卡片 */
export interface KanbanCard {
    id: string
    title: string
    summary: string | null
    status: string
    updatedAt: string | null
    language: string
    categoryName: string | null
    pipelineStage: PipelineStage
}

/** PATCH pipeline-stage 请求体 */
export interface PatchPipelineStageBody {
    pipelineStage: PipelineStage
}
