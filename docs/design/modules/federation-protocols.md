# 开放发布协议支持 (Open Federation Protocols)

## 1. 概述 (Overview)

本文档定义了墨梅博客的开放发布协议支持方案，实现与其他去中心化社交网络的互操作性，包括 ActivityPub (Mastodon/Fediverse) 和 RSS/Atom/JSON Feed 协议。

**核心目标**：
- 实现 WebFinger 和 ActivityPub 基础协议
- 支持 Post → Note 的内容映射
- 完善 RSS/Atom/JSON Feed 多格式支持

## 2. 协议架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                      开放协议架构                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Fediverse Layer                          │   │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  │   │
│  │  │ WebFinger    │─▶│  ActivityPub     │─▶│   Inbox/     │  │   │
│  │  │ Discovery    │  │  Actor/Note      │  │   Outbox     │  │   │
│  │  └──────────────┘  └──────────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Syndication Layer                        │   │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  │   │
│  │  │   RSS 2.0    │  │    Atom 1.0      │  │ JSON Feed    │  │   │
│  │  │   (Legacy)   │  │    (Enhanced)    │  │  (Modern)    │  │   │
│  │  └──────────────┘  └──────────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Content Mapping                          │   │
│  │              Post ←→ Note ←→ Feed Item                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. WebFinger 协议

### 3.1 协议说明

WebFinger 用于发现用户资源的元数据，是 ActivityPub 的前置协议。

**端点**: `/.well-known/webfinger`

### 3.2 实现

**位置**: `server/routes/.well-known/webfinger.ts`

```typescript
import { H3Event } from 'h3'

interface WebFingerRequest {
  resource: string // acct:user@domain
  rel?: string[]
}

interface WebFingerResponse {
  subject: string
  aliases: string[]
  links: Array<{
    rel: string
    type: string
    href: string
  }>
}

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const resource = query.resource as string

  if (!resource?.startsWith('acct:')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid resource format',
    })
  })

  // 解析用户名
  const [, username] = resource.match(/acct:([^@]+)@/) || []

  // 查找用户
  const user = await User.findOne({
    where: { username },
    relations: ['profile'],
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }

  // 构建响应
  const baseUrl = getBaseUrl(event)
  const actorUrl = `${baseUrl}/fed/actor/${user.username}`

  const response: WebFingerResponse = {
    subject: resource,
    aliases: [actorUrl, `${baseUrl}/@${user.username}`],
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: actorUrl,
      },
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: `${baseUrl}/authors/${user.username}`,
      },
      {
        rel: 'http://ostatus.org/schema/1.0/subscribe',
        template: `${baseUrl}/authorize-follow?uri={uri}`,
      },
    ],
  }

  setHeader(event, 'Content-Type', 'application/jrd+json')
  return response
})
```

## 4. ActivityPub 协议

### 4.1 对象模型

#### Actor (用户)

```typescript
// server/services/fed/activitypub.ts
export interface ActivityPubActor {
  '@context': string[]
  id: string
  type: 'Person' | 'Service' | 'Group'
  inbox: string
  outbox: string
  followers: string
  following: string
  preferredUsername: string
  name: string
  summary?: string
  icon?: {
    type: 'Image'
    url: string
  }
  image?: {
    type: 'Image'
    url: string
  }
  publicKey: {
    id: string
    owner: string
    publicKeyPem: string
  }
  endpoints?: {
    sharedInbox?: string
  }
}

/**
 * 将 User 实体转换为 ActivityPub Actor
 */
export async function userToActor(user: User, baseUrl: string): Promise<ActivityPubActor> {
  const actorUrl = `${baseUrl}/fed/actor/${user.username}`

  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
    ],
    id: actorUrl,
    type: 'Person',
    inbox: `${actorUrl}/inbox`,
    outbox: `${actorUrl}/outbox`,
    followers: `${actorUrl}/followers`,
    following: `${actorUrl}/following`,
    preferredUsername: user.username,
    name: user.profile?.displayName || user.username,
    summary: user.profile?.bio,
    icon: user.profile?.avatar ? {
      type: 'Image',
      url: user.profile.avatar,
    } : undefined,
    publicKey: {
      id: `${actorUrl}#main-key`,
      owner: actorUrl,
      publicKeyPem: await getUserPublicKey(user),
    },
  }
}
```

#### Note (文章)

```typescript
export interface ActivityPubNote {
  '@context': string[]
  id: string
  type: 'Note' | 'Article'
  published: string
  attributedTo: string
  content: string
  summary?: string
  url: string
  to: string[]
  cc: string[]
  attachment?: Array<{
    type: 'Image'
    mediaType: string
    url: string
    name?: string
  }>
  tag?: Array<{
    type: 'Hashtag'
    href: string
    name: string
  }>
}

/**
 * 将 Post 实体转换为 ActivityPub Note
 */
export async function postToNote(post: Post, baseUrl: string): Promise<ActivityPubNote> {
  const author = await post.author
  const authorUrl = `${baseUrl}/fed/actor/${author.username}`
  const postUrl = `${baseUrl}/posts/${post.slug}`

  // 获取标签
  const tags = await post.tags
  const hashtagObjects = tags.map(tag => ({
    type: 'Hashtag',
    href: `${baseUrl}/tags/${tag.slug}`,
    name: `#${tag.name}`,
  }))

  // 获取封面图
  const attachments: ActivityPubNote['attachment'] = []
  if (post.coverImage) {
    attachments.push({
      type: 'Image',
      mediaType: 'image/webp',
      url: post.coverImage,
      name: post.title,
    })
  }

  return {
    '@context': ['https://www.w3.org/ns/activitystreams'],
    id: `${baseUrl}/fed/note/${post.id}`,
    type: 'Article',
    published: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    attributedTo: authorUrl,
    content: post.excerpt || post.content,
    summary: post.excerpt,
    url: postUrl,
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: [`${authorUrl}/followers`],
    attachment: attachments.length > 0 ? attachments : undefined,
    tag: hashtagObjects,
  }
}
```

### 4.2 路由设计

| 路由 | 方法 | 描述 |
|:---|:---|:---|
| `/fed/actor/:username` | GET | 获取用户 Actor |
| `/fed/actor/:username/inbox` | POST | 接收入站活动 |
| `/fed/actor/:username/outbox` | GET | 获取用户活动流 |
| `/fed/note/:id` | GET | 获取文章 Note |
| `/fed/followers/:username` | GET | 获取粉丝列表 |
| `/fed/following/:username` | GET | 获取关注列表 |

### 4.3 Actor 端点

```typescript
// server/api/fed/actor/[username].get.ts
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')

  const user = await User.findOne({
    where: { username },
    relations: ['profile'],
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'Actor not found' })
  }

  const actor = await userToActor(user, getBaseUrl(event))

  setHeader(event, 'Content-Type', 'application/activity+json')
  return actor
})
```

### 4.4 Inbox 端点 (接收活动)

```typescript
// server/api/fed/actor/[username]/inbox.post.ts
export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')

  // 验证用户
  const user = await User.findOne({ where: { username } })
  if (!user) {
    throw createError({ statusCode: 404, message: 'Actor not found' })
  }

  // 解析 Activity
  const activity = await readBody(event)

  // 验证签名
  const signature = getHeader(event, 'signature')
  if (!signature || !verifyHttpSignature(event, signature)) {
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  // 处理不同类型的活动
  switch (activity.type) {
    case 'Follow':
      return handleFollow(activity, user)
    case 'Accept':
      return handleAccept(activity, user)
    case 'Undo':
      return handleUndo(activity, user)
    case 'Like':
      return handleLike(activity, user)
    case 'Announce':
      return handleAnnounce(activity, user)
    default:
      throw createError({ statusCode: 400, message: 'Unsupported activity type' })
  }
})

async function handleFollow(activity: any, user: User) {
  const follower = activity.actor

  // 创建或更新关注关系
  let followerRecord = await FedFollower.findOne({
    where: { actorUrl: follower, user: { id: user.id } },
  })

  if (!followerRecord) {
    followerRecord = FedFollower.create({
      actorUrl: follower,
      user,
      state: 'pending',
    })
    await followerRecord.save()
  }

  // 发送 Accept 活动
  await sendAcceptActivity(user, follower, activity)

  return { success: true }
}
```

## 5. RSS/Atom/JSON Feed

### 5.1 当前实现

**位置**: `server/routes/feed.xml.ts`

当前已实现 RSS 2.0 格式。

### 5.2 扩展 Atom 1.0

```typescript
// server/routes/atom.xml.ts
import { Feed } from 'feed'
import { Post } from '~/server/entities'

export default defineEventHandler(async (event) => {
  const baseUrl = getBaseUrl(event)

  // 创建 Feed
  const feed = new Feed({
    id: baseUrl,
    title: runtimeConfig.site.title,
    description: runtimeConfig.site.description,
    link: baseUrl,
    language: 'zh-CN',
    image: `${baseUrl}/icon.png`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} ${runtimeConfig.site.title}`,
    updated: new Date(),
    generator: '墨梅博客',
    feedLinks: {
      atom: `${baseUrl}/atom.xml`,
      rss: `${baseUrl}/feed.xml`,
    },
    author: [
      {
        name: runtimeConfig.site.author,
        email: runtimeConfig.site.email,
        link: baseUrl,
      },
    ],
  })

  // 获取文章
  const posts = await Post.find({
    where: { status: PostStatus.PUBLISHED },
    relations: ['author', 'tags', 'category'],
    order: { publishedAt: 'DESC' },
    take: 50,
  })

  // 添加文章
  for (const post of posts) {
    const author = await post.author
    const category = await post.category
    const tags = await post.tags

    feed.addItem({
      id: `${baseUrl}/posts/${post.slug}`,
      title: post.title,
      description: post.excerpt || '',
      content: post.content,
      link: `${baseUrl}/posts/${post.slug}`,
      date: post.publishedAt || post.createdAt,
      published: post.publishedAt || post.createdAt,
      author: [
        {
          name: author.username,
          link: `${baseUrl}/authors/${author.username}`,
        },
      ],
      category: category
        ? [{ name: category.name, domain: `${baseUrl}/categories/${category.slug}` }]
        : undefined,
      contributor: tags.map(tag => ({
        name: tag.name,
        link: `${baseUrl}/tags/${tag.slug}`,
      })),
    })
  }

  setHeader(event, 'Content-Type', 'application/atom+xml; charset=utf-8')
  return feed.atom1()
})
```

### 5.3 JSON Feed 1.1

```typescript
// server/routes/feed.json.ts
export default defineEventHandler(async (event) => {
  const baseUrl = getBaseUrl(event)

  const posts = await Post.find({
    where: { status: PostStatus.PUBLISHED },
    relations: ['author', 'coverImage', 'tags', 'category'],
    order: { publishedAt: 'DESC' },
    take: 50,
  })

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: runtimeConfig.site.title,
    description: runtimeConfig.site.description,
    home_page_url: baseUrl,
    feed_url: `${baseUrl}/feed.json`,
    icon: `${baseUrl}/icon.png`,
    favicon: `${baseUrl}/favicon.ico`,
    authors: [
      {
        name: runtimeConfig.site.author,
        url: baseUrl,
        avatar: `${baseUrl}/avatar.png`,
      },
    ],
    items: await Promise.all(
      posts.map(async (post) => {
        const author = await post.author
        const tags = await post.tags

        return {
          id: `${baseUrl}/posts/${post.slug}`,
          url: `${baseUrl}/posts/${post.slug}`,
          title: post.title,
          content_html: post.content,
          summary: post.excerpt,
          image: post.coverImage,
          date_published: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
          date_modified: post.updatedAt.toISOString(),
          authors: [
            {
              name: author.username,
              url: `${baseUrl}/authors/${author.username}`,
            },
          ],
          tags: tags.map(tag => tag.name),
          language: post.locale || 'zh-CN',
        }
      })
    ),
  }

  setHeader(event, 'Content-Type', 'application/feed+json')
  return feed
})
```

### 5.4 Feed 发现标签

在 HTML `<head>` 中添加：

```vue
<!-- components/app/Meta.vue -->
<template>
  <Head>
    <!-- RSS 2.0 -->
    <link rel="alternate" type="application/rss+xml" :title="`${siteConfig.title} - RSS`" href="/feed.xml" />

    <!-- Atom 1.0 -->
    <link rel="alternate" type="application/atom+xml" :title="`${siteConfig.title} - Atom`" href="/atom.xml" />

    <!-- JSON Feed -->
    <link rel="alternate" type="application/feed+json" :title="`${siteConfig.title} - JSON Feed`" href="/feed.json" />
  </Head>
</template>
```

## 6. 数据模型设计

### 6.1 FedFollower 实体

```typescript
// server/entities/FedFollower.ts
import { BaseEntity } from './base'
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { User } from './user'

export enum FollowerState {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('fed_followers')
export class FedFollower extends BaseEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column()
  actorUrl: string // 远程 Actor URL

  @Column({ type: 'enum', enum: FollowerState, default: FollowerState.PENDING })
  state: FollowerState

  @Column({ type: 'json', nullable: true })
  actorData: {
    inbox: string
    outbox: string
    publicKey: string
  }

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date | null

  @ManyToOne(() => User)
  @JoinColumn()
  user: User

  @Column()
  userId: string

  @Index()
  @Column()
  inboxUrl: string // 用于快速发送通知
}
```

### 6.2 FedFollowing 实体

```typescript
// server/entities/FedFollowing.ts
@Entity('fed_following')
export class FedFollowing extends BaseEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column()
  targetActorUrl: string // 关注的目标 Actor

  @Column({ type: 'timestamp' })
  followedAt: Date

  @Column({ type: 'json', nullable: true })
  actorData: any

  @ManyToOne(() => User)
  @JoinColumn()
  user: User

  @Column()
  userId: string
}
```

### 6.3 FedActivity 实体

```typescript
// server/entities/FedActivity.ts
@Entity('fed_activities')
export class FedActivity extends BaseEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column()
  activityId: string // 活动 ID

  @Column()
  type: string // Follow, Accept, Like, Announce, etc.

  @Column({ type: 'json' })
  content: any // 完整的 Activity JSON

  @Column({ type: 'boolean', default: false })
  isIncoming: // true = 接收, false = 发送 boolean

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null

  @ManyToOne(() => User)
  @JoinColumn()
  user: User

  @Column()
  userId: string
}
```

## 7. API 接口设计

| 方法 | 路径 | 描述 |
|:---|:---|:---|
| GET | `/.well-known/webfinger` | WebFinger 发现 |
| GET | `/fed/actor/:username` | 获取 Actor |
| POST | `/fed/actor/:username/inbox` | 接收活动 |
| GET | `/fed/actor/:username/outbox` | 获取活动流 |
| GET | `/fed/note/:id` | 获取 Note |
| GET | `/feed.xml` | RSS 2.0 |
| GET | `/atom.xml` | Atom 1.0 |
| GET | `/feed.json` | JSON Feed |

## 8. 安全考虑

### 8.1 HTTP 签名验证

```typescript
// server/utils/fed/signature.ts
import crypto from 'node:crypto'
import type { H3Event } from 'h3'

export interface SignatureHeaders {
  signature: string
  date: string
  digest?: string
}

export function verifyHttpSignature(
  event: H3Event,
  signature: string
): boolean {
  const headers = parseSignatureHeader(signature)

  // 获取 Actor 公钥
  const actor = fetchActor(headers.keyId)
  const publicKey = actor.publicKey.publicKeyPem

  // 构建签名字符串
  const signingString = buildSigningString(headers.headers, event)

  // 验证签名
  const verify = crypto.createVerify('rsa-sha256')
  verify.update(signingString)
  return verify.verify(publicKey, headers.signature, 'base64')
}
```

### 8.2 速率限制
- Inbox 端点需要速率限制，防止 DDoS
- 按 Actor URL 分组限流

### 8.3 内容安全
- 接收的 HTML 内容需要净化
- 验证 Content-Type 为 `application/activity+json`

## 9. 实施计划

### Phase 1: WebFinger + Actor (Week 1)
- [ ] 实现 WebFinger 端点
- [ ] 实现 Actor 获取端点
- [ ] 生成用户密钥对

### Phase 2: Feed 增强 (Week 1-2)
- [ ] 实现 Atom 1.0 输出
- [ ] 实现 JSON Feed 1.1 输出
- [ ] 添加 Feed 发现标签

### Phase 3: ActivityPub Note (Week 2)
- [ ] 实现 Post → Note 映射
- [ ] 实现 Note 获取端点
- [ ] 实现 Outbox 基础功能

### Phase 4: Inbox 接收 (Week 3)
- [ ] 实现 HTTP 签名验证
- [ ] 处理 Follow 活动
- [ ] 处理 Accept 活动

### Phase 5: 测试与验证 (Week 4)
- [ ] 与 Mastodon 实例互测
- [ ] 验证 Feed 阅读器兼容性
- [ ] E2E 测试

## 10. 相关文档

- [博客模块设计](./blog.md)
- [用户模块设计](./user.md)
- [API 设计](../api.md)
- [安全规范](../../standards/security.md)
