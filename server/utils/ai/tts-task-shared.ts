/**
 * TTS 任务创建共享 helper
 *
 * 从 server/api/ai/tts/task.post.ts 与 server/api/external/ai/tts/task.post.ts
 * 提取配额计算、成本估算、Model 解析、任务创建与后台启动的重复逻辑。
 */
import { dataSource } from '@/server/database'
import { AITask } from '@/server/entities/ai-task'
import { TTSService } from '@/server/services/ai'
import { assertAIQuotaAllowance } from '@/server/services/ai/quota-governance'
import { calculateQuotaUnits, deriveChargeStatus, normalizeUsageSnapshot } from '@/server/utils/ai/cost-governance'
import { isServerlessEnvironment } from '@/server/utils/env'
import type { TTSSynthesisMode } from '@/types/ai'

export interface CreateTTSTaskParams {
    userId: string
    postId?: string
    content: string
    voice: string
    provider?: string
    mode: TTSSynthesisMode
    model?: string
    language?: string | null
    /** 额外的 payload 字段，合并到 taskPayload 中 */
    extraPayload?: Record<string, unknown>
    /** 自定义 task 字段，覆盖 / 合并到 taskRepo.create() */
    taskOverrides?: Partial<AITask>
    /** 已预先计算的 estimatedQuotaUnits（可选，跳过自动计算） */
    precomputedQuota?: number
}

export interface CreateTTSTaskResult {
    task: AITask
    estimatedCost: number
    estimatedQuotaUnits: number
}

/**
 * 创建 TTS 后台任务（含配额检查、成本估算、任务持久化与后台处理启动）
 */
export async function createTTSTask(params: CreateTTSTaskParams): Promise<CreateTTSTaskResult> {
    const {
        userId,
        postId,
        content,
        voice,
        provider,
        mode,
        model,
        language,
        extraPayload = {},
        precomputedQuota,
    } = params

    const taskCategory: 'tts' | 'podcast' = mode === 'podcast' ? 'podcast' : 'tts'
    const taskPayload = {
        postId: postId || undefined,
        text: content,
        voice,
        mode,
        language: language || null,
        ...extraPayload,
    }

    // 1. 配额与成本估算
    const estimatedQuotaUnits = precomputedQuota ?? calculateQuotaUnits({
        category: taskCategory,
        type: taskCategory,
        payload: taskPayload,
        usageSnapshot: normalizeUsageSnapshot({
            category: taskCategory,
            type: taskCategory,
            payload: taskPayload,
            textLength: content.length,
        }),
    })

    const estimatedCost = await TTSService.estimateCost(content, voice, provider, {
        mode,
        quotaUnits: estimatedQuotaUnits,
    })

    await assertAIQuotaAllowance({
        userId,
        userRole: 'user',
        category: taskCategory,
        type: taskCategory,
        payload: taskPayload,
        estimatedQuotaUnits,
        estimatedCost,
    })

    // 2. 解析 model
    let finalModel = model
    if (!finalModel) {
        const providerObj = await TTSService.getProvider(provider || 'volcengine')
        finalModel = (providerObj as unknown as Record<string, unknown>).model as string
            || (providerObj as unknown as Record<string, unknown>).defaultModel as string
            || 'unknown'
    }

    // 3. 创建任务
    const taskRepo = dataSource.getRepository(AITask)
    const task = taskRepo.create({
        category: taskCategory,
        type: taskCategory,
        postId: postId || undefined,
        userId,
        provider: provider || 'volcengine',
        mode,
        voice,
        model: finalModel || 'unknown',
        script: content,
        payload: JSON.stringify(taskPayload),
        status: 'pending',
        progress: 0,
        estimatedCost,
        estimatedQuotaUnits,
        chargeStatus: deriveChargeStatus({
            status: 'pending',
            quotaUnits: estimatedQuotaUnits,
            settlementSource: 'estimated',
        }),
        ...params.taskOverrides,
    })

    await taskRepo.save(task)

    // 4. 启动后台处理
    const backgroundTask = TTSService.processTask(task.id).catch((err) => {
        console.error('TTS Background Task Error:', err)
    })

    if (isServerlessEnvironment()) {
        // event.waitUntil 调用由上层 handler 负责
        // 这里仅在 Shared 层保留后台启动逻辑
        void backgroundTask
    }

    return { task, estimatedCost, estimatedQuotaUnits }
}
