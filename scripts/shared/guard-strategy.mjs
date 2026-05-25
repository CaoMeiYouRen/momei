const GUARD_FINDING_RANK = {
    none: 0,
    warning: 1,
    blocker: 2,
}

const GUARD_FINDING_LEVELS = Object.keys(GUARD_FINDING_RANK)

export function normalizeGuardFindingLevel(value) {
    const normalized = String(value || 'none').trim().toLowerCase()

    if (!GUARD_FINDING_LEVELS.includes(normalized)) {
        throw new Error(`Unsupported guard finding level: ${value}`)
    }

    return normalized
}

export function isGuardFindingAtLeast(level, baseline) {
    const normalizedLevel = normalizeGuardFindingLevel(level)
    const normalizedBaseline = normalizeGuardFindingLevel(baseline)

    return GUARD_FINDING_RANK[normalizedLevel] >= GUARD_FINDING_RANK[normalizedBaseline]
}

export function isBlockingGuardFindingLevel(level) {
    return normalizeGuardFindingLevel(level) === 'blocker'
}

export function resolveHighestGuardFindingLevel(levels = []) {
    return levels.reduce((highestLevel, currentLevel) => (
        isGuardFindingAtLeast(currentLevel, highestLevel) ? normalizeGuardFindingLevel(currentLevel) : highestLevel
    ), 'none')
}
