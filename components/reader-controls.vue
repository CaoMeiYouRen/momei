<template>
    <div class="reader-controls">
        <!-- 设置面板 -->
        <div v-if="settings.active && isPanelExpanded" class="reader-controls__panel">
            <h3 class="font-bold mb-4 mt-0 text-lg">
                {{ $t('components.reader.settings_title') }}
            </h3>

            <!-- 主题选择 -->
            <div class="reader-controls__section">
                <label>{{ $t('components.reader.theme') }}</label>
                <div class="reader-controls__themes">
                    <button
                        v-for="t in filteredThemes"
                        :key="t.id"
                        :class="['reader-controls__theme-btn', `theme-${t.id}`, {'reader-controls__theme-btn--active': settings.theme === t.id}]"
                        @click="settings.theme = t.id"
                    >
                        {{ $t(`components.reader.theme_${t.id.replace('-', '')}`) }}
                    </button>
                </div>
            </div>

            <!-- 字号调节 -->
            <div class="reader-controls__section">
                <label>{{ $t('components.reader.font_size') }}: {{ settings.fontSize }}px</label>
                <Slider
                    v-model="settings.fontSize"
                    :min="14"
                    :max="26"
                    :step="1"
                    class="w-full"
                />
            </div>

            <!-- 行高调节 -->
            <div class="reader-controls__section">
                <label>{{ $t('components.reader.line_height') }}: {{ settings.lineHeight }}</label>
                <Slider
                    v-model="settings.lineHeight"
                    :min="1.4"
                    :max="2.2"
                    :step="0.1"
                    class="w-full"
                />
            </div>

            <!-- 页宽调节 -->
            <div class="reader-controls__section">
                <label>{{ $t('components.reader.page_width') }}: {{ settings.width }}px</label>
                <Slider
                    v-model="settings.width"
                    :min="600"
                    :max="1000"
                    :step="50"
                    class="w-full"
                />
            </div>

            <div class="flex justify-end mt-4">
                <Button
                    icon="pi pi-refresh"
                    severity="secondary"
                    text
                    size="small"
                    @click="resetSettings"
                />
            </div>
        </div>

        <div class="reader-controls__actions">
            <!-- 退出沉浸模式按钮 (仅在激活时显示) -->
            <Button
                v-if="settings.active"
                v-tooltip.left="$t('components.reader.mode_exit')"
                icon="pi pi-times"
                severity="secondary"
                rounded
                class="reader-controls__toggle"
                @click="toggleReaderMode(false)"
            />

            <!-- 设置面板切换 / 开启沉浸阅读 -->
            <Button
                v-tooltip.left="settings.active ? $t('components.reader.settings_title') : $t('components.reader.mode_enter')"
                :icon="settings.active ? 'pi pi-cog' : 'pi pi-book'"
                :severity="settings.active && isPanelExpanded ? 'primary' : 'secondary'"
                rounded
                class="reader-controls__toggle"
                @click="handleToggle"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useReaderMode, type ReaderTheme } from '@/composables/use-reader-mode'

const { settings, toggleReaderMode, isDark } = useReaderMode()

const isPanelExpanded = ref(false)

const handleToggle = () => {
    if (settings.value.active) {
        isPanelExpanded.value = !isPanelExpanded.value
    } else {
        toggleReaderMode(true)
    }
}

// 监听状态变化，退出模式时重置面板展开状态
watch(() => settings.value.active, (active) => {
    if (!active) {
        isPanelExpanded.value = false
    }
})

const themes: { id: ReaderTheme }[] = [
    { id: 'default' },
    { id: 'sepia' },
    { id: 'eye-care' },
    { id: 'dark-night' },
]

const filteredThemes = computed(() => {
    // 亮色模式下隐藏深色阅读主题
    if (!isDark.value) {
        return themes.filter((t) => t.id !== 'dark-night')
    }
    return themes
})

const resetSettings = () => {
    settings.value = {
        active: true,
        fontSize: 18,
        lineHeight: 1.8,
        width: 800,
        theme: 'default',
    }
}

// 监听 Esc 键退出
const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && settings.value.active) {
        if (isPanelExpanded.value) {
            isPanelExpanded.value = false
        } else {
            toggleReaderMode(false)
        }
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleEsc)
})
</script>
