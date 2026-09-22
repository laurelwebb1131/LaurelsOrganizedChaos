import { useState } from 'react'

type IconName = 'today' | 'rituals' | 'quests' | 'realms' | 'journal'

const navigation: { label: string; icon: IconName }[] = [
  { label: 'Today', icon: 'today' },
  { label: 'Rituals', icon: 'rituals' },
  { label: 'Quests', icon: 'quests' },
  { label: 'Realms', icon: 'realms' },
  { label: 'Journal', icon: 'journal' },
]

const initialTasks = [
  { label: 'Water the kitchen herbs', meta: 'Home · 10 min', done: true },
  { label: 'Send the project follow-up', meta: 'Work · 20 min', done: false },
  { label: 'Pick up oat milk', meta: 'Errand · Before 6pm', done: false },
  { label: 'Five pages of The Night Circus', meta: 'Self · 15 min', done: false },
]

function App() {
  const [activePage, setActivePage] = useState<IconName>('today')
  const [tasks, setTasks] = useState(initialTasks)
  const [mood, setMood] = useState('steady')
  const [notice, setNotice] = useState('')

  const toggleTask = (index: number) => {
    setTasks((current) =>
      current.map((task, taskIndex) => (taskIndex === index ? { ...task, done: !task.done } : task)),
    )
  }

  const chooseMood = (value: string) => {
    setMood(value)
    setNotice('Check-in held. Your familiar is listening.')
    window.setTimeout(() => setNotice(''), 2800)
  }

  const completedTasks = tasks.filter((task) => task.done).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span>☾</span></div>
          <div>
            <strong>Hearthwise</strong>
            <span>life, held lightly</span>
          </div>
        </div>

        <div className="profile-chip">
          <div className="avatar"><span>♣</span></div>
          <div><strong>Laurel Webb</strong><span>Tuesday, Oct 24</span></div>
          <button className="dots-button" aria-label="Open profile menu">•••</button>
        </div>

        <nav className="primary-nav" aria-label="Main navigation">
          <p className="nav-heading">Your hearth</p>
          {navigation.map((item) => (
            <button
              className={`nav-item ${activePage === item.icon ? 'active' : ''}`}
              key={item.icon}
              onClick={() => setActivePage(item.icon)}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
              {item.icon === 'today' && <span className="nav-count">3</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="streak-card">
            <div className="streak-flame">☽</div>
            <div><strong>7 day tending streak</strong><span>Small steps make a life.</span></div>
          </div>
          <button className="settings-link"><span>⚙</span> Preferences</button>
          <div className="version">HEARTHWISE · BETA</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-brand" onClick={() => setActivePage('today')}><span>☾</span> Hearthwise</button>
          <div className="breadcrumb"><span>Hearth</span><b>/</b><strong>{navigation.find((item) => item.icon === activePage)?.label}</strong></div>
          <div className="top-actions">
            <button className="icon-button notification-button" aria-label="Notifications"><span>♢</span><i /></button>
            <button className="date-button"><span className="calendar-icon">▣</span> This week <span className="chevron">⌄</span></button>
          </div>
        </header>

        <div className="content-wrap">
          <section className="welcome-row">
            <div className="ambient-moon-art" aria-hidden="true"><span className="tiny-star star-one">✦</span><span className="tiny-star star-two">✧</span><span className="bat-mark">⌁</span></div>
            <div>
              <p className="eyebrow"><span className="eyebrow-star">✦</span> TUESDAY, OCTOBER 24 · WANING MOON</p>
              <h1>Good morning, Laurel.</h1>
              <p className="welcome-copy">There is room for what matters today.</p>
            </div>
            <div className="moon-orb" aria-label="Waning moon phase"><span>☾</span><i>quiet<br />moon</i><b>✦</b></div>
          </section>

          {activePage !== 'today' ? (
            <section className="placeholder-page">
              <div className="placeholder-icon">{navigation.find((item) => item.icon === activePage)?.label === 'Journal' ? '✎' : '✦'}</div>
              <h2>{navigation.find((item) => item.icon === activePage)?.label}</h2>
              <p>This room is being prepared. For now, your Today hearth has everything you need to tend the day.</p>
              <button className="primary-button" onClick={() => setActivePage('today')}>Return to Today <span>→</span></button>
            </section>
          ) : (
            <>
              <section className="pulse-strip">
                <div className="pulse-intro"><span className="signal-dot" /> <strong>Today’s pulse</strong><span className="pulse-divider" /> <span>Mostly clear with a chance of brave.</span></div>
                <div className="pulse-metrics">
                  <span><b>3</b> priorities</span><span><b>1</b> ritual due</span><span><b>{completedTasks}/4</b> tended</span>
                </div>
              </section>

              <div className="dashboard-grid">
                <section className="panel tasks-panel">
                  <div className="panel-heading">
                    <div><h2>On your plate</h2><p>Keep it close. Keep it kind.</p></div>
                    <button className="text-button" onClick={() => setNotice('A new task can be added from your Quests room.')}>View all <span>→</span></button>
                  </div>
                  <div className="task-list">
                    {tasks.map((task, index) => (
                      <button className={`task-row ${task.done ? 'complete' : ''}`} key={task.label} onClick={() => toggleTask(index)}>
                        <span className="task-check">{task.done ? '✓' : ''}</span>
                        <span className="task-content"><strong>{task.label}</strong><small>{task.meta}</small></span>
                        <span className="task-arrow">›</span>
                      </button>
                    ))}
                  </div>
                  <button className="add-task" onClick={() => setNotice('A new task can be added from your Quests room.')}> <span>＋</span> Add a little something</button>
                </section>

                <section className="panel familiar-panel">
                  <div className="familiar-top"><span className="familiar-label"><span>✦</span> Your familiar · Juniper</span><span className="online-dot">● here</span></div>
                  <div className="familiar-message"><div className="familiar-avatar" aria-hidden="true"><div className="ear left" /><div className="ear right" /><span>☾</span></div><div><h2>A gentle nudge</h2><p>“You’ve got a lot of open loops, love. What if the project follow-up is the one thread you pull before lunch?”</p><button className="link-button" onClick={() => setNotice('That thread has been marked as your next brave thing.')}>Make it my next brave thing <span>→</span></button></div></div>
                  <CrowIllustration />
                  <div className="familiar-footer"><span>Based on your energy + priorities</span><button aria-label="Get another nudge" onClick={() => setNotice('Juniper is shuffling the leaves...')}>↻</button></div>
                </section>

                <section className="panel checkin-panel">
                  <div className="panel-heading"><div><h2>How are you arriving?</h2><p>No wrong answers here.</p></div><span className="checkin-sun">☼</span></div>
                  <div className="mood-options">
                    {[['low', '☁', 'Low'], ['tender', '◒', 'Tender'], ['steady', '◑', 'Steady'], ['bright', '☀', 'Bright']].map(([value, icon, label]) => (
                      <button className={`mood-option ${mood === value ? 'selected' : ''}`} key={value} onClick={() => chooseMood(value)}><span>{icon}</span><small>{label}</small></button>
                    ))}
                  </div>
                  <div className="energy-line"><span>Energy</span><div className="energy-track"><i /></div><b>7<span>/10</span></b></div>
                </section>

                <section className="panel progress-panel">
                  <div className="panel-heading"><div><h2>Week in the making</h2><p>Your rhythm, not a report card.</p></div><button className="more-button" aria-label="More weekly stats">•••</button></div>
                  <div className="week-chart">
                    <div className="chart-bars"><span style={{height: '32%'}} /><span style={{height: '47%'}} /><span style={{height: '41%'}} /><span className="today-bar" style={{height: '72%'}} /><span style={{height: '56%'}} /><span style={{height: '23%'}} /><span style={{height: '12%'}} /></div>
                    <div className="chart-days"><span>M</span><span>T</span><span>W</span><span className="today-label">T</span><span>F</span><span>S</span><span>S</span></div>
                  </div>
                  <div className="progress-stat"><strong>68%</strong><span>of your rituals tended this week</span><em>↑ 12%</em></div>
                </section>

                <section className="panel realms-panel">
                  <div className="panel-heading"><div><h2>Your realms</h2><p>A little care, everywhere.</p></div><button className="text-button" onClick={() => setActivePage('realms')}>Open map <span>→</span></button></div>
                  <div className="realm-list">
                    <Realm icon="⌂" name="Home" value="4 of 6" color="moss" width="66%" />
                    <Realm icon="✧" name="Self" value="2 of 4" color="amber" width="50%" />
                    <Realm icon="◌" name="Work" value="3 of 5" color="plum" width="60%" />
                  </div>
                </section>
              </div>
            </>
          )}
          {notice && <div className="toast" role="status"><span>✦</span>{notice}</div>}
        </div>
      </main>
    </div>
  )
}

function Realm({ icon, name, value, color, width }: { icon: string; name: string; value: string; color: string; width: string }) {
  return <div className="realm-row"><span className={`realm-icon ${color}`}>{icon}</span><strong>{name}</strong><div className="realm-track"><i className={color} style={{width}} /></div><small>{value}</small></div>
}

function CrowIllustration() {
  return <svg className="crow-art" viewBox="0 0 180 100" role="img" aria-label="A crow perched beneath a moon">
    <circle cx="143" cy="25" r="18" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="149" cy="20" r="16" fill="var(--ink-plum)" />
    <path d="M35 79c28-9 42-4 59 1 20 6 38 4 57-9M56 76c-4-22 4-39 22-42 15-3 27 8 28 21 1 15-9 24-28 25-8 1-16-1-22-4Z" fill="currentColor" opacity=".95" />
    <path d="M78 40c5-9 15-14 25-9l12 8-10 3-8-2m-18 1 11-12 1 16M65 51l-17-8 10 14m65 12-10 16m-2-17 15 12m-37-9 4 16" fill="none" stroke="var(--hot-pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="98" cy="45" r="2" fill="var(--hot-pink)" />
    <path d="M18 89h146" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M27 88c7-17 11-19 16-25m-5 24c4-14 7-19 12-24" fill="none" stroke="currentColor" strokeWidth="1.3" />
  </svg>
}

function NavIcon({ name }: { name: IconName }) {
  const icons: Record<IconName, string> = { today: '⌂', rituals: '◒', quests: '✧', realms: '◎', journal: '✎' }
  return <span className="nav-icon">{icons[name]}</span>
}

export default App
