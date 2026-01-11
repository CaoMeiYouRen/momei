<template>
    <Dialog
        v-model:visible="visible"
        modal
        header=" "
        :dismissable-mask="true"
        class="app-search-dialog"
        :show-header="false"
        :pt="{
            root: {class: 'search-dialog-root'},
            content: {class: 'search-dialog-content'}
        }"
    >
        <div class="app-search">
            <div class="app-search__header">
                <i class="app-search__icon pi pi-search" />
                <InputText
                    v-model="query"
                    :placeholder="$t('components.search.placeholder')"
                    class="app-search__input"
                    autofocus
                    autocomplete="off"
                    @keyup.enter="performSearch"
                />
                <div class="app-search__hint desktop-only">
                    <Tag severity="secondary" value="ESC" />
                </div>
            </div>

            <div class="app-search__body">
                <div v-if="loading" class="app-search__status">
                    <i class="pi pi-spin pi-spinner" />
                    <span>{{ $t('components.search.loading') }}</span>
                </div>

                <div v-else-if="results.length > 0" class="app-search__results">
                    <transition-group name="search-list">
                        <NuxtLink
                            v-for="item in results"
                            :key="item.id"
                            :to="localePath(`/posts/${item.slug}`)"
                            class="app-search__result-item"
                            @click="closeSearch"
                        >
                            <div class="app-search__result-icon">
                                <i class="pi pi-file" />
                            </div>
                            <div class="app-search__result-content">
                                <span class="app-search__result-title">{{ item.title }}</span>
                                <p v-if="item.summary" class="app-search__result-summary">
                                    {{ item.summary }}
                                </p>
                                <div class="app-search__result-meta">
                                    <span v-if="item.category" class="app-search__result-category">
                                        <i class="pi pi-folder" />
                                        {{ item.category.name }}
                                    </span>
                                    <span v-if="item.language" class="app-search__result-lang">
                                        {{ item.language }}
                                    </span>
                                </div>
                            </div>
                            <i class="app-search__result-arrow pi pi-chevron-right" />
                        </NuxtLink>
                    </transition-group>
                </div>

                <div v-else-if="query && !loading" class="app-search__empty">
                    <i class="pi pi-search-minus" />
                    <p>{{ $t('components.search.no_results') }}</p>
                </div>

                <div v-else class="app-search__footer">
                    <p>{{ $t('components.search.help_hint') }}</p>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const { locale } = useI18n()
const localePath = useLocalePath()
const { isSearchOpen: visible, openSearch, closeSearch } = useSearch()

const query = ref('')
const results = ref<any[]>([])
const loading = ref(false)

// Use VueUse debounced function
const debouncedSearch = useDebounceFn(async () => {
    const trimmedQuery = query.value.trim()
    if (!trimmedQuery) {
        results.value = []
        loading.value = false
        return
    }

    loading.value = true
    try {
        // Use $fetch for imperative calls instead of useFetch composable
        const response = await $fetch<any>('/api/search', {
            params: {
                q: trimmedQuery,
                language: locale.value,
                limit: 8,
            },
        })
        if (response?.code === 200) {
            results.value = response.data.items
        }
    } catch (error) {
        console.error('Search failed:', error)
        results.value = []
    } finally {
        loading.value = false
    }
}, 500) // Increase debounce to 400ms for better UX

watch(query, (newVal) => {
    if (!newVal.trim()) {
        results.value = []
        loading.value = false
        return
    }
    debouncedSearch()
})

const performSearch = () => {
    if (results.value.length > 0) {
        navigateTo(localePath(`/posts/${results.value[0].slug}`))
        closeSearch()
    }
}

// Keyboard shortcut Ctrl+K
const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style lang="scss">
.app-search-dialog {
    &.p-dialog {
        background: transparent;
        box-shadow: none;
        border: none;
        width: 100%;
        max-width: 600px;
        top: 15% !important;
        margin: 0 1rem;

        .p-dialog-content {
            border-radius: 12px;
            padding: 0;
            overflow: hidden;
            background: var(--p-content-background);
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
            border: 1px solid var(--p-content-border-color);
        }
    }
}

.app-search {
    display: flex;
    flex-direction: column;

    &__header {
        display: flex;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--p-content-border-color);
        gap: 1rem;
    }

    &__icon {
        font-size: 1.25rem;
        color: var(--p-text-muted-color);
    }

    &__input {
        flex: 1;
        border: none !important;
        background: transparent !important;
        font-size: 1.15rem;
        padding: 0;
        box-shadow: none !important;

        &::placeholder {
            color: var(--p-text-muted-color);
        }
    }

    &__hint {
        .p-tag {
            font-size: 0.75rem;
            font-weight: 500;
        }
    }

    &__body {
        max-height: 400px;
        min-height: 120px;
        overflow-y: auto;
        padding: 0.5rem;
        transition: all 0.3s ease;
    }

    &__status, &__empty, &__footer {
        padding: 3rem 2rem;
        text-align: center;
        color: var(--p-text-muted-color);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;

        i {
            font-size: 2rem;
        }
    }

    &__results {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    &__result-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        transition: all 0.2s;
        text-decoration: none;
        color: var(--p-text-color);
        gap: 1rem;

        &:hover {
            background-color: var(--p-primary-50);

            .app-search__result-icon {
                background-color: white;
                color: var(--p-primary-color);
            }

            .app-search__result-arrow {
                transform: translateX(4px);
                color: var(--p-primary-color);
            }
        }
    }

    &__result-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        background-color: var(--p-content-background);
        border: 1px solid var(--p-content-border-color);
        color: var(--p-text-muted-color);
        flex-shrink: 0;
        transition: all 0.2s;
    }

    &__result-content {
        flex: 1;
        min-width: 0;
    }

    &__result-title {
        display: block;
        font-weight: 600;
        margin-bottom: 0.25rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__result-summary {
        font-size: 0.875rem;
        color: var(--p-text-muted-color);
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__result-meta {
        margin-top: 0.25rem;
        display: flex;
        gap: 0.75rem;
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
    }

    &__result-category {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    &__result-lang {
        padding: 0 4px;
        border: 1px solid var(--p-content-border-color);
        border-radius: 3px;
        text-transform: uppercase;
    }

    &__result-arrow {
        color: var(--p-text-muted-color);
        transition: transform 0.2s;
    }
}

/* Search results transition */
.search-list-enter-active,
.search-list-leave-active {
    transition: all 0.3s ease;
}

.search-list-enter-from,
.search-list-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

:global(.dark) .app-search__result-item:hover {
    background-color: var(--p-primary-900);

    .app-search__result-icon {
        background-color: var(--p-primary-800);
        color: var(--p-primary-100);
    }
}
</style>
