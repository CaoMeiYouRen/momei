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
                    <div
                        class="settings-menu-item"
                        :class="{active: activeTab === 'apiKeys'}"
                        @click="activeTab = 'apiKeys'"
                    >
                        <i class="pi pi-key" />
                        <span>{{ $t('pages.settings.menu.api_keys') }}</span>
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
                                                :choose-label="$t('pages.settings.profile.upload')"
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
                                <Message severity="info" class="mb-4">
                                    {{ $t('pages.settings.security.set_password_hint') }}
                                    <NuxtLink to="/forgot-password" class="font-bold underline">
                                        {{ $t('pages.login.forgot_password') }}
                                    </NuxtLink>
                                </Message>
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
                                            <span class="capitalize">{{ account.providerId }}</span>
                                        </div>
                                        <Button
                                            icon="pi pi-trash"
                                            severity="danger"
                                            text
                                            rounded
                                            :aria-label="$t('pages.settings.security.unlink_account')"
                                            :loading="loadingUnlink === account.providerId"
                                            @click="handleUnlink(account.providerId)"
                                        />
                                    </div>
                                </div>

                                <div v-if="!isGitHubLinked" class="link-account-section">
                                    <Button
                                        :label="$t('pages.settings.security.link_github')"
                                        icon="pi pi-github"
                                        outlined
                                        :loading="loadingLink === 'github'"
                                        @click="handleLink('github')"
                                    />
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- API Keys Tab -->
                    <Card v-if="activeTab === 'apiKeys'" class="settings-card">
                        <template #title>
                            {{ $t('pages.settings.api_keys.title') }}
                        </template>
                        <template #content>
                            <div class="api-keys-section">
                                <p class="mb-4 text-secondary">
                                    {{ $t('pages.settings.api_keys.description') }}
                                </p>

                                <div class="flex gap-2 mb-6">
                                    <InputText
                                        v-model="newKeyName"
                                        :placeholder="$t('pages.settings.api_keys.name')"
                                        class="flex-1"
                                        @keyup.enter="handleCreateApiKey"
                                    />
                                    <Button
                                        :label="$t('pages.settings.api_keys.create_btn')"
                                        :loading="loading"
                                        :disabled="!newKeyName.trim()"
                                        @click="handleCreateApiKey"
                                    />
                                </div>

                                <DataTable
                                    :value="apiKeys"
                                    :loading="loadingKeys"
                                    class="p-datatable-sm"
                                >
                                    <Column field="name" :header="$t('pages.settings.api_keys.name')" />
                                    <Column field="prefix" :header="$t('pages.settings.api_keys.prefix')" />
                                    <Column field="lastUsedAt" :header="$t('pages.settings.api_keys.last_used_at')">
                                        <template #body="{data}">
                                            {{ data.lastUsedAt ? formatDate(data.lastUsedAt) : '-' }}
                                        </template>
                                    </Column>
                                    <Column field="expiresAt" :header="$t('pages.settings.api_keys.expires_at')">
                                        <template #body="{data}">
                                            {{ data.expiresAt ? formatDate(data.expiresAt) : $t('pages.settings.api_keys.never_expires') }}
                                        </template>
                                    </Column>
                                    <Column :header="$t('common.actions')" class="text-right">
                                        <template #body="{data}">
                                            <Button
                                                icon="pi pi-trash"
                                                severity="danger"
                                                text
                                                rounded
                                                @click="handleDeleteApiKey(data.id)"
                                            />
                                        </template>
                                    </Column>
                                </DataTable>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </div>

        <Dialog
            v-model:visible="showNewKeyDialog"
            modal
            :header="$t('pages.settings.api_keys.new_key_title')"
            :style="{width: '450px'}"
        >
            <div class="flex flex-col gap-4">
                <Message severity="warn" :closable="false">
                    {{ $t('pages.settings.api_keys.new_key_hint') }}
                </Message>
                <div class="flex-1 p-inputgroup">
                    <InputText
                        :value="newlyCreatedKey"
                        readonly
                        class="bg-surface-50 font-mono"
                    />
                    <Button icon="pi pi-copy" @click="copyToClipboard(newlyCreatedKey || '')" />
                </div>
            </div>
            <template #footer>
                <Button :label="$t('common.close')" @click="showNewKeyDialog = false" />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { authClient } from '@/lib/auth-client'

const { t } = useI18n()
const { formatDate } = useI18nDate()
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
const loadingUnlink = ref<string | null>(null)
const loadingLink = ref<string | null>(null)

// API Keys Data
const apiKeys = ref<any[]>([])
const loadingKeys = ref(false)
const showNewKeyDialog = ref(false)
const newKeyName = ref('')
const newlyCreatedKey = ref<string | null>(null)

const isGitHubLinked = computed(() => linkedAccounts.value.some((a) => a.providerId === 'github'))

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
        const response = await $fetch<{ code: number, data: { url: string } }>('/api/user/avatar', {
            method: 'POST',
            body: formData,
        })

        if (response.data?.url) {
            profileForm.image = response.data.url
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.profile.upload_success'), life: 3000 })
            // Refresh session to get new avatar
            await authClient.getSession()
        }
    } catch (error) {
        console.error('Avatar upload failed', error)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('pages.settings.profile.upload_failed'), life: 3000 })
    }
}

const fetchLinkedAccounts = async () => {
    try {
        const { data } = await authClient.listAccounts()
        if (data) {
            linkedAccounts.value = data.filter((account) => account.providerId !== 'credential')
        }
    } catch (e) {
        console.error('Failed to fetch linked accounts', e)
    }
}

const handleUnlink = async (providerId: string) => {
    loadingUnlink.value = providerId
    try {
        const { error } = await authClient.unlinkAccount({
            providerId,
        })
        if (error) {
            toast.add({ severity: 'error', summary: t('common.error'), detail: error.message || error.statusText, life: 3000 })
        } else {
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.security.unlink_success'), life: 3000 })
            await fetchLinkedAccounts()
        }
    } catch (e) {
        console.error(e)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('pages.settings.security.unlink_error'), life: 3000 })
    } finally {
        loadingUnlink.value = null
    }
}

const handleLink = async (provider: 'github' | 'google') => {
    loadingLink.value = provider
    try {
        const { error } = await authClient.linkSocial({
            provider,
            callbackURL: '/settings',
        })
        if (error) {
            toast.add({ severity: 'error', summary: t('common.error'), detail: error.message || error.statusText, life: 3000 })
            loadingLink.value = null
        }
    } catch (e) {
        console.error(e)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('pages.settings.security.link_error'), life: 3000 })
        loadingLink.value = null
    }
}

const fetchApiKeys = async () => {
    loadingKeys.value = true
    try {
        const response = await $fetch<{ code: number, data: any[] }>('/api/user/api-keys')
        if (response.code === 200) {
            apiKeys.value = response.data
        }
    } catch (e) {
        console.error('Failed to fetch API keys', e)
    } finally {
        loadingKeys.value = false
    }
}

const handleCreateApiKey = async () => {
    if (!newKeyName.value.trim()) {
        return
    }

    loading.value = true
    try {
        const response = await $fetch<{ code: number, data: any }>('/api/user/api-keys', {
            method: 'POST',
            body: { name: newKeyName.value.trim() },
        })
        if (response.code === 200) {
            newlyCreatedKey.value = response.data.key
            showNewKeyDialog.value = true
            newKeyName.value = ''
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.api_keys.create_success'), life: 3000 })
            await fetchApiKeys()
        }
    } catch (e) {
        console.error(e)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    } finally {
        loading.value = false
    }
}

const handleDeleteApiKey = async (id: string) => {
    try {
        const response = await $fetch<{ code: number }>(`/api/user/api-keys/${id}`, {
            method: 'DELETE',
        })
        if (response.code === 200) {
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.api_keys.delete_success'), life: 3000 })
            await fetchApiKeys()
        }
    } catch (e) {
        console.error(e)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    }
}

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.add({ severity: 'info', summary: t('common.success'), detail: 'Copied to clipboard', life: 2000 })
}

watch(activeTab, (newTab) => {
    if (newTab === 'apiKeys') {
        fetchApiKeys()
    }
})

onMounted(async () => {
    // Fetch linked accounts if available in the client
    await fetchLinkedAccounts()
})

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

const handleChangePassword = async () => {
    const result = passwordSchema.safeParse(passwordForm)
    if (!result.success) {
        const firstError = result.error.issues[0]
        if (firstError) {
            toast.add({ severity: 'error', summary: t('common.error'), detail: t(firstError.message), life: 3000 })
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
            toast.add({ severity: 'error', summary: t('common.error'), detail: error.message || error.statusText, life: 3000 })
        } else {
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.security.password_updated'), life: 3000 })
            // Reset form
            passwordForm.currentPassword = ''
            passwordForm.newPassword = ''
            passwordForm.confirmPassword = ''
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
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    color: var(--p-text-color);
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
    border: 1px solid var(--p-surface-border);
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

.capitalize {
    text-transform: capitalize;
}

.no-accounts {
    color: var(--p-text-color-secondary);
    font-style: italic;
}

.link-account-section {
    margin-top: 1rem;
}
</style>
