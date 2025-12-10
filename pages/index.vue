<template>
    <div>
        {{ data?.message }}
        <!-- <pre>{{ data }}</pre> -->
        <NuxtWelcome />
    </div>
</template>

<script lang="ts" setup>
const { data } = await useFetch('/api/test')

</script>
