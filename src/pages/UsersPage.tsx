import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { usersMock } from '../data'
import './pages.css'
import './TablePages.css'

type UserRole = 'admin' | 'editor' | 'user'

type UserRow = {
  id: string
  name: string
  login: string
  role: UserRole
  active: boolean
}

const emptyForm = {
  name: '',
  login: '',
  role: 'user' as UserRole,
  active: true,
}

export function UsersPage() {
  const { t } = useI18n()
  const [users, setUsers] = useState<UserRow[]>(() => [...usersMock])
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<{ name?: string; login?: string }>({})

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (role !== 'all' && u.role !== role) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.login.toLowerCase().includes(q) ||
        t(`users.role.${u.role}`).toLowerCase().includes(q)
      )
    })
  }, [users, query, role, t])

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.active).length
    const admins = users.filter((u) => u.role === 'admin').length
    return { total, active, inactive: total - active, admins }
  }, [users])

  const openModal = () => {
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setErrors({})
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: { name?: string; login?: string } = {}
    const name = form.name.trim()
    const login = form.login.trim().toLowerCase()
    if (!name) nextErrors.name = t('users.form.required')
    if (!login) nextErrors.login = t('users.form.required')
    else if (users.some((u) => u.login.toLowerCase() === login)) {
      nextErrors.login = t('users.form.loginExists')
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setUsers((prev) => [
      ...prev,
      {
        id: `u${Date.now()}`,
        name,
        login,
        role: form.role,
        active: form.active,
      },
    ])
    closeModal()
  }

  return (
    <div className="table-page page">
      <div className="table-page__stats">
        <article className="table-stat">
          <div className="table-stat__icon">
            <Users size={18} />
          </div>
          <div>
            <span>{t('users.stat.total')}</span>
            <strong>{stats.total}</strong>
          </div>
        </article>
        <article className="table-stat">
          <div className="table-stat__icon is-ok">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span>{t('users.active')}</span>
            <strong>{stats.active}</strong>
          </div>
        </article>
        <article className="table-stat">
          <div className="table-stat__icon is-warn">
            <XCircle size={18} />
          </div>
          <div>
            <span>{t('users.inactive')}</span>
            <strong>{stats.inactive}</strong>
          </div>
        </article>
        <article className="table-stat">
          <div className="table-stat__icon is-admin">
            <Shield size={18} />
          </div>
          <div>
            <span>{t('users.role.admin')}</span>
            <strong>{stats.admins}</strong>
          </div>
        </article>
      </div>

      <section className="table-panel">
        <header className="table-panel__head">
          <div>
            <h2>{t('users.title')}</h2>
            <p>{t('users.hint')}</p>
          </div>
          <button type="button" className="btn btn--primary" onClick={openModal}>
            <UserPlus size={15} />
            {t('users.add')}
          </button>
        </header>

        <div className="table-panel__toolbar">
          <div className="table-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('users.search')}
            />
          </div>
          <label className="table-filter">
            <span>{t('users.col.role')}</span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="all">{t('users.filter.all')}</option>
              <option value="admin">{t('users.role.admin')}</option>
              <option value="editor">{t('users.role.editor')}</option>
              <option value="user">{t('users.role.user')}</option>
            </select>
          </label>
        </div>

        <div className="table-panel__scroll">
          <table className="rich-table">
            <thead>
              <tr>
                <th>{t('users.col.name')}</th>
                <th>{t('users.col.login')}</th>
                <th>{t('users.col.role')}</th>
                <th>{t('users.col.status')}</th>
                <th aria-label={t('users.col.actions')} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td className="mono">{u.login}</td>
                  <td>
                    <span className={`role-badge role-badge--${u.role}`}>
                      {t(`users.role.${u.role}`)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge${u.active ? ' is-on' : ' is-off'}`}>
                      <i />
                      {u.active ? t('users.active') : t('users.inactive')}
                    </span>
                  </td>
                  <td className="rich-table__actions">
                    <button type="button" className="icon-btn" aria-label={t('users.col.actions')}>
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={5} className="rich-table__empty">
                    {t('users.empty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen ? (
        <div className="av-modal" role="presentation" onClick={closeModal}>
          <div
            className="av-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="users-add-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="av-modal__head">
              <div>
                <h3 id="users-add-title">{t('users.modal.title')}</h3>
                <p>{t('users.modal.hint')}</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={closeModal}
                aria-label={t('users.cancel')}
              >
                <X size={18} />
              </button>
            </header>

            <form className="av-modal__body" onSubmit={submit}>
              <div className="field">
                <label htmlFor="users-name">{t('users.col.name')}</label>
                <input
                  id="users-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
                {errors.name ? <em className="field-error">{errors.name}</em> : null}
              </div>

              <div className="field">
                <label htmlFor="users-login">{t('users.col.login')}</label>
                <input
                  id="users-login"
                  value={form.login}
                  onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
                  autoComplete="off"
                />
                {errors.login ? <em className="field-error">{errors.login}</em> : null}
              </div>

              <div className="field">
                <label htmlFor="users-role">{t('users.col.role')}</label>
                <select
                  id="users-role"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value as UserRole }))
                  }
                >
                  <option value="admin">{t('users.role.admin')}</option>
                  <option value="editor">{t('users.role.editor')}</option>
                  <option value="user">{t('users.role.user')}</option>
                </select>
              </div>

              <label className="av-check">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                <span>{t('users.active')}</span>
              </label>

              <div className="av-modal__actions">
                <button type="button" className="btn btn--ghost" onClick={closeModal}>
                  {t('users.cancel')}
                </button>
                <button type="submit" className="btn btn--primary">
                  <UserPlus size={15} />
                  {t('users.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
