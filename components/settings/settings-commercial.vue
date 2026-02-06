<template>
    <div class="settings-commercial">
        <div class="settings-commercial__header-wrapper">
            <h2 class="settings-commercial__title">
                {{ $t('pages.settings.commercial.title') }}
            </h2>
            <p class="settings-commercial__subtitle">
                {{ $t('pages.settings.commercial.subtitle') }}
            </p>
        </div>

        <CommercialLinkManager
            v-model:social-links="socialLinks"
            v-model:donation-links="donationLinks"
        />

        <div class="settings-commercial__actions">
            <Button
                :label="$t('common.save')"
                icon="pi pi-check"
                :loading="saving"
                @click="saveSettings"
            />
        </div>

        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import CommercialLinkManager from '@/components/commercial-link-manager.vue'
import { type SocialLink, type DonationLink } from '@/utils/shared/commercial'
import { useToast } from 'primevue/usetoast'

const { t } = useI18n()
const toast = useToast()
const { $appFetch } = useAppApi()

const socialLinks = ref<SocialLink[]>([])
const donationLinks = ref<DonationLink[]>([])
const saving = ref(false)

const { data, refresh } = await useAsyncData('user-commercial-settings', () =>
    $appFetch<any>('/api/user/commercial'),
)

watchEffect(() => {
    if (data.value?.data) {
        socialLinks.value = [...(data.value.data.socialLinks || [])]
        donationLinks.value = [...(data.value.data.donationLinks || [])]
    }
})

const saveSettings = async () => {
    saving.value = true
    try {
        const res = await $appFetch<any>('/api/user/commercial', {
            method: 'PUT',
            body: {
                socialLinks: socialLinks.value,
                donationLinks: donationLinks.value,
            },
        })
        if (res.code === 200) {
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.commercial.success'), life: 3000 })
            refresh()
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
    &__header-wrapper {
        margin-bottom: $spacing-xl;
    }

    &__title {
        margin: 0;
        font-size: $font-size-2xl;
        font-weight: 600;
    }

    &__subtitle {
        margin: $spacing-xs 0 0;
        color: var(--p-text-muted-color);
        font-size: $font-size-sm;
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        margin-top: $spacing-xl;
    }
}
</style>
