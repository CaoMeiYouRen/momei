import { ref } from 'vue'

/** 发布推送选项。 */
export type PublishPushOption = 'none' | 'draft' | 'now'
/** 推送目标类型。 */
export type PublishPushTargetType = 'all' | 'criteria'

/** 推送条件（按分类 / 标签圈选）。 */
export interface PublishPushCriteria {
    categoryIds?: string[]
    tagIds?: string[]
}

/** `open()` 的入参：用于回填弹窗状态。 */
export interface PublishPushOpenOptions {
    pushOption?: PublishPushOption
    publishedAt?: string | Date | null
    criteria?: PublishPushCriteria
}

/** `confirm` 事件的载荷。 */
export interface PublishPushConfirmPayload {
    pushOption: PublishPushOption
    publishedAt?: Date | null
    pushCriteria?: PublishPushCriteria
}

/**
 * `PublishPushDialog` 的弹窗状态与语义：`open()` 的回填规则、`publishedAt` 的容错解析与
 * `confirm` 载荷的形状属于业务语义，与模板分离，便于单独测试。
 *
 * 职责边界：不持有 `visible`（由各版组件以 `defineModel` 持有，因为 `open()` 需要同时置位可见性）。
 */
export function usePublishPushDialog() {
    const pushOption = ref<PublishPushOption>('none')
    const publishedAt = ref<Date | null>(null)
    const targetType = ref<PublishPushTargetType>('criteria')
    const articleCriteria = ref<PublishPushCriteria>({})

    /** 容错解析：非法或纪元前的日期一律回退为 `null`（由调用方决定是否补当前时间）。 */
    function parsePublishedAt(value?: string | Date | null): Date | null {
        if (!value) {
            return null
        }

        const parsed = value instanceof Date ? value : new Date(value)
        if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= 0) {
            return null
        }

        return parsed
    }

    /** 按 `open()` 入参回填状态；缺省时取「不推送 + 当前时间 + 按条件圈选」。 */
    function resetFromOptions(options?: PublishPushOpenOptions) {
        pushOption.value = options?.pushOption || 'none'
        publishedAt.value = parsePublishedAt(options?.publishedAt) || new Date()
        targetType.value = 'criteria'
        articleCriteria.value = options?.criteria || {}
    }

    /** 组装 `confirm` 载荷：目标为「全部用户」时不带圈选条件。 */
    function buildConfirmPayload(): PublishPushConfirmPayload {
        return {
            pushOption: pushOption.value,
            publishedAt: publishedAt.value,
            pushCriteria: targetType.value === 'all' ? {} : articleCriteria.value,
        }
    }

    // `parsePublishedAt` 只服务 `resetFromOptions`，不作为对外契约暴露（避免被误认为可复用的公共 API）。
    return {
        pushOption,
        publishedAt,
        targetType,
        articleCriteria,
        resetFromOptions,
        buildConfirmPayload,
    }
}
