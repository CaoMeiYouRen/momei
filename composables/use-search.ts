export const useSearch = () => {
    const isSearchOpen = useState('isSearchOpen', () => false)

    const openSearch = () => {
        isSearchOpen.value = true
    }

    const closeSearch = () => {
        isSearchOpen.value = false
    }

    const toggleSearch = () => {
        isSearchOpen.value = !isSearchOpen.value
    }

    return {
        isSearchOpen,
        openSearch,
        closeSearch,
        toggleSearch,
    }
}
