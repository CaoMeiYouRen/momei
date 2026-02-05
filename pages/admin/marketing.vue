<template>
    <div class="admin-marketing-page">
        <AdminPageHeader :title="$t('admin.marketing.title')">
            <template #actions>
                <Button
                    :label="$t('admin.marketing.create_btn')"
                    icon="pi pi-plus"
                    @click="showCreateDialog = true"
                />
            </template>
        </AdminPageHeader>

        <div class="grid mb-6">
            <div class="col-12 lg:col-3 md:col-6">
                <Card class="h-full stats-card">
                    <template #content>
                        <div class="align-items-center flex justify-content-between">
                            <div>
                                <span class="block font-medium mb-3 text-secondary">{{ $t('admin.marketing.stats.total_subscribers') }}</span>
                                <div class="font-medium text-900 text-xl">
                                    {{ stats.totalSubscribers || 0 }}
                                </div>
                            </div>
                            <div class="align-items-center bg-blue-100 border-round flex justify-content-center" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-users text-blue-500 text-xl" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
            <div class="col-12 lg:col-3 md:col-6">
                <Card class="h-full stats-card">
                    <template #content>
                        <div class="align-items-center flex justify-content-between">
                            <div>
                                <span class="block font-medium mb-3 text-secondary">{{ $t('admin.marketing.stats.marketing_enabled') }}</span>
                                <div class="font-medium text-900 text-xl">
                                    {{ stats.marketingSubscribers || 0 }}
                                </div>
                            </div>
                            <div class="align-items-center bg-green-100 border-round flex justify-content-center" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-envelope text-green-500 text-xl" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
            <div class="col-12 lg:col-3 md:col-6">
                <Card class="h-full stats-card">
                    <template #content>
                        <div class="align-items-center flex justify-content-between">
                            <div>
                                <span class="block font-medium mb-3 text-secondary">{{ $t('admin.marketing.stats.total_campaigns') }}</span>
                                <div class="font-medium text-900 text-xl">
                                    {{ stats.totalCampaigns || 0 }}
                                </div>
                            </div>
                            <div class="align-items-center bg-purple-100 border-round flex justify-content-center" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-send text-purple-500 text-xl" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <MarketingCampaignList
            ref="listRef"
            @edit="handleEdit"
        />

        <Dialog
            v-model:visible="showCreateDialog"
            :header="currentCampaignId ? $t('admin.marketing.edit_campaign') : $t('admin.marketing.create_campaign')"
            modal
            dismissable-mask
            class="max-w-4xl w-full"
            :breakpoints="{'960px': '75vw', '641px': '100vw'}"
        >
            <MarketingCampaignForm
                :campaign-id="currentCampaignId"
                @save="handleSave"
                @cancel="showCreateDialog = false"
            />
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import AdminPageHeader from '@/components/admin-page-header.vue'
import MarketingCampaignForm from '@/components/admin/marketing-campaign-form.vue'
import MarketingCampaignList from '@/components/admin/marketing-campaign-list.vue'

definePageMeta({
    middleware: 'admin',
})

const stats = ref<any>({})
const showCreateDialog = ref(false)
const currentCampaignId = ref<string | null>(null)
const listRef = ref<any>(null)

const loadStats = async () => {
    try {
        const res = await $fetch('/api/admin/marketing/stats')
        stats.value = (res as any).data || {}
    } catch (e) {
        console.error('Failed to load marketing stats:', e)
    }
}

const handleEdit = (id: string) => {
    currentCampaignId.value = id
    showCreateDialog.value = true
}

const handleSave = () => {
    showCreateDialog.value = false
    currentCampaignId.value = null
    listRef.value?.refresh()
    loadStats()
}

onMounted(() => {
    loadStats()
})

watch(showCreateDialog, (val) => {
    if (!val) {
        currentCampaignId.value = null
    }
})
</script>

<style lang="scss" scoped>
.admin-marketing-page {
    padding: 1rem;
}

.stats-card {
    :deep(.p-card-body) {
        padding: 1.5rem;
    }
}

.text-secondary {
    color: var(--p-text-muted-color);
}
</style>
