<template>
    <!--
      过渡组件：同一文件内按路由择库。
      - 已迁移路由（`lib/ui-library.ts` 登记）：渲染 caomei-ui `InputGroup` + `Input` + `Button`；
      - 未迁移路由（公开页 `friend-links`、`general-settings`、`post-editor-media-settings`、
        `commercial-link-dialog`）：回退到 V1，避免这些页面被被动改变。
      外壳（类名 / 拖放 / 隐藏 input）两版完全一致，样式见 `./app-uploader.scss`。
    -->
    <div
        v-if="prefersCaomeiUi"
        class="app-uploader"
        :class="{'app-uploader--dragging': isDragging}"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
    >
        <CaomeiInputGroup>
            <CaomeiInput
                v-model="caomeiModel"
                :placeholder="placeholder"
                :disabled="uploading || disabled"
                :readonly="readonly"
            />
            <CaomeiButton
                v-tooltip="$t('common.upload')"
                icon-only
                variant="ghost"
                :label="$t('common.upload')"
                :loading="uploading"
                :disabled="disabled"
                @click="triggerFileSelect"
            >
                <template #icon>
                    <Upload :size="16" />
                </template>
            </CaomeiButton>
            <slot name="extra" />
        </CaomeiInputGroup>
        <input
            ref="fileInput"
            type="file"
            class="hidden"
            :accept="accept"
            @change="onFileChange"
        >
    </div>
    <AppUploader
        v-else
        v-model="modelValue"
        :placeholder="placeholder"
        :accept="accept"
        :type="type"
        :post-id="postId"
        :disabled="disabled"
        :readonly="readonly"
    >
        <template #extra>
            <slot name="extra" />
        </template>
    </AppUploader>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Upload } from '@lucide/vue'
import AppUploader from './app-uploader.vue'
import { resolveUiLibraryForRoutePath } from '@/lib/ui-library'
import { useAppUploaderField } from '@/composables/use-app-uploader-field'
import type { UploadType } from '@/composables/use-upload'

/**
 * 过渡用「上传字段（caomei-ui 版）」。
 *
 * 背景：`AppUploader` 是跨路由共享组件，消费者横跨 B2 目标路由（admin `friend-links`，**本批只交付过渡壳，
 * 页面替换是该路由批次的原子步骤**）与公开页 / 设置页（`friend-links`、`general-settings`、
 * `post-editor-media-settings`、`commercial-link-dialog`）。
 * 若直接改写 `AppUploader`，这些页面会被被动改变。故并存期新增本过渡组件，**内部按路由择库**
 * （`lib/ui-library.ts` 为单一事实源）：未迁移路由回退到 V1，因此本组件可在任意路由安全采用。
 *
 * 行为（文件选择 / 拖放 / 上传回写）与 V1 共用 `useAppUploaderField`，两版仅模板不同。
 *
 * 与 V1 的差异（均为有意，见迁移方案 §6.2）：
 * - `InputGroup` / `InputText` / `Button` → `CaomeiInputGroup` / `CaomeiInput` / `CaomeiButton`；
 * - PrimeVue `text` 按钮 → caomei `variant="ghost"`（V1 的 `severity="secondary"` 在 ghost 变体下与
 *   caomei 默认文本色解析一致，按 §6.2 属有损但视觉等价，不再单独设 `tone`）；
 *   图标由 `pi pi-upload` 换成 lucide `Upload`；
 * - 纯图标按钮补 `:label`（可访问名）：V1 仅有图标与 tooltip，无可访问名。
 */
const props = defineProps<{
    placeholder?: string
    accept?: string
    type?: UploadType
    postId?: string | null
    disabled?: boolean
    readonly?: boolean
}>()

const modelValue = defineModel<string | null>()

/**
 * caomei `Input` 的 `modelValue` 类型为 `string`（缺省 `''`），而本组件的 model 允许 `null`
 * （与 V1 的 PrimeVue `InputText` 一致）。此处做一次读写归一：读取时 `null` → `''`，
 * 写回时按输入框实际值（字符串）写回——与 V1 下 PrimeVue 的清空行为等价（同样写回 `''`）。
 */
const caomeiModel = computed({
    get: () => modelValue.value ?? '',
    set: (value: string) => {
        modelValue.value = value
    },
})

const route = useRoute()
const prefersCaomeiUi = computed(() => resolveUiLibraryForRoutePath(route.path) === 'caomei-ui')

const {
    fileInput,
    isDragging,
    uploading,
    triggerFileSelect,
    onFileChange,
    onDragOver,
    onDragLeave,
    onDrop,
} = useAppUploaderField({
    type: props.type,
    postId: computed(() => props.postId || null),
    disabled: computed(() => Boolean(props.disabled)),
    onUploaded: (url) => {
        modelValue.value = url
    },
})
</script>

<style lang="scss" scoped src="./app-uploader.scss"></style>
