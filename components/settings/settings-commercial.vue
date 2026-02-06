<template>
    <div class="settings-commercial">
        <div class="settings-section">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold m-0 text-xl">
                    {{ $t('pages.settings.commercial.social_links') }}
                </h3>
                <Button
                    :label="$t('pages.settings.commercial.add_social')"
                    icon="pi pi-plus"
                    size="small"
                    @click="openSocialDialog()"
                />
            </div>

            <div v-if="socialLinks.length === 0" class="border-2 border-dashed border-surface-200 empty-state p-8 rounded-lg text-center">
                <i class="mb-2 pi pi-share-alt text-4xl text-surface-300" />
                <p class="m-0 text-surface-500">
                    {{ $t('pages.settings.commercial.empty_social') }}
                </p>
            </div>

            <div v-else class="gap-4 grid grid-cols-1 md:grid-cols-2">
                <div
                    v-for="(link, index) in socialLinks"
                    :key="index"
                    class="border flex gap-4 items-center link-card p-4 rounded-lg"
                >
                    <i
                        :class="getPlatformIcon(link.platform, 'social')"
                        :style="{color: getPlatformColor(link.platform, 'social')}"
                        class="text-2xl"
                    />
                    <div class="flex-grow min-w-0">
                        <div class="font-medium truncate">
                            {{ link.label || getPlatformName(link.platform, 'social') }}
                        </div>
                        <div class="text-sm text-surface-500 truncate">
                            {{ link.url }}
                        </div>
                    </div>
                    <div class="flex gap-2">
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

        <div class="mt-8 settings-section">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold m-0 text-xl">
                    {{ $t('pages.settings.commercial.donation_links') }}
                </h3>
                <Button
                    :label="$t('pages.settings.commercial.add_donation')"
                    icon="pi pi-plus"
                    size="small"
                    @click="openDonationDialog()"
                />
            </div>

            <div v-if="donationLinks.length === 0" class="border-2 border-dashed border-surface-200 empty-state p-8 rounded-lg text-center">
                <i class="mb-2 pi pi-heart text-4xl text-surface-300" />
                <p class="m-0 text-surface-500">
                    {{ $t('pages.settings.commercial.empty_donation') }}
                </p>
            </div>

            <div v-else class="gap-4 grid grid-cols-1 md:grid-cols-2">
                <div
                    v-for="(link, index) in donationLinks"
                    :key="index"
                    class="border flex gap-4 items-center link-card p-4 rounded-lg"
                >
                    <i
                        :class="getPlatformIcon(link.platform, 'donation')"
                        :style="{color: getPlatformColor(link.platform, 'donation')}"
                        class="text-2xl"
                    />
                    <div class="flex-grow min-w-0">
                        <div class="font-medium truncate">
                            {{ link.label || getPlatformName(link.platform, 'donation') }}
                        </div>
                        <div class="text-sm text-surface-500 truncate">
                            {{ link.url || link.image }}
                        </div>
                    </div>
                    <div class="flex gap-2">
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

        <div class="flex justify-end mt-8">
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
            class="max-w-lg w-full"
        >
            <div class="flex flex-col gap-4 py-2">
                <div class="flex flex-col gap-2">
                    <label for="social-platform">{{ $t('pages.settings.commercial.platform') }}</label>
                    <Select
                        id="social-platform"
                        v-model="currentSocial.platform"
                        :options="SOCIAL_PLATFORMS"
                        option-label="key"
                        option-value="key"
                        class="w-full"
                    >
                        <template #option="slotProps">
                            <div class="flex gap-2 items-center">
                                <i :class="slotProps.option.icon" :style="{color: slotProps.option.color}" />
                                <span>{{ slotProps.option.key === 'custom' ? $t('common.custom') : $t(`components.post.sponsor.platforms.${slotProps.option.key}`) }}</span>
                            </div>
                        </template>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex gap-2 items-center">
                                <i :class="SOCIAL_PLATFORMS.find(p => p.key === slotProps.value)?.icon" :style="{color: SOCIAL_PLATFORMS.find(p => p.key === slotProps.value)?.color}" />
                                <span>{{ slotProps.value === 'custom' ? $t('common.custom') : $t(`components.post.sponsor.platforms.${slotProps.value}`) }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                    </Select>
                </div>

                <div v-if="currentSocial.platform === 'custom'" class="flex flex-col gap-2">
                    <label for="social-label">{{ $t('pages.settings.commercial.label') }}</label>
                    <InputText
                        id="social-label"
                        v-model="currentSocial.label"
                        class="w-full"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="social-url">{{ $t('pages.settings.commercial.url') }}</label>
                    <InputText
                        id="social-url"
                        v-model="currentSocial.url"
                        class="w-full"
                        placeholder="https://..."
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label>{{ $t('pages.settings.commercial.locales') }}</label>
                    <MultiSelect
                        v-model="currentSocial.locales"
                        :options="localeOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.settings.commercial.locales_hint')"
                        class="w-full"
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
            class="max-w-lg w-full"
        >
            <div class="flex flex-col gap-4 py-2">
                <div class="flex flex-col gap-2">
                    <label for="donation-platform">{{ $t('pages.settings.commercial.platform') }}</label>
                    <Select
                        id="donation-platform"
                        v-model="currentDonation.platform"
                        :options="DONATION_PLATFORMS"
                        option-label="key"
                        option-value="key"
                        class="w-full"
                    >
                        <template #option="slotProps">
                            <div class="flex gap-2 items-center">
                                <i :class="slotProps.option.icon" :style="{color: slotProps.option.color}" />
                                <span>{{ slotProps.option.key === 'custom' ? $t('common.custom') : $t(`components.post.sponsor.platforms.${slotProps.option.key}`) }}</span>
                            </div>
                        </template>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex gap-2 items-center">
                                <i :class="DONATION_PLATFORMS.find(p => p.key === slotProps.value)?.icon" :style="{color: DONATION_PLATFORMS.find(p => p.key === slotProps.value)?.color}" />
                                <span>{{ slotProps.value === 'custom' ? $t('common.custom') : $t(`components.post.sponsor.platforms.${slotProps.value}`) }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                    </Select>
                </div>

                <div v-if="currentDonation.platform === 'custom'" class="flex flex-col gap-2">
                    <label for="donation-label">{{ $t('pages.settings.commercial.label') }}</label>
                    <InputText
                        id="donation-label"
                        v-model="currentDonation.label"
                        class="w-full"
                    />
                </div>

                <div v-if="isPlatformType('url') || isPlatformType('both')" class="flex flex-col gap-2">
                    <label for="donation-url">{{ $t('pages.settings.commercial.url') }}</label>
                    <InputText
                        id="donation-url"
                        v-model="currentDonation.url"
                        class="w-full"
                        placeholder="https://..."
                    />
                </div>

                <div v-if="isPlatformType('image') || isPlatformType('both')" class="flex flex-col gap-2">
                    <label for="donation-image">{{ $t('pages.settings.commercial.image') }}</label>
                    <div class="flex gap-2">
                        <InputText
                            id="donation-image"
                            v-model="currentDonation.image"
                            class="w-full"
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

                <div class="flex flex-col gap-2">
                    <label>{{ $t('pages.settings.commercial.locales') }}</label>
                    <MultiSelect
                        v-model="currentDonation.locales"
                        :options="localeOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.settings.commercial.locales_hint')"
                        class="w-full"
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
    if (!currentSocial.value.url) return
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
.settings-commercial {
  .link-card {
    background-color: var(--p-surface-0);
    transition: all 0.2s;

    &:hover {
      border-color: var(--p-primary-color);
      background-color: var(--p-surface-50);
    }
  }
}

:global(.dark) .settings-commercial {
  .link-card {
    background-color: var(--p-surface-900);
    border-color: var(--p-surface-700);

    &:hover {
      background-color: var(--p-surface-800);
    }
  }
}
</style>
