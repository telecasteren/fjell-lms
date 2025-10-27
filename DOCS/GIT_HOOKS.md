# Git Hooks & Code Quality Setup

This project uses **Husky** and **lint-staged** to ensure code quality and consistency before commits.

## 🛠️ What's Installed

### **Husky**

- Git hooks management
- Pre-commit hooks for code quality
- Commit message validation (optional)

### **lint-staged**

- Runs linters only on staged files
- Improves performance by avoiding full project linting
- Automatically fixes issues when possible

### **Prettier**

- Code formatting
- Consistent code style across the project
- Tailwind CSS class sorting

## 📋 Pre-commit Hook Configuration

The pre-commit hook runs the following checks:

### **Code Quality Checks** (Always runs)

1. **lint-staged** - ESLint + Prettier on staged files
   - **TypeScript/JavaScript Files** (`*.{js,jsx,ts,tsx}`): ESLint + Prettier
   - **Other Files** (`*.{json,md,css,scss}`): Prettier only

### **Test Checks** (Optional - can be skipped)

1. **Unit Tests** - Vitest test suite
2. **E2E Tests** - Playwright end-to-end tests

### **Skipping Tests**

If tests are failing and you need to commit urgently:

```bash
SKIP_TESTS=1 git commit -m "feat: add feature"
```

## 🚀 Available Scripts

```bash
# Linting
npm run lint              # Check for linting errors
npm run lint:fix          # Fix linting errors automatically

# Formatting
npm run format            # Format all files with Prettier
npm run format:check      # Check if files are formatted correctly

# Testing
npm run test              # Run unit tests (Vitest)
npm run test:ui           # Run unit tests with UI
npm run test:e2e          # Run E2E tests (Playwright)
npm run test:e2e:ui       # Run E2E tests with UI

# Git hooks (automatic)
# Pre-commit hook runs automatically on `git commit`
```

## ⚙️ Configuration Files

### **`.prettierrc`**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### **`.prettierignore`**

Excludes generated files, dependencies, and build outputs from formatting.

### **`.husky/pre-commit`**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### **`package.json` - lint-staged config**

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,scss}": ["prettier --write"]
  }
}
```

## 🔄 How It Works

### **Normal Commit Flow**

1. **Developer commits code**: `git commit -m "feat: add new feature"`
2. **Husky triggers pre-commit hook**: Automatically runs before commit
3. **lint-staged processes staged files**: Only checks files being committed
4. **ESLint fixes issues**: Automatically fixes linting errors when possible
5. **Prettier formats code**: Ensures consistent code style
6. **Unit tests run**: Vitest test suite executes
7. **E2E tests run**: Playwright tests execute
8. **Commit proceeds**: If all checks pass, commit is successful
9. **Commit fails**: If any check fails, commit is blocked

### **Skip Tests Flow**

1. **Developer commits with skip flag**: `SKIP_TESTS=1 git commit -m "feat: add feature"`
2. **Husky triggers pre-commit hook**: Automatically runs before commit
3. **lint-staged processes staged files**: Only checks files being committed
4. **ESLint fixes issues**: Automatically fixes linting errors when possible
5. **Prettier formats code**: Ensures consistent code style
6. **Tests skipped**: Unit and E2E tests are bypassed
7. **Commit proceeds**: If linting/formatting passes, commit is successful

## 🚫 What Happens When Checks Fail

- **ESLint errors**: Commit is blocked, developer must fix manually
- **Prettier formatting**: Usually auto-fixed, but commit may be blocked if manual intervention needed
- **TypeScript errors**: Commit is blocked, developer must fix type issues
- **Unit test failures**: Commit is blocked, developer must fix tests or use `SKIP_TESTS=1`
- **E2E test failures**: Commit is blocked, developer must fix tests or use `SKIP_TESTS=1`

## 🛠️ Manual Usage

### **Format specific files**

```bash
npx prettier --write src/components/MyComponent.tsx
```

### **Lint specific files**

```bash
npx eslint src/components/MyComponent.tsx --fix
```

### **Check all files**

```bash
npm run lint
npm run format:check
```

### **Fix all files**

```bash
npm run lint:fix
npm run format
```

## 🔧 Customization

### **Adding new file types to lint-staged**

Edit `package.json`:

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,scss}": ["prettier --write"],
    "*.{py}": ["black", "flake8"] // Example: Python files
  }
}
```

### **Modifying Prettier rules**

Edit `.prettierrc`:

```json
{
  "printWidth": 100, // Change line length
  "singleQuote": true // Use single quotes
}
```

### **Adding commit message validation**

Install commitlint:

```bash
npm install --save-dev @commitlint/config-conventional @commitlint/cli
```

Then uncomment the line in `.husky/commit-msg`:

```bash
npx --no -- commitlint --edit $1
```

## 🎯 Benefits

1. **Consistent Code Style**: All team members follow the same formatting rules
2. **Early Error Detection**: Catch issues before they reach the repository
3. **Automatic Fixes**: Many issues are resolved automatically
4. **Performance**: Only processes changed files, not the entire project
5. **Team Collaboration**: Reduces code review time spent on formatting issues

## 🚨 Troubleshooting

### **Hook not running**

```bash
# Reinstall hooks
npx husky install
```

### **Permission denied**

```bash
# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### **Prettier conflicts with ESLint**

Ensure ESLint and Prettier configurations are compatible. The project uses `eslint-config-next` which includes Prettier integration.

### **Skip hooks temporarily**

```bash
# Skip pre-commit hook (not recommended)
git commit --no-verify -m "feat: add feature"
```

## 📚 Additional Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [ESLint Documentation](https://eslint.org/docs/)
