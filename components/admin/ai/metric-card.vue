<template>
    <Card class="ai-metric-card" :class="[`ai-metric-card--${tone}`, {'ai-metric-card--compact': compact}]">
        <template #title>
            <div class="card-header">
                <span class="card-title">{{ label }}</span>
                <i class="icon" :class="icon" />
            </div>
        </template>
        <template #content>
            <div class="card-value" :class="{'card-value--compact': compact}">
                {{ value }}
            </div>
        </template>
    </Card>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    label: string
    value: string | number
    icon: string
    tone?: 'total' | 'completed' | 'failed' | 'processing' | 'quota' | 'cost' | 'success-rate'
    compact?: boolean
}>(), {
    tone: 'total',
    compact: false,
})
</script>

<style lang="scss" scoped>
.ai-metric-card {
    border: none;
    box-shadow: 0 4px 15px rgb(0 0 0 / 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
    border-radius: 12px;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgb(0 0 0 / 0.1);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .card-title {
        font-size: 1rem;
        color: var(--text-color-secondary);
    }

    .icon {
        font-size: 1.5rem;
        opacity: 0.8;
    }

    .card-value {
        font-size: 2.5rem;
        font-weight: 800;
        margin-top: 0.5rem;
    }

    .card-value--compact {
        font-size: 2rem;
    }
}

.ai-metric-card--total .icon { color: var(--primary-color); }
.ai-metric-card--completed .icon { color: var(--green-500); }
.ai-metric-card--failed .icon { color: var(--red-500); }
.ai-metric-card--processing .icon { color: var(--blue-500); }
.ai-metric-card--quota .icon { color: var(--orange-500); }
.ai-metric-card--cost .icon { color: var(--teal-500); }
.ai-metric-card--success-rate .icon { color: var(--cyan-500); }
</style>
