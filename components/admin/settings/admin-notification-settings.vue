<template>
    <div class="admin-notifications">
        <div class="mb-4">
            <h3 class="font-bold mb-2 text-xl">
                {{ $t('pages.admin.settings.system.notifications.title') }}
            </h3>
            <p class="text-muted-color">
                {{ $t('pages.admin.settings.system.notifications.description') }}
            </p>
        </div>

        <DataTable :value="settings" class="mt-4">
            <Column
                field="event"
                :header="$t('pages.admin.settings.system.notifications.event')"
            >
                <template #body="{data}">
                    <span class="font-medium">{{ $t(`pages.admin.settings.system.notifications.events.${data.event}`) }}</span>
                </template>
            </Column>
            <Column
                field="isEmailEnabled"
                :header="$t('pages.admin.settings.system.notifications.email')"
                class="text-center"
            >
                <template #body="{data}">
                    <ToggleSwitch v-model="data.isEmailEnabled" @change="save" />
                </template>
            </Column>
            <Column
                field="isBrowserEnabled"
                :header="$t('pages.admin.settings.system.notifications.browser')"
                class="text-center"
            >
                <template #body="{data}">
                    <ToggleSwitch v-model="data.isBrowserEnabled" @change="save" />
                </template>
            </Column>
        </DataTable>

        <div class="flex justify-content-end mt-4">
            <Button
                :label="$t('common.save')"
                icon="pi pi-check"
                :loading="saving"
                @click="save"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const toast = useToast()

const settings = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)

const load = async () => {
    loading.value = true
    try {
        const response = await $fetch<{ data: any[] }>('/api/admin/settings/notifications/admin')
        settings.value = response.data
    } catch (e) {
        console.error('Failed to load admin notifications', e)
    } finally {
        loading.value = false
    }
}

const save = async () => {
    saving.value = true
    try {
        await $fetch('/api/admin/settings/notifications/admin', {
            method: 'PUT',
            body: settings.value,
        })
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('common.save_success'),
            life: 3000,
        })
    } catch (e) {
        console.error('Failed to save admin notifications', e)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('common.save_failed'),
            life: 5000,
        })
    } finally {
        saving.value = false
    }
}

onMounted(load)
</script>
