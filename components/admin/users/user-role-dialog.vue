<template>
    <!-- `Dialog` 属浮层显式豁免（迁移方案 §5.5）：留待第六十九阶段，此处保持 PrimeVue。 -->
    <Dialog
        :visible="visible"
        :header="$t('pages.admin.users.edit_role')"
        modal
        class="user-management__dialog"
        @update:visible="$emit('update:visible', $event)"
    >
        <div class="user-management__dialog-content">
            <label class="user-management__dialog-label">{{ $t('pages.admin.users.select_role') }}</label>
            <!-- caomei `Select` 的 `class` 只落触发器、宽度钩子在字段外层（默认 `--caomei-select-max-width: 20rem`
                 = 320px），故用包装元素放开上限取满容器（上游反馈 §1.1）；`class="w-full"` 直接写在组件上静默无效。 -->
            <div class="user-management__select-field">
                <CaomeiSelect
                    v-model="selectedRole"
                    :options="roleValues"
                    option-label="label"
                    option-value="value"
                />
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
                :loading="loading"
                @click="handleSave"
            >
                {{ $t('common.save') }}
            </CaomeiButton>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { authClient } from '@/lib/auth-client'
import type { ManagedUserWithRole } from '@/types/admin-user-management'

const props = defineProps<{
    visible: boolean
    user: ManagedUserWithRole | null
}>()

const emit = defineEmits(['update:visible', 'success'])

const { t } = useI18n()
const { showErrorToast, showSuccessToast } = useRequestFeedback()

const selectedRole = ref('')
const loading = ref(false)

const roleValues = computed(() => [
    { label: t('pages.admin.users.roles.admin'), value: 'admin' },
    { label: t('pages.admin.users.roles.author'), value: 'author' },
    { label: t('pages.admin.users.roles.user'), value: 'user' },
])

watch(() => props.visible, (val) => {
    if (val && props.user) {
        selectedRole.value = props.user.role
    }
})

const handleSave = async () => {
    if (!props.user) return
    loading.value = true
    try {
        const { error } = await authClient.admin.setRole({
            userId: props.user.id,
            role: selectedRole.value as Parameters<typeof authClient.admin.setRole>[0]['role'],
        })
        if (error) throw error
        showSuccessToast('pages.admin.users.feedback.update_role_success')
        emit('success')
        emit('update:visible', false)
    } catch (error) {
        showErrorToast(error, {
            fallbackKey: 'pages.admin.users.feedback.update_role_failed',
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
}

.user-management__dialog-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
}
</style>
