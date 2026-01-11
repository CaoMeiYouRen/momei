<template>
    <Dialog
        v-model:visible="visible"
        modal
        :header="title || $t('common.confirm_delete')"
        :style="{width: '25rem'}"
    >
        <div class="delete-dialog-content">
            <i class="delete-dialog-icon pi pi-exclamation-triangle" />
            <span>{{ message || $t('common.delete_confirm_message') }}</span>
        </div>
        <template #footer>
            <Button
                :label="$t('common.cancel')"
                text
                severity="secondary"
                @click="visible = false"
            />
            <Button
                :label="$t('common.delete')"
                severity="danger"
                :loading="loading"
                @click="handleConfirm"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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
    color: var(--p-orange-500);
}
</style>
