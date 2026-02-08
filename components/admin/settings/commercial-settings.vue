<template>
    <div class="commercial-settings">
        <!-- 全局开关 -->
        <section class="commercial-settings__section commercial-settings__section--toggle">
            <div class="commercial-settings__toggle-wrapper">
                <div class="commercial-settings__toggle-info">
                    <h4 class="commercial-settings__title">
                        <i class="pi pi-bolt" />
                        {{ $t('components.post.sponsor.title') }}
                    </h4>
                    <p class="commercial-settings__desc">
                        {{ $t('pages.admin.settings.commercial.global_toggle_desc') }}
                    </p>
                </div>
                <ToggleSwitch v-model="enabled" />
            </div>
        </section>

        <div v-if="enabled" class="commercial-settings__container">
            <CommercialLinkManager
                v-model:social-links="socialLinks"
                v-model:donation-links="donationLinks"
                is-admin
            />

            <!-- 吸底保存栏 -->
            <div class="commercial-settings__sticky-footer">
                <div class="commercial-settings__footer-content">
                    <Button
                        :label="$t('common.save')"
                        icon="pi pi-check"
                        :loading="saving"
                        raised
                        @click="saveSettings"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import CommercialLinkManager from '@/components/commercial-link-manager.vue'
import { type SocialLink, type DonationLink } from '@/utils/shared/commercial'
import { useToast } from 'primevue/usetoast'

const { t } = useI18n()
const toast = useToast()
const { $appFetch } = useAppApi()

const enabled = ref(false)
const socialLinks = ref<SocialLink[]>([])
const donationLinks = ref<DonationLink[]>([])
const saving = ref(false)

// 数据获取
const loadSettings = async () => {
    try {
        const res = await $appFetch<any>('/api/admin/settings/commercial')
        if (res.code === 200 && res.data) {
            enabled.value = res.data.enabled !== false
            socialLinks.value = [...(res.data.socialLinks || [])]
            donationLinks.value = [...(res.data.donationLinks || [])]
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.error_loading'), life: 3000 })
    }
}

const saveSettings = async () => {
    saving.value = true
    try {
        const res = await $appFetch<any>('/api/admin/settings/commercial', {
            method: 'PUT',
            body: {
                enabled: enabled.value,
                socialLinks: socialLinks.value,
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
@use "@/styles/variables" as *;

.commercial-settings {
    &__section {
        background-color: var(--p-surface-0);
        border: 1px solid var(--p-surface-200);
        border-radius: $border-radius-lg;
        padding: $spacing-lg;
        margin-bottom: $spacing-xl;

        &--toggle {
            background-color: var(--p-surface-50);

            .dark & {
                background-color: var(--p-surface-900);
            }
        }
    }

    &__toggle-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__toggle-info {
        flex: 1;
    }

    &__title {
        margin: 0;
        font-size: $font-size-lg;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: $spacing-sm;

        i {
            color: var(--p-yellow-500);
        }
    }

    &__desc {
        margin: $spacing-xs 0 0;
        font-size: $font-size-sm;
        color: var(--p-surface-500);
    }

    &__sticky-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: var(--p-surface-0);
        backdrop-filter: blur(8px);
        border-top: 1px solid var(--p-surface-200);
        padding: $spacing-md;
        z-index: 100;

        .dark & {
            background-color: var(--p-surface-900);
            border-color: var(--p-surface-700);
        }
    }

    &__footer-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: flex-end;
        padding-right: $spacing-xl;
    }
}
</style>
