import { Canvas } from '@react-three/fiber'
import { ContactShadows, Float, Html, OrbitControls, Sparkles, Stars, Text, useGLTF } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import { Suspense, useEffect, useState } from 'react'
import './styles.css'
import { defaultWorldState, exportWorldState, importWorldState, loadWorldState, resetWorldState, saveWorldState } from './worldState'
import type { Companion } from './worldState'
import { requestCompanionReply } from './companionProvider'

type LocationId = 'library' | 'home' | 'university' | 'love-doctor'

type Location = {
  id: LocationId
  name: string
  domain: string
  description: string
  icon: string
  color: string
  position: [number, number, number]
}

const locations: Location[] = [
  { id: 'library', name: 'The Library', domain: 'Personal goals', description: 'Ideas, intentions, and the next chapter you are writing.', icon: '✦', color: '#ff3d9b', position: [-1.3, 1.65, 1.55] },
  { id: 'home', name: 'Hearth House', domain: 'Family + everyday life', description: 'Responsibilities, routines, and the people who make home home.', icon: '⌂', color: '#56b4ff', position: [1.65, 0.45, 1.55] },
  { id: 'university', name: 'The University', domain: 'Education goals', description: 'Courses, curiosity, practice, and the skills you want to carry forward.', icon: '◇', color: '#9257e3', position: [-1.45, -1.1, 1.9] },
  { id: 'love-doctor', name: 'The Love Doctor', domain: 'Relationship goals', description: 'A thoughtful room for connection, communication, and care.', icon: '♡', color: '#ff9dcd', position: [1.45, -1.3, 1.8] },
]

function App() {
  const [worldState, setWorldState] = useState(loadWorldState)
  const [selectedLocation, setSelectedLocation] = useState<LocationId>(() => {
    const value = window.location.hash.replace('#realm/', '')
    return locations.some((location) => location.id === value) ? value as LocationId : 'library'
  })
  const [showPeople, setShowPeople] = useState(true)
  const [showCodex, setShowCodex] = useState(false)
  const [activeRoom, setActiveRoom] = useState<LocationId | null>(() => {
    const value = window.location.hash.replace('#room/', '')
    return value === 'library' || value === 'home' ? value : null
  })
  const active = locations.find((location) => location.id === selectedLocation) ?? locations[0]
  const [storageError, setStorageError] = useState('')
  useEffect(() => { try { saveWorldState(worldState); setStorageError('') } catch (error) { setStorageError(error instanceof Error ? error.message : 'World could not be saved.') } }, [worldState])
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'hearthwise-world-v2') setWorldState(loadWorldState())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash
      if (hash.startsWith('#realm/')) setSelectedLocation(hash.replace('#realm/', '') as LocationId)
      if (hash.startsWith('#room/')) setActiveRoom(hash.replace('#room/', '') as LocationId)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  const selectLocation = (location: LocationId) => {
    setSelectedLocation(location)
    window.location.hash = `realm/${location}`
  }
  const enterRoom = (room: LocationId) => {
    setActiveRoom(room)
    window.location.hash = `room/${room}`
  }
  const leaveRoom = () => {
    setActiveRoom(null)
    window.location.hash = `realm/${selectedLocation}`
  }

  if (activeRoom === 'library') return <LibraryRoom onBack={leaveRoom} savedIdeas={worldState.savedIdeas} companions={worldState.companions} goals={worldState.goals} habits={worldState.habits} onSaveIdea={(idea) => setWorldState((state) => ({ ...state, savedIdeas: [...state.savedIdeas, idea] }))} />
  if (activeRoom === 'home') return <HomeRoom onBack={leaveRoom} chores={worldState.chores} companions={worldState.companions} goals={worldState.goals} habits={worldState.habits} onChoresChange={(chores) => setWorldState((state) => ({ ...state, chores }))} />
  if (activeRoom === 'university') return <UniversityRoom onBack={leaveRoom} companions={worldState.companions} goals={worldState.goals} habits={worldState.habits} />
  if (activeRoom === 'love-doctor') return <LoveDoctorRoom onBack={leaveRoom} companions={worldState.companions} goals={worldState.goals} habits={worldState.habits} />

  return (
    <div className="world-app">
      <div className="world-canvas">
        <Canvas shadows camera={{ position: [0, 0.5, 8.8], fov: 38 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMappingExposure = 1.18 }}>
          <color attach="background" args={['#08080b']} />
          <fog attach="fog" args={['#08080b', 8, 15]} />
          <ambientLight intensity={1.25} color="#b9b0cb" />
          <directionalLight castShadow position={[4, 6, 5]} intensity={4.8} color="#fff1fb" shadow-mapSize={[2048, 2048]} />
          <pointLight position={[-4, 2, 4]} intensity={16} distance={9} color="#ff3d9b" />
          <pointLight position={[4, -3, 2]} intensity={11} distance={8} color="#56b4ff" />
          <Stars radius={80} depth={35} count={1800} factor={2.1} saturation={0.5} fade speed={0.4} />
          <Sparkles count={90} scale={[8, 6, 8]} size={1.7} speed={0.2} color="#ff9dcd" opacity={0.32} />
          <Suspense fallback={<SceneLoading label="Loading your world..." />}>
            <PlanetWorld selectedLocation={selectedLocation} onSelect={selectLocation} showPeople={showPeople} />
            <ContactShadows position={[0, -2.95, 0]} opacity={0.35} scale={8} blur={2.8} far={4.5} color="#10071a" />
          </Suspense>
          <OrbitControls enablePan={false} minDistance={6.3} maxDistance={11} minPolarAngle={Math.PI / 3.4} maxPolarAngle={Math.PI / 1.7} autoRotate autoRotateSpeed={0.18} />
        </Canvas>
      </div>

      <header className="world-header">
        <div className="world-brand"><span className="brand-sigil">☾</span><div><strong>Hearthwise</strong><small>your life, in orbit</small></div></div>
        <div className="world-status"><span className="status-pulse" /> WORLD ONLINE <b>·</b> TUESDAY, OCT 24</div>
        <button className="profile-button"><span className="profile-orb">LW</span><span className="profile-name">Laurel Webb</span><span>⌄</span></button>
      </header>

      <aside className="world-nav">
        <div className="nav-kicker">YOUR WORLD</div>
        <button className="nav-tab active"><span>◎</span> Planet view</button>
        <button className="nav-tab"><span>♧</span> Daily orbit <b>3</b></button>
        <button className="nav-tab"><span>✧</span> Milestones</button>
        <button className="nav-tab"><span>☽</span> Night journal</button>
        <div className="nav-divider" />
        <div className="nav-kicker">WORLD SETTINGS</div>
        <button className="nav-tab" onClick={() => {
          const file = new Blob([exportWorldState(worldState)], { type: 'application/json' })
          const url = URL.createObjectURL(file)
          const link = document.createElement('a')
          link.href = url; link.download = 'hearthwise-world.json'; link.click(); URL.revokeObjectURL(url)
        }}><span>⇩</span> Export world</button>
        <button className="nav-tab" onClick={() => {
          const phrase = window.prompt('Type RESET WORLD to erase this local world.')
          if (phrase === 'RESET WORLD') setWorldState(resetWorldState())
        }}><span>↺</span> Reset world</button>
        <button className="nav-tab" onClick={() => setShowCodex(true)}><span>⌘</span> Invite a familiar</button>
        <div className="nav-foot"><span className="tiny-moon">◐</span><div><strong>Waning moon</strong><small>Good night for tending</small></div></div>
      </aside>

      <section className="world-copy">
        <div className="copy-kicker"><span>✦</span> TUESDAY · WANING MOON · MYTHIC EARTH</div>
        <h1>Welcome back,<br /><em>Laurel.</em></h1>
        <p>This is your world. Every place holds a part of the life you are making, and every legend may be real.</p>
        <div className="orbit-line"><span /><b>4</b> realms active <i /> <b>7</b> day streak</div>
      </section>

      <section className="location-panel">
        <div className="panel-topline"><span className="panel-label">SELECTED REALM</span><button className="close-button" onClick={() => setSelectedLocation('library')}>×</button></div>
        <div className="location-heading"><span className="location-glyph" style={{ color: active.color, borderColor: active.color }}>{active.icon}</span><div><h2>{active.name}</h2><span>{active.domain}</span></div></div>
        <p>{active.description}</p>
        <div className="location-stats"><div><strong>{active.id === 'library' ? '68%' : active.id === 'home' ? '4/6' : active.id === 'university' ? '42%' : '3'}</strong><small>{active.id === 'love-doctor' ? 'open conversations' : 'current progress'}</small></div><div><strong>{active.id === 'library' ? '12' : '5'}</strong><small>ideas to explore</small></div></div>
        <button className="enter-button" onClick={() => (active.id === 'home' || active.id === 'library' || active.id === 'university' || active.id === 'love-doctor') && enterRoom(active.id)}>Enter {active.name} <span>↗</span></button>
        <button className="companion-link" onClick={() => setShowPeople((visible) => !visible)}><span className={showPeople ? 'toggle on' : 'toggle'} /> Show life companions <b>{showPeople ? 'on' : 'off'}</b></button>
      </section>

      <div className="world-legend"><span><i className="legend-pink" /> PERSONAL</span><span><i className="legend-blue" /> DAILY LIFE</span><span><i className="legend-purple" /> GROWTH</span></div>
      <div className="zoom-hint">DRAG TO ROTATE <b>·</b> SCROLL TO ZOOM</div>
      {showCodex && <CompanionCodex companions={worldState.companions} onClose={() => setShowCodex(false)} onAdd={(companion) => setWorldState((state) => ({ ...state, companions: [...state.companions, companion] }))} />}
      {storageError && <div className="storage-alert" role="alert">{storageError}</div>}
    </div>
  )
}

function CompanionCodex({ companions, onClose, onAdd }: { companions: Companion[]; onClose: () => void; onAdd: (companion: Companion) => void }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [realm, setRealm] = useState('All realms')
  const [context, setContext] = useState('')
  const save = () => {
    if (!name.trim() || !role.trim()) return
    onAdd({ id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, name: name.trim(), role: role.trim(), realm, context: context.trim() || 'No context added yet.' })
    setName(''); setRole(''); setContext(''); setAdding(false)
  }
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  return <div className="codex-scrim" role="presentation" onClick={onClose}><section className="codex-panel" role="dialog" aria-modal="true" aria-labelledby="codex-title" onClick={(event) => event.stopPropagation()}>
    <div className="codex-header"><div><span className="panel-label">YOUR WORLD · PEOPLE + FAMILIARS</span><h2 id="codex-title">Companion Codex</h2></div><button className="close-button" onClick={onClose} aria-label="Close companion codex">×</button></div>
    <p className="codex-intro">Give the people and guides in your life a place in Hearthwise. You choose what is remembered; nothing is inferred.</p>
    <div className="companion-list">{companions.map((companion) => <article className="companion-card" key={companion.id}><div className="companion-avatar">{companion.name === 'Juniper' ? '☾' : companion.name.slice(0, 1).toUpperCase()}</div><div><strong>{companion.name}</strong><span>{companion.role} · {companion.realm}</span><p>{companion.context}</p><small className="companion-presence">Appears in {companion.realm === 'All realms' ? 'every room' : companion.realm}</small></div></article>)}</div>
    {adding ? <div className="companion-form"><label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="What should Hearthwise call them?" /></label><label>Role<input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. partner, mentor, sibling" /></label><label>Realm<select value={realm} onChange={(event) => setRealm(event.target.value)}><option>All realms</option><option>Hearth House</option><option>The Library</option><option>The University</option><option>The Love Doctor</option></select></label><label>Helpful context<span className="optional">optional</span><textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="What should their familiar know to be useful and respectful?" rows={3} /></label><div className="form-actions"><button className="secondary-button" onClick={() => setAdding(false)}>Cancel</button><button className="enter-button form-save" onClick={save} disabled={!name.trim() || !role.trim()}>Add companion</button></div></div> : <button className="idea-button codex-add" onClick={() => setAdding(true)}><span>＋</span> Add someone from your world <b>↗</b></button>}
  </section></div>
}

function LibraryRoom({ onBack, savedIdeas, companions, goals, habits, onSaveIdea }: { onBack: () => void; savedIdeas: string[]; companions: Companion[]; goals: typeof defaultWorldState.goals; habits: typeof defaultWorldState.habits; onSaveIdea: (idea: string) => void }) {
  const [idea, setIdea] = useState<string | null>(null)
  const guide = companions.find((companion) => companion.realm === 'The Library' || companion.realm === 'All realms') ?? companions[0]
  const ideas = [
    'Set a 20-minute “tiny prototype” timer and build one beautiful corner of Hearthwise before lunch.',
    'Write three sentences about the person this world is meant to help, then use one as your next design test.',
    'Choose one Mythic Earth creature and give it a role in a real goal: guide, witness, challenger, or reward.',
  ]
  const askJuniper = () => setIdea(ideas[savedIdeas.length % ideas.length])

  return <div className="room-app">
    <div className="room-canvas">
      <Canvas camera={{ position: [0, 1.1, 7.8], fov: 40 }} dpr={[1, 2]}>
        <color attach="background" args={['#0b0810']} />
        <fog attach="fog" args={['#0b0810', 7, 13]} />
        <ambientLight intensity={1.6} color="#bfb3d1" />
        <directionalLight castShadow position={[3, 6, 4]} intensity={3.5} color="#fff1fb" shadow-mapSize={[2048, 2048]} />
        <pointLight position={[0, 4, 3]} intensity={18} distance={10} color="#ff3d9b" />
        <pointLight position={[-4, 2, 1]} intensity={13} distance={7} color="#9257e3" />
        <Stars radius={70} depth={30} count={900} factor={1.8} fade speed={0.25} />
        <Suspense fallback={<SceneLoading label="Opening the Library..." />}><LibraryScene /></Suspense>
        <ContactShadows position={[0, -1.3, 0]} opacity={0.5} scale={8} blur={2.4} far={4} color="#050308" />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={10} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.7} />
      </Canvas>
    </div>
    <header className="room-header"><button className="back-button" onClick={onBack}>← <span>Return to your world</span></button><div className="room-breadcrumb"><span>YOUR WORLD</span><b>/</b><strong>THE LIBRARY</strong></div><button className="room-profile">LW</button></header>
    <section className="room-intro"><div className="copy-kicker"><span>✦</span> PERSONAL GOALS</div><h1>The<br /><em>Library</em></h1><p>A quiet place for the ideas you are growing into.</p><div className="room-progress"><div><strong>68%</strong><small>weekly tending</small></div><div><strong>12</strong><small>open ideas</small></div><div><strong>3</strong><small>active goals</small></div></div></section>
    <section className="goal-panel"><div className="panel-topline"><span className="panel-label">YOUR SHELVES</span><button className="close-button">•••</button></div><div className="goal-row active-goal"><span className="goal-icon">✦</span><div><strong>Build Hearthwise</strong><small>Creative work · 68% tended</small><div className="goal-track"><i /></div></div><b>68%</b></div><div className="goal-row"><span className="goal-icon blue">◇</span><div><strong>Learn 3D design</strong><small>Learning · 4 of 8 sessions</small><div className="goal-track blue-track"><i /></div></div><b>50%</b></div>{idea && <div className="idea-result"><span>✦</span><p>{idea}</p><button onClick={() => { onSaveIdea(idea); setIdea(null) }}>Save to shelf</button></div>}<button className="idea-button" onClick={askJuniper}><span>✧</span> {idea ? 'Ask for another idea' : 'Ask Juniper for an idea'} <b>↗</b></button></section>
    <CompanionChat companion={guide} realm="The Library" prompt="Help me choose my next idea" goals={goals} habits={habits} />
    <div className="room-note"><span className="owl-glyph">◉</span><div><strong>{guide?.name ?? 'Owl'} · {guide?.role ?? 'Library guide'}</strong><p>{savedIdeas.length ? `${savedIdeas.length} idea${savedIdeas.length === 1 ? '' : 's'} tucked onto your shelf.` : `“${guide?.context ?? 'A good idea is often just a question you have not asked yet.'}”`}</p></div></div>
    <div className="room-hint">DRAG TO LOOK AROUND <b>·</b> SELECT A SHELF TO EXPLORE</div>
  </div>
}

function HomeRoom({ onBack, chores, companions, goals, habits, onChoresChange }: { onBack: () => void; chores: typeof defaultWorldState.chores; companions: Companion[]; goals: typeof defaultWorldState.goals; habits: typeof defaultWorldState.habits; onChoresChange: (chores: typeof defaultWorldState.chores) => void }) {
  const completed = chores.filter((chore) => chore.done).length
  const toggleChore = (index: number) => onChoresChange(chores.map((chore, choreIndex) => choreIndex === index ? { ...chore, done: !chore.done } : chore))

  return <div className="room-app home-room">
    <div className="room-canvas">
      <Canvas shadows camera={{ position: [0, 1.2, 7.8], fov: 40 }} dpr={[1, 2]}>
        <color attach="background" args={['#090d14']} />
        <fog attach="fog" args={['#090d14', 7, 13]} />
        <ambientLight intensity={1.5} color="#b7c8dc" />
        <directionalLight castShadow position={[3, 6, 4]} intensity={3.6} color="#e5f3ff" shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-3, 3, 2]} intensity={14} distance={8} color="#56b4ff" />
        <pointLight position={[3, 2, 3]} intensity={10} distance={7} color="#ff9dcd" />
        <Stars radius={70} depth={30} count={850} factor={1.6} fade speed={0.2} />
        <Suspense fallback={<SceneLoading label="Opening Hearth House..." />}><HouseScene /></Suspense>
        <ContactShadows position={[0, -1.35, 0]} opacity={0.5} scale={8} blur={2.4} far={4} color="#030509" />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={10} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.7} />
      </Canvas>
    </div>
    <header className="room-header"><button className="back-button" onClick={onBack}>← <span>Return to your world</span></button><div className="room-breadcrumb"><span>YOUR WORLD</span><b>/</b><strong>HEARTH HOUSE</strong></div><button className="room-profile">LW</button></header>
    <section className="room-intro"><div className="copy-kicker blue-kicker"><span>⌂</span> FAMILY + EVERYDAY LIFE</div><h1>Hearth<br /><em>House</em></h1><p>The living room of your world: care, rhythms, and the work that keeps everyone held.</p><div className="room-progress"><div><strong>{completed}/{chores.length}</strong><small>tended today</small></div><div><strong>4</strong><small>people linked</small></div><div><strong>2</strong><small>rituals due</small></div></div></section>
    <section className="goal-panel home-panel"><div className="panel-topline"><span className="panel-label">TODAY AT HOME</span><span className="home-weather">☾ 64°</span></div>{chores.map((chore, index) => <button className={`home-chore ${chore.done ? 'done' : ''}`} key={chore.label} onClick={() => toggleChore(index)}><span className="chore-check">{chore.done ? '✓' : ''}</span><span><strong>{chore.label}</strong><small>{chore.detail}</small></span><b>›</b></button>)}<div className="home-summary"><span className="home-spark">✦</span><p>{completed === chores.length ? 'The house is settled for tonight.' : 'One small tending can make the whole room feel lighter.'}</p></div></section>
    <CompanionChat companion={companions.find((companion) => companion.realm === 'Hearth House' || companion.realm === 'All realms')} realm="Hearth House" prompt="Help me make home feel lighter" goals={goals} habits={habits} />
    <div className="room-note"><span className="owl-glyph blue-owl">☾</span><div><strong>{companions.find((companion) => companion.realm === 'Hearth House' || companion.realm === 'All realms')?.name ?? 'Hearth'} · household guide</strong><p>“{companions.find((companion) => companion.realm === 'Hearth House' || companion.realm === 'All realms')?.context ?? 'Care is not one grand gesture. It is the little things, remembered.'}”</p></div></div>
    <div className="room-hint">DRAG TO LOOK AROUND <b>·</b> TEND A CHORE TO MARK IT COMPLETE</div>
  </div>
}

function UniversityRoom({ onBack, companions, goals, habits }: { onBack: () => void; companions: Companion[]; goals: typeof defaultWorldState.goals; habits: typeof defaultWorldState.habits }) {
  const learningGoal = goals.find((goal) => goal.realm === 'The University')
  const studyHabit = habits.find((habit) => habit.realm === 'The University')
  const guide = companions.find((companion) => companion.realm === 'The University' || companion.realm === 'All realms')
  const [sessionStarted, setSessionStarted] = useState(false)
  return <div className="room-app university-room">
    <div className="room-canvas"><Canvas shadows camera={{ position: [0, 1.2, 7.8], fov: 40 }} dpr={[1, 2]}><color attach="background" args={['#090b14']} /><fog attach="fog" args={['#090b14', 7, 13]} /><ambientLight intensity={1.5} color="#c5c0e5" /><directionalLight castShadow position={[3, 6, 4]} intensity={4} color="#e9f3ff" shadow-mapSize={[2048, 2048]} /><pointLight position={[-3, 3, 2]} intensity={15} distance={8} color="#9257e3" /><pointLight position={[3, 2, 3]} intensity={10} distance={7} color="#56b4ff" /><Stars radius={70} depth={30} count={950} factor={1.8} fade speed={.2} /><Suspense fallback={<SceneLoading label="Opening The University..." />}><UniversityScene /></Suspense><ContactShadows position={[0, -1.35, 0]} opacity={.5} scale={8} blur={2.4} far={4} color="#030509" /><OrbitControls enablePan={false} minDistance={5} maxDistance={10} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.7} /></Canvas></div>
    <header className="room-header"><button className="back-button" onClick={onBack}>← <span>Return to your world</span></button><div className="room-breadcrumb"><span>YOUR WORLD</span><b>/</b><strong>THE UNIVERSITY</strong></div><button className="room-profile">LW</button></header>
    <section className="room-intro"><div className="copy-kicker university-kicker"><span>◇</span> EDUCATION GOALS</div><h1>The<br /><em>University</em></h1><p>A place for curiosity, practice, and the skills you want to carry forward.</p><div className="room-progress"><div><strong>{learningGoal?.progress ?? 50}%</strong><small>course progress</small></div><div><strong>{studyHabit?.completedToday ? '1' : '0'}</strong><small>session today</small></div><div><strong>4</strong><small>lessons left</small></div></div></section>
    <section className="goal-panel university-panel"><div className="panel-topline"><span className="panel-label">CURRENT STUDY PLAN</span><span className="home-weather">✦ FOCUS MODE</span></div><div className="study-card"><div className="study-orb">◇</div><div><strong>Learn 3D design</strong><small>{learningGoal?.nextStep ?? 'Complete one focused practice session.'}</small></div><b>{learningGoal?.progress ?? 50}%</b></div><div className="study-track"><i style={{ width: `${learningGoal?.progress ?? 50}%` }} /></div><button className={`enter-button study-button ${sessionStarted ? 'session-active' : ''}`} onClick={() => setSessionStarted((current) => !current)}>{sessionStarted ? 'Study session in progress' : 'Start a 25-minute session'} <span>{sessionStarted ? '◉' : '↗'}</span></button><div className="study-note"><span>✧</span><p>{sessionStarted ? 'Your next step is small enough to begin. Keep going.' : 'A short session counts. You are building a path, not proving a point.'}</p></div></section>
    <CompanionChat companion={guide} realm="The University" prompt="Help me choose what to study first" goals={goals} habits={habits} />
    <div className="room-note"><span className="owl-glyph university-owl">◇</span><div><strong>{guide?.name ?? 'The Owl'} · learning guide</strong><p>“{guide?.context ?? 'Curiosity is a direction. Let’s take one step.'}”</p></div></div>
    <div className="room-hint">DRAG TO LOOK AROUND <b>·</b> START A SESSION TO MARK MOMENTUM</div>
  </div>
}

function LoveDoctorRoom({ onBack, companions, goals, habits }: { onBack: () => void; companions: Companion[]; goals: typeof defaultWorldState.goals; habits: typeof defaultWorldState.habits }) {
  const guide = companions.find((companion) => companion.realm === 'The Love Doctor' || companion.realm === 'All realms')
  const relationshipGoal = goals.find((goal) => goal.realm === 'The Love Doctor')
  const [selectedPractice, setSelectedPractice] = useState('A clear, kind check-in')
  const practices = ['A clear, kind check-in', 'Name one thing you appreciate', 'Make space for an honest question']
  return <div className="room-app love-room">
    <div className="room-canvas"><Canvas shadows camera={{ position: [0, 1.1, 7.8], fov: 40 }} dpr={[1, 2]}><color attach="background" args={['#110910']} /><fog attach="fog" args={['#110910', 7, 13]} /><ambientLight intensity={1.5} color="#f4c8df" /><directionalLight castShadow position={[3, 6, 4]} intensity={3.6} color="#fff1fb" shadow-mapSize={[2048, 2048]} /><pointLight position={[-3, 3, 2]} intensity={16} distance={8} color="#ff3d9b" /><pointLight position={[3, 2, 3]} intensity={8} distance={7} color="#9257e3" /><Stars radius={70} depth={30} count={850} factor={1.6} fade speed={.2} /><Suspense fallback={<SceneLoading label="Opening The Love Doctor..." />}><LoveScene /></Suspense><ContactShadows position={[0, -1.35, 0]} opacity={.5} scale={8} blur={2.4} far={4} color="#080308" /><OrbitControls enablePan={false} minDistance={5} maxDistance={10} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.7} /></Canvas></div>
    <header className="room-header"><button className="back-button" onClick={onBack}>← <span>Return to your world</span></button><div className="room-breadcrumb"><span>YOUR WORLD</span><b>/</b><strong>THE LOVE DOCTOR</strong></div><button className="room-profile">LW</button></header>
    <section className="room-intro"><div className="copy-kicker love-kicker"><span>♡</span> RELATIONSHIP GOALS</div><h1>The<br /><em>Love Doctor</em></h1><p>A gentle room for connection, communication, and care that respects everyone's agency.</p><div className="room-progress"><div><strong>{relationshipGoal?.progress ?? 0}%</strong><small>goal progress</small></div><div><strong>2</strong><small>open reflections</small></div><div><strong>1</strong><small>practice today</small></div></div></section>
    <section className="goal-panel love-panel"><div className="panel-topline"><span className="panel-label">CHOOSE A PRACTICE</span><span className="home-weather">♡ CONSENT FIRST</span></div><p className="love-copy">Small practices for connection. Choose only what feels welcome for everyone involved.</p>{practices.map((practice) => <button key={practice} className={`practice-option ${selectedPractice === practice ? 'selected' : ''}`} onClick={() => setSelectedPractice(practice)}><span>{selectedPractice === practice ? '✓' : '○'}</span>{practice}</button>)}<button className="enter-button love-button" onClick={() => window.alert(`Practice chosen: ${selectedPractice}`)}>Keep this practice <span>↗</span></button></section>
    <CompanionChat companion={guide} realm="The Love Doctor" prompt="Help me prepare for a caring conversation" goals={goals} habits={habits} />
    <div className="room-note"><span className="owl-glyph love-owl">♡</span><div><strong>{guide?.name ?? 'The Love Doctor'} · connection guide</strong><p>“{guide?.context ?? 'Connection grows where honesty and consent can sit together.'}”</p></div></div>
    <div className="room-hint">DRAG TO LOOK AROUND <b>·</b> CHOOSE A PRACTICE THAT FEELS WELCOME</div>
  </div>
}

function CompanionChat({ companion, realm, prompt, goals, habits }: { companion?: Companion; realm: string; prompt: string; goals: typeof defaultWorldState.goals; habits: typeof defaultWorldState.habits }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<{ from: 'you' | 'guide'; text: string }[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const guideName = companion?.name ?? (realm === 'The Library' ? 'Owl' : 'Hearth')
  const send = async (text: string) => {
    const clean = text.trim()
    if (!clean || isThinking) return
    const fallback = realm === 'The Library'
      ? `${guideName} says: start with the smallest version you can finish today. A finished page gives the next page somewhere to land.`
      : `${guideName} says: choose the kindest visible next step. The house does not need perfection, just a little more ease.`
    setMessages((current) => [...current, { from: 'you', text: clean }])
    setDraft('')
    setIsThinking(true)
    try {
      const realmGoals = goals.filter((goal) => goal.realm === realm || goal.realm === 'All realms').map(({ title, realm: goalRealm, progress, nextStep }) => ({ title, realm: goalRealm, progress, nextStep }))
      const realmHabits = habits.filter((habit) => habit.realm === realm || habit.realm === 'All realms').map(({ title, realm: habitRealm, cadence, completedToday }) => ({ title, realm: habitRealm, cadence, completedToday }))
      const reply = await requestCompanionReply({ companionName: guideName, companionRole: companion?.role ?? `${realm} guide`, companionContext: companion?.context ?? '', realm, userMessage: clean, goals: realmGoals, habits: realmHabits })
      setMessages((current) => [...current, { from: 'guide', text: reply }])
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'The companion service is unavailable.'
      setMessages((current) => [...current, { from: 'guide', text: `${fallback} (${reason})` }])
    } finally {
      setIsThinking(false)
    }
  }
  return <div className={`companion-chat ${open ? 'open' : ''}`}>
    <button className="chat-trigger" onClick={() => setOpen((current) => !current)}><span>✦</span> Talk with {guideName}<b>{open ? '−' : '+'}</b></button>
    {open && <div className="chat-window"><div className="chat-context"><span className="companion-avatar mini">{guideName === 'Juniper' ? '☾' : guideName.slice(0, 1).toUpperCase()}</span><div><strong>{guideName}</strong><small>{companion?.role ?? `${realm} guide`}</small></div></div><div className="chat-messages"><div className="chat-message guide-message">{companion?.context ?? 'I am here to help you find a gentle next step.'}</div>{messages.map((message, index) => <div className={`chat-message ${message.from === 'you' ? 'you-message' : 'guide-message'}`} key={`${message.text}-${index}`}>{message.text}</div>)}{isThinking && <div className="chat-message guide-message thinking">Thinking through your world...</div>}</div><div className="chat-suggestions"><button onClick={() => void send(prompt)}>{prompt}</button><button onClick={() => void send('What should I do first?')}>What first?</button></div><form className="chat-form" onSubmit={(event) => { event.preventDefault(); void send(draft) }}><input aria-label={`Message ${guideName}`} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Say something..." /><button aria-label="Send message" disabled={!draft.trim() || isThinking}>↗</button></form></div>}
  </div>
}

function LibraryScene() {
  return <group>
    <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[16, 16]} /><meshStandardMaterial color="#15101b" roughness={0.95} /></mesh>
    {[[-3.2, 1.1, -1.1], [0, 1.1, -1.5], [3.2, 1.1, -1.1]].map(([x, y, z], index) => <group key={x} position={[x, y, z]}><mesh><boxGeometry args={[2.55, 3.9, .32]} /><meshStandardMaterial color={index === 1 ? '#291a37' : '#1d1528'} roughness={.8} /></mesh>{Array.from({ length: 4 }).map((_, shelf) => <mesh key={shelf} position={[0, -1.3 + shelf * .82, .24]}><boxGeometry args={[2.25, .06, .18]} /><meshStandardMaterial color="#704a7e" emissive="#2e163a" emissiveIntensity={.4} /></mesh>)}</group>)}
    <mesh position={[0, -0.3, 1.2]}><boxGeometry args={[3.2, .18, 1.25]} /><meshStandardMaterial color="#5e3768" roughness={.5} metalness={.2} /></mesh>
    <mesh position={[0, -.78, 1.2]}><boxGeometry args={[.18, .95, 1.05]} /><meshStandardMaterial color="#3b2448" /></mesh>
    <mesh position={[-1.12, 1.1, 1.05]}><icosahedronGeometry args={[.34, 2]} /><meshStandardMaterial color="#ff3d9b" emissive="#ff3d9b" emissiveIntensity={1.2} /></mesh>
    <mesh position={[1.1, 1.35, 1.1]}><icosahedronGeometry args={[.27, 2]} /><meshStandardMaterial color="#56b4ff" emissive="#56b4ff" emissiveIntensity={1.1} /></mesh>
    <ImportedAsset path="/assets/cc0/nature/bench.glb" position={[-1.55, -1.15, 1.25]} scale={0.42} />
    <ImportedAsset path="/assets/cc0/environment/crystal-cluster.glb" position={[1.45, -1.1, 1.3]} scale={0.34} />
    <ImportedAsset path="/assets/cc0/nature/deer.glb" position={[2.25, -1.05, -0.25]} scale={0.22} />
    <Float speed={1.2} floatIntensity={.25}><group position={[1.05, .18, 1.18]}><mesh><sphereGeometry args={[.3, 24, 24]} /><meshStandardMaterial color="#18131f" /></mesh><mesh position={[-.12, .28, 0]} rotation={[0, 0, -.3]}><coneGeometry args={[.12, .32, 4]} /><meshStandardMaterial color="#18131f" /></mesh><mesh position={[.12, .28, 0]} rotation={[0, 0, .3]}><coneGeometry args={[.12, .32, 4]} /><meshStandardMaterial color="#18131f" /></mesh><mesh position={[-.11, .2, .28]}><sphereGeometry args={[.04, 12, 12]} /><meshBasicMaterial color="#ff3d9b" /></mesh><mesh position={[.11, .2, .28]}><sphereGeometry args={[.04, 12, 12]} /><meshBasicMaterial color="#ff3d9b" /></mesh></group></Float>
  </group>
}

function HouseScene() {
  return <group>
    <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[16, 16]} /><meshStandardMaterial color="#101821" roughness={.95} /></mesh>
    <mesh position={[0, .6, -1.15]}><boxGeometry args={[5.4, 3.8, .35]} /><meshStandardMaterial color="#17283a" roughness={.86} /></mesh>
    <mesh position={[0, 2.6, -1.15]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[3.8, 3.8, .38]} /><meshStandardMaterial color="#20374a" roughness={.82} /></mesh>
    <mesh position={[-1.65, .45, -.88]}><boxGeometry args={[1.4, 1.15, .28]} /><meshStandardMaterial color="#533b62" roughness={.65} /></mesh>
    <mesh position={[1.55, .25, -.8]}><boxGeometry args={[1.4, .65, .7]} /><meshStandardMaterial color="#3b2b48" roughness={.7} /></mesh>
    <mesh position={[1.55, .62, -.8]}><boxGeometry args={[1.55, .08, .8]} /><meshStandardMaterial color="#ff9dcd" emissive="#ff3d9b" emissiveIntensity={.16} roughness={.45} /></mesh>
    <ImportedAsset path="/assets/cc0/nature/bench.glb" position={[-.2, -1.1, .55]} scale={.5} />
    <ImportedAsset path="/assets/cc0/environment/crystal-cluster.glb" position={[2.2, -1.05, .85]} scale={.3} />
    <mesh position={[-2.2, .85, -.8]}><sphereGeometry args={[.34, 24, 24]} /><meshStandardMaterial color="#56b4ff" emissive="#56b4ff" emissiveIntensity={.45} roughness={.28} /></mesh>
    <mesh position={[-2.2, .85, -.42]}><sphereGeometry args={[.06, 12, 12]} /><meshBasicMaterial color="#ff3d9b" /></mesh>
  </group>
}

function UniversityScene() {
  return <group>
    <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[16, 16]} /><meshStandardMaterial color="#0d1220" roughness={.95} /></mesh>
    <mesh position={[0, .5, -1.2]}><boxGeometry args={[5.4, 3.7, .35]} /><meshStandardMaterial color="#171735" roughness={.8} /></mesh>
    <mesh position={[0, 2.5, -1.2]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[3.6, 3.6, .36]} /><meshStandardMaterial color="#252060" roughness={.75} /></mesh>
    <mesh position={[0, .1, .65]}><cylinderGeometry args={[1.25, 1.25, .16, 48]} /><meshStandardMaterial color="#261d47" roughness={.55} metalness={.2} /></mesh>
    <mesh position={[0, .28, .65]}><torusGeometry args={[.88, .035, 12, 48]} /><meshBasicMaterial color="#56b4ff" /></mesh>
    <mesh position={[0, .5, .65]}><icosahedronGeometry args={[.36, 2]} /><meshStandardMaterial color="#9257e3" emissive="#9257e3" emissiveIntensity={.8} roughness={.2} metalness={.32} /></mesh>
    <ImportedAsset path="/assets/cc0/nature/bench.glb" position={[-1.7, -1.1, .7]} scale={.42} />
    <ImportedAsset path="/assets/cc0/environment/crystal-cluster.glb" position={[1.8, -1.05, .8]} scale={.3} />
  </group>
}

function LoveScene() {
  return <group>
    <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[16, 16]} /><meshStandardMaterial color="#180d19" roughness={.94} /></mesh>
    <mesh position={[0, .55, -1.2]}><boxGeometry args={[5.4, 3.8, .35]} /><meshStandardMaterial color="#32152e" roughness={.8} /></mesh>
    <mesh position={[0, 2.6, -1.2]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[3.7, 3.7, .36]} /><meshStandardMaterial color="#4a1d43" roughness={.7} /></mesh>
    <mesh position={[-1.35, -.18, .6]}><sphereGeometry args={[.82, 32, 24]} /><meshStandardMaterial color="#63305b" roughness={.7} /></mesh>
    <mesh position={[1.35, -.18, .6]}><sphereGeometry args={[.82, 32, 24]} /><meshStandardMaterial color="#63305b" roughness={.7} /></mesh>
    <mesh position={[0, .7, .7]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.8, .06, 16, 48]} /><meshBasicMaterial color="#ff3d9b" /></mesh>
    <mesh position={[0, .7, .7]}><sphereGeometry args={[.34, 24, 24]} /><meshStandardMaterial color="#ff9dcd" emissive="#ff3d9b" emissiveIntensity={.35} roughness={.28} /></mesh>
    <ImportedAsset path="/assets/cc0/environment/crystal-cluster.glb" position={[-2.1, -1.05, .9]} scale={.28} />
  </group>
}

function PlanetWorld({ selectedLocation, onSelect, showPeople }: { selectedLocation: LocationId; onSelect: (id: LocationId) => void; showPeople: boolean }) {
  return <group>
    <Float speed={0.7} rotationIntensity={0.08} floatIntensity={0.16}>
      <MythicEarth />
      {locations.map((location) => <LocationMarker key={location.id} location={location} selected={selectedLocation === location.id} onSelect={onSelect} />)}
      {showPeople && <Companion position={[0.1, 0.15, 2.58]} />}
      <MythicDragon position={[-2.9, 1.85, 1.1]} />
      <MoonSpirit position={[3.45, 2.5, -0.5]} />
    </Float>
    <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2.9, 3.02, 96]} />
      <meshBasicMaterial color="#ff3d9b" transparent opacity={0.12} />
    </mesh>
  </group>
}

function MythicEarth() {
  const texture = useLoader(TextureLoader, '/assets/mythic-earth.svg')
  return <group rotation={[0.15, -0.25, 0.1]}>
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[2.55, 128, 128]} />
      <meshStandardMaterial map={texture} roughness={0.78} metalness={0.08} />
    </mesh>
    <mesh scale={1.035}>
      <sphereGeometry args={[2.55, 96, 96]} />
      <meshBasicMaterial color="#9fe3ff" transparent opacity={0.11} side={2} />
    </mesh>
    <mesh scale={1.065}>
      <sphereGeometry args={[2.55, 96, 96]} />
      <meshBasicMaterial color="#72cfff" transparent opacity={0.09} wireframe />
    </mesh>
  </group>
}

function EarthLand() {
  const landforms: [number, number, number, number, number, number][] = [
    [-1.48, 1.2, 1.78, .9, .32, .18], [-.76, 1.66, 1.72, .52, .25, .16],
    [.44, 1.7, 1.72, .85, .3, .2], [1.25, .95, 1.9, .58, .38, .2],
    [-1.45, -.1, 2.05, .7, .34, .17], [-.54, -.56, 2.17, .6, .3, .15],
    [.75, -.85, 2.0, .92, .3, .18], [1.55, -.2, 1.85, .4, .25, .14],
  ]
  return <group rotation={[0.15, -0.25, 0.1]}>{landforms.map(([x, y, z, sx, sy, sz], index) => <mesh key={index} position={[x, y, z]} scale={[sx, sy, sz]} rotation={[0.1 * index, 0.18 * index, 0.2]}>
    <sphereGeometry args={[1, 24, 16]} />
    <meshStandardMaterial color={index % 3 === 0 ? '#56845a' : '#3e7650'} roughness={0.92} metalness={0.03} />
  </mesh>)}</group>
}

function CloudBands() {
  return <group rotation={[0.15, 0.25, 0.1]}>
    {[[-.9, 1.9, 1.38, .8, .12, .12], [1.15, .45, 1.82, .65, .1, .1], [-1.4, -.8, 1.65, .6, .09, .1]].map(([x, y, z, sx, sy, sz], index) => <mesh key={index} position={[x, y, z]} scale={[sx, sy, sz]} rotation={[0, .3, .2]}>
      <sphereGeometry args={[1, 24, 12]} />
      <meshBasicMaterial color="#e8f3ff" transparent opacity={.18} />
    </mesh>)}
  </group>
}

function MythicDragon({ position }: { position: [number, number, number] }) {
  return <group position={position} scale={.48} rotation={[0.1, -0.4, 0.18]}>
    <mesh castShadow position={[0, 0, 0]}><capsuleGeometry args={[.2, 1.15, 12, 20]} /><meshStandardMaterial color="#2a1839" emissive="#5b2f86" emissiveIntensity={.32} roughness={.42} metalness={.25} /></mesh>
    <mesh castShadow position={[0, .7, .02]}><sphereGeometry args={[.3, 24, 20]} /><meshStandardMaterial color="#35204a" roughness={.4} metalness={.2} /></mesh>
    <mesh position={[0, .98, .03]} rotation={[0, 0, 0]}><coneGeometry args={[.13, .4, 5]} /><meshStandardMaterial color="#4b2b62" /></mesh>
    <mesh position={[-.1, .78, .26]}><sphereGeometry args={[.045, 12, 12]} /><meshBasicMaterial color="#ff3d9b" /></mesh>
    <mesh position={[.1, .78, .26]}><sphereGeometry args={[.045, 12, 12]} /><meshBasicMaterial color="#ff3d9b" /></mesh>
    <mesh position={[-.48, .2, 0]} rotation={[0, .2, -.35]}><coneGeometry args={[.62, 1.12, 5]} /><meshStandardMaterial color="#44245b" emissive="#ff3d9b" emissiveIntensity={.22} side={2} /></mesh>
    <mesh position={[.48, .2, 0]} rotation={[0, -.2, .35]}><coneGeometry args={[.62, 1.12, 5]} /><meshStandardMaterial color="#44245b" emissive="#ff3d9b" emissiveIntensity={.22} side={2} /></mesh>
    <mesh position={[0, -.75, .04]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[.17, 1.15, 10]} /><meshStandardMaterial color="#241630" /></mesh>
    <mesh position={[-.13, -.63, .18]}><capsuleGeometry args={[.06, .34, 6, 10]} /><meshStandardMaterial color="#241630" /></mesh>
    <mesh position={[.13, -.63, .18]}><capsuleGeometry args={[.06, .34, 6, 10]} /><meshStandardMaterial color="#241630" /></mesh>
  </group>
}

function MoonSpirit({ position }: { position: [number, number, number] }) {
  return <group position={position} scale={.36}>
    <Float speed={1.8} floatIntensity={.4}>
      <mesh><sphereGeometry args={[.42, 32, 32]} /><meshPhysicalMaterial color="#c9cdd8" emissive="#56b4ff" emissiveIntensity={.65} roughness={.28} metalness={.1} clearcoat={.8} /></mesh>
      <mesh scale={.78} position={[0, 0, .28]}><torusGeometry args={[.28, .045, 12, 32, Math.PI * 1.55]} /><meshBasicMaterial color="#ff9dcd" /></mesh>
      <mesh position={[-.12, .05, .37]}><sphereGeometry args={[.06, 10, 10]} /><meshBasicMaterial color="#24152f" /></mesh>
      <mesh position={[.12, -.1, .37]}><sphereGeometry args={[.08, 10, 10]} /><meshBasicMaterial color="#24152f" /></mesh>
      <pointLight intensity={2.5} distance={2.4} color="#56b4ff" />
    </Float>
  </group>
}

function ImportedCreature({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF('/assets/creatures/cc0-spider.glb')
  return <primitive object={scene.clone()} position={position} scale={0.28} rotation={[0, 0.6, 0]} />
}

function ImportedAsset({ path, position, scale }: { path: string; position: [number, number, number]; scale: number }) {
  const { scene } = useGLTF(path)
  return <primitive object={scene.clone()} position={position} scale={scale} />
}

function SceneLoading({ label }: { label: string }) {
  return <Html center><div className="scene-loading"><span className="loading-orb">✦</span><strong>{label}</strong><small>Gathering the starlight</small></div></Html>
}

useGLTF.preload('/assets/creatures/cc0-spider.glb')
useGLTF.preload('/assets/cc0/creatures/triangulon.glb')
useGLTF.preload('/assets/cc0/environment/crystal-cluster.glb')
useGLTF.preload('/assets/cc0/nature/deer.glb')

function LocationMarker({ location, selected, onSelect }: { location: Location; selected: boolean; onSelect: (id: LocationId) => void }) {
  return <group position={location.position} onClick={(event) => { event.stopPropagation(); onSelect(location.id) }}>
    <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.2}>
      <mesh castShadow rotation={[0.4, 0.2, 0.35]}>
        <octahedronGeometry args={[selected ? 0.34 : 0.26, 2]} />
        <meshPhysicalMaterial color={location.color} emissive={location.color} emissiveIntensity={selected ? 1.8 : 0.8} roughness={0.18} metalness={0.32} clearcoat={.9} clearcoatRoughness={.12} />
      </mesh>
      <mesh scale={.5} position={[0, -.22, 0]}><cylinderGeometry args={[.12, .2, .4, 8]} /><meshStandardMaterial color="#c9cdd8" metalness={.72} roughness={.25} /></mesh>
      {selected && <mesh scale={1.55}><ringGeometry args={[0.32, 0.36, 32]} /><meshBasicMaterial color={location.color} transparent opacity={0.55} /></mesh>}
      <Text position={[0, -0.56, 0]} fontSize={0.13} color="#c9cdd8" anchorX="center" anchorY="middle">{location.name}</Text>
      <Html center position={[0, 0.02, 0.05]} distanceFactor={7} style={{ color: '#111118', fontSize: 12, fontWeight: 700, pointerEvents: 'none' }}>{location.icon}</Html>
    </Float>
  </group>
}

function Companion({ position }: { position: [number, number, number] }) {
  return <group position={position} scale={0.68} rotation={[0, -.2, 0]}>
    <mesh castShadow position={[0, .08, 0]}><sphereGeometry args={[.31, 32, 24]} /><meshStandardMaterial color="#15131b" roughness={.42} metalness={.18} /></mesh>
    <mesh castShadow position={[0, .47, .01]}><sphereGeometry args={[.34, 32, 24]} /><meshStandardMaterial color="#211b29" roughness={.38} metalness={.2} /></mesh>
    <mesh position={[-.15, .76, 0]} rotation={[0, 0, -.32]}><coneGeometry args={[.13, .38, 5]} /><meshStandardMaterial color="#282034" roughness={.4} /></mesh>
    <mesh position={[.15, .76, 0]} rotation={[0, 0, .32]}><coneGeometry args={[.13, .38, 5]} /><meshStandardMaterial color="#282034" roughness={.4} /></mesh>
    <mesh position={[-.13, .49, .3]}><sphereGeometry args={[.045, 16, 16]} /><meshBasicMaterial color="#ff3d9b" /></mesh>
    <mesh position={[.13, .49, .3]}><sphereGeometry args={[.045, 16, 16]} /><meshBasicMaterial color="#ff3d9b" /></mesh>
    <mesh position={[0, .33, .31]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[.11, .15, 4]} /><meshStandardMaterial color="#9257e3" emissive="#9257e3" emissiveIntensity={.28} /></mesh>
    <mesh position={[-.28, .05, 0]} rotation={[0, 0, -.55]}><coneGeometry args={[.18, .48, 6]} /><meshStandardMaterial color="#30223e" roughness={.55} /></mesh>
    <mesh position={[.28, .05, 0]} rotation={[0, 0, .55]}><coneGeometry args={[.18, .48, 6]} /><meshStandardMaterial color="#30223e" roughness={.55} /></mesh>
    <mesh position={[-.11, -.27, .02]}><capsuleGeometry args={[.06, .25, 6, 10]} /><meshStandardMaterial color="#17131d" /></mesh>
    <mesh position={[.11, -.27, .02]}><capsuleGeometry args={[.06, .25, 6, 10]} /><meshStandardMaterial color="#17131d" /></mesh>
  </group>
}

export default App
