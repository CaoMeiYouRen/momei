import { resolveTranslationClusterId } from './translation-cluster'
import type {
    PostTagBindingInput,
    PostTranslationTagOption,
    PostTranslationTaxonomyItem,
} from '@/types/post-translation'

const normalizeTagName = (name: string) => name.trim()

const buildBindingKey = (binding: PostTagBindingInput) => {
    const clusterId = resolveTranslationClusterId(binding.translationId, binding.sourceTagSlug, binding.sourceTagId)
    return clusterId || normalizeTagName(binding.name).toLowerCase()
}

export function createPostTagBinding(options: {
    name: string
    source?: PostTranslationTaxonomyItem | null
    target?: PostTranslationTagOption | null
}): PostTagBindingInput {
    const clusterId = resolveTranslationClusterId(
        options.source?.translationId,
        options.source?.slug,
        options.source?.id,
    ) || resolveTranslationClusterId(
        options.target?.translationId,
        options.target?.slug,
        options.target?.id,
    ) || null

    return {
        name: normalizeTagName(options.name),
        translationId: clusterId,
        sourceTagSlug: options.source?.slug ?? options.target?.slug ?? null,
        sourceTagId: options.source?.id ?? options.target?.id ?? null,
    }
}

export function syncPostTagBindings(
    tagNames: string[],
    existingBindings: PostTagBindingInput[],
    tagEntities: PostTranslationTagOption[],
) {
    const existingBindingMap = new Map(
        existingBindings.map((binding) => [normalizeTagName(binding.name), binding]),
    )

    const nextBindings = tagNames
        .map(normalizeTagName)
        .filter(Boolean)
        .map((name) => {
            const existingBinding = existingBindingMap.get(name)
            const matchedTag = tagEntities.find((tag) => normalizeTagName(tag.name) === name)

            if (existingBinding) {
                const matchedBinding = matchedTag
                    ? createPostTagBinding({ name, target: matchedTag })
                    : null

                return {
                    name,
                    translationId: resolveTranslationClusterId(
                        existingBinding.translationId,
                        existingBinding.sourceTagSlug,
                        existingBinding.sourceTagId,
                    ) || matchedBinding?.translationId || null,
                    sourceTagSlug: existingBinding.sourceTagSlug ?? matchedBinding?.sourceTagSlug ?? null,
                    sourceTagId: existingBinding.sourceTagId ?? matchedBinding?.sourceTagId ?? null,
                } satisfies PostTagBindingInput
            }

            return matchedTag
                ? createPostTagBinding({ name, target: matchedTag })
                : { name }
        })

    return Array.from(new Map(nextBindings.map((binding) => [buildBindingKey(binding), binding])).values())
}
