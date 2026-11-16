import { apiRequest } from './apiClient'
import { getAdminAccessToken } from '../../features/admin/adminTokenStorage'

type ApiOptions = RequestInit

export async function adminApiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  return apiRequest<T>(path, {
    ...options,
    token: getAdminAccessToken(),
  })
}
