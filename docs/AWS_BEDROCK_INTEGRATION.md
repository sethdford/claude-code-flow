# AWS Bedrock Integration with Claude Code Flow

This guide explains how to configure Claude Code Flow to use Claude 4 through AWS Bedrock instead of the direct Anthropic API.

## Overview

AWS Bedrock integration allows you to:
- Use Claude 4 through your AWS account
- Leverage AWS credits and billing
- Benefit from enterprise-grade security and compliance
- Access the latest Claude models as they become available on Bedrock

## Prerequisites

1. **AWS Account** with Bedrock access
2. **AWS CLI** installed and configured
3. **Claude Code CLI** installed
4. **Claude Code Flow** binary built

## Quick Setup

### 1. Automated Setup (Recommended)

Run the provided setup script:

```bash
./scripts/setup-bedrock.sh
```

This script will:
- Check AWS CLI installation and credentials
- Verify Claude model access in Bedrock
- Create a `.env` file with proper configuration
- Test the integration

### 2. Manual Setup

#### Step 1: Configure AWS Credentials

```bash
# Option A: Interactive configuration
aws configure

# Option B: Set environment variables
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
export AWS_REGION=us-east-1

# Option C: Use AWS profile
aws configure --profile claude-flow
export AWS_PROFILE=claude-flow
```

#### Step 2: Request Claude Model Access

1. Go to the [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Navigate to **Model Access**
3. Request access to Claude models:
   - Claude 3.5 Sonnet
   - Claude 3.5 Haiku
   - Claude 3 Opus (optional)
4. Wait for approval (usually instant)

#### Step 3: Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Enable Bedrock integration
CLAUDE_CODE_USE_BEDROCK=true

# AWS Configuration
AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_access_key_id  # If not using profile
# AWS_SECRET_ACCESS_KEY=your_secret_key  # If not using profile
AWS_PROFILE=default  # Or your profile name

# Claude model configuration
ANTHROPIC_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0
ANTHROPIC_SMALL_FAST_MODEL=anthropic.claude-3-5-haiku-20241022-v1:0

# Claude Code Flow settings
CLAUDE_FLOW_LOG_LEVEL=info
NODE_ENV=production
```

#### Step 4: Test the Integration

```bash
# Test AWS Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Test Claude Code Flow with Bedrock
claude-flow claude spawn "Hello, please confirm you're running via AWS Bedrock" --dry-run
```

## Available Claude Models

| Model ID | Description | Use Case | Input Cost | Output Cost |
|----------|-------------|----------|------------|-------------|
| `anthropic.claude-opus-4-20250514-v1:0` | **Claude 4 Opus (Latest)** | Most powerful model for complex coding, agents, long-running tasks | $15.00/1M tokens | $75.00/1M tokens |
| `anthropic.claude-sonnet-4-20250514-v1:0` | **Claude 4 Sonnet (Latest)** | High-performance balanced model for production workflows | $3.00/1M tokens | $15.00/1M tokens |
| `anthropic.claude-3-7-sonnet-20250219-v1:0` | Claude 3.7 Sonnet | Advanced reasoning with extended thinking | $3.00/1M tokens | $15.00/1M tokens |
| `anthropic.claude-3-5-sonnet-20241022-v2:0` | Claude 3.5 Sonnet | General purpose, coding, analysis | $3.00/1M tokens | $15.00/1M tokens |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Claude 3.5 Haiku | Fast responses, simple tasks | $0.80/1M tokens | $4.00/1M tokens |
| `anthropic.claude-3-opus-20240229-v1:0` | Claude 3 Opus | Complex reasoning, research | $15.00/1M tokens | $75.00/1M tokens |

*Prices are approximate and may vary by region. Check AWS Bedrock pricing for current rates.*

## Usage Examples

### Basic Claude Spawning

```bash
# Spawn Claude with Bedrock
claude-flow claude spawn "Implement a REST API for user authentication"

# Use specific tools
claude-flow claude spawn "Debug this React component" --tools "View,Edit,Bash,WebFetch"

# Skip permissions for automation
claude-flow claude spawn "Run tests and fix any failures" --no-permissions
```

### SPARC Framework with Bedrock

```bash
# Run SPARC mode with Bedrock
claude-flow sparc run code "Implement user dashboard with charts"

# TDD workflow with Bedrock
claude-flow sparc tdd "Payment processing system"
```

### Workflow Execution

```bash
# Execute complex workflow with Bedrock
claude-flow start --config my-workflow.json --agents 3
```

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CLAUDE_CODE_USE_BEDROCK` | Enable Bedrock integration | `false` | Yes |
| `AWS_REGION` | AWS region for Bedrock | `us-east-1` | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | - | If not using profile |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - | If not using profile |
| `AWS_SESSION_TOKEN` | AWS session token | - | For temporary credentials |
| `AWS_PROFILE` | AWS profile name | `default` | If not using keys |
| `ANTHROPIC_MODEL` | Primary Claude model | `claude-3-5-sonnet` | No |
| `ANTHROPIC_SMALL_FAST_MODEL` | Fast model for simple tasks | `claude-3-5-haiku` | No |

### Model Selection Strategy

Claude Code Flow automatically selects models based on task complexity:

- **Complex tasks**: Uses `ANTHROPIC_MODEL` (recommended: Claude 4 Opus for most powerful AI)
- **Balanced tasks**: Uses `ANTHROPIC_SMALL_FAST_MODEL` (recommended: Claude 4 Sonnet for high performance)
- **Simple tasks**: Uses Claude 3.5 Haiku for speed and cost efficiency
- **Research tasks**: May use Claude 4 Opus for deep analysis and extended reasoning

## Troubleshooting

### Common Issues

#### 1. Model Access Denied

```
Error: Access denied to model anthropic.claude-3-5-sonnet-20241022-v2:0
```

**Solution**: Request access to Claude models in the AWS Bedrock console.

#### 2. Region Not Supported

```
Error: Model not available in region us-west-1
```

**Solution**: Use a supported region like `us-east-1` or `us-west-2`.

#### 3. AWS Credentials Not Found

```
Error: Unable to locate credentials
```

**Solutions**:
- Run `aws configure` to set up credentials
- Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables
- Use IAM roles if running on AWS infrastructure

#### 4. Claude Code CLI Not Found

```
Error: claude command not found
```

**Solution**: Install Claude Code CLI from [Anthropic's documentation](https://docs.anthropic.com/en/docs/claude-code).

### Debug Commands

```bash
# Check AWS configuration
aws configure list

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Enable debug logging
export CLAUDE_FLOW_LOG_LEVEL=debug
claude-flow claude spawn "Test debug mode" --dry-run

# Check environment variables
env | grep -E "(CLAUDE|AWS|ANTHROPIC)"
```

### Performance Optimization

1. **Use appropriate models**:
   - Claude 3.5 Haiku for simple tasks (faster, cheaper)
   - Claude 3.5 Sonnet for complex tasks (better quality)
   - Claude 3 Opus for research and analysis

2. **Regional considerations**:
   - Use regions closer to your location for lower latency
   - Some regions may have better model availability

3. **Cost optimization**:
   - Monitor usage through AWS Cost Explorer
   - Set up CloudWatch alarms for cost control
   - Use Haiku for development/testing

## Security Best Practices

1. **IAM Permissions**: Create dedicated IAM users/roles with minimal Bedrock permissions
2. **Credential Management**: Use AWS profiles or IAM roles instead of hardcoded keys
3. **Network Security**: Use VPC endpoints for Bedrock if running in AWS
4. **Audit Logging**: Enable CloudTrail for API call auditing
5. **Cost Controls**: Set up billing alerts and spending limits

## Integration Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude Flow   │    │   Claude Code   │    │   AWS Bedrock   │
│   (Orchestrator)│───▶│   (CLI Tool)    │───▶│   (Claude API)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
  Environment Vars        Process Spawning        Model Execution
  - CLAUDE_CODE_USE_BEDROCK  - Passes env vars     - Claude 3.5 Sonnet
  - AWS_REGION              - Inherits credentials  - Claude 3.5 Haiku
  - ANTHROPIC_MODEL         - Streams output       - Claude 3 Opus
```

## Support and Resources

- **AWS Bedrock Documentation**: https://docs.aws.amazon.com/bedrock/
- **Claude Code Documentation**: https://docs.anthropic.com/en/docs/claude-code
- **Claude Code Flow Issues**: https://github.com/sethdford/vibex-claude-code-flow/issues
- **AWS Support**: Available through AWS Support Center

## FAQ

**Q: Can I use both direct Anthropic API and Bedrock?**
A: Yes, but not simultaneously. Set `CLAUDE_CODE_USE_BEDROCK=false` to use direct API.

**Q: Are there any feature differences between direct API and Bedrock?**
A: No, Claude models function identically through both interfaces.

**Q: Can I use temporary AWS credentials?**
A: Yes, set `AWS_SESSION_TOKEN` along with temporary access keys.

**Q: How do I monitor costs?**
A: Use AWS Cost Explorer and set up CloudWatch billing alarms.

**Q: Can I use this in production?**
A: Yes, AWS Bedrock is enterprise-ready with SLAs and compliance certifications.

# AWS Bedrock Integration with Auto-Detection

Claude Code Flow now supports automatic detection and configuration of AWS credentials for seamless Bedrock integration with Claude 4 models.

## 🚀 Quick Start

### Automatic Detection

Claude Code Flow automatically detects existing AWS credentials and enables Bedrock integration when you start the application. No manual configuration needed if you already have AWS set up!

```bash
# Simply start Claude Code Flow - it will auto-detect and configure AWS
claude-flow start

# Or use the setup script for manual configuration
./scripts/setup-bedrock.sh
```

## 🔍 Auto-Detection Sources

Claude Code Flow checks for AWS credentials in the following order:

### 1. Environment Variables
```bash
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_REGION="us-east-1"  # Optional, defaults to us-east-1
```

### 2. AWS Profile
```bash
export AWS_PROFILE="your-profile-name"
# Uses region from profile, or defaults to us-east-1
```

### 3. AWS Config/Credentials Files
- `~/.aws/config`
- `~/.aws/credentials`

### 4. IAM Roles (for EC2/ECS)
- EC2 Instance Profile
- ECS Task Role
- Automatically detects region from instance metadata

### 5. AWS SSO/Other Sources
- Any credential source that works with `aws sts get-caller-identity`

## 🎯 Claude 4 Models

When AWS credentials are detected, Claude Code Flow automatically configures:

- **Primary Model**: `anthropic.claude-opus-4-20250514-v1:0` (Claude 4 Opus)
- **Fast Model**: `anthropic.claude-sonnet-4-20250514-v1:0` (Claude 4 Sonnet)

## 🧪 Testing Auto-Detection

Use the included test script to verify your configuration:

```bash
# Test AWS auto-detection
node test-aws-auto-detection.js
```

Example output:
```
🧪 Testing AWS Auto-Detection Feature
=====================================

🔍 Loading configuration with auto-detection...
🔍 AWS credentials detected - enabling Bedrock integration
✅ Auto-configured AWS Bedrock with Claude 4 models

📊 Configuration Results:
-------------------------
✅ Bedrock Enabled: true
✅ AWS Region: us-east-1
✅ Primary Model: anthropic.claude-opus-4-20250514-v1:0
✅ Fast Model: anthropic.claude-sonnet-4-20250514-v1:0

🎯 Claude 4 Configuration:
   Opus 4: ✅ Configured
   Sonnet 4: ✅ Configured

🔐 AWS Credential Sources:
   Environment Variables: ❌ Not found
   AWS Profile: ✅ default
   AWS Config File: ✅ Found
   AWS Credentials File: ✅ Found

🚀 Summary:
   ✅ AWS Bedrock integration is ENABLED
   ✅ Claude 4 models are configured
   ✅ Ready to use Claude Code Flow with AWS Bedrock
```

## 🔧 Manual Setup Script

For manual configuration or troubleshooting, use the enhanced setup script:

```bash
./scripts/setup-bedrock.sh
```

The script will:
1. **Auto-detect** existing AWS credentials
2. **Test Bedrock access** in your region
3. **List available Claude models**
4. **Configure .env file** automatically
5. **Verify the setup** works

### Interactive Configuration

If no credentials are found, the script offers:

1. **AWS Access Keys**: Direct credential input
2. **AWS Profile**: Use named profile
3. **AWS CLI Setup**: Guide to configure AWS CLI first

## 📁 Configuration Files

### Automatic .env Configuration

When AWS credentials are detected, the following is automatically added to your `.env`:

```bash
# AWS Bedrock Configuration (Auto-configured)
CLAUDE_CODE_USE_BEDROCK=true
AWS_REGION=us-east-1
AWS_PROFILE=default  # If using profile

# Claude 4 Models (Auto-configured)
ANTHROPIC_MODEL=anthropic.claude-opus-4-20250514-v1:0
ANTHROPIC_SMALL_FAST_MODEL=anthropic.claude-sonnet-4-20250514-v1:0
```

### Manual Override

You can override auto-detection by explicitly setting:

```bash
# Disable auto-detection
CLAUDE_CODE_USE_BEDROCK=false

# Or force enable with specific settings
CLAUDE_CODE_USE_BEDROCK=true
AWS_REGION=us-west-2
ANTHROPIC_MODEL=anthropic.claude-sonnet-4-20250514-v1:0
```

## 🛠 Usage Examples

### Basic Usage
```bash
# Auto-detection handles everything
claude-flow claude spawn "Hello from Claude 4 via Bedrock!"
```

### With Specific Region
```bash
AWS_REGION=us-west-2 claude-flow claude spawn "Hello from US West!"
```

### With Profile
```bash
AWS_PROFILE=production claude-flow claude spawn "Hello from production profile!"
```

## 🔒 Security Best Practices

### For Development
- Use AWS profiles instead of environment variables
- Store credentials in `~/.aws/credentials`
- Use `aws configure` to set up profiles

### For Production
- Use IAM roles (EC2 Instance Profile or ECS Task Role)
- Avoid storing credentials in code or environment files
- Use AWS Secrets Manager for sensitive data

### For CI/CD
- Use temporary credentials via AWS STS
- Configure minimal required permissions
- Rotate credentials regularly

## 🌍 Regional Considerations

### Supported Regions
Claude 4 models are available in:
- `us-east-1` (N. Virginia) - **Default**
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)
- `ap-southeast-1` (Singapore)

### Region Auto-Detection
1. Uses `AWS_REGION` environment variable
2. Falls back to `AWS_DEFAULT_REGION`
3. Reads from AWS profile configuration
4. Detects from EC2 instance metadata
5. Defaults to `us-east-1`

## 🚨 Troubleshooting

### Common Issues

#### 1. No AWS Credentials Found
```bash
# Check AWS CLI configuration
aws configure list

# Check for credential files
ls -la ~/.aws/

# Test AWS access
aws sts get-caller-identity
```

#### 2. Bedrock Access Denied
```bash
# Check Bedrock permissions
aws bedrock list-foundation-models --region us-east-1

# Request model access in AWS Console
# Navigate to: Bedrock > Model Access > Request Access
```

#### 3. Wrong Region
```bash
# Check available models in your region
aws bedrock list-foundation-models --region your-region

# Set correct region
export AWS_REGION=us-east-1
```

#### 4. Model Not Available
```bash
# List all Claude models
aws bedrock list-foundation-models --region us-east-1 \
  --query 'modelSummaries[?contains(modelId, `claude`)].modelId'
```

### Debug Mode

Enable debug logging to see auto-detection process:

```bash
CLAUDE_FLOW_DEBUG=true claude-flow start
```

## 📊 Monitoring and Costs

### Usage Monitoring
```bash
# Check CloudWatch metrics
aws logs describe-log-groups --log-group-name-prefix /aws/bedrock

# Monitor costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

### Cost Optimization
- Use Claude 4 Sonnet for routine tasks (faster, cheaper)
- Use Claude 4 Opus for complex reasoning (slower, more expensive)
- Set up CloudWatch billing alarms
- Monitor token usage in CloudWatch

## 🔗 Related Documentation

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude 4 Model Documentation](https://docs.anthropic.com/claude/docs/models-overview)
- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [IAM Roles for EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)

## 💡 Tips and Best Practices

1. **Use IAM roles** in production environments
2. **Set up billing alerts** to monitor costs
3. **Test in us-east-1** first (most model availability)
4. **Use Claude 4 Sonnet** for most tasks to optimize costs
5. **Enable CloudTrail** to audit Bedrock API calls
6. **Set up proper VPC endpoints** for enhanced security
7. **Use AWS Secrets Manager** for credential rotation 