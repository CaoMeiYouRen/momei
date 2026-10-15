<template>
    <!-- `Dialog` 属浮层显式豁免（迁移方案 §5.5）：留待第六十九阶段，此处保持 PrimeVue。 -->
    <Dialog
        :visible="visible"
        :header="$t('pages.admin.users.ban_user')"
        modal
        class="user-management__dialog"
        @update:visible="$emit('update:visible', $event)"
    >
        <div class="user-management__dialog-content user-management__dialog-content--gap">
            <div>
                <label class="user-management__dialog-label">{{ $t('pages.admin.users.ban_reason') }}</label>
                <CaomeiInput
                    v-model="reason"
                    class="w-full"
                    :placeholder="$t('pages.admin.users.ban_reason_placeholder')"
                />
            </div>
            <div>
                <label class="user-management__dialog-label">{{ $t('pages.admin.users.ban_expiry') }} ({{ $t('common.optional') }})</label>
                <!-- caomei `Select` 的 `class` 只落触发器、宽度钩子在字段外层（默认 `--caomei-select-max-width: 20rem`
                     = 320px），故用包装元素放开上限取满容器（上游反馈 §1.1）；`class="w-full"` 直接写在组件上静默无效。 -->
                <div class="user-management__select-field">
                    <CaomeiSelect
                        v-model="expiryModelValue"
                        :options="expiryOptions"
                        option-label="label"
                        option-value="value"
                    />
                </div>
            </div>
        </div>
        <template #footer>
            <CaomeiButton
                variant="ghost"
                tone="neutral"
                @click="$emit('update:visible', false)"
            >
                {{ $t('common.cancel') }}
            </CaomeiButton>
            <CaomeiButton
                tone="danger"
                :loading="loading"
                @click="handleBan"
            >
                {{ $t('pages.admin.users.ban') }}
            </CaomeiButton>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { authClient } from '@/lib/auth-client'
import type { ManagedUser } from '@/types/admin-user-management'

const props = defineProps<{
    visible: boolean
    user: ManagedUser | null
}>()

const emit = defineEmits(['update:visible', 'success'])

const { t } = useI18n()
const { showErrorToast, showSuccessToast } = useRequestFeedback()

const reason = ref('')
const expiry = ref<number | null>(null)
const loading = ref(false)

// 「永不过期」在 caomei `Select` 中不能以 `null` 作为选项值（`optionValue` 解析结果非
// string / number 的选项不渲染，上游反馈 §1.2 判定为设计如此），故以哨兵值承载，
// 并在边界还原为 `null`（请求侧 `banExpiresIn` 仍为 `undefined`）。
const NEVER_SENTINEL = '__never__'

const expiryModelValue = computed({
    get: () => expiry.value ?? NEVER_SENTINEL,
    set: (value: string | number) => {
        expiry.value = value === NEVER_SENTINEL ? null : Number(value)
    },
})

const expiryOptions = computed(() => [
    { label: t('pages.admin.users.expiry.never'), value: NEVER_SENTINEL },
    { label: t('pages.admin.users.expiry.one_day'), value: 60 * 60 * 24 },
    { label: t('pages.admin.users.expiry.one_week'), value: 60 * 60 * 24 * 7 },
    { label: t('pages.admin.users.expiry.one_month'), value: 60 * 60 * 24 * 30 },
])

watch(() => props.visible, (val) => {
    if (val) {
        reason.value = ''
        expiry.value = null
    }
})

const handleBan = async () => {
    if (!props.user) return
    loading.value = true
    try {
        const { error } = await authClient.admin.banUser({
            userId: props.user.id,
            banReason: reason.value,
            banExpiresIn: expiry.value || undefined,
        })
        if (error) throw error
        showSuccessToast('pages.admin.users.feedback.ban_user_success')
        emit('success')
        emit('update:visible', false)
    } catch (error) {
        showErrorToast(error, {
            fallbackKey: 'pages.admin.users.feedback.ban_user_failed',
        })
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
/* caomei `Select` 的宽度 / `max-width` 钩子在字段外层（`class` 只落触发器），
   故以包装元素放开 `20rem` 上限取满容器（上游反馈 §1.1）。 */
.user-management__select-field {
    --caomei-select-max-width: 100%;
}

.user-management__dialog {
    width: 100%;
    max-width: 24rem;
}

.user-management__dialog-content {
    padding-top: 1rem;
    padding-bottom: 1rem;

    &--gap {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
}

.user-management__dialog-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
}
</style>
