# Git hooks and code quality

## Table of contents

- [What runs on commit](#what-runs-on-commit)
- [Commands](#commands)
- [Configuration](#configuration)
- [Skip hooks (emergency)](#skip-hooks-emergency)
- [Troubleshooting](#troubleshooting)

## What runs on commit

- **Husky** installs a **pre-commit** hook (see `.husky/pre-commit`).
- **lint-staged** (in `package.json`) runs on **staged files** only:
  - `*.{js,mjs,jsx,ts,tsx}` → ESLint fix + Prettier write
  - `*.{json,md,css,scss}` → Prettier write

This keeps commits small and fast. Run full `npm run lint` / `npm test` in CI or before pushing.

## Commands

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run lint`         | ESLint (whole project)       |
| `npm run lint:fix`     | ESLint with --fix            |
| `npm run format`       | Prettier write all           |
| `npm run format:check` | Prettier check (CI-friendly) |
| `npm test`             | Vitest                       |
| `npm run test:e2e`     | Playwright                   |

## Configuration

- **ESLint**: `eslint.config.mjs`
- **Prettier**: project Prettier config / plugins (e.g. Tailwind class sort)
- **lint-staged**: `package.json` → `lint-staged`

To change which files are linted on commit, edit `lint-staged` in `package.json`.

## Skip hooks (emergency)

```bash
git commit --no-verify -m "message"
```

Use sparingly; fix lint/tests right after.

## Troubleshooting

| Issue                     | Fix                                                                     |
| ------------------------- | ----------------------------------------------------------------------- |
| Hook not running          | `npx husky` or reinstall deps; ensure `.husky/pre-commit` is executable |
| Permission denied on hook | `chmod +x .husky/pre-commit`                                            |
| Format conflicts          | Run `npm run format` once, then commit                                  |

Docs: [Husky](https://typicode.github.io/husky/), [lint-staged](https://github.com/okonet/lint-staged).
