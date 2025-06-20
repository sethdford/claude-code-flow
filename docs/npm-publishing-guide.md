# 📦 NPM Publishing Guide

This guide will walk you through setting up automated npm publishing for your Claude Flow project.

## Step 1: Get Your NPM Token

### Option A: If you already have an npm account
1. Go to [npmjs.com](https://www.npmjs.com/) and log in
2. Click on your profile picture → "Access Tokens"
3. Click "Generate New Token"
4. Select "Automation" (recommended for CI/CD)
5. Copy the token (starts with `npm_...`)

### Option B: If you need to create an npm account
1. Go to [npmjs.com](https://www.npmjs.com/) and sign up
2. Verify your email address
3. Follow Option A above to get your token

## Step 2: Add NPM Token to GitHub Secrets

1. **Go to your repository**: https://github.com/sethdford/vibex-claude-code-flow
2. **Click on "Settings"** (in the repository navigation)
3. **Click on "Secrets and variables"** → **"Actions"** (in the left sidebar)
4. **Click "New repository secret"**
5. **Name**: `NPM_TOKEN`
6. **Secret**: Paste your npm token from Step 1
7. **Click "Add secret"**

## Step 3: Publish to npm

You have two options for publishing:

### Option A: Automatic Publishing (Recommended)
Create a version tag to trigger automatic publishing:

```bash
# Make sure you're in your project directory
cd /path/to/your/claude-code-flow

# Create and push a version tag
git tag v1.0.72
git push origin v1.0.72
```

This will:
- ✅ Trigger the GitHub Actions workflow
- ✅ Build the project automatically
- ✅ Run tests
- ✅ Publish to npm
- ✅ Create a GitHub release with binaries

### Option B: Manual Publishing
If you prefer to publish manually:

```bash
# Make sure you're logged into npm
npm login

# Publish the package
npm publish
```

## Step 4: Monitor the Process

### For Automatic Publishing:
1. Go to your repository: https://github.com/sethdford/vibex-claude-code-flow
2. Click on the "Actions" tab
3. You should see a workflow running called "Build and Publish"
4. Click on it to see the progress

### Check npm:
1. Go to https://www.npmjs.com/package/@sethdford/claude-flow
2. Your package should appear there once published

## Step 5: Verify Installation

Once published, test that users can install your package:

```bash
# Test global installation
npm install -g @sethdford/claude-flow

# Test the CLI
@sethdford/claude-flow --version
@sethdford/claude-flow help
```

## 🚨 Important Notes

### Package Name
- Your package will be published as `@sethdford/claude-flow` on npm
- If this name is taken, you may need to:
  - Choose a different name (update `package.json`)
  - Use a scoped package name like `@sethdford/claude-flow`

### Version Management
- Each npm publish requires a unique version number
- Update version in `package.json` before publishing
- Or use: `npm version patch|minor|major`

### First-Time Publishing
If this is your first time publishing this package name:
- npm may require email verification
- You might need to make the package public: `npm publish --access public`

## 🔧 Troubleshooting

### "Package name already exists"
```bash
# Option 1: Use a scoped name
npm init --scope=@sethdford

# Option 2: Choose a different name
# Edit package.json and change the "name" field
```

### "Authentication failed"
- Double-check your NPM_TOKEN in GitHub secrets
- Make sure the token has "Automation" permissions
- Token should start with `npm_`

### "Version already exists"
```bash
# Bump the version
npm version patch  # 1.0.71 → 1.0.72
git push origin main --tags
```

## 📊 Expected Results

After successful publishing:
- ✅ Package available at: https://www.npmjs.com/package/@sethdford/claude-flow
- ✅ Users can install with: `npm install -g @sethdford/claude-flow`
- ✅ GitHub release created with binaries
- ✅ Docker image built and available

## 🎯 Next Steps After Publishing

1. **Update README badges** with npm version
2. **Share the package** with your community
3. **Monitor downloads** on npm
4. **Set up automated updates** for future versions

## 📞 Need Help?

If you encounter any issues:
1. Check the GitHub Actions logs for detailed error messages
2. Verify your npm token has the correct permissions
3. Ensure your package name is available on npm
4. Make sure your version number is unique

---

**Ready to publish?** Follow Steps 1-3 above, and your package will be live on npm! 🚀 