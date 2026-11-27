import { authClient } from '@/lib/auth-client'
import { DEFAULT_SOCIAL_PROVIDER_AVAILABILITY, type SocialProviderAvailability } from '@/utils/shared/social-providers'

/**
 * 登录 / 注册页共用的社交登录状态与入口。
 *
 * 可用性由服务端在请求期判定（`plugins/social-providers.server.ts`）并随 payload 下发，
 * 不能用构建期固化的 public 配置；回调地址由调用页决定（登录页支持 redirect 参数）。
 */
export function useAuthSocialLogin(getCallbackUrl: () => string) {
    const socialProviders = useState<SocialProviderAvailability>('auth-social-providers', () => ({ ...DEFAULT_SOCIAL_PROVIDER_AVAILABILITY }))
    const hasSocialLogin = computed(() => socialProviders.value.github || socialProviders.value.google)

    const loginWith = async (provider: 'github' | 'google') => {
        await authClient.signIn.social({
            provider,
            callbackURL: getCallbackUrl(),
        })
    }

    return {
        socialProviders,
        hasSocialLogin,
        loginWith,
    }
}
