import { ref, watchEffect, toValue, type MaybeRefOrGetter } from 'vue'
import { sha256 } from '@/utils/shared/hash'
import { getGravatarUrl } from '@/utils/shared/avatar'

/**
 * 头像处理 Hook
 */
export function useAvatar(email?: MaybeRefOrGetter<string | null | undefined>, name?: MaybeRefOrGetter<string | null | undefined>) {
    const avatarUrl = ref('')

    watchEffect(async () => {
        const emailValue = toValue(email)
        const nameValue = toValue(name)

        if (!emailValue) {
            // 如果没有邮箱，使用 ui-avatars 作为回退
            const displayName = nameValue || 'User'
            avatarUrl.value = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
            return
        }

        try {
            // 计算哈希并生成 Gravatar URL
            const hash = await sha256(emailValue)
            avatarUrl.value = getGravatarUrl(hash)
        } catch (error) {
            console.error('Failed to generate gravatar hash', error)
            // 出错时回退到 ui-avatars
            avatarUrl.value = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameValue || 'User')}&background=random`
        }
    })

    return {
        avatarUrl,
    }
}
