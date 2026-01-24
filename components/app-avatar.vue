<template>
    <Avatar
        v-bind="$attrs"
        :image="displayImage"
        :label="!displayImage ? name?.charAt(0)?.toUpperCase() : undefined"
    />
</template>

<script setup lang="ts">
/**
 * 统一头像组件
 * 封装了 Gravatar 哈希计算逻辑
 */
const props = defineProps<{
    image?: string | null
    email?: string | null
    name?: string | null
}>()

const { avatarUrl: gravatarUrl } = useAvatar(() => props.email, () => props.name)

const displayImage = computed(() => props.image || gravatarUrl.value)
</script>
