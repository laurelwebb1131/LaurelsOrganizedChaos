export type SavedWorldState = {
  version: 2
  lastLocation: string
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

export function loadWorldState(): SavedWorldState {
  if (typeof window === 'undefined') return defaultWorldState
  try {
    const stored = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem('hearthwise-world-v1')
    if (!stored) return defaultWorldState
    const parsed = JSON.parse(stored) as Partial<SavedWorldState>
    return {
      ...defaultWorldState,
      version: 2,
      ...parsed,
      savedIdeas: Array.isArray(parsed.savedIdeas) ? parsed.savedIdeas : [],
      chores: Array.isArray(parsed.chores) ? parsed.chores : defaultWorldState.chores,
      companions: Array.isArray(parsed.companions) ? parsed.companions : defaultWorldState.companions,
      goals: Array.isArray(parsed.goals) ? parsed.goals : defaultWorldState.goals,
      habits: Array.isArray(parsed.habits) ? parsed.habits : defaultWorldState.habits,
    }
  } catch {
    return defaultWorldState
  }
}

export function saveWorldState(state: SavedWorldState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state))
}

export function exportWorldState(state: SavedWorldState) {
  return JSON.stringify(state, null, 2)
}

export function resetWorldState() {
  window.localStorage.removeItem(storageKey)
  window.localStorage.removeItem('hearthwise-world-v1')
  return defaultWorldState
}
