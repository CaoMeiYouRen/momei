import { describe, expect, it } from 'vitest'
import { useSearch } from './use-search'

describe('useSearch', () => {
    it('should initialize with isSearchOpen as false', () => {
        const { isSearchOpen } = useSearch()
        expect(isSearchOpen.value).toBe(false)
    })

    it('should open search', () => {
        const { isSearchOpen, openSearch } = useSearch()
        openSearch()
        expect(isSearchOpen.value).toBe(true)
    })

    it('should close search', () => {
        const { isSearchOpen, openSearch, closeSearch } = useSearch()
        openSearch()
        expect(isSearchOpen.value).toBe(true)
        closeSearch()
        expect(isSearchOpen.value).toBe(false)
    })

    it('should toggle search state', () => {
        const { isSearchOpen, toggleSearch } = useSearch()
        expect(isSearchOpen.value).toBe(false)
        toggleSearch()
        expect(isSearchOpen.value).toBe(true)
        toggleSearch()
        expect(isSearchOpen.value).toBe(false)
    })

    it('should share state across multiple calls', () => {
        const search1 = useSearch()
        const search2 = useSearch()

        search1.openSearch()
        expect(search2.isSearchOpen.value).toBe(true)

        search2.closeSearch()
        expect(search1.isSearchOpen.value).toBe(false)
    })
})
