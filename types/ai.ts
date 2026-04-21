// --- Categories ---
export type AICategory = 'text' | 'image' | 'tts' | 'asr' | 'video' | 'podcast'

export type AITaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type AIAdminTaskType =
    | 'text_generation'
    | 'image_generation'
    | 'tts'
    | 'podcast'
    | 'transcription'
    | (string & {})

export type AIChargeStatus = 'none' | 'estimated' | 'actual' | 'waived'

export type AIFailureStage = 'preflight' | 'provider_rejected' | 'provider_processing' | 'post_process'

export interface AIUsageSnapshot {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
    imageCount?: number
    imageResolution?: string
    audioSeconds?: number
    audioBytes?: number
    textChars?: number
    outputChars?: number
    requestCount?: number
}

export type AIQuotaPolicySubjectType = 'global' | 'role' | 'trust_level' | 'user'

export type AIQuotaPolicyPeriod = 'day' | 'month'

export type AIQuotaPolicyScope = 'all' | Exclude<AICategory, 'video'> | `type:${string}`

export type AIAlertSeverity = 'info' | 'warning' | 'critical'

export type AIAlertKind = 'quota_usage' | 'cost_usage' | 'failure_burst'

export interface AIQuotaPolicy {
    subjectType: AIQuotaPolicySubjectType
    subjectValue: string
    scope: AIQuotaPolicyScope
    period: AIQuotaPolicyPeriod
    maxRequests?: number
    maxQuotaUnits?: number
    maxActualCost?: number
    maxConcurrentHeavyTasks?: number
    isExempt?: boolean
    enabled: boolean
}

export interface AIAlertFailureBurstConfig {
    enabled?: boolean
    windowMinutes?: number
    maxFailures?: number
    categories?: (Exclude<AICategory, 'video'> | 'all')[]
}

export interface AIAlertThresholdSettings {
    enabled?: boolean
    quotaUsageRatios?: number[]
    costUsageRatios?: number[]
    failureBurst?: AIAlertFailureBurstConfig
    dedupeWindowMinutes?: number
    maxAlerts?: number
}

export interface AICostFactors {
    currencyCode: string
    currencySymbol: string
    quotaUnitPrice: number
    exchangeRates: Record<string, number>
    providerCurrencies: Record<string, string>
}

export interface AICostDisplay {
    currencyCode: string
    currencySymbol: string
    quotaUnitPrice: number
}

export type TTSSynthesisMode = 'speech' | 'podcast'

export interface TTSConfigResponse {
    defaultProvider: string
    availableProviders: string[]
    providerModes: Record<string, TTSSynthesisMode[]>
}

export interface TTSVoiceOption {
    id: string
    name: string
    description?: string | null
}

export interface TTSEstimateResponse {
    providerCost: number
    providerCurrency: string
    displayCost: number
    quotaUnits: number
    costDisplay: AICostDisplay
}

export interface TTSTaskCreateResponse {
    taskId: string
    estimatedCost: number
    estimatedQuotaUnits: number
}

export type AIAdminTaskDataValue = string | Record<string, unknown> | null

export interface AIAdminTaskListFilters {
    search: string
    type: AIAdminTaskType | null
    status: AITaskStatus | null
}

export interface AIAdminTaskListItem {
    id: string
    category: AICategory | null
    type: AIAdminTaskType
    status: AITaskStatus
    provider: string | null
    model: string | null
    estimatedCost: number
    actualCost: number
    estimatedQuotaUnits: number
    quotaUnits: number
    chargeStatus: AIChargeStatus | null
    failureStage: AIFailureStage | null
    durationMs: number
    createdAt: string | Date
    startedAt: string | Date | null
    completedAt: string | Date | null
    userId: string
    user_name: string | null
    user_email: string | null
    user_image: string | null
}

export interface AIAdminTaskDetailItem extends AIAdminTaskListItem {
    id: string
    usageSnapshot: AIAdminTaskDataValue
    payload: AIAdminTaskDataValue
    result: AIAdminTaskDataValue
    error: string | null
    audioDuration: number
    audioSize: number
    textLength: number
    language: string | null
}

export interface AIAdminTaskListResponse {
    items: AIAdminTaskListItem[]
    total: number
    costDisplay: AICostDisplay
}

export interface AITaskDetailResponse {
    item: AIAdminTaskDetailItem
    costDisplay: AICostDisplay
}

export interface AIAdminStatsOverview {
    totalTasks: number
    estimatedCost: number
    actualCost: number
    estimatedQuotaUnits: number
    quotaUnits: number
    avgDurationMs: number
    successRate: number
    failureRate: number
}

export interface AIAdminStatusStat {
    status: AITaskStatus
    count: number
}

export interface AIAdminTypeStat {
    type: AIAdminTaskType
    count: number
}

export interface AIAdminCategoryStat {
    category: AICategory | null
    count: number
    actualCost: number
    quotaUnits: number
}

export interface AIAdminChargeStatusStat {
    chargeStatus: AIChargeStatus
    count: number
}

export interface AIAdminFailureStageStat {
    failureStage: AIFailureStage
    count: number
}

export interface AIAdminModelStat {
    provider: string | null
    model: string | null
    count: number
}

export interface AIAdminTopUserStat {
    userId: string
    name: string | null
    actualCost: number
    quotaUnits: number
    taskCount: number
}

export interface AIAdminDailyTrendStat {
    date: string
    count: number
    actualCost: number
    quotaUnits: number
}

export interface AIAdminStatsResponse {
    overview: AIAdminStatsOverview
    statusStats: AIAdminStatusStat[]
    typeStats: AIAdminTypeStat[]
    categoryStats: AIAdminCategoryStat[]
    chargeStatusStats: AIAdminChargeStatusStat[]
    failureStageStats: AIAdminFailureStageStat[]
    modelStats: AIAdminModelStat[]
    topUsers: AIAdminTopUserStat[]
    dailyTrend: AIAdminDailyTrendStat[]
    alerts: AIUsageAlert[]
    costDisplay: AICostDisplay
}

export interface AIUsageAlert {
    dedupeKey: string
    kind: AIAlertKind
    severity: AIAlertSeverity
    period: AIQuotaPolicyPeriod | 'rolling'
    scope: AIQuotaPolicyScope | 'all'
    subjectType: 'user'
    subjectValue: string
    subjectName?: string
    userRole?: string | null
    threshold: number
    usedValue: number
    limitValue: number
    ratio?: number
    failureCount?: number
    windowMinutes?: number
    policySubjectType?: AIQuotaPolicySubjectType
    policySubjectValue?: string
}

export type AIRole = 'system' | 'user' | 'assistant'

// --- Text/Chat ---
// ... (rest of the file)
export interface AIChatMessage {
    role: AIRole
    content: string
}

export interface AIChatOptions {
    model?: string
    messages: AIChatMessage[]
    temperature?: number
    maxTokens?: number
    stream?: boolean
    signal?: AbortSignal
}

export interface AIChatStreamChunk {
    delta?: string
    content?: string
    model?: string
    usage?: AIChatResponse['usage']
    raw?: unknown
}

export interface AIChatResponse {
    content: string
    model: string
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
    raw?: any
}

// --- Image ---
export type AIVisualAssetUsage = 'post-cover' | 'post-illustration' | 'topic-hero' | 'event-poster'

export type AIVisualAssetApplyMode = 'auto-apply' | 'manual-confirm'

export interface AIVisualPromptDimensions {
    type: string
    palette: string
    rendering: string
    text: string
    mood: string
}

export interface AIVisualPromptSuggestion {
    assetUsage: AIVisualAssetUsage
    applyMode: AIVisualAssetApplyMode
    dimensions: AIVisualPromptDimensions
    prompt: string
}

export interface AIImageOptions {
    prompt: string
    postId?: string
    targetLanguage?: string
    translationId?: string | null
    applyToPost?: boolean
    overwriteExistingCover?: boolean
    assetUsage?: AIVisualAssetUsage
    applyMode?: AIVisualAssetApplyMode
    promptDimensions?: AIVisualPromptDimensions
    model?: string
    size?: string // e.g., '1024x1024'
    aspectRatio?: string // e.g., '1:1', '16:9', '9:16'
    quality?: 'standard' | 'hd'
    style?: 'vivid' | 'natural'
    n?: number // Number of images to generate
}

export interface AIImageResponse {
    images: {
        url: string
        revisedPrompt?: string
    }[]
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
    model?: string
    raw?: any
}

// --- TTS (Text to Speech) ---
export interface TTSAudioVoice {
    id: string
    name: string
    language: string
    gender: 'male' | 'female' | 'neutral'
    mode?: 'speech' | 'podcast'
    previewUrl?: string
}

export interface TTSOptions {
    mode?: 'speech' | 'podcast'
    speed?: number
    pitch?: number
    volume?: number
    language?: string
    model?: string
    sampleRate?: number
    outputFormat?: string
    skipRecording?: boolean
    taskId?: string
}

export interface TTSVoiceQuery {
    mode?: 'speech' | 'podcast'
}

// --- ASR (Speech to Text) ---
export interface TranscribeOptions {
    audioBuffer: Buffer
    fileName: string
    mimeType: string
    language?: string
    prompt?: string
    model?: string
}

export interface TranscribeResponse {
    text: string
    language: string
    duration: number
    confidence: number
    usage: {
        audioSeconds: number
    }
}

// --- Providers ---
export interface AIProvider {
    name: string
    // Text
    chat?(options: AIChatOptions): Promise<AIChatResponse>
    chatStream?(options: AIChatOptions): AsyncGenerator<AIChatStreamChunk, void, void>
    // Image
    generateImage?(options: AIImageOptions): Promise<AIImageResponse>
    // TTS
    getVoices?(query?: TTSVoiceQuery): Promise<TTSAudioVoice[]>
    generateSpeech?(text: string, voice: string | string[], options: TTSOptions): Promise<ReadableStream<Uint8Array>>
    estimateTTSCost?(text: string, voice: string | string[]): Promise<number>
    estimateCost?(text: string, voice: string | string[]): Promise<number>
    // ASR
    transcribe?(options: TranscribeOptions): Promise<TranscribeResponse>
    // General
    check?(): Promise<boolean>
}

// --- Configs ---
export type AIProviderType = 'openai' | 'anthropic' | 'gemini' | 'stable-diffusion' | 'doubao' | 'siliconflow' | 'volcengine' | 'deepseek'

export interface AIConfig {
    enabled: boolean
    provider: AIProviderType
    apiKey: string
    model: string
    endpoint?: string
    maxTokens?: number
    temperature?: number
}

export type AIImageConfig = AIConfig
export type AITTSConfig = AIConfig
export type AIASRConfig = AIConfig
