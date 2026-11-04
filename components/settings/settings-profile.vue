<template>
    <div class="settings-profile">
        <h3 class="settings-section-title">
            {{ $t("pages.settings.profile.title") }}
        </h3>
        <form class="settings-form" @submit.prevent="handleUpdateProfile">
            <div class="settings-form__field">
                <label>{{ $t("pages.settings.profile.avatar") }}</label>
                <div class="avatar-section">
                    <!-- 头像 URL 依赖异步哈希 / 会话数据，SSR 与客户端首帧不一致；Reka 的
                         `AvatarImage` / `AvatarFallback` 在带 hydration mismatch 的 patch 中会触发
                         `insertBefore` 运行时错误（切换设置页签时复现）。此处仅该子树延迟到客户端渲染。 -->
                    <ClientOnly>
                        <AppAvatarV2
                            :image="profileForm.image"
                            :email="session?.data?.user?.email"
                            :name="profileForm.name"
                            size="xlarge"
                            shape="circle"
                            class="avatar-preview"
                        />
                        <template #fallback>
                            <!-- 占位与头像同为 64px，避免水合后插入头像把上传按钮横向顶开（CLS）。 -->
                            <span class="avatar-preview avatar-preview--placeholder" aria-hidden="true" />
                        </template>
                    </ClientOnly>
                    <div class="avatar-upload">
                        <CaomeiFileUpload
                            mode="basic"
                            accept="image/*"
                            :max-file-size="2000000"
                            :auto="true"
                            :choose-label="$t('pages.settings.profile.upload')"
                            custom-upload
                            @uploader="handleAvatarUpload"
                        />
                    </div>
                </div>
            </div>

            <div class="settings-form__field">
                <label for="name">{{ $t("pages.settings.profile.name") }}</label>
                <CaomeiInput
                    id="name"
                    v-model="profileForm.name"
                    type="text"
                />
            </div>

            <div class="settings-form__field">
                <label for="language">{{ $t("pages.settings.profile.language") }}</label>
                <CaomeiSelect
                    id="language"
                    v-model="profileForm.language"
                    :options="localesOptions"
                    option-label="name"
                    option-value="code"
                />
            </div>

            <div class="settings-form__field">
                <label for="timezone">{{ $t("pages.settings.profile.timezone") }}</label>
                <CaomeiSelect
                    id="timezone"
                    v-model="profileForm.timezone"
                    :options="timezoneOptions"
                    option-label="label"
                    option-value="value"
                />
            </div>

            <CaomeiButton
                type="submit"
                :label="$t('pages.settings.profile.save')"
                :loading="loading"
                class="settings-form__submit-btn"
            >
                {{ $t('pages.settings.profile.save') }}
            </CaomeiButton>
        </form>
    </div>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { z } from 'zod'
import { invalidateAuthSessionState, refreshAuthSession } from '@/composables/use-auth-session'
import { authClient } from '@/lib/auth-client'

const { t, locales, setLocale } = useI18n()
const toast = useToast()
const loading = ref(false)

const session = authClient.useSession()
const profileForm = ref({
    name: '',
    image: '',
    language: '',
    timezone: '',
})

const localesOptions = computed(() => {
    return locales.value.map((l) => ({
        name: typeof l === 'string' ? l : (l.name || l.code),
        code: typeof l === 'string' ? l : l.code,
    }))
})

const timezoneOptions = ref([
    { label: 'UTC (GMT+0)', value: 'UTC' },
    { label: 'Shanghai (GMT+8)', value: 'Asia/Shanghai' },
    { label: 'Hong Kong (GMT+8)', value: 'Asia/Hong_Kong' },
    { label: 'Tokyo (GMT+9)', value: 'Asia/Tokyo' },
    { label: 'Singapore (GMT+8)', value: 'Asia/Singapore' },
    { label: 'New York (GMT-5)', value: 'America/New_York' },
    { label: 'London (GMT+0)', value: 'Europe/London' },
    { label: 'Paris (GMT+1)', value: 'Europe/Paris' },
    { label: 'Sydney (GMT+11)', value: 'Australia/Sydney' },
    { label: 'Berlin (GMT+1)', value: 'Europe/Berlin' },
    { label: 'Dubai (GMT+4)', value: 'Asia/Dubai' },
    { label: 'Los Angeles (GMT-8)', value: 'America/Los_Angeles' },
])

const profileSchema = z.object({
    name: z.string().min(1, { message: 'pages.register.name_required' }),
    image: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
})

watchEffect(() => {
    if (session.value?.data?.user) {
        profileForm.value.name = session.value.data.user.name || ''
        profileForm.value.image = session.value.data.user.image || ''
        profileForm.value.language = (session.value.data.user as { language?: string, timezone?: string }).language || ''
        profileForm.value.timezone = (session.value.data.user as { language?: string, timezone?: string }).timezone || ''
    }
})

const handleAvatarUpload = async (event: { files: File[] }) => {
    const file = event.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
        const response = await $fetch<{ code: number, data: { url: string } }>('/api/user/avatar', {
            method: 'POST',
            body: formData,
        })

        if (response.data?.url) {
            profileForm.value.image = response.data.url
            toast.show({ tone: 'success', title: t('common.success'), description: t('pages.settings.profile.upload_success'), duration: 3000 })
            invalidateAuthSessionState()
            await refreshAuthSession()
        }
    } catch (error) {
        console.error('Avatar upload failed', error)
        toast.show({ tone: 'danger', title: t('common.error'), description: t('pages.settings.profile.upload_failed'), duration: 3000 })
    }
}

const handleUpdateProfile = async () => {
    const result = profileSchema.safeParse(profileForm.value)
    if (!result.success) {
        const firstError = result.error.issues[0]
        if (firstError) {
            toast.show({ tone: 'danger', title: t('common.error'), description: t(firstError.message), duration: 3000 })
        }
        return
    }

    loading.value = true
    try {
        invalidateAuthSessionState()

        const { error } = await authClient.updateUser({
            name: profileForm.value.name,
            image: profileForm.value.image,
            language: profileForm.value.language || undefined,
            timezone: profileForm.value.timezone || undefined,
        } as { name?: string, image?: string, language?: string, timezone?: string }, {
            disableSignal: true,
        })

        if (error) {
            await refreshAuthSession()
            toast.show({ tone: 'danger', title: t('common.error'), description: error.message || error.statusText, duration: 3000 })
        } else {
            await refreshAuthSession()

            if (profileForm.value.language) {
                await setLocale(profileForm.value.language as 'zh-CN' | 'en-US' | 'zh-TW' | 'ko-KR' | 'ja-JP')
            }
            toast.show({ tone: 'success', title: t('common.success'), description: t('pages.settings.profile.success'), duration: 3000 })
        }
    } catch (e) {
        await refreshAuthSession()
        console.error(e)
        toast.show({ tone: 'danger', title: t('common.error'), description: t('common.unexpected_error'), duration: 3000 })
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
@use "@/styles/components/settings-shared" as *;

.avatar-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    .avatar-preview {
        flex-shrink: 0;
    }

    /* 水合前的占位与 64px 头像同尺寸，避免插入时把上传按钮横向顶开（CLS）。 */
    .avatar-preview--placeholder {
        display: inline-block;
        width: 64px;
        height: 64px;
        border-radius: 999px;
        background: var(--p-surface-100);
    }
}
</style>
