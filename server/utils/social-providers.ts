import {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
} from '@/utils/shared/env'
import type { SocialProviderAvailability } from '@/utils/shared/social-providers'

/**
 * 社交登录提供方的**单一事实源**（仅服务端）。
 *
 * 背景（2026-11 修复）：此前可用性在 `nuxt.config.ts` 里用 `process.env` 计算成布尔值写入
 * `runtimeConfig.public`。`nuxt.config` 只在**构建期**执行，而 Nuxt 的运行期环境变量注入只认
 * `NUXT_*` 前缀——`GITHUB_CLIENT_SECRET` / `GOOGLE_CLIENT_SECRET` 这类非前缀变量在构建期通常为空，
 * 于是布尔值被永久烘焙为 `false`，生产环境的登录页即使配置了密钥也不显示社交登录按钮。
 *
 * 现在改由服务端在**请求期**判定：本模块读取的是服务端运行期的 `process.env`（经 `utils/shared/env`
 * 的同一套解析），`lib/auth.ts` 与 `plugins/social-providers.server.ts`（写入 `useState`）共用同一实现，
 * 避免「按钮显示但服务端未启用」或反之的口径分裂。
 */

/** 显式注入的凭据（仅用于单测；生产路径从 `process.env` 解析）。 */
export interface SocialProviderCredentialsInput {
    githubClientId?: string
    githubClientSecret?: string
    googleClientId?: string
    googleClientSecret?: string
}

export interface SocialProviderCredentials {
    clientId: string
    clientSecret: string
}

export interface EnabledSocialProviders {
    github?: SocialProviderCredentials
    google?: SocialProviderCredentials
}

function resolveCredentials(input?: SocialProviderCredentialsInput): Required<SocialProviderCredentialsInput> {
    /* trim：容器编排里把值写成 `" "` 时不应被判为「已配置」——那会让按钮出现、跳转必然失败。 */
    const normalize = (value: string | undefined) => (value ?? '').trim()

    return {
        githubClientId: normalize(input?.githubClientId ?? GITHUB_CLIENT_ID),
        githubClientSecret: normalize(input?.githubClientSecret ?? GITHUB_CLIENT_SECRET),
        googleClientId: normalize(input?.googleClientId ?? GOOGLE_CLIENT_ID),
        googleClientSecret: normalize(input?.googleClientSecret ?? GOOGLE_CLIENT_SECRET),
    }
}

/**
 * 判定各提供方是否**同时**具备 clientId 与 clientSecret。
 *
 * 只配置一半视为不可用：better-auth 在缺任一项时会在登录跳转阶段抛错，提前隐藏按钮比运行时报错更可控。
 */
export function getSocialProviderAvailability(input?: SocialProviderCredentialsInput): SocialProviderAvailability {
    /* 由启用表派生，保证「按钮可见 = 服务端已启用」只有一份判定表达式。 */
    const enabled = getEnabledSocialProviders(input)

    return {
        github: Boolean(enabled.github),
        google: Boolean(enabled.google),
    }
}

/** 返回 better-auth `socialProviders` 配置（只含凭据齐全的提供方）。 */
export function getEnabledSocialProviders(input?: SocialProviderCredentialsInput): EnabledSocialProviders {
    const credentials = resolveCredentials(input)
    const providers: EnabledSocialProviders = {}

    if (credentials.githubClientId && credentials.githubClientSecret) {
        providers.github = {
            clientId: credentials.githubClientId,
            clientSecret: credentials.githubClientSecret,
        }
    }

    if (credentials.googleClientId && credentials.googleClientSecret) {
        providers.google = {
            clientId: credentials.googleClientId,
            clientSecret: credentials.googleClientSecret,
        }
    }

    return providers
}
