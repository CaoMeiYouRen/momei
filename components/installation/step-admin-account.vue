<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.adminAccount.title') }}</h2>
        <p>{{ $t('installation.adminAccount.description') }}</p>

        <div class="installation-wizard__form">
            <div class="form-field">
                <label for="admin_name">
                    {{ $t('installation.adminAccount.name') }}
                    <span class="ml-1 text-error">*</span>
                </label>
                <InputText
                    id="admin_name"
                    v-model="adminData.name"
                    :invalid="!!fieldErrors.name"
                    fluid
                />
                <div v-if="fieldErrors.name" class="mt-1 p-error text-sm">
                    {{ fieldErrors.name }}
                </div>
            </div>
            <div class="form-field">
                <label for="admin_email">
                    {{ $t('installation.adminAccount.email') }}
                    <span class="ml-1 text-error">*</span>
                </label>
                <InputText
                    id="admin_email"
                    v-model="adminData.email"
                    :invalid="!!fieldErrors.email"
                    fluid
                />
                <div v-if="fieldErrors.email" class="mt-1 p-error text-sm">
                    {{ fieldErrors.email }}
                </div>
            </div>
            <div class="form-field">
                <label for="admin_password">
                    {{ $t('installation.adminAccount.password') }}
                    <span class="ml-1 text-error">*</span>
                </label>
                <Password
                    id="admin_password"
                    v-model="adminData.password"
                    :toggle-mask="true"
                    :invalid="!!fieldErrors.password"
                    fluid
                />
                <div v-if="fieldErrors.password" class="mt-1 p-error text-sm">
                    {{ fieldErrors.password }}
                </div>
            </div>
        </div>

        <div v-if="adminError" class="mb-4 p-error">
            {{ adminError }}
        </div>

        <div class="installation-wizard__actions">
            <Button
                :label="$t('common.prev')"
                icon="pi pi-arrow-left"
                variant="text"
                @click="$emit('prev')"
            />
            <Button
                :label="$t('common.next')"
                icon="pi pi-arrow-right"
                icon-pos="right"
                :loading="adminLoading"
                @click="$emit('next')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
const adminData = defineModel<any>('adminData', { required: true })
defineProps<{
    adminLoading: boolean
    adminError: string
    fieldErrors: Record<string, string>
}>()
defineEmits(['prev', 'next'])
</script>
