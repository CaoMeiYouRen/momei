<template>
    <div>Redirecting...</div>
</template>

<script setup lang="ts">
definePageMeta({
    middleware: [
        function (to, from) {
            return navigateTo('/posts')
        },
    ],
})
</script>
