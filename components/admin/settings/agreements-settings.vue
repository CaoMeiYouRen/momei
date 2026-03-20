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
                            icon="pi pi-sparkles"
                            :label="translateAgreement('create_ai_draft')"
                            @click="showAIDraftDialog(section.type)"
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
                                :value="getReviewStatusLabel(data.reviewStatus)"
                                :severity="getReviewStatusSeverity(data.reviewStatus)"
                            />
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
                                v-if="data.reviewStatus === 'draft'"
                                icon="pi pi-send"
                                class="p-button-rounded p-button-text"
                                :title="translateAgreement('submit_review')"
                                @click="updateReviewStatus(data, section.type, 'pending_review')"
                            />
                            <Button
                                v-if="data.reviewStatus === 'pending_review'"
                                icon="pi pi-verified"
                                class="p-button-rounded p-button-text"
                                :title="translateAgreement('approve_review')"
                                @click="updateReviewStatus(data, section.type, 'approved')"
                            />
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
                                :disabled="!data.canActivate || data.isCurrentActive"
                                :title="getActivateMessage(data)"
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

        <AgreementEditDialog
            v-model:visible="showDialog"
            :is-edit-mode="isEditMode"
            :form-data="formData"
            :language-options="languageOptions"
            :current-authoritative-options="currentAuthoritativeOptions"
            :is-reference-language="isReferenceLanguage"
            :generating-a-i-draft="generatingAIDraft"
            :saving="saving"
            :locale-code="locale"
            @update:form-data="Object.assign(formData, $event)"
            @generate-ai-draft="generateAgreementDraft"
            @save="saveAgreement"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import AgreementEditDialog from './agreement-edit-dialog.vue'
import type { ApiResponse } from '@/types/api'
import type {
    AgreementAdminItem,
    AgreementAdminListPayload,
    AgreementReviewStatus,
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
const generatingAIDraft = ref(false)
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

function getReviewStatusLabel(status: AgreementReviewStatus) {
    return translateAgreement(`review_statuses.${status}`)
}

function getReviewStatusSeverity(status: AgreementReviewStatus) {
    switch (status) {
        case 'approved':
            return 'success'
        case 'pending_review':
            return 'warn'
        default:
            return 'secondary'
    }
}

function getActivateMessage(item: AgreementAdminItem) {
    if (item.isCurrentActive) {
        return translateAgreement('already_active')
    }

    if (!item.canActivate) {
        return translateAgreement('activate_requires_approval')
    }

    return ''
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

function showAIDraftDialog(type: AgreementType) {
    isEditMode.value = false
    resetForm(type)
    const payload = payloads[type]
    const defaultTranslationLanguage = languageOptions.value.find((item) => item.value !== (payload?.mainLanguage || 'zh-CN'))
    if (defaultTranslationLanguage) {
        formData.language = defaultTranslationLanguage.value
        formData.sourceAgreementId = getDefaultSourceAgreementId(type)
    }
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

async function generateAgreementDraft() {
    if (!formData.sourceAgreementId) {
        return
    }

    generatingAIDraft.value = true
    try {
        const response = await $appFetch<ApiResponse<{ id: string }>>('/api/admin/agreements/ai-draft', {
            method: 'POST',
            body: {
                type: currentType.value,
                sourceAgreementId: formData.sourceAgreementId,
                targetLanguage: formData.language,
                version: formData.version || null,
                versionDescription: formData.versionDescription || null,
            },
        })

        showDialog.value = false
        await loadAgreements(currentType.value)

        const createdItem = payloads[currentType.value]?.items.find((item) => item.id === response.data?.id)
        if (createdItem) {
            editAgreement(createdItem, currentType.value)
        }

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: translateAgreement('ai_draft_success'),
            life: 3000,
        })
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || translateAgreement('ai_draft_failed'),
            life: 3000,
        })
    } finally {
        generatingAIDraft.value = false
    }
}

async function updateReviewStatus(
    agreement: AgreementAdminItem,
    type: AgreementType,
    reviewStatus: AgreementReviewStatus,
) {
    saving.value = true
    try {
        await $appFetch(`/api/admin/agreements/${agreement.id}/review-status`, {
            method: 'POST',
            body: { reviewStatus },
        })

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: reviewStatus === 'approved'
                ? translateAgreement('approve_success')
                : translateAgreement('submit_review_success'),
            life: 3000,
        })

        await loadAgreements(type)
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || translateAgreement('review_status_failed'),
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

<style lang="scss" scoped src="./agreements-settings.scss"></style>
