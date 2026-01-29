<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.database.title') }}</h2>
        <p>{{ $t('installation.database.description') }}</p>

        <Message v-if="dbInitError" severity="error">
            {{ dbInitError }}
        </Message>
        <Message v-else-if="dbInitSuccess" severity="success">
            {{ $t('installation.database.success') }}
        </Message>

        <div class="installation-wizard__actions">
            <Button
                :label="$t('common.prev')"
                severity="secondary"
                icon="pi pi-arrow-left"
                @click="onPrev"
            />
            <Button
                :label="dbInitSuccess ? $t('common.next') : $t('installation.database.initialize')"
                icon="pi pi-arrow-right"
                icon-pos="right"
                :loading="dbInitLoading"
                @click="onNext"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'

defineProps<{
    dbInitLoading: boolean
    dbInitSuccess: boolean
    dbInitError: string
}>()

const emit = defineEmits(['prev', 'next'])
const onPrev = () => emit('prev')
const onNext = () => emit('next')
</script>
