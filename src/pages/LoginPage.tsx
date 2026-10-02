import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import './LoginPage.css'

export function LoginPage() {
  const { t } = useI18n()
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'login') {
      setError(login(username, password) ? '' : 'auth')
      return
    }
    if (password !== password2) {
      setError('password2')
      return
    }
    const code = register({ name, phone, login: username, password })
    if (code) {
      setError(code)
      return
    }
    setError(login(username, password) ? '' : 'auth')
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

        <h2>{mode === 'login' ? t('login.title') : t('login.register')}</h2>

        {mode === 'register' ? (
          <>
            <label className="login__field">
              <span>{t('login.name')}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label className="login__field">
              <span>{t('login.phone')}</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
              />
            </label>
          </>
        ) : null}

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
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {mode === 'register' ? (
          <label className="login__field">
            <span>{t('login.password2')}</span>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        ) : null}

        {error ? <div className="login__error">{t(`login.err.${error}`)}</div> : null}

        <button type="submit" className="login__submit">
          {mode === 'login' ? t('login.submit') : t('login.regSubmit')}
        </button>

        <button
          type="button"
          className="login__switch"
          onClick={() => {
            setMode((v) => (v === 'login' ? 'register' : 'login'))
            setError('')
            setPassword('')
            setPassword2('')
            if (mode === 'login') setUsername('')
            else setUsername('admin')
          }}
        >
          {mode === 'login' ? t('login.noAccount') : t('login.haveAccount')}
        </button>

        {mode === 'login' ? <p className="login__hint">{t('login.hint')}</p> : null}
      </form>
    </div>
  )
}
