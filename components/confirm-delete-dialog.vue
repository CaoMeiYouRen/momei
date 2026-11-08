<template>
    <CaomeiDialog
        :close-on-overlay="false"
        :open="visible"
        :title="title || $t('common.confirm_delete')"
        :style="{width: '25rem'}"
        modal
        @update:open="visible = $event"
    >
        <div class="delete-dialog-content">
            <AlertTriangle class="delete-dialog-icon" :size="32" />
            <span>{{ message || $t('common.delete_confirm_message') }}</span>
        </div>
        <template #footer>
            <CaomeiButton
                variant="ghost"
                @click="visible = false"
            >
                {{ $t('common.cancel') }}
            </CaomeiButton>
            <CaomeiButton
                tone="danger"
                :loading="loading"
                @click="handleConfirm"
            >
                {{ $t('common.delete') }}
            </CaomeiButton>
        </template>
    </CaomeiDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AlertTriangle } from '@lucide/vue'

const props = defineProps<{
    title?: string
    message?: string
}>()

const emit = defineEmits<{
    (e: 'confirm'): void
}>()

const visible = defineModel<boolean>('visible', { default: false })
const loading = ref(false)

const open = () => {
    visible.value = true
}

const close = () => {
    visible.value = false
    loading.value = false
}

const setLoading = (value: boolean) => {
    loading.value = value
}

const handleConfirm = () => {
    emit('confirm')
}

defineExpose({
    open,
    close,
    setLoading,
})
</script>

<style lang="scss" scoped>
.delete-dialog-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-top: 1rem;
}

.delete-dialog-icon {
    font-size: 2rem;
    color: var(--m-orange-500);
}
</style>
