import { beforeEach, describe, expect, it } from 'vitest'
import {
    clearQueuedSetupJourneyStage,
    getQueuedSetupJourneyStage,
    queueSetupJourneyStage,
    SETUP_JOURNEY_STAGE_KEY,
} from './setup-journey'

describe('setup-journey', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('returns null when no queued stage exists or stage is invalid', () => {
        expect(getQueuedSetupJourneyStage()).toBeNull()

        localStorage.setItem(SETUP_JOURNEY_STAGE_KEY, 'invalid-stage')
        expect(getQueuedSetupJourneyStage()).toBeNull()
    })

    it('queues and clears setup journey stages from local storage', () => {
        queueSetupJourneyStage('admin')
        expect(localStorage.getItem(SETUP_JOURNEY_STAGE_KEY)).toBe('admin')
        expect(getQueuedSetupJourneyStage()).toBe('admin')

        queueSetupJourneyStage('editor')
        expect(getQueuedSetupJourneyStage()).toBe('editor')

        clearQueuedSetupJourneyStage()
        expect(localStorage.getItem(SETUP_JOURNEY_STAGE_KEY)).toBeNull()
        expect(getQueuedSetupJourneyStage()).toBeNull()
    })
})
