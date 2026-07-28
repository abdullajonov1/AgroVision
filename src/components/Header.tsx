import { useEffect, useRef, useState } from 'react'
import {
  Search,
  Bell,
  Sun,
  Languages,
  Moon,
  CloudRain,
  AlertTriangle,
  FileText,
  Plane,
  X,
  Menu,
  LogOut,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { localeLabels, type Locale } from '../i18n/translations'
import { useTheme } from '../theme/ThemeContext'
import { useAuth } from '../context/AuthContext'
import './Header.css'

const locales: Locale[] = ['uz_latn', 'uz_cyrl', 'ru']

const notificationsSeed = [
  { id: 1, icon: 'alert' as const, unread: true },
  { id: 2, icon: 'drone' as const, unread: true },
  { id: 3, icon: 'ai' as const, unread: true },
  { id: 4, icon: 'report' as const, unread: false },
]

const notifIcon = {
  alert: AlertTriangle,
  drone: Plane,
  ai: CloudRain,
  report: FileText,
} as const

export type HeaderProps = {
  titleKey?: string
  subtitleKey?: string
  onMenuClick?: () => void
  onOpenSettings?: () => void
}

export function Header({
  titleKey = 'header.title',
  subtitleKey = 'header.subtitle',
  onMenuClick,
  onOpenSettings,
}: HeaderProps) {
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const { logout, profile } = useAuth()
  const [langOpen, setLangOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifShown, setNotifShown] = useState(false)
  const [notifMounted, setNotifMounted] = useState(false)
  const [items, setItems] = useState(() => [...notificationsSeed])
  const langRef = useRef<HTMLDivElement>(null)

  const unread = items.filter((n) => n.unread).length

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (notifOpen) {
      setNotifMounted(true)
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setNotifShown(true))
      })
      return () => cancelAnimationFrame(id)
    }
    setNotifShown(false)
    const timer = window.setTimeout(() => setNotifMounted(false), 280)
    return () => window.clearTimeout(timer)
  }, [notifOpen])

  useEffect(() => {
    if (!notifOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [notifOpen])

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const markRead = (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  }

  const closeNotif = () => setNotifOpen(false)

  return (
    <>
      <header className="header">
        <div className="header__titles">
          {onMenuClick ? (
            <button
              type="button"
              className="header__menu-btn"
              onClick={onMenuClick}
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          ) : null}
          <div className="header__titles-text">
            <h1>{t(titleKey)}</h1>
            <p>{t(subtitleKey)}</p>
          </div>
        </div>

        <div className="header__search">
          <Search size={15} className="header__search-icon" />
          <input type="search" placeholder={t('header.search')} aria-label={t('header.search')} />
        </div>

        <div className="header__actions">
          <div className="header__lang" ref={langRef}>
            <button
              type="button"
              className="header__icon-btn"
              onClick={() => setLangOpen((v) => !v)}
              aria-label={t('header.lang')}
              title={t('header.lang')}
            >
              <Languages size={18} />
            </button>
            {langOpen && (
              <ul className="header__menu">
                {locales.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      className={item === locale ? 'is-active' : ''}
                      onClick={() => {
                        setLocale(item)
                        setLangOpen(false)
                      }}
                    >
                      {localeLabels[item]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            className={`header__theme-switch${theme === 'dark' ? ' is-dark' : ''}`}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={t('header.theme')}
            title={theme === 'light' ? t('header.theme.dark') : t('header.theme.light')}
          >
            <Sun size={12} className="header__theme-sun" />
            <Moon size={12} className="header__theme-moon" />
            <span className="header__theme-knob" />
          </button>

          <button
            type="button"
            className="header__icon-btn header__bell"
            aria-label={t('header.notifications')}
            onClick={() => setNotifOpen(true)}
          >
            <Bell size={18} />
            {unread > 0 && <span className="header__badge">{unread}</span>}
          </button>

          <div className="header__weather">
            <Sun size={18} className="header__sun" />
            <div>
              <strong>28°C</strong>
              <span>{t('header.weather')}</span>
            </div>
          </div>

          <div className="header__user">
            <button
              type="button"
              className="header__profile"
              onClick={onOpenSettings}
              title={t('header.profile.open')}
            >
              <span className="header__avatar" aria-hidden>
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" />
                ) : (
                  profile.name.trim().charAt(0).toUpperCase() || 'A'
                )}
              </span>
              <div className="header__profile-text">
                <strong>{profile.name}</strong>
                <span>{t('header.role')}</span>
              </div>
            </button>

            <button
              type="button"
              className="header__icon-btn header__logout"
              onClick={logout}
              aria-label={t('header.logout')}
              title={t('header.logout')}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {notifMounted ? (
        <div className={`notif-root${notifShown ? ' is-open' : ''}`}>
          <button
            type="button"
            className="notif-backdrop"
            aria-label={t('header.notifications.close')}
            onClick={closeNotif}
          />
          <aside
            className="notif-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t('header.notifications')}
          >
            <div className="notif-panel__head">
              <div>
                <h2>{t('header.notifications')}</h2>
                <p>
                  {unread > 0
                    ? t('header.notifications.unreadCount').replace('{n}', String(unread))
                    : t('header.notifications.empty')}
                </p>
              </div>
              <div className="notif-panel__actions">
                {unread > 0 ? (
                  <button type="button" className="notif-panel__mark" onClick={markAllRead}>
                    {t('header.notifications.markAll')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="notif-panel__close"
                  onClick={closeNotif}
                  aria-label={t('header.notifications.close')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <ul className="notif-panel__list">
              {items.map((item) => {
                const Icon = notifIcon[item.icon]
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`notif-item${item.unread ? ' is-unread' : ''}`}
                      onClick={() => markRead(item.id)}
                    >
                      <div className={`notif-item__icon notif-item__icon--${item.icon}`}>
                        <Icon size={16} />
                      </div>
                      <div className="notif-item__body">
                        <div className="notif-item__row">
                          <strong>{t(`notif.${item.id}.title`)}</strong>
                          <time>{t(`notif.${item.id}.time`)}</time>
                        </div>
                        <p>{t(`notif.${item.id}.text`)}</p>
                      </div>
                      {item.unread ? <span className="notif-item__dot" aria-hidden /> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>
      ) : null}
    </>
  )
}
