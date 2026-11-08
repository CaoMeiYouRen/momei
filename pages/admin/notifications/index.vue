<template>
    <div class="admin-notification-management page-container">
        <AdminPageHeader :title="$t('pages.admin.notifications.title')" show-language-switcher>
            <template #actions>
                <CaomeiButton
                    variant="secondary"
                    :label="$t('pages.admin.notifications.go_to_marketing')"
                    @click="navigateToMarketing"
                >
                    <template #icon>
                        <Megaphone :size="16" />
                    </template>
                    {{ $t('pages.admin.notifications.go_to_marketing') }}
                </CaomeiButton>
            </template>
        </AdminPageHeader>

        <div class="admin-notification-management__intro">
            <h2 class="admin-notification-management__intro-title">
                {{ $t('pages.admin.notifications.overview_title') }}
            </h2>
            <p class="admin-notification-management__intro-description">
                {{ $t('pages.admin.notifications.description') }}
            </p>
        </div>

        <CaomeiCard class="admin-notification-management__card">
            <NotificationDeliveryLogList />
        </CaomeiCard>
    </div>
</template>

<script setup lang="ts">
import { Megaphone } from '@lucide/vue'
import NotificationDeliveryLogList from '@/components/admin/settings/notification-delivery-log-list.vue'

definePageMeta({
    middleware: 'admin',
})

const localePath = useLocalePath()

function navigateToMarketing() {
    return navigateTo(localePath('/admin/marketing'))
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.admin-notification-management {
    padding: $spacing-md;

    &__intro {
        margin-bottom: $spacing-lg;
    }

    &__intro-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--caomei-color-text);
    }

    &__intro-description {
        margin: $spacing-xs 0 0;
        color: var(--caomei-color-text-muted);
        line-height: 1.7;
    }

    &__card {
        :deep(.caomei-card__body) {
            padding: $spacing-lg;
        }
    }
}
</style>
