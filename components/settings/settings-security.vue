<template>
    <div class="settings-security">
        <h3 class="settings-section-title">
            {{ $t("pages.settings.security.title") }}
        </h3>

        <div class="security-section">
            <h4 class="font-medium mb-4 text-lg">
                {{ $t("pages.settings.security.change_password") }}
            </h4>
            <Message severity="info" class="mb-4">
                {{ $t("pages.settings.security.set_password_hint") }}
                <NuxtLink to="/forgot-password" class="font-bold underline">
                    {{ $t("pages.login.forgot_password") }}
                </NuxtLink>
            </Message>

            <form class="settings-form" @submit.prevent="handleChangePassword">
                <div class="settings-form__field">
                    <label for="currentPassword">{{ $t("pages.settings.security.current_password") }}</label>
                    <Password
                        id="currentPassword"
                        v-model="passwordForm.currentPassword"
                        toggle-mask
                        :feedback="false"
                        fluid
                    />
                </div>
                <div class="settings-form__field">
                    <label for="newPassword">{{ $t("pages.settings.security.new_password") }}</label>
                    <Password
                        id="newPassword"
                        v-model="passwordForm.newPassword"
                        toggle-mask
                        :feedback="true"
                        fluid
                    />
                </div>
                <div class="settings-form__field">
                    <label for="confirmPassword">{{ $t("pages.settings.security.confirm_password") }}</label>
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

        <Divider class="my-8" />

        <div class="security-section">
            <h4 class="font-medium mb-4 text-lg">
                {{ $t("pages.settings.security.linked_accounts") }}
            </h4>
            <div class="linked-accounts-list">
                <!-- GitHub -->
                <div class="linked-account-item">
                    <div class="account-info">
                        <i class="github-icon pi pi-github" />
                        <div class="account-details">
                            <span class="capitalize">GitHub</span>
                            <small v-if="getLinkedAccount('github')" class="account-id text-muted-color">
                                ID: {{ getLinkedAccount('github').accountId }}
                            </small>
                        </div>
                    </div>
                    <div class="account-actions">
                        <Button
                            v-if="isGitHubLinked"
                            icon="pi pi-trash"
                            severity="danger"
                            text
                            rounded
                            :aria-label="$t('pages.settings.security.unlink_account')"
                            :loading="loadingUnlink === 'github'"
                            @click="handleUnlink('github')"
                        />
                        <Button
                            v-else
                            :label="$t('pages.settings.security.link_github')"
                            icon="pi pi-github"
                            class="github-btn social-btn"
                            severity="secondary"
                            outlined
                            :loading="loadingLink === 'github'"
                            @click="handleLink('github')"
                        />
                    </div>
                </div>

                <!-- Google -->
                <div class="linked-account-item">
                    <div class="account-info">
                        <i class="google-icon pi pi-google" />
                        <div class="account-details">
                            <span class="capitalize">Google</span>
                            <small v-if="getLinkedAccount('google')" class="account-id text-muted-color">
                                ID: {{ getLinkedAccount('google').accountId }}
                            </small>
                        </div>
                    </div>
                    <div class="account-actions">
                        <Button
                            v-if="isGoogleLinked"
                            icon="pi pi-trash"
                            severity="danger"
                            text
                            rounded
                            :aria-label="$t('pages.settings.security.unlink_account')"
                            :loading="loadingUnlink === 'google'"
                            @click="handleUnlink('google')"
                        />
                        <Button
                            v-else
                            :label="$t('pages.settings.security.link_google')"
                            icon="pi pi-google"
                            class="google-btn social-btn"
                            severity="secondary"
                            outlined
                            :loading="loadingLink === 'google'"
                            @click="handleLink('google')"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { authClient } from '@/lib/auth-client'

const { t } = useI18n()
const toast = useToast()
const loading = ref(false)

const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
})

const linkedAccounts = ref<any[]>([])
const loadingUnlink = ref<string | null>(null)
const loadingLink = ref<string | null>(null)

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'pages.settings.security.current_password_required' }),
    newPassword: z.string().min(1, { message: 'pages.settings.security.new_password_required' }),
    confirmPassword: z.string().min(1, { message: 'pages.settings.security.confirm_password_required' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'pages.register.password_mismatch',
    path: ['confirmPassword'],
})

const isGitHubLinked = computed(() => linkedAccounts.value.some((a) => a.providerId === 'github'))
const isGoogleLinked = computed(() => linkedAccounts.value.some((a) => a.providerId === 'google'))
const getLinkedAccount = (providerId: string) => linkedAccounts.value.find((a) => a.providerId === providerId)

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
        const { error } = await authClient.unlinkAccount({ providerId })
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

onMounted(() => {
    fetchLinkedAccounts()
})
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

.linked-accounts-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 600px;
}

.linked-account-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border: 1px solid var(--p-surface-border);
    border-radius: 0.5rem;
    min-height: 4rem;

    .account-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;

        i {
            font-size: 1.25rem;
        }

        .github-icon {
            color: #24292e;

            :global(.dark) & {
                color: #fff;
            }
        }

        .google-icon {
            color: #4285f4;
        }

        .account-details {
            display: flex;
            flex-direction: column;
            line-height: 1.2;

            .account-id {
                font-size: 0.75rem;
                font-weight: 400;
                opacity: 0.8;
            }
        }
    }

    .social-btn {
        min-width: 140px;
    }
}

.capitalize {
    text-transform: capitalize;
}
</style>
