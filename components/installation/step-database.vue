<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.database.title') }}</h2>
        <p>{{ $t('installation.database.description') }}</p>

        <CaomeiMessage v-if="dbInitError" tone="danger">
            {{ dbInitError }}
        </CaomeiMessage>
        <CaomeiMessage v-else-if="dbInitSuccess" tone="success">
            {{ $t('installation.database.success') }}
        </CaomeiMessage>

        <div class="installation-wizard__actions">
            <CaomeiButton
                variant="secondary"
                :label="$t('common.prev')"
                @click="onPrev"
            >
                <template #icon>
                    <ArrowLeft :size="16" />
                </template>
                {{ $t('common.prev') }}
            </CaomeiButton>
            <CaomeiButton
                :label="dbInitSuccess ? $t('common.next') : $t('installation.database.initialize')"
                :loading="dbInitLoading"
                @click="onNext"
            >
                <template #icon>
                    <ArrowRight :size="16" />
                </template>
                {{ dbInitSuccess ? $t('common.next') : $t('installation.database.initialize') }}
            </CaomeiButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@lucide/vue'

defineProps<{
    dbInitLoading: boolean
    dbInitSuccess: boolean
    dbInitError: string
}>()

const emit = defineEmits(['prev', 'next'])
const onPrev = () => emit('prev')
const onNext = () => emit('next')
</script>
