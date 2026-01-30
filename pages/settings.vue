<template>
    <div class="settings-page">
        <h1 class="settings-title">
            {{ $t("pages.settings.title") }}
        </h1>

        <div class="settings-layout">
            <!-- Sidebar Navigation -->
            <div class="settings-sidebar">
                <div
                    class="settings-menu-item"
                    :class="{active: activeTab === 'profile'}"
                    @click="activeTab = 'profile'"
                >
                    <i class="pi pi-user" />
                    <span>{{ $t("pages.settings.profile.title") }}</span>
                </div>
                <div
                    class="settings-menu-item"
                    :class="{active: activeTab === 'security'}"
                    @click="activeTab = 'security'"
                >
                    <i class="pi pi-lock" />
                    <span>{{ $t("pages.settings.security.title") }}</span>
                </div>
                <div
                    class="settings-menu-item"
                    :class="{active: activeTab === 'apiKeys'}"
                    @click="activeTab = 'apiKeys'"
                >
                    <i class="pi pi-key" />
                    <span>{{ $t("pages.settings.api_keys.title") }}</span>
                </div>
            </div>

            <!-- Content Area -->
            <div class="settings-content">
                <Card class="settings-card shadow-sm">
                    <template #content>
                        <!-- Profile Settings -->
                        <SettingsProfile v-if="activeTab === 'profile'" />

                        <!-- Security Settings -->
                        <SettingsSecurity v-if="activeTab === 'security'" />

                        <!-- API Keys Settings -->
                        <SettingsApiKeys v-if="activeTab === 'apiKeys'" />
                    </template>
                </Card>
            </div>
        </div>

        <Toast />
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: 'auth',
})

const activeTab = ref('profile')
</script>

<style lang="scss" scoped>
.settings-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

.settings-title {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 2rem;
    color: var(--p-text-color);
}

.settings-layout {
    display: flex;
    gap: 2rem;
    align-items: flex-start;

    @media (width <= 768px) {
        flex-direction: column;
    }
}

.settings-sidebar {
    width: 250px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    @media (width <= 768px) {
        width: 100%;
        flex-direction: row;
        overflow-x: auto;
    }
}

.settings-menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    color: var(--p-text-color-secondary);
    transition: all 0.2s;

    &:hover {
        background-color: var(--p-surface-100);
        color: var(--p-text-color);
    }

    &.active {
        background-color: var(--p-primary-50);
        color: var(--p-primary-color);
        font-weight: 500;
    }

    i {
        font-size: 1.1rem;
    }
}

.settings-content {
    flex: 1;
    width: 100%;
}

.settings-card {
    width: 100%;
    background: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    color: var(--p-text-color);
}
</style>
