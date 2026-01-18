<template>
    <div v-if="settings" class="admin-theme-settings">
        <AdminPageHeader :title="$t('pages.admin.settings.theme.title')">
            <template #actions>
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-check"
                    :loading="loading"
                    @click="saveTheme"
                />
            </template>
        </AdminPageHeader>

        <div class="grid mt-4">
            <div class="col-12 lg:col-8">
                <Panel :header="$t('pages.admin.settings.theme.preview')" class="mb-4">
                    <div class="border-round p-4 preview-container surface-ground">
                        <ArticleCard
                            :post="{
                                id: 1,
                                title: '预览文章标题 (Preview Title)',
                                summary: '这是一个预览摘要，用于展示主题配置后的实时效果。您可以尝试更改主色调、圆角或背景来观察变化。',
                                cover: settings?.theme_logo_url || '',
                                createdAt: new Date().toISOString(),
                                tags: [{name: 'Theme'}, {name: 'Preview'}],
                                viewCount: 1234,
                                commentCount: 56,
                                category: {name: 'Demo'}
                            } as any"
                        />
                    </div>
                </Panel>

                <Panel :header="$t('pages.admin.settings.theme.background')" class="mb-4">
                    <div class="flex flex-column gap-4">
                        <div class="flex flex-column gap-2">
                            <label class="font-bold">{{ $t('pages.admin.settings.theme.background_type') }}</label>
                            <SelectButton
                                v-model="settings.theme_background_type"
                                :options="backgroundOptions"
                                option-label="label"
                                option-value="value"
                                :allow-empty="false"
                            />
                        </div>

                        <div v-if="settings.theme_background_type === 'color'" class="flex flex-column gap-2">
                            <label class="font-bold">{{ $t('pages.admin.settings.theme.background_color') }}</label>
                            <div class="align-items-center flex gap-3">
                                <ColorPicker v-model="settings.theme_background_value" format="hex" />
                                <InputText
                                    v-model="settings.theme_background_value"
                                    placeholder="#ffffff"
                                    class="flex-1"
                                />
                            </div>
                        </div>

                        <div v-if="settings.theme_background_type === 'image'" class="flex flex-column gap-2">
                            <label class="font-bold">{{ $t('pages.admin.settings.theme.background_image') }} URL</label>
                            <InputGroup>
                                <InputGroupAddon>
                                    <i class="pi pi-image" />
                                </InputGroupAddon>
                                <InputText v-model="settings.theme_background_value" placeholder="https://example.com/background.jpg" />
                            </InputGroup>
                        </div>
                    </div>
                </Panel>
            </div>

            <div class="col-12 lg:col-4">
                <Panel :header="$t('common.settings')" class="mb-4">
                    <div class="flex flex-column gap-4">
                        <!-- 预设 -->
                        <div class="flex flex-column gap-2">
                            <label class="font-bold">{{ $t('pages.admin.settings.theme.preset') }}</label>
                            <Dropdown
                                v-model="settings.theme_preset"
                                :options="presetOptions"
                                option-label="label"
                                option-value="value"
                                class="w-full"
                                @change="onPresetChange"
                            />
                        </div>

                        <!-- 主色调 -->
                        <div class="flex flex-column gap-2">
                            <label class="font-bold">{{ $t('pages.admin.settings.theme.primary_color') }}</label>
                            <div class="align-items-center flex gap-3">
                                <ColorPicker v-model="settings.theme_primary_color" format="hex" />
                                <InputText
                                    v-model="settings.theme_primary_color"
                                    class="flex-1"
                                    placeholder="#3B82F6"
                                />
                            </div>
                        </div>

                        <!-- 圆角 -->
                        <div class="flex flex-column gap-2">
                            <label class="font-bold">{{ $t('pages.admin.settings.theme.border_radius') }}</label>
                            <InputGroup>
                                <InputText v-model="settings.theme_border_radius" placeholder="0.5rem" />
                                <InputGroupAddon>rem/px</InputGroupAddon>
                            </InputGroup>
                        </div>

                        <!-- Logo -->
                        <div class="flex flex-column gap-2">
                            <label class="font-bold">{{ $t('pages.admin.settings.theme.logo') }} URL</label>
                            <InputText v-model="settings.theme_logo_url" placeholder="/logo.png" />
                        </div>

                        <!-- Favicon -->
                        <div class="flex flex-column gap-2">
                            <label class="font-bold">{{ $t('pages.admin.settings.theme.favicon') }} URL</label>
                            <InputText v-model="settings.theme_favicon_url" placeholder="/favicon.ico" />
                        </div>

                        <Divider />

                        <!-- 哀悼模式 -->
                        <div class="flex flex-column gap-2">
                            <div class="align-items-center flex justify-content-between">
                                <label class="font-bold">{{ $t('pages.admin.settings.theme.mourning_mode') }}</label>
                                <ToggleSwitch v-model="mourningModeRef" />
                            </div>
                            <small class="text-color-secondary">
                                {{ $t('pages.admin.settings.theme.mourning_mode_hint') }}
                            </small>
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/use-theme'
import AdminPageHeader from '@/components/admin-page-header.vue'
import ArticleCard from '@/components/article-card.vue'

definePageMeta({
    layout: 'default',
})

const { t } = useI18n()
const toast = useToast()
const { settings, applyTheme } = useTheme()
const loading = ref(false)

// 转换 mourning_mode 为布尔值用于 ToggleSwitch
const mourningModeRef = computed({
    get: () => {
        const val = settings.value?.theme_mourning_mode
        return val === true || val === 'true'
    },
    set: (val: boolean) => {
        if (settings.value) {
            settings.value.theme_mourning_mode = val
        }
    },
})

const backgroundOptions = computed(() => [
    { label: t('pages.admin.settings.theme.background_none'), value: 'none' },
    { label: t('pages.admin.settings.theme.background_color'), value: 'color' },
    { label: t('pages.admin.settings.theme.background_image'), value: 'image' },
])

const presetOptions = computed(() => [
    { label: t('pages.admin.settings.theme.presets.default'), value: 'default' },
    { label: t('pages.admin.settings.theme.presets.geek'), value: 'geek' },
    { label: t('pages.admin.settings.theme.presets.warm'), value: 'warm' },
])

// 监听设置变化以进行实时预览
watch(settings, () => {
    applyTheme()
}, { deep: true })

const onPresetChange = (e: any) => {
    const preset = e.value
    if (!settings.value) {
        return
    }
    if (preset === 'geek') {
        settings.value.theme_primary_color = '#10B981' // Emerald
        settings.value.theme_border_radius = '0px'
    } else if (preset === 'warm') {
        settings.value.theme_primary_color = '#F59E0B' // Amber
        settings.value.theme_border_radius = '1rem'
    } else if (preset === 'default') {
        settings.value.theme_primary_color = '#3B82F6' // Blue
        settings.value.theme_border_radius = '0.5rem'
    }
}

const saveTheme = async () => {
    if (!settings.value) {
        return
    }
    loading.value = true
    try {
        const payload = { ...settings.value }

        // 确保 mourning_mode 是布尔值或字符串 'true'/'false'
        // API 已经支持 union，这里我们直接传递实时的布尔值即可

        await $fetch('/api/admin/settings/theme', {
            method: 'PUT',
            body: payload,
        })

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.settings.theme.save_success'),
            life: 3000,
        })
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || t('common.error'),
            life: 5000,
        })
    } finally {
        loading.value = false
    }
}

// 页面离开时如果未保存，可能需要提示，这里暂时不实现复杂的变更检测
</script>

<style lang="scss" scoped>
.preview-container {
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;

  // 模拟 body 背景预览
  background-attachment: scroll !important;
}

:deep(.p-colorpicker) {
  width: 2rem;
  height: 2rem;
}

:deep(.p-inputtext) {
  width: 100%;
}
</style>
