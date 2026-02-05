<template>
    <div class="marketing-campaign-list">
        <DataTable
            :value="items"
            :loading="loading"
            paginator
            :rows="limit"
            :total-records="total"
            lazy
            class="border-round overflow-hidden shadow-sm"
            @page="onPage($event)"
        >
            <template #header>
                <div class="align-items-center flex justify-content-between">
                    <h3 class="m-0">
                        {{ $t('admin.marketing.campaign_list') }}
                    </h3>
                    <Button
                        icon="pi pi-refresh"
                        text
                        @click="loadData"
                    />
                </div>
            </template>

            <Column field="title" :header="$t('admin.marketing.form.title')" />

            <Column :header="$t('admin.marketing.stats.delivered')">
                <template #body="slotProps">
                    <div class="align-items-center flex">
                        <Tag v-if="slotProps.data.status === 'COMPLETED'" severity="success">
                            {{ $t('admin.marketing.status.COMPLETED') }}
                        </Tag>
                        <Tag v-else-if="slotProps.data.status === 'SENDING'" severity="info">
                            <i class="mr-2 pi pi-spin pi-spinner" /> {{ $t('admin.marketing.status.SENDING') }}
                        </Tag>
                        <Tag v-else :severity="getStatusSeverity(slotProps.data.status)">
                            {{ $t(`admin.marketing.status.${slotProps.data.status}`) }}
                        </Tag>
                    </div>
                </template>
            </Column>

            <Column field="sentAt" :header="$t('common.published_at')">
                <template #body="slotProps">
                    {{ slotProps.data.sentAt ? formatDate(slotProps.data.sentAt) : '-' }}
                </template>
            </Column>

            <Column :header="$t('common.actions')" class="text-right">
                <template #body="slotProps">
                    <div class="flex gap-2 justify-content-end">
                        <Button
                            v-if="slotProps.data.status === 'DRAFT'"
                            v-tooltip.top="$t('admin.marketing.actions.send_now')"
                            icon="pi pi-send"
                            severity="success"
                            size="small"
                            @click="handleSend(slotProps.data.id)"
                        />
                        <Button
                            icon="pi pi-pencil"
                            severity="secondary"
                            size="small"
                            @click="$emit('edit', slotProps.data.id)"
                        />
                    </div>
                </template>
            </Column>

            <template #empty>
                <div class="p-4 text-center text-secondary">
                    {{ $t('common.no_data') }}
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const toast = useToast()
const { formatDate } = useI18nDate()

const items = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const loading = ref(true)

const loadData = async () => {
    loading.value = true
    try {
        const res = await $fetch('/api/admin/marketing/campaigns', {
            query: {
                page: page.value,
                limit: limit.value,
            },
        })
        items.value = (res as any).data.items || []
        total.value = (res as any).data.total || 0
    } catch (e) {
        console.error('Failed to load campaigns:', e)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('common.error_loading'),
            life: 3000,
        })
    } finally {
        loading.value = false
    }
}

const onPage = (event: any) => {
    page.value = event.page + 1
    loadData()
}

const getStatusSeverity = (status: string) => {
    switch (status) {
        case 'COMPLETED': return 'success'
        case 'SENDING': return 'info'
        case 'FAILED': return 'danger'
        case 'DRAFT': return 'secondary'
        default: return 'secondary'
    }
}

const handleSend = async (id: string) => {
    try {
        await $fetch(`/api/admin/marketing/campaigns/${id}/send`, {
            method: 'POST',
        })
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('admin.marketing.actions.send_success'),
            life: 3000,
        })
        loadData()
    } catch (e) {
        console.error('Failed to send campaign:', e)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('admin.marketing.actions.send_failed'),
            life: 3000,
        })
    }
}

onMounted(() => {
    loadData()
})

const emit = defineEmits(['edit'])
defineExpose({ refresh: loadData })
</script>

<style lang="scss" scoped>
.marketing-campaign-list {
    margin-top: 1rem;
}
</style>
