<template>
    <div class="calendar-view">
        <div class="calendar-view__toolbar">
            <div class="calendar-view__nav">
                <Button
                    icon="pi pi-chevron-left"
                    text
                    rounded
                    @click="prevPeriod"
                />
                <span class="calendar-view__title">{{ titleText }}</span>
                <Button
                    icon="pi pi-chevron-right"
                    text
                    rounded
                    @click="nextPeriod"
                />
            </div>
            <div class="calendar-view__actions">
                <Button
                    :label="$t('pages.admin.calendar.today_btn')"
                    severity="secondary"
                    size="small"
                    @click="goToToday"
                />
                <SelectButton
                    v-model="currentView"
                    :options="viewOptions"
                    option-label="label"
                    option-value="value"
                    size="small"
                />
            </div>
        </div>

        <div v-if="loading" class="calendar-view__loading">
            <i class="pi pi-spin pi-spinner" />
            <span>{{ $t('common.loading') }}</span>
        </div>

        <div v-else-if="currentView === 'month'" class="calendar-view__grid">
            <div class="calendar-view__weekdays">
                <div
                    v-for="day in weekdays"
                    :key="day"
                    class="calendar-view__weekday"
                >
                    {{ day }}
                </div>
            </div>
            <div
                v-for="cell in monthCells"
                :key="cell.dateKey"
                class="calendar-view__cell"
                :class="{
                    'calendar-view__cell--other-month': !cell.isCurrentMonth,
                    'calendar-view__cell--today': cell.isToday,
                    'calendar-view__cell--has-posts': cell.posts.length > 0
                }"
            >
                <span class="calendar-view__cell-date">{{ cell.day }}</span>
                <div class="calendar-view__cell-posts">
                    <div
                        v-for="post in cell.posts.slice(0, 3)"
                        :key="post.id"
                        class="calendar-view__chip"
                        :class="`calendar-view__chip--${post.status}`"
                        @click="$emit('edit-post', post.id)"
                    >
                        {{ truncate(post.title, 12) }}
                    </div>
                    <div v-if="cell.posts.length > 3" class="calendar-view__more">
                        +{{ cell.posts.length - 3 }} {{ $t('pages.admin.calendar.more') }}
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="calendar-view__week">
            <p class="calendar-view__week-placeholder">
                {{ $t('pages.admin.calendar.week_view') }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CalendarDayGroup } from '@/types/calendar'

const props = defineProps<{
    loading: boolean
    calendarPosts: CalendarDayGroup[]
}>()

defineEmits<{
    'edit-post': [id: string]
}>()

const { t } = useI18n()

const currentView = ref<'month' | 'week'>('month')
const currentDate = ref(new Date())

const viewOptions = computed(() => [
    { label: t('pages.admin.calendar.month_view'), value: 'month' as const },
    { label: t('pages.admin.calendar.week_view'), value: 'week' as const },
])

const weekdays = computed(() => {
    const { locale } = useI18n()
    const base = new Date(2024, 0, 7) // Sunday
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(base)
        d.setDate(d.getDate() + i)
        return d.toLocaleDateString(locale.value, { weekday: 'short' })
    })
})

const titleText = computed(() => {
    const d = currentDate.value
    return `${d.getFullYear()} ${t('common.year')} ${d.getMonth() + 1} ${t('common.month')}`
})

interface CalendarCell {
    dateKey: string
    day: number
    isCurrentMonth: boolean
    isToday: boolean
    posts: CalendarDayGroup['posts']
}

const monthCells = computed<CalendarCell[]>(() => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const today = new Date()
    const todayKey = today.toISOString().slice(0, 10)

    const start = new Date(firstDay)
    start.setDate(start.getDate() - start.getDay())

    const end = new Date(lastDay)
    if (end.getDay() < 6) {
        end.setDate(end.getDate() + (6 - end.getDay()))
    }

    const postsMap = new Map<string, CalendarDayGroup['posts']>()
    for (const group of props.calendarPosts) {
        postsMap.set(group.date, group.posts)
    }

    const cells: CalendarCell[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
        const dateKey = cursor.toISOString().slice(0, 10)
        cells.push({
            dateKey,
            day: cursor.getDate(),
            isCurrentMonth: cursor.getMonth() === month,
            isToday: dateKey === todayKey,
            posts: postsMap.get(dateKey) || [],
        })
        cursor.setDate(cursor.getDate() + 1)
    }
    return cells
})

function prevPeriod() {
    const d = new Date(currentDate.value)
    if (currentView.value === 'month') {
        d.setMonth(d.getMonth() - 1)
    } else {
        d.setDate(d.getDate() - 7)
    }
    currentDate.value = d
}

function nextPeriod() {
    const d = new Date(currentDate.value)
    if (currentView.value === 'month') {
        d.setMonth(d.getMonth() + 1)
    } else {
        d.setDate(d.getDate() + 7)
    }
    currentDate.value = d
}

function goToToday() {
    currentDate.value = new Date()
}

function truncate(str: string, max: number): string {
    return str.length > max ? str.slice(0, max) + '…' : str
}
</script>

<style lang="scss" scoped>
.calendar-view {
    &__toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    &__nav {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    &__title {
        font-weight: 600;
        font-size: 1rem;
        min-width: 8rem;
        text-align: center;
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 3rem;
        color: var(--p-text-muted-color);
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        border: 1px solid var(--p-content-border-color);
        border-radius: var(--p-border-radius);
        overflow: hidden;
    }

    &__weekdays {
        display: contents;
    }

    &__weekday {
        padding: 0.5rem;
        text-align: center;
        font-weight: 600;
        font-size: 0.8rem;
        background: var(--p-surface-100);
        border-bottom: 1px solid var(--p-content-border-color);
    }

    &__cell {
        min-height: 80px;
        padding: 0.3rem;
        border-right: 1px solid var(--p-content-border-color);
        border-bottom: 1px solid var(--p-content-border-color);

        &:nth-child(7n + 1) {
            border-right: none;
        }

        &--other-month {
            opacity: 0.4;
        }

        &--today {
            background: var(--p-primary-50);
        }

        &--has-posts {
            cursor: default;
        }
    }

    &__cell-date {
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
        display: block;
        margin-bottom: 0.2rem;
    }

    &__cell-posts {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    &__chip {
        font-size: 0.7rem;
        padding: 0.1rem 0.3rem;
        border-radius: 3px;
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &--published {
            background: var(--p-green-100);
            color: var(--p-green-700);
        }

        &--scheduled {
            background: var(--p-orange-100);
            color: var(--p-orange-700);
        }
    }

    &__more {
        font-size: 0.65rem;
        color: var(--p-text-muted-color);
    }

    &__week-placeholder {
        text-align: center;
        padding: 3rem;
        color: var(--p-text-muted-color);
    }
}
</style>
