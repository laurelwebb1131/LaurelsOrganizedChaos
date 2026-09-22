import { Canvas } from '@react-three/fiber'
import { ContactShadows, Float, Html, OrbitControls, Sparkles, Stars, Text, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useState } from 'react'
import './styles.css'
import { defaultWorldState, loadWorldState, saveWorldState } from './worldState'

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
  const [selectedLocation, setSelectedLocation] = useState<LocationId>('library')
  const [showPeople, setShowPeople] = useState(true)
  const [activeRoom, setActiveRoom] = useState<LocationId | null>(null)
  const active = locations.find((location) => location.id === selectedLocation) ?? locations[0]
  useEffect(() => { saveWorldState(worldState) }, [worldState])

  if (activeRoom === 'library') return <LibraryRoom onBack={() => setActiveRoom(null)} savedIdeas={worldState.savedIdeas} onSaveIdea={(idea) => setWorldState((state) => ({ ...state, savedIdeas: [...state.savedIdeas, idea] }))} />
  if (activeRoom === 'home') return <HomeRoom onBack={() => setActiveRoom(null)} chores={worldState.chores} onChoresChange={(chores) => setWorldState((state) => ({ ...state, chores }))} />

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
          <Suspense fallback={null}>
            <PlanetWorld selectedLocation={selectedLocation} onSelect={setSelectedLocation} showPeople={showPeople} />
            <ImportedCreature position={[-3.1, -1.55, 1.1]} />
            <ImportedAsset path="/assets/cc0/creatures/triangulon.glb" position={[3.1, -1.3, 1.2]} scale={0.22} />
            <ImportedAsset path="/assets/cc0/environment/crystal-cluster.glb" position={[0, -2.4, 2.4]} scale={0.35} />
            <ImportedAsset path="/assets/cc0/nature/deer.glb" position={[2.6, 1.7, -0.8]} scale={0.24} />
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
        <button className="nav-tab"><span>⚙</span> Customize world</button>
        <button className="nav-tab"><span>⌘</span> Invite a familiar</button>
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
        <button className="enter-button" onClick={() => setActiveRoom(active.id === 'home' || active.id === 'library' ? active.id : null)}>Enter {active.name} <span>↗</span></button>
        <button className="companion-link" onClick={() => setShowPeople((visible) => !visible)}><span className={showPeople ? 'toggle on' : 'toggle'} /> Show life companions <b>{showPeople ? 'on' : 'off'}</b></button>
      </section>

      <div className="world-legend"><span><i className="legend-pink" /> PERSONAL</span><span><i className="legend-blue" /> DAILY LIFE</span><span><i className="legend-purple" /> GROWTH</span></div>
      <div className="zoom-hint">DRAG TO ROTATE <b>·</b> SCROLL TO ZOOM</div>
    </div>
  )
}

function LibraryRoom({ onBack, savedIdeas, onSaveIdea }: { onBack: () => void; savedIdeas: string[]; onSaveIdea: (idea: string) => void }) {
  const [idea, setIdea] = useState<string | null>(null)
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
        <LibraryScene />
        <ContactShadows position={[0, -1.3, 0]} opacity={0.5} scale={8} blur={2.4} far={4} color="#050308" />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={10} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.7} />
      </Canvas>
    </div>
    <header className="room-header"><button className="back-button" onClick={onBack}>← <span>Return to your world</span></button><div className="room-breadcrumb"><span>YOUR WORLD</span><b>/</b><strong>THE LIBRARY</strong></div><button className="room-profile">LW</button></header>
    <section className="room-intro"><div className="copy-kicker"><span>✦</span> PERSONAL GOALS</div><h1>The<br /><em>Library</em></h1><p>A quiet place for the ideas you are growing into.</p><div className="room-progress"><div><strong>68%</strong><small>weekly tending</small></div><div><strong>12</strong><small>open ideas</small></div><div><strong>3</strong><small>active goals</small></div></div></section>
    <section className="goal-panel"><div className="panel-topline"><span className="panel-label">YOUR SHELVES</span><button className="close-button">•••</button></div><div className="goal-row active-goal"><span className="goal-icon">✦</span><div><strong>Build Hearthwise</strong><small>Creative work · 68% tended</small><div className="goal-track"><i /></div></div><b>68%</b></div><div className="goal-row"><span className="goal-icon blue">◇</span><div><strong>Learn 3D design</strong><small>Learning · 4 of 8 sessions</small><div className="goal-track blue-track"><i /></div></div><b>50%</b></div>{idea && <div className="idea-result"><span>✦</span><p>{idea}</p><button onClick={() => { onSaveIdea(idea); setIdea(null) }}>Save to shelf</button></div>}<button className="idea-button" onClick={askJuniper}><span>✧</span> {idea ? 'Ask for another idea' : 'Ask Juniper for an idea'} <b>↗</b></button></section>
    <div className="room-note"><span className="owl-glyph">◉</span><div><strong>Owl says</strong><p>{savedIdeas.length ? `${savedIdeas.length} idea${savedIdeas.length === 1 ? '' : 's'} tucked onto your shelf.` : '“A good idea is often just a question you have not asked yet.”'}</p></div></div>
    <div className="room-hint">DRAG TO LOOK AROUND <b>·</b> SELECT A SHELF TO EXPLORE</div>
  </div>
}

function HomeRoom({ onBack, chores, onChoresChange }: { onBack: () => void; chores: typeof defaultWorldState.chores; onChoresChange: (chores: typeof defaultWorldState.chores) => void }) {
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
        <HouseScene />
        <ContactShadows position={[0, -1.35, 0]} opacity={0.5} scale={8} blur={2.4} far={4} color="#030509" />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={10} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.7} />
      </Canvas>
    </div>
    <header className="room-header"><button className="back-button" onClick={onBack}>← <span>Return to your world</span></button><div className="room-breadcrumb"><span>YOUR WORLD</span><b>/</b><strong>HEARTH HOUSE</strong></div><button className="room-profile">LW</button></header>
    <section className="room-intro"><div className="copy-kicker blue-kicker"><span>⌂</span> FAMILY + EVERYDAY LIFE</div><h1>Hearth<br /><em>House</em></h1><p>The living room of your world: care, rhythms, and the work that keeps everyone held.</p><div className="room-progress"><div><strong>{completed}/{chores.length}</strong><small>tended today</small></div><div><strong>4</strong><small>people linked</small></div><div><strong>2</strong><small>rituals due</small></div></div></section>
    <section className="goal-panel home-panel"><div className="panel-topline"><span className="panel-label">TODAY AT HOME</span><span className="home-weather">☾ 64°</span></div>{chores.map((chore, index) => <button className={`home-chore ${chore.done ? 'done' : ''}`} key={chore.label} onClick={() => toggleChore(index)}><span className="chore-check">{chore.done ? '✓' : ''}</span><span><strong>{chore.label}</strong><small>{chore.detail}</small></span><b>›</b></button>)}<div className="home-summary"><span className="home-spark">✦</span><p>{completed === chores.length ? 'The house is settled for tonight.' : 'One small tending can make the whole room feel lighter.'}</p></div></section>
    <div className="room-note"><span className="owl-glyph blue-owl">☾</span><div><strong>Hearth says</strong><p>“Care is not one grand gesture. It is the little things, remembered.”</p></div></div>
    <div className="room-hint">DRAG TO LOOK AROUND <b>·</b> TEND A CHORE TO MARK IT COMPLETE</div>
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

function PlanetWorld({ selectedLocation, onSelect, showPeople }: { selectedLocation: LocationId; onSelect: (id: LocationId) => void; showPeople: boolean }) {
  return <group>
    <Float speed={0.7} rotationIntensity={0.08} floatIntensity={0.16}>
      <mesh rotation={[0.15, -0.25, 0.1]}>
        <sphereGeometry args={[2.55, 96, 96]} />
        <meshStandardMaterial color="#164d72" roughness={0.72} metalness={0.12} />
      </mesh>
      <mesh scale={1.012} rotation={[0.15, -0.25, 0.1]}>
        <sphereGeometry args={[2.55, 64, 64]} />
        <meshBasicMaterial color="#56b4ff" transparent opacity={0.12} wireframe />
      </mesh>
      <mesh scale={1.025} rotation={[0.15, -0.25, 0.1]}>
        <sphereGeometry args={[2.55, 64, 64]} />
        <meshPhysicalMaterial color="#9fdcff" transparent opacity={0.1} roughness={0.16} metalness={0.12} transmission={0.05} clearcoat={0.7} clearcoatRoughness={0.2} />
      </mesh>
      <EarthLand />
      <CloudBands />
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
