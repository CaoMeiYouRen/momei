<template>
    <div class="agreements-settings">
        <div class="agreements-settings__header">
            <h3 class="agreements-settings__title">
                {{ $t('pages.admin.settings.system.agreements.title') }}
            </h3>
            <p class="agreements-settings__description">
                {{ $t('pages.admin.settings.system.agreements.description') }}
            </p>
        </div>

        <!-- User Agreement Tab -->
        <div class="agreements-settings__section">
            <h4 class="agreements-settings__subtitle">
                {{ $t('pages.admin.settings.system.agreements.user_agreement') }}
            </h4>

            <div class="agreements-settings__controls">
                <Button
                    icon="pi pi-plus"
                    :label="$t('common.add')"
                    @click="showCreateDialog('user_agreement')"
                />
                <Button
                    icon="pi pi-refresh"
                    :label="$t('common.refresh')"
                    :loading="loadingAgreements"
                    @click="loadAgreements('user_agreement')"
                />
            </div>

            <DataTable
                :value="userAgreements"
                :loading="loadingAgreements"
                responsive-layout="scroll"
                class="agreements-settings__table"
            >
                <Column field="version" :header="$t('pages.admin.settings.system.agreements.version')" />
                <Column field="language" :header="$t('pages.admin.settings.system.agreements.language')" />
                <Column
                    field="createdAt"
                    :header="$t('pages.admin.settings.system.agreements.created')"
                    body-class="text-right"
                >
                    <template #body="{data}">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>
                <Column
                    field="isMainVersion"
                    :header="$t('pages.admin.settings.system.agreements.is_main')"
                    body-class="text-center"
                >
                    <template #body="{data}">
                        <Tag :value="data.isMainVersion ? $t('common.yes') : $t('common.no')" :severity="data.isMainVersion ? 'success' : 'info'" />
                    </template>
                </Column>
                <Column :header="$t('common.actions')" body-class="text-right">
                    <template #body="{data}">
                        <Button
                            icon="pi pi-pencil"
                            class="p-button-rounded p-button-text"
                            @click="editAgreement(data, 'user_agreement')"
                        />
                        <Button
                            v-if="!data.isMainVersion"
                            v-tooltip="$t('pages.admin.settings.system.agreements.set_as_main')"
                            icon="pi pi-check"
                            class="p-button-rounded p-button-success p-button-text"
                            @click="activateAgreement(data, 'user_agreement')"
                        />
                        <Button
                            icon="pi pi-trash"
                            class="p-button-danger p-button-rounded p-button-text"
                            @click="confirmDelete(data, 'user_agreement')"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Privacy Policy Tab -->
        <div class="agreements-settings__section">
            <h4 class="agreements-settings__subtitle">
                {{ $t('pages.admin.settings.system.agreements.privacy_policy') }}
            </h4>

            <div class="agreements-settings__controls">
                <Button
                    icon="pi pi-plus"
                    :label="$t('common.add')"
                    @click="showCreateDialog('privacy_policy')"
                />
                <Button
                    icon="pi pi-refresh"
                    :label="$t('common.refresh')"
                    :loading="loadingAgreements"
                    @click="loadAgreements('privacy_policy')"
                />
            </div>

            <DataTable
                :value="privacyPolicies"
                :loading="loadingAgreements"
                responsive-layout="scroll"
                class="agreements-settings__table"
            >
                <Column field="version" :header="$t('pages.admin.settings.system.agreements.version')" />
                <Column field="language" :header="$t('pages.admin.settings.system.agreements.language')" />
                <Column
                    field="createdAt"
                    :header="$t('pages.admin.settings.system.agreements.created')"
                    body-class="text-right"
                >
                    <template #body="{data}">
                        {{ formatDate(data.createdAt) }}
                    </template>
                </Column>
                <Column
                    field="isMainVersion"
                    :header="$t('pages.admin.settings.system.agreements.is_main')"
                    body-class="text-center"
                >
                    <template #body="{data}">
                        <Tag :value="data.isMainVersion ? $t('common.yes') : $t('common.no')" :severity="data.isMainVersion ? 'success' : 'info'" />
                    </template>
                </Column>
                <Column :header="$t('common.actions')" body-class="text-right">
                    <template #body="{data}">
                        <Button
                            icon="pi pi-pencil"
                            class="p-button-rounded p-button-text"
                            @click="editAgreement(data, 'privacy_policy')"
                        />
                        <Button
                            v-if="!data.isMainVersion"
                            v-tooltip="$t('pages.admin.settings.system.agreements.set_as_main')"
                            icon="pi pi-check"
                            class="p-button-rounded p-button-success p-button-text"
                            @click="activateAgreement(data, 'privacy_policy')"
                        />
                        <Button
                            icon="pi pi-trash"
                            class="p-button-danger p-button-rounded p-button-text"
                            @click="confirmDelete(data, 'privacy_policy')"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Create/Edit Dialog -->
        <Dialog
            v-model:visible="showDialog"
            :header="isEditMode ? $t('pages.admin.settings.system.agreements.edit') : $t('pages.admin.settings.system.agreements.create')"
            modal
            class="agreements-settings__dialog"
        >
            <div class="field">
                <label for="language">{{ $t('pages.admin.settings.system.agreements.language') }}</label>
                <InputText
                    id="language"
                    v-model="formData.language"
                    class="w-full"
                    required
                />
            </div>

            <div class="field">
                <label for="version">{{ $t('pages.admin.settings.system.agreements.version') }}</label>
                <InputText
                    id="version"
                    v-model="formData.version"
                    class="w-full"
                    placeholder="e.g., 1.0, 2.0"
                />
            </div>

            <div class="field">
                <label for="versionDescription">{{ $t('pages.admin.settings.system.agreements.version_description') }}</label>
                <Textarea
                    id="versionDescription"
                    v-model="formData.versionDescription"
                    class="w-full"
                    rows="3"
                    placeholder="e.g., Bug fixes and improvements"
                />
            </div>

            <div class="field">
                <label for="content">{{ $t('pages.admin.settings.system.agreements.content') }}</label>
                <ClientOnly>
                    <mavon-editor
                        id="content"
                        v-model="formData.content"
                        class="agreements-settings__editor"
                        :subfield="false"
                        :language="locale === 'zh-CN' ? 'zh-CN' : 'en'"
                    />
                </ClientOnly>
            </div>

            <div class="field">
                <div class="align-items-center flex">
                    <Checkbox
                        id="isMainVersion"
                        v-model="formData.isMainVersion"
                        binary
                    />
                    <label for="isMainVersion" class="ml-2">
                        {{ $t('pages.admin.settings.system.agreements.set_as_main') }}
                    </label>
                </div>
            </div>

            <template #footer>
                <Button
                    :label="$t('common.cancel')"
                    icon="pi pi-times"
                    class="p-button-text"
                    @click="showDialog = false"
                />
                <Button
                    :label="$t('common.save')"
                    icon="pi pi-check"
                    :loading="saving"
                    @click="saveAgreement"
                />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DOMPurify from 'dompurify'

interface AgreementData {
    id?: string
    type?: 'user_agreement' | 'privacy_policy'
    language: string
    version: string | null
    versionDescription: string | null
    content: string
    isMainVersion: boolean
    createdAt?: string
}

const { t, locale } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const { $appFetch } = useAppApi()

const userAgreements = ref<AgreementData[]>([])
const privacyPolicies = ref<AgreementData[]>([])
const loadingAgreements = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const isEditMode = ref(false)
const currentType = ref<'user_agreement' | 'privacy_policy'>('user_agreement')
const currentEditId = ref<string>('')

const formData = reactive<AgreementData>({
    language: 'zh-CN',
    version: '',
    versionDescription: '',
    content: '',
    isMainVersion: false,
})

const formatDate = (date: string | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString(t('app.locale'))
}

const loadAgreements = async (type: 'user_agreement' | 'privacy_policy') => {
    loadingAgreements.value = true
    try {
        const { data } = await $appFetch(`/api/admin/agreements?type=${type}`)
        if (type === 'user_agreement') {
            userAgreements.value = data || []
        } else {
            privacyPolicies.value = data || []
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('pages.admin.settings.system.agreements.load_failed'),
            life: 3000,
        })
    } finally {
        loadingAgreements.value = false
    }
}

const showCreateDialog = (type: 'user_agreement' | 'privacy_policy') => {
    currentType.value = type
    isEditMode.value = false
    currentEditId.value = ''
    formData.language = 'zh-CN'
    formData.version = ''
    formData.versionDescription = ''
    formData.content = ''
    formData.isMainVersion = false
    showDialog.value = true
}

const editAgreement = (agreement: AgreementData, type: 'user_agreement' | 'privacy_policy') => {
    currentType.value = type
    currentEditId.value = agreement.id || ''
    isEditMode.value = true
    formData.language = agreement.language
    formData.version = agreement.version || ''
    formData.versionDescription = agreement.versionDescription || ''
    formData.content = agreement.content
    formData.isMainVersion = agreement.isMainVersion
    showDialog.value = true
}

const saveAgreement = async () => {
    saving.value = true
    try {
        if (isEditMode.value && currentEditId.value) {
            // Update existing agreement
            await $appFetch(`/api/admin/agreements/${currentEditId.value}`, {
                method: 'PUT',
                body: {
                    content: formData.content,
                    version: formData.version || null,
                    versionDescription: formData.versionDescription || null,
                    isMainVersion: formData.isMainVersion,
                },
            })
            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('pages.admin.settings.system.agreements.update_success'),
                life: 3000,
            })
        } else {
            // Create new agreement
            await $appFetch('/api/admin/agreements', {
                method: 'POST',
                body: {
                    type: currentType.value,
                    language: formData.language,
                    content: formData.content,
                    version: formData.version || null,
                    versionDescription: formData.versionDescription || null,
                    isMainVersion: formData.isMainVersion,
                },
            })
            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('pages.admin.settings.system.agreements.create_success'),
                life: 3000,
            })
        }
        showDialog.value = false
        loadAgreements(currentType.value)
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || t('pages.admin.settings.system.agreements.save_failed'),
            life: 3000,
        })
    } finally {
        saving.value = false
    }
}

const activateAgreement = async (agreement: AgreementData, type: 'user_agreement' | 'privacy_policy') => {
    saving.value = true
    try {
        await $appFetch(`/api/admin/agreements/${type}/activate`, {
            method: 'POST',
            body: {
                agreementId: agreement.id,
            },
        })
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.settings.system.agreements.activate_success'),
            life: 3000,
        })
        loadAgreements(type)
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || t('pages.admin.settings.system.agreements.activate_failed'),
            life: 3000,
        })
    } finally {
        saving.value = false
    }
}

const confirmDelete = (agreement: AgreementData, type: 'user_agreement' | 'privacy_policy') => {
    confirm.require({
        message: t('pages.admin.settings.system.agreements.delete_confirm'),
        header: t('common.confirm'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteAgreement(agreement, type),
    })
}

const deleteAgreement = async (agreement: AgreementData, type: 'user_agreement' | 'privacy_policy') => {
    saving.value = true
    try {
        await $appFetch(`/api/admin/agreements/${agreement.id}`, {
            method: 'DELETE',
        })
        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.settings.system.agreements.delete_success'),
            life: 3000,
        })
        loadAgreements(type)
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || t('pages.admin.settings.system.agreements.delete_failed'),
            life: 3000,
        })
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadAgreements('user_agreement')
    loadAgreements('privacy_policy')
})
</script>

<style lang="scss" scoped>
.agreements-settings {
    &__header {
        margin-bottom: 2rem;
    }

    &__title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--p-text-color);
    }

    &__description {
        color: var(--p-text-muted-color);
        margin: 0;
    }

    &__section {
        margin-bottom: 2rem;

        &:not(:last-child) {
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--p-content-border-color);
        }
    }

    &__subtitle {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--p-text-color);
    }

    &__controls {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    &__table {
        :deep(.p-datatable) {
            font-size: 0.875rem;
        }
    }

    &__dialog {
        width: 90vw;
        max-width: 900px;

        :deep(.p-dialog-content) {
            padding: 1.5rem;
        }

        .field {
            margin-bottom: 1.5rem;

            label:not(.ml-2) {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: var(--p-text-color);
            }

            input,
            textarea,
            select {
                width: 100%;
            }

            .align-items-center {
                label {
                    cursor: pointer;
                }
            }
        }
    }

    &__editor {
        min-height: 400px;
        z-index: 1;
        border: 1px solid var(--p-content-border-color);
        border-radius: var(--p-border-radius-md);

        :deep(.v-note-wrapper) {
            border: none;
            min-height: 400px;
        }
    }
}

:global(.dark) .agreements-settings {
    &__title,
    &__subtitle {
        color: var(--p-text-color);
    }

    &__description {
        color: var(--p-text-muted-color);
    }
}
</style>
