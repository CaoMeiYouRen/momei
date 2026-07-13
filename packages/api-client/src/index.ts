/**
 * Momei Shared API Client
 *
 * Unified HTTP client and API methods for Momei external API.
 * Used by both CLI and MCP server packages.
 */

import { MomeiHttpClient, MomeiApiError, type MomeiApiClientConfig, type ApiEnvelope } from './client'
import { PostsApi } from './posts'
import { AiApi } from './ai'
import { CategoriesApi } from './categories'
import { TagsApi } from './tags'
import { SnippetsApi } from './snippets'
import { VersionsApi } from './versions'
import { MigrationsApi } from './migrations'
import { extractTagNames } from './utils'

export { MomeiHttpClient, MomeiApiError }
export type { MomeiApiClientConfig, ApiEnvelope }
export { PostsApi, AiApi, CategoriesApi, TagsApi, SnippetsApi, VersionsApi, MigrationsApi }
export { extractTagNames }
export * from './types'

export interface MomeiApi {
    posts: PostsApi
    ai: AiApi
    categories: CategoriesApi
    tags: TagsApi
    snippets: SnippetsApi
    versions: VersionsApi
    migrations: MigrationsApi
    client: MomeiHttpClient
}

/**
 * Factory function to create a fully configured Momei API client
 */
export function createMomeiApi(config: MomeiApiClientConfig): MomeiApi {
    const client = new MomeiHttpClient(config)
    return {
        posts: new PostsApi(client),
        ai: new AiApi(client),
        categories: new CategoriesApi(client),
        tags: new TagsApi(client),
        snippets: new SnippetsApi(client),
        versions: new VersionsApi(client),
        migrations: new MigrationsApi(client),
        client,
    }
}
