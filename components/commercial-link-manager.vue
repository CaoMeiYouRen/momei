<template>
    <div class="commercial-manager">
        <!-- 社交链接部分 -->
        <section class="commercial-manager__section">
            <div class="commercial-manager__header">
                <div class="commercial-manager__header-info">
                    <h4 class="commercial-manager__section-title">
                        <i class="pi pi-share-alt" />
                        {{ $t('pages.settings.commercial.social_links') }}
                    </h4>
                    <p class="commercial-manager__desc">
                        {{ isAdmin ? $t('pages.admin.settings.commercial.global_social_desc') : $t('pages.settings.commercial.social_desc') }}
                    </p>
                </div>
                <Button
                    :label="$t('pages.settings.commercial.add_social')"
                    icon="pi pi-plus"
                    size="small"
                    severity="primary"
                    @click="openSocialDialog()"
                />
            </div>

            <div v-if="socialLinks.length === 0" class="commercial-manager__empty">
                <i class="pi pi-share-alt" />
                <p>{{ $t('pages.settings.commercial.empty_social') }}</p>
            </div>

            <div v-else class="commercial-manager__grid">
                <div
                    v-for="(link, index) in socialLinks"
                    :key="index"
                    class="commercial-manager__card"
                >
                    <div
                        class="commercial-manager__card-icon"
                        :style="{color: getSocialColor(link.platform)}"
                    >
                        <i :class="getSocialIcon(link.platform)" />
                    </div>
                    <div class="commercial-manager__card-content">
                        <div class="commercial-manager__card-label">
                            <span class="mr-2">{{ link.label || getSocialName(link.platform) }}</span>
                            <div v-if="link.locales && link.locales.length > 0" class="commercial-manager__card-tags">
                                <Tag
                                    v-for="loc in link.locales"
                                    :key="loc"
                                    :value="loc"
                                    size="small"
                                    severity="secondary"
                                    class="commercial-manager__tag"
                                />
                            </div>
                        </div>
                        <div class="commercial-manager__card-value">
                            {{ link.url || link.image }}
                        </div>
                    </div>
                    <div class="commercial-manager__card-actions">
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
                            @click="confirmDeleteSocial(index)"
                        />
                    </div>
                </div>
            </div>
        </section>

        <Divider class="commercial-manager__divider" />

        <!-- 打赏链接部分 -->
        <section class="commercial-manager__section">
            <div class="commercial-manager__header">
                <div class="commercial-manager__header-info">
                    <h4 class="commercial-manager__section-title">
                        <i class="pi pi-heart-fill" />
                        {{ $t('pages.settings.commercial.donation_links') }}
                    </h4>
                    <p class="commercial-manager__desc">
                        {{ isAdmin ? $t('pages.admin.settings.commercial.global_donation_desc') : $t('pages.settings.commercial.donation_desc') }}
                    </p>
                </div>
                <Button
                    :label="$t('pages.settings.commercial.add_donation')"
                    icon="pi pi-plus"
                    size="small"
                    severity="primary"
                    @click="openDonationDialog()"
                />
            </div>

            <div v-if="donationLinks.length === 0" class="commercial-manager__empty">
                <i class="pi pi-heart" />
                <p>{{ $t('pages.settings.commercial.empty_donation') }}</p>
            </div>

            <div v-else class="commercial-manager__grid">
                <div
                    v-for="(link, index) in donationLinks"
                    :key="index"
                    class="commercial-manager__card"
                >
                    <div
                        class="commercial-manager__card-icon"
                        :style="{color: getPlatformColor(link.platform)}"
                    >
                        <i :class="getPlatformIcon(link.platform)" />
                    </div>
                    <div class="commercial-manager__card-content">
                        <div class="commercial-manager__card-label">
                            <span class="mr-2">{{ link.label || getPlatformName(link.platform) }}</span>
                            <div v-if="link.locales && link.locales.length > 0" class="commercial-manager__card-tags">
                                <Tag
                                    v-for="loc in link.locales"
                                    :key="loc"
                                    :value="loc"
                                    size="small"
                                    severity="secondary"
                                    class="commercial-manager__tag"
                                />
                            </div>
                        </div>
                        <div class="commercial-manager__card-value">
                            {{ link.url || link.image }}
                        </div>
                    </div>
                    <div class="commercial-manager__card-actions">
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
        </section>

        <!-- 打赏对话框 -->
        <Dialog
            v-model:visible="dialogVisible"
            :header="editingIndex > -1 ? $t('pages.settings.commercial.edit_donation') : $t('pages.settings.commercial.add_donation')"
            modal
            class="commercial-manager__dialog"
            :dismissable-mask="true"
        >
            <div class="commercial-manager__dialog-body">
                <div class="commercial-manager__field">
                    <label>{{ $t('pages.settings.commercial.platform') }}</label>
                    <Select
                        v-model="currentLink.platform"
                        :options="DONATION_PLATFORMS"
                        option-label="key"
                        option-value="key"
                        class="w-full"
                    >
                        <template #option="slotProps">
                            <div class="commercial-manager__select-option">
                                <i :class="slotProps.option.icon" :style="{color: slotProps.option.color}" />
                                <span>{{ slotProps.option.key === 'custom' ? $t('common.custom') : $t(`components.post.sponsor.platforms.${slotProps.option.key}`) }}</span>
                            </div>
                        </template>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="commercial-manager__select-value">
                                <i :class="getPlatformIcon(slotProps.value)" :style="{color: getPlatformColor(slotProps.value)}" />
                                <span>{{ slotProps.value === 'custom' ? $t('common.custom') : $t(`components.post.sponsor.platforms.${slotProps.value}`) }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                    </Select>
                </div>

                <div v-if="currentLink.platform === 'custom'" class="commercial-manager__field">
                    <label for="label">{{ $t('pages.settings.commercial.label') }}</label>
                    <InputText
                        id="label"
                        v-model="currentLink.label"
                        class="w-full"
                    />
                </div>

                <div v-if="isPlatformType('url') || isPlatformType('both')" class="commercial-manager__field">
                    <label for="url">{{ $t('pages.settings.commercial.url') }}</label>
                    <InputText
                        id="url"
                        v-model="currentLink.url"
                        class="w-full"
                        placeholder="https://..."
                    />
                </div>

                <div v-if="isPlatformType('image') || isPlatformType('both')" class="commercial-manager__field">
                    <label for="image">{{ $t('pages.settings.commercial.image') }}</label>
                    <div class="commercial-manager__uploader-group">
                        <InputText
                            id="image"
                            v-model="currentLink.image"
                            class="flex-grow"
                            placeholder="/uploads/..."
                        />
                        <AppUploader
                            :id="`donation-uploader-${isAdmin ? 'admin' : 'user'}`"
                            :auto-save="false"
                            @update:model-value="(val) => currentLink.image = val || undefined"
                        />
                    </div>
                </div>

                <div class="commercial-manager__field">
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
                <div class="commercial-manager__dialog-footer">
                    <Button
                        :label="$t('common.cancel')"
                        text
                        severity="secondary"
                        @click="dialogVisible = false"
                    />
                    <Button :label="$t('common.save')" @click="addLink" />
                </div>
            </template>
        </Dialog>

        <!-- 社交对话框 -->
        <Dialog
            v-model:visible="socialDialogVisible"
            :header="editingSocialIndex > -1 ? $t('pages.settings.commercial.edit_social') : $t('pages.settings.commercial.add_social')"
            modal
            class="commercial-manager__dialog"
            :dismissable-mask="true"
        >
            <div class="commercial-manager__dialog-body">
                <div class="commercial-manager__field">
                    <label>{{ $t('pages.settings.commercial.platform') }}</label>
                    <Select
                        v-model="currentSocialLink.platform"
                        :options="SOCIAL_PLATFORMS"
                        option-label="key"
                        option-value="key"
                        class="w-full"
                    >
                        <template #option="slotProps">
                            <div class="commercial-manager__select-option">
                                <i :class="slotProps.option.icon" :style="{color: slotProps.option.color}" />
                                <span>{{ slotProps.option.key === 'custom' ? $t('common.custom') : $t(`pages.settings.commercial.social_platforms.${slotProps.option.key}`) }}</span>
                            </div>
                        </template>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="commercial-manager__select-value">
                                <i :class="getSocialIcon(slotProps.value)" :style="{color: getSocialColor(slotProps.value)}" />
                                <span>{{ slotProps.value === 'custom' ? $t('common.custom') : $t(`pages.settings.commercial.social_platforms.${slotProps.value}`) }}</span>
                            </div>
                            <span v-else>{{ slotProps.placeholder }}</span>
                        </template>
                    </Select>
                </div>

                <div v-if="currentSocialLink.platform === 'custom'" class="commercial-manager__field">
                    <label for="social-label">{{ $t('pages.settings.commercial.label') }}</label>
                    <InputText
                        id="social-label"
                        v-model="currentSocialLink.label"
                        class="w-full"
                    />
                </div>

                <div class="commercial-manager__field">
                    <label for="social-url">{{ $t('pages.settings.commercial.url') }}</label>
                    <InputText
                        id="social-url"
                        v-model="currentSocialLink.url"
                        class="w-full"
                        placeholder="https://..."
                    />
                </div>

                <div v-if="isSocialPlatformImg()" class="commercial-manager__field">
                    <label for="social-image">{{ $t('pages.settings.commercial.image') }}</label>
                    <div class="commercial-manager__uploader-group">
                        <InputText
                            id="social-image"
                            v-model="currentSocialLink.image"
                            class="flex-grow"
                            placeholder="/uploads/..."
                        />
                        <AppUploader
                            :id="`social-uploader-${isAdmin ? 'admin' : 'user'}`"
                            :auto-save="false"
                            @update:model-value="(val) => currentSocialLink.image = val || undefined"
                        />
                    </div>
                </div>

                <div class="commercial-manager__field">
                    <label>{{ $t('pages.settings.commercial.locales') }}</label>
                    <MultiSelect
                        v-model="currentSocialLink.locales"
                        :options="localeOptions"
                        option-label="label"
                        option-value="value"
                        :placeholder="$t('pages.settings.commercial.locales_hint')"
                        class="w-full"
                    />
                </div>
            </div>
            <template #footer>
                <div class="commercial-manager__dialog-footer">
                    <Button
                        :label="$t('common.cancel')"
                        text
                        severity="secondary"
                        @click="socialDialogVisible = false"
                    />
                    <Button :label="$t('common.save')" @click="addSocialLink" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { SOCIAL_PLATFORMS, DONATION_PLATFORMS, type SocialLink, type DonationLink } from '@/utils/shared/commercial'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

interface Props {
    isAdmin?: boolean
}

defineProps<Props>()

const socialLinks = defineModel<SocialLink[]>('socialLinks', { default: () => [] })
const donationLinks = defineModel<DonationLink[]>('donationLinks', { default: () => [] })

const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()

const localeOptions = [
    { label: t('common.languages.zh-CN'), value: 'zh-CN' },
    { label: t('common.languages.en-US'), value: 'en-US' },
]

// 逻辑处理
const dialogVisible = ref(false)
const socialDialogVisible = ref(false)
const editingIndex = ref(-1)
const editingSocialIndex = ref(-1)
const currentLink = ref<DonationLink>({ platform: 'wechat_pay', url: '', image: '', locales: [] })
const currentSocialLink = ref<SocialLink>({ platform: 'github', url: '', locales: [] })

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

const openSocialDialog = (link?: SocialLink, index?: number) => {
    if (link && index !== undefined) {
        currentSocialLink.value = { ...link, locales: link.locales ? [...link.locales] : [] }
        editingSocialIndex.value = index
    } else {
        currentSocialLink.value = { platform: 'github', url: '', locales: [] }
        editingSocialIndex.value = -1
    }
    socialDialogVisible.value = true
}

const addLink = () => {
    if (!currentLink.value.url && !currentLink.value.image) {
        toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('pages.settings.commercial.validation_error'), life: 3000 })
        return
    }
    if (editingIndex.value > -1) {
        donationLinks.value[editingIndex.value] = { ...currentLink.value }
    } else {
        donationLinks.value.push({ ...currentLink.value })
    }
    dialogVisible.value = false
}

const addSocialLink = () => {
    if (!currentSocialLink.value.url && !currentSocialLink.value.image) {
        toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('pages.settings.commercial.validation_error'), life: 3000 })
        return
    }
    if (editingSocialIndex.value > -1) {
        socialLinks.value[editingSocialIndex.value] = { ...currentSocialLink.value }
    } else {
        socialLinks.value.push({ ...currentSocialLink.value })
    }
    socialDialogVisible.value = false
}

const isPlatformType = (type: string) => {
    const platform = DONATION_PLATFORMS.find((p) => p.key === currentLink.value.platform)
    if (!platform) return false
    return platform.type === type
}

const isSocialPlatformImg = () => {
    return currentSocialLink.value.platform === 'wechat_mp' || currentSocialLink.value.platform === 'custom'
}

const getPlatformIcon = (key: string) => DONATION_PLATFORMS.find((p) => p.key === key)?.icon || 'pi pi-link'
const getPlatformColor = (key: string) => DONATION_PLATFORMS.find((p) => p.key === key)?.color || 'inherit'
const getPlatformName = (key: string) => key === 'custom' ? '' : t(`components.post.sponsor.platforms.${key}`)

const getSocialIcon = (key: string) => SOCIAL_PLATFORMS.find((p) => p.key === key)?.icon || 'pi pi-link'
const getSocialColor = (key: string) => SOCIAL_PLATFORMS.find((p) => p.key === key)?.color || 'inherit'
const getSocialName = (key: string) => key === 'custom' ? '' : t(`pages.settings.commercial.social_platforms.${key}`)

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

const confirmDeleteSocial = (index: number) => {
    confirm.require({
        message: t('pages.settings.commercial.delete_confirm'),
        header: t('common.confirmation'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            socialLinks.value.splice(index, 1)
        },
    })
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.commercial-manager {
    &__section {
        background-color: var(--p-surface-0);
        border: 1px solid var(--p-surface-200);
        border-radius: $border-radius-lg;
        padding: $spacing-lg;
        margin-bottom: $spacing-xl;

        .dark & {
            background-color: var(--p-surface-800);
            border-color: var(--p-surface-700);
        }
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: $spacing-lg;
    }

    &__header-info {
        flex: 1;
    }

    &__section-title {
        margin: 0;
        font-size: $font-size-lg;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: $spacing-sm;

        i {
            color: var(--p-primary-color);
        }

        .pi-heart-fill {
            color: var(--p-red-500);
        }
    }

    &__desc {
        margin: $spacing-xs 0 0;
        font-size: $font-size-sm;
        color: var(--p-surface-500);
    }

    &__empty {
        text-align: center;
        padding: $spacing-xl;
        border: 2px dashed var(--p-surface-200);
        border-radius: $border-radius-md;
        background-color: var(--p-surface-50);
        color: var(--p-surface-400);

        .dark & {
            background-color: var(--p-surface-900);
            border-color: var(--p-surface-700);
        }

        i {
            font-size: 3rem;
            margin-bottom: $spacing-sm;
        }

        p {
            margin: 0;
            font-weight: 500;
        }
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: $spacing-md;

        @media (width >= 768px) {
            grid-template-columns: repeat(2, 1fr);
        }

        @media (width >= 1200px) {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    &__card {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: $spacing-md;
        padding: $spacing-md;
        background-color: var(--p-surface-0);
        border: 1px solid var(--p-surface-200);
        border-radius: $border-radius-md;
        transition: all 0.3s ease;

        .dark & {
            background-color: var(--p-surface-900);
            border-color: var(--p-surface-700);
        }

        &:hover {
            border-color: var(--p-primary-color);
            box-shadow: 0 4px 12px rgb(0 0 0 / 0.05);
        }
    }

    &__card-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        background-color: var(--p-surface-50);
        border-radius: $border-radius-sm;
        flex-shrink: 0;

        .dark & {
            background-color: var(--p-surface-800);
        }
    }

    &__card-content {
        flex: 1;
        min-width: 200px;
    }

    &__card-label {
        font-weight: 600;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
        min-width: 0;
    }

    &__card-tags {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
    }

    &__tag {
        font-size: 10px !important;
        padding: 0 4px !important;
        height: 1.2rem;
    }

    &__card-value {
        font-size: $font-size-xs;
        color: var(--p-surface-500);
        word-break: break-all;
        margin-top: 2px;
    }

    &__card-actions {
        display: flex;
        gap: 4px;
    }

    &__divider {
        margin: $spacing-xl 0;
    }

    &__field {
        margin-bottom: $spacing-md;

        label {
            display: block;
            margin-bottom: $spacing-xs;
            font-weight: 500;
            font-size: $font-size-sm;
        }
    }

    &__uploader-group {
        display: flex;
        gap: $spacing-sm;
    }

    &__select-option, &__select-value {
        display: flex;
        align-items: center;
        gap: $spacing-sm;

        i {
            font-size: 1.1rem;
        }
    }

    &__dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: $spacing-sm;
    }
}
</style>
