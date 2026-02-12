<template>
    <div class="reader-controls">
        <!-- 切换按钮 -->
        <Button
            v-tooltip.left="settings.active ? $t('components.reader.mode_exit') : $t('components.reader.mode_enter')"
            :icon="settings.active ? 'pi pi-times' : 'pi pi-book'"
            severity="secondary"
            rounded
            class="reader-controls__toggle"
            @click="toggleReaderMode()"
        />

        <!-- 设置面板 -->
        <div v-if="settings.active" class="reader-controls__panel">
            <h3 class="font-bold mb-4 mt-0 text-lg">
                {{ $t('components.reader.settings_title') }}
            </h3>

            <!-- 主题选择 -->
            <div class="reader-controls__section">
                <label>{{ $t('components.reader.theme') }}</label>
                <div class="reader-controls__themes">
                    <button
                        v-for="t in themes"
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
    </div>
</template>

<script setup lang="ts">
import { useReaderMode, type ReaderTheme } from '@/composables/use-reader-mode'

const { settings, toggleReaderMode } = useReaderMode()

const themes: { id: ReaderTheme }[] = [
    { id: 'default' },
    { id: 'sepia' },
    { id: 'eye-care' },
    { id: 'dark-night' },
]

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
        toggleReaderMode(false)
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleEsc)
})
</script>
