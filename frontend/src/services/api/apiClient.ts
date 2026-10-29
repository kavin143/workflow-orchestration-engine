const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1/'

import { getAccessToken } from '../../features/auth/tokenStorage'

type ApiOptions = RequestInit & {
  token?: string | null
}

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options
  const accessToken = token === undefined ? getAccessToken() : token

  const url = `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`

  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', 'application/json')

  if (requestOptions.body && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  } else {
    requestHeaders.delete('Authorization')
  }

  const response = await fetch(url, {
    ...requestOptions,
    headers: requestHeaders,
  })

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'object' &&
      data.error !== null &&
      'message' in data.error &&
      typeof data.error.message === 'string'
        ? data.error.message
        : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return data as T
}