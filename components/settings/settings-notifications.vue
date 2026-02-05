<template>
    <div class="settings-notifications">
        <h3 class="settings-section-title">
            {{ $t("pages.settings.notifications.title") }}
        </h3>

        <div v-if="loading" class="flex justify-center p-8">
            <ProgressSpinner />
        </div>

        <div v-else class="settings-form">
            <!-- 订阅状态控制 -->
            <div class="settings-form__field">
                <label>{{ $t("pages.settings.notifications.active_status") }}</label>
                <div class="align-items-center flex gap-4">
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

            <Divider />

            <!-- 分类订阅 -->
            <div class="settings-form__field">
                <label>{{ $t("pages.settings.notifications.categories") }}</label>
                <p class="mb-3 text-secondary text-sm">
                    {{ $t("pages.settings.notifications.subscription_management_desc") }}
                </p>
                <div class="grid">
                    <div
                        v-for="cat in categories"
                        :key="cat.id"
                        class="col-12 lg:col-4 mb-2 md:col-6"
                    >
                        <div class="align-items-center flex">
                            <Checkbox
                                v-model="subscription.subscribedCategoryIds"
                                :input-id="'cat-' + cat.id"
                                name="category"
                                :value="cat.id"
                            />
                            <label :for="'cat-' + cat.id" class="cursor-pointer ml-2">{{ cat.name }}</label>
                        </div>
                    </div>
                </div>
                <div v-if="categories.length === 0" class="italic text-secondary text-sm">
                    {{ $t("common.no_data") }}
                </div>
            </div>

            <Divider />

            <!-- 标签订阅 -->
            <div class="settings-form__field">
                <label>{{ $t("pages.settings.notifications.tags") }}</label>
                <div class="flex flex-wrap gap-2 mt-2">
                    <div
                        v-for="tag in tags"
                        :key="tag.id"
                        class="tag-item"
                    >
                        <ToggleButton
                            v-model="subscription.tagMap[tag.id]"
                            :on-label="tag.name"
                            :off-label="tag.name"
                            size="small"
                        />
                    </div>
                    <div v-if="tags.length === 0" class="italic text-secondary text-sm">
                        {{ $t("common.no_data") }}
                    </div>
                </div>
            </div>

            <Divider />

            <!-- 营销通知 -->
            <div class="settings-form__field">
                <label>{{ $t("pages.settings.notifications.marketing") }}</label>
                <div class="align-items-start flex gap-3 mt-2">
                    <div class="flex-grow-1">
                        <p class="font-bold mb-1">
                            {{ $t("pages.settings.notifications.marketing_enable") }}
                        </p>
                        <p class="text-secondary text-sm">
                            {{ $t("pages.settings.notifications.marketing_desc") }}
                        </p>
                    </div>
                    <ToggleSwitch v-model="subscription.isMarketingEnabled" />
                </div>
            </div>

            <Divider />

            <div class="flex gap-2 justify-content-end mt-4">
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
const { t } = useI18n()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)

const categories = ref<any[]>([])
const tags = ref<any[]>([])

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
            $fetch('/api/categories'),
            $fetch('/api/tags'),
            $fetch('/api/user/subscription'),
        ])

        categories.value = (catsRes as any).data || []
        tags.value = (tagsRes as any).data || []

        if ((subRes as any).data) {
            const data = (subRes as any).data
            subscription.isActive = data.isActive ?? true
            subscription.subscribedCategoryIds = data.subscribedCategoryIds || []
            subscription.subscribedTagIds = data.subscribedTagIds || []
            subscription.isMarketingEnabled = data.isMarketingEnabled ?? true

            // Initialize tagMap
            subscription.tagMap = {}
            tags.value.forEach((tag: any) => {
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
            .filter((tag: any) => subscription.tagMap[tag.id])
            .map((tag: any) => tag.id)

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
.settings-notifications {
    .settings-section-title {
        font-size: 1.25rem;
        font-weight: 500;
        margin-bottom: 1.5rem;
    }
}

.settings-form {
    &__field {
        margin-bottom: 1.5rem;

        label {
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
    }
}

.text-secondary {
    color: var(--p-text-muted-color);
}

.flex-grow-1 {
    flex-grow: 1;
}
</style>
