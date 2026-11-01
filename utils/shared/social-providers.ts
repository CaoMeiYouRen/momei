/**
 * 社交登录提供方的**可用性口径**（前后端共享的纯类型与默认值）。
 *
 * 为什么单独成文件：可用性必须由**服务端在请求期**判定（依赖 `GITHUB_CLIENT_SECRET` /
 * `GOOGLE_CLIENT_SECRET` 等仅服务端可见的环境变量），前端只能消费结果。类型与默认值放共享层，
 * 避免页面与 API 各写一份字面量后漂移。
 */

/** 各社交登录提供方当前是否可用（服务端判定，前端据此决定是否渲染按钮）。 */
export interface SocialProviderAvailability {
    github: boolean
    google: boolean
}

/**
 * 默认值（全部不可用）。
 *
 * 用途：`useFetch` 的 `default` 与测试替身——在数据到达前不渲染社交按钮，避免闪现后又消失。
 */
export const DEFAULT_SOCIAL_PROVIDER_AVAILABILITY: SocialProviderAvailability = {
    github: false,
    google: false,
}
