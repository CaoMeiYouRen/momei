<template>
    <component :is="MavonEditorComponent" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import 'mavon-editor/dist/css/index.css'

const MavonEditorComponent = defineAsyncComponent(async () => {
    const mod = await import('mavon-editor')
    return mod.default
})
</script>
