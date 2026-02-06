<template>
    <div class="commercial-settings">
        <div class="bg-surface-50 border dark:bg-surface-900 mb-8 p-4 rounded-lg settings-section">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-medium m-0 text-lg">
                        {{ $t('components.post.sponsor.title') }}
                    </h4>
                    <p class="m-0 text-sm text-surface-500">
                        {{ $t('pages.admin.settings.commercial.global_toggle_desc') }}
                    </p>
                </div>
                <ToggleSwitch v-model="enabled" />
            </div>
        </div>

        <div v-if="enabled" class="space-y-8">
            <div class="settings-section">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h4 class="font-medium m-0 text-lg">
                            {{ $t('pages.settings.commercial.donation_links') }}
                        </h4>
                        <p class="m-0 text-sm text-surface-500">
                            {{ $t('pages.admin.settings.commercial.global_donation_desc') }}
                        </p>
                    </div>
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
                        class="bg-surface-0 border dark:bg-surface-800 flex gap-4 items-center link-card p-4 rounded-lg"
                    >
                        <i
                            :class="getPlatformIcon(link.platform)"
                            :style="{color: getPlatformColor(link.platform)}"
                            class="text-2xl"
                        />
                        <div class="flex-grow min-w-0">
                            <div class="font-medium truncate">
                                {{ link.label || getPlatformName(link.platform) }}
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
                                @click="confirmDelete(index)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-end pt-4">
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-check"
                    :loading="saving"
                    @click="saveSettings"
                />
            </div>
        </div>

        <Dialog
            v-model:visible="dialogVisible"
            :header="$t('pages.settings.commercial.add_donation')"
            modal
            class="max-w-lg w-full"
        >
            <div class="flex flex-col gap-4 py-2">
                <div class="flex flex-col gap-2">
                    <label for="platform">{{ $t('pages.settings.commercial.platform') }}</label>
                    <Select
                        id="platform"
                        v-model="currentLink.platform"
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

                <div v-if="currentLink.platform === 'custom'" class="flex flex-col gap-2">
                    <label for="label">{{ $t('pages.settings.commercial.label') }}</label>
                    <InputText
                        id="label"
                        v-model="currentLink.label"
                        class="w-full"
                    />
                </div>

                <div v-if="isPlatformType('url') || isPlatformType('both')" class="flex flex-col gap-2">
                    <label for="url">{{ $t('pages.settings.commercial.url') }}</label>
                    <InputText
                        id="url"
                        v-model="currentLink.url"
                        class="w-full"
                        placeholder="https://..."
                    />
                </div>

                <div v-if="isPlatformType('image') || isPlatformType('both')" class="flex flex-col gap-2">
                    <label for="image">{{ $t('pages.settings.commercial.image') }}</label>
                    <div class="flex gap-2">
                        <InputText
                            id="image"
                            v-model="currentLink.image"
                            class="w-full"
                            placeholder="/uploads/..."
                        />
                        <AppUploader
                            id="admin-qr-uploader"
                            v-model="currentLink.image"
                            :auto-save="false"
                            @update:model-value="(val) => currentLink.image = val || undefined"
                        />
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label>{{ $t('pages.settings.commercial.locales') }}</label>
                    <MultiSelect
                        v-model="currentLink.locales"
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
                    @click="dialogVisible = false"
                />
                <Button :label="$t('common.save')" @click="addLink" />
            </template>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { DONATION_PLATFORMS, type DonationLink } from '@/utils/shared/commercial'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()
const { $appFetch } = useAppApi()

const enabled = ref(false)
const donationLinks = ref<DonationLink[]>([])
const saving = ref(false)

const localeOptions = [
    { label: t('common.languages.zh-CN'), value: 'zh-CN' },
    { label: t('common.languages.en-US'), value: 'en-US' },
]

// Data Fetching
const loadSettings = async () => {
    try {
        const res = await $appFetch<any>('/api/settings/commercial')
        if (res.code === 200 && res.data) {
            enabled.value = res.data.enabled
            donationLinks.value = [...(res.data.donationLinks || [])]
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.error_loading'), life: 3000 })
    }
}

// Logic
const dialogVisible = ref(false)
const editingIndex = ref(-1)
const currentLink = ref<DonationLink>({ platform: 'wechat_pay', url: '', image: '', locales: [] })

const openDonationDialog = (link?: DonationLink, index?: number) => {
    if (link && index !== undefined) {
        currentLink.value = { ...link, locales: link.locales ? [...link.locales] : [] }
        editingIndex.value = index
    } else {
        currentLink.value = { platform: 'wechat_pay', url: '', image: '', locales: [] }
        editingIndex.value = -1
    }
    dialogVisible.value = true
}

const addLink = () => {
    if (!currentLink.value.url && !currentLink.value.image) return
    if (editingIndex.value > -1) {
        donationLinks.value[editingIndex.value] = { ...currentLink.value }
    } else {
        donationLinks.value.push({ ...currentLink.value })
    }
    dialogVisible.value = false
}

const isPlatformType = (type: string) => {
    const platform = DONATION_PLATFORMS.find((p) => p.key === currentLink.value.platform)
    if (!platform) return false
    return platform.type === type
}

const getPlatformIcon = (key: string) => DONATION_PLATFORMS.find((p) => p.key === key)?.icon || 'pi pi-link'
const getPlatformColor = (key: string) => DONATION_PLATFORMS.find((p) => p.key === key)?.color || 'inherit'
const getPlatformName = (key: string) => key === 'custom' ? '' : t(`components.post.sponsor.platforms.${key}`)

const confirmDelete = (index: number) => {
    confirm.require({
        message: t('pages.settings.commercial.delete_confirm'),
        header: t('common.confirmation'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            donationLinks.value.splice(index, 1)
        },
    })
}

const saveSettings = async () => {
    saving.value = true
    try {
        const res = await $appFetch<any>('/api/settings/commercial', {
            method: 'PUT',
            body: {
                enabled: enabled.value,
                donationLinks: donationLinks.value,
            },
        })
        if (res.code === 200) {
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.commercial.success'), life: 3000 })
        }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: e.data?.message || t('common.save_failed'), life: 3000 })
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadSettings()
})
</script>

<style lang="scss" scoped>
.commercial-settings {
  .link-card {
    transition: all 0.2s;

    &:hover {
      border-color: var(--p-primary-color);
    }
  }
}
</style>
