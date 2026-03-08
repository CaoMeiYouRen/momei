<template>
    <div class="drag-mask">
        <div class="drag-tip">
            <i class="pi pi-upload upload-icon" />
            <div class="upload-text">
                {{ $t('common.drag_drop_tip') }}
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.drag-mask {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 3px dashed var(--p-primary-500);
    background-color: rgb(0 0 0 / 0.3);
    z-index: 1000;
    pointer-events: none;
    backdrop-filter: blur(2px);
}

.upload-icon {
    margin-bottom: 1rem;
    font-size: 4rem;
    color: var(--p-primary-500);
}

.upload-text {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--p-primary-500);
    text-shadow: 0 2px 4px rgb(0 0 0 / 0.5);
}
</style>
