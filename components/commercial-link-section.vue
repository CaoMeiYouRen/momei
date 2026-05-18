<template>
    <section class="commercial-manager__section">
        <div class="commercial-manager__header">
            <div class="commercial-manager__header-info">
                <h4 class="commercial-manager__section-title">
                    <i :class="headerIcon" />
                    {{ $t(titleKey) }}
                </h4>
                <p class="commercial-manager__desc">
                    {{ description }}
                </p>
            </div>
            <Button
                :label="addLabel"
                :data-testid="`${kind}-add`"
                icon="pi pi-plus"
                size="small"
                severity="primary"
                @click="emit('add')"
            />
        </div>

        <div v-if="links.length === 0" class="commercial-manager__empty">
            <i :class="emptyIcon" />
            <p>{{ $t(emptyKey) }}</p>
        </div>

        <div v-else class="commercial-manager__grid">
            <div
                v-for="(link, index) in links"
                :key="index"
                class="commercial-manager__card"
            >
                <div
                    class="commercial-manager__card-icon"
                    :style="{color: getPlatformColor(link.platform)}"
                >
                    <i :class="getPlatformIcon(link.platform)" />
                </div>
                <div class="commercial-manager__card-content">
                    <div class="commercial-manager__card-label">
                        <span class="mr-2">{{ link.label || getPlatformName(link.platform) }}</span>
                        <div v-if="link.locales && link.locales.length > 0" class="commercial-manager__card-tags">
                            <Tag
                                v-for="localeCode in link.locales"
                                :key="localeCode"
                                :value="localeCode"
                                size="small"
                                severity="secondary"
                                class="commercial-manager__tag"
                            />
                        </div>
                    </div>
                    <div class="commercial-manager__card-value">
                        {{ link.url || link.image }}
                    </div>
                </div>
                <div class="commercial-manager__card-actions">
                    <Image
                        v-if="link.image"
                        :src="link.image"
                        alt="Preview"
                        preview
                    >
                        <template #indicatoricon>
                            <i class="pi pi-eye" />
                        </template>
                        <template #image>
                            <Button
                                icon="pi pi-image"
                                severity="secondary"
                                text
                                rounded
                                size="small"
                            />
                        </template>
                    </Image>
                    <Button
                        :data-testid="`${kind}-edit-${index}`"
                        icon="pi pi-pencil"
                        severity="secondary"
                        text
                        rounded
                        size="small"
                        @click="emit('edit', index)"
                    />
                    <Button
                        :data-testid="`${kind}-remove-${index}`"
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        rounded
                        size="small"
                        @click="emit('remove', index)"
                    />
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import {
    getCommercialPlatformColor,
    getCommercialPlatformIcon,
    type CommercialPlatformKind,
    type DonationLink,
    type SocialLink,
} from '@/utils/shared/commercial'

type CommercialLink = SocialLink | DonationLink

interface Props {
    kind: CommercialPlatformKind
    titleKey: string
    description: string
    addLabel: string
    emptyKey: string
    headerIcon: string
    emptyIcon: string
    links: CommercialLink[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
    add: []
    edit: [index: number]
    remove: [index: number]
}>()

const { t } = useI18n()

function getPlatformIcon(key: string) {
    return getCommercialPlatformIcon(key, props.kind)
}

function getPlatformColor(key: string) {
    return getCommercialPlatformColor(key, props.kind)
}

function getPlatformName(key: string) {
    if (key === 'custom') {
        return ''
    }

    const translationPrefix = props.kind === 'social'
        ? 'common.platforms'
        : 'components.post.sponsor.platforms'

    return t(`${translationPrefix}.${key}`)
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.commercial-manager {
    &__section {
        background-color: var(--p-surface-0);
        border: 1px solid var(--p-surface-200);
        border-radius: $border-radius-lg;
        padding: $spacing-lg;
        margin-bottom: $spacing-xl;

        .dark & {
            background-color: var(--p-surface-800);
            border-color: var(--p-surface-700);
        }
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: $spacing-lg;
    }

    &__header-info {
        flex: 1;
    }

    &__section-title {
        margin: 0;
        font-size: $font-size-lg;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: $spacing-sm;

        i {
            color: var(--p-primary-color);
        }

        .pi-heart-fill {
            color: var(--p-red-500);
        }
    }

    &__desc {
        margin: $spacing-xs 0 0;
        font-size: $font-size-sm;
        color: var(--p-surface-500);
    }

    &__empty {
        text-align: center;
        padding: $spacing-xl;
        border: 2px dashed var(--p-surface-200);
        border-radius: $border-radius-md;
        background-color: var(--p-surface-50);
        color: var(--p-surface-400);

        .dark & {
            background-color: var(--p-surface-900);
            border-color: var(--p-surface-700);
        }

        i {
            font-size: 3rem;
            margin-bottom: $spacing-sm;
        }

        p {
            margin: 0;
            font-weight: 500;
        }
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: $spacing-md;

        @media (width >= 768px) {
            grid-template-columns: repeat(2, 1fr);
        }

        @media (width >= 1200px) {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    &__card {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: $spacing-md;
        padding: $spacing-md;
        background-color: var(--p-surface-0);
        border: 1px solid var(--p-surface-200);
        border-radius: $border-radius-md;
        transition: all 0.3s ease;

        .dark & {
            background-color: var(--p-surface-900);
            border-color: var(--p-surface-700);
        }

        &:hover {
            border-color: var(--p-primary-color);
            box-shadow: 0 4px 12px rgb(0 0 0 / 0.05);
        }
    }

    &__card-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        background-color: var(--p-surface-50);
        border-radius: $border-radius-sm;
        flex-shrink: 0;

        .dark & {
            background-color: var(--p-surface-800);
        }
    }

    &__card-content {
        flex: 1;
        min-width: 200px;
    }

    &__card-label {
        font-weight: 600;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
        min-width: 0;
    }

    &__card-tags {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
    }

    &__tag {
        font-size: 10px !important;
        padding: 0 4px !important;
        height: 1.2rem;
    }

    &__card-value {
        font-size: $font-size-xs;
        color: var(--p-surface-500);
        word-break: break-all;
        margin-top: 2px;
    }

    &__card-actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }
}
</style>
