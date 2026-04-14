export const useSearch = () => {
    const isSearchOpen = useState('isSearchOpen', () => false)
    const isSearchReady = useState('isSearchReady', () => false)

    const markSearchReady = () => {
        isSearchReady.value = true
    }

    const openSearch = () => {
        markSearchReady()
        isSearchOpen.value = true
    }

    const closeSearch = () => {
        isSearchOpen.value = false
    }

    const toggleSearch = () => {
        markSearchReady()
        isSearchOpen.value = !isSearchOpen.value
    }

    return {
        isSearchOpen,
        isSearchReady,
        markSearchReady,
        openSearch,
        closeSearch,
        toggleSearch,
    }
}
