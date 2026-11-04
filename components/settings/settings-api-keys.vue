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
                        <CaomeiInput
                            v-model="newKeyName"
                            :placeholder="$t('pages.settings.api_keys.name')"
                            @keyup.enter="handleCreateApiKey"
                        />
                    </div>
                    <div class="api-keys-form__field">
                        <label class="api-keys-form__label">{{ $t("pages.settings.api_keys.expires_at") }}</label>
                        <CaomeiSelect
                            v-model="expirationOption"
                            :options="expirationOptions"
                            option-label="label"
                            option-value="value"
                        />
                    </div>
                    <CaomeiButton
                        :label="$t('pages.settings.api_keys.create_btn')"
                        :loading="loading"
                        :disabled="!newKeyName.trim()"
                        class="api-keys-form__submit"
                        @click="handleCreateApiKey"
                    >
                        <template #icon>
                            <Plus :size="16" />
                        </template>
                        {{ $t('pages.settings.api_keys.create_btn') }}
                    </CaomeiButton>
                </div>
            </div>

            <CaomeiDataTable
                :data="apiKeys"
                :columns="columns"
                :loading="loadingKeys"
                class="api-keys-table"
            >
                <template #cell-name="{row}">
                    <span class="api-key-name">{{ row.name }}</span>
                </template>

                <template #cell-prefix="{row}">
                    <code class="api-key-prefix">{{ row.prefix }}...</code>
                </template>

                <template #cell-lastUsedAt="{row}">
                    <span class="api-key-date">
                        {{ row.lastUsedAt ? formatDate(row.lastUsedAt) : '-' }}
                    </span>
                </template>

                <template #cell-expiresAt="{row}">
                    <CaomeiTag v-if="row.expiresAt" tone="neutral">
                        {{ formatDate(row.expiresAt) }}
                    </CaomeiTag>
                    <span v-else class="api-key-never-expires">
                        {{ $t('pages.settings.api_keys.never_expires') }}
                    </span>
                </template>

                <template #cell-actions="{row}">
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        tone="danger"
                        rounded
                        size="sm"
                        :label="$t('common.delete')"
                        @click="handleDeleteApiKey(row.id)"
                    >
                        <template #icon>
                            <Trash2 :size="16" />
                        </template>
                    </CaomeiButton>
                </template>
            </CaomeiDataTable>
        </div>

        <CaomeiDialog
            :close-on-overlay="false"
            :open="showNewKeyDialog"
            modal
            :title="$t('pages.settings.api_keys.new_key_title')"
            :style="{width: '450px'}"
            @update:open="showNewKeyDialog = $event"
        >
            <div class="new-key-dialog-content">
                <CaomeiMessage tone="warning" :closable="false">
                    {{ $t("pages.settings.api_keys.new_key_hint") }}
                </CaomeiMessage>
                <div class="new-key-input-group">
                    <CaomeiInput
                        :model-value="newlyCreatedKey ?? ''"
                        readonly
                        class="new-key-input"
                    />
                    <CaomeiButton
                        icon-only
                        :label="$t('common.copy')"
                        @click="copyToClipboard(newlyCreatedKey || '')"
                    >
                        <template #icon>
                            <Copy :size="16" />
                        </template>
                    </CaomeiButton>
                </div>
            </div>
            <template #footer>
                <CaomeiButton :label="$t('common.close')" @click="showNewKeyDialog = false">
                    {{ $t('common.close') }}
                </CaomeiButton>
            </template>
        </CaomeiDialog>
    </div>
</template>

<script setup lang="ts">
import { Copy, Plus, Trash2 } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import { useToast } from 'caomei-ui'
const { t } = useI18n()
const { formatDate } = useI18nDate()
const toast = useToast()

const apiKeys = ref<ApiKeyItem[]>([])
const loadingKeys = ref(false)
const loading = ref(false)
const showNewKeyDialog = ref(false)
const newKeyName = ref('')
const newlyCreatedKey = ref<string | null>(null)
const expirationOption = ref('never')

interface ApiKeyItem {
    id: string
    name: string
    prefix: string
    lastUsedAt?: string | null
    expiresAt?: string | null
}

const columns = computed<DataTableColumn<ApiKeyItem>[]>(() => [
    { key: 'name', header: t('pages.settings.api_keys.name') },
    { key: 'prefix', header: t('pages.settings.api_keys.prefix') },
    { key: 'lastUsedAt', header: t('pages.settings.api_keys.last_used_at') },
    { key: 'expiresAt', header: t('pages.settings.api_keys.expires_at') },
    { key: 'actions', header: t('common.actions'), headerClass: 'text-right', bodyClass: 'text-right' },
])

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
            toast.show({ tone: 'success', title: t('common.success'), description: t('pages.settings.api_keys.create_success'), duration: 3000 })
            await fetchApiKeys()
        }
    } catch (e) {
        console.error(e)
        toast.show({ tone: 'danger', title: t('common.error'), description: t('common.unexpected_error'), duration: 3000 })
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
            toast.show({ tone: 'success', title: t('common.success'), description: t('pages.settings.api_keys.delete_success'), duration: 3000 })
            await fetchApiKeys()
        }
    } catch (e) {
        console.error(e)
        toast.show({ tone: 'danger', title: t('common.error'), description: t('common.unexpected_error'), duration: 3000 })
    }
}

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.show({ tone: 'primary', title: t('common.success'), description: 'Copied to clipboard', duration: 2000 })
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

    .caomei-button {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }
}
</style>
