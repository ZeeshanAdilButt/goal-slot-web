import nextVitals from 'eslint-config-next/core-web-vitals'
import eslintConfigPrettier from 'eslint-config-prettier'
import tailwindcss from 'eslint-plugin-tailwindcss'
import { defineConfig, globalIgnores } from 'eslint/config'

const customIgnores = globalIgnores([
  '.next/**',
  'out/**',
  'build/**',
  'dist/**',
  'coverage/**',
  'node_modules/**',
  '*.log',
])

export default defineConfig([
  ...nextVitals,
  customIgnores,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      tailwindcss,
    },
    rules: {
      'tailwindcss/classnames-order': 'error',
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  eslintConfigPrettier,
])
