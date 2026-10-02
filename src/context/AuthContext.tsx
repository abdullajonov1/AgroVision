import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const AUTH_KEY = 'agrovision-auth'
const PROFILE_KEY = 'agrovision-profile'
const ACCOUNTS_KEY = 'agrovision-accounts'

export type UserProfile = {
  name: string
  login: string
  email: string
  phone: string
  role: string
  avatar: string | null
}

export type RegisterInput = {
  name: string
  phone: string
  login: string
  password: string
}

type StoredAccount = {
  name: string
  phone: string
  login: string
  passwordHash: string
}

type AuthContextValue = {
  isAuthenticated: boolean
  profile: UserProfile
  login: (username: string, password: string) => boolean
  register: (input: RegisterInput) => string | null
  logout: () => void
  updateProfile: (patch: Partial<UserProfile>) => void
}

function hashPassword(password: string): string {
  let h = 2166136261
  const value = `agrovision:${password}`
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function readAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as StoredAccount[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

const defaultProfile: UserProfile = {
  name: 'Administrator',
  login: 'admin',
  email: 'admin@agrovision.uz',
  phone: '+998 90 123 45 67',
  role: 'admin',
  avatar: null,
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readAuth(): boolean {
  return sessionStorage.getItem(AUTH_KEY) === '1'
}

function readProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return defaultProfile
    return { ...defaultProfile, ...JSON.parse(raw) }
  } catch {
    return defaultProfile
  }
}

export function compressImageFile(file: File, size = 256, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('not-image'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('canvas'))
        return
      }
      const scale = Math.max(size / img.width, size / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = (size - w) / 2
      const y = (size - h) / 2
      ctx.drawImage(img, x, y, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('load'))
    }
    img.src = url
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState(readAuth)
  const [profile, setProfile] = useState<UserProfile>(readProfile)

  const login = useCallback((username: string, password: string) => {
    const name = username.trim()
    if (name === 'admin' && password === 'admin123') {
      sessionStorage.setItem(AUTH_KEY, '1')
      setAuth(true)
      setProfile((prev) => {
        if (prev.login === 'admin') return prev
        const next = { ...defaultProfile }
        localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
        return next
      })
      return true
    }
    const account = readAccounts().find(
      (item) => item.login === name && item.passwordHash === hashPassword(password),
    )
    if (!account) return false
    sessionStorage.setItem(AUTH_KEY, '1')
    setAuth(true)
    const next: UserProfile = {
      ...defaultProfile,
      name: account.name,
      login: account.login,
      phone: account.phone,
      email: '',
      role: 'user',
      avatar: null,
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
    setProfile(next)
    return true
  }, [])

  const register = useCallback((input: RegisterInput) => {
    const name = input.name.trim()
    const phone = input.phone.trim()
    const loginName = input.login.trim()
    if (name.length < 2) return 'name'
    if (phone.replace(/\D/g, '').length < 9) return 'phone'
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(loginName) || loginName === 'admin') return 'login'
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(input.password)) return 'password'
    const accounts = readAccounts()
    if (accounts.some((item) => item.login.toLowerCase() === loginName.toLowerCase())) {
      return 'taken'
    }
    accounts.push({
      name,
      phone,
      login: loginName,
      passwordHash: hashPassword(input.password),
    })
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
    return null
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY)
    setAuth(false)
  }, [])

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
      } catch {
        // Quota exceeded — keep avatar out of storage retry
        try {
          localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...next, avatar: null }))
        } catch {
          /* ignore */
        }
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, profile, login, register, logout, updateProfile }),
    [isAuthenticated, profile, login, register, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
