# 🚀 Ready to Publish to NPM!

Your Claude Flow project is now ready for npm publishing. Here's exactly what you need to do:

## 📦 Package Details

- **Package Name**: `@sethdford/claude-flow` (scoped to avoid conflicts)
- **Current Version**: `1.0.71`
- **Repository**: https://github.com/sethdford/vibex-claude-code-flow
- **License**: MIT

## 🔑 Step 1: Get Your NPM Token

### If you have an npm account:
1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Click your profile picture → "Access Tokens"  
3. Click "Generate New Token"
4. Select **"Automation"** (for CI/CD)
5. Copy the token (starts with `npm_...`)

### If you need an npm account:
1. Sign up at [npmjs.com](https://www.npmjs.com/)
2. Verify your email
3. Follow the steps above

## 🔐 Step 2: Add NPM Token to GitHub

1. Go to: https://github.com/sethdford/vibex-claude-code-flow/settings/secrets/actions
2. Click **"New repository secret"**
3. **Name**: `NPM_TOKEN`
4. **Secret**: Paste your npm token from Step 1
5. Click **"Add secret"**

## 🚀 Step 3: Choose Your Publishing Method

### Option A: Automated Publishing (Recommended)
```bash
# This will trigger GitHub Actions to build and publish automatically
git tag v1.0.72
git push origin v1.0.72
```

### Option B: Manual Publishing with Helper Script
```bash
# Use our helper script that guides you through the process
./scripts/publish-to-npm.sh
```

### Option C: Manual Publishing (Advanced)
```bash
# Log into npm
npm login

# Build the project
npm run build:ts

# Publish (--access public required for scoped packages)
npm publish --access public
```

## 📊 What Happens After Publishing

### Automated Publishing (Option A):
- ✅ GitHub Actions builds the project
- ✅ Runs tests and type checking
- ✅ Publishes to npm automatically
- ✅ Creates GitHub release with binaries
- ✅ Builds Docker images

### Manual Publishing (Options B/C):
- ✅ Package published to npm immediately
- ✅ Available at: https://www.npmjs.com/package/@sethdford/claude-flow
- ✅ Users can install with: `npm install -g @sethdford/claude-flow`

## 🎯 Verify Your Publication

Once published, test the installation:

```bash
# Install globally
npm install -g @sethdford/claude-flow

# Test the CLI
@sethdford/claude-flow --version
@sethdford/claude-flow help
```

## 🚨 Important Notes

### First-Time Scoped Package:
- You may need to make it public: `npm publish --access public`
- Scoped packages (`@username/package`) are private by default

### Version Management:
- Each publish needs a unique version number
- Use `npm version patch|minor|major` to bump versions
- Current version: `1.0.71` → Next: `1.0.72`

### Package Name:
- We changed from `claude-flow` to `@sethdford/claude-flow`
- This avoids conflicts with existing packages
- Users install with: `npm install -g @sethdford/claude-flow`

## 🔧 Troubleshooting

### "Package already exists"
- This shouldn't happen with `@sethdford/claude-flow`
- If it does, you may already own this package

### "Authentication failed"
- Double-check your NPM_TOKEN in GitHub secrets
- Make sure token has "Automation" permissions
- For manual publishing, run `npm login` first

### "Version already exists"
```bash
# Bump the version
npm version patch  # 1.0.71 → 1.0.72
```

## 🎉 You're Ready!

**Choose Option A (automated) or run the helper script:**

```bash
# Option A: Automated via GitHub Actions
git tag v1.0.72 && git push origin v1.0.72

# Option B: Interactive helper script
./scripts/publish-to-npm.sh
```

Your package will be live on npm and available worldwide! 🌍

---

**Need help?** Check the detailed guide: `docs/NPM_PUBLISHING_GUIDE.md` 