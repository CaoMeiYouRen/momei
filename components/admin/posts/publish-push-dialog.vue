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
                <div class="p-field-radiobutton">
                    <RadioButton
                        v-model="pushOption"
                        input-id="push_none"
                        name="pushOption"
                        value="none"
                    />
                    <label for="push_none">
                        <strong>{{ $t('pages.admin.posts.push_options.none') }}</strong>
                        <small class="block">{{ $t('pages.admin.posts.push_options.none_desc') }}</small>
                    </label>
                </div>

                <div class="mt-3 p-field-radiobutton">
                    <RadioButton
                        v-model="pushOption"
                        input-id="push_draft"
                        name="pushOption"
                        value="draft"
                    />
                    <label for="push_draft">
                        <strong>{{ $t('pages.admin.posts.push_options.draft') }}</strong>
                        <small class="block">{{ $t('pages.admin.posts.push_options.draft_desc') }}</small>
                    </label>
                </div>

                <div class="mt-3 p-field-radiobutton">
                    <RadioButton
                        v-model="pushOption"
                        input-id="push_now"
                        name="pushOption"
                        value="now"
                    />
                    <label for="push_now">
                        <strong>{{ $t('pages.admin.posts.push_options.now') }}</strong>
                        <small class="block">{{ $t('pages.admin.posts.push_options.now_desc') }}</small>
                    </label>
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
import { ref } from 'vue'

const props = defineProps<{
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'confirm', pushOption: 'none' | 'draft' | 'now'): void
}>()

const visible = defineModel<boolean>('visible', { default: false })
const pushOption = ref<'none' | 'draft' | 'now'>('none')

const handleConfirm = () => {
    emit('confirm', pushOption.value)
}

const open = () => {
    pushOption.value = 'none'
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
        gap: 1rem;
        padding-left: 3rem;
    }
}

.p-field-radiobutton {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;

    label {
        cursor: pointer;

        strong {
            display: block;
            margin-bottom: 0.25rem;
        }

        small {
            color: var(--p-text-muted-color);
        }
    }
}
</style>
