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
            </div>

            <div class="publish-dialog__footer-options">
                <div class="publish-dialog__sync-field">
                    <ToggleSwitch v-model="syncToMemos" input-id="sync_memos" />
                    <label for="sync_memos">
                        {{ $t('pages.admin.posts.sync_to_memos') }}
                    </label>
                </div>
                <small class="publish-dialog__sync-desc">
                    {{ $t('pages.admin.posts.sync_to_memos_desc') }}
                </small>
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
import { ref } from 'vue'

const props = defineProps<{
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'confirm', options: { pushOption: 'none' | 'draft' | 'now', syncToMemos: boolean }): void
}>()

const visible = defineModel<boolean>('visible', { default: false })
const pushOption = ref<'none' | 'draft' | 'now'>('none')
const syncToMemos = ref(false)

const handleConfirm = () => {
    emit('confirm', {
        pushOption: pushOption.value,
        syncToMemos: syncToMemos.value,
    })
}

const open = () => {
    pushOption.value = 'none'
    syncToMemos.value = false
    visible.value = true
}

defineExpose({
    open,
    visible,
})
</script>

<style lang="scss" scoped>
.publish-dialog {
    &__message {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    &__icon {
        font-size: 2rem;
        color: var(--p-primary-500);
    }

    &__options {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding-left: 3rem;
    }

    &__option {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
    }

    &__option-label {
        cursor: pointer;
        display: flex;
        flex-direction: column;

        strong {
            display: block;
            margin-bottom: 0.25rem;
            line-height: 1.2;
        }

        small {
            display: block;
            color: var(--p-text-muted-color);
            line-height: 1.4;
        }
    }

    &__footer-options {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--p-surface-border);
    }

    &__sync-field {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        label {
            cursor: pointer;
            font-weight: 600;
        }
    }

    &__sync-desc {
        display: block;
        margin-top: 0.375rem;
        margin-left: 3rem; // 对应 InputSwitch 的宽度 + gap 的偏移
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
    }
}
</style>
