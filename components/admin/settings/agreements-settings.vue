<!-- eslint-disable max-lines -->
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

        <section
            v-for="section in agreementSections"
            :key="section.type"
            class="agreements-settings__section"
        >
            <div class="agreements-settings__section-header">
                <div>
                    <h4 class="agreements-settings__subtitle">
                        {{ section.title }}
                    </h4>
                    <div class="agreements-settings__summary">
                        <span>
                            {{ translateAgreement('main_language') }}:
                            {{ getLanguageLabel(section.payload?.mainLanguage || 'zh-CN') }}
                        </span>
                        <span>
                            {{ translateAgreement('active_authoritative') }}:
                            {{ getActiveLabel(section.payload) }}
                        </span>
                    </div>
                </div>

                <div class="agreements-settings__toolbar">
                    <div class="agreements-settings__view-switch">
                        <Button
                            :label="translateAgreement('aggregated_view')"
                            :outlined="viewMode !== 'aggregated'"
                            @click="viewMode = 'aggregated'"
                        />
                        <Button
                            :label="translateAgreement('flat_view')"
                            :outlined="viewMode !== 'flat'"
                            @click="viewMode = 'flat'"
                        />
                    </div>

                    <div class="agreements-settings__controls">
                        <Button
                            icon="pi pi-plus"
                            :label="$t('common.add')"
                            @click="showCreateDialog(section.type)"
                        />
                        <Button
                            icon="pi pi-refresh"
                            :label="$t('common.refresh')"
                            :loading="isLoading(section.type)"
                            @click="loadAgreements(section.type)"
                        />
                    </div>
                </div>
            </div>

            <p class="agreements-settings__view-hint">
                {{ getViewHint() }}
            </p>

            <DataTable
                :value="getDisplayItems(section.payload)"
                :loading="isLoading(section.type)"
                responsive-layout="scroll"
                class="agreements-settings__table"
            >
                <template #empty>
                    {{ translateAgreement('empty') }}
                </template>

                <Column field="version" :header="$t('pages.admin.settings.system.agreements.version')">
                    <template #body="{data}">
                        <strong>{{ data.version || translateAgreement('version_fallback') }}</strong>
                    </template>
                </Column>

                <Column field="language" :header="$t('pages.admin.settings.system.agreements.language')">
                    <template #body="{data}">
                        {{ getLanguageLabel(data.language) }}
                    </template>
                </Column>

                <Column :header="translateAgreement('role')">
                    <template #body="{data}">
                        <div class="agreements-settings__tag-group">
                            <Tag
                                :value="data.isAuthoritativeVersion
                                    ? translateAgreement('authoritative_version')
                                    : translateAgreement('reference_translation')"
                                :severity="data.isAuthoritativeVersion ? 'success' : 'info'"
                            />
                        </div>
                    </template>
                </Column>

                <Column :header="translateAgreement('relation')">
                    <template #body="{data}">
                        <span v-if="data.isReferenceTranslation">
                            {{ getSourceLabel(data) }}
                        </span>
                        <span v-else>
                            {{ translateAgreement('authoritative_version') }}
                        </span>
                    </template>
                </Column>

                <Column :header="translateAgreement('status')">
                    <template #body="{data}">
                        <div class="agreements-settings__tag-group">
                            <Tag
                                v-if="data.isCurrentActive"
                                :value="translateAgreement('current_active')"
                                severity="warn"
                            />
                            <Tag
                                v-if="data.isCurrentReference"
                                :value="translateAgreement('current_reference')"
                                severity="secondary"
                            />
                            <Tag
                                v-if="data.isFromEnv"
                                :value="translateAgreement('env_locked')"
                                severity="secondary"
                            />
                            <Tag
                                v-if="data.hasUserConsent"
                                :value="translateAgreement('consented')"
                                severity="danger"
                            />
                        </div>
                    </template>
                </Column>

                <Column :header="translateAgreement('effective_date')">
                    <template #body="{data}">
                        {{ formatDate(data.effectiveAt) }}
                    </template>
                </Column>

                <Column :header="translateAgreement('updated_at')">
                    <template #body="{data}">
                        {{ formatDate(data.updatedAt || data.createdAt) }}
                    </template>
                </Column>

                <Column :header="$t('pages.admin.settings.system.agreements.version_description')">
                    <template #body="{data}">
                        {{ data.versionDescription || translateAgreement('no_description') }}
                    </template>
                </Column>

                <Column :header="$t('common.actions')" body-class="text-right">
                    <template #body="{data}">
                        <div class="agreements-settings__actions">
                            <Button
                                icon="pi pi-pencil"
                                class="p-button-rounded p-button-text"
                                :disabled="!data.canEdit"
                                :title="getRestrictionMessage(data.restrictionReasons)"
                                @click="editAgreement(data, section.type)"
                            />
                            <Button
                                v-if="data.isAuthoritativeVersion"
                                icon="pi pi-check"
                                class="p-button-rounded p-button-success p-button-text"
                                :disabled="data.isCurrentActive"
                                :title="data.isCurrentActive ? translateAgreement('already_active') : ''"
                                @click="activateAgreement(data, section.type)"
                            />
                            <Button
                                icon="pi pi-trash"
                                class="p-button-danger p-button-rounded p-button-text"
                                :disabled="!data.canDelete"
                                :title="getRestrictionMessage(data.restrictionReasons)"
                                @click="confirmDelete(data, section.type)"
                            />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </section>

        <Dialog
            v-model:visible="showDialog"
            :header="isEditMode ? $t('pages.admin.settings.system.agreements.edit') : $t('pages.admin.settings.system.agreements.create')"
            modal
            class="agreements-settings__dialog"
        >
            <div class="agreements-settings__field">
                <label for="language">{{ $t('pages.admin.settings.system.agreements.language') }}</label>
                <Select
                    id="language"
                    v-model="formData.language"
                    :options="languageOptions"
                    option-label="label"
                    option-value="value"
                    fluid
                    :disabled="isEditMode"
                />
                <small class="agreements-settings__help">
                    {{ translateAgreement('language_help') }}
                </small>
            </div>

            <div class="agreements-settings__field">
                <label for="version">{{ $t('pages.admin.settings.system.agreements.version') }}</label>
                <InputText
                    id="version"
                    v-model="formData.version"
                    fluid
                    placeholder="e.g. 2026.01"
                />
            </div>

            <div class="agreements-settings__field">
                <label for="versionDescription">{{ $t('pages.admin.settings.system.agreements.version_description') }}</label>
                <Textarea
                    id="versionDescription"
                    v-model="formData.versionDescription"
                    rows="3"
                    fluid
                    auto-resize
                />
            </div>

            <div v-if="isReferenceLanguage" class="agreements-settings__field">
                <label for="sourceAgreementId">{{ translateAgreement('source_version') }}</label>
                <Select
                    id="sourceAgreementId"
                    v-model="formData.sourceAgreementId"
                    :options="currentAuthoritativeOptions"
                    option-label="label"
                    option-value="id"
                    fluid
                    show-clear
                    :placeholder="translateAgreement('source_version_placeholder')"
                />
                <small class="agreements-settings__help">
                    {{ translateAgreement('source_version_help') }}
                </small>
            </div>
            <div v-else class="agreements-settings__notice">
                {{ translateAgreement('authoritative_help') }}
            </div>

            <div class="agreements-settings__field">
                <label for="content">{{ $t('pages.admin.settings.system.agreements.content') }}</label>
                <ClientOnly>
                    <AdminMavonEditorClient
                        id="content"
                        v-model="formData.content"
                        class="agreements-settings__editor"
                        :subfield="false"
                        :language="locale === 'zh-CN' ? 'zh-CN' : 'en'"
                    />
                </ClientOnly>
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
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import type { ApiResponse } from '@/types/api'
import type {
    AgreementAdminItem,
    AgreementAdminListPayload,
    AgreementRestrictionReason,
    AgreementType,
} from '@/types/agreement'

interface AgreementFormData {
    language: string
    version: string
    versionDescription: string
    content: string
    sourceAgreementId: string | null
}

type AgreementViewMode = 'aggregated' | 'flat'

const { t, locale, locales } = useI18n()
const toast = useToast()
const confirm = useConfirm()
const { $appFetch } = useAppApi()

const payloads = reactive<Record<AgreementType, AgreementAdminListPayload | null>>({
    user_agreement: null,
    privacy_policy: null,
})

const loadingMap = reactive<Record<AgreementType, boolean>>({
    user_agreement: false,
    privacy_policy: false,
})

const showDialog = ref(false)
const saving = ref(false)
const isEditMode = ref(false)
const viewMode = ref<AgreementViewMode>('aggregated')
const currentType = ref<AgreementType>('user_agreement')
const currentEditId = ref('')

const formData = reactive<AgreementFormData>({
    language: 'zh-CN',
    version: '',
    versionDescription: '',
    content: '',
    sourceAgreementId: null,
})

const agreementSections = computed(() => ([
    {
        type: 'user_agreement' as AgreementType,
        title: t('pages.admin.settings.system.agreements.user_agreement'),
        payload: payloads.user_agreement,
    },
    {
        type: 'privacy_policy' as AgreementType,
        title: t('pages.admin.settings.system.agreements.privacy_policy'),
        payload: payloads.privacy_policy,
    },
]))

const currentPayload = computed(() => payloads[currentType.value])
const mainLanguage = computed(() => currentPayload.value?.mainLanguage || 'zh-CN')
const currentAuthoritativeOptions = computed(() => currentPayload.value?.authoritativeOptions || [])
const isReferenceLanguage = computed(() => formData.language !== mainLanguage.value)
const languageOptions = computed(() => locales.value.map((item: any) => ({
    label: getLanguageLabel(item.code),
    value: item.code,
})))

watch([mainLanguage, () => formData.language], ([currentMainLanguage, currentLanguage]) => {
    if (currentLanguage === currentMainLanguage) {
        formData.sourceAgreementId = null
        return
    }

    const availableOptionIds = new Set(currentAuthoritativeOptions.value.map((item) => item.id))
    if (formData.sourceAgreementId && availableOptionIds.has(formData.sourceAgreementId)) {
        return
    }

    formData.sourceAgreementId = getDefaultSourceAgreementId(currentType.value)
})

function isLoading(type: AgreementType) {
    return loadingMap[type]
}

function translateAgreement(key: string) {
    return t(`pages.admin.settings.system.agreements.${key}` as never)
}

function translateRestriction(reason: AgreementRestrictionReason) {
    return t(`pages.admin.settings.system.agreements.restrictions.${reason}` as never)
}

function formatDate(date?: string | null) {
    if (!date) {
        return translateAgreement('date_fallback')
    }

    return new Intl.DateTimeFormat(locale.value, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date))
}

function getLanguageLabel(value?: string | null) {
    if (!value) {
        return translateAgreement('language_unknown')
    }

    return t(`common.languages.${value}`)
}

function getActiveLabel(payload: AgreementAdminListPayload | null) {
    if (!payload?.activeAgreementId) {
        return translateAgreement('no_active_version')
    }

    const activeOption = payload.authoritativeOptions.find((item) => item.id === payload.activeAgreementId)
    if (activeOption) {
        return `${activeOption.version || translateAgreement('version_fallback')} · ${getLanguageLabel(activeOption.language)}`
    }

    const active = payload.items.find((item) => item.id === payload.activeAgreementId)
    if (!active) {
        return translateAgreement('no_active_version')
    }

    return `${active.version || translateAgreement('version_fallback')} · ${getLanguageLabel(active.language)}`
}

function getSourceLabel(item: AgreementAdminItem) {
    if (!item.sourceAgreementId) {
        return translateAgreement('no_source_version')
    }

    return `${item.sourceAgreementVersion || translateAgreement('version_fallback')} · ${getLanguageLabel(item.sourceAgreementLanguage)}`
}

function getRestrictionMessage(reasons: AgreementRestrictionReason[]) {
    if (!reasons.length) {
        return ''
    }

    return reasons
        .map((reason) => translateRestriction(reason))
        .join(' / ')
}

function getDefaultSourceAgreementId(type: AgreementType) {
    const payload = payloads[type]
    return payload?.activeAgreementId || payload?.authoritativeOptions[0]?.id || null
}

function getDisplayItems(payload: AgreementAdminListPayload | null) {
    if (!payload) {
        return []
    }

    if (viewMode.value === 'flat') {
        return payload.items
    }

    const authoritativeItems = payload.items.filter((item) => item.isAuthoritativeVersion)
    const translationsBySource = new Map<string, AgreementAdminItem[]>()

    payload.items
        .filter((item) => item.isReferenceTranslation && item.sourceAgreementId)
        .forEach((item) => {
            const sourceId = item.sourceAgreementId
            if (!sourceId) {
                return
            }

            const siblings = translationsBySource.get(sourceId) || []
            siblings.push(item)
            translationsBySource.set(sourceId, siblings)
        })

    const rows = authoritativeItems.map((authoritativeItem) => {
        const localizedTranslation = (translationsBySource.get(authoritativeItem.id) || [])
            .find((item) => item.language === locale.value)

        return localizedTranslation || authoritativeItem
    })

    const authoritativeIds = new Set(authoritativeItems.map((item) => item.id))
    const orphanTranslations = payload.items.filter((item) => item.isReferenceTranslation && (!item.sourceAgreementId || !authoritativeIds.has(item.sourceAgreementId)))

    return [...rows, ...orphanTranslations]
}

function getViewHint() {
    return viewMode.value === 'aggregated'
        ? translateAgreement('aggregated_view_help')
        : translateAgreement('flat_view_help')
}

async function loadAgreements(type: AgreementType) {
    loadingMap[type] = true
    try {
        const response = await $appFetch<ApiResponse<AgreementAdminListPayload>>('/api/admin/agreements', {
            query: {
                type,
                // Agreements management needs the full dataset; otherwise useAppApi injects
                // the current UI language and collapses grouped/full-list views into the same result.
                language: undefined,
            },
        })
        payloads[type] = response.data || {
            mainLanguage: 'zh-CN',
            activeAgreementId: null,
            items: [],
            authoritativeOptions: [],
        }
    } catch {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('pages.admin.settings.system.agreements.load_failed'),
            life: 3000,
        })
    } finally {
        loadingMap[type] = false
    }
}

function resetForm(type: AgreementType) {
    currentType.value = type
    currentEditId.value = ''
    formData.language = payloads[type]?.mainLanguage || 'zh-CN'
    formData.version = ''
    formData.versionDescription = ''
    formData.content = ''
    formData.sourceAgreementId = getDefaultSourceAgreementId(type)
}

function showCreateDialog(type: AgreementType) {
    isEditMode.value = false
    resetForm(type)
    showDialog.value = true
}

function editAgreement(agreement: AgreementAdminItem, type: AgreementType) {
    currentType.value = type
    currentEditId.value = agreement.id
    isEditMode.value = true
    formData.language = agreement.language
    formData.version = agreement.version || ''
    formData.versionDescription = agreement.versionDescription || ''
    formData.content = agreement.content
    formData.sourceAgreementId = agreement.sourceAgreementId
    showDialog.value = true
}

async function saveAgreement() {
    saving.value = true
    try {
        if (isEditMode.value && currentEditId.value) {
            await $appFetch(`/api/admin/agreements/${currentEditId.value}`, {
                method: 'PUT',
                body: {
                    content: formData.content,
                    version: formData.version || null,
                    versionDescription: formData.versionDescription || null,
                    sourceAgreementId: isReferenceLanguage.value ? formData.sourceAgreementId : null,
                },
            })

            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('pages.admin.settings.system.agreements.update_success'),
                life: 3000,
            })
        } else {
            await $appFetch('/api/admin/agreements', {
                method: 'POST',
                body: {
                    type: currentType.value,
                    language: formData.language,
                    content: formData.content,
                    version: formData.version || null,
                    versionDescription: formData.versionDescription || null,
                    sourceAgreementId: isReferenceLanguage.value ? formData.sourceAgreementId : null,
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
        await loadAgreements(currentType.value)
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

async function activateAgreement(agreement: AgreementAdminItem, type: AgreementType) {
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

        await loadAgreements(type)
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

function confirmDelete(agreement: AgreementAdminItem, type: AgreementType) {
    confirm.require({
        message: t('pages.admin.settings.system.agreements.delete_confirm'),
        header: t('common.confirm'),
        icon: 'pi pi-exclamation-triangle',
        accept: () => deleteAgreement(agreement, type),
    })
}

async function deleteAgreement(agreement: AgreementAdminItem, type: AgreementType) {
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

        await loadAgreements(type)
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

onMounted(async () => {
    await Promise.all([
        loadAgreements('user_agreement'),
        loadAgreements('privacy_policy'),
    ])
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

    &__section-header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        margin-bottom: 1rem;
    }

    &__subtitle {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--p-text-color);
    }

    &__summary {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
    }

    &__toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
        justify-content: flex-end;
    }

    &__view-switch {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    &__view-hint {
        margin: 0 0 1rem;
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
    }

    &__controls {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    &__table {
        :deep(.p-datatable) {
            font-size: 0.875rem;
        }
    }

    &__tag-group {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.25rem;
    }

    &__dialog {
        width: 90vw;
        max-width: 900px;

        :deep(.p-dialog-content) {
            padding: 1.5rem;
        }
    }

    &__field {
        margin-bottom: 1.5rem;

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--p-text-color);
        }
    }

    &__help {
        display: block;
        margin-top: 0.5rem;
        color: var(--p-text-muted-color);
    }

    &__notice {
        margin-bottom: 1.5rem;
        padding: 0.875rem 1rem;
        border-radius: 0.5rem;
        border: 1px solid var(--p-content-border-color);
        background: color-mix(in srgb, var(--p-surface-100) 88%, transparent);
        color: var(--p-text-color);
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
    &__subtitle,
    &__notice {
        color: var(--p-text-color);
    }

    &__description,
    &__summary,
    &__help {
        color: var(--p-text-muted-color);
    }
}

@media (width <= 768px) {
    .agreements-settings {
        &__section-header {
            flex-direction: column;
        }

        &__toolbar {
            width: 100%;
            justify-content: flex-start;
        }
    }
}
</style>
