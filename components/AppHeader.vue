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
                <Button
                    :icon="isDark ? 'pi pi-moon' : 'pi pi-sun'"
                    text
                    rounded
                    @click="toggleDark"
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
import { ref, onMounted } from 'vue'
import { authClient } from '@/lib/auth-client'

const session = authClient.useSession()
const user = computed(() => session.value?.data?.user)
const localePath = useLocalePath()

const isDark = ref(false)

const toggleDark = () => {
    isDark.value = !isDark.value
    if (isDark.value) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        isDark.value = true
        document.documentElement.classList.add('dark')
    }
})
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
    background-color: var(--p-surface-0);
    border-bottom: 1px solid var(--p-surface-200);
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
</style>
