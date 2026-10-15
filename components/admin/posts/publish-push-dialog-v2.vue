<template>
    <!--
      浮层显式豁免（迁移方案 §5.5）：`Dialog` 属延后批次，本批维持 PrimeVue；
      `RadioButton` / `DatePicker` 不在 B2 在册族（表单控件随 B3 批次），同样维持 PrimeVue。
      仅页脚的 `Button` 属批次在册族，随本过渡组件迁移到 caomei-ui。
    -->
    <Dialog
        v-model:visible="visible"
        modal
        :header="$t('pages.admin.posts.publish_confirm_title')"
        :style="{width: '35rem'}"
    >
        <div class="publish-dialog">
            <div class="publish-dialog__message">
                <i class="pi pi-question-circle publish-dialog__icon" />
                <p>{{ $t('pages.admin.posts.publish_confirm_message') }}</p>
            </div>

            <div class="publish-dialog__options">
                <div class="publish-dialog__option">
                    <RadioButton
                        v-model="pushOption"
                        input-id="push_none"
                        name="pushOption"
                        value="none"
                    />
                    <label
                        for="push_none"
                        class="publish-dialog__option-label"
                    >
                        <strong>{{ $t('pages.admin.posts.push_options.none') }}</strong>
                        <small>{{ $t('pages.admin.posts.push_options.none_desc') }}</small>
                    </label>
                </div>

                <div class="publish-dialog__option">
                    <RadioButton
                        v-model="pushOption"
                        input-id="push_draft"
                        name="pushOption"
                        value="draft"
                    />
                    <label
                        for="push_draft"
                        class="publish-dialog__option-label"
                    >
                        <strong>{{ $t('pages.admin.posts.push_options.draft') }}</strong>
                        <small>{{ $t('pages.admin.posts.push_options.draft_desc') }}</small>
                    </label>
                </div>

                <div class="publish-dialog__option">
                    <RadioButton
                        v-model="pushOption"
                        input-id="push_now"
                        name="pushOption"
                        value="now"
                    />
                    <label
                        for="push_now"
                        class="publish-dialog__option-label"
                    >
                        <strong>{{ $t('pages.admin.posts.push_options.now') }}</strong>
                        <small>{{ $t('pages.admin.posts.push_options.now_desc') }}</small>
                    </label>
                </div>

                <div v-if="pushOption !== 'none'" class="publish-dialog__target-selection">
                    <p class="publish-dialog__target-label">
                        {{ $t('pages.admin.marketing.form.targets') }}
                    </p>
                    <div class="publish-dialog__target-options">
                        <div class="publish-dialog__target-option">
                            <RadioButton
                                v-model="targetType"
                                input-id="target_all"
                                name="targetType"
                                value="all"
                            />
                            <label for="target_all">{{ $t('pages.admin.marketing.form.target_all') }}</label>
                        </div>
                        <div class="publish-dialog__target-option">
                            <RadioButton
                                v-model="targetType"
                                input-id="target_criteria"
                                name="targetType"
                                value="criteria"
                            />
                            <label for="target_criteria">{{ $t('pages.admin.marketing.form.target_criteria') }}</label>
                        </div>
                    </div>
                    <div v-if="targetType === 'criteria'" class="publish-dialog__criteria-hint">
                        <i class="pi pi-info-circle" />
                        <span>{{ $t('pages.admin.posts.push_criteria_hint') }}</span>
                    </div>
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
    </Dialog>
</template>

<script setup lang="ts">
import {
    usePublishPushDialog,
    type PublishPushConfirmPayload,
    type PublishPushOpenOptions,
} from '@/composables/use-publish-push-dialog'

/**
 * 过渡用「发布确认 / 推送设置浮层（caomei-ui 版）」。
 *
 * 背景与择库方式同 `PostAuditBadgeV2`（见该文件注释与迁移方案 §5.5）：本族为 admin 专属、
 * 消费者恰好两个（B2 目标 `/admin/posts` 与编辑器 `/admin/posts/[id]`），
 * 故采用**消费处静态择库**，由已迁移路由使用本组件，编辑器路由继续使用 V1。
 *
 * 状态与语义（`open()` 回填、日期容错、`confirm` 载荷形状）与 V1 共用 `usePublishPushDialog`，
 * 两版仅模板不同——避免「第二份 `open()` 语义」成为漂移源。
 *
 * 与 V1 的差异（均为有意，见迁移方案 §6.2）：
 * - 页脚 `Button` → `CaomeiButton`：可见文案落**默认插槽**（V1 走 `:label`）；
 *   `text severity="secondary"` → `variant="ghost"`，`severity="contrast"` → `tone="neutral"`
 *   （§6.2 表：`secondary` / `contrast` → `neutral`，有损近似）；
 * - `Dialog` / `RadioButton` / `DatePicker` 不在 B2 在册族，维持 PrimeVue。
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
