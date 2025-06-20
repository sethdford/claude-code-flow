# NPM Publishing & GitHub Integration Setup

This guide walks you through publishing your Claude Flow package to npm and setting up proper GitHub integration.

## 1. NPM Account Setup

### Create NPM Account
1. Go to [npmjs.com](https://www.npmjs.com)
2. Sign up for a free account
3. Verify your email address

### Generate Access Token
1. Log into npm and go to your profile
2. Click "Access Tokens" → "Generate New Token"
3. Choose "Automation" token type (for CI/CD)
4. Copy the token (starts with `npm_`)

## 2. GitHub Secrets Configuration

Add the npm token to your GitHub repository:

1. Go to your repository: `https://github.com/sethdford/vibex-claude-code-flow`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Your npm token (the one starting with `npm_`)
6. Click **Add secret**

## 3. Publishing Methods

### Method A: Automatic Publishing (Recommended)
The GitHub Actions workflow will automatically publish when you create a git tag:

```bash
# Bump version and create tag
npm version patch  # or minor, major
git push origin main --tags

# This triggers the workflow which will:
# 1. Run tests
# 2. Build the package
# 3. Publish to npm
# 4. Create GitHub release with binaries
```

### Method B: Manual Publishing
If you want to publish manually:

```bash
# Make sure you're logged in to npm
npm login

# Build the package
npm run build:ts

# Publish (make sure version is bumped first)
npm publish --access public
```

## 4. Version Management

### Semantic Versioning
- `npm version patch` - Bug fixes (1.0.73 → 1.0.74)
- `npm version minor` - New features (1.0.73 → 1.1.0)  
- `npm version major` - Breaking changes (1.0.73 → 2.0.0)

## 5. Quick Start Steps

1. **Create npm account** at npmjs.com
2. **Generate access token** (Automation type)
3. **Add NPM_TOKEN secret** to GitHub repository settings
4. **Create a release**:
   ```bash
   npm version patch
   git push origin main --tags
   ```
5. **Check the results**:
   - GitHub Actions should run and publish
   - Package should appear at: https://www.npmjs.com/package/@sethdouglasford/claude-flow
   - GitHub should show the package in repository sidebar

## 6. Test Installation

Once published, anyone can install your package:

```bash
# Global installation
npm install -g @sethdouglasford/claude-flow

# Then use it
claude-flow --version
claude-flow help
```

---

Ready to publish? Follow steps 1-4 above! 🚀
