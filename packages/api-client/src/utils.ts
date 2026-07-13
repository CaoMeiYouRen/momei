/**
 * Shared utility functions extracted from CLI and MCP packages
 */

/**
 * Extract tag names from a post's tags field
 * Compatible with both string[] and object[] formats
 */
export function extractTagNames(post: Record<string, unknown>): string[] {
    const tags = Array.isArray(post.tags) ? post.tags : []
    return tags
        .map((tag) => {
            if (typeof tag === 'string') {
                return tag
            }

            if (tag && typeof tag === 'object' && typeof (tag as { name?: unknown }).name === 'string') {
                return (tag as { name: string }).name
            }

            return null
        })
        .filter((tag): tag is string => Boolean(tag))
}
