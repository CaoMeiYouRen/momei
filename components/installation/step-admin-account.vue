<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.adminAccount.title') }}</h2>
        <p>{{ $t('installation.adminAccount.description') }}</p>

        <CaomeiMessage
            v-if="adminError && !Object.keys(fieldErrors).length"
            tone="danger"
            :closable="false"
            class="installation-wizard__step-message"
        >
            {{ adminError }}
        </CaomeiMessage>

        <div class="installation-wizard__form">
            <div class="form-field">
                <label for="admin_name">
                    {{ $t('installation.adminAccount.name') }}
                    <span class="ml-1 text-error">*</span>
                </label>
                <CaomeiInput
                    id="admin_name"
                    v-model="adminData.name"
                    :invalid="!!fieldErrors.name"
                />
                <div v-if="fieldErrors.name" class="installation-wizard__field-error">
                    {{ fieldErrors.name }}
                </div>
            </div>
            <div class="form-field">
                <label for="admin_email">
                    {{ $t('installation.adminAccount.email') }}
                    <span class="ml-1 text-error">*</span>
                </label>
                <CaomeiInput
                    id="admin_email"
                    v-model="adminData.email"
                    :invalid="!!fieldErrors.email"
                />
                <div v-if="fieldErrors.email" class="installation-wizard__field-error">
                    {{ fieldErrors.email }}
                </div>
            </div>
            <div class="form-field">
                <label for="admin_password">
                    {{ $t('installation.adminAccount.password') }}
                    <span class="ml-1 text-error">*</span>
                </label>
                <CaomeiPassword
                    id="admin_password"
                    v-model="adminData.password"
                    :feedback="true"
                    :invalid="!!fieldErrors.password"
                />
                <div v-if="fieldErrors.password" class="installation-wizard__field-error">
                    {{ fieldErrors.password }}
                </div>
            </div>
        </div>

        <div class="installation-wizard__actions">
            <CaomeiButton
                variant="ghost"
                :label="$t('common.prev')"
                @click="$emit('prev')"
            >
                <template #icon>
                    <ArrowLeft :size="16" />
                </template>
                {{ $t('common.prev') }}
            </CaomeiButton>
            <CaomeiButton
                :label="$t('common.next')"
                :loading="adminLoading"
                @click="$emit('next')"
            >
                <template #icon>
                    <ArrowRight :size="16" />
                </template>
                {{ $t('common.next') }}
            </CaomeiButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@lucide/vue'

const adminData = defineModel<any>('adminData', { required: true })
defineProps<{
    adminLoading: boolean
    adminError: string
    fieldErrors: Partial<Record<string, string>>
}>()
defineEmits(['prev', 'next'])
</script>
