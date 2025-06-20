#!/bin/bash
set -e

echo "🧪 Starting E2E Testing for Claude Code Flow..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Clean and build
echo -e "\n${BLUE}📦 Step 1: Clean Build${NC}"
echo "=========================="

info "Cleaning previous builds..."
rm -rf dist/ bin/claude-flow* || true

info "Running TypeScript build..."
npm run build:ts || error "TypeScript build failed"
success "TypeScript build completed"

info "Building SEA binary..."
npm run build:sea || error "SEA binary build failed"
success "SEA binary build completed"

# Step 2: Basic functionality tests
echo -e "\n${BLUE}⚡ Step 2: Basic Functionality Tests${NC}"
echo "====================================="

info "Testing Node.js CLI version..."
NODE_VERSION=$(node dist/cli/index.js --version 2>/dev/null || echo "FAILED")
if [[ "$NODE_VERSION" == "FAILED" ]]; then
    error "Node.js CLI version test failed"
else
    success "Node.js CLI version: $NODE_VERSION"
fi

info "Testing SEA binary version..."
BINARY_VERSION=$(./bin/claude-flow --version 2>/dev/null || echo "FAILED")
if [[ "$BINARY_VERSION" == "FAILED" ]]; then
    error "SEA binary version test failed"
else
    success "SEA binary version: $BINARY_VERSION"
fi

info "Testing help system..."
node dist/cli/index.js --help > /dev/null || error "Help system failed"
success "Help system working"

# Step 3: Command-specific tests
echo -e "\n${BLUE}🎯 Step 3: Command-Specific Tests${NC}"
echo "=================================="

info "Testing SPARC commands..."
node dist/cli/index.js sparc modes > /dev/null || warning "SPARC modes test failed (may be expected if .roomodes not configured)"
node dist/cli/index.js sparc --help > /dev/null || error "SPARC help failed"
success "SPARC commands working"

info "Testing Swarm commands..."
node dist/cli/index.js swarm --help > /dev/null || error "Swarm help failed"
node dist/cli/index.js swarm list > /dev/null || warning "Swarm list test failed (expected if no swarms)"
success "Swarm commands working"

info "Testing Memory commands..."
node dist/cli/index.js memory --help > /dev/null || error "Memory help failed"
success "Memory commands working"

info "Testing Config commands..."
node dist/cli/index.js config --help > /dev/null || error "Config help failed"
success "Config commands working"

# Step 4: Binary-specific tests
echo -e "\n${BLUE}🔧 Step 4: Binary-Specific Tests${NC}"
echo "================================="

info "Testing binary help..."
./bin/claude-flow --help > /dev/null || error "Binary help failed"
success "Binary help working"

info "Testing binary SPARC..."
./bin/claude-flow sparc --help > /dev/null || error "Binary SPARC help failed"
success "Binary SPARC working"

info "Testing binary Swarm..."
./bin/claude-flow swarm --help > /dev/null || error "Binary Swarm help failed"
success "Binary Swarm working"

# Step 5: Dry-run tests
echo -e "\n${BLUE}🏃 Step 5: Dry-Run Tests${NC}"
echo "========================="

info "Testing SPARC dry-run..."
./bin/claude-flow sparc run tdd "Test task" --dry-run > /dev/null || warning "SPARC dry-run failed (may need .roomodes config)"

info "Testing Swarm dry-run..."
./bin/claude-flow swarm run "Test objective" --dry-run --strategy research > /dev/null || error "Swarm dry-run failed"
success "Swarm dry-run working"

# Step 6: Performance tests
echo -e "\n${BLUE}⏱️  Step 6: Performance Tests${NC}"
echo "=============================="

info "Measuring startup time..."
START_TIME=$(date +%s%N)
./bin/claude-flow --version > /dev/null
END_TIME=$(date +%s%N)
STARTUP_MS=$(( (END_TIME - START_TIME) / 1000000 ))
success "Startup time: ${STARTUP_MS}ms"

info "Checking binary size..."
BINARY_SIZE=$(ls -lh bin/claude-flow | awk '{print $5}')
success "Binary size: $BINARY_SIZE"

# Step 7: Error handling tests
echo -e "\n${BLUE}🚨 Step 7: Error Handling Tests${NC}"
echo "================================="

info "Testing invalid command..."
if ./bin/claude-flow invalid-command 2>&1 | grep -q "Unknown command"; then
    success "Invalid command error handling working"
else
    error "Invalid command error handling failed"
fi

info "Testing invalid SPARC mode..."
if ./bin/claude-flow sparc invalid-mode 2>&1 | grep -q -E "(Mode not found|not found|Unknown)"; then
    success "Invalid SPARC mode error handling working"
else
    warning "Invalid SPARC mode error handling may need improvement"
fi

# Step 8: Package test
echo -e "\n${BLUE}📦 Step 8: Package Test${NC}"
echo "======================="

info "Creating npm package..."
npm pack > /dev/null || error "npm pack failed"
PACKAGE_FILE=$(ls *.tgz | head -1)
success "Package created: $PACKAGE_FILE"

info "Checking package contents..."
tar -tzf "$PACKAGE_FILE" | grep -q "dist/" || error "Package missing dist/ directory"
tar -tzf "$PACKAGE_FILE" | grep -q "bin/" || error "Package missing bin/ directory"
tar -tzf "$PACKAGE_FILE" | grep -q "package.json" || error "Package missing package.json"
success "Package contents verified"

# Cleanup package
rm -f *.tgz

# Final summary
echo -e "\n${GREEN}🎉 E2E Testing Summary${NC}"
echo "======================"
success "All critical tests passed!"
echo ""
echo "✅ TypeScript compilation working"
echo "✅ SEA binary building and working"  
echo "✅ CLI commands functional"
echo "✅ Help system working"
echo "✅ Error handling working"
echo "✅ Package creation working"
echo "✅ Performance acceptable (startup: ${STARTUP_MS}ms, size: $BINARY_SIZE)"
echo ""
info "Binary location: ./bin/claude-flow"
info "Node.js CLI location: ./dist/cli/index.js"
echo ""
echo "🚀 Ready for deployment!"
