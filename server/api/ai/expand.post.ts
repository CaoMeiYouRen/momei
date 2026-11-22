import { TextService } from '@/server/services/ai'
import { createTextEditHandler } from '@/server/utils/ai/create-text-edit-handler'

export default createTextEditHandler((body, userId) =>
    TextService.expandContent(body.content, body.style, body.language, userId))
