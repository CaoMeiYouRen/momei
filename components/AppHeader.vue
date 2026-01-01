<template>
    <header class="app-header">
        <div class="app-header__container">
            <NuxtLink to="/" class="app-header__logo-link">
                <img
                    src="/logo.png"
                    alt="Momei Logo"
                    class="app-header__logo"
                >
                <span class="app-header__title">{{ $t('components.header.title') }}</span>
            </NuxtLink>

            <div class="app-header__actions">
                <nav class="app-header__nav desktop-only">
                    <NuxtLink :to="localePath('/posts')" class="nav-link">
                        {{ $t('pages.posts.title') }}
                    </NuxtLink>

                    <NuxtLink :to="localePath('/archives')" class="nav-link">
                        {{ $t('pages.archives.title') }}
                    </NuxtLink>
                </nav>

                <div class="desktop-only flex gap-2 items-center">
                    <template v-if="user && (user.role === 'admin' || user.role === 'author')">
                        <Button
                            icon="pi pi-cog"
                            text
                            rounded
                            aria-haspopup="true"
                            aria-controls="admin_menu"
                            @click="toggleAdminMenu"
                        />
                        <Menu
                            id="admin_menu"
                            ref="adminMenu"
                            :model="adminMenuItems"
                            :popup="true"
                        />
                    </template>

                    <Button
                        :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
                        text
                        rounded
                        @click="toggleDark()"
                    />
                    <LanguageSwitcher />
                    <Button
                        v-if="!user"
                        :label="$t('pages.login.submit')"
                        text
                        @click="navigateTo('/login')"
                    />
                    <Button
                        v-else
                        icon="pi pi-user"
                        text
                        rounded
                        @click="navigateTo('/settings')"
                    />
                </div>

                <Button
                    icon="pi pi-bars"
                    text
                    rounded
                    class="mobile-only"
                    @click="isMobileMenuOpen = true"
                />
            </div>
        </div>

        <Drawer
            v-model:visible="isMobileMenuOpen"
            position="right"
            :header="$t('components.header.title')"
            class="mobile-drawer"
        >
            <div class="mobile-menu">
                <NuxtLink
                    :to="localePath('/posts')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <i class="pi pi-file" />
                    {{ $t('pages.posts.title') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/archives')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <i class="pi pi-calendar" />
                    {{ $t('pages.archives.title') }}
                </NuxtLink>

                <Divider />

                <div class="mobile-menu__item">
                    <span>{{ $t('components.header.language') }}</span>
                    <LanguageSwitcher />
                </div>

                <div class="mobile-menu__item">
                    <span>{{ isDark ? $t('components.header.dark_mode') : $t('components.header.light_mode') }}</span>
                    <Button
                        :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
                        text
                        rounded
                        @click="toggleDark()"
                    />
                </div>

                <Divider />

                <template v-if="user">
                    <div v-if="user.role === 'admin' || user.role === 'author'" class="mobile-admin-section">
                        <div class="mobile-admin-section__title">
                            {{ $t('pages.admin.posts.title') }}
                        </div>
                        <div
                            v-for="item in adminMenuItems"
                            :key="item.label"
                            class="mobile-nav-link"
                            @click="isMobileMenuOpen = false; item.command()"
                        >
                            <i :class="item.icon" />
                            {{ item.label }}
                        </div>
                    </div>
                    <Button
                        icon="pi pi-user"
                        :label="user.name"
                        text
                        class="mobile-user-button"
                        @click="isMobileMenuOpen = false; navigateTo('/settings')"
                    />
                </template>
                <Button
                    v-else
                    :label="$t('pages.login.submit')"
                    icon="pi pi-sign-in"
                    class="mobile-login-button"
                    @click="isMobileMenuOpen = false; navigateTo('/login')"
                />
            </div>
        </Drawer>
    </header>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { authClient } from '@/lib/auth-client'

const { t } = useI18n()
const session = authClient.useSession()
const user = computed(() => session.value?.data?.user)
const localePath = useLocalePath()

const isMobileMenuOpen = ref(false)

const adminMenu = ref()
const adminMenuItems = computed(() => [
    {
        label: t('pages.admin.posts.title'),
        icon: 'pi pi-file',
        command: () => navigateTo('/admin/posts'),
    },
    {
        label: t('pages.admin.categories.title'),
        icon: 'pi pi-folder',
        command: () => navigateTo('/admin/categories'),
    },
    {
        label: t('pages.admin.tags.title'),
        icon: 'pi pi-tags',
        command: () => navigateTo('/admin/tags'),
    },
])

const toggleAdminMenu = (event: any) => {
    adminMenu.value.toggle(event)
}

const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
    storageKey: 'theme',
})
const toggleDark = useToggle(isDark)

const preferredDark = usePreferredDark()

// 同步系统偏好设置的暗色模式状态
watch(preferredDark, (newVal) => {
    isDark.value = newVal
}, { immediate: true })

</script>

<style lang="scss" scoped>
.nav-link {
    color: var(--p-text-color);
    text-decoration: none;
    font-weight: 500;

    &:hover {
        color: var(--p-primary-color);
    }
}

.app-header {
    background-color: var(--p-surface-card);
    border-bottom: 1px solid var(--p-surface-border);
    height: 64px;
    padding: 0 1rem;
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;

    &__container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__logo-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        color: var(--p-text-color);
    }

    &__logo {
        height: 32px;
        width: auto;
    }

    &__title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--p-primary-color);
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    &__nav {
        display: flex;
        gap: 1.5rem;
        margin-right: 1rem;
    }
}

.desktop-only {
    @media (max-width: 768px) {
        display: none !important;
    }
}

.mobile-only {
    display: none !important;

    @media (max-width: 768px) {
        display: flex !important;
    }
}

.mobile-menu {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.75rem;
    }
}

.mobile-nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    color: var(--p-text-color);
    text-decoration: none;
    transition: background-color 0.2s;

    &:hover {
        background-color: var(--p-surface-hover);
    }

    i {
        font-size: 1.1rem;
        color: var(--p-text-muted-color);
    }
}

.mobile-admin-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &__title {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--p-text-muted-color);
        padding: 0.5rem 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
}

.mobile-user-button,
.mobile-login-button {
    width: 100%;
    justify-content: flex-start !important;
    margin-top: 0.5rem;
}

/* Fix PrimeVue Menu Dark Mode */
:global(.dark .p-menu) {
    background-color: var(--p-surface-card);
    border: 1px solid var(--p-surface-border);
    color: var(--p-text-color);

    .p-menuitem-link {
        color: var(--p-text-color);

        &:hover {
            background-color: var(--p-surface-hover);
        }
    }

    .p-menuitem-icon {
        color: var(--p-text-muted-color);
    }
}

/* Fix PrimeVue Drawer Dark Mode */
:global(.dark .p-drawer) {
    background-color: var(--p-surface-card);
    border-left: 1px solid var(--p-surface-border);
    color: var(--p-text-color);

    .p-drawer-header {
        border-bottom: 1px solid var(--p-surface-border);
    }
}
</style>
