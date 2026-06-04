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
            @remove="confirmDeleteDonationLink"
        />

        <CommercialLinkDialog
            v-model:visible="dialogVisible"
            v-model:link="currentLink"
            :editing-index="editingIndex"
            kind="donation"
            :platforms="DONATION_PLATFORMS"
            i18n-prefix="pages.settings.commercial"
            platform-i18n-prefix="components.post.sponsor.platforms"
            :platform-icon="(k) => getCommercialPlatformIcon(k, 'donation')"
            :platform-color="(k) => getCommercialPlatformColor(k, 'donation')"
            :platform-type="donationPlatformType"
            :locale-options="localeOptions"
            @save="addLink"
        />

        <CommercialLinkDialog
            v-model:visible="socialDialogVisible"
            v-model:link="currentSocialLink"
            :editing-index="editingSocialIndex"
            kind="social"
            :platforms="SOCIAL_PLATFORMS"
            i18n-prefix="pages.settings.commercial"
            platform-i18n-prefix="common.platforms"
            :platform-icon="(k) => getCommercialPlatformIcon(k, 'social')"
            :platform-color="(k) => getCommercialPlatformColor(k, 'social')"
            :platform-type="socialPlatformType"
            :show-image="false"
            :locale-options="localeOptions"
            @save="addSocialLink"
        />
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
import CommercialLinkDialog from '@/components/commercial-link-dialog.vue'

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

const donationPlatformType = computed(() => getDonationPlatformType(currentLink.value.platform))
const socialPlatformType = computed(() => getSocialPlatformType(currentSocialLink.value.platform))

const confirmDeleteDonationLink = (index: number) => {
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
    &__divider {
        margin: $spacing-xl 0;
    }
}
</style>
