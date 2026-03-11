<template>
    <div class="installation-wizard__step">
        <h2>{{ $t('installation.complete.title') }}</h2>
        <p>{{ $t('installation.complete.description') }}</p>

        <Message v-if="finalizeError" severity="error">
            {{ finalizeError }}
        </Message>
        <Message v-else-if="finalizeSuccess" severity="success">
            {{ $t('installation.complete.success') }}
        </Message>

        <div v-if="finalizeSuccess" class="installation-wizard__complete">
            <Message severity="warn">
                {{ $t('installation.complete.envHint') }}
            </Message>
            <code class="env-code">MOMEI_INSTALLED=true</code>

            <div class="installation-wizard__follow-up">
                <h3>{{ $t('installation.complete.handoffTitle') }}</h3>
                <p>{{ $t(`installation.complete.handoffDescription.${props.checklistMode}`) }}</p>

                <div class="installation-wizard__follow-up-list">
                    <button
                        v-for="item in props.followUpItems"
                        :key="item.key"
                        type="button"
                        class="installation-wizard__follow-up-action"
                        @click="openChecklistLink(item)"
                    >
                        <span class="installation-wizard__follow-up-icon">
                            <i :class="item.icon" />
                        </span>
                        <span>
                            <strong>{{ $t(item.titleKey) }}</strong>
                            <small>{{ $t(item.contextKey) }}</small>
                        </span>
                        <span class="installation-wizard__follow-up-cta">{{ $t('installation.complete.openTarget') }}</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="installation-wizard__actions">
            <Button
                v-if="!finalizeSuccess"
                :label="$t('installation.complete.finalize')"
                icon="pi pi-check"
                icon-pos="right"
                :loading="finalizeLoading"
                @click="onFinalize"
            />
            <Button
                v-else
                :label="$t('installation.complete.goToAdmin')"
                icon="pi pi-arrow-right"
                icon-pos="right"
                @click="onGoToAdmin"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import type { InstallationChecklistItem, InstallationChecklistMode } from '@/utils/shared/installation-checklist'

const props = defineProps<{
    finalizeLoading: boolean
    finalizeSuccess: boolean
    finalizeError: string
    checklistMode: InstallationChecklistMode
    followUpItems: InstallationChecklistItem[]
}>()

const emit = defineEmits(['finalize', 'goToAdmin'])
const localePath = useLocalePath()

const navigateWithReloadFallback = async (target: string) => {
    try {
        await navigateTo(target)
    } catch {
        if (import.meta.client) {
            window.location.assign(target)
        }
    }
}

const openChecklistLink = async (item: InstallationChecklistItem) => {
    if (!item.link) {
        return
    }

    const target = localePath({
        path: item.link.path.startsWith('/admin') ? '/login' : item.link.path,
        query: item.link.path.startsWith('/admin')
            ? { redirect: localePath({ path: item.link.path, query: item.link.query }) }
            : item.link.query,
    })

    return navigateWithReloadFallback(target)
}

const onFinalize = () => emit('finalize')
const onGoToAdmin = () => emit('goToAdmin')
</script>
