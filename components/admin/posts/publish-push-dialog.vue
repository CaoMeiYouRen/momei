<template>
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
            <Button
                :label="$t('common.cancel')"
                text
                severity="secondary"
                @click="visible = false"
            />
            <Button
                :label="$t('common.confirm_publish')"
                severity="contrast"
                :loading="loading"
                @click="handleConfirm"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import {
    usePublishPushDialog,
    type PublishPushConfirmPayload,
    type PublishPushOpenOptions,
} from '@/composables/use-publish-push-dialog'

defineProps<{
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'confirm', options: PublishPushConfirmPayload): void
}>()

const visible = defineModel<boolean>('visible', { default: false })

// 弹窗状态与语义（`open()` 回填、日期容错、`confirm` 载荷形状）与 `PublishPushDialogV2` 共用，
// 两版仅模板不同（组件来源按路由选择）。
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
