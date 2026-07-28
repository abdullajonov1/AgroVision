import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { SupportChat } from './components/SupportChat'
import { HomePage } from './pages/HomePage'
import { MapAiPage } from './pages/MapAiPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { DataInputPage } from './pages/DataInputPage'
import { DronePage } from './pages/DronePage'
import { ReportsPage } from './pages/ReportsPage'
import { UsersPage } from './pages/UsersPage'
import { SettingsPage } from './pages/SettingsPage'
import { LoginPage } from './pages/LoginPage'
import { useAuth } from './context/AuthContext'
import type { NavId } from './data'
import './App.css'

function headerKeys(nav: NavId): { title: string; subtitle: string } {
  if (nav === 'home') {
    return { title: 'header.title', subtitle: 'header.subtitle' }
  }
  return {
    title: `header.title.${nav}`,
    subtitle: `header.subtitle.${nav}`,
  }
}

export default function App() {
  const { isAuthenticated } = useAuth()
  const [activeNav, setActiveNav] = useState<NavId>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024) setSidebarOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  if (!isAuthenticated) {
    return <LoginPage />
  }

  const { title, subtitle } = headerKeys(activeNav)

  const navigate = (id: NavId) => {
    setActiveNav(id)
    setSidebarOpen(false)
  }

  const toggleSidebar = () => setSidebarOpen((v) => !v)
  const closeSidebar = () => setSidebarOpen(false)

  let content: ReactNode
  switch (activeNav) {
    case 'map':
      content = <MapAiPage />
      break
    case 'analytics':
      content = <AnalyticsPage />
      break
    case 'input':
      content = <DataInputPage />
      break
    case 'drone':
      content = <DronePage />
      break
    case 'reports':
      content = <ReportsPage />
      break
    case 'users':
      content = <UsersPage />
      break
    case 'settings':
      content = <SettingsPage />
      break
    default:
      content = <HomePage />
  }

  return (
    <div className={`app${sidebarOpen ? ' is-sidebar-open' : ''}`}>
      <div
        className="app__backdrop"
        aria-hidden={!sidebarOpen}
        onClick={closeSidebar}
      />
      <Sidebar
        activeId={activeNav}
        onNavigate={navigate}
        open={sidebarOpen}
        onClose={closeSidebar}
        onOpenSupport={() => {
          setSupportOpen(true)
          setSidebarOpen(false)
        }}
      />
      <main className="app__main">
        <Header
          titleKey={title}
          subtitleKey={subtitle}
          onMenuClick={toggleSidebar}
          onOpenSettings={() => navigate('settings')}
        />
        <div className="app__content">{content}</div>
      </main>
      <SupportChat open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}
