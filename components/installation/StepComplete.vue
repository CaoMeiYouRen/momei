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

defineProps<{
    finalizeLoading: boolean
    finalizeSuccess: boolean
    finalizeError: string
}>()

const emit = defineEmits(['finalize', 'goToAdmin'])
const onFinalize = () => emit('finalize')
const onGoToAdmin = () => emit('goToAdmin')
</script>
