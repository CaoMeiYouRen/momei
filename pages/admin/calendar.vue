<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.calendar.title')" />

        <div class="admin-content-card">
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

definePageMeta({
    middleware: 'author',
    layout: 'default',
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const nuxtApp = useNuxtApp()
const { showErrorToast, showSuccessToast } = useRequestFeedback()
const { ensureLocaleMessageModules } = await import('@/i18n/config/locale-runtime-loader')

void ensureLocaleMessageModules({
    i18n: nuxtApp.$i18n as object,
    locale: locale.value,
    modules: ['admin-calendar'],
})

const activeTab = ref<'calendar' | 'kanban'>('calendar')

const calendarPosts = ref<CalendarDayGroup[]>([])
const calendarLoading = ref(false)

const kanbanData = ref<KanbanResponse>({ ideation: [], writing: [], ready: [] })
const kanbanLoading = ref(false)

function getMonthRange(): { startDate: string, endDate: string } {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
    }
}

async function loadCalendarPosts() {
    calendarLoading.value = true
    try {
        const { startDate, endDate } = getMonthRange()
        const res = await $fetch<{ code: number, data: { groups: CalendarDayGroup[] } }>('/api/posts/calendar-posts', {
            params: { startDate, endDate },
        })
        calendarPosts.value = res.data.groups
    } catch (e) {
        showErrorToast(e, { fallbackKey: 'common.load_failed' })
    } finally {
        calendarLoading.value = false
    }
}

async function loadKanbanPosts() {
    kanbanLoading.value = true
    try {
        const res = await $fetch<{ code: number, data: KanbanResponse }>('/api/posts/kanban-posts')
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
void loadCalendarPosts()
void loadKanbanPosts()
</script>
