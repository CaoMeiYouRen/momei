<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.siteConfig.title') }}</h2>
        <p>{{ $t('installation.siteConfig.description') }}</p>

        <Message
            v-if="siteConfigError && !Object.keys(fieldErrors).length"
            severity="error"
            :closable="false"
            class="installation-wizard__step-message"
        >
            {{ siteConfigError }}
        </Message>

        <div class="installation-wizard__form">
            <div class="form-field">
                <label for="site_title">
                    {{ $t('installation.siteConfig.siteTitle') }}
                    <span class="ml-1 text-error">*</span>
                    <Tag
                        v-if="isLocked('site_title')"
                        severity="warn"
                        :value="$t('pages.admin.settings.system.source_badges.env')"
                        class="ml-2"
                    />
                </label>
                <InputText
                    id="site_title"
                    v-model="siteConfig.siteTitle"
                    :disabled="isLocked('site_title')"
                    :invalid="!!fieldErrors.siteTitle"
                    fluid
                />
                <small v-if="fieldErrors.siteTitle" class="installation-wizard__field-error">{{ fieldErrors.siteTitle }}</small>
                <small v-else-if="isLocked('site_title')" class="installation-wizard__field-lock">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
            <div class="form-field">
                <label for="default_language">
                    {{ $t('installation.siteConfig.defaultLanguage') }}
                    <span class="ml-1 text-error">*</span>
                    <Tag
                        v-if="isLocked('default_language')"
                        severity="warn"
                        :value="$t('pages.admin.settings.system.source_badges.env')"
                        class="ml-2"
                    />
                </label>
                <Select
                    id="default_language"
                    v-model="siteConfig.defaultLanguage"
                    :options="languageOptions"
                    option-label="label"
                    option-value="value"
                    :disabled="isLocked('default_language')"
                    :invalid="!!fieldErrors.defaultLanguage"
                    fluid
                />
                <div v-if="fieldErrors.defaultLanguage" class="installation-wizard__field-error">
                    {{ fieldErrors.defaultLanguage }}
                </div>
                <small v-else-if="isLocked('default_language')" class="installation-wizard__field-lock">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
            <div class="form-field">
                <label for="site_url">
                    {{ $t('installation.siteConfig.siteUrl') }}
                    <Tag
                        v-if="isLocked('site_url')"
                        severity="warn"
                        :value="$t('pages.admin.settings.system.source_badges.env')"
                        class="ml-2"
                    />
                </label>
                <InputText
                    id="site_url"
                    v-model="siteConfig.siteUrl"
                    :placeholder="$t('installation.siteConfig.siteUrlPlaceholder')"
                    :disabled="isLocked('site_url')"
                    :invalid="!!fieldErrors.siteUrl"
                    fluid
                />
                <div v-if="fieldErrors.siteUrl" class="installation-wizard__field-error">
                    {{ fieldErrors.siteUrl }}
                </div>
                <small v-else-if="isLocked('site_url')" class="installation-wizard__field-lock">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
            <div class="form-field">
                <label for="site_description">
                    {{ $t('installation.siteConfig.siteDescription') }}
                    <Tag
                        v-if="isLocked('site_description')"
                        severity="warn"
                        :value="$t('pages.admin.settings.system.source_badges.env')"
                        class="ml-2"
                    />
                </label>
                <Textarea
                    id="site_description"
                    v-model="siteConfig.siteDescription"
                    rows="3"
                    :disabled="isLocked('site_description')"
                    :invalid="!!fieldErrors.siteDescription"
                    fluid
                />
                <div v-if="fieldErrors.siteDescription" class="installation-wizard__field-error">
                    {{ fieldErrors.siteDescription }}
                </div>
                <small v-else-if="isLocked('site_description')" class="installation-wizard__field-lock">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
            <div class="form-field">
                <label for="site_keywords">
                    {{ $t('installation.siteConfig.siteKeywords') }}
                    <Tag
                        v-if="isLocked('site_keywords')"
                        severity="warn"
                        :value="$t('pages.admin.settings.system.source_badges.env')"
                        class="ml-2"
                    />
                </label>
                <InputText
                    id="site_keywords"
                    v-model="siteConfig.siteKeywords"
                    :disabled="isLocked('site_keywords')"
                    :invalid="!!fieldErrors.siteKeywords"
                    fluid
                />
                <div v-if="fieldErrors.siteKeywords" class="installation-wizard__field-error">
                    {{ fieldErrors.siteKeywords }}
                </div>
                <small v-else-if="isLocked('site_keywords')" class="installation-wizard__field-lock">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
            <div class="form-field">
                <label for="site_copyright">
                    {{ $t('installation.siteConfig.siteCopyright') }}
                    <Tag
                        v-if="isLocked('site_copyright')"
                        severity="warn"
                        :value="$t('pages.admin.settings.system.source_badges.env')"
                        class="ml-2"
                    />
                </label>
                <InputText
                    id="site_copyright"
                    v-model="siteConfig.siteCopyright"
                    :disabled="isLocked('site_copyright')"
                    :invalid="!!fieldErrors.siteCopyright"
                    fluid
                />
                <div v-if="fieldErrors.siteCopyright" class="installation-wizard__field-error">
                    {{ fieldErrors.siteCopyright }}
                </div>
                <small v-else-if="isLocked('site_copyright')" class="installation-wizard__field-lock">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
        </div>

        <div class="installation-wizard__actions">
            <Button
                :label="$t('common.prev')"
                icon="pi pi-arrow-left"
                variant="text"
                @click="$emit('prev')"
            />
            <Button
                :label="$t('common.next')"
                icon="pi pi-arrow-right"
                icon-pos="right"
                :loading="siteConfigLoading"
                @click="$emit('next')"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
const siteConfig = defineModel<any>('siteConfig', { required: true })
const props = defineProps<{
    siteConfigLoading: boolean
    siteConfigError: string
    fieldErrors: Record<string, string>
    languageOptions: any[]
    envSettings: Record<string, any>
}>()
defineEmits(['prev', 'next'])

const isLocked = (key: string) => !!props.envSettings[key]
</script>
