import { ref } from 'vue'

export function useDeleteDialogState<T>() {
    const visible = ref(false)
    const item = ref<T | null>(null)

    const openDeleteDialog = (nextItem: T) => {
        item.value = nextItem
        visible.value = true
    }

    const closeDeleteDialog = () => {
        visible.value = false
    }

    const resetDeleteDialog = () => {
        item.value = null
        closeDeleteDialog()
    }

    return {
        visible,
        item,
        openDeleteDialog,
        closeDeleteDialog,
        resetDeleteDialog,
    }
}
