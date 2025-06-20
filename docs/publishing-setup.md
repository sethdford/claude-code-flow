# Publishing Setup Guide

This guide explains how to set up automated publishing to npm and GitHub releases using GitHub Actions.

## Prerequisites

1. **npm Account**: You need an npm account with publishing permissions
2. **GitHub Repository**: Repository with admin access to configure secrets
3. **Docker Hub Account** (optional): For Docker image publishing

## Required GitHub Secrets

Navigate to your repository settings → Secrets and variables → Actions, and add these secrets:

### Required Secrets

#### `NPM_TOKEN`
Your npm authentication token for publishing packages.

**How to get it:**
1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Go to Account Settings → Access Tokens
3. Click "Generate New Token"
4. Select "Automation" type
5. Copy the token and add it to GitHub secrets

#### `GITHUB_TOKEN`
This is automatically provided by GitHub Actions - no setup needed.

### Optional Secrets (for Docker publishing)

#### `DOCKERHUB_USERNAME`
Your Docker Hub username.

#### `DOCKERHUB_TOKEN`
Your Docker Hub access token.

**How to get it:**
1. Log in to [hub.docker.com](https://hub.docker.com/)
2. Go to Account Settings → Security
3. Click "New Access Token"
4. Give it a name and copy the token

## Publishing Workflow

### Automatic Publishing

The CI/CD pipeline is configured to automatically:

1. **On every push to main/develop**: Run tests and build binaries
2. **On tag creation (v*)**: Publish to npm and create GitHub release

### Manual Release Process

1. **Update version in package.json**:
   ```bash
   npm version patch  # or minor, major
   ```

2. **Push the tag**:
   ```bash
   git push origin --tags
   ```

3. **GitHub Actions will automatically**:
   - Run all tests
   - Build SEA binaries for Linux, macOS, and Windows
   - Publish to npm
   - Create GitHub release with binaries attached
   - Build and push Docker image

### Versioning Strategy

Use semantic versioning (semver):
- `patch` (1.0.1): Bug fixes
- `minor` (1.1.0): New features (backward compatible)
- `major` (2.0.0): Breaking changes

```bash
# Examples
npm version patch   # 1.0.71 → 1.0.72
npm version minor   # 1.0.71 → 1.1.0
npm version major   # 1.0.71 → 2.0.0
```

## Build Artifacts

The CI/CD pipeline creates several artifacts:

### npm Package
- Contains compiled TypeScript (`dist/` folder)
- Includes CLI binary entry point
- Available via `npm install -g claude-flow`

### SEA Binaries
- **Linux**: `claude-flow` (70MB standalone executable)
- **macOS**: `claude-flow` (70MB standalone executable)
- **Windows**: `claude-flow.exe` (70MB standalone executable)

### Docker Image
- Multi-architecture (amd64, arm64)
- Published to Docker Hub as `username/claude-flow`
- Tags: `latest`, version numbers, branch names

## Testing the Pipeline

### Local Testing

1. **Test TypeScript build**:
   ```bash
   npm run build:ts
   ```

2. **Test SEA binary creation**:
   ```bash
   npm run build:sea
   ./bin/claude-flow --version
   ```

3. **Test npm package**:
   ```bash
   npm pack
   npm install -g ./sethdouglasford-claude-flow-*.tgz
   claude-flow --version
   ```

### CI Testing

1. **Push to develop branch** to test the full pipeline without publishing
2. **Check GitHub Actions** tab for build status
3. **Download artifacts** from successful builds to test binaries

## Troubleshooting

### Common Issues

#### npm publish fails with 403
- Check that `NPM_TOKEN` is correctly set in GitHub secrets
- Verify your npm account has publishing permissions
- Ensure the package name is available (not already taken)

#### Binary creation fails
- Check Node.js version compatibility (requires Node 20+)
- Verify TypeScript compilation succeeds first
- Check disk space for large binary creation

#### Docker build fails
- Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` are set
- Check Docker Hub repository exists and is accessible
- Review Docker build logs for specific errors

### Debug Steps

1. **Check GitHub Actions logs** for detailed error messages
2. **Test locally** using the same commands as CI
3. **Verify all secrets** are properly configured
4. **Check package.json** for correct main entry point

## Security Considerations

- **Never commit secrets** to the repository
- **Use minimal permissions** for tokens (automation-scoped)
- **Regularly rotate tokens** for security
- **Review dependencies** for security vulnerabilities

## Manual Publishing (Fallback)

If automated publishing fails, you can publish manually:

### npm
```bash
npm run build:ts
npm publish --access public
```

### GitHub Release
1. Create a new release on GitHub
2. Upload the binary files from `bin/` directory
3. Write release notes describing changes

### Docker
```bash
docker build -t username/claude-flow:latest .
docker push username/claude-flow:latest
```

## Monitoring

### Post-Release Checklist

1. ✅ Verify npm package is available: `npm view claude-flow`
2. ✅ Test installation: `npm install -g claude-flow`
3. ✅ Check GitHub release has all binaries attached
4. ✅ Verify Docker image is available: `docker pull username/claude-flow`
5. ✅ Test binary downloads and execution
6. ✅ Update documentation if needed

### Metrics to Monitor

- Download counts on npm
- GitHub release download statistics  
- Docker image pull counts
- Issue reports for new releases

## Next Steps

After successful setup:

1. **Document the release process** for your team
2. **Set up automated security scanning** for dependencies
3. **Configure release notifications** (Slack, Discord, etc.)
4. **Consider setting up a staging environment** for pre-release testing

---

For more help, check the [GitHub Actions documentation](https://docs.github.com/en/actions) or [npm publishing guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry). 