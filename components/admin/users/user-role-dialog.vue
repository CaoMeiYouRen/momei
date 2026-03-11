<template>
    <Dialog
        :visible="visible"
        :header="$t('pages.admin.users.edit_role')"
        modal
        class="user-management__dialog"
        @update:visible="$emit('update:visible', $event)"
    >
        <div class="user-management__dialog-content">
            <label class="user-management__dialog-label">{{ $t('pages.admin.users.select_role') }}</label>
            <Select
                v-model="selectedRole"
                :options="roleValues"
                option-label="label"
                option-value="value"
                class="w-full"
            />
        </div>
        <template #footer>
            <Button
                :label="$t('common.cancel')"
                severity="secondary"
                text
                @click="$emit('update:visible', false)"
            />
            <Button
                :label="$t('common.save')"
                :loading="loading"
                @click="handleSave"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { authClient } from '@/lib/auth-client'

type ManagedUserRole = 'admin' | 'author' | 'user'

interface ManagedUser {
    id: string
    role: ManagedUserRole
}

const props = defineProps<{
    visible: boolean
    user: ManagedUser | null
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
