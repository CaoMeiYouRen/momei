<template>
    <div class="settings-profile">
        <h3 class="settings-section-title">
            {{ $t("pages.settings.profile.title") }}
        </h3>
        <form class="settings-form" @submit.prevent="handleUpdateProfile">
            <div class="settings-form__field">
                <label>{{ $t("pages.settings.profile.avatar") }}</label>
                <div class="avatar-section">
                    <AppAvatar
                        :image="profileForm.image"
                        :email="session?.data?.user?.email"
                        :name="profileForm.name"
                        size="xlarge"
                        shape="circle"
                        class="avatar-preview"
                    />
                    <div class="avatar-upload">
                        <FileUpload
                            mode="basic"
                            name="avatar"
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
                <InputText
                    id="name"
                    v-model="profileForm.name"
                    type="text"
                    fluid
                />
            </div>

            <div class="settings-form__field">
                <label for="language">{{ $t("pages.settings.profile.language") }}</label>
                <Select
                    id="language"
                    v-model="profileForm.language"
                    :options="localesOptions"
                    option-label="name"
                    option-value="code"
                    fluid
                />
            </div>

            <div class="settings-form__field">
                <label for="timezone">{{ $t("pages.settings.profile.timezone") }}</label>
                <Select
                    id="timezone"
                    v-model="profileForm.timezone"
                    :options="timezoneOptions"
                    option-label="label"
                    option-value="value"
                    filter
                    fluid
                />
            </div>

            <Button
                type="submit"
                :label="$t('pages.settings.profile.save')"
                :loading="loading"
                class="settings-form__submit-btn"
            />
        </form>
    </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { authClient } from '@/lib/auth-client'

const { t, locales, setLocale } = useI18n()
const toast = useToast()
const loading = ref(false)

const session = authClient.useSession()
const profileForm = reactive({
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
        profileForm.name = session.value.data.user.name || ''
        profileForm.image = session.value.data.user.image || ''
        profileForm.language = (session.value.data.user as any).language || ''
        profileForm.timezone = (session.value.data.user as any).timezone || ''
    }
})

const handleAvatarUpload = async (event: any) => {
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
            profileForm.image = response.data.url
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.profile.upload_success'), life: 3000 })
            await authClient.getSession()
        }
    } catch (error) {
        console.error('Avatar upload failed', error)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('pages.settings.profile.upload_failed'), life: 3000 })
    }
}

const handleUpdateProfile = async () => {
    const result = profileSchema.safeParse(profileForm)
    if (!result.success) {
        const firstError = result.error.issues[0]
        if (firstError) {
            toast.add({ severity: 'error', summary: t('common.error'), detail: t(firstError.message), life: 3000 })
        }
        return
    }

    loading.value = true
    try {
        const { error } = await authClient.updateUser({
            name: profileForm.name,
            image: profileForm.image,
            language: profileForm.language || undefined,
            timezone: profileForm.timezone || undefined,
        } as any)

        if (error) {
            toast.add({ severity: 'error', summary: t('common.error'), detail: error.message || error.statusText, life: 3000 })
        } else {
            if (profileForm.language) {
                await setLocale(profileForm.language as any)
            }
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.profile.success'), life: 3000 })
        }
    } catch (e) {
        console.error(e)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
.settings-section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 2rem;
    color: var(--p-text-color);
}

.settings-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 600px;

    &__field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        label {
            font-weight: 500;
            color: var(--p-text-color);
        }
    }

    &__submit-btn {
        align-self: flex-start;
    }
}

.avatar-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    .avatar-preview {
        flex-shrink: 0;
    }
}
</style>
