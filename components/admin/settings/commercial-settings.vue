<template>
    <div class="commercial-settings">
        <Message
            v-if="demoPreview"
            severity="info"
            :closable="false"
            class="commercial-settings__demo-notice"
        >
            {{ $t('pages.admin.settings.system.demo_preview.description') }}
        </Message>

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
        </div>

        <AdminFloatingActions
            :primary-label="$t('common.save')"
            primary-icon="pi pi-check"
            :primary-loading="saving"
            :primary-disabled="saving || !isDirty"
            :secondary-label="shouldShowFeedbackEntry ? $t('common.feedback') : ''"
            secondary-icon="pi pi-question-circle"
            :status-label="actionStatusLabel"
            :status-tone="actionStatusTone"
            @primary-click="saveSettings"
            @secondary-click="openFeedbackEntry"
        />
    </div>
</template>

<script setup lang="ts">
import AdminFloatingActions from '@/components/admin/admin-floating-actions.vue'
import CommercialLinkManager from '@/components/commercial-link-manager.vue'
import { useFeedbackEntry } from '@/composables/use-feedback-entry'
import { useUnsavedChangesGuard } from '@/composables/use-unsaved-changes-guard'
import { stableSerialize } from '@/utils/shared/stable-serialize'
import { type SocialLink, type DonationLink } from '@/utils/shared/commercial'
import { useToast } from 'primevue/usetoast'

const { t } = useI18n()
const toast = useToast()
const { $appFetch } = useAppApi()
const { openFeedbackEntry, shouldShowFeedbackEntry } = useFeedbackEntry({ includeAdmin: true })

const enabled = ref(false)
const socialLinks = ref<SocialLink[]>([])
const donationLinks = ref<DonationLink[]>([])
const demoPreview = ref(false)
const saving = ref(false)
const initialCommercialSnapshot = ref(stableSerialize({
    enabled: false,
    socialLinks: [],
    donationLinks: [],
}))

const buildCommercialComparableState = () => ({
    enabled: enabled.value,
    socialLinks: socialLinks.value,
    donationLinks: donationLinks.value,
})

const syncInitialCommercialSnapshot = () => {
    initialCommercialSnapshot.value = stableSerialize(buildCommercialComparableState())
}

const isDirty = computed(() => stableSerialize(buildCommercialComparableState()) !== initialCommercialSnapshot.value)
const actionStatusLabel = computed(() => isDirty.value
    ? t('pages.admin.settings.system.floating_actions.unsaved')
    : t('pages.admin.settings.system.floating_actions.saved'))
const actionStatusTone = computed<'warn' | 'success'>(() => isDirty.value ? 'warn' : 'success')

function getErrorDetail(error: unknown, fallback: string) {
    const candidate = error as {
        data?: { message?: string, statusMessage?: string }
        statusMessage?: string
        message?: string
    }

    return candidate?.data?.message
        || candidate?.data?.statusMessage
        || candidate?.statusMessage
        || candidate?.message
        || fallback
}

// 数据获取
const loadSettings = async () => {
    try {
        const res = await $appFetch<any>('/api/admin/settings/commercial')
        if (res.code === 200 && res.data) {
            demoPreview.value = Boolean(res.data.demoPreview)
            enabled.value = res.data.enabled !== false
            socialLinks.value = [...(res.data.socialLinks || [])]
            donationLinks.value = [...(res.data.donationLinks || [])]
            syncInitialCommercialSnapshot()
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: getErrorDetail(error, t('common.error_loading')), life: 3000 })
    }
}

const saveSettings = async () => {
    if (!isDirty.value) {
        return
    }

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
            syncInitialCommercialSnapshot()
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.commercial.success'), life: 3000 })
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: getErrorDetail(error, t('common.save_failed')), life: 3000 })
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadSettings()
})

useUnsavedChangesGuard({
    isDirty,
    message: computed(() => t('pages.admin.settings.system.floating_actions.leave_confirm')),
})
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.commercial-settings {
    padding-bottom: 7rem;

    &__demo-notice {
        margin-bottom: $spacing-lg;
    }

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

}
</style>
