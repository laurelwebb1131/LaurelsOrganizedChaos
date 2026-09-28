export type WorldLocationId = 'library' | 'home' | 'university' | 'love-doctor'

export type SavedWorldState = {
  version: 2
  lastLocation: WorldLocationId
  savedIdeas: string[]
  chores: { label: string; detail: string; done: boolean }[]
  companions: Companion[]
  goals: Goal[]
  habits: Habit[]
}

export type Goal = {
  id: string
  title: string
  realm: string
  progress: number
  nextStep: string
}

export type Habit = {
  id: string
  title: string
  realm: string
  cadence: string
  completedToday: boolean
}

export type Companion = {
  id: string
  name: string
  role: string
  realm: string
  context: string
}

const storageKey = 'hearthwise-world-v2'
const legacyStorageKey = 'hearthwise-world-v1'
const validLocations = new Set<WorldLocationId>(['library', 'home', 'university', 'love-doctor'])

export const defaultWorldState: SavedWorldState = {
  version: 2,
  lastLocation: 'library',
  savedIdeas: [],
  chores: [
    { label: 'Start the evening dishes', detail: 'Kitchen · 15 minutes', done: false },
    { label: 'Check tomorrow’s family calendar', detail: 'Planning · 5 minutes', done: true },
    { label: 'Put the laundry away', detail: 'Household · 10 minutes', done: false },
  ],
  companions: [
    { id: 'juniper', name: 'Juniper', role: 'World guide', realm: 'All realms', context: 'A curious crow familiar who helps turn reflection into a next step.' },
  ],
  goals: [
    { id: 'hearthwise', title: 'Build Hearthwise', realm: 'The Library', progress: 68, nextStep: 'Finish one beautiful corner of the world.' },
    { id: 'learning', title: 'Learn 3D design', realm: 'The University', progress: 50, nextStep: 'Complete one focused practice session.' },
  ],
  habits: [
    { id: 'evening-reset', title: 'Evening reset', realm: 'Hearth House', cadence: 'Daily', completedToday: false },
    { id: 'creative-hour', title: 'Creative hour', realm: 'The Library', cadence: '3x weekly', completedToday: true },
  ],
}

export function isWorldLocationId(value: unknown): value is WorldLocationId {
  return typeof value === 'string' && validLocations.has(value as WorldLocationId)
}

export function loadWorldState(): SavedWorldState {
  if (typeof window === 'undefined') return cloneDefaultWorldState()

  try {
    const stored = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey)
    if (!stored) return cloneDefaultWorldState()
    return hydrateWorldState(JSON.parse(stored))
  } catch {
    return cloneDefaultWorldState()
  }
}

export function saveWorldState(state: SavedWorldState) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ ...state, version: 2 }))
  } catch {
    throw new Error('Hearthwise could not save this world. Export your world data before continuing.')
  }
}

export function exportWorldState(state: SavedWorldState) {
  return JSON.stringify({ ...state, version: 2 }, null, 2)
}

export function resetWorldState() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(storageKey)
    window.localStorage.removeItem(legacyStorageKey)
  }
  return cloneDefaultWorldState()
}

export function importWorldState(raw: string): SavedWorldState {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('This world file is not valid JSON.')
  }

  const record = asRecord(parsed)
  if (!record || record.version !== 2) {
    throw new Error('This world file is not a supported Hearthwise export.')
  }

  return hydrateWorldState(record)
}

export function hydrateWorldState(value: unknown): SavedWorldState {
  const fresh = cloneDefaultWorldState()
  const record = asRecord(value)
  if (!record) return fresh

  return {
    version: 2,
    lastLocation: isWorldLocationId(record.lastLocation) ? record.lastLocation : fresh.lastLocation,
    savedIdeas: stringArray(record.savedIdeas),
    chores: normalizeChores(record.chores, fresh.chores),
    companions: normalizeCompanions(record.companions, fresh.companions),
    goals: normalizeGoals(record.goals, fresh.goals),
    habits: normalizeHabits(record.habits, fresh.habits),
  }
}

function cloneDefaultWorldState(): SavedWorldState {
  return {
    version: 2,
    lastLocation: defaultWorldState.lastLocation,
    savedIdeas: [...defaultWorldState.savedIdeas],
    chores: defaultWorldState.chores.map((chore) => ({ ...chore })),
    companions: defaultWorldState.companions.map((companion) => ({ ...companion })),
    goals: defaultWorldState.goals.map((goal) => ({ ...goal })),
    habits: defaultWorldState.habits.map((habit) => ({ ...habit })),
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : []
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function normalizeChores(value: unknown, fallback: SavedWorldState['chores']): SavedWorldState['chores'] {
  if (!Array.isArray(value)) return fallback.map((item) => ({ ...item }))
  return value.flatMap((item) => {
    const record = asRecord(item)
    if (!record) return []
    const label = text(record.label)
    if (!label) return []
    return [{ label, detail: text(record.detail), done: record.done === true }]
  })
}

function normalizeCompanions(value: unknown, fallback: Companion[]): Companion[] {
  if (!Array.isArray(value)) return fallback.map((item) => ({ ...item }))
  const items = value.flatMap((item, index) => {
    const record = asRecord(item)
    if (!record) return []
    const name = text(record.name)
    const role = text(record.role)
    if (!name || !role) return []
    return [{
      id: text(record.id, `companion-${index + 1}`),
      name,
      role,
      realm: text(record.realm, 'All realms'),
      context: text(record.context, 'No context added yet.'),
    }]
  })
  return items.length ? items : fallback.map((item) => ({ ...item }))
}

function normalizeGoals(value: unknown, fallback: Goal[]): Goal[] {
  if (!Array.isArray(value)) return fallback.map((item) => ({ ...item }))
  const items = value.flatMap((item, index) => {
    const record = asRecord(item)
    if (!record) return []
    const title = text(record.title)
    if (!title) return []
    const rawProgress = typeof record.progress === 'number' && Number.isFinite(record.progress) ? record.progress : 0
    return [{
      id: text(record.id, `goal-${index + 1}`),
      title,
      realm: text(record.realm, 'All realms'),
      progress: Math.max(0, Math.min(100, rawProgress)),
      nextStep: text(record.nextStep),
    }]
  })
  return items.length ? items : fallback.map((item) => ({ ...item }))
}

function normalizeHabits(value: unknown, fallback: Habit[]): Habit[] {
  if (!Array.isArray(value)) return fallback.map((item) => ({ ...item }))
  const items = value.flatMap((item, index) => {
    const record = asRecord(item)
    if (!record) return []
    const title = text(record.title)
    if (!title) return []
    return [{
      id: text(record.id, `habit-${index + 1}`),
      title,
      realm: text(record.realm, 'All realms'),
      cadence: text(record.cadence, 'Flexible'),
      completedToday: record.completedToday === true,
    }]
  })
  return items.length ? items : fallback.map((item) => ({ ...item }))
}
