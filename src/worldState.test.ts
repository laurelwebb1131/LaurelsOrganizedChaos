import assert from 'node:assert/strict'
import test from 'node:test'
import { hydrateWorldState, importWorldState } from './worldState'

test('world hydration normalizes malformed nested state', () => {
  const state = hydrateWorldState({
    version: 1,
    lastLocation: 'somewhere-impossible',
    savedIdeas: [' keep me ', 42, '', null],
    chores: [{ label: ' Dishes ', detail: 12, done: 'yes' }, null],
    companions: [{ id: '', name: ' Juniper ', role: ' Guide ', realm: 'All realms', context: '' }],
    goals: [{ id: 'g', title: ' Goal ', realm: 'The Library', progress: 999, nextStep: 7 }],
    habits: [{ id: 'h', title: ' Habit ', realm: 'Hearth House', cadence: '', completedToday: 1 }],
  })

  assert.equal(state.version, 2)
  assert.equal(state.lastLocation, 'library')
  assert.deepEqual(state.savedIdeas, ['keep me'])
  assert.deepEqual(state.chores, [{ label: 'Dishes', detail: '', done: false }])
  assert.equal(state.companions[0].name, 'Juniper')
  assert.equal(state.goals[0].progress, 100)
  assert.equal(state.habits[0].completedToday, false)
})

test('world import rejects unsupported or invalid files', () => {
  assert.throws(() => importWorldState('{'), /valid JSON/)
  assert.throws(() => importWorldState(JSON.stringify({ version: 1 })), /not a supported Hearthwise export/)
})

test('world import returns normalized version 2 state', () => {
  const state = importWorldState(JSON.stringify({
    version: 2,
    lastLocation: 'home',
    savedIdeas: [],
    chores: [],
    companions: [],
    goals: [{ id: 'g', title: 'Test', realm: 'The Library', progress: -10, nextStep: '' }],
    habits: [],
  }))

  assert.equal(state.version, 2)
  assert.equal(state.lastLocation, 'home')
  assert.equal(state.goals[0].progress, 0)
  assert.ok(state.companions.length > 0)
  assert.ok(state.habits.length > 0)
})
