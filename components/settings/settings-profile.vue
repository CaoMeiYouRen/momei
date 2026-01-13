<template>
    <div class="settings-profile">
        <h3 class="settings-section-title">
            {{ $t("pages.settings.profile.title") }}
        </h3>
        <form class="settings-form" @submit.prevent="handleUpdateProfile">
            <div class="settings-form__field">
                <label>{{ $t("pages.settings.profile.avatar") }}</label>
                <div class="avatar-section">
                    <Avatar
                        :image="profileForm.image || undefined"
                        :label="!profileForm.image ? profileForm.name?.charAt(0)?.toUpperCase() : undefined"
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

const { t } = useI18n()
const toast = useToast()
const loading = ref(false)

const session = authClient.useSession()
const profileForm = reactive({
    name: '',
    image: '',
})

const profileSchema = z.object({
    name: z.string().min(1, { message: 'pages.register.name_required' }),
    image: z.string().optional(),
})

watchEffect(() => {
    if (session.value?.data?.user) {
        profileForm.name = session.value.data.user.name || ''
        profileForm.image = session.value.data.user.image || ''
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
        })

        if (error) {
            toast.add({ severity: 'error', summary: t('common.error'), detail: error.message || error.statusText, life: 3000 })
        } else {
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
