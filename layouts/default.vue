<template>
    <div class="layout-default">
        <AppHeader />
        <main class="layout-default__main">
            <slot />
        </main>
        <AppFooter />
    </div>
</template>

<style lang="scss" scoped>
.layout-default {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--p-surface-50);

    &__main {
        flex: 1;
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
    }
}
</style>
