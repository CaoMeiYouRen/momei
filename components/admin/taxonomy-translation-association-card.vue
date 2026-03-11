<template>
    <div
        class="taxonomy-translation-association"
        :class="{'taxonomy-translation-association--warn': sameLanguageConflict}"
    >
        <div class="taxonomy-translation-association__header">
            <strong>{{ $t('common.translation_association_cluster', {id: clusterId}) }}</strong>
            <small v-if="usesSlugFallback">{{ $t('common.translation_association_using_slug') }}</small>
        </div>
        <p class="taxonomy-translation-association__message">
            <template v-if="sameLanguageConflict">
                {{ $t('common.translation_association_conflict', {
                    language: $t(`common.languages.${sameLanguageConflict.language}`),
                    name: sameLanguageConflict.name
                }) }}
            </template>
            <template v-else-if="linkedPeers.length > 0">
                {{ $t('common.translation_association_hint') }}
            </template>
            <template v-else>
                {{ $t('common.translation_association_empty') }}
            </template>
        </p>
        <div
            v-if="relatedCandidates.length > 0"
            class="taxonomy-translation-association__actions"
        >
            <Button
                v-for="candidate in relatedCandidates"
                :key="candidate.id"
                :label="`[${candidate.language}] ${candidate.name}`"
                text
                size="small"
                severity="secondary"
                @click="$emit('open-candidate', candidate)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { TaxonomyAssociationCandidate } from '@/utils/shared/taxonomy-association'

defineProps<{
    clusterId: string
    usesSlugFallback: boolean
    sameLanguageConflict: TaxonomyAssociationCandidate | null
    linkedPeers: TaxonomyAssociationCandidate[]
    relatedCandidates: TaxonomyAssociationCandidate[]
}>()

defineEmits<{
    (e: 'open-candidate', candidate: TaxonomyAssociationCandidate): void
}>()
</script>

<style lang="scss" scoped>
.taxonomy-translation-association {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.75rem;
    background-color: color-mix(in srgb, var(--p-surface-100) 82%, transparent);
    border: 1px solid var(--p-surface-border);

    &--warn {
        border-color: var(--p-orange-300);
        background-color: color-mix(in srgb, var(--p-orange-50) 72%, transparent);
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    &__message {
        margin: 0;
        color: var(--p-text-muted-color);
        line-height: 1.5;
    }

    &__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
}
</style>
