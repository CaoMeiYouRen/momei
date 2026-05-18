interface UseAdminFormDialogOptions<TItem, TForm extends object> {
    formData: TForm
    createEmptyForm: () => TForm
    assignItemToForm: (item: TItem, formData: TForm) => void
}

export function useAdminFormDialog<TItem, TForm extends object>(options: UseAdminFormDialogOptions<TItem, TForm>) {
    const dialogVisible = ref(false)
    const editingItem = ref<TItem | null>(null)
    const errors = reactive<Record<string, string>>({})

    const resetErrors = () => {
        Object.keys(errors).forEach((key) => {
            Reflect.deleteProperty(errors, key)
        })
    }

    const resetForm = () => {
        Object.assign(options.formData, options.createEmptyForm())
    }

    const openDialog = (item?: TItem | null) => {
        editingItem.value = item ?? null
        resetErrors()

        if (item) {
            options.assignItemToForm(item, options.formData)
        } else {
            resetForm()
        }

        dialogVisible.value = true
    }

    const closeDialog = () => {
        dialogVisible.value = false
    }

    return {
        dialogVisible,
        editingItem,
        errors,
        resetErrors,
        resetForm,
        openDialog,
        closeDialog,
    }
}
