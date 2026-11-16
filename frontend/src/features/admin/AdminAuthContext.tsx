
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAdminAccessToken,
  getAdminAccessToken,
  saveAdminAccessToken,
} from './adminTokenStorage'
import { SESSION_EXPIRED_EVENT } from '../../services/api/apiClient'

type AdminAuthContextValue = {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAdminAccessToken())

  function login(accessToken: string) {
    saveAdminAccessToken(accessToken)
    setToken(accessToken)
  }

  function logout() {
    clearAdminAccessToken()
    setToken(null)
  }

  useEffect(() => {
    function onExpired(event: Event) {
      if ((event as CustomEvent<{ scope: string }>).detail?.scope === 'admin') {
        clearAdminAccessToken()
        setToken(null)
      }
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token],
  )

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)

  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  }

  return context
}
