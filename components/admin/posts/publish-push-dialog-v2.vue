<template>
    <CaomeiDialog
        :close-on-overlay="false"
        :open="visible"
        :title="$t('pages.admin.posts.publish_confirm_title')"
        :style="{width: '35rem'}"
        modal
        @update:open="visible = $event"
    >
        <div class="publish-dialog">
            <div class="publish-dialog__message">
                <CircleHelp :size="32" class="publish-dialog__icon" />
                <p>{{ $t('pages.admin.posts.publish_confirm_message') }}</p>
            </div>

            <CaomeiRadioGroup v-model="pushOption" class="publish-dialog__options">
                <CaomeiRadioButton value="none">
                    <strong>{{ $t('pages.admin.posts.push_options.none') }}</strong>
                    <small>{{ $t('pages.admin.posts.push_options.none_desc') }}</small>
                </CaomeiRadioButton>
                <CaomeiRadioButton value="draft">
                    <strong>{{ $t('pages.admin.posts.push_options.draft') }}</strong>
                    <small>{{ $t('pages.admin.posts.push_options.draft_desc') }}</small>
                </CaomeiRadioButton>
                <CaomeiRadioButton value="now">
                    <strong>{{ $t('pages.admin.posts.push_options.now') }}</strong>
                    <small>{{ $t('pages.admin.posts.push_options.now_desc') }}</small>
                </CaomeiRadioButton>
            </CaomeiRadioGroup>

            <div v-if="pushOption !== 'none'" class="publish-dialog__target-selection">
                <p class="publish-dialog__target-label">
                    {{ $t('pages.admin.marketing.form.targets') }}
                </p>
                <CaomeiRadioGroup
                    v-model="targetType"
                    orientation="horizontal"
                    class="publish-dialog__target-options"
                >
                    <CaomeiRadioButton value="all" :text="$t('pages.admin.marketing.form.target_all')" />
                    <CaomeiRadioButton value="criteria" :text="$t('pages.admin.marketing.form.target_criteria')" />
                </CaomeiRadioGroup>
                <div v-if="targetType === 'criteria'" class="publish-dialog__criteria-hint">
                    <Info :size="16" />
                    <span>{{ $t('pages.admin.posts.push_criteria_hint') }}</span>
                </div>
            </div>

            <div class="publish-dialog__footer-options">
                <div class="publish-dialog__publish-at">
                    <label for="publish_at" class="publish-dialog__field-label">
                        {{ $t('common.schedule_time') }}
                    </label>
                    <DatePicker
                        id="publish_at"
                        v-model="publishedAt"
                        show-time
                        hour-format="24"
                        :placeholder="$t('common.schedule_time')"
                        fluid
                        show-icon
                        icon-display="input"
                    />
                    <small class="publish-dialog__field-desc">
                        {{ $t('common.schedule_hint') }}
                    </small>
                </div>
            </div>
        </div>

        <template #footer>
            <CaomeiButton
                variant="ghost"
                @click="visible = false"
            >
                {{ $t('common.cancel') }}
            </CaomeiButton>
            <CaomeiButton
                tone="neutral"
                :loading="loading"
                @click="handleConfirm"
            >
                {{ $t('common.confirm_publish') }}
            </CaomeiButton>
        </template>
    </CaomeiDialog>
</template>

<script setup lang="ts">
import { CircleHelp, Info } from '@lucide/vue'
import {
    usePublishPushDialog,
    type PublishPushConfirmPayload,
    type PublishPushOpenOptions,
} from '@/composables/use-publish-push-dialog'

/**
 * 「发布确认 / 推送设置浮层」的实现（原 V2 过渡壳）。
 *
 * 历史与现状同 `PostAuditBadgeV2`：曾与 V1 并存（消费处静态择库），2026-11-07 编辑器子批迁移后
 * V1 已删除，本组件为唯一实现；状态与语义（`open()` 回填、日期容错、`confirm` 载荷形状）仍集中在
 * `usePublishPushDialog`，模板以外的逻辑不受版本影响。
 *
 * 与旧 V1 的差异（均为有意，见迁移方案 §6.2）：
 * - 页脚 `Button` → `CaomeiButton`：可见文案落**默认插槽**（V1 走 `:label`）；
 *   `text severity="secondary"` → `variant="ghost"`，`severity="contrast"` → `tone="neutral"`
 *   （§6.2 表：`secondary` / `contrast` → `neutral`，有损近似）；
 * - `RadioButton` 已在编辑器子批改为 `CaomeiRadioGroup` + `CaomeiRadioButton`（富文本选项走默认插槽）；
 *   **`DatePicker` 仍为 PrimeVue**（B3 表单族，随 B3 残留族收口）。
 */
defineProps<{
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'confirm', options: PublishPushConfirmPayload): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

const {
    pushOption,
    publishedAt,
    targetType,
    articleCriteria,
    resetFromOptions,
    buildConfirmPayload,
} = usePublishPushDialog()

const handleConfirm = () => {
    emit('confirm', buildConfirmPayload())
}

const open = (options?: PublishPushOpenOptions) => {
    resetFromOptions(options)
    visible.value = true
}

defineExpose({
    open,
    visible,
})
</script>

<style lang="scss" scoped src="./publish-push-dialog.scss"></style>
