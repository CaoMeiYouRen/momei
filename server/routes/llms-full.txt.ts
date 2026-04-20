import { buildLlmsDocument, fetchPublishedLlmsPosts } from '@/server/utils/llms'

const DEFAULT_LLMS_DESCRIPTION = 'Expanded public content index for multilingual developer blog articles, categories, tags, feeds, and structured data.'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const siteUrl = config.public.siteUrl || 'https://momei.app'
    const appName = config.public.appName || '墨梅博客'
    const posts = await fetchPublishedLlmsPosts(80)

    setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')

    return buildLlmsDocument({
        siteUrl,
        appName,
        description: DEFAULT_LLMS_DESCRIPTION,
        posts,
        full: true,
    })
})
