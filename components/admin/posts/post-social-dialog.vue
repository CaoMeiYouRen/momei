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
                <Select
                    v-model="platform"
                    :options="platformOptions"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                >
                    <template #option="slotProps">
                        <div class="social-post-dialog__select-option">
                            <i :class="slotProps.option.icon" :style="{color: slotProps.option.color}" />
                            <span>{{ slotProps.option.label }}</span>
                        </div>
                    </template>
                    <template #value="slotProps">
                        <div v-if="slotProps.value" class="social-post-dialog__select-value">
                            <i :class="selectedPlatform?.icon" :style="{color: selectedPlatform?.color}" />
                            <span>{{ selectedPlatform?.label }}</span>
                        </div>
                        <span v-else>{{ slotProps.placeholder }}</span>
                    </template>
                </Select>
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
            <Button
                :label="$t('common.close')"
                icon="pi pi-times"
                text
                @click="$emit('update:visible', false)"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import { SOCIAL_POST_PLATFORMS } from '@/utils/shared/social-post-platforms'

const visible = defineModel<boolean>('visible', { required: true })
defineEmits<{ 'update:visible': [value: boolean] }>()

const { t } = useI18n()
const { showErrorToast } = useRequestFeedback()

const platform = ref(SOCIAL_POST_PLATFORMS[0]?.key ?? 'twitter')
const generating = ref(false)
const result = ref('')
const copied = ref(false)

const platformOptions = (SOCIAL_POST_PLATFORMS ?? []).map((p) => ({
    label: t(p.i18nKey),
    value: p.key,
    icon: p.icon,
    color: p.color,
}))

const selectedPlatform = computed(() => platformOptions.find((p) => p.value === platform.value))

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
    setTimeout(() => {
        copied.value = false
    }, 2000)
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

    &__select-option, &__select-value {
        display: flex;
        align-items: center;
        gap: $spacing-sm;

        i {
            font-size: 1.1rem;
        }
    }
}
</style>
