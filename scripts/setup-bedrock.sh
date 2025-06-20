#!/bin/bash

# AWS Bedrock Setup Script for Claude Code Flow
# This script helps you configure AWS Bedrock integration with auto-detection

set -e

echo "🚀 AWS Bedrock Setup for Claude Code Flow"
echo "=========================================="
echo

# Function to check if AWS credentials are available
check_aws_credentials() {
    local method=""
    local region=""
    local profile=""
    
    # Check environment variables first
    if [[ -n "$AWS_ACCESS_KEY_ID" && -n "$AWS_SECRET_ACCESS_KEY" ]]; then
        method="environment variables"
        region="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
    # Check AWS profile
    elif [[ -n "$AWS_PROFILE" ]] && aws configure list-profiles 2>/dev/null | grep -q "^$AWS_PROFILE$"; then
        method="AWS profile ($AWS_PROFILE)"
        region=$(aws configure get region --profile "$AWS_PROFILE" 2>/dev/null || echo "us-east-1")
        profile="$AWS_PROFILE"
    # Check default profile
    elif aws configure list 2>/dev/null | grep -q "access_key"; then
        method="default AWS profile"
        region=$(aws configure get region 2>/dev/null || echo "us-east-1")
        profile="default"
    # Check for IAM role (EC2 instance profile or ECS task role)
    elif curl -s --max-time 2 http://169.254.169.254/latest/meta-data/iam/security-credentials/ >/dev/null 2>&1; then
        method="IAM instance profile/role"
        region=$(curl -s --max-time 2 http://169.254.169.254/latest/meta-data/placement/region 2>/dev/null || echo "us-east-1")
    # Check for AWS SSO session
    elif aws sts get-caller-identity --no-cli-pager >/dev/null 2>&1; then
        method="AWS SSO or other credential source"
        region=$(aws configure get region 2>/dev/null || echo "us-east-1")
    fi
    
    if [[ -n "$method" ]]; then
        echo "✅ AWS credentials detected via: $method"
        echo "   Region: $region"
        if [[ -n "$profile" ]]; then
            echo "   Profile: $profile"
        fi
        return 0
    else
        echo "❌ No AWS credentials found"
        return 1
    fi
}

# Function to auto-configure environment
auto_configure_env() {
    local region="$1"
    local profile="$2"
    
    echo
    echo "🔧 Auto-configuring .env file..."
    
    # Create or update .env file
    if [[ ! -f .env ]]; then
        touch .env
    fi
    
    # Remove existing Bedrock configuration
    sed -i.bak '/^CLAUDE_CODE_USE_BEDROCK=/d' .env 2>/dev/null || true
    sed -i.bak '/^AWS_REGION=/d' .env 2>/dev/null || true
    sed -i.bak '/^AWS_PROFILE=/d' .env 2>/dev/null || true
    sed -i.bak '/^ANTHROPIC_MODEL=/d' .env 2>/dev/null || true
    sed -i.bak '/^ANTHROPIC_SMALL_FAST_MODEL=/d' .env 2>/dev/null || true
    
    # Add Bedrock configuration
    echo "CLAUDE_CODE_USE_BEDROCK=true" >> .env
    echo "AWS_REGION=$region" >> .env
    
    if [[ -n "$profile" && "$profile" != "default" ]]; then
        echo "AWS_PROFILE=$profile" >> .env
    fi
    
    # Add Claude 4 models
    echo "ANTHROPIC_MODEL=anthropic.claude-opus-4-20250514-v1:0" >> .env
    echo "ANTHROPIC_SMALL_FAST_MODEL=anthropic.claude-sonnet-4-20250514-v1:0" >> .env
    
    # Clean up backup file
    rm -f .env.bak
}

# Function to test Bedrock access
test_bedrock_access() {
    local region="$1"
    local profile_arg=""
    
    if [[ -n "$AWS_PROFILE" ]]; then
        profile_arg="--profile $AWS_PROFILE"
    fi
    
    echo
    echo "🧪 Testing Bedrock access..."
    
    # Test if Bedrock is available in the region
    if aws bedrock list-foundation-models --region "$region" $profile_arg --no-cli-pager >/dev/null 2>&1; then
        echo "✅ Bedrock access confirmed in region: $region"
        
        # Check if Claude models are available
        local claude_models
        claude_models=$(aws bedrock list-foundation-models --region "$region" $profile_arg --no-cli-pager --query 'modelSummaries[?contains(modelId, `anthropic.claude`)].modelId' --output text 2>/dev/null || echo "")
        
        if [[ -n "$claude_models" ]]; then
            echo "✅ Claude models available:"
            echo "$claude_models" | tr '\t' '\n' | sed 's/^/   - /'
        else
            echo "⚠️  No Claude models found. You may need to request access in the AWS console."
        fi
    else
        echo "❌ Cannot access Bedrock in region: $region"
        echo "   Please ensure Bedrock is enabled in your AWS account and region"
        return 1
    fi
}

# Main execution
echo "🔍 Checking for existing AWS credentials..."

if check_aws_credentials; then
    # Extract the detected values
    region=$(aws configure get region 2>/dev/null || echo "us-east-1")
    profile=""
    
    if [[ -n "$AWS_PROFILE" ]]; then
        profile="$AWS_PROFILE"
    elif aws configure list 2>/dev/null | grep -q "profile"; then
        profile=$(aws configure list 2>/dev/null | grep "profile" | awk '{print $2}' | head -n1)
    fi
    
    echo
    echo "🎯 Detected configuration:"
    echo "   Region: $region"
    if [[ -n "$profile" && "$profile" != "default" ]]; then
        echo "   Profile: $profile"
    fi
    
    # Ask user if they want to use auto-detected settings
    echo
    read -p "Use auto-detected AWS settings? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        auto_configure_env "$region" "$profile"
        test_bedrock_access "$region"
    else
        echo "Manual configuration selected..."
        # Fall back to manual configuration
        manual_setup=true
    fi
else
    echo
    echo "📋 No existing AWS credentials found. Manual setup required."
    manual_setup=true
fi

# Manual setup if needed
if [[ "$manual_setup" == "true" ]]; then
    echo
    echo "🔧 Manual AWS Configuration"
    echo "============================="
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI is not installed. Please install it first:"
        echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    echo "✅ AWS CLI found"
    
    # Prompt for configuration method
    echo
    echo "Choose configuration method:"
    echo "1. Use AWS access keys"
    echo "2. Use AWS profile"
    echo "3. Configure AWS CLI first"
    
    read -p "Enter choice (1-3): " -n 1 -r choice
    echo
    
    case $choice in
        1)
            echo
            read -p "Enter AWS Access Key ID: " aws_access_key
            read -s -p "Enter AWS Secret Access Key: " aws_secret_key
            echo
            read -p "Enter AWS Region (default: us-east-1): " aws_region
            aws_region=${aws_region:-us-east-1}
            
            # Create .env file
            cat > .env << EOF
# AWS Bedrock Configuration
CLAUDE_CODE_USE_BEDROCK=true
AWS_REGION=$aws_region
AWS_ACCESS_KEY_ID=$aws_access_key
AWS_SECRET_ACCESS_KEY=$aws_secret_key

# Claude 4 models
ANTHROPIC_MODEL=anthropic.claude-opus-4-20250514-v1:0
ANTHROPIC_SMALL_FAST_MODEL=anthropic.claude-sonnet-4-20250514-v1:0
EOF
            ;;
        2)
            echo
            read -p "Enter AWS Profile name: " aws_profile
            read -p "Enter AWS Region (default: us-east-1): " aws_region
            aws_region=${aws_region:-us-east-1}
            
            # Create .env file
            cat > .env << EOF
# AWS Bedrock Configuration
CLAUDE_CODE_USE_BEDROCK=true
AWS_REGION=$aws_region
AWS_PROFILE=$aws_profile

# Claude 4 models
ANTHROPIC_MODEL=anthropic.claude-opus-4-20250514-v1:0
ANTHROPIC_SMALL_FAST_MODEL=anthropic.claude-sonnet-4-20250514-v1:0
EOF
            ;;
        3)
            echo
            echo "Please run 'aws configure' first, then re-run this script"
            exit 0
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
fi

echo
echo "📝 Configuration complete!"
echo
echo "✅ .env file created/updated with Bedrock settings"
echo "✅ Claude 4 models configured (Opus and Sonnet)"
echo

# Test the configuration
echo "🧪 Testing configuration..."
source .env

if [[ "$CLAUDE_CODE_USE_BEDROCK" == "true" ]]; then
    echo "✅ Bedrock integration enabled"
    echo "   Model: $ANTHROPIC_MODEL"
    echo "   Fast model: $ANTHROPIC_SMALL_FAST_MODEL"
    echo "   Region: $AWS_REGION"
    
    if [[ -n "$AWS_PROFILE" ]]; then
        echo "   Profile: $AWS_PROFILE"
    fi
else
    echo "❌ Configuration error - Bedrock not enabled"
fi

echo
echo "🚀 Setup complete! You can now use Claude Code Flow with AWS Bedrock."
echo
echo "💡 Next steps:"
echo "   1. Test with: claude-flow claude spawn 'Hello from Bedrock!'"
echo "   2. Check logs for 'AWS Bedrock integration enabled' message"
echo "   3. See docs/AWS_BEDROCK_INTEGRATION.md for advanced usage"
echo
echo "🔗 Useful commands:"
echo "   aws bedrock list-foundation-models --region $AWS_REGION"
echo "   aws sts get-caller-identity  # Verify AWS access"

echo ""
echo "📝 Example .env file created with Claude 4 models:"
echo "   • Claude 4 Opus for complex tasks (most powerful)"
echo "   • Claude 4 Sonnet for balanced performance"
echo ""
echo "💡 Alternative model configurations:"
echo "   • For cost optimization: Use Claude 3.5 Haiku for simple tasks"
echo "   • For legacy compatibility: Use Claude 3.5 Sonnet"
echo ""

# Available Claude Models on AWS Bedrock:
# - Claude 4 Opus: anthropic.claude-opus-4-20250514-v1:0 (Most powerful)
# - Claude 4 Sonnet: anthropic.claude-sonnet-4-20250514-v1:0 (High performance)
# - Claude 3.7 Sonnet: anthropic.claude-3-7-sonnet-20250219-v1:0 (Extended thinking)
# - Claude 3.5 Sonnet: anthropic.claude-3-5-sonnet-20241022-v2:0 (General purpose)
# - Claude 3.5 Haiku: anthropic.claude-3-5-haiku-20241022-v1:0 (Fast & cost-effective) 