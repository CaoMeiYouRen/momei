<template>
    <div class="settings-commercial">
        <div class="commercial-section">
            <div class="commercial-section__header">
                <h3 class="commercial-section__title">
                    {{ $t('pages.settings.commercial.social_links') }}
                </h3>
                <Button
                    :label="$t('pages.settings.commercial.add_social')"
                    icon="pi pi-plus"
                    size="small"
                    @click="openSocialDialog()"
                />
            </div>

            <div v-if="socialLinks.length === 0" class="commercial-empty">
                <i class="commercial-empty__icon pi pi-share-alt" />
                <p class="commercial-empty__text">
                    {{ $t('pages.settings.commercial.empty_social') }}
                </p>
            </div>

            <div v-else class="commercial-grid">
                <div
                    v-for="(link, index) in socialLinks"
                    :key="index"
                    class="link-card"
                >
                    <div class="link-card__icon-wrapper">
                        <i
                            :class="getPlatformIcon(link.platform, 'social')"
                            :style="{color: getPlatformColor(link.platform, 'social')}"
                            class="link-card__icon"
                        />
                    </div>
                    <div class="link-card__content">
                        <div class="link-card__label">
                            {{ link.label || getPlatformName(link.platform, 'social') }}
                        </div>
                        <div class="link-card__url">
                            {{ link.platform === 'wechat_mp' ? (link.image || link.url) : link.url }}
                        </div>
                    </div>
                    <div class="link-card__actions">
                        <Button
                            icon="pi pi-pencil"
                            severity="secondary"
                            text
                            rounded
                            size="small"
                            @click="openSocialDialog(link, index)"
                        />
                        <Button
                            icon="pi pi-trash"
                            severity="danger"
                            text
                            rounded
                            size="small"
                            @click="confirmDelete(index, 'social')"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="commercial-section commercial-section--mt">
            <div class="commercial-section__header">
                <h3 class="commercial-section__title">
                    {{ $t('pages.settings.commercial.donation_links') }}
                </h3>
                <Button
                    :label="$t('pages.settings.commercial.add_donation')"
                    icon="pi pi-plus"
                    size="small"
                    @click="openDonationDialog()"
                />
            </div>

            <div v-if="donationLinks.length === 0" class="commercial-empty">
                <i class="commercial-empty__icon pi pi-heart" />
                <p class="commercial-empty__text">
                    {{ $t('pages.settings.commercial.empty_donation') }}
                </p>
            </div>

            <div v-else class="commercial-grid">
                <div
                    v-for="(link, index) in donationLinks"
                    :key="index"
                    class="link-card"
                >
                    <div class="link-card__icon-wrapper">
                        <i
                            :class="getPlatformIcon(link.platform, 'donation')"
                            :style="{color: getPlatformColor(link.platform, 'donation')}"
                            class="link-card__icon"
                        />
                    </div>
                    <div class="link-card__content">
                        <div class="link-card__label">
                            {{ link.label || getPlatformName(link.platform, 'donation') }}
                        </div>
                        <div class="link-card__url">
                            {{ link.url || link.image }}
                        </div>
                    </div>
                    <div class="link-card__actions">
                        <Button
                            icon="pi pi-pencil"
                            severity="secondary"
                            text
                            rounded
                            size="small"
                            @click="openDonationDialog(link, index)"
                        />
                        <Button
                            icon="pi pi-trash"
                            severity="danger"
                            text
                            rounded
                            size="small"
                            @click="confirmDelete(index, 'donation')"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="commercial-footer">
            <Button
                :label="$t('pages.settings.commercial.save')"
                icon="pi pi-check"
                :loading="saving"
                @click="saveSettings"
            />
        </div>

        <!-- Social Dialog -->
        <Dialog
            v-model:visible="socialDialogVisible"
            :header="$t('pages.settings.commercial.add_social')"
            modal
            class="commercial-dialog"
        >
            <div class="commercial-form">
                <div class="form-field">
                    <label for="social-platform">{{ $t('pages.settings.commercial.platform') }}</label>
                    <Select
                        id="social-platform"
                        v-model="currentSocial.platform"
                        :options="SOCIAL_PLATFORMS"
                        option-label="key"
                        option-value="key"
                        fluid
                    >
                        <template #option="slotProps">
                            <div class="platform-option">
                                <i :class="slotProps.option.icon" :style="{color: slotProps.option.color}" />
                                <span>{{ slotProps.option.key === 'custom' ? $t('common.custom') : $t(`components.post.sponsor.platforms.${slotProps.option.key}`) }}</span>
                            </div>
                        </template>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="platform-option">
                                <i :class="SOCIAL_PLATFORMS.find(p => p.key === slotProps.value)?.icon" :style="{color: SOCIAL_PLATFORMS.find(p => p.key === slotProps.value)?.color}" />
                                <span>{{ slotProps.value === 'custom' ? $t('common.custom') : $t(`components.post.sponsor.platforms.${slotProps.value}`) }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                    </Select>
                </div>

                <div v-if="currentSocial.platform === 'custom'" class="form-field">
                    <label for="social-label">{{ $t('pages.settings.commercial.label') }}</label>
                    <InputText
                        id="social-label"
                        v-model="currentSocial.label"
                        fluid
                    />
                </div>

                <div v-if="currentSocial.platform !== 'wechat_mp'" class="form-field">
                    <label for="social-url">{{ $t('pages.settings.commercial.url') }}</label>
                    <InputText
                        id="social-url"
                        v-model="currentSocial.url"
                        fluid
                        placeholder="https://..."
                    />
                </div>

                <div v-if="currentSocial.platform === 'wechat_mp'" class="form-field">
                    <label for="social-image">{{ $t('pages.settings.commercial.image') }}</label>
                    <div class="uploader-wrapper">
                        <InputText
                            id="social-image"
                            v-model="currentSocial.image"
                            fluid
                            placeholder="/uploads/..."
                        />
                        <AppUploader
                            id="social-qr-uploader"
                            v-model="currentSocial.image"
                            :auto-save="false"
                            @update:model-value="(val) => currentSocial.image = val || undefined"
                        />
                    </div>
                </div>

                <div class="form-field">
                    <label>{{ $t('pages.settings.commercial.locales') }}</label>
                    <MultiSelect
                        v-model="currentSocial.locales"
                        :options="localeOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.settings.commercial.locales_hint')"
                        fluid
                    />
                </div>
            </div>
            <template #footer>
                <Button
                    :label="$t('common.cancel')"
                    text
                    severity="secondary"
                    @click="socialDialogVisible = false"
                />
                <Button :label="$t('common.save')" @click="addSocialLink" />
            </template>
        </Dialog>

        <!-- Donation Dialog -->
        <Dialog
            v-model:visible="donationDialogVisible"
            :header="$t('pages.settings.commercial.add_donation')"
            modal
            class="commercial-dialog"
        >
            <div class="commercial-form">
                <div class="form-field">
                    <label for="donation-platform">{{ $t('pages.settings.commercial.platform') }}</label>
                    <Select
                        id="donation-platform"
                        v-model="currentDonation.platform"
                        :options="DONATION_PLATFORMS"
                        option-label="key"
                        option-value="key"
                        fluid
                    >
                        <template #option="slotProps">
                            <div class="platform-option">
                                <i :class="slotProps.option.icon" :style="{color: slotProps.option.color}" />
                                <span>{{ slotProps.option.key === 'custom' ? $t('common.custom') : $t(`components.post.sponsor.platforms.${slotProps.option.key}`) }}</span>
                            </div>
                        </template>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="platform-option">
                                <i :class="DONATION_PLATFORMS.find(p => p.key === slotProps.value)?.icon" :style="{color: DONATION_PLATFORMS.find(p => p.key === slotProps.value)?.color}" />
                                <span>{{ slotProps.value === 'custom' ? $t('common.custom') : $t(`components.post.sponsor.platforms.${slotProps.value}`) }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                    </Select>
                </div>

                <div v-if="currentDonation.platform === 'custom'" class="form-field">
                    <label for="donation-label">{{ $t('pages.settings.commercial.label') }}</label>
                    <InputText
                        id="donation-label"
                        v-model="currentDonation.label"
                        fluid
                    />
                </div>

                <div v-if="isPlatformType('url') || isPlatformType('both')" class="form-field">
                    <label for="donation-url">{{ $t('pages.settings.commercial.url') }}</label>
                    <InputText
                        id="donation-url"
                        v-model="currentDonation.url"
                        fluid
                        placeholder="https://..."
                    />
                </div>

                <div v-if="isPlatformType('image') || isPlatformType('both')" class="form-field">
                    <label for="donation-image">{{ $t('pages.settings.commercial.image') }}</label>
                    <div class="uploader-wrapper">
                        <InputText
                            id="donation-image"
                            v-model="currentDonation.image"
                            fluid
                            placeholder="/uploads/..."
                        />
                        <AppUploader
                            id="qr-uploader"
                            v-model="currentDonation.image"
                            :auto-save="false"
                            @update:model-value="(val) => currentDonation.image = val || undefined"
                        />
                    </div>
                </div>

                <div class="form-field">
                    <label>{{ $t('pages.settings.commercial.locales') }}</label>
                    <MultiSelect
                        v-model="currentDonation.locales"
                        :options="localeOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.settings.commercial.locales_hint')"
                        fluid
                    />
                </div>
            </div>
            <template #footer>
                <Button
                    :label="$t('common.cancel')"
                    text
                    severity="secondary"
                    @click="donationDialogVisible = false"
                />
                <Button :label="$t('common.save')" @click="addDonationLink" />
            </template>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { SOCIAL_PLATFORMS, DONATION_PLATFORMS, type SocialLink, type DonationLink } from '@/utils/shared/commercial'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()

const socialLinks = ref<SocialLink[]>([])
const donationLinks = ref<DonationLink[]>([])
const saving = ref(false)

const localeOptions = [
    { label: t('common.languages.zh-CN'), value: 'zh-CN' },
    { label: t('common.languages.en-US'), value: 'en-US' },
]

// Data Fetching
const { data, refresh } = await useFetch<any>('/api/user/commercial')
watchEffect(() => {
    if (data.value?.data) {
        socialLinks.value = [...(data.value.data.socialLinks || [])]
        donationLinks.value = [...(data.value.data.donationLinks || [])]
    }
})

// Social Link Logic
const socialDialogVisible = ref(false)
const editingSocialIndex = ref(-1)
const currentSocial = ref<SocialLink>({ platform: 'github', url: '', locales: [] })

const openSocialDialog = (link?: SocialLink, index?: number) => {
    if (link && index !== undefined) {
        currentSocial.value = { ...link, locales: link.locales ? [...link.locales] : [] }
        editingSocialIndex.value = index
    } else {
        currentSocial.value = { platform: 'github', url: '', locales: [] }
        editingSocialIndex.value = -1
    }
    socialDialogVisible.value = true
}

const addSocialLink = () => {
    if (currentSocial.value.platform === 'wechat_mp' && !currentSocial.value.image) return
    if (currentSocial.value.platform !== 'wechat_mp' && !currentSocial.value.url) return

    if (editingSocialIndex.value > -1) {
        socialLinks.value[editingSocialIndex.value] = { ...currentSocial.value }
    } else {
        socialLinks.value.push({ ...currentSocial.value })
    }
    socialDialogVisible.value = false
}

// Donation Link Logic
const donationDialogVisible = ref(false)
const editingDonationIndex = ref(-1)
const currentDonation = ref<DonationLink>({ platform: 'wechat_pay', url: '', image: '', locales: [] })

const openDonationDialog = (link?: DonationLink, index?: number) => {
    if (link && index !== undefined) {
        currentDonation.value = { ...link, locales: link.locales ? [...link.locales] : [] }
        editingDonationIndex.value = index
    } else {
        currentDonation.value = { platform: 'wechat_pay', url: '', image: '', locales: [] }
        editingDonationIndex.value = -1
    }
    donationDialogVisible.value = true
}

const addDonationLink = () => {
    if (!currentDonation.value.url && !currentDonation.value.image) return
    if (editingDonationIndex.value > -1) {
        donationLinks.value[editingDonationIndex.value] = { ...currentDonation.value }
    } else {
        donationLinks.value.push({ ...currentDonation.value })
    }
    donationDialogVisible.value = false
}

const isPlatformType = (type: string) => {
    const platform = DONATION_PLATFORMS.find((p) => p.key === currentDonation.value.platform)
    if (!platform) return false
    return platform.type === type
}

// Global Helpers
const getPlatformIcon = (key: string, type: 'social' | 'donation') => {
    const list = type === 'social' ? SOCIAL_PLATFORMS : DONATION_PLATFORMS
    return list.find((p) => p.key === key)?.icon || 'pi pi-link'
}

const getPlatformColor = (key: string, type: 'social' | 'donation') => {
    const list = type === 'social' ? SOCIAL_PLATFORMS : DONATION_PLATFORMS
    return list.find((p) => p.key === key)?.color || 'inherit'
}

const getPlatformName = (key: string, type: 'social' | 'donation') => {
    if (key === 'custom') return ''
    return t(`components.post.sponsor.platforms.${key}`)
}

const confirmDelete = (index: number, type: 'social' | 'donation') => {
    confirm.require({
        message: t('pages.settings.commercial.delete_confirm'),
        header: t('common.confirmation'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            if (type === 'social') {
                socialLinks.value.splice(index, 1)
            } else {
                donationLinks.value.splice(index, 1)
            }
        },
    })
}

const saveSettings = async () => {
    saving.value = true
    try {
        const res = await $fetch<any>('/api/user/commercial', {
            method: 'PUT',
            body: {
                socialLinks: socialLinks.value,
                donationLinks: donationLinks.value,
            },
        })
        if (res.code === 200) {
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.commercial.success'), life: 3000 })
            await refresh()
        }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: e.data?.message || t('common.save_failed'), life: 3000 })
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.settings-commercial {
  width: 100%;
}

.commercial-section {
  &--mt {
    margin-top: 2rem;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--p-text-color);
  }
}

.commercial-empty {
  padding: 2rem;
  text-align: center;
  border: 2px dashed var(--p-surface-200);
  border-radius: 0.5rem;

  &__icon {
    font-size: 2.5rem;
    color: var(--p-surface-300);
    margin-bottom: 0.5rem;
    display: block;
  }

  &__text {
    margin: 0;
    color: var(--p-surface-500);
  }
}

.commercial-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (width >= 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.link-card {
  padding: 1rem;
  border: 1px solid var(--p-surface-border);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: var(--p-surface-0);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--p-primary-color);
  }

  &__icon-wrapper {
    flex-shrink: 0;
  }

  &__icon {
    font-size: 1.5rem;
  }

  &__content {
    flex-grow: 1;
    min-width: 0;
  }

  &__label {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__url {
    font-size: 0.875rem;
    color: var(--p-surface-500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }
}

.commercial-footer {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.commercial-dialog {
  max-width: 32rem;
  width: 100%;
}

.commercial-form {
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 500;
    color: var(--p-text-color);
  }
}

.platform-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.uploader-wrapper {
  display: flex;
  gap: 0.5rem;
}

:global(.dark) {
  .link-card {
    background-color: var(--p-surface-900);
    border-color: var(--p-surface-700);
  }

  .commercial-empty {
    border-color: var(--p-surface-700);
  }
}
</style>
