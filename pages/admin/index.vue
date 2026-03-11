<script setup lang="ts">
definePageMeta({
    middleware: 'admin',
})

const localePath = useLocalePath()

await navigateTo(localePath({
    path: '/admin/settings',
    query: {
        tab: 'general',
    },
}), { replace: true })
</script>
