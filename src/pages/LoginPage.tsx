import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import './LoginPage.css'

export function LoginPage() {
  const { t } = useI18n()
  const { login } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const ok = login(username, password)
    setError(!ok)
  }

  return (
    <div className="login">
      <div className="login__glow" aria-hidden />
      <form className="login__card" onSubmit={onSubmit}>
        <div className="login__brand">
          <div className="login__logo" aria-hidden>
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
            </svg>
          </div>
          <div>
            <h1>AgroVision</h1>
            <p>{t('login.subtitle')}</p>
          </div>
        </div>

        <h2>{t('login.title')}</h2>

        <label className="login__field">
          <span>{t('login.username')}</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>

        <label className="login__field">
          <span>{t('login.password')}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <div className="login__error">{t('login.error')}</div>}

        <button type="submit" className="login__submit">
          {t('login.submit')}
        </button>

        <p className="login__hint">{t('login.hint')}</p>
      </form>
    </div>
  )
}
