<template>
    <Dialog
        v-model:visible="dialogVisible"
        :header="isEditMode ? $t('pages.admin.settings.system.agreements.edit') : $t('pages.admin.settings.system.agreements.create')"
        modal
        class="agreements-settings__dialog"
    >
        <div class="agreements-settings__field">
            <label for="language">{{ $t('pages.admin.settings.system.agreements.language') }}</label>
            <Select
                id="language"
                v-model="languageValue"
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
                v-model="versionValue"
                fluid
                placeholder="e.g. 2026.01"
            />
        </div>

        <div class="agreements-settings__field">
            <label for="versionDescription">{{ $t('pages.admin.settings.system.agreements.version_description') }}</label>
            <Textarea
                id="versionDescription"
                v-model="versionDescriptionValue"
                rows="3"
                fluid
                auto-resize
            />
        </div>

        <div v-if="isReferenceLanguage" class="agreements-settings__field">
            <label for="sourceAgreementId">{{ translateAgreement('source_version') }}</label>
            <Select
                id="sourceAgreementId"
                v-model="sourceAgreementIdValue"
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
                    v-model="contentValue"
                    class="agreements-settings__editor"
                    :subfield="false"
                    :language="editorLanguage"
                />
            </ClientOnly>
        </div>

        <template #footer>
            <Button
                v-if="!isEditMode && isReferenceLanguage"
                :label="translateAgreement('generate_ai_draft')"
                icon="pi pi-sparkles"
                class="p-button-text"
                :loading="generatingAIDraft"
                :disabled="!sourceAgreementIdValue"
                @click="emit('generate-ai-draft')"
            />
            <Button
                :label="$t('common.cancel')"
                icon="pi pi-times"
                class="p-button-text"
                @click="dialogVisible = false"
            />
            <Button
                :label="$t('common.save')"
                icon="pi pi-check"
                :loading="saving"
                @click="emit('save')"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface AgreementFormData {
    language: string
    version: string
    versionDescription: string
    content: string
    sourceAgreementId: string | null
}

interface AgreementOption {
    id?: string
    label: string
    value?: string
}

const props = defineProps<{
    visible: boolean
    isEditMode: boolean
    formData: AgreementFormData
    languageOptions: AgreementOption[]
    currentAuthoritativeOptions: AgreementOption[]
    isReferenceLanguage: boolean
    generatingAIDraft: boolean
    saving: boolean
    localeCode: string
}>()

const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void
    (event: 'update:formData', value: AgreementFormData): void
    (event: 'generate-ai-draft'): void
    (event: 'save'): void
}>()

const { t } = useI18n()

const dialogVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
})

const editorLanguage = computed(() => props.localeCode === 'zh-CN' ? 'zh-CN' : 'en')

function updateFormData<K extends keyof AgreementFormData>(key: K, value: AgreementFormData[K]) {
    emit('update:formData', {
        ...props.formData,
        [key]: value,
    })
}

const languageValue = computed({
    get: () => props.formData.language,
    set: (value: string) => updateFormData('language', value),
})

const versionValue = computed({
    get: () => props.formData.version,
    set: (value: string) => updateFormData('version', value),
})

const versionDescriptionValue = computed({
    get: () => props.formData.versionDescription,
    set: (value: string) => updateFormData('versionDescription', value),
})

const contentValue = computed({
    get: () => props.formData.content,
    set: (value: string) => updateFormData('content', value),
})

const sourceAgreementIdValue = computed({
    get: () => props.formData.sourceAgreementId,
    set: (value: string | null) => updateFormData('sourceAgreementId', value),
})

function translateAgreement(key: string) {
    return t(`pages.admin.settings.system.agreements.${key}` as never)
}
</script>

<style lang="scss" scoped>
.agreements-settings {
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
    &__notice {
        color: var(--p-text-color);
    }

    &__help {
        color: var(--p-text-muted-color);
    }
}
</style>
