<template>
    <div class="admin-notification-management page-container">
        <AdminPageHeader :title="$t('pages.admin.notifications.title')" show-language-switcher>
            <template #actions>
                <Button
                    :label="$t('pages.admin.notifications.go_to_marketing')"
                    icon="pi pi-megaphone"
                    severity="secondary"
                    variant="outlined"
                    @click="navigateToMarketing"
                />
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

        <Card class="admin-notification-management__card">
            <template #content>
                <NotificationDeliveryLogList />
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
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
        color: var(--p-text-color);
    }

    &__intro-description {
        margin: $spacing-xs 0 0;
        color: var(--p-text-muted-color);
        line-height: 1.7;
    }

    &__card {
        :deep(.p-card-body) {
            padding: $spacing-lg;
        }
    }
}
</style>
