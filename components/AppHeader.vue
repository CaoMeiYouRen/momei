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
                <NuxtLink :to="localePath('/posts')" class="nav-link">
                    {{ $t('pages.posts.title') }}
                </NuxtLink>

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
        </div>
    </header>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { authClient } from '@/lib/auth-client'

const { t } = useI18n()
const session = authClient.useSession()
const user = computed(() => session.value?.data?.user)
const localePath = useLocalePath()

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
}

// Fix PrimeVue Menu Dark Mode
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
</style>
