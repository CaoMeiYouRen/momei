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
                    :model-value="currentView"
                    :options="viewOptions"
                    option-label="label"
                    option-value="value"
                    size="small"
                    :allow-empty="false"
                    @update:model-value="onViewChange"
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

        <div v-else class="calendar-view__grid calendar-view__grid--week">
            <div
                v-for="cell in weekCells"
                :key="cell.dateKey"
                class="calendar-view__cell"
                :class="{
                    'calendar-view__cell--today': cell.isToday,
                    'calendar-view__cell--has-posts': cell.posts.length > 0
                }"
            >
                <div class="calendar-view__cell-header">
                    <span class="calendar-view__cell-weekday">{{ cell.weekday }}</span>
                    <span class="calendar-view__cell-date">{{ cell.day }}</span>
                </div>
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
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import type { CalendarDayGroup } from '@/types/calendar'

const props = defineProps<{
    loading: boolean
    calendarPosts: CalendarDayGroup[]
    /** 每周的第一天: 0=周日, 1=周一, … 6=周六, 默认 1 (周一) */
    firstDayOfWeek?: number
}>()

const firstDayOfWeek = computed(() => props.firstDayOfWeek ?? 1)

const emit = defineEmits<{
    'edit-post': [id: string]
    navigate: [date: Date]
}>()

const { t, locale } = useI18n()

const currentView = ref<'month' | 'week'>('month')
const currentDate = ref(new Date())

function onViewChange(value: 'month' | 'week' | null) {
    if (value) {
        currentView.value = value
    }
}

const viewOptions = computed(() => [
    { label: t('pages.admin.calendar.month_view'), value: 'month' as const },
    { label: t('pages.admin.calendar.week_view'), value: 'week' as const },
])

/**
 * 计算指定日期所在周的开始日（基于 firstDayOfWeek）
 */
function weekStart(date: dayjs.Dayjs, firstDay: number): dayjs.Dayjs {
    return date.subtract((date.day() - firstDay + 7) % 7, 'day')
}

const weekdays = computed(() => {
    // 2024-01-07 是周日; +firstDay 即得到对应的起始日
    const base = dayjs().year(2024).month(0).date(7 + firstDayOfWeek.value)
    return Array.from({ length: 7 }, (_, i) => {
        return base.add(i, 'day').toDate().toLocaleDateString(locale.value, { weekday: 'short' })
    })
})

const titleText = computed(() => {
    const d = dayjs(currentDate.value)
    return `${d.year()} ${t('common.year')} ${d.month() + 1} ${t('common.month')}`
})

interface CalendarCell {
    dateKey: string
    day: number
    isCurrentMonth: boolean
    isToday: boolean
    weekday?: string
    posts: CalendarDayGroup['posts']
}

const monthCells = computed<CalendarCell[]>(() => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const firstDay = dayjs(new Date(year, month, 1))
    const lastDay = dayjs(new Date(year, month + 1, 0))
    const todayKey = dayjs().format('YYYY-MM-DD')

    const start = weekStart(firstDay, firstDayOfWeek.value)

    const daysToAdd = (firstDayOfWeek.value + 6 - lastDay.day() + 7) % 7
    const end = daysToAdd > 0 ? lastDay.add(daysToAdd, 'day') : lastDay

    const postsMap = new Map<string, CalendarDayGroup['posts']>()
    for (const group of props.calendarPosts) {
        postsMap.set(group.date, group.posts)
    }

    const cells: CalendarCell[] = []
    let cursor = start
    while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
        const dateKey = cursor.format('YYYY-MM-DD')
        cells.push({
            dateKey,
            day: cursor.date(),
            isCurrentMonth: cursor.month() === month,
            isToday: dateKey === todayKey,
            posts: postsMap.get(dateKey) || [],
        })
        cursor = cursor.add(1, 'day')
    }
    return cells
})

const weekCells = computed<CalendarCell[]>(() => {
    const todayKey = dayjs().format('YYYY-MM-DD')
    const startOfWeek = weekStart(dayjs(currentDate.value), firstDayOfWeek.value)

    const postsMap = new Map<string, CalendarDayGroup['posts']>()
    for (const group of props.calendarPosts) {
        postsMap.set(group.date, group.posts)
    }

    const cells: CalendarCell[] = []
    for (let i = 0; i < 7; i++) {
        const d = startOfWeek.add(i, 'day')
        const dateKey = d.format('YYYY-MM-DD')
        cells.push({
            dateKey,
            day: d.date(),
            isCurrentMonth: true,
            isToday: dateKey === todayKey,
            weekday: d.toDate().toLocaleDateString(locale.value, { weekday: 'short' }),
            posts: postsMap.get(dateKey) || [],
        })
    }
    return cells
})

function prevPeriod() {
    const d = currentView.value === 'month'
        ? dayjs(currentDate.value).subtract(1, 'month').toDate()
        : dayjs(currentDate.value).subtract(7, 'day').toDate()
    currentDate.value = d
    emit('navigate', d)
}

function nextPeriod() {
    const d = currentView.value === 'month'
        ? dayjs(currentDate.value).add(1, 'month').toDate()
        : dayjs(currentDate.value).add(7, 'day').toDate()
    currentDate.value = d
    emit('navigate', d)
}

function goToToday() {
    const d = dayjs().toDate()
    currentDate.value = d
    emit('navigate', d)
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

        &:nth-child(7n) {
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

    &__cell-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.2rem;
    }

    &__cell-weekday {
        font-size: 0.7rem;
        color: var(--p-text-muted-color);
        font-weight: 500;
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
