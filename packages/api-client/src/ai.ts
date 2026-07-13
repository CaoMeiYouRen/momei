import type { MomeiHttpClient } from './client'
import type {
    MomeiAutomationTaskStartResponse,
    MomeiAutomationTaskStatusResponse,
    MomeiCategoryRecommendationResult,
    MomeiCoverImagePayload,
    MomeiCreateTTSPayload,
    MomeiRecommendCategoriesPayload,
    MomeiRecommendTagsPayload,
    MomeiSuggestTitlesPayload,
    MomeiTranslatePostRequest,
} from './types'

export class AiApi {
    constructor(private client: MomeiHttpClient) {}

    async suggestTitles(payload: MomeiSuggestTitlesPayload): Promise<string[]> {
        return this.client.post<string[]>('/api/external/ai/suggest-titles', payload).then((r) => r.data)
    }

    async recommendTags(payload: MomeiRecommendTagsPayload): Promise<string[]> {
        return this.client.post<string[]>('/api/external/ai/recommend-tags', payload).then((r) => r.data)
    }

    async recommendCategories(payload: MomeiRecommendCategoriesPayload): Promise<MomeiCategoryRecommendationResult> {
        return this.client.post<MomeiCategoryRecommendationResult>('/api/external/ai/recommend-categories', payload).then((r) => r.data)
    }

    async translatePost(payload: MomeiTranslatePostRequest): Promise<MomeiAutomationTaskStartResponse> {
        return this.client.post<MomeiAutomationTaskStartResponse>('/api/external/ai/translate-post', payload).then((r) => r.data)
    }

    async generateCoverImage(payload: MomeiCoverImagePayload): Promise<MomeiAutomationTaskStartResponse> {
        return this.client.post<MomeiAutomationTaskStartResponse>('/api/external/ai/image/generate', payload).then((r) => r.data)
    }

    async createTTSTask(payload: MomeiCreateTTSPayload): Promise<MomeiAutomationTaskStartResponse> {
        return this.client.post<MomeiAutomationTaskStartResponse>('/api/external/ai/tts/task', payload).then((r) => r.data)
    }

    async getTask(taskId: string): Promise<MomeiAutomationTaskStatusResponse> {
        return this.client.get<MomeiAutomationTaskStatusResponse>(`/api/external/ai/tasks/${taskId}`).then((r) => r.data)
    }
}
