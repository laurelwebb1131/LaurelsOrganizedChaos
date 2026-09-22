export type SavedWorldState = {
  lastLocation: string
  savedIdeas: string[]
  chores: { label: string; detail: string; done: boolean }[]
  companions: Companion[]
}

export type Companion = {
  id: string
  name: string
  role: string
  realm: string
  context: string
}

const storageKey = 'hearthwise-world-v1'

export const defaultWorldState: SavedWorldState = {
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
}

export function loadWorldState(): SavedWorldState {
  if (typeof window === 'undefined') return defaultWorldState
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return defaultWorldState
    const parsed = JSON.parse(stored) as Partial<SavedWorldState>
    return {
      ...defaultWorldState,
      ...parsed,
      savedIdeas: Array.isArray(parsed.savedIdeas) ? parsed.savedIdeas : [],
      chores: Array.isArray(parsed.chores) ? parsed.chores : defaultWorldState.chores,
      companions: Array.isArray(parsed.companions) ? parsed.companions : defaultWorldState.companions,
    }
  } catch {
    return defaultWorldState
  }
}

export function saveWorldState(state: SavedWorldState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state))
}
