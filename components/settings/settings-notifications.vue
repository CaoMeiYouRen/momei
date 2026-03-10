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
                                v-model="subscription.selectedCategoryIds"
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
                            v-model="subscription.selectedTagMap[tag.id]"
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

            <div class="subscription-settings__section">
                <label class="subscription-settings__label">{{ $t("pages.settings.notifications.web_push") }}</label>
                <p class="subscription-settings__description">
                    {{ $t("pages.settings.notifications.web_push_desc") }}
                </p>

                <Message
                    :severity="browserStatus.severity"
                    :closable="false"
                    class="subscription-settings__browser-message"
                >
                    <div class="subscription-settings__browser-status">
                        <div class="subscription-settings__browser-copy">
                            <strong>{{ $t("pages.settings.notifications.browser_status") }}</strong>
                            <span>{{ browserStatus.text }}</span>
                        </div>
                        <Button
                            v-if="browserStatus.actionable"
                            :label="$t('pages.settings.notifications.enable_browser_push')"
                            size="small"
                            :loading="enablingBrowserPush"
                            @click="handleEnableBrowserPush"
                        />
                    </div>
                </Message>

                <div class="subscription-settings__browser-grid">
                    <div
                        v-for="type in webPushTypes"
                        :key="type"
                        class="subscription-settings__browser-item"
                    >
                        <div class="subscription-settings__browser-item-copy">
                            <span class="subscription-settings__browser-item-title">
                                {{ $t(`pages.settings.notifications.browser_types.${type}`) }}
                            </span>
                            <small class="subscription-settings__field-help">
                                {{ $t(`pages.settings.notifications.browser_type_desc.${type}`) }}
                            </small>
                        </div>
                        <ToggleSwitch
                            v-model="browserNotificationSettings[type]"
                            :disabled="browserSettingsDisabled"
                        />
                    </div>
                </div>
            </div>

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
import { computed } from 'vue'
import type { Category } from '@/types/category'
import type { Tag } from '@/types/tag'
import type { ApiResponse } from '@/types/api'
import type { PaginatedData } from '@/types/marketing'

import type { Subscriber } from '@/types/subscriber'
import { NotificationChannel, NotificationType } from '@/utils/shared/notification'

const { t, locale } = useI18n()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const enablingBrowserPush = ref(false)
const { siteConfig, fetchSiteConfig } = useMomeiConfig()
const { browserPermission, browserPushReady, isBrowserPushSupported, enableBrowserPush } = useNotifications()

const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const webPushTypes = [
    NotificationType.COMMENT_REPLY,
    NotificationType.SYSTEM,
    NotificationType.SECURITY,
] as const

const browserNotificationSettings = reactive<Record<string, boolean>>({
    [NotificationType.COMMENT_REPLY]: true,
    [NotificationType.SYSTEM]: true,
    [NotificationType.SECURITY]: true,
})

const browserSettingsDisabled = computed(() => {
    return !siteConfig.value.webPushEnabled || !siteConfig.value.webPushPublicKey || !isBrowserPushSupported.value
})

const browserStatus = computed(() => {
    if (!siteConfig.value.webPushEnabled || !siteConfig.value.webPushPublicKey) {
        return {
            severity: 'secondary' as const,
            text: t('pages.settings.notifications.browser_status_site_disabled'),
            actionable: false,
        }
    }

    if (!isBrowserPushSupported.value) {
        return {
            severity: 'warn' as const,
            text: t('pages.settings.notifications.browser_status_unsupported'),
            actionable: false,
        }
    }

    if (browserPermission.value === 'granted') {
        return {
            severity: 'success' as const,
            text: t('pages.settings.notifications.browser_status_granted'),
            actionable: false,
        }
    }

    if (browserPermission.value === 'denied') {
        return {
            severity: 'warn' as const,
            text: t('pages.settings.notifications.browser_status_denied'),
            actionable: false,
        }
    }

    return {
        severity: 'info' as const,
        text: t('pages.settings.notifications.browser_status_default'),
        actionable: browserPushReady.value,
    }
})

const subscription = reactive({
    isActive: true,
    selectedCategoryIds: [] as string[], // 存储当前显示的分类 ID (聚合后的)
    selectedTagMap: {} as Record<string, boolean>, // 存储当前显示的标签选中状态
    isMarketingEnabled: true,
})

// 初始化数据
const loadData = async () => {
    loading.value = true
    try {
        const [catsRes, tagsRes, subRes, notificationSettingsRes] = await Promise.all([
            $fetch<ApiResponse<PaginatedData<Category>>>('/api/categories', {
                query: { limit: 500, aggregate: true, language: locale.value },
            }),
            $fetch<ApiResponse<PaginatedData<Tag>>>('/api/tags', {
                query: { limit: 500, aggregate: true, language: locale.value },
            }),
            $fetch<ApiResponse<Subscriber>>('/api/user/subscription'),
            $fetch<{ data: Array<{ type: NotificationType, channel: NotificationChannel, isEnabled: boolean }> }>('/api/user/notifications/settings'),
            fetchSiteConfig(),
        ])

        categories.value = catsRes.data.items || []
        tags.value = tagsRes.data.items || []

        if (subRes.data) {
            const data = subRes.data
            subscription.isActive = data.isActive ?? true
            subscription.isMarketingEnabled = data.isMarketingEnabled ?? true

            const serverCategoryIds = data.subscribedCategoryIds || []
            const serverTagIds = data.subscribedTagIds || []

            // 根据聚类的 ID 初始化本地展示状态
            subscription.selectedCategoryIds = categories.value
                .filter((cat) => {
                    const clusterIds = cat.translations?.map((t) => t.id) || [cat.id]
                    return clusterIds.some((id) => serverCategoryIds.includes(id))
                })
                .map((cat) => cat.id)

            subscription.selectedTagMap = {}
            tags.value.forEach((tag) => {
                const clusterIds = tag.translations?.map((t) => t.id) || [tag.id]
                subscription.selectedTagMap[tag.id] = clusterIds.some((id) => serverTagIds.includes(id))
            })
        }

        notificationSettingsRes.data
            .filter((item) => item.channel === NotificationChannel.WEB_PUSH && webPushTypes.includes(item.type))
            .forEach((item) => {
                browserNotificationSettings[item.type] = item.isEnabled
            })
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

const handleEnableBrowserPush = async () => {
    enablingBrowserPush.value = true

    try {
        await enableBrowserPush()
    } finally {
        enablingBrowserPush.value = false
    }
}

const handleSave = async () => {
    saving.value = true
    try {
        // 将选中的聚合 ID 展开为全语言 ID 列表
        const finalCategoryIds = new Set<string>()
        categories.value.forEach((cat) => {
            if (subscription.selectedCategoryIds.includes(cat.id)) {
                cat.translations?.forEach((t) => finalCategoryIds.add(t.id))
                finalCategoryIds.add(cat.id)
            }
        })

        const finalTagIds = new Set<string>()
        tags.value.forEach((tag) => {
            if (subscription.selectedTagMap[tag.id]) {
                tag.translations?.forEach((t) => finalTagIds.add(t.id))
                finalTagIds.add(tag.id)
            }
        })

        await Promise.all([
            $fetch('/api/user/subscription', {
                method: 'PUT' as any,
                body: {
                    isActive: subscription.isActive,
                    subscribedCategoryIds: Array.from(finalCategoryIds),
                    subscribedTagIds: Array.from(finalTagIds),
                    isMarketingEnabled: subscription.isMarketingEnabled,
                },
            }),
            $fetch('/api/user/notifications/settings', {
                method: 'PUT' as any,
                body: webPushTypes.map((type) => ({
                    type,
                    channel: NotificationChannel.WEB_PUSH,
                    isEnabled: browserNotificationSettings[type],
                })),
            }),
        ])

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

    &__browser-message {
        margin-bottom: $spacing-md;
    }

    &__browser-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: $spacing-md;

        @media (width <= 768px) {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    &__browser-copy {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
        line-height: $line-height-relaxed;
    }

    &__browser-grid {
        display: flex;
        flex-direction: column;
        gap: $spacing-md;
    }

    &__browser-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: $spacing-lg;
        padding: $spacing-md;
        border: 1px solid var(--p-surface-border);
        border-radius: $border-radius-md;
        background: var(--p-surface-0);
    }

    &__browser-item-copy {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
    }

    &__browser-item-title {
        font-weight: 600;
        color: var(--p-text-color);
    }

    &__field-help {
        color: var(--p-text-color-secondary);
        line-height: $line-height-relaxed;
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
