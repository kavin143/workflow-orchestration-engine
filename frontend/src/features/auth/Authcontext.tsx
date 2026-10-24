import { useCallback } from 'react';

export function useAuth() {
  const login = useCallback((token: string) => {
    localStorage.setItem('accessToken', token);
  }, []);

  return { login };
}