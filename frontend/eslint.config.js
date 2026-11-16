import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Fetch-on-mount (call an async loader from an effect) is the pattern
      // used across the app; the loader only sets state after awaiting.
      'react-hooks/set-state-in-effect': 'off',
      // Contexts / small constant maps share files with their components.
      'react-refresh/only-export-components': 'off',
    },
  },
])
