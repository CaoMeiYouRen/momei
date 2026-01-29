<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.siteConfig.title') }}</h2>
        <p>{{ $t('installation.siteConfig.description') }}</p>

        <div class="installation-wizard__form">
            <div class="form-field">
                <label for="site_title">
                    {{ $t('installation.siteConfig.siteTitle') }}
                    <Tag
                        v-if="isLocked('site_title')"
                        severity="info"
                        value="ENV"
                        class="ml-2"
                    />
                </label>
                <InputText
                    id="site_title"
                    v-model="siteConfig.siteTitle"
                    :disabled="isLocked('site_title')"
                    fluid
                />
                <small v-if="isLocked('site_title')" class="text-primary">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
            <div class="form-field">
                <label for="site_url">
                    {{ $t('installation.siteConfig.siteUrl') }}
                    <Tag
                        v-if="isLocked('site_url')"
                        severity="info"
                        value="ENV"
                        class="ml-2"
                    />
                </label>
                <InputText
                    id="site_url"
                    v-model="siteConfig.siteUrl"
                    :placeholder="$t('installation.siteConfig.siteUrlPlaceholder')"
                    :disabled="isLocked('site_url')"
                    fluid
                />
                <small v-if="isLocked('site_url')" class="text-primary">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
            <div class="form-field">
                <label for="site_description">
                    {{ $t('installation.siteConfig.siteDescription') }}
                    <Tag
                        v-if="isLocked('site_description')"
                        severity="info"
                        value="ENV"
                        class="ml-2"
                    />
                </label>
                <Textarea
                    id="site_description"
                    v-model="siteConfig.siteDescription"
                    rows="3"
                    :disabled="isLocked('site_description')"
                    fluid
                />
                <small v-if="isLocked('site_description')" class="text-primary">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
            <div class="form-field">
                <label for="site_keywords">
                    {{ $t('installation.siteConfig.siteKeywords') }}
                    <Tag
                        v-if="isLocked('site_keywords')"
                        severity="info"
                        value="ENV"
                        class="ml-2"
                    />
                </label>
                <InputText
                    id="site_keywords"
                    v-model="siteConfig.siteKeywords"
                    :disabled="isLocked('site_keywords')"
                    fluid
                />
                <small v-if="isLocked('site_keywords')" class="text-primary">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
            <div class="form-field">
                <label for="site_copyright">
                    {{ $t('installation.siteConfig.siteCopyright') }}
                    <Tag
                        v-if="isLocked('site_copyright')"
                        severity="info"
                        value="ENV"
                        class="ml-2"
                    />
                </label>
                <InputText
                    id="site_copyright"
                    v-model="siteConfig.siteCopyright"
                    :disabled="isLocked('site_copyright')"
                    fluid
                />
                <small v-if="isLocked('site_copyright')" class="text-primary">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
            <div class="form-field">
                <label for="default_language">
                    {{ $t('installation.siteConfig.defaultLanguage') }}
                    <Tag
                        v-if="isLocked('default_language')"
                        severity="info"
                        value="ENV"
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
                    fluid
                />
                <small v-if="isLocked('default_language')" class="text-primary">{{ $t('pages.admin.settings.system.hints.env_locked') }}</small>
            </div>
        </div>

        <div v-if="siteConfigError" class="mb-4 p-error">
            {{ siteConfigError }}
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
    languageOptions: any[]
    envSettings: Record<string, any>
}>()
defineEmits(['prev', 'next'])

const isLocked = (key: string) => !!props.envSettings[key]
</script>
