export type SetupJourneyStage = 'admin' | 'editor'

export const SETUP_JOURNEY_STAGE_KEY = 'momei_setup_next_stage'

export function isSetupJourneyStage(value: string | null): value is SetupJourneyStage {
    return value === 'admin' || value === 'editor'
}

export function getQueuedSetupJourneyStage(): SetupJourneyStage | null {
    if (!import.meta.client) {
        return null
    }

    const stage = localStorage.getItem(SETUP_JOURNEY_STAGE_KEY)
    return isSetupJourneyStage(stage) ? stage : null
}

export function queueSetupJourneyStage(stage: SetupJourneyStage) {
    if (!import.meta.client) {
        return
    }

    localStorage.setItem(SETUP_JOURNEY_STAGE_KEY, stage)
}

export function clearQueuedSetupJourneyStage() {
    if (!import.meta.client) {
        return
    }

    localStorage.removeItem(SETUP_JOURNEY_STAGE_KEY)
}
