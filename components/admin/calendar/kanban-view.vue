<template>
    <div class="kanban-view">
        <div v-if="loading" class="kanban-view__loading">
            <i class="pi pi-spin pi-spinner" />
            <span>{{ $t('common.loading') }}</span>
        </div>
        <div v-else class="kanban-view__board">
            <div
                v-for="col in columns"
                :key="col.key"
                class="kanban-view__column"
                :class="`kanban-view__column--${col.key}`"
                @dragover.prevent="onDragOver(col.key)"
                @drop.prevent="onDrop(col.key)"
            >
                <div class="kanban-view__column-header">
                    <span class="kanban-view__column-title">{{ col.label }}</span>
                    <Tag :value="cardsByStage[col.key].length" severity="info" />
                </div>
                <div
                    class="kanban-view__column-cards"
                    :class="{'kanban-view__column-cards--drag-over': dragOverColumn === col.key}"
                >
                    <div
                        v-for="card in cardsByStage[col.key]"
                        :key="card.id"
                        class="kanban-view__card"
                        :class="{'kanban-view__card--dragging': draggingCardId === card.id}"
                        draggable="true"
                        @dragstart="onDragStart(card.id, col.key)"
                        @dragend="onDragEnd"
                        @dblclick="$emit('edit-post', card.id)"
                    >
                        <div class="kanban-view__card-title">
                            {{ card.title }}
                        </div>
                        <div class="kanban-view__card-meta">
                            <span v-if="card.categoryName" class="kanban-view__card-category">{{ card.categoryName }}</span>
                            <span class="kanban-view__card-date">{{ relativeTime(card.updatedAt) }}</span>
                        </div>
                    </div>
                    <div v-if="cardsByStage[col.key].length === 0" class="kanban-view__empty">
                        {{ $t('pages.admin.calendar.kanban_empty') }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { KanbanCard, KanbanResponse, PipelineStage } from '@/types/calendar'

const props = defineProps<{
    loading: boolean
    kanbanData: KanbanResponse
}>()

const emit = defineEmits<{
    'edit-post': [id: string]
    'update-stage': [postId: string, newStage: PipelineStage]
}>()

const { t } = useI18n()
const { relativeTime } = useI18nDate()

const draggingCardId = ref<string | null>(null)
const dragSourceColumn = ref<string | null>(null)
const dragOverColumn = ref<string | null>(null)

const columns = computed(() => [
    { key: 'ideation' as const, label: t('pages.admin.calendar.kanban_ideation') },
    { key: 'writing' as const, label: t('pages.admin.calendar.kanban_writing') },
    { key: 'ready' as const, label: t('pages.admin.calendar.kanban_ready') },
])

const cardsByStage = computed(() => ({
    ideation: props.kanbanData.ideation,
    writing: props.kanbanData.writing,
    ready: props.kanbanData.ready,
}))

function onDragStart(cardId: string, sourceCol: string) {
    draggingCardId.value = cardId
    dragSourceColumn.value = sourceCol
}

function onDragOver(targetCol: string) {
    dragOverColumn.value = targetCol
}

function onDrop(targetCol: string) {
    dragOverColumn.value = null
    if (draggingCardId.value && dragSourceColumn.value !== targetCol) {
        emit('update-stage', draggingCardId.value, targetCol as PipelineStage)
    }
    draggingCardId.value = null
    dragSourceColumn.value = null
}

function onDragEnd() {
    draggingCardId.value = null
    dragSourceColumn.value = null
    dragOverColumn.value = null
}
</script>

<style lang="scss" scoped>
.kanban-view {
    &__loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 3rem;
        color: var(--p-text-muted-color);
    }

    &__board {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        min-height: 400px;
    }

    &__column {
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        border: 1px solid var(--p-content-border-color);
        display: flex;
        flex-direction: column;

        &--ideation {
            border-top: 3px solid var(--p-blue-400);
        }

        &--writing {
            border-top: 3px solid var(--p-yellow-400);
        }

        &--ready {
            border-top: 3px solid var(--p-green-400);
        }
    }

    &__column-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        border-bottom: 1px solid var(--p-content-border-color);
    }

    &__column-title {
        font-weight: 600;
        font-size: 0.9rem;
    }

    &__column-cards {
        flex: 1;
        padding: 0.5rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        &--drag-over {
            background: var(--p-primary-50);
        }
    }

    &__card {
        background: var(--p-content-background);
        border: 1px solid var(--p-content-border-color);
        border-radius: var(--p-border-radius);
        padding: 0.6rem 0.75rem;
        cursor: grab;
        transition: box-shadow 0.15s, opacity 0.15s;

        &:hover {
            box-shadow: 0 1px 4px rgb(0 0 0 / 0.08);
        }

        &--dragging {
            opacity: 0.5;
            box-shadow: 0 2px 8px rgb(0 0 0 / 0.12);
        }
    }

    &__card-title {
        font-size: 0.85rem;
        font-weight: 500;
        margin-bottom: 0.3rem;
        line-height: 1.3;
    }

    &__card-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.7rem;
        color: var(--p-text-muted-color);
    }

    &__card-category {
        background: var(--p-surface-100);
        padding: 0.05rem 0.35rem;
        border-radius: 3px;
    }

    &__empty {
        text-align: center;
        padding: 2rem 0.5rem;
        color: var(--p-text-muted-color);
        font-size: 0.8rem;
    }
}
</style>
