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
                        <i class="app-header__admin-link-icon pi pi-file" />
                    </NuxtLink>
                </nav>

                <div class="app-header__action-group desktop-only">
                    <ClientOnly>
                        <AppNotifications v-if="user" />

                        <template v-if="showAdminControls">
                            <Button
                                id="admin-posts-shortcut"
                                v-tooltip.bottom="$t('pages.admin.posts.title')"
                                icon="pi pi-file"
                                text
                                rounded
                                class="app-header__compact-admin-posts"
                                :aria-label="$t('pages.admin.posts.title')"
                                @click="goToAdminPosts"
                            />
                            <CaomeiDropdownMenu>
                                <CaomeiDropdownMenuTrigger as-child>
                                    <Button
                                        id="admin-menu-btn"
                                        v-tooltip.bottom="$t('common.admin')"
                                        icon="pi pi-cog"
                                        text
                                        rounded
                                        :aria-label="$t('common.admin')"
                                    />
                                </CaomeiDropdownMenuTrigger>
                                <CaomeiDropdownMenuContent
                                    id="admin_menu"
                                    :model="adminMenuModel"
                                />
                            </CaomeiDropdownMenu>
                        </template>
                    </ClientOnly>

                    <ClientOnly>
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
                        <template #fallback>
                            <Button
                                icon="pi pi-search"
                                text
                                rounded
                                disabled
                            />
                            <Button
                                icon="pi pi-moon"
                                text
                                rounded
                                disabled
                            />
                        </template>
                    </ClientOnly>

                    <div id="lang-switcher">
                        <language-switcher />
                    </div>

                    <div class="app-header__user-actions">
                        <ClientOnly>
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
                                    <CaomeiDropdownMenu>
                                        <CaomeiDropdownMenuTrigger as-child>
                                            <Button
                                                id="user-menu-btn"
                                                v-tooltip.bottom="$t('pages.settings.title')"
                                                icon="pi pi-user"
                                                text
                                                rounded
                                            />
                                        </CaomeiDropdownMenuTrigger>
                                        <CaomeiDropdownMenuContent
                                            id="user_menu"
                                            :model="userMenuModel"
                                        />
                                    </CaomeiDropdownMenu>
                                </template>
                            </template>

                            <template #fallback>
                                <div class="p-button p-button-icon-only p-button-rounded p-button-text p-component">
                                    <i class="pi pi-spin pi-spinner" />
                                </div>
                            </template>
                        </ClientOnly>
                    </div>
                </div>

                <Button
                    v-if="showAdminControls"
                    id="mobile-admin-posts-btn"
                    v-tooltip.bottom="$t('pages.admin.posts.title')"
                    icon="pi pi-file"
                    text
                    rounded
                    class="mobile-only"
                    :aria-label="$t('pages.admin.posts.title')"
                    @click="goToAdminPosts"
                />
                <Button
                    id="mobile-menu-btn"
                    icon="pi pi-bars"
                    text
                    rounded
                    class="mobile-only"
                    @click="isMobileMenuOpen = true"
                />
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
                    <i class="pi pi-search" />
                    {{ $t('components.search.placeholder') }}
                </div>
                <NuxtLink
                    :to="localePath('/')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <i class="pi pi-home" />
                    {{ $t('common.home') }}
                </NuxtLink>
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
                <NuxtLink
                    :to="localePath('/submit')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <i class="pi pi-send" />
                    {{ $t('pages.submit.title') }}
                </NuxtLink>
                <NuxtLink
                    id="mobile-nav-friend-link-application"
                    :to="localePath('/friend-links')"
                    class="mobile-nav-link"
                    @click="isMobileMenuOpen = false"
                >
                    <i class="pi pi-link" />
                    {{ $t('common.friend_link_application') }}
                </NuxtLink>

                <TravellingsLink placement="mobile" />

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
        </CaomeiDrawer>
    </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, defineComponent, h, type Component } from 'vue'
import { ensureLocaleMessageModules } from '@/i18n/config/locale-runtime-loader'
import { invalidateAuthSessionState, refreshAuthSession } from '@/composables/use-auth-session'
import { authClient } from '@/lib/auth-client'
import { isAdminOrAuthor, isAdmin } from '@/utils/shared/roles'
import { useAdminMenuItems } from '@/composables/use-admin-menu-items'

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

/**
 * `CaomeiDropdownMenu` 的数据驱动条目只接受**组件**图标，不接受 PrimeVue 的 `pi pi-*` 类名。
 * 浮层批次不承担图标全量迁移（第七十一阶段），故把类名包成一个最小渲染组件，
 * 保留原图标外观；图标全量替换时删除本适配即可。
 */
const primeIconComponentCache = new Map<string, Component>()

function resolvePrimeIcon(icon: string): Component {
    const cached = primeIconComponentCache.get(icon)
    if (cached) {
        return cached
    }

    const component = defineComponent({
        name: 'PrimeMenuIcon',
        inheritAttrs: false,
        setup(_, { attrs }) {
            return () => h('i', { ...attrs, class: [icon, attrs.class] })
        },
    })

    primeIconComponentCache.set(icon, component)

    return component
}

interface MenuModelItem {
    label?: string
    icon?: string
    command?: () => void
    items?: MenuModelItem[]
}

function toDropdownModel(items: readonly MenuModelItem[]): Record<string, unknown>[] {
    return items.map((item) => ({
        ...item,
        icon: item.icon ? resolvePrimeIcon(item.icon) : undefined,
        items: item.items ? toDropdownModel(item.items) : undefined,
    }))
}

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
        icon: 'pi pi-user',
        command: () => navigateTo(localePath('/settings')),
    },
    {
        label: t('pages.login.logout'),
        icon: 'pi pi-sign-out',
        command: handleLogout,
    },
])

const adminMenuModel = computed(() => toDropdownModel(adminMenuItems.value))
const userMenuModel = computed(() => toDropdownModel(userMenuItems.value))

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
    background-color: var(--p-surface-card);
    border-bottom: 1px solid var(--p-surface-border);
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
        font-size: 0.95rem;
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
    color: var(--p-text-color);
    text-decoration: none;
    transition: background-color $transition-fast;

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
    gap: $spacing-xs;

    &__title {
        font-size: 0.75rem; font-weight: 700; color: var(--p-text-muted-color);
        padding: $spacing-sm 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
    }
}

.mobile-user-button,
.mobile-login-button {
    &.p-button {
        width: 100%;
        justify-content: flex-start;
        margin-top: $spacing-sm;
    }
}

</style>
