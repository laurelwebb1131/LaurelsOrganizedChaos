export type SavedWorldState = {
  lastLocation: string
  savedIdeas: string[]
  chores: { label: string; detail: string; done: boolean }[]
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
    }
  } catch {
    return defaultWorldState
  }
}

export function saveWorldState(state: SavedWorldState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state))
}
