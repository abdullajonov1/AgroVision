import { useEffect, useRef, useState } from 'react'
import {
  Languages,
  Palette,
  Bell,
  Sun,
  Moon,
  LogOut,
  Save,
  Mail,
  Smartphone,
  UserRound,
  Pencil,
  X,
  Camera,
  Trash2,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { localeLabels, type Locale } from '../i18n/translations'
import { useTheme } from '../theme/ThemeContext'
import { compressImageFile, useAuth } from '../context/AuthContext'
import './pages.css'
import './SettingsPage.css'

const locales: Locale[] = ['uz_latn', 'uz_cyrl', 'ru']

export function SettingsPage() {
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const { profile, updateProfile, logout } = useAuth()
  const [notifPush, setNotifPush] = useState(true)
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifAlerts, setNotifAlerts] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    login: profile.login,
  })
  const [avatarError, setAvatarError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) return
    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      login: profile.login,
    })
  }, [profile, editing])

  const startEdit = () => {
    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      login: profile.login,
    })
    setErrors({})
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setErrors({})
    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      login: profile.login,
    })
  }

  const saveProfile = () => {
    const nextErrors: { name?: string; email?: string } = {}
    const name = form.name.trim()
    const email = form.email.trim()
    if (!name) nextErrors.name = t('settings.profile.required')
    if (!email) nextErrors.email = t('settings.profile.required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = t('settings.profile.emailInvalid')
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    updateProfile({
      name,
      email,
      phone: form.phone.trim(),
      login: form.login.trim() || profile.login,
    })
    setEditing(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const onPickAvatar = async (file: File | undefined) => {
    if (!file) return
    setAvatarError('')
    try {
      if (file.size > 8 * 1024 * 1024) {
        setAvatarError(t('settings.profile.avatarTooLarge'))
        return
      }
      const dataUrl = await compressImageFile(file)
      updateProfile({ avatar: dataUrl })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2200)
    } catch {
      setAvatarError(t('settings.profile.avatarInvalid'))
    }
  }

  const removeAvatar = () => {
    updateProfile({ avatar: null })
    setAvatarError('')
  }

  const savePrefs = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const initial = profile.name.trim().charAt(0).toUpperCase() || 'A'

  return (
    <div className="settings page">
      {saved ? <div className="settings__toast">{t('settings.saved')}</div> : null}

      <section className="settings-card settings-card--profile">
        <header className="settings-card__head">
          <div className="settings-card__title">
            <UserRound size={16} />
            <div>
              <h2>{t('settings.profile')}</h2>
              <p>{t('settings.profileHint')}</p>
            </div>
          </div>
          <div className="settings-card__actions">
            {!editing ? (
              <button type="button" className="btn btn--ghost" onClick={startEdit}>
                <Pencil size={15} />
                {t('settings.profile.edit')}
              </button>
            ) : null}
            <button type="button" className="btn btn--ghost settings-card__logout" onClick={logout}>
              <LogOut size={15} />
              {t('header.logout')}
            </button>
          </div>
        </header>

        <div className="settings-card__profile-top">
          <div className="settings-card__avatar-wrap">
            <div className="settings-card__avatar" aria-hidden>
              {profile.avatar ? <img src={profile.avatar} alt="" /> : initial}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="settings-card__file"
              onChange={(e) => {
                void onPickAvatar(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <button
              type="button"
              className="settings-card__avatar-btn"
              onClick={() => fileRef.current?.click()}
              title={t('settings.profile.avatarChange')}
              aria-label={t('settings.profile.avatarChange')}
            >
              <Camera size={14} />
            </button>
          </div>
          <div className="settings-card__who">
            <strong>{profile.name}</strong>
            <span>
              {profile.login}
              <i className="settings-card__dot" />
              {t('settings.role.admin')}
            </span>
            {avatarError ? <em className="field-error">{avatarError}</em> : null}
            {profile.avatar ? (
              <button
                type="button"
                className="settings-card__avatar-clear"
                onClick={removeAvatar}
              >
                <Trash2 size={13} />
                {t('settings.profile.avatarRemove')}
              </button>
            ) : null}
          </div>
        </div>

        {editing ? (
          <div className="settings-profile-form">
            <div className="field">
              <label htmlFor="profile-name">{t('settings.profile.name')}</label>
              <input
                id="profile-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
              {errors.name ? <em className="field-error">{errors.name}</em> : null}
            </div>
            <div className="field">
              <label htmlFor="profile-login">{t('settings.profile.login')}</label>
              <input
                id="profile-login"
                value={form.login}
                onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="profile-email">{t('settings.profile.email')}</label>
              <input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {errors.email ? <em className="field-error">{errors.email}</em> : null}
            </div>
            <div className="field">
              <label htmlFor="profile-phone">{t('settings.profile.phone')}</label>
              <input
                id="profile-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="settings-profile-form__actions">
              <button type="button" className="btn btn--ghost" onClick={cancelEdit}>
                <X size={15} />
                {t('settings.profile.cancel')}
              </button>
              <button type="button" className="btn btn--primary" onClick={saveProfile}>
                <Save size={15} />
                {t('settings.profile.save')}
              </button>
            </div>
          </div>
        ) : (
          <dl className="settings-profile-view">
            <div>
              <dt>{t('settings.profile.name')}</dt>
              <dd>{profile.name}</dd>
            </div>
            <div>
              <dt>{t('settings.profile.login')}</dt>
              <dd>{profile.login}</dd>
            </div>
            <div>
              <dt>{t('settings.profile.email')}</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>{t('settings.profile.phone')}</dt>
              <dd>{profile.phone || '—'}</dd>
            </div>
            <div>
              <dt>{t('settings.profile.role')}</dt>
              <dd>{t('settings.role.admin')}</dd>
            </div>
          </dl>
        )}
      </section>

      <div className="settings-panel">
        <div className="settings-panel__body">
          <section className="settings-section">
            <div className="settings-section__label">
              <Languages size={16} />
              <div>
                <h3>{t('settings.lang')}</h3>
                <p>{t('settings.langHint')}</p>
              </div>
            </div>
            <div className="settings-chips" role="group" aria-label={t('settings.lang')}>
              {locales.map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`settings-chip${locale === l ? ' is-active' : ''}`}
                  onClick={() => setLocale(l)}
                >
                  {localeLabels[l]}
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section__label">
              <Palette size={16} />
              <div>
                <h3>{t('settings.theme')}</h3>
                <p>{t('settings.themeHint')}</p>
              </div>
            </div>
            <div className="settings-theme">
              <button
                type="button"
                className={`settings-theme__option${theme === 'light' ? ' is-active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <span className="settings-theme__preview is-light" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <span className="settings-theme__label">
                  <Sun size={14} />
                  {t('header.theme.light')}
                </span>
              </button>
              <button
                type="button"
                className={`settings-theme__option${theme === 'dark' ? ' is-active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <span className="settings-theme__preview is-dark" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <span className="settings-theme__label">
                  <Moon size={14} />
                  {t('header.theme.dark')}
                </span>
              </button>
            </div>
          </section>

          <section className="settings-section settings-section--last">
            <div className="settings-section__label">
              <Bell size={16} />
              <div>
                <h3>{t('settings.notif')}</h3>
                <p>{t('settings.notifHint')}</p>
              </div>
            </div>
            <div className="settings-toggles">
              <label className="settings-toggle">
                <div className="settings-toggle__text">
                  <Smartphone size={15} />
                  <div>
                    <strong>{t('settings.notif.push')}</strong>
                    <span>{t('settings.notif.pushHint')}</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPush}
                  onChange={(e) => setNotifPush(e.target.checked)}
                />
                <i aria-hidden />
              </label>
              <label className="settings-toggle">
                <div className="settings-toggle__text">
                  <Mail size={15} />
                  <div>
                    <strong>{t('settings.notif.email')}</strong>
                    <span>{t('settings.notif.emailHint')}</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.checked)}
                />
                <i aria-hidden />
              </label>
              <label className="settings-toggle">
                <div className="settings-toggle__text">
                  <Bell size={15} />
                  <div>
                    <strong>{t('settings.notif.alerts')}</strong>
                    <span>{t('settings.notif.alertsHint')}</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifAlerts}
                  onChange={(e) => setNotifAlerts(e.target.checked)}
                />
                <i aria-hidden />
              </label>
            </div>
          </section>
        </div>

        <footer className="settings-panel__footer">
          <button type="button" className="btn btn--primary" onClick={savePrefs}>
            <Save size={15} />
            {t('input.submit')}
          </button>
        </footer>
      </div>
    </div>
  )
}
