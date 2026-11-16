
const ADMIN_TOKEN_KEY = 'zaalima_admin_access_token'

export function getAdminAccessToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

export function saveAdminAccessToken(token: string): void {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminAccessToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}
