<template>
    <div class="settings-api-keys">
        <h3 class="settings-section-title">
            {{ $t("pages.settings.api_keys.title") }}
        </h3>

        <div class="api-keys-section">
            <p class="api-keys-description">
                {{ $t("pages.settings.api_keys.description") }}
            </p>

            <div class="api-keys-form-container">
                <div class="api-keys-form">
                    <div class="api-keys-form__field">
                        <label class="api-keys-form__label">{{ $t("pages.settings.api_keys.name") }}</label>
                        <InputText
                            v-model="newKeyName"
                            :placeholder="$t('pages.settings.api_keys.name')"
                            fluid
                            @keyup.enter="handleCreateApiKey"
                        />
                    </div>
                    <div class="api-keys-form__field">
                        <label class="api-keys-form__label">{{ $t("pages.settings.api_keys.expires_at") }}</label>
                        <Select
                            v-model="expirationOption"
                            :options="expirationOptions"
                            option-label="label"
                            option-value="value"
                            fluid
                        />
                    </div>
                    <Button
                        :label="$t('pages.settings.api_keys.create_btn')"
                        icon="pi pi-plus"
                        :loading="loading"
                        :disabled="!newKeyName.trim()"
                        class="api-keys-form__submit"
                        @click="handleCreateApiKey"
                    />
                </div>
            </div>

            <DataTable
                :value="apiKeys"
                :loading="loadingKeys"
                size="small"
                class="api-keys-table"
            >
                <Column field="name" :header="$t('pages.settings.api_keys.name')">
                    <template #body="{data}">
                        <span class="api-key-name">{{ data.name }}</span>
                    </template>
                </Column>
                <Column field="prefix" :header="$t('pages.settings.api_keys.prefix')">
                    <template #body="{data}">
                        <code class="api-key-prefix">{{ data.prefix }}...</code>
                    </template>
                </Column>
                <Column field="lastUsedAt" :header="$t('pages.settings.api_keys.last_used_at')">
                    <template #body="{data}">
                        <span class="api-key-date">
                            {{ data.lastUsedAt ? formatDate(data.lastUsedAt) : '-' }}
                        </span>
                    </template>
                </Column>
                <Column field="expiresAt" :header="$t('pages.settings.api_keys.expires_at')">
                    <template #body="{data}">
                        <Tag
                            v-if="data.expiresAt"
                            severity="secondary"
                            :value="formatDate(data.expiresAt)"
                        />
                        <span v-else class="api-key-never-expires">
                            {{ $t('pages.settings.api_keys.never_expires') }}
                        </span>
                    </template>
                </Column>
                <Column :header="$t('common.actions')" class="text-right">
                    <template #body="{data}">
                        <Button
                            icon="pi pi-trash"
                            severity="danger"
                            text
                            rounded
                            size="small"
                            @click="handleDeleteApiKey(data.id)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog
            v-model:visible="showNewKeyDialog"
            modal
            :header="$t('pages.settings.api_keys.new_key_title')"
            :style="{width: '450px'}"
        >
            <div class="new-key-dialog-content">
                <Message severity="warn" :closable="false">
                    {{ $t("pages.settings.api_keys.new_key_hint") }}
                </Message>
                <div class="new-key-input-group">
                    <InputText
                        :value="newlyCreatedKey"
                        readonly
                        class="new-key-input"
                    />
                    <Button icon="pi pi-copy" @click="copyToClipboard(newlyCreatedKey || '')" />
                </div>
            </div>
            <template #footer>
                <Button :label="$t('common.close')" @click="showNewKeyDialog = false" />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { formatDate } = useI18nDate()
const toast = useToast()

const apiKeys = ref<any[]>([])
const loadingKeys = ref(false)
const loading = ref(false)
const showNewKeyDialog = ref(false)
const newKeyName = ref('')
const newlyCreatedKey = ref<string | null>(null)
const expirationOption = ref('never')

const expirationOptions = computed(() => [
    { label: t('pages.settings.api_keys.expired_at_options.never'), value: 'never' },
    { label: t('pages.settings.api_keys.expired_at_options.7d'), value: '7d' },
    { label: t('pages.settings.api_keys.expired_at_options.30d'), value: '30d' },
    { label: t('pages.settings.api_keys.expired_at_options.365d'), value: '365d' },
])

const fetchApiKeys = async () => {
    loadingKeys.value = true
    try {
        const response = await $fetch<{ code: number, data: any[] }>('/api/user/api-keys')
        if (response.code === 200) {
            apiKeys.value = response.data
        }
    } catch (e) {
        console.error('Failed to fetch API keys', e)
    } finally {
        loadingKeys.value = false
    }
}

const handleCreateApiKey = async () => {
    if (!newKeyName.value.trim()) return

    loading.value = true
    try {
        const response = await $fetch<{ code: number, data: any }>('/api/user/api-keys', {
            method: 'POST',
            body: {
                name: newKeyName.value.trim(),
                expiresIn: expirationOption.value,
            },
        })
        if (response.code === 200) {
            newlyCreatedKey.value = response.data.key
            showNewKeyDialog.value = true
            newKeyName.value = ''
            expirationOption.value = 'never'
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.api_keys.create_success'), life: 3000 })
            await fetchApiKeys()
        }
    } catch (e) {
        console.error(e)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    } finally {
        loading.value = false
    }
}

const handleDeleteApiKey = async (id: string) => {
    try {
        const response = await $fetch<{ code: number }>(`/api/user/api-keys/${id}`, {
            method: 'DELETE',
        })
        if (response.code === 200) {
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.settings.api_keys.delete_success'), life: 3000 })
            await fetchApiKeys()
        }
    } catch (e) {
        console.error(e)
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    }
}

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.add({ severity: 'info', summary: t('common.success'), detail: 'Copied to clipboard', life: 2000 })
}

onMounted(() => {
    fetchApiKeys()
})
</script>

<style lang="scss" scoped>
.settings-section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 2rem;
    color: var(--p-text-color);
}

.api-keys-description {
    margin-bottom: 1.5rem;
    color: var(--p-text-muted-color);
    font-size: 0.875rem;
}

.api-keys-form-container {
    background-color: var(--p-surface-50);
    border: 1px solid var(--p-surface-border);
    padding: 1.25rem;
    border-radius: 0.75rem;
    margin-bottom: 2rem;

    :global(.dark) & {
        background-color: var(--p-surface-900);
    }
}

.api-keys-form {
    display: grid;
    grid-template-columns: 1fr 200px auto;
    gap: 1rem;
    align-items: flex-end;

    @media (width <= 992px) {
        grid-template-columns: 1fr 180px;
    }

    @media (width <= 640px) {
        grid-template-columns: 1fr;
    }

    &__field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__label {
        font-size: 0.875rem;
        font-weight: 600;
        margin-left: 0.25rem;
    }

    &__submit {
        padding-left: 1.5rem;
        padding-right: 1.5rem;

        @media (width <= 992px) {
            grid-column: span 2;
        }

        @media (width <= 640px) {
            grid-column: span 1;
        }
    }
}

.api-key-prefix {
    background-color: var(--p-surface-100);
    border: 1px solid var(--p-surface-200);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: var(--p-font-family-mono, monospace);
    font-size: 0.75rem;

    :global(.dark) & {
        background-color: var(--p-surface-800);
        border-color: var(--p-surface-700);
    }
}

.new-key-dialog-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.new-key-input-group {
    display: flex;
    width: 100%;

    .new-key-input {
        flex: 1;
        background-color: var(--p-surface-50);
        font-family: var(--p-font-family-mono, monospace);
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;

        :global(.dark) & {
            background-color: var(--p-surface-900);
        }
    }

    :deep(.p-button) {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }
}
</style>
