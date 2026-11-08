<template>
    <div class="installation-layout">
        <div class="installation-layout__container">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
// 安装向导专用布局
// 不包含常规导航栏和页脚
</script>

<style scoped lang="scss">
.installation-layout {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--m-primary-50) 0%, var(--m-primary-100) 100%);
    padding: 2rem;

    &__container {
        width: 100%;
        max-width: 800px;
    }
}

// 暗色模式适配
:global(.dark) .installation-layout {
    background: linear-gradient(135deg, var(--m-surface-900) 0%, var(--m-surface-800) 100%);
}
</style>
