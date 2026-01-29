<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.siteConfig.title') }}</h2>
        <p>{{ $t('installation.siteConfig.description') }}</p>

        <div class="installation-wizard__form">
            <div class="form-field">
                <label for="site_title">{{ $t('installation.siteConfig.siteTitle') }}</label>
                <InputText
                    id="site_title"
                    v-model="siteConfig.siteTitle"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="site_url">{{ $t('installation.siteConfig.siteUrl') }}</label>
                <InputText
                    id="site_url"
                    v-model="siteConfig.siteUrl"
                    :placeholder="$t('installation.siteConfig.siteUrlPlaceholder')"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="site_description">{{ $t('installation.siteConfig.siteDescription') }}</label>
                <Textarea
                    id="site_description"
                    v-model="siteConfig.siteDescription"
                    rows="3"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="site_keywords">{{ $t('installation.siteConfig.siteKeywords') }}</label>
                <InputText
                    id="site_keywords"
                    v-model="siteConfig.siteKeywords"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="site_copyright">{{ $t('installation.siteConfig.siteCopyright') }}</label>
                <InputText
                    id="site_copyright"
                    v-model="siteConfig.siteCopyright"
                    fluid
                />
            </div>
            <div class="form-field">
                <label for="default_language">{{ $t('installation.siteConfig.defaultLanguage') }}</label>
                <Select
                    id="default_language"
                    v-model="siteConfig.defaultLanguage"
                    :options="languageOptions"
                    option-label="label"
                    option-value="value"
                    fluid
                />
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
defineProps<{
    siteConfigLoading: boolean
    siteConfigError: string
    languageOptions: any[]
}>()
defineEmits(['prev', 'next'])
</script>
