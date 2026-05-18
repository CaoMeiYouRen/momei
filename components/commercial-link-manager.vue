<template>
    <div class="commercial-manager">
        <CommercialLinkSection
            kind="social"
            title-key="pages.settings.commercial.social_links"
            :description="t(socialDescriptionKey)"
            :add-label="$t('pages.settings.commercial.add_social')"
            empty-key="pages.settings.commercial.empty_social"
            header-icon="pi pi-share-alt"
            empty-icon="pi pi-share-alt"
            :links="socialLinks"
            @add="openSocialDialog()"
            @edit="(index) => openSocialDialog(socialLinks[index], index)"
            @remove="confirmDeleteSocial"
        />

        <Divider class="commercial-manager__divider" />

        <CommercialLinkSection
            kind="donation"
            title-key="pages.settings.commercial.donation_links"
            :description="t(donationDescriptionKey)"
            :add-label="$t('pages.settings.commercial.add_donation')"
            empty-key="pages.settings.commercial.empty_donation"
            header-icon="pi pi-heart-fill"
            empty-icon="pi pi-heart"
            :links="donationLinks"
            @add="openDonationDialog()"
            @edit="(index) => openDonationDialog(donationLinks[index], index)"
            @remove="confirmDelete"
        />

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
                    <AppUploader
                        v-model="currentLink.image"
                        class="w-full"
                    />
                    <div v-if="currentLink.image" class="commercial-manager__dialog-preview">
                        <Image
                            :src="currentLink.image"
                            alt="Preview"
                            width="120"
                            preview
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
                    <Button
                        :label="$t('common.save')"
                        data-testid="donation-save"
                        @click="addLink"
                    />
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
                                <span>{{ slotProps.option.key === 'custom' ? $t('common.custom') : $t(`common.platforms.${slotProps.option.key}`) }}</span>
                            </div>
                        </template>
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="commercial-manager__select-value">
                                <i :class="getSocialIcon(slotProps.value)" :style="{color: getSocialColor(slotProps.value)}" />
                                <span>{{ slotProps.value === 'custom' ? $t('common.custom') : $t(`common.platforms.${slotProps.value}`) }}</span>
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

                <div v-if="isSocialPlatformType('url') || isSocialPlatformType('both')" class="commercial-manager__field">
                    <label for="social-url">{{ $t('pages.settings.commercial.url') }}</label>
                    <InputText
                        id="social-url"
                        v-model="currentSocialLink.url"
                        class="w-full"
                        placeholder="https://..."
                    />
                </div>

                <div v-if="isSocialPlatformType('image') || isSocialPlatformType('both')" class="commercial-manager__field">
                    <label for="social-image">{{ $t('pages.settings.commercial.image') }}</label>
                    <AppUploader
                        v-model="currentSocialLink.image"
                        class="w-full"
                    />
                    <div v-if="currentSocialLink.image" class="commercial-manager__dialog-preview">
                        <Image
                            :src="currentSocialLink.image"
                            alt="Preview"
                            width="120"
                            preview
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
                    <Button
                        :label="$t('common.save')"
                        data-testid="social-save"
                        @click="addSocialLink"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import {
    SOCIAL_PLATFORMS,
    DONATION_PLATFORMS,
    getCommercialPlatformColor,
    getCommercialPlatformIcon,
    getDonationPlatformType,
    getSocialPlatformType,
    type SocialLink,
    type DonationLink,
} from '@/utils/shared/commercial'
import { APP_ENABLED_LOCALES } from '@/i18n/config/locale-registry'
import { useLocaleMessageModules } from '@/composables/use-locale-message-modules'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

interface Props {
    isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isAdmin: false,
})

const socialLinks = defineModel<SocialLink[]>('socialLinks', { default: () => [] })
const donationLinks = defineModel<DonationLink[]>('donationLinks', { default: () => [] })

const { t } = useI18n()
const confirm = useConfirm()
const toast = useToast()
const { localeModulesReady: adminLocaleReady } = useLocaleMessageModules({
    modules: ['admin-settings'],
    enabled: computed(() => props.isAdmin),
})

const socialDescriptionKey = computed(() => (
    props.isAdmin && adminLocaleReady.value
        ? 'pages.admin.settings.commercial.global_social_desc'
        : 'pages.settings.commercial.social_desc'
))

const donationDescriptionKey = computed(() => (
    props.isAdmin && adminLocaleReady.value
        ? 'pages.admin.settings.commercial.global_donation_desc'
        : 'pages.settings.commercial.donation_desc'
))

const localeOptions = computed(() => APP_ENABLED_LOCALES.map((locale) => ({
    label: t(`common.languages.${locale.code}`),
    value: locale.code,
})))

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
        toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('common.validation_error'), life: 3000 })
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
        toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('common.validation_error'), life: 3000 })
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
    return getDonationPlatformType(currentLink.value.platform) === type
}

const isSocialPlatformType = (type: string) => {
    return getSocialPlatformType(currentSocialLink.value.platform) === type
}

const getPlatformIcon = (key: string) => getCommercialPlatformIcon(key, 'donation')
const getPlatformColor = (key: string) => getCommercialPlatformColor(key, 'donation')

const getSocialIcon = (key: string) => getCommercialPlatformIcon(key, 'social')
const getSocialColor = (key: string) => getCommercialPlatformColor(key, 'social')

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
    &__dialog-preview {
        margin-top: $spacing-sm;
        display: flex;
        justify-content: center;
        background-color: var(--p-surface-50);
        padding: $spacing-sm;
        border-radius: $border-radius-sm;
        border: 1px solid var(--p-surface-200);

        .dark & {
            background-color: var(--p-surface-900);
            border-color: var(--p-surface-700);
        }
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
