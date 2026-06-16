<template>
    <div class="commercial-manager">
        <CommercialLinkSection
            kind="social"
            :title-key="socialSection.titleKey"
            :description="t(socialDescriptionKey)"
            :add-label="$t(socialSection.addLabelKey)"
            :empty-key="socialSection.emptyKey"
            :header-icon="socialSection.headerIcon"
            :empty-icon="socialSection.emptyIcon"
            :links="socialLinks"
            @add="openDialog('social')"
            @edit="(index: number) => openDialog('social', socialLinks[index], index)"
            @remove="confirmDelete('social', $event as number)"
        />

        <Divider class="commercial-manager__divider" />

        <CommercialLinkSection
            kind="donation"
            :title-key="donationSection.titleKey"
            :description="t(donationDescriptionKey)"
            :add-label="$t(donationSection.addLabelKey)"
            :empty-key="donationSection.emptyKey"
            :header-icon="donationSection.headerIcon"
            :empty-icon="donationSection.emptyIcon"
            :links="donationLinks"
            @add="openDialog('donation')"
            @edit="(index: number) => openDialog('donation', donationLinks[index], index)"
            @remove="confirmDelete('donation', $event as number)"
        />

        <CommercialLinkDialog
            v-model:visible="dialogVisible"
            v-model:link="currentLink"
            :editing-index="editingIndex"
            kind="donation"
            :platforms="DONATION_PLATFORMS"
            i18n-prefix="pages.settings.commercial"
            platform-i18n-prefix="components.post.sponsor.platforms"
            :platform-icon="(k: string) => getCommercialPlatformIcon(k, 'donation')"
            :platform-color="(k: string) => getCommercialPlatformColor(k, 'donation')"
            :platform-type="donationPlatformType"
            :locale-options="localeOptions"
            @save="addLink('donation')"
        />

        <CommercialLinkDialog
            v-model:visible="socialDialogVisible"
            v-model:link="currentSocialLink"
            :editing-index="editingSocialIndex"
            kind="social"
            :platforms="SOCIAL_PLATFORMS"
            i18n-prefix="pages.settings.commercial"
            platform-i18n-prefix="common.platforms"
            :platform-icon="(k: string) => getCommercialPlatformIcon(k, 'social')"
            :platform-color="(k: string) => getCommercialPlatformColor(k, 'social')"
            :platform-type="socialPlatformType"
            :show-image="false"
            :locale-options="localeOptions"
            @save="addLink('social')"
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
    type CommercialPlatformKind,
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

const localeOptions = computed(() => APP_ENABLED_LOCALES.map((locale) => ({
    label: t(`common.languages.${locale.code}`),
    value: locale.code,
})))

// ── Kind section metadata (消除 A/B 组重复的配置描述) ──
const socialSection = {
    titleKey: 'pages.settings.commercial.social_links',
    emptyKey: 'pages.settings.commercial.empty_social',
    addLabelKey: 'pages.settings.commercial.add_social',
    headerIcon: 'pi pi-share-alt',
    emptyIcon: 'pi pi-share-alt',
}

const donationSection = {
    titleKey: 'pages.settings.commercial.donation_links',
    emptyKey: 'pages.settings.commercial.empty_donation',
    addLabelKey: 'pages.settings.commercial.add_donation',
    headerIcon: 'pi pi-heart-fill',
    emptyIcon: 'pi pi-heart',
}

// ── 描述键：复用同一逻辑，仅 suffix 不同（消除 C 组重复） ──
function makeDescriptionKey(suffix: string) {
    return computed(() =>
        props.isAdmin && adminLocaleReady.value
            ? `pages.admin.settings.commercial.global_${suffix}_desc`
            : `pages.settings.commercial.${suffix}_desc`,
    )
}
const socialDescriptionKey = makeDescriptionKey('social')
const donationDescriptionKey = makeDescriptionKey('donation')

// ── Dialog 状态（消除 D 组重复） ──
const dialogVisible = ref(false)
const socialDialogVisible = ref(false)
const editingIndex = ref(-1)
const editingSocialIndex = ref(-1)
const currentLink = ref<DonationLink>({ platform: 'wechat_pay', url: '', image: '', locales: [] })
const currentSocialLink = ref<SocialLink>({ platform: 'github', url: '', locales: [] })

// ── 通用 dialog handler（消除 E 组重复） ──
function openDialog(kind: CommercialPlatformKind, link?: SocialLink | DonationLink, index?: number) {
    if (kind === 'social') {
        const sl = link as SocialLink | undefined
        if (sl && index !== undefined) {
            currentSocialLink.value = { ...sl, locales: sl.locales ? [...sl.locales] : [] }
            editingSocialIndex.value = index
        } else {
            currentSocialLink.value = { platform: 'github', url: '', locales: [] }
            editingSocialIndex.value = -1
        }
        socialDialogVisible.value = true
    } else {
        const dl = link as DonationLink | undefined
        if (dl && index !== undefined) {
            currentLink.value = { ...dl, locales: dl.locales ? [...dl.locales] : [] }
            editingIndex.value = index
        } else {
            currentLink.value = { platform: 'wechat_pay', url: '', image: '', locales: [] }
            editingIndex.value = -1
        }
        dialogVisible.value = true
    }
}

// ── 通用 add/save handler（消除 F 组重复） ──
function addLink(kind: CommercialPlatformKind) {
    if (kind === 'social') {
        if (!currentSocialLink.value.url && !(currentSocialLink.value as any).image) {
            toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('common.validation_error'), life: 3000 })
            return
        }
        if (editingSocialIndex.value > -1) {
            socialLinks.value[editingSocialIndex.value] = { ...currentSocialLink.value }
        } else {
            socialLinks.value.push({ ...currentSocialLink.value })
        }
        socialDialogVisible.value = false
    } else {
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
}

// ── Platform type computed（消除 G 组重复） ──
const donationPlatformType = computed(() => getDonationPlatformType(currentLink.value.platform))
const socialPlatformType = computed(() => getSocialPlatformType(currentSocialLink.value.platform))

// ── 通用 delete 确认（消除 H 组重复） ──
function confirmDelete(kind: CommercialPlatformKind, index: number) {
    confirm.require({
        message: t('pages.settings.commercial.delete_confirm'),
        header: t('common.confirmation'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            if (kind === 'social') {
                socialLinks.value.splice(index, 1)
            } else {
                donationLinks.value.splice(index, 1)
            }
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
