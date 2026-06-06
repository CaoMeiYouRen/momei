<template>
    <Dialog
        :visible="visible"
        :header="$t('pages.admin.posts.social_post.dialog_title')"
        :style="{width: '560px'}"
        :modal="true"
        @update:visible="$emit('update:visible', $event)"
    >
        <div class="social-post-dialog">
            <div class="social-post-dialog__platform">
                <label>{{ $t('pages.admin.posts.social_post.platform_label') }}</label>
                <SelectButton
                    v-model="platform"
                    :options="platformOptions"
                    option-label="label"
                    option-value="value"
                    :allow-empty="false"
                />
            </div>

            <Button
                :label="$t('pages.admin.posts.social_post.generate_btn')"
                icon="pi pi-sparkles"
                :loading="generating"
                class="social-post-dialog__generate"
                @click="handleGenerate"
            />

            <div v-if="result" class="social-post-dialog__result">
                <Textarea
                    v-model="result"
                    :rows="12"
                    readonly
                    class="social-post-dialog__textarea"
                />
                <div class="social-post-dialog__actions">
                    <Button
                        :label="copied ? $t('pages.admin.posts.social_post.copy_success') : $t('pages.admin.posts.social_post.copy_btn')"
                        :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
                        :severity="copied ? 'success' : 'secondary'"
                        size="small"
                        @click="handleCopy"
                    />
                </div>
            </div>
        </div>
        <template #footer>
            <Button :label="$t('common.close')" icon="pi pi-times" text @click="$emit('update:visible', false)" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useClipboard } from '@vueuse/core'

const visible = defineModel<boolean>('visible', { required: true })

defineEmits<{ 'update:visible': [value: boolean] }>()

const { t } = useI18n()
const { showErrorToast } = useRequestFeedback()

const platform = ref<'twitter' | 'linkedin'>('twitter')
const generating = ref(false)
const result = ref('')
const copied = ref(false)

const platformOptions = [
    { label: 'X (Twitter)', value: 'twitter' as const },
    { label: 'LinkedIn', value: 'linkedin' as const },
]

async function handleGenerate() {
    const route = useRoute()
    const postId = route.params.id as string
    if (!postId) return

    generating.value = true
    copied.value = false
    try {
        const res = await $fetch<{ code: number, data: { platform: string, content: string } }>(
            `/api/admin/posts/${postId}/social-post`,
            { method: 'POST', body: { platform: platform.value } },
        )
        result.value = res.data.content
    } catch (e) {
        showErrorToast(e, { fallbackKey: 'pages.admin.posts.social_post.generate_failed' })
    } finally {
        generating.value = false
    }
}

const { copy } = useClipboard()
async function handleCopy() {
    await copy(result.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.social-post-dialog {
    &__platform {
        margin-bottom: $spacing-md;

        label {
            display: block;
            margin-bottom: $spacing-xs;
            font-weight: 500;
            font-size: $font-size-sm;
        }
    }

    &__generate {
        width: 100%;
        margin-bottom: $spacing-md;
    }

    &__result {
        margin-top: $spacing-md;
    }

    &__textarea {
        width: 100%;
    }

    &__actions {
        margin-top: $spacing-sm;
        display: flex;
        justify-content: flex-end;
    }
}
</style>
