<template>
    <div class="archives-page container">
        <div class="section__header">
            <h1 class="section__title">
                {{ $t('archives.title') }}
            </h1>
        </div>

        <div v-if="pending" class="loading">
            <Skeleton
                v-for="i in 4"
                :key="i"
                class="mb-4"
            />
        </div>

        <div v-else-if="error" class="error-state">
            <p>{{ $t('common.error_loading') }}</p>
        </div>

        <div v-else class="archives-list">
            <div
                v-for="yearBlock in list"
                :key="yearBlock.year"
                class="year-block"
            >
                <h2 class="year-title">
                    {{ yearBlock.year }}
                </h2>
                <ul class="months-list">
                    <li
                        v-for="m in yearBlock.months"
                        :key="m.month"
                        class="month-item"
                    >
                        <button
                            :aria-expanded="isExpanded(yearBlock.year, m.month)"
                            class="month-toggle"
                            @click="toggleMonth(yearBlock.year, m.month)"
                        >
                            <span class="month-name">{{ formatMonthName(m.month) }}</span>
                            <span class="month-count">{{ m.count }}</span>
                        </button>

                        <div v-if="isExpanded(yearBlock.year, m.month)" class="month-posts">
                            <div v-if="loadingKey(yearBlock.year, m.month)" class="loading mini">
                                <Skeleton class="mb-2" />
                            </div>

                            <ul v-else class="post-items">
                                <li
                                    v-for="post in postsCache[cacheKey(yearBlock.year, m.month)] || []"
                                    :key="post.id"
                                    class="post-item"
                                >
                                    <NuxtLink :to="localePath(`/posts/${post.slug}`)" class="post-link">
                                        <div class="post-title">
                                            {{ post.title }}
                                        </div>
                                        <div v-if="showSummary" class="post-summary">
                                            {{ post.summary }}
                                        </div>
                                    </NuxtLink>
                                </li>
                            </ul>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ArchiveMonth, ArchiveYear, ApiResponse } from '@/types/archive'

const { t } = useI18n()
const localePath = useLocalePath()
useHead({ title: t('archives.meta.title') })

const { data, pending, error } = await useFetch<ApiResponse<{ list: ArchiveYear[] }>>('/api/posts/archive')
const list = computed<ArchiveYear[]>(() => (data.value?.data?.list || []) as ArchiveYear[])

// Client-side state
const expanded = ref<Record<string, Set<number>>>({})
const postsCache = reactive<Record<string, any[]>>({})
const loading = reactive<Record<string, boolean>>({})
const showSummary = useState('archives-show-summary', () => false)

function cacheKey(year: number, month: number) {
    return `${year}-${month}`
}

function loadingKey(year: number, month: number) {
    return loading[cacheKey(year, month)]
}

function isExpanded(year: number, month: number) {
    return expanded.value[year]?.has(month) || false
}

async function toggleMonth(year: number, month: number) {
    if (!expanded.value[year]) expanded.value[year] = new Set()
    const key = cacheKey(year, month)

    if (expanded.value[year].has(month)) {
        expanded.value[year].delete(month)
        return
    }

    expanded.value[year].add(month)

    if (!postsCache[key]) {
        loading[key] = true
        try {
            const res: any = await $fetch('/api/posts/archive', {
                query: { includePosts: true, year, month },
            })
            // Our API returns data.list as the items in includePosts mode
            postsCache[key] = res.data.list
        } catch (e) {
            postsCache[key] = []
        } finally {
            loading[key] = false
        }
    }
}

function formatMonthName(month: number) {
    // localize month name via i18n if needed
    const m = Number(month)
    return `${m}月`
}
</script>

<style lang="scss" scoped>
.archives-page {
  padding: 2rem 1rem;
  .year-block {
    margin-bottom: 1.5rem;
  }

  .year-title {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .months-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }

  .month-item {
    .month-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      background: transparent;
      border: none;
      padding: 0.75rem;
      text-align: left;
      cursor: pointer;
      border-radius: 0.375rem;
      &:hover {
        background: rgba(0,0,0,0.03);
      }
    }

    .month-posts {
      padding-left: 0.75rem;
      .post-items {
        list-style: none;
        padding: 0;
        margin: 0.5rem 0 0 0;
        .post-item {
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(0,0,0,0.03);
          .post-link {
            display: block;
            .post-title { font-weight: 600 }
            .post-summary { color: var(--p-text-muted-color); font-size: 0.95rem }
          }
        }
      }
    }
  }
}
</style>
