<template>
    <div class="subscription-settings">
        <h3 class="subscription-settings__title">
            {{ $t("pages.settings.notifications.title") }}
        </h3>

        <div v-if="loading" class="subscription-settings__loading">
            <ProgressSpinner />
        </div>

        <div v-else class="subscription-settings__form">
            <!-- 订阅状态控制 -->
            <div class="subscription-settings__section">
                <label class="subscription-settings__label">{{ $t("pages.settings.notifications.active_status") }}</label>
                <div class="subscription-settings__status-control">
                    <Tag :severity="subscription.isActive ? 'success' : 'warn'">
                        {{ subscription.isActive ? $t("pages.settings.notifications.active") : $t("pages.settings.notifications.inactive") }}
                    </Tag>
                    <Button
                        v-if="subscription.isActive"
                        :label="$t('pages.settings.notifications.pause_subscription')"
                        size="small"
                        variant="outlined"
                        severity="secondary"
                        @click="toggleSubscription(false)"
                    />
                    <Button
                        v-else
                        :label="$t('pages.settings.notifications.resume_subscription')"
                        size="small"
                        severity="primary"
                        @click="toggleSubscription(true)"
                    />
                </div>
            </div>

            <Divider v-if="categories.length > 0" class="subscription-settings__divider" />

            <!-- 分类订阅 -->
            <div v-if="categories.length > 0" class="subscription-settings__section">
                <label class="subscription-settings__label">{{ $t("pages.settings.notifications.categories") }}</label>
                <p class="subscription-settings__description">
                    {{ $t("pages.settings.notifications.subscription_management_desc") }}
                </p>
                <div class="subscription-settings__grid">
                    <div
                        v-for="cat in categories"
                        :key="cat.id"
                        class="subscription-settings__grid-item"
                    >
                        <div class="subscription-settings__checkbox-group">
                            <Checkbox
                                v-model="subscription.subscribedCategoryIds"
                                :input-id="'cat-' + cat.id"
                                name="category"
                                :value="cat.id"
                            />
                            <label :for="'cat-' + cat.id" class="subscription-settings__checkbox-label">{{ cat.name }}</label>
                        </div>
                    </div>
                </div>
            </div>

            <Divider v-if="tags.length > 0" class="subscription-settings__divider" />

            <!-- 标签订阅 -->
            <div v-if="tags.length > 0" class="subscription-settings__section">
                <label class="subscription-settings__label">{{ $t("pages.settings.notifications.tags") }}</label>
                <div class="subscription-settings__tags">
                    <div
                        v-for="tag in tags"
                        :key="tag.id"
                        class="subscription-settings__tag-item"
                    >
                        <ToggleButton
                            v-model="subscription.tagMap[tag.id]"
                            :on-label="tag.name"
                            :off-label="tag.name"
                            size="small"
                        />
                    </div>
                </div>
            </div>

            <Divider class="subscription-settings__divider" />

            <!-- 营销通知 -->
            <div class="subscription-settings__section">
                <label class="subscription-settings__label">{{ $t("pages.settings.notifications.marketing") }}</label>
                <div class="subscription-settings__marketing-control">
                    <div class="subscription-settings__marketing-info">
                        <p class="subscription-settings__marketing-title">
                            {{ $t("pages.settings.notifications.marketing_enable") }}
                        </p>
                        <p class="subscription-settings__description">
                            {{ $t("pages.settings.notifications.marketing_desc") }}
                        </p>
                    </div>
                    <ToggleSwitch v-model="subscription.isMarketingEnabled" />
                </div>
            </div>

            <Divider class="subscription-settings__divider" />

            <div class="subscription-settings__actions">
                <Button
                    :label="$t('pages.settings.profile.save')"
                    :loading="saving"
                    @click="handleSave"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Category } from '@/types/category'
import type { Tag } from '@/types/tag'
import type { ApiResponse } from '@/types/api'
import type { PaginatedData } from '@/types/marketing'

const { t } = useI18n()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)

const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])

const subscription = reactive({
    isActive: true,
    subscribedCategoryIds: [] as string[],
    subscribedTagIds: [] as string[],
    tagMap: {} as Record<string, boolean>,
    isMarketingEnabled: true,
})

// 初始化数据
const loadData = async () => {
    loading.value = true
    try {
        const [catsRes, tagsRes, subRes] = await Promise.all([
            $fetch<ApiResponse<PaginatedData<Category>>>('/api/categories', { query: { limit: 500 } }),
            $fetch<ApiResponse<PaginatedData<Tag>>>('/api/tags', { query: { limit: 500 } }),
            $fetch<ApiResponse<any>>('/api/user/subscription'),
        ])

        categories.value = catsRes.data.items || []
        tags.value = tagsRes.data.items || []

        if (subRes.data) {
            const data = subRes.data
            subscription.isActive = data.isActive ?? true
            subscription.subscribedCategoryIds = data.subscribedCategoryIds || []
            subscription.subscribedTagIds = data.subscribedTagIds || []
            subscription.isMarketingEnabled = data.isMarketingEnabled ?? true

            // Initialize tagMap
            subscription.tagMap = {}
            tags.value.forEach((tag) => {
                subscription.tagMap[tag.id] = subscription.subscribedTagIds.includes(tag.id)
            })
        }
    } catch (error) {
        console.error('Failed to load settings:', error)
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

onMounted(() => {
    loadData()
})

const toggleSubscription = (val: boolean) => {
    subscription.isActive = val
}

const handleSave = async () => {
    saving.value = true
    try {
        // Convert tagMap back to array
        const selectedTagIds = tags.value
            .filter((tag) => subscription.tagMap[tag.id])
            .map((tag) => tag.id)

        await $fetch('/api/user/subscription', {
            method: 'PUT' as any,
            body: {
                isActive: subscription.isActive,
                subscribedCategoryIds: subscription.subscribedCategoryIds,
                subscribedTagIds: selectedTagIds,
                isMarketingEnabled: subscription.isMarketingEnabled,
            },
        })

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.settings.notifications.save_success'),
            life: 3000,
        })
    } catch (error) {
        console.error('Failed to save settings:', error)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('pages.settings.notifications.save_failed'),
            life: 3000,
        })
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;
@use "@/styles/mixins" as *;

.subscription-settings {
    &__title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: $spacing-xl;
        color: var(--p-text-color);
    }

    &__loading {
        display: flex;
        justify-content: center;
        padding: $spacing-xl;
    }

    &__section {
        margin-bottom: $spacing-lg;
    }

    &__label {
        display: block;
        font-weight: 600;
        margin-bottom: $spacing-sm;
        color: var(--p-text-color);
    }

    &__description {
        color: var(--p-text-color-secondary);
        font-size: 0.875rem;
        margin-bottom: $spacing-md;
        line-height: $line-height-relaxed;
    }

    &__status-control {
        display: flex;
        align-items: center;
        gap: $spacing-md;
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: $spacing-sm;
    }

    &__grid-item {
        margin-bottom: $spacing-xs;
    }

    &__checkbox-group {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
    }

    &__checkbox-label {
        cursor: pointer;
        color: var(--p-text-color);
        user-select: none;
    }

    &__tags {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-sm;
        margin-top: $spacing-xs;
    }

    &__marketing-control {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: $spacing-lg;
    }

    &__marketing-info {
        flex: 1;
    }

    &__marketing-title {
        font-weight: 600;
        margin-bottom: $spacing-xs;
        color: var(--p-text-color);
    }

    &__divider {
        margin: $spacing-xl 0;
        border-color: var(--p-surface-border);
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        margin-top: $spacing-xl;
    }
}
</style>
