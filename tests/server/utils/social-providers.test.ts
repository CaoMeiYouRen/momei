import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * `server/utils/social-providers` 的行为契约。
 *
 * 背景：社交登录可用性原在 `nuxt.config.ts` 用构建期环境变量算成布尔值（见该文件注释），
 * 生产环境下非 `NUXT_` 前缀的 `*_CLIENT_SECRET` 在构建机为空 → 布尔被固化成 `false`。
 * 修复后由本模块在**服务端运行期**判定，`lib/auth.ts` 与公开端点共用。
 *
 * 覆盖口径：只有「clientId 与 clientSecret 同时存在」才算可用——只配置一半时 better-auth
 * 会在跳转阶段抛错，隐藏按钮比运行时报错更可控。
 */

const envState = vi.hoisted(() => ({
    GITHUB_CLIENT_ID: '',
    GITHUB_CLIENT_SECRET: '',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
}))

vi.mock('@/utils/shared/env', () => envState)

const EMPTY_ENV = {
    GITHUB_CLIENT_ID: '',
    GITHUB_CLIENT_SECRET: '',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
}

afterEach(() => {
    Object.assign(envState, EMPTY_ENV)
})

async function importModule() {
    return await import('@/server/utils/social-providers')
}

describe('social providers 可用性判定', () => {
    it('按显式注入的凭据判定（两种提供方都齐全）', async () => {
        const { getSocialProviderAvailability, getEnabledSocialProviders } = await importModule()

        const input = {
            githubClientId: 'github-id',
            githubClientSecret: 'github-secret',
            googleClientId: 'google-id',
            googleClientSecret: 'google-secret',
        }

        expect(getSocialProviderAvailability(input)).toEqual({ github: true, google: true })
        expect(getEnabledSocialProviders(input)).toEqual({
            github: { clientId: 'github-id', clientSecret: 'github-secret' },
            google: { clientId: 'google-id', clientSecret: 'google-secret' },
        })
    })

    it('缺少任一项凭据即视为不可用（避免按钮可见但跳转报错）', async () => {
        const { getSocialProviderAvailability, getEnabledSocialProviders } = await importModule()

        const onlyId = { githubClientId: 'github-id', githubClientSecret: '', googleClientId: '', googleClientSecret: 'google-secret' }
        expect(getSocialProviderAvailability(onlyId)).toEqual({ github: false, google: false })
        expect(getEnabledSocialProviders(onlyId)).toEqual({})

        const onlySecret = { githubClientId: '', githubClientSecret: 'github-secret', googleClientId: 'google-id', googleClientSecret: '' }
        expect(getSocialProviderAvailability(onlySecret)).toEqual({ github: false, google: false })
        expect(getEnabledSocialProviders(onlySecret)).toEqual({})
    })

    it('空白字符不算已配置（容器编排里常见 `" "` 误配）', async () => {
        const { getSocialProviderAvailability } = await importModule()

        expect(getSocialProviderAvailability({
            githubClientId: '   ',
            githubClientSecret: '  ',
            googleClientId: 'google-id',
            googleClientSecret: 'google-secret',
        })).toEqual({ github: false, google: true })
    })

    it('未注入时读取服务端运行期环境（模块级常量；运行期性质另由 E2E 与静态守卫覆盖）', async () => {
        envState.GITHUB_CLIENT_ID = 'env-github-id'
        envState.GITHUB_CLIENT_SECRET = 'env-github-secret'
        envState.GOOGLE_CLIENT_ID = 'env-google-id'
        envState.GOOGLE_CLIENT_SECRET = ''

        const { getSocialProviderAvailability } = await importModule()

        expect(getSocialProviderAvailability()).toEqual({ github: true, google: false })

        envState.GITHUB_CLIENT_ID = ''
        envState.GITHUB_CLIENT_SECRET = ''
    })
})
