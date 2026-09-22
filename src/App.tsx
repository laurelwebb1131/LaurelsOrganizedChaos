import { Canvas } from '@react-three/fiber'
import { Float, Html, OrbitControls, Stars, Text } from '@react-three/drei'
import { useState } from 'react'
import './styles.css'

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
  const [selectedLocation, setSelectedLocation] = useState<LocationId>('library')
  const [showPeople, setShowPeople] = useState(true)
  const [activeRoom, setActiveRoom] = useState<LocationId | null>(null)
  const active = locations.find((location) => location.id === selectedLocation) ?? locations[0]

  if (activeRoom === 'library') return <LibraryRoom onBack={() => setActiveRoom(null)} />

  return (
    <div className="world-app">
      <div className="world-canvas">
        <Canvas camera={{ position: [0, 0.5, 8.8], fov: 38 }} dpr={[1, 2]}>
          <color attach="background" args={['#08080b']} />
          <fog attach="fog" args={['#08080b', 8, 15]} />
          <ambientLight intensity={1.2} color="#b9b0cb" />
          <directionalLight position={[4, 6, 5]} intensity={4.2} color="#fff1fb" />
          <pointLight position={[-4, 2, 4]} intensity={12} distance={9} color="#ff3d9b" />
          <pointLight position={[4, -3, 2]} intensity={8} distance={8} color="#56b4ff" />
          <Stars radius={80} depth={35} count={1800} factor={2.1} saturation={0.5} fade speed={0.4} />
          <PlanetWorld selectedLocation={selectedLocation} onSelect={setSelectedLocation} showPeople={showPeople} />
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
        <div className="copy-kicker"><span>✦</span> TUESDAY · WANING MOON</div>
        <h1>Welcome back,<br /><em>Laurel.</em></h1>
        <p>This is your world. Every place holds a part of the life you are making.</p>
        <div className="orbit-line"><span /><b>4</b> realms active <i /> <b>7</b> day streak</div>
      </section>

      <section className="location-panel">
        <div className="panel-topline"><span className="panel-label">SELECTED REALM</span><button className="close-button" onClick={() => setSelectedLocation('library')}>×</button></div>
        <div className="location-heading"><span className="location-glyph" style={{ color: active.color, borderColor: active.color }}>{active.icon}</span><div><h2>{active.name}</h2><span>{active.domain}</span></div></div>
        <p>{active.description}</p>
        <div className="location-stats"><div><strong>{active.id === 'library' ? '68%' : active.id === 'home' ? '4/6' : active.id === 'university' ? '42%' : '3'}</strong><small>{active.id === 'love-doctor' ? 'open conversations' : 'current progress'}</small></div><div><strong>{active.id === 'library' ? '12' : '5'}</strong><small>ideas to explore</small></div></div>
        <button className="enter-button" onClick={() => setActiveRoom(active.id)}>Enter {active.name} <span>↗</span></button>
        <button className="companion-link" onClick={() => setShowPeople((visible) => !visible)}><span className={showPeople ? 'toggle on' : 'toggle'} /> Show life companions <b>{showPeople ? 'on' : 'off'}</b></button>
      </section>

      <div className="world-legend"><span><i className="legend-pink" /> PERSONAL</span><span><i className="legend-blue" /> DAILY LIFE</span><span><i className="legend-purple" /> GROWTH</span></div>
      <div className="zoom-hint">DRAG TO ROTATE <b>·</b> SCROLL TO ZOOM</div>
    </div>
  )
}

function LibraryRoom({ onBack }: { onBack: () => void }) {
  return <div className="room-app">
    <div className="room-canvas">
      <Canvas camera={{ position: [0, 1.1, 7.8], fov: 40 }} dpr={[1, 2]}>
        <color attach="background" args={['#0b0810']} />
        <fog attach="fog" args={['#0b0810', 7, 13]} />
        <ambientLight intensity={1.5} color="#bfb3d1" />
        <pointLight position={[0, 4, 3]} intensity={14} distance={10} color="#ff3d9b" />
        <pointLight position={[-4, 2, 1]} intensity={10} distance={7} color="#9257e3" />
        <Stars radius={70} depth={30} count={900} factor={1.8} fade speed={0.25} />
        <LibraryScene />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={10} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.7} />
      </Canvas>
    </div>
    <header className="room-header"><button className="back-button" onClick={onBack}>← <span>Return to your world</span></button><div className="room-breadcrumb"><span>YOUR WORLD</span><b>/</b><strong>THE LIBRARY</strong></div><button className="room-profile">LW</button></header>
    <section className="room-intro"><div className="copy-kicker"><span>✦</span> PERSONAL GOALS</div><h1>The<br /><em>Library</em></h1><p>A quiet place for the ideas you are growing into.</p><div className="room-progress"><div><strong>68%</strong><small>weekly tending</small></div><div><strong>12</strong><small>open ideas</small></div><div><strong>3</strong><small>active goals</small></div></div></section>
    <section className="goal-panel"><div className="panel-topline"><span className="panel-label">YOUR SHELVES</span><button className="close-button">•••</button></div><div className="goal-row active-goal"><span className="goal-icon">✦</span><div><strong>Build Hearthwise</strong><small>Creative work · 68% tended</small><div className="goal-track"><i /></div></div><b>68%</b></div><div className="goal-row"><span className="goal-icon blue">◇</span><div><strong>Learn 3D design</strong><small>Learning · 4 of 8 sessions</small><div className="goal-track blue-track"><i /></div></div><b>50%</b></div><button className="idea-button"><span>✧</span> Ask Juniper for an idea <b>↗</b></button></section>
    <div className="room-note"><span className="owl-glyph">◉</span><div><strong>Owl says</strong><p>“A good idea is often just a question you have not asked yet.”</p></div></div>
    <div className="room-hint">DRAG TO LOOK AROUND <b>·</b> SELECT A SHELF TO EXPLORE</div>
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
    <Float speed={1.2} floatIntensity={.25}><group position={[1.05, .18, 1.18]}><mesh><sphereGeometry args={[.3, 24, 24]} /><meshStandardMaterial color="#18131f" /></mesh><mesh position={[-.12, .28, 0]} rotation={[0, 0, -.3]}><coneGeometry args={[.12, .32, 4]} /><meshStandardMaterial color="#18131f" /></mesh><mesh position={[.12, .28, 0]} rotation={[0, 0, .3]}><coneGeometry args={[.12, .32, 4]} /><meshStandardMaterial color="#18131f" /></mesh><mesh position={[-.11, .2, .28]}><sphereGeometry args={[.04, 12, 12]} /><meshBasicMaterial color="#ff3d9b" /></mesh><mesh position={[.11, .2, .28]}><sphereGeometry args={[.04, 12, 12]} /><meshBasicMaterial color="#ff3d9b" /></mesh></group></Float>
  </group>
}

function PlanetWorld({ selectedLocation, onSelect, showPeople }: { selectedLocation: LocationId; onSelect: (id: LocationId) => void; showPeople: boolean }) {
  return <group>
    <Float speed={0.7} rotationIntensity={0.08} floatIntensity={0.16}>
      <mesh rotation={[0.15, -0.25, 0.1]}>
        <sphereGeometry args={[2.55, 96, 96]} />
        <meshStandardMaterial color="#24202f" roughness={0.82} metalness={0.18} />
      </mesh>
      <mesh scale={1.02}>
        <sphereGeometry args={[2.55, 64, 64]} />
        <meshBasicMaterial color="#9257e3" transparent opacity={0.06} wireframe />
      </mesh>
      {locations.map((location) => <LocationMarker key={location.id} location={location} selected={selectedLocation === location.id} onSelect={onSelect} />)}
      {showPeople && <Companion position={[0.1, 0.15, 2.58]} />}
    </Float>
    <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2.9, 3.02, 96]} />
      <meshBasicMaterial color="#ff3d9b" transparent opacity={0.12} />
    </mesh>
  </group>
}

function LocationMarker({ location, selected, onSelect }: { location: Location; selected: boolean; onSelect: (id: LocationId) => void }) {
  return <group position={location.position} onClick={(event) => { event.stopPropagation(); onSelect(location.id) }}>
    <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.2}>
      <mesh>
        <icosahedronGeometry args={[selected ? 0.32 : 0.25, 2]} />
        <meshStandardMaterial color={location.color} emissive={location.color} emissiveIntensity={selected ? 1.8 : 0.8} roughness={0.3} metalness={0.35} />
      </mesh>
      {selected && <mesh scale={1.55}><ringGeometry args={[0.32, 0.36, 32]} /><meshBasicMaterial color={location.color} transparent opacity={0.55} /></mesh>}
      <Text position={[0, -0.56, 0]} fontSize={0.13} color="#c9cdd8" anchorX="center" anchorY="middle">{location.name}</Text>
      <Html center position={[0, 0.02, 0.05]} distanceFactor={7} style={{ color: '#111118', fontSize: 12, fontWeight: 700, pointerEvents: 'none' }}>{location.icon}</Html>
    </Float>
  </group>
}

function Companion({ position }: { position: [number, number, number] }) {
  return <group position={position} scale={0.65}>
    <mesh position={[0, 0.38, 0]}><sphereGeometry args={[0.27, 24, 24]} /><meshStandardMaterial color="#111118" roughness={0.55} /></mesh>
    <mesh position={[0, -0.05, 0]}><capsuleGeometry args={[0.22, 0.48, 8, 16]} /><meshStandardMaterial color="#111118" roughness={0.62} /></mesh>
    <mesh position={[-0.1, 0.63, 0]} rotation={[0, 0, -0.35]}><coneGeometry args={[0.11, 0.34, 4]} /><meshStandardMaterial color="#111118" /></mesh>
    <mesh position={[0.1, 0.63, 0]} rotation={[0, 0, 0.35]}><coneGeometry args={[0.11, 0.34, 4]} /><meshStandardMaterial color="#111118" /></mesh>
    <mesh position={[-0.1, 0.42, 0.24]}><sphereGeometry args={[0.035, 12, 12]} /><meshBasicMaterial color="#ff3d9b" /></mesh>
    <mesh position={[0.1, 0.42, 0.24]}><sphereGeometry args={[0.035, 12, 12]} /><meshBasicMaterial color="#ff3d9b" /></mesh>
  </group>
}

export default App
