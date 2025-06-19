#!/bin/bash

# NPM Publishing Helper Script for @sethdford/claude-flow
# This script guides you through the npm publishing process

set -e

echo "🚀 NPM Publishing Helper for @sethdford/claude-flow"
echo "=================================================="
echo ""

# Check if user is logged into npm
echo "📋 Step 1: Checking npm authentication..."
if npm whoami > /dev/null 2>&1; then
    NPM_USER=$(npm whoami)
    echo "✅ You are logged into npm as: $NPM_USER"
else
    echo "❌ You are not logged into npm"
    echo "Please run: npm login"
    echo "Then re-run this script"
    exit 1
fi

echo ""

# Check current version
echo "📋 Step 2: Checking current version..."
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"
echo ""

# Ask if user wants to bump version
read -p "Do you want to bump the version? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Choose version bump type:"
    echo "1) patch (1.0.71 → 1.0.72)"
    echo "2) minor (1.0.71 → 1.1.0)"  
    echo "3) major (1.0.71 → 2.0.0)"
    read -p "Enter choice (1-3): " -n 1 -r
    echo ""
    
    case $REPLY in
        1) npm version patch ;;
        2) npm version minor ;;
        3) npm version major ;;
        *) echo "Invalid choice, keeping current version" ;;
    esac
    
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo "New version: $NEW_VERSION"
fi

echo ""

# Build the project
echo "📋 Step 3: Building the project..."
npm run build:ts
echo "✅ Build completed"
echo ""

# Run tests
echo "📋 Step 4: Running tests..."
if npm test > /dev/null 2>&1; then
    echo "✅ Tests passed"
else
    echo "⚠️  Tests failed or no tests found, continuing..."
fi
echo ""

# Show what will be published
echo "📋 Step 5: Preview package contents..."
echo "Files that will be published:"
npm pack --dry-run | grep -E "^\s*[0-9]+[.0-9]*[kKmMgG]?B\s+" || echo "Package preview not available"
echo ""

# Confirm publication
echo "📋 Step 6: Ready to publish!"
echo "Package: @sethdford/claude-flow"
echo "Version: $(node -p "require('./package.json').version")"
echo "Registry: $(npm config get registry)"
echo ""

read -p "Are you sure you want to publish to npm? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Publishing to npm..."
    
    # Publish with public access (required for scoped packages)
    npm publish --access public
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Successfully published to npm!"
        echo ""
        echo "Your package is now available at:"
        echo "https://www.npmjs.com/package/@sethdford/claude-flow"
        echo ""
        echo "Users can install it with:"
        echo "npm install -g @sethdford/claude-flow"
        echo ""
        echo "📋 Next steps:"
        echo "1. Create a GitHub release (or push a tag to trigger automated release)"
        echo "2. Update your documentation with the new version"
        echo "3. Announce your package to the community!"
        
        # Offer to create git tag
        echo ""
        read -p "Create a git tag for this version? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            CURRENT_VERSION=$(node -p "require('./package.json').version")
            git tag "v$CURRENT_VERSION"
            git push origin "v$CURRENT_VERSION"
            echo "✅ Created and pushed git tag: v$CURRENT_VERSION"
            echo "This will trigger GitHub Actions to create a release with binaries!"
        fi
        
    else
        echo "❌ Publishing failed. Check the error message above."
        exit 1
    fi
else
    echo "❌ Publishing cancelled"
    exit 1
fi 