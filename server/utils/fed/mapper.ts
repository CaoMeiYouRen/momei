import MarkdownIt from 'markdown-it'
import { getOrCreateUserKeyPair } from './crypto'
import type { User } from '@/server/entities/user'
import type { Post } from '@/server/entities/post'
import {
    ACTIVITY_PUB_PUBLIC,
    ACTIVITY_STREAMS_CONTEXT,
    DEFAULT_ACTIVITY_PUB_CONTEXT,
    type ActivityPubActor,
    type ActivityPubAttachment,
    type ActivityPubNote,
    type ActivityPubTag,
} from '@/types/federation'

/**
 * Markdown 渲染器
 */
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
})

/**
 * 将 User 实体转换为 ActivityPub Actor
 * @param user 用户实体
 * @param siteUrl 站点 URL
 * @returns ActivityPub Actor 对象
 */
export async function userToActor(user: User, siteUrl: string): Promise<ActivityPubActor> {
    const actorUrl = `${siteUrl}/fed/actor/${user.username}`

    // 获取或创建用户密钥对
    const keyPair = await getOrCreateUserKeyPair(user.id)

    return {
        '@context': DEFAULT_ACTIVITY_PUB_CONTEXT,
        id: actorUrl,
        type: 'Person',
        inbox: `${actorUrl}/inbox`,
        outbox: `${actorUrl}/outbox`,
        followers: `${actorUrl}/followers`,
        following: `${actorUrl}/following`,
        preferredUsername: user.username || '',
        name: user.name || user.username || '',
        summary: undefined, // User entity does not have bio field
        icon: user.image
            ? {
                type: 'Image',
                url: user.image,
            }
            : undefined,
        image: user.image
            ? {
                type: 'Image',
                url: user.image,
            }
            : undefined,
        url: `${siteUrl}/authors/${user.username}`,
        publicKey: {
            id: `${actorUrl}#main-key`,
            owner: actorUrl,
            publicKeyPem: keyPair.publicKey,
        },
        endpoints: {
            sharedInbox: `${siteUrl}/fed/inbox`,
        },
        discoverable: true,
        manuallyApprovesFollowers: false,
        published: user.createdAt.toISOString(),
    }
}

/**
 * 将 Post 实体转换为 ActivityPub Note/Article
 * @param post 文章实体
 * @param siteUrl 站点 URL
 * @returns ActivityPub Note 对象
 */
export async function postToNote(post: Post, siteUrl: string): Promise<ActivityPubNote> {
    const author = post.author
    const tags = post.tags || []

    const authorUrl = `${siteUrl}/fed/actor/${author.username}`
    const postUrl = `${siteUrl}/posts/${post.slug}`
    const noteId = `${siteUrl}/fed/note/${post.id}`

    // 构建附件 (封面图)
    const attachments: ActivityPubAttachment[] = []
    if (post.coverImage) {
        attachments.push({
            type: 'Image',
            url: post.coverImage,
            mediaType: guessMediaType(post.coverImage),
            name: post.title,
        })
    }

    // 构建标签
    const hashtagObjects: ActivityPubTag[] = tags.map((tag) => ({
        type: 'Hashtag',
        href: `${siteUrl}/tags/${tag.slug}`,
        name: `#${tag.name}`,
    }))

    // 添加分类作为标签
    if (post.category) {
        hashtagObjects.push({
            type: 'Hashtag',
            href: `${siteUrl}/categories/${post.category.slug}`,
            name: `#${post.category.name}`,
        })
    }

    // 渲染 Markdown 内容为 HTML
    const contentHtml = md.render(post.content || '')

    return {
        '@context': [ACTIVITY_STREAMS_CONTEXT] as string[], // 只使用 ActivityStreams 上下文
        id: noteId,
        type: 'Article',
        published: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
        updated: post.updatedAt.toISOString(),
        attributedTo: authorUrl,
        content: contentHtml,
        summary: post.summary || undefined,
        name: post.title,
        url: postUrl,
        to: [ACTIVITY_PUB_PUBLIC],
        cc: [`${authorUrl}/followers`],
        attachment: attachments.length > 0 ? attachments : undefined,
        tag: hashtagObjects.length > 0 ? hashtagObjects : undefined,
        sensitive: false,
    }
}

/**
 * 将 Post 转换为 Create 活动
 * @param post 文章实体
 * @param siteUrl 站点 URL
 * @returns Create 活动对象
 */
export async function postToCreateActivity(post: Post, siteUrl: string) {
    const note = await postToNote(post, siteUrl)
    const authorUrl = `${siteUrl}/fed/actor/${post.author.username}`

    return {
        '@context': DEFAULT_ACTIVITY_PUB_CONTEXT,
        id: `${note.id}#create`,
        type: 'Create',
        actor: authorUrl,
        object: note,
        published: note.published,
        to: note.to,
        cc: note.cc,
    }
}

/**
 * 根据文件 URL 猜测媒体类型
 * @param url 文件 URL
 * @returns 媒体类型
 */
function guessMediaType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        mp4: 'video/mp4',
        webm: 'video/webm',
        mp3: 'audio/mpeg',
        ogg: 'audio/ogg',
    }
    return mimeTypes[ext || ''] || 'application/octet-stream'
}

/**
 * 构建 Outbox 集合
 * @param username 用户名
 * @param posts 文章列表
 * @param siteUrl 站点 URL
 * @param total 总数
 * @returns OrderedCollection
 */
export async function buildOutboxCollection(
    username: string,
    posts: Post[],
    siteUrl: string,
    total: number,
) {
    const outboxUrl = `${siteUrl}/fed/outbox/${username}`

    const items = await Promise.all(
        posts.map((post) => postToCreateActivity(post, siteUrl)),
    )

    return {
        '@context': DEFAULT_ACTIVITY_PUB_CONTEXT,
        id: outboxUrl,
        type: 'OrderedCollection',
        totalItems: total,
        orderedItems: items,
    }
}

/**
 * 构建 Followers/Following 集合
 * @param type 集合类型
 * @param username 用户名
 * @param total 总数
 * @param siteUrl 站点 URL
 * @returns Collection
 */
export function buildCollection(
    type: 'followers' | 'following',
    username: string,
    total: number,
    siteUrl: string,
) {
    const collectionUrl = `${siteUrl}/fed/actor/${username}/${type}`

    return {
        '@context': DEFAULT_ACTIVITY_PUB_CONTEXT,
        id: collectionUrl,
        type: 'Collection',
        totalItems: total,
        first: `${collectionUrl}?page=1`,
    }
}
