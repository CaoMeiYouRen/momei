<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.calendar.title')" />

        <div class="admin-content-card">
            <div class="calendar-lang-bar">
                <Select
                    :model-value="contentLanguage"
                    :options="availableLocales"
                    option-label="label"
                    option-value="value"
                    :placeholder="t('common.all_languages')"
                    size="small"
                    class="calendar-lang-bar__select"
                    @update:model-value="(val: string | null) => { setContentLanguage(val); loadData() }"
                />
            </div>
            <Tabs v-model:value="activeTab">
                <TabList>
                    <Tab value="calendar">
                        <i class="pi pi-calendar" />
                        <span>{{ $t('pages.admin.calendar.tab_calendar') }}</span>
                    </Tab>
                    <Tab value="kanban">
                        <i class="pi pi-th-large" />
                        <span>{{ $t('pages.admin.calendar.tab_kanban') }}</span>
                    </Tab>
                </TabList>

                <TabPanels>
                    <TabPanel value="calendar">
                        <CalendarView
                            :loading="calendarLoading"
                            :calendar-posts="calendarPosts"
                            @edit-post="navigateToEditPost"
                            @navigate="handleCalendarNavigate"
                        />
                    </TabPanel>
                    <TabPanel value="kanban">
                        <KanbanView
                            :loading="kanbanLoading"
                            :kanban-data="kanbanData"
                            @edit-post="navigateToEditPost"
                            @update-stage="handleUpdateStage"
                        />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CalendarView from '@/components/admin/calendar/calendar-view.vue'
import KanbanView from '@/components/admin/calendar/kanban-view.vue'
import type { CalendarDayGroup, KanbanResponse, PipelineStage } from '@/types/calendar'
import { useAdminI18n } from '@/composables/use-admin-i18n'

definePageMeta({
    middleware: 'author',
    layout: 'default',
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const nuxtApp = useNuxtApp()
const { showErrorToast, showSuccessToast } = useRequestFeedback()
const { contentLanguage, setContentLanguage, availableLocales } = useAdminI18n()
const { ensureLocaleMessageModules } = await import('@/i18n/config/locale-runtime-loader')

await ensureLocaleMessageModules({
    i18n: nuxtApp.$i18n as object,
    locale: locale.value,
    modules: ['admin-calendar'],
})

const activeTab = ref<'calendar' | 'kanban'>('calendar')

const calendarPosts = ref<CalendarDayGroup[]>([])
const calendarLoading = ref(false)

const kanbanData = ref<KanbanResponse>({ ideation: [], writing: [], ready: [] })
const kanbanLoading = ref(false)

function getMonthRange(date: Date): { startDate: string, endDate: string } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
    }
}

async function loadCalendarPosts(startDate: string, endDate: string) {
    calendarLoading.value = true
    try {
        const params: Record<string, string> = { startDate, endDate }
        if (contentLanguage.value) {
            params.language = contentLanguage.value
        }
        const res = await $fetch<{ code: number, data: { groups: CalendarDayGroup[] } }>('/api/posts/calendar-posts', { params })
        calendarPosts.value = res.data.groups
    } catch (e) {
        showErrorToast(e, { fallbackKey: 'common.load_failed' })
    } finally {
        calendarLoading.value = false
    }
}

function handleCalendarNavigate(date: Date) {
    const { startDate, endDate } = getMonthRange(date)
    void loadCalendarPosts(startDate, endDate)
}

async function loadKanbanPosts() {
    kanbanLoading.value = true
    try {
        const params: Record<string, string> = {}
        if (contentLanguage.value) {
            params.language = contentLanguage.value
        }
        const res = await $fetch<{ code: number, data: KanbanResponse }>('/api/posts/kanban-posts', { params })
        kanbanData.value = res.data
    } catch (e) {
        showErrorToast(e, { fallbackKey: 'common.load_failed' })
    } finally {
        kanbanLoading.value = false
    }
}

async function handleUpdateStage(postId: string, newStage: PipelineStage) {
    // Optimistic local update
    const prevData = { ...kanbanData.value }
    const allCards = [...prevData.ideation, ...prevData.writing, ...prevData.ready]
    const card = allCards.find((c) => c.id === postId)
    if (card) {
        // Remove from old stage
        for (const key of ['ideation', 'writing', 'ready'] as const) {
            kanbanData.value[key] = kanbanData.value[key].filter((c) => c.id !== postId)
        }
        // Add to new
        kanbanData.value[newStage] = [...kanbanData.value[newStage], { ...card, pipelineStage: newStage }]
    }

    try {
        await $fetch(`/api/posts/${postId}/pipeline-stage`, {
            method: 'PATCH',
            body: { pipelineStage: newStage },
        })
        showSuccessToast('pages.admin.calendar.update_success')
    } catch (e) {
        // Rollback on failure
        kanbanData.value = prevData
        showErrorToast(e, { fallbackKey: 'pages.admin.calendar.update_failed' })
    }
}

function navigateToEditPost(id: string) {
    navigateTo(localePath(`/admin/posts/${id}`))
}

// Initial load
const { startDate, endDate } = getMonthRange(new Date())

function loadData() {
    void loadCalendarPosts(startDate, endDate)
    void loadKanbanPosts()
}

void loadData()
</script>

<style lang="scss" scoped>
.calendar-lang-bar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.5rem;

    &__select {
        min-width: 160px;
    }
}
</style>
