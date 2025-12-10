#!/usr/bin/env bash
set -e

echo "==> Installing ESLint + Next.js ESLint config (flat)"

# ESLint core + Next.js config + Prettier bridge + Tailwind linting
npm install -D eslint eslint-config-next eslint-config-prettier \
  eslint-plugin-tailwindcss

echo "==> Creating eslint.config.mjs (flat)"

cat > eslint.config.mjs << 'EOF'
import nextPlugin from '@next/eslint-plugin-next'
import eslintConfigPrettier from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tailwindcss from 'eslint-plugin-tailwindcss'

export default [
  {
    // Mirrors previous .eslintignore entries
    ignores: ['.next', 'node_modules', 'dist', 'build', 'coverage', '*.log'],
  },
  ...nextPlugin.configs['core-web-vitals'],
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      tailwindcss,
    },
    rules: {
      'tailwindcss/classnames-order': 'error',
    },
  },
  eslintConfigPrettier,
]
EOF

echo "==> Installing Prettier + Tailwind & import-sort plugins"

npm install -D prettier prettier-plugin-tailwindcss @ianvs/prettier-plugin-sort-imports

echo "==> Creating .prettierrc"

cat > .prettierrc << 'EOF'
{
  "singleQuote": true,
  "semi": false,
  "trailingComma": "all",
  "printWidth": 120,
  "tabWidth": 2,
  "plugins": [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss"
  ],
  "importOrder": [
    "^react$",
    "^next(/.*)?$",
    "<THIRD_PARTY_MODULES>",
    "^@/(.*)$",
    "^[./]"
  ],
  "importOrderParserPlugins": ["typescript", "jsx"],
  "importOrderTypeScriptVersion": "5.3.3"
}
EOF

echo "==> Creating .prettierignore"

cat > .prettierignore << 'EOF'
.next
node_modules
dist
build
coverage
*.log
EOF

echo "==> Wiring npm scripts"

npm pkg set scripts.lint="next lint"
npm pkg set scripts["lint:fix"]="next lint --fix"
npm pkg set scripts.format="prettier . --write"
npm pkg set scripts["format:check"]="prettier . --check"

echo "==> Done. Try: npm run lint && npm run format:check"