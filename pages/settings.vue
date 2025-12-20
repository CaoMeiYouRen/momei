<template>
    <div class="settings-page">
        <div class="settings-container">
            <h1 class="settings-title">
                {{ $t('pages.settings.title') }}
            </h1>

            <div class="settings-layout">
                <!-- Sidebar Menu -->
                <div class="settings-sidebar">
                    <div
                        class="settings-menu-item"
                        :class="{active: activeTab === 'profile'}"
                        @click="activeTab = 'profile'"
                    >
                        <i class="pi pi-user" />
                        <span>{{ $t('pages.settings.menu.profile') }}</span>
                    </div>
                    <div
                        class="settings-menu-item"
                        :class="{active: activeTab === 'security'}"
                        @click="activeTab = 'security'"
                    >
                        <i class="pi pi-shield" />
                        <span>{{ $t('pages.settings.menu.security') }}</span>
                    </div>
                </div>

                <!-- Content Area -->
                <div class="settings-content">
                    <!-- Profile Tab -->
                    <Card v-if="activeTab === 'profile'" class="settings-card">
                        <template #title>
                            {{ $t('pages.settings.profile.title') }}
                        </template>
                        <template #content>
                            <form class="settings-form" @submit.prevent="handleUpdateProfile">
                                <div class="settings-form__field">
                                    <label>{{ $t('pages.settings.profile.avatar') }}</label>
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
                                                choose-label="Upload Avatar"
                                                custom-upload
                                                @uploader="handleAvatarUpload"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div class="settings-form__field">
                                    <label for="name">{{ $t('pages.settings.profile.name') }}</label>
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
                        </template>
                    </Card>

                    <!-- Security Tab -->
                    <Card v-if="activeTab === 'security'" class="settings-card">
                        <template #title>
                            {{ $t('pages.settings.security.title') }}
                        </template>
                        <template #content>
                            <div class="security-section">
                                <h3>{{ $t('pages.settings.security.change_password') }}</h3>
                                <form class="settings-form" @submit.prevent="handleChangePassword">
                                    <div class="settings-form__field">
                                        <label for="currentPassword">{{ $t('pages.settings.security.current_password') }}</label>
                                        <Password
                                            id="currentPassword"
                                            v-model="passwordForm.currentPassword"
                                            toggle-mask
                                            :feedback="false"
                                            fluid
                                        />
                                    </div>
                                    <div class="settings-form__field">
                                        <label for="newPassword">{{ $t('pages.settings.security.new_password') }}</label>
                                        <Password
                                            id="newPassword"
                                            v-model="passwordForm.newPassword"
                                            toggle-mask
                                            :feedback="true"
                                            fluid
                                        />
                                    </div>
                                    <div class="settings-form__field">
                                        <label for="confirmPassword">{{ $t('pages.settings.security.confirm_password') }}</label>
                                        <Password
                                            id="confirmPassword"
                                            v-model="passwordForm.confirmPassword"
                                            toggle-mask
                                            :feedback="false"
                                            fluid
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        :label="$t('pages.settings.security.update_password')"
                                        :loading="loading"
                                        class="settings-form__submit-btn"
                                    />
                                </form>
                            </div>

                            <Divider />

                            <div class="security-section">
                                <h3>{{ $t('pages.settings.security.linked_accounts') }}</h3>
                                <div v-if="linkedAccounts.length === 0" class="no-accounts">
                                    {{ $t('pages.settings.security.no_linked_accounts') }}
                                </div>
                                <div v-else class="linked-accounts-list">
                                    <div
                                        v-for="account in linkedAccounts"
                                        :key="account.id"
                                        class="linked-account-item"
                                    >
                                        <div class="account-info">
                                            <i v-if="account.providerId === 'github'" class="pi pi-github" />
                                            <i v-else-if="account.providerId === 'google'" class="pi pi-google" />
                                            <i v-else class="pi pi-globe" />
                                            <span>{{ account.providerId }}</span>
                                        </div>
                                        <!-- Unlink button could go here -->
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </div>
        <Toast />
    </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { authClient } from '@/lib/auth-client'

const { t } = useI18n()
const toast = useToast()
const loading = ref(false)
const activeTab = ref('profile')

// Profile Data
const session = authClient.useSession()
const profileForm = reactive({
    name: '',
    image: '',
})

// Password Data
const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
})

// Linked Accounts Data
const linkedAccounts = ref<any[]>([])

// Validation Schemas
const profileSchema = z.object({
    name: z.string().min(1, { message: 'pages.register.name_required' }),
    image: z.string().optional(),
})

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'pages.settings.security.current_password_required' }),
    newPassword: z.string().min(1, { message: 'pages.settings.security.new_password_required' }),
    confirmPassword: z.string().min(1, { message: 'pages.settings.security.confirm_password_required' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'pages.register.password_mismatch',
    path: ['confirmPassword'],
})

// Initialize data
watchEffect(() => {
    if (session.value?.data?.user) {
        profileForm.name = session.value.data.user.name || ''
        profileForm.image = session.value.data.user.image || ''
    }
})

const handleAvatarUpload = async (event: any) => {
    const file = event.files[0]
    if (!file) {
        return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
        const { data } = await useFetch('/api/user/avatar', {
            method: 'POST',
            body: formData,
        })

        if (data.value?.data?.url) {
            profileForm.image = data.value.data.url
            toast.add({ severity: 'success', summary: 'Success', detail: 'Avatar updated successfully', life: 3000 })
            // Refresh session to get new avatar
            await authClient.getSession()
        }
    } catch (error) {
        console.error('Avatar upload failed', error)
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload avatar', life: 3000 })
    }
}

onMounted(async () => {
    // Fetch linked accounts if available in the client
    try {
        const { data } = await authClient.listAccounts()
        if (data) {
            linkedAccounts.value = data.filter((account) => account.providerId !== 'credential')
        }
    } catch (e) {
        console.error('Failed to fetch linked accounts', e)
    }
})

const handleUpdateProfile = async () => {
    const result = profileSchema.safeParse(profileForm)
    if (!result.success) {
        const firstError = result.error.issues[0]
        if (firstError) {
            toast.add({ severity: 'error', summary: 'Error', detail: t(firstError.message), life: 3000 })
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
            toast.add({ severity: 'error', summary: 'Error', detail: error.message || error.statusText, life: 3000 })
        } else {
            toast.add({ severity: 'success', summary: 'Success', detail: t('pages.settings.profile.success'), life: 3000 })
        }
    } catch (e) {
        console.error(e)
        toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred', life: 3000 })
    } finally {
        loading.value = false
    }
}

const handleChangePassword = async () => {
    const result = passwordSchema.safeParse(passwordForm)
    if (!result.success) {
        const firstError = result.error.issues[0]
        if (firstError) {
            toast.add({ severity: 'error', summary: 'Error', detail: t(firstError.message), life: 3000 })
        }
        return
    }

    loading.value = true
    try {
        const { error } = await authClient.changePassword({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
            revokeOtherSessions: true,
        })

        if (error) {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message || error.statusText, life: 3000 })
        } else {
            toast.add({ severity: 'success', summary: 'Success', detail: t('pages.settings.security.password_updated'), life: 3000 })
            // Reset form
            passwordForm.currentPassword = ''
            passwordForm.newPassword = ''
            passwordForm.confirmPassword = ''
        }
    } catch (e) {
        console.error(e)
        toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred', life: 3000 })
    } finally {
        loading.value = false
    }
}

</script>

<style lang="scss" scoped>
.settings-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

.settings-title {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 2rem;
    color: var(--p-text-color);
}

.settings-layout {
    display: flex;
    gap: 2rem;
    align-items: flex-start;

    @media (width <= 768px) {
        flex-direction: column;
    }
}

.settings-sidebar {
    width: 250px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    @media (width <= 768px) {
        width: 100%;
        flex-direction: row;
        overflow-x: auto;
    }
}

.settings-menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    color: var(--p-text-color-secondary);
    transition: all 0.2s;

    &:hover {
        background-color: var(--p-surface-100);
        color: var(--p-text-color);
    }

    &.active {
        background-color: var(--p-primary-50);
        color: var(--p-primary-color);
        font-weight: 500;
    }

    i {
        font-size: 1.1rem;
    }
}

.settings-content {
    flex: 1;
    width: 100%;
}

.settings-card {
    width: 100%;
}

.settings-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

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

    .avatar-input {
        flex: 1;
    }
}

.security-section {
    h3 {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        color: var(--p-text-color);
    }
}

.linked-accounts-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.linked-account-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 1px solid var(--p-surface-200);
    border-radius: 0.5rem;

    .account-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;

        i {
            font-size: 1.25rem;
        }
    }
}

.no-accounts {
    color: var(--p-text-color-secondary);
    font-style: italic;
}
</style>
