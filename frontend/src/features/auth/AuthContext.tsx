
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from './tokenStorage'
import { SESSION_EXPIRED_EVENT } from '../../services/api/apiClient'

type AuthContextValue = {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAccessToken())

  function login(accessToken: string) {
    saveAccessToken(accessToken)
    setToken(accessToken)
  }

  function logout() {
    clearAccessToken()
    setToken(null)
  }

  useEffect(() => {
    function onExpired(event: Event) {
      if ((event as CustomEvent<{ scope: string }>).detail?.scope === 'tenant') {
        clearAccessToken()
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
