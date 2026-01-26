<template>
    <header class="app-header">
        <div class="app-header__container">
            <NuxtLink :to="localePath('/')" class="app-header__logo-link">
                <img
                    src="/logo.png"
                    alt="Momei Logo"
                    class="app-header__logo"
                    width="32"
                    height="32"
                >
                <span class="app-header__title">{{ $t('components.header.title') }}</span>
            </NuxtLink>

            <div class="app-header__actions">
                <nav class="app-header__nav desktop-only">
                    <NuxtLink
                        id="nav-posts"
                        :to="localePath('/posts')"
                        class="nav-link"
                    >
                        {{ $t('pages.posts.title') }}
                    </NuxtLink>

                    <NuxtLink
                        id="nav-categories"
                        :to="localePath('/categories')"
                        class="nav-link"
                    >
                        {{ $t('common.category') }}
                    </NuxtLink>

                    <NuxtLink
                        id="nav-tags"
                        :to="localePath('/tags')"
                        class="nav-link"
                    >
                        {{ $t('common.tags') }}
                    </NuxtLink>

                    <NuxtLink
                        id="nav-archives"
                        :to="localePath('/archives')"
                        class="nav-link"
                    >
                        {{ $t('pages.archives.title') }}
                    </NuxtLink>
                </nav>

                <div class="app-header__action-group desktop-only">
                    <template v-if="user && isAdminOrAuthor(user.role)">
                        <Button
                            id="admin-menu-btn"
                            v-tooltip.bottom="$t('common.admin')"
                            icon="pi pi-cog"
                            text
                            rounded
                            aria-haspopup="true"
                            aria-controls="admin_menu"
                            :aria-label="$t('common.admin')"
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
                        id="search-btn"
                        v-tooltip.bottom="$t('components.search.ctrl_k')"
                        icon="pi pi-search"
                        text
                        rounded
                        :aria-label="$t('components.search.title')"
                        @click="openSearch"
                    />

                    <Button
                        id="theme-switcher"
                        v-tooltip.bottom="isDark ? $t('components.header.light_mode') : $t('components.header.dark_mode')"
                        :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
                        text
                        rounded
                        :aria-label="isDark ? $t('components.header.light_mode') : $t('components.header.dark_mode')"
                        @click="toggleDark()"
                    />

                    <div id="lang-switcher">
                        <language-switcher />
                    </div>

                    <div class="app-header__user-actions">
                        <template v-if="isSessionPending">
                            <Button
                                icon="pi pi-spinner pi-spin"
                                text
                                rounded
                                disabled
                            />
                        </template>
                        <template v-else>
                            <Button
                                v-if="!user"
                                id="login-btn"
                                v-tooltip.bottom="$t('pages.login.submit')"
                                icon="pi pi-sign-in"
                                text
                                rounded
                                :aria-label="$t('pages.login.submit')"
                                @click="navigateTo(localePath('/login'))"
                            />
                            <template v-else>
                                <Button
                                    id="user-menu-btn"
                                    v-tooltip.bottom="$t('pages.settings.title')"
                                    icon="pi pi-user"
                                    text
                                    rounded
                                    aria-haspopup="true"
                                    aria-controls="user_menu"
                                    @click="toggleUserMenu"
                                />
                                <Menu
                                    id="user_menu"
                                    ref="userMenu"
                                    :model="userMenuItems"
                                    :popup="true"
                                />
                            </template>
                        </template>
                    </div>
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
                <div
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false; openSearch()"
                >
                    <i class="pi pi-search" />
                    {{ $t('components.search.placeholder') }}
                </div>
                <NuxtLink
                    :to="localePath('/posts')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <i class="pi pi-file" />
                    {{ $t('pages.posts.title') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/categories')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <i class="pi pi-list" />
                    {{ $t('common.category') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/tags')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <i class="pi pi-tags" />
                    {{ $t('common.tags') }}
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
                    <language-switcher />
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
                    <div v-if="isAdminOrAuthor(user.role)" class="mobile-admin-section">
                        <div class="mobile-admin-section__title">
                            {{ $t('common.admin') }}
                        </div>
                        <div
                            v-for="item in adminMenuItems"
                            :key="item.label as string"
                            class="mobile-nav-link"
                            @click="isMobileMenuOpen = false; (item.command as Function)?.({} as any)"
                        >
                            <i :class="item.icon" />
                            {{ item.label }}
                        </div>
                    </div>
                    <Button
                        icon="pi pi-user"
                        :label="user.name"
                        text
                        rounded
                        class="mobile-user-button"
                        @click="isMobileMenuOpen = false; navigateTo(localePath('/settings'))"
                    />
                    <Button
                        icon="pi pi-sign-out"
                        :label="$t('pages.login.logout')"
                        text
                        rounded
                        class="mobile-user-button"
                        @click="isMobileMenuOpen = false; handleLogout()"
                    />
                </template>
                <Button
                    v-else
                    :label="isSessionPending ? $t('components.search.loading') : $t('pages.login.submit')"
                    :icon="isSessionPending ? 'pi pi-spinner pi-spin' : 'pi pi-sign-in'"
                    rounded
                    :disabled="isSessionPending"
                    class="mobile-login-button"
                    @click="isMobileMenuOpen = false; navigateTo(localePath('/login'))"
                />
            </div>
        </Drawer>
    </header>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { MenuItem } from 'primevue/menuitem'
import { authClient } from '@/lib/auth-client'
import { isAdminOrAuthor, isAdmin } from '@/utils/shared/roles'

const { t } = useI18n()
const { openSearch } = useSearch()
const session = authClient.useSession()
const user = computed(() => session.value?.data?.user)
const isSessionPending = computed(() => session.value?.isPending)
const localePath = useLocalePath()

const isMobileMenuOpen = ref(false)

const adminMenu = ref()
const adminMenuItems = computed(() => {
    const items: MenuItem[] = [
        {
            label: t('pages.admin.posts.title'),
            icon: 'pi pi-file',
            command: () => navigateTo(localePath('/admin/posts')),
        },
        {
            label: t('pages.admin.snippets.title'),
            icon: 'pi pi-bolt',
            command: () => navigateTo(localePath('/admin/snippets')),
        },
        {
            label: t('pages.admin.categories.title'),
            icon: 'pi pi-folder',
            command: () => navigateTo(localePath('/admin/categories')),
        },
        {
            label: t('pages.admin.comments.title'),
            icon: 'pi pi-comments',
            command: () => navigateTo(localePath('/admin/comments')),
        },
        {
            label: t('pages.admin.tags.title'),
            icon: 'pi pi-tags',
            command: () => navigateTo(localePath('/admin/tags')),
        },
    ]

    if (isAdmin(user.value?.role)) {
        items.push(
            {
                label: t('pages.admin.users.title'),
                icon: 'pi pi-users',
                command: () => navigateTo(localePath('/admin/users')),
            },
            {
                label: t('pages.admin.subscribers.title'),
                icon: 'pi pi-envelope',
                command: () => navigateTo(localePath('/admin/subscribers')),
            },
            {
                label: t('common.settings'),
                icon: 'pi pi-cog',
                items: [
                    {
                        label: t('pages.admin.settings.theme.title'),
                        icon: 'pi pi-palette',
                        command: () => navigateTo(localePath('/admin/settings/theme')),
                    },
                ],
            },
        )
    }

    return items
})

const userMenu = ref()
const handleLogout = async () => {
    await authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                navigateTo(localePath('/login'))
            },
        },
    })
}

const userMenuItems = computed(() => [
    {
        label: t('pages.settings.title'),
        icon: 'pi pi-user',
        command: () => navigateTo(localePath('/settings')),
    },
    {
        label: t('pages.login.logout'),
        icon: 'pi pi-sign-out',
        command: handleLogout,
    },
])

const toggleAdminMenu = (event: any) => {
    adminMenu.value.toggle(event)
}

const toggleUserMenu = (event: any) => {
    userMenu.value.toggle(event)
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

    &__action-group {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
}

.desktop-only {
    @media (width <= 768px) {
        display: none;
    }
}

.mobile-only {
    display: none;

    @media (width <= 768px) {
        display: flex;
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
    &.p-button {
        width: 100%;
        justify-content: flex-start;
        margin-top: 0.5rem;
    }
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
