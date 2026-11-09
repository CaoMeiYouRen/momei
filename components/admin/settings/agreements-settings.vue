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
                        <CaomeiButton
                            :variant="viewMode === 'aggregated' ? 'primary' : 'secondary'"
                            :label="translateAgreement('aggregated_view')"
                            @click="viewMode = 'aggregated'"
                        >
                            {{ translateAgreement('aggregated_view') }}
                        </CaomeiButton>
                        <CaomeiButton
                            :variant="viewMode === 'flat' ? 'primary' : 'secondary'"
                            :label="translateAgreement('flat_view')"
                            @click="viewMode = 'flat'"
                        >
                            {{ translateAgreement('flat_view') }}
                        </CaomeiButton>
                    </div>

                    <div class="agreements-settings__controls">
                        <CaomeiButton
                            :label="$t('common.add')"
                            @click="showCreateDialog(section.type)"
                        >
                            <template #icon>
                                <Plus :size="16" />
                            </template>
                            {{ $t('common.add') }}
                        </CaomeiButton>
                        <CaomeiButton
                            :label="translateAgreement('create_ai_draft')"
                            @click="showAIDraftDialog(section.type)"
                        >
                            <template #icon>
                                <Sparkles :size="16" />
                            </template>
                            {{ translateAgreement('create_ai_draft') }}
                        </CaomeiButton>
                        <CaomeiButton
                            :label="$t('common.refresh')"
                            :loading="isLoading(section.type)"
                            @click="loadAgreements(section.type)"
                        >
                            <template #icon>
                                <RefreshCw :size="16" />
                            </template>
                            {{ $t('common.refresh') }}
                        </CaomeiButton>
                    </div>
                </div>
            </div>

            <p class="agreements-settings__view-hint">
                {{ getViewHint() }}
            </p>

            <CaomeiDataTable
                :data="getDisplayItems(section.payload)"
                :columns="agreementColumns"
                :loading="isLoading(section.type)"
            >
                <template #empty>
                    {{ translateAgreement('empty') }}
                </template>

                <template #cell-version="{row}">
                    <strong>{{ row.version || translateAgreement('version_fallback') }}</strong>
                </template>

                <template #cell-language="{row}">
                    {{ getLanguageLabel(row.language) }}
                </template>

                <template #cell-role="{row}">
                    <div class="agreements-settings__tag-group">
                        <CaomeiTag :tone="row.isAuthoritativeVersion ? 'success' : 'primary'">
                            {{ row.isAuthoritativeVersion
                                ? translateAgreement('authoritative_version')
                                : translateAgreement('reference_translation') }}
                        </CaomeiTag>
                    </div>
                </template>

                <template #cell-relation="{row}">
                    <span v-if="row.isReferenceTranslation">
                        {{ getSourceLabel(row) }}
                    </span>
                    <span v-else>
                        {{ translateAgreement('authoritative_version') }}
                    </span>
                </template>

                <template #cell-status="{row}">
                    <div class="agreements-settings__tag-group">
                        <CaomeiTag :tone="getReviewStatusTone(row.reviewStatus)">
                            {{ getReviewStatusLabel(row.reviewStatus) }}
                        </CaomeiTag>
                        <CaomeiTag v-if="row.isCurrentActive" tone="warning">
                            {{ translateAgreement('current_active') }}
                        </CaomeiTag>
                        <CaomeiTag v-if="row.isCurrentReference" tone="neutral">
                            {{ translateAgreement('current_reference') }}
                        </CaomeiTag>
                        <CaomeiTag v-if="row.isFromEnv" tone="neutral">
                            {{ translateAgreement('env_locked') }}
                        </CaomeiTag>
                        <CaomeiTag v-if="row.hasUserConsent" tone="danger">
                            {{ translateAgreement('consented') }}
                        </CaomeiTag>
                    </div>
                </template>

                <template #cell-effectiveDate="{row}">
                    {{ formatDate(row.effectiveAt) }}
                </template>

                <template #cell-updatedAt="{row}">
                    {{ formatDate(row.updatedAt || row.createdAt) }}
                </template>

                <template #cell-versionDescription="{row}">
                    {{ row.versionDescription || translateAgreement('no_description') }}
                </template>

                <template #cell-actions="{row}">
                    <div class="agreements-settings__actions">
                        <CaomeiButton
                            v-if="row.reviewStatus === 'draft'"
                            icon-only
                            rounded
                            variant="ghost"
                            :label="translateAgreement('submit_review')"
                            :title="translateAgreement('submit_review')"
                            @click="updateReviewStatus(row, section.type, 'pending_review')"
                        >
                            <template #icon>
                                <Send :size="16" />
                            </template>
                        </CaomeiButton>
                        <CaomeiButton
                            v-if="row.reviewStatus === 'pending_review'"
                            icon-only
                            rounded
                            variant="ghost"
                            tone="success"
                            :label="translateAgreement('approve_review')"
                            :title="translateAgreement('approve_review')"
                            @click="updateReviewStatus(row, section.type, 'approved')"
                        >
                            <template #icon>
                                <BadgeCheck :size="16" />
                            </template>
                        </CaomeiButton>
                        <CaomeiButton
                            icon-only
                            rounded
                            variant="ghost"
                            :label="getRestrictionMessage(row.restrictionReasons) || translateAgreement('edit')"
                            :title="getRestrictionMessage(row.restrictionReasons) || translateAgreement('edit')"
                            :disabled="!row.canEdit"
                            @click="editAgreement(row, section.type)"
                        >
                            <template #icon>
                                <Pencil :size="16" />
                            </template>
                        </CaomeiButton>
                        <CaomeiButton
                            v-if="row.isAuthoritativeVersion"
                            icon-only
                            rounded
                            variant="ghost"
                            tone="success"
                            :label="getActivateMessage(row)"
                            :title="getActivateMessage(row)"
                            :disabled="!row.canActivate || row.isCurrentActive"
                            @click="activateAgreement(row, section.type)"
                        >
                            <template #icon>
                                <Check :size="16" />
                            </template>
                        </CaomeiButton>
                        <CaomeiButton
                            icon-only
                            rounded
                            variant="ghost"
                            tone="danger"
                            :label="getRestrictionMessage(row.restrictionReasons) || $t('common.delete')"
                            :title="getRestrictionMessage(row.restrictionReasons) || $t('common.delete')"
                            :disabled="!row.canDelete"
                            @click="confirmDeleteAgreement(row, section.type)"
                        >
                            <template #icon>
                                <Trash2 :size="16" />
                            </template>
                        </CaomeiButton>
                    </div>
                </template>
            </CaomeiDataTable>
        </section>

        <AgreementEditDialog
            :visible="showDialog"
            :is-edit-mode="isEditMode"
            :form-data="formData"
            :language-options="languageOptions"
            :current-authoritative-options="currentAuthoritativeOptions"
            :is-reference-language="isReferenceLanguage"
            :generating-a-i-draft="generatingAIDraft"
            :saving="saving"
            :locale-code="locale"
            @update:visible="showDialog = $event"
            @update:form-data="Object.assign(formData, $event)"
            @generate-ai-draft="generateAgreementDraft"
            @save="saveAgreement"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DataTableColumn } from 'caomei-ui'
import { BadgeCheck, Check, Pencil, Plus, RefreshCw, Send, Sparkles, Trash2 } from '@lucide/vue'
import { useToast } from 'caomei-ui'
import { useConfirm } from 'caomei-ui'
import AgreementEditDialog from './agreement-edit-dialog.vue'
import type { AgreementFormData } from './agreement-edit-dialog.vue'
import type { ApiResponse } from '@/types/api'
import type {
    AgreementAdminItem,
    AgreementAdminListPayload,
    AgreementReviewStatus,
    AgreementRestrictionReason,
    AgreementType,
} from '@/types/agreement'

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

const agreementColumns = computed<DataTableColumn<AgreementAdminItem>[]>(() => [
    { key: 'version', header: t('pages.admin.settings.system.agreements.version') },
    { key: 'language', header: t('pages.admin.settings.system.agreements.language') },
    { key: 'role', header: translateAgreement('role') },
    { key: 'relation', header: translateAgreement('relation') },
    { key: 'status', header: translateAgreement('status') },
    { key: 'effectiveDate', header: translateAgreement('effective_date') },
    { key: 'updatedAt', header: translateAgreement('updated_at') },
    { key: 'versionDescription', header: t('pages.admin.settings.system.agreements.version_description') },
    { key: 'actions', header: t('common.actions'), headerClass: 'text-right', bodyClass: 'text-right' },
])

function getReviewStatusTone(status: AgreementReviewStatus) {
    switch (status) {
        case 'approved':
            return 'success'
        case 'pending_review':
            return 'warning'
        default:
            return 'neutral'
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
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: t('pages.admin.settings.system.agreements.load_failed'),
            duration: 3000,
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

            toast.show({
                tone: 'success',
                title: t('common.success'),
                description: t('pages.admin.settings.system.agreements.update_success'),
                duration: 3000,
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

            toast.show({
                tone: 'success',
                title: t('common.success'),
                description: t('pages.admin.settings.system.agreements.create_success'),
                duration: 3000,
            })
        }

        showDialog.value = false
        await loadAgreements(currentType.value)
    } catch (error: any) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: error.message || t('pages.admin.settings.system.agreements.save_failed'),
            duration: 3000,
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

        toast.show({
            tone: 'success',
            title: t('common.success'),
            description: translateAgreement('ai_draft_success'),
            duration: 3000,
        })
    } catch (error: any) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: error.message || translateAgreement('ai_draft_failed'),
            duration: 3000,
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

        toast.show({
            tone: 'success',
            title: t('common.success'),
            description: reviewStatus === 'approved'
                ? translateAgreement('approve_success')
                : translateAgreement('submit_review_success'),
            duration: 3000,
        })

        await loadAgreements(type)
    } catch (error: any) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: error.message || translateAgreement('review_status_failed'),
            duration: 3000,
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

        toast.show({
            tone: 'success',
            title: t('common.success'),
            description: t('pages.admin.settings.system.agreements.activate_success'),
            duration: 3000,
        })

        await loadAgreements(type)
    } catch (error: any) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: error.message || t('pages.admin.settings.system.agreements.activate_failed'),
            duration: 3000,
        })
    } finally {
        saving.value = false
    }
}

function confirmDeleteAgreement(agreement: AgreementAdminItem, type: AgreementType) {
    void confirm.confirm({
        title: t('common.confirm'),
        description: t('pages.admin.settings.system.agreements.delete_confirm'),
        confirmLabel: t('common.delete'),
        cancelLabel: t('common.cancel'),
        tone: 'danger',
    }).then((confirmed) => {
        if (confirmed) {
            void deleteAgreement(agreement, type)
        }
    })
}

async function deleteAgreement(agreement: AgreementAdminItem, type: AgreementType) {
    saving.value = true
    try {
        await $appFetch(`/api/admin/agreements/${agreement.id}`, {
            method: 'DELETE',
        })

        toast.show({
            tone: 'success',
            title: t('common.success'),
            description: t('pages.admin.settings.system.agreements.delete_success'),
            duration: 3000,
        })

        await loadAgreements(type)
    } catch (error: any) {
        toast.show({
            tone: 'danger',
            title: t('common.error'),
            description: error.message || t('pages.admin.settings.system.agreements.delete_failed'),
            duration: 3000,
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
