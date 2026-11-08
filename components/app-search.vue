<template>
    <CaomeiDialog
        :open="visible"
        :title="$t('components.search.title')"
        :show-header="false"
        class="app-search-dialog"
        @update:open="visible = $event"
    >
        <div class="app-search">
            <div class="app-search__header">
                <Search class="app-search__icon" :size="20" />
                <CaomeiInput
                    ref="searchInput"
                    v-model="query"
                    :placeholder="$t('components.search.placeholder')"
                    class="app-search__input"
                    autocomplete="off"
                    @enter="performSearch"
                />
                <div class="app-search__hint desktop-only">
                    <CaomeiTag tone="neutral" size="sm">
                        ESC
                    </CaomeiTag>
                </div>
            </div>

            <div class="app-search__body">
                <div v-if="loading" class="app-search__status">
                    <LoaderCircle class="app-search__spinner" :size="32" />
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
                                <FileText :size="18" />
                            </div>
                            <div class="app-search__result-content">
                                <span class="app-search__result-title">{{ item.title }}</span>
                                <p v-if="item.summary" class="app-search__result-summary">
                                    {{ item.summary }}
                                </p>
                                <div class="app-search__result-meta">
                                    <span v-if="item.category" class="app-search__result-category">
                                        <Folder :size="12" />
                                        {{ item.category.name }}
                                    </span>
                                    <span v-if="item.language" class="app-search__result-lang">
                                        {{ item.language }}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight class="app-search__result-arrow" :size="16" />
                        </NuxtLink>
                    </transition-group>
                </div>

                <div v-else-if="query && !loading" class="app-search__empty">
                    <SearchX :size="32" />
                    <p>{{ $t('components.search.no_results') }}</p>
                </div>

                <div v-else class="app-search__footer">
                    <p>{{ $t('components.search.help_hint') }}</p>
                </div>
            </div>
        </div>
    </CaomeiDialog>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { ChevronRight, FileText, Folder, LoaderCircle, Search, SearchX } from '@lucide/vue'

const { locale } = useI18n()
const localePath = useLocalePath()
const { isSearchOpen: visible, closeSearch } = useSearch()
const { $appFetch } = useAppApi()

const query = ref('')
const results = ref<any[]>([])
const loading = ref(false)
const searchInput = ref<{ $el?: HTMLElement, focus?: () => void } | null>(null)

watch(visible, async (open) => {
    if (!open) {
        return
    }

    await nextTick()
    const input = searchInput.value
    if (typeof input?.focus === 'function') {
        input.focus()
        return
    }

    input?.$el?.querySelector?.('input')?.focus()
})

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
        const response = await $appFetch<any>('/api/search', {
            query: {
                q: trimmedQuery,
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
</script>

<style lang="scss">
@use "@/styles/variables" as *;

div.caomei-dialog__content.app-search-dialog {
    top: 15%;
    width: min(90vw, 600px);
    max-width: 600px;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--caomei-color-border);
    border-radius: $border-radius-lg;
    background: var(--m-surface-0);
    box-shadow: $shadow-xl;
    transform: translate(-50%, 0);
}

.app-search {
    display: flex;
    flex-direction: column;

    &__header {
        display: flex;
        align-items: center;
        padding: $spacing-md $spacing-lg;
        border-bottom: 1px solid var(--caomei-color-border);
        gap: $spacing-md;
    }

    &__icon {
        color: var(--caomei-color-text-muted);
        flex-shrink: 0;
    }

    &__input {
        flex: 1;

        :deep(.caomei-input__control) {
            border: none;
            background: transparent;
            font-size: 1.15rem;
            padding: 0;
            box-shadow: none;
            height: auto;
        }

        :deep(.caomei-input__control::placeholder) {
            color: var(--caomei-color-text-muted);
        }
    }

    &__hint {
        :deep(.caomei-tag) {
            font-size: 0.75rem;
            font-weight: 500;
        }
    }

    &__spinner {
        animation: app-search-spin 0.9s linear infinite;
    }

    &__body {
        max-height: 400px;
        min-height: 120px;
        overflow-y: auto;
        padding: $spacing-sm;
        transition: $transition-slow;
    }

    &__status, &__empty, &__footer {
        padding: $spacing-xl * 1.5 $spacing-xl;
        text-align: center;
        color: var(--caomei-color-text-muted);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $spacing-md;
    }

    &__results {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
    }

    &__result-item {
        display: flex;
        align-items: center;
        padding: $spacing-sm $spacing-md;
        border-radius: $border-radius-md;
        transition: $transition-base;
        text-decoration: none;
        color: var(--caomei-color-text);
        gap: $spacing-md;

        &:hover {
            background-color: var(--m-primary-50);

            .app-search__result-icon {
                background-color: white;
                color: var(--caomei-color-primary);
            }

            .app-search__result-arrow {
                transform: translateX(4px);
                color: var(--caomei-color-primary);
            }
        }
    }

    &__result-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: $border-radius-sm;
        background-color: var(--m-surface-0);
        border: 1px solid var(--caomei-color-border);
        color: var(--caomei-color-text-muted);
        flex-shrink: 0;
        transition: $transition-base;
    }

    &__result-content {
        flex: 1;
        min-width: 0;
    }

    &__result-title {
        display: block;
        font-weight: 600;
        margin-bottom: $spacing-xs;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__result-summary {
        font-size: 0.875rem;
        color: var(--caomei-color-text-muted);
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__result-meta {
        margin-top: $spacing-xs;
        display: flex;
        gap: $spacing-md;
        font-size: 0.75rem;
        color: var(--caomei-color-text-muted);
    }

    &__result-category {
        display: flex;
        align-items: center;
        gap: $spacing-xs;
    }

    &__result-lang {
        padding: 0 4px;
        border: 1px solid var(--caomei-color-border);
        border-radius: $border-radius-sm;
        text-transform: uppercase;
    }

    &__result-arrow {
        color: var(--caomei-color-text-muted);
        transition: transform $transition-base;
    }
}

@keyframes app-search-spin {
    to {
        transform: rotate(360deg);
    }
}

/* Search results transition */
.search-list-enter-active,
.search-list-leave-active {
    transition: $transition-slow;
}

.search-list-enter-from,
.search-list-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.dark .app-search__result-item:hover {
    background-color: var(--m-primary-900);

    .app-search__result-icon {
        background-color: var(--m-primary-800);
        color: var(--m-primary-100);
    }
}
</style>
