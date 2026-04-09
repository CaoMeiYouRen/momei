import { computed, ref, type Ref } from 'vue'
import { buildComparablePostEditorState } from './use-post-editor-page.helpers'
import type { PostEditorData } from '@/types/post-editor'
import { stableSerialize } from '@/utils/shared/stable-serialize'
import { useUnsavedChangesGuard } from '@/composables/use-unsaved-changes-guard'

interface UsePostEditorDirtyStateOptions {
    post: Ref<PostEditorData>
    saving: Ref<boolean>
    leaveMessage: Ref<string>
}

export function usePostEditorDirtyState(options: UsePostEditorDirtyStateOptions) {
    const initialPostSnapshot = ref(stableSerialize(buildComparablePostEditorState(options.post.value)))

    const syncSavedSnapshot = () => {
        initialPostSnapshot.value = stableSerialize(buildComparablePostEditorState(options.post.value))
    }

    const isDirty = computed(() => stableSerialize(buildComparablePostEditorState(options.post.value)) !== initialPostSnapshot.value)

    useUnsavedChangesGuard({
        isDirty,
        enabled: computed(() => !options.saving.value),
        message: options.leaveMessage,
    })

    return {
        isDirty,
        syncSavedSnapshot,
    }
}
