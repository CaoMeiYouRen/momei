<template>
    <header class="app-header">
        <div class="app-header__container">
            <AppLogo />

            <div class="app-header__actions">
                <nav class="app-header__nav desktop-only">
                    <NuxtLink
                        id="nav-home"
                        :to="localePath('/')"
                        class="nav-link"
                    >
                        {{ $t('common.home') }}
                    </NuxtLink>

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

                    <NuxtLink
                        id="nav-submit"
                        :to="localePath('/submit')"
                        class="nav-link"
                    >
                        {{ $t('pages.submit.title') }}
                    </NuxtLink>

                    <NuxtLink
                        id="nav-friend-link-application"
                        :to="localePath('/friend-links')"
                        class="nav-link"
                    >
                        {{ $t('common.friend_link_application') }}
                    </NuxtLink>

                    <TravellingsLink placement="header" class="nav-link" />

                    <NuxtLink
                        v-if="showAdminControls"
                        id="desktop-admin-posts-link"
                        :to="localePath('/admin/posts')"
                        class="app-header__admin-link nav-link"
                    >
                        <span>{{ $t('pages.admin.posts.title') }}</span>
                        <FileText class="app-header__admin-link-icon" :size="15" />
                    </NuxtLink>
                </nav>

                <div class="app-header__action-group desktop-only">
                    <ClientOnly>
                        <AppNotifications v-if="user" />

                        <template v-if="showAdminControls">
                            <AppTooltip :content="$t('pages.admin.posts.title')" side="bottom">
                                <CaomeiButton
                                    id="admin-posts-shortcut"
                                    variant="ghost"
                                    rounded
                                    icon-only
                                    class="app-header__compact-admin-posts"
                                    :label="$t('pages.admin.posts.title')"
                                    @click="goToAdminPosts"
                                >
                                    <template #icon>
                                        <FileText :size="16" />
                                    </template>
                                </CaomeiButton>
                            </AppTooltip>
                            <CaomeiDropdownMenu>
                                <CaomeiDropdownMenuTrigger as-child>
                                    <AppTooltip :content="$t('common.admin')" side="bottom">
                                        <CaomeiButton
                                            id="admin-menu-btn"
                                            variant="ghost"
                                            rounded
                                            icon-only
                                            :label="$t('common.admin')"
                                        >
                                            <template #icon>
                                                <Settings :size="16" />
                                            </template>
                                        </CaomeiButton>
                                    </AppTooltip>
                                </CaomeiDropdownMenuTrigger>
                                <CaomeiDropdownMenuContent
                                    id="admin_menu"
                                    :model="adminMenuModel"
                                />
                            </CaomeiDropdownMenu>
                        </template>
                    </ClientOnly>

                    <ClientOnly>
                        <AppTooltip :content="$t('components.search.ctrl_k')" side="bottom">
                            <CaomeiButton
                                id="search-btn"
                                variant="ghost"
                                rounded
                                icon-only
                                :label="$t('components.search.title')"
                                @click="openSearch"
                            >
                                <template #icon>
                                    <Search :size="16" />
                                </template>
                            </CaomeiButton>
                        </AppTooltip>

                        <AppTooltip :content="isDark ? $t('components.header.light_mode') : $t('components.header.dark_mode')" side="bottom">
                            <CaomeiButton
                                id="theme-switcher"
                                variant="ghost"
                                rounded
                                icon-only
                                :label="isDark ? $t('components.header.light_mode') : $t('components.header.dark_mode')"
                                @click="toggleDark()"
                            >
                                <template #icon>
                                    <Sun v-if="isDark" :size="16" />
                                    <Moon v-else :size="16" />
                                </template>
                            </CaomeiButton>
                        </AppTooltip>
                        <template #fallback>
                            <CaomeiButton
                                variant="ghost"
                                rounded
                                icon-only
                                disabled
                                :label="$t('components.search.title')"
                            >
                                <template #icon>
                                    <Search :size="16" />
                                </template>
                            </CaomeiButton>
                            <CaomeiButton
                                variant="ghost"
                                rounded
                                icon-only
                                disabled
                                :label="$t('components.header.dark_mode')"
                            >
                                <template #icon>
                                    <Moon :size="16" />
                                </template>
                            </CaomeiButton>
                        </template>
                    </ClientOnly>

                    <div id="lang-switcher">
                        <language-switcher />
                    </div>

                    <div class="app-header__user-actions">
                        <ClientOnly>
                            <template v-if="isSessionPending">
                                <CaomeiButton
                                    variant="ghost"
                                    rounded
                                    icon-only
                                    loading
                                    :label="$t('components.search.loading')"
                                />
                            </template>
                            <template v-else>
                                <AppTooltip
                                    v-if="!user"
                                    :content="$t('pages.login.submit')"
                                    side="bottom"
                                >
                                    <CaomeiButton
                                        id="login-btn"
                                        variant="ghost"
                                        rounded
                                        icon-only
                                        :label="$t('pages.login.submit')"
                                        @click="navigateTo(localePath('/login'))"
                                    >
                                        <template #icon>
                                            <LogIn :size="16" />
                                        </template>
                                    </CaomeiButton>
                                </AppTooltip>
                                <template v-else>
                                    <CaomeiDropdownMenu>
                                        <CaomeiDropdownMenuTrigger as-child>
                                            <AppTooltip :content="$t('pages.settings.title')" side="bottom">
                                                <CaomeiButton
                                                    id="user-menu-btn"
                                                    variant="ghost"
                                                    rounded
                                                    icon-only
                                                    :label="$t('pages.settings.title')"
                                                >
                                                    <template #icon>
                                                        <User :size="16" />
                                                    </template>
                                                </CaomeiButton>
                                            </AppTooltip>
                                        </CaomeiDropdownMenuTrigger>
                                        <CaomeiDropdownMenuContent
                                            id="user_menu"
                                            :model="userMenuModel"
                                        />
                                    </CaomeiDropdownMenu>
                                </template>
                            </template>

                            <template #fallback>
                                <CaomeiButton
                                    variant="ghost"
                                    rounded
                                    icon-only
                                    disabled
                                    :label="$t('components.search.loading')"
                                >
                                    <template #icon>
                                        <LoaderCircle :size="16" />
                                    </template>
                                </CaomeiButton>
                            </template>
                        </ClientOnly>
                    </div>
                </div>

                <AppTooltip
                    v-if="showAdminControls"
                    :content="$t('pages.admin.posts.title')"
                    side="bottom"
                >
                    <CaomeiButton
                        id="mobile-admin-posts-btn"
                        variant="ghost"
                        rounded
                        icon-only
                        class="mobile-only"
                        :label="$t('pages.admin.posts.title')"
                        @click="goToAdminPosts"
                    >
                        <template #icon>
                            <FileText :size="18" />
                        </template>
                    </CaomeiButton>
                </AppTooltip>
                <CaomeiButton
                    id="mobile-menu-btn"
                    variant="ghost"
                    rounded
                    icon-only
                    class="mobile-only"
                    :label="$t('components.header.title')"
                    @click="isMobileMenuOpen = true"
                >
                    <template #icon>
                        <MenuIcon :size="18" />
                    </template>
                </CaomeiButton>
            </div>
        </div>

        <CaomeiDrawer
            :open="isMobileMenuOpen"
            position="right"
            size="sm"
            :title="$t('components.header.title')"
            class="mobile-drawer"
            @update:open="isMobileMenuOpen = $event"
        >
            <div class="mobile-menu">
                <div
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false; openSearch()"
                >
                    <Search :size="18" />
                    {{ $t('components.search.placeholder') }}
                </div>
                <NuxtLink
                    :to="localePath('/')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <Home :size="18" />
                    {{ $t('common.home') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/posts')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <FileText :size="18" />
                    {{ $t('pages.posts.title') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/categories')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <List :size="18" />
                    {{ $t('common.category') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/tags')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <Tags :size="18" />
                    {{ $t('common.tags') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/archives')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <CalendarIcon :size="18" />
                    {{ $t('pages.archives.title') }}
                </NuxtLink>
                <NuxtLink
                    :to="localePath('/submit')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <Send :size="18" />
                    {{ $t('pages.submit.title') }}
                </NuxtLink>
                <NuxtLink
                    id="mobile-nav-friend-link-application"
                    :to="localePath('/friend-links')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <Link :size="18" />
                    {{ $t('common.friend_link_application') }}
                </NuxtLink>

                <TravellingsLink placement="mobile" />

                <CaomeiDivider />

                <div class="mobile-menu__item">
                    <span>{{ $t('components.header.language') }}</span>
                    <language-switcher />
                </div>

                <div class="mobile-menu__item">
                    <span>{{ isDark ? $t('components.header.dark_mode') : $t('components.header.light_mode') }}</span>
                    <CaomeiButton
                        variant="ghost"
                        rounded
                        icon-only
                        :label="isDark ? $t('components.header.dark_mode') : $t('components.header.light_mode')"
                        @click="toggleDark()"
                    >
                        <template #icon>
                            <Sun v-if="isDark" :size="16" />
                            <Moon v-else :size="16" />
                        </template>
                    </CaomeiButton>
                </div>

                <CaomeiDivider />

                <template v-if="user">
                    <div v-if="showAdminControls" class="mobile-admin-section">
                        <div class="mobile-admin-section__title">
                            {{ $t('common.admin') }}
                        </div>
                        <div
                            v-for="item in adminMenuItems"
                            :key="item.label as string"
                            class="mobile-nav-link"
                            @click="isMobileMenuOpen = false; (item.command as Function)?.({} as any)"
                        >
                            <component :is="item.icon" :size="18" />
                            {{ item.label }}
                        </div>
                    </div>
                    <CaomeiButton
                        variant="ghost"
                        rounded
                        class="mobile-user-button"
                        @click="isMobileMenuOpen = false; navigateTo(localePath('/settings'))"
                    >
                        <template #icon>
                            <User :size="16" />
                        </template>
                        {{ user.name }}
                    </CaomeiButton>
                    <CaomeiButton
                        variant="ghost"
                        rounded
                        class="mobile-user-button"
                        @click="isMobileMenuOpen = false; handleLogout()"
                    >
                        <template #icon>
                            <LogOut :size="16" />
                        </template>
                        {{ $t('pages.login.logout') }}
                    </CaomeiButton>
                </template>
                <CaomeiButton
                    v-else
                    variant="primary"
                    rounded
                    :loading="isSessionPending"
                    :disabled="isSessionPending"
                    class="mobile-login-button"
                    @click="isMobileMenuOpen = false; navigateTo(localePath('/login'))"
                >
                    <template #icon>
                        <LogIn :size="16" />
                    </template>
                    {{ isSessionPending ? $t('components.search.loading') : $t('pages.login.submit') }}
                </CaomeiButton>
            </div>
        </CaomeiDrawer>
    </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { ensureLocaleMessageModules } from '@/i18n/config/locale-runtime-loader'
import { invalidateAuthSessionState, refreshAuthSession } from '@/composables/use-auth-session'
import { authClient } from '@/lib/auth-client'
import { isAdminOrAuthor, isAdmin } from '@/utils/shared/roles'
import { useAdminMenuItems } from '@/composables/use-admin-menu-items'
import { rawIcon } from '@/utils/shared/brand-icons'
import {
    Calendar as CalendarIcon,
    FileText,
    Home,
    Link,
    List,
    LoaderCircle,
    LogIn,
    LogOut,
    Menu as MenuIcon,
    Moon,
    Search,
    Send,
    Settings,
    Sun,
    Tags,
    User,
} from '@lucide/vue'

const { t, locale } = useI18n()
const { openSearch } = useSearch()
const { siteLogo, currentTitle } = useMomeiConfig()
const session = authClient.useSession()
const user = computed(() => session.value?.data?.user)
const isSessionPending = computed(() => session.value?.isPending)
const localePath = useLocalePath()
const nuxtApp = useNuxtApp()

const isMobileMenuOpen = ref(false)
const adminLocaleReady = ref(false)

const showAdminControls = computed(() => Boolean(
    user.value
    && isAdminOrAuthor(user.value.role)
    && adminLocaleReady.value,
))

const { adminMenuItems, goToAdminPosts } = useAdminMenuItems({
    t,
    localePath,
    userRole: computed(() => user.value?.role ?? null),
    isAdmin,
})

const handleLogout = async () => {
    invalidateAuthSessionState()

    try {
        const result = await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    navigateTo(localePath('/login'))
                },
            },
        })

        if (result?.error) {
            await refreshAuthSession()
        }
    } catch {
        await refreshAuthSession()
    }
}

const userMenuItems = computed(() => [
    {
        label: t('pages.settings.title'),
        icon: rawIcon(User),
        command: () => navigateTo(localePath('/settings')),
    },
    {
        label: t('pages.login.logout'),
        icon: rawIcon(LogOut),
        command: handleLogout,
    },
])

/**
 * `CaomeiDropdownMenu` 的数据驱动条目只接受**组件**图标。
 * 管理端与用户菜单条目均由 composable / computed 直接返回组件，无需再做类名适配。
 */
const adminMenuModel = computed(() => adminMenuItems.value)
const userMenuModel = computed(() => userMenuItems.value)

const handleSearchShortcut = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openSearch()
    }
}

const isDark = useThemeMode()
const toggleDark = useToggle(isDark)

onMounted(() => {
    if (!import.meta.client) {
        return
    }

    window.addEventListener('keydown', handleSearchShortcut)
})

onBeforeUnmount(() => {
    if (!import.meta.client) {
        return
    }

    window.removeEventListener('keydown', handleSearchShortcut)
})

watch(
    () => ({
        locale: locale.value,
        role: user.value?.role ?? null,
    }),
    async ({ locale: currentLocale, role }) => {
        const needsAdminMessages = Boolean(role && isAdminOrAuthor(role))
        adminLocaleReady.value = !needsAdminMessages

        if (!needsAdminMessages) {
            return
        }

        await ensureLocaleMessageModules({
            i18n: nuxtApp.$i18n as object,
            locale: currentLocale,
            modules: ['admin'],
        })

        adminLocaleReady.value = true
    },
    { immediate: true },
)

</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.nav-link {
    @include nav-link;

    white-space: nowrap;
}

.app-header {
    background-color: var(--caomei-color-bg);
    height: 64px;
    position: sticky;
    top: 0;
    z-index: $z-index-header;
    display: flex;
    align-items: center;

    &__container {
        @include page-container(1440px);

        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: $spacing-md;

        @media (width >= 768px) and (width < 1024px) {
            padding-left: $spacing-md;
            padding-right: $spacing-md;
        }
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: $spacing-md;
        flex: 1;
        justify-content: flex-end;
        min-width: 0;
    }

    &__nav {
        display: flex;
        align-items: center;
        gap: $spacing-md;
        margin-right: $spacing-md;
        min-width: 0;

        > * {
            flex-shrink: 0;
        }

        @media (width >= 1024px) and (width < 1360px) {
            gap: $spacing-sm;
            margin-right: $spacing-sm;
            font-size: 0.95rem;
        }
    }

    &__action-group {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        flex-shrink: 0;
    }

    &__admin-link {
        display: none;
        align-items: center;
        gap: $spacing-xs;
        white-space: nowrap;

        @media (width >= 1440px) {
            display: inline-flex;
        }
    }

    &__admin-link-icon {
        flex-shrink: 0;
    }

    &__compact-admin-posts {
        @media (width >= 1440px) {
            display: none;
        }
    }
}

.desktop-only {
    @include respond-to("md") {
        // Shown
    }

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
    gap: $spacing-sm;

    &__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: $spacing-sm 0.75rem;
    }
}

.mobile-nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: $border-radius-md;
    color: var(--caomei-color-text);
    text-decoration: none;
    transition: background-color $transition-fast;

    &:hover {
    }

    i,
    svg {
        color: var(--caomei-color-text-muted);
    }
}

.mobile-admin-section {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    &__title {
        font-size: 0.75rem; font-weight: 700; color: var(--caomei-color-text-muted);
        padding: $spacing-sm 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
    }
}

.mobile-user-button,
.mobile-login-button {
    &.caomei-button {
        width: 100%;
        justify-content: flex-start;
        margin-top: $spacing-sm;
    }
}

</style>
