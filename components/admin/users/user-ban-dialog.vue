<template>
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
                <InputText
                    v-model="reason"
                    class="w-full"
                    :placeholder="$t('pages.admin.users.ban_reason_placeholder')"
                />
            </div>
            <div>
                <label class="user-management__dialog-label">{{ $t('pages.admin.users.ban_expiry') }} ({{ $t('common.optional') }})</label>
                <Select
                    v-model="expiry"
                    :options="expiryOptions"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                />
            </div>
        </div>
        <template #footer>
            <Button
                :label="$t('common.cancel')"
                severity="secondary"
                text
                @click="$emit('update:visible', false)"
            />
            <Button
                :label="$t('pages.admin.users.ban')"
                severity="danger"
                :loading="loading"
                @click="handleBan"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { authClient } from '@/lib/auth-client'

const props = defineProps<{
    visible: boolean
    user: any
}>()

const emit = defineEmits(['update:visible', 'success'])

const { t } = useI18n()
const toast = useToast()

const reason = ref('')
const expiry = ref<number | null>(null)
const loading = ref(false)

const expiryOptions = computed(() => [
    { label: t('pages.admin.users.expiry.never'), value: null },
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
        toast.add({ severity: 'warn', summary: t('common.success'), detail: 'User banned', life: 3000 })
        emit('success')
        emit('update:visible', false)
    } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Ban failed' })
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
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
