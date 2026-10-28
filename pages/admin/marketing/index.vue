<template>
    <div class="admin-marketing">
        <AdminPageHeader :title="$t('pages.admin.marketing.title')">
            <template #actions>
                <!-- `icon="pi pi-plus"` → `#icon` 插槽 + lucide（§6.2 图标行）。 -->
                <CaomeiButton @click="showCreateDialog = true">
                    <template #icon>
                        <Plus :size="16" />
                    </template>
                    {{ $t('pages.admin.marketing.create_btn') }}
                </CaomeiButton>
            </template>
        </AdminPageHeader>

        <div class="admin-marketing__stats">
            <Card class="admin-marketing__stat-card">
                <template #content>
                    <div class="admin-marketing__stat-content">
                        <div class="admin-marketing__stat-info">
                            <span class="admin-marketing__stat-label">{{ $t('pages.admin.marketing.stats.total_subscribers') }}</span>
                            <div class="admin-marketing__stat-value">
                                {{ stats.totalSubscribers || 0 }}
                            </div>
                        </div>
                        <div class="admin-marketing__stat-icon admin-marketing__stat-icon--blue">
                            <i class="pi pi-users" />
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="admin-marketing__stat-card">
                <template #content>
                    <div class="admin-marketing__stat-content">
                        <div class="admin-marketing__stat-info">
                            <span class="admin-marketing__stat-label">{{ $t('pages.admin.marketing.stats.marketing_enabled') }}</span>
                            <div class="admin-marketing__stat-value">
                                {{ stats.marketingSubscribers || 0 }}
                            </div>
                        </div>
                        <div class="admin-marketing__stat-icon admin-marketing__stat-icon--green">
                            <i class="pi pi-envelope" />
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="admin-marketing__stat-card">
                <template #content>
                    <div class="admin-marketing__stat-content">
                        <div class="admin-marketing__stat-info">
                            <span class="admin-marketing__stat-label">{{ $t('pages.admin.marketing.stats.total_campaigns') }}</span>
                            <div class="admin-marketing__stat-value">
                                {{ stats.totalCampaigns || 0 }}
                            </div>
                        </div>
                        <div class="admin-marketing__stat-icon admin-marketing__stat-icon--purple">
                            <i class="pi pi-send" />
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <div class="admin-marketing__list">
            <MarketingCampaignList
                ref="listRef"
                @edit="handleEdit"
                @changed="loadStats"
            />
        </div>

        <!-- 浮层宽度走 `:style` 而非类选择器：`Dialog` 由 PrimeVue 渲染到 body，页面 scoped 样式
             无法命中其 `.p-dialog` 根元素（原 `&__dialog` 规则长期失效，宽度遂随内容固有宽度漂移）。
             680px 对齐 parity 参考态（迁移前 PrimeVue 表单实测 679px），与 taxonomy 弹窗同一处置通道。 -->
        <Dialog
            v-model:visible="showCreateDialog"
            :header="currentCampaignId ? $t('pages.admin.marketing.edit_campaign') : $t('pages.admin.marketing.create_campaign')"
            modal
            dismissable-mask
            class="admin-marketing__dialog"
            :style="dialogStyle"
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
import { Plus } from '@lucide/vue'
import AdminPageHeader from '@/components/admin-page-header.vue'
import MarketingCampaignForm from '@/components/admin/marketing-campaign-form.vue'
import MarketingCampaignList from '@/components/admin/marketing-campaign-list.vue'

definePageMeta({
    middleware: 'admin',
})

/** 弹窗宽度按 parity 参考态固定（迁移前 PrimeVue 表单实测 679px）：caomei 字段更窄，
 *  不显式声明时宽度会随内容固有宽度漂移到 542px，整窗错位。 */
const dialogStyle = { width: 'min(90vw, 680px)' }

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
@use "@/styles/variables" as *;

.admin-marketing {
    padding: $spacing-md;

    &__stats {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: $spacing-md;
        margin-bottom: $spacing-xl;

        @media screen and (width >= 768px) {
            grid-template-columns: repeat(2, 1fr);
        }

        @media screen and (width >= 1024px) {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    &__stat-card {
        height: 100%;

        :deep(.p-card-body) {
            padding: $spacing-lg;
        }
    }

    &__stat-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__stat-info {
        display: flex;
        flex-direction: column;
    }

    &__stat-label {
        font-weight: 500;
        margin-bottom: $spacing-sm;
        color: var(--p-text-color-secondary);
        font-size: 0.875rem;
    }

    &__stat-value {
        font-weight: 600;
        color: var(--p-text-color);
        font-size: 1.5rem;
    }

    &__stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        border-radius: $border-radius-md;
        font-size: 1.25rem;

        &--blue {
            background-color: color-mix(in srgb, var(--p-blue-400), transparent 90%);
            color: var(--p-blue-500);
        }

        &--green {
            background-color: color-mix(in srgb, var(--p-green-400), transparent 90%);
            color: var(--p-green-500);
        }

        &--purple {
            background-color: color-mix(in srgb, var(--p-purple-400), transparent 90%);
            color: var(--p-purple-500);
        }
    }

    &__list {
        margin-top: $spacing-lg;
    }
}
</style>
