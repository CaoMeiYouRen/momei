import { describe, expect, it } from 'vitest'

import { useDeleteDialogState } from './use-delete-dialog-state'

describe('useDeleteDialogState', () => {
    it('opens and resets the delete dialog state', () => {
        const state = useDeleteDialogState<{ id: number }>()

        expect(state.visible.value).toBe(false)
        expect(state.item.value).toBeNull()

        const target = { id: 1 }
        state.openDeleteDialog(target)

        expect(state.visible.value).toBe(true)
        expect(state.item.value).toStrictEqual(target)

        state.closeDeleteDialog()
        expect(state.visible.value).toBe(false)
        expect(state.item.value).toStrictEqual(target)

        state.resetDeleteDialog()

        expect(state.visible.value).toBe(false)
        expect(state.item.value).toBeNull()
    })
})
