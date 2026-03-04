/**
 * ActivityPub 和 WebFinger 协议相关类型定义
 */

// ============================================================================
// WebFinger 协议类型
// ============================================================================

/**
 * WebFinger 响应 (JSON Resource Descriptor)
 * @see https://www.rfc-editor.org/rfc/rfc7033
 */
export interface WebFingerResponse {
    subject: string
    aliases?: string[]
    properties?: Record<string, string>
    links?: WebFingerLink[]
}

/**
 * WebFinger 链接
 */
export interface WebFingerLink {
    rel: string
    type?: string
    href?: string
    titles?: Record<string, string>
    properties?: Record<string, string>
    template?: string
}

// ============================================================================
// ActivityPub 核心类型
// ============================================================================

/**
 * ActivityPub Actor (用户/服务)
 * @see https://www.w3.org/TR/activitypub/#actor-objects
 */
export interface ActivityPubActor {
    '@context': string[]
    id: string
    type: 'Person' | 'Service' | 'Group' | 'Organization' | 'Application'
    inbox: string
    outbox: string
    followers?: string
    following?: string
    preferredUsername: string
    name: string
    summary?: string
    icon?: ActivityPubImage
    image?: ActivityPubImage
    url?: string | ActivityPubLink
    publicKey: ActivityPubPublicKey
    endpoints?: {
        sharedInbox?: string
    }
    discoverable?: boolean
    manuallyApprovesFollowers?: boolean
    published?: string
}

/**
 * ActivityPub Note (文章)
 * @see https://www.w3.org/TR/activitystreams-vocabulary/#dfn-note
 */
export interface ActivityPubNote {
    '@context': string[]
    id: string
    type: 'Note' | 'Article'
    published: string
    updated?: string
    attributedTo: string
    content: string
    summary?: string
    name?: string
    url: string
    to: string[]
    cc: string[]
    inReplyTo?: string | ActivityPubObject
    attachment?: ActivityPubAttachment[]
    tag?: ActivityPubTag[]
    replies?: ActivityPubCollection
    sensitive?: boolean
}

/**
 * ActivityPub Article (长文章)
 */
export interface ActivityPubArticle extends ActivityPubNote {
    type: 'Article'
}

/**
 * ActivityPub 对象基类
 */
export interface ActivityPubObject {
    '@context'?: string[]
    id?: string
    type?: string
    [key: string]: any
}

/**
 * ActivityPub 图片
 */
export interface ActivityPubImage {
    type: 'Image'
    url: string
    mediaType?: string
    name?: string
    width?: number
    height?: number
}

/**
 * ActivityPub 链接
 */
export interface ActivityPubLink {
    type: 'Link'
    href: string
    rel?: string | string[]
    mediaType?: string
    name?: string
}

/**
 * ActivityPub 公钥
 */
export interface ActivityPubPublicKey {
    id: string
    owner: string
    publicKeyPem: string
}

/**
 * ActivityPub 附件
 */
export interface ActivityPubAttachment {
    type: 'Image' | 'Video' | 'Audio' | 'Document'
    url: string
    mediaType?: string
    name?: string
    width?: number
    height?: number
    blurhash?: string
}

/**
 * ActivityPub 标签 (Hashtag/Mention)
 */
export interface ActivityPubTag {
    type: 'Hashtag' | 'Mention'
    href: string
    name: string
}

/**
 * ActivityPub 集合
 */
export interface ActivityPubCollection {
    '@context'?: string[]
    id: string
    type: 'Collection' | 'OrderedCollection'
    totalItems?: number
    items?: ActivityPubObject[]
    orderedItems?: ActivityPubObject[]
    first?: string | ActivityPubCollectionPage
    last?: string | ActivityPubCollectionPage
    current?: string | ActivityPubCollectionPage
}

/**
 * ActivityPub 集合页面
 */
export interface ActivityPubCollectionPage {
    '@context'?: string[]
    id: string
    type: 'CollectionPage' | 'OrderedCollectionPage'
    partOf: string
    items?: ActivityPubObject[]
    orderedItems?: ActivityPubObject[]
    next?: string
    prev?: string
}

// ============================================================================
// ActivityPub 活动类型
// ============================================================================

/**
 * ActivityPub 活动
 */
export interface ActivityPubActivity {
    '@context': string[]
    id: string
    type: 'Create' | 'Update' | 'Delete' | 'Follow' | 'Accept' | 'Reject' | 'Undo' | 'Like' | 'Announce'
    actor: string
    object: string | ActivityPubObject
    published?: string
    to?: string[]
    cc?: string[]
}

/**
 * Follow 活动
 */
export interface FollowActivity extends ActivityPubActivity {
    type: 'Follow'
    object: string
}

/**
 * Accept 活动
 */
export interface AcceptActivity extends ActivityPubActivity {
    type: 'Accept'
    object: FollowActivity
}

/**
 * Create 活动
 */
export interface CreateActivity extends ActivityPubActivity {
    type: 'Create'
    object: ActivityPubNote | ActivityPubArticle
}

// ============================================================================
// 密钥管理类型
// ============================================================================

/**
 * RSA 密钥对
 */
export interface RSAKeyPair {
    publicKey: string
    privateKey: string
}

/**
 * HTTP 签名参数
 */
export interface HTTPSignatureParams {
    keyId: string
    headers: string[]
    signature: string
    algorithm?: string
}

/**
 * HTTP 签名验证结果
 */
export interface HTTPSignatureVerification {
    valid: boolean
    keyId?: string
    error?: string
}

// ============================================================================
// Outbox 类型
// ============================================================================

/**
 * Outbox 响应
 */
export interface OutboxResponse extends ActivityPubCollection {
    type: 'OrderedCollection'
    orderedItems?: (CreateActivity | ActivityPubNote)[]
}

// ============================================================================
// 常量
// ============================================================================

/**
 * ActivityPub 公开地址
 */
export const ACTIVITY_PUB_PUBLIC = 'https://www.w3.org/ns/activitystreams#Public'

/**
 * ActivityStreams 上下文
 */
export const ACTIVITY_STREAMS_CONTEXT = 'https://www.w3.org/ns/activitystreams'

/**
 * 安全上下文 (用于公钥)
 */
export const SECURITY_CONTEXT = 'https://w3id.org/security/v1'

/**
 * 默认 ActivityPub 上下文
 */
export const DEFAULT_ACTIVITY_PUB_CONTEXT = [
    ACTIVITY_STREAMS_CONTEXT,
    SECURITY_CONTEXT,
]
