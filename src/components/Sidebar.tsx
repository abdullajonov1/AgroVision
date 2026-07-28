import {
  Home,
  Map,
  BarChart3,
  Plane,
  FileText,
  Users,
  Settings,
  Headphones,
  ClipboardList,
  X,
} from 'lucide-react'
import { navItems, type NavId } from '../data'
import { useI18n } from '../i18n/I18nContext'
import './Sidebar.css'

const icons = {
  home: Home,
  map: Map,
  analytics: BarChart3,
  input: ClipboardList,
  drone: Plane,
  reports: FileText,
  users: Users,
  settings: Settings,
} as const

export type SidebarProps = {
  activeId: string
  onNavigate: (id: NavId) => void
  open?: boolean
  onClose?: () => void
  onOpenSupport?: () => void
}

export function Sidebar({
  activeId,
  onNavigate,
  open = false,
  onClose,
  onOpenSupport,
}: SidebarProps) {
  const { t } = useI18n()

  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`}>
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden>
          <svg viewBox="0 0 32 32" fill="none">
            <path
              d="M16 4c0 8-6 12-6 18a6 6 0 0012 0c0-6-6-10-6-18z"
              fill="#2fbf5b"
            />
            <path
              d="M16 10c2 4 5 7 5 11a5 5 0 01-10 0c0-4 3-7 5-11z"
              fill="#1a8f42"
              opacity="0.55"
            />
            <path d="M16 14v12" stroke="#0a1f14" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="sidebar__brand-text">
          <div className="sidebar__title">AgroVision</div>
          <div className="sidebar__subtitle">{t('brand.subtitle')}</div>
        </div>
        {onClose ? (
          <button
            type="button"
            className="sidebar__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <nav className="sidebar__nav" aria-label="nav">
        {navItems.map((item) => {
          const Icon = icons[item.icon]
          const active = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar__link${active ? ' is-active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={t(item.labelKey)}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{t(item.labelKey)}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar__support">
        <div className="sidebar__support-icon">
          <Headphones size={20} />
        </div>
        <div className="sidebar__support-text">
          <strong>{t('support.title')}</strong>
          <span>{t('support.subtitle')}</span>
        </div>
        <button type="button" className="sidebar__support-btn" onClick={onOpenSupport}>
          {t('support.cta')}
        </button>
      </div>
    </aside>
  )
}
