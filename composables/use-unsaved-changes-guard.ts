import { useConfirm } from 'primevue/useconfirm'
import { onBeforeUnmount, onMounted, toValue, type MaybeRefOrGetter } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

interface UseUnsavedChangesGuardOptions {
    isDirty: MaybeRefOrGetter<boolean>
    message: MaybeRefOrGetter<string>
    enabled?: MaybeRefOrGetter<boolean>
}

export function useUnsavedChangesGuard(options: UseUnsavedChangesGuardOptions) {
    const confirm = useConfirm()

    const isGuardActive = () => {
        const enabled = options.enabled === undefined || options.enabled === null
            ? true
            : toValue(options.enabled)

        return enabled && toValue(options.isDirty)
    }

    const confirmIfDirty = async () => {
        if (!import.meta.client || !isGuardActive()) {
            return true
        }

        return await new Promise<boolean>((resolve) => {
            confirm.require({
                message: toValue(options.message),
                icon: 'pi pi-exclamation-triangle',
                accept: () => resolve(true),
                reject: () => resolve(false),
            })
        })
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (!isGuardActive()) {
            return
        }

        event.preventDefault()
    }

    onMounted(() => {
        if (!import.meta.client) {
            return
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
    })

    onBeforeUnmount(() => {
        if (!import.meta.client) {
            return
        }

        window.removeEventListener('beforeunload', handleBeforeUnload)
    })

    onBeforeRouteLeave(async () => await confirmIfDirty())

    return {
        confirmIfDirty,
    }
}
