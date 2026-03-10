<template>
    <div class="admin-notifications">
        <Message
            v-if="demoPreview"
            severity="info"
            :closable="false"
            class="mb-4"
        >
            {{ $t('pages.admin.settings.system.demo_preview.description') }}
        </Message>

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
const { $appFetch } = useAppApi()

const settings = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const demoPreview = ref(false)

function getErrorDetail(error: unknown, fallback: string) {
    const candidate = error as {
        data?: { message?: string, statusMessage?: string }
        statusMessage?: string
        message?: string
    }

    return candidate?.data?.message
        || candidate?.data?.statusMessage
        || candidate?.statusMessage
        || candidate?.message
        || fallback
}

const load = async () => {
    loading.value = true
    try {
        const response = await $appFetch<{ data: { items: any[], demoPreview?: boolean } }>('/api/admin/settings/notifications/admin')
        settings.value = response.data.items || []
        demoPreview.value = Boolean(response.data.demoPreview)
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: getErrorDetail(error, t('common.error_loading')),
            life: 5000,
        })
    } finally {
        loading.value = false
    }
}

const save = async () => {
    saving.value = true
    try {
        await $appFetch('/api/admin/settings/notifications/admin', {
            method: 'PUT',
            body: settings.value,
        })
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('common.save_success'),
            life: 3000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: getErrorDetail(error, t('common.save_failed')),
            life: 5000,
        })
    } finally {
        saving.value = false
    }
}

onMounted(load)
</script>
