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

export type UserProfile = {
  name: string
  login: string
  email: string
  phone: string
  role: string
  avatar: string | null
}

type AuthContextValue = {
  isAuthenticated: boolean
  profile: UserProfile
  login: (username: string, password: string) => boolean
  logout: () => void
  updateProfile: (patch: Partial<UserProfile>) => void
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
    const ok = username.trim() === 'admin' && password === 'admin123'
    if (ok) {
      sessionStorage.setItem(AUTH_KEY, '1')
      setAuth(true)
    }
    return ok
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
    () => ({ isAuthenticated, profile, login, logout, updateProfile }),
    [isAuthenticated, profile, login, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
