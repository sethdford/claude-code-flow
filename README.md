# Claude Flow 🌊

> **Next-Generation AI Agent Orchestration Platform**  
> Transform your development workflow with intelligent multi-agent coordination, SPARC methodology, and seamless CLI integration

[![npm version](https://badge.fury.io/js/%40sethdouglasford%2Fclaude-flow.svg)](https://badge.fury.io/js/%40sethdouglasford%2Fclaude-flow)
[![Build Status](https://github.com/sethdford/vibex-claude-code-flow/workflows/CI/badge.svg)](https://github.com/sethdford/vibex-claude-code-flow/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Originally created by [@ruvnet](https://github.com/ruvnet) - this fork is a complete rebuild to modernize the architecture and ensure full functionality.**

---

## 🚀 What is Claude Flow?

Claude Flow is a revolutionary AI agent orchestration platform that transforms how you build, test, and deploy software. It combines the power of **multi-agent swarms** with the **SPARC methodology** (Specification → Pseudocode → Architecture → Refinement → Completion) to create a seamless development experience.

### ⚡ Key Capabilities

🤖 **Multi-Agent Swarms** - Coordinate specialized AI agents for complex tasks  
🏗️ **SPARC Methodology** - Systematic approach to software development  
⚙️ **CLI Integration** - Works with your existing workflow and tools  
🔄 **Background Processing** - Run as a daemon or integrate into CI/CD  
🧠 **Persistent Memory** - Agents learn and remember across sessions  
📊 **Real-time Monitoring** - Track progress and performance  
🛡️ **Enterprise Ready** - Security, audit trails, and compliance  

---

## 🎯 Perfect For

- **Individual Developers** - Accelerate coding, testing, and documentation
- **Development Teams** - Coordinate complex projects with AI assistance  
- **DevOps Engineers** - Automate deployments and infrastructure management
- **Product Managers** - Rapid prototyping and requirement validation
- **Enterprises** - Scalable AI integration with security and compliance

---

## 🏃‍♂️ Quick Start

### Installation

```bash
# Install globally
npm install -g @sethdouglasford/claude-flow

# Or use npx (no installation required)
npx @sethdouglasford/claude-flow --help
```

### Your First Swarm

```bash
# Create a complete web API in minutes
claude-flow swarm create "Build a REST API for task management with authentication"

# Use SPARC methodology for systematic development  
claude-flow sparc run tdd "Create user authentication system"

# Start interactive mode
claude-flow
```

### Enterprise Setup (AWS Bedrock)

```bash
# Auto-detect AWS credentials and configure
claude-flow init --aws-bedrock

# Or manually configure
claude-flow config set provider bedrock
claude-flow config set model claude-3-5-sonnet-20241022
```

---

## 🌟 Core Features

### 🤖 Multi-Agent Swarm Coordination

Claude Flow orchestrates specialized AI agents that work together like a development team:

```bash
# Parallel agent coordination
claude-flow swarm create "E-commerce platform" \
  --agents researcher,architect,developer,tester,reviewer \
  --strategy parallel \
  --max-agents 5

# Sequential workflow with dependencies
claude-flow swarm create "Microservices architecture" \
  --strategy sequential \
  --review-enabled \
  --quality-threshold 0.85
```

**Agent Specializations:**
- **Researcher** - Requirements analysis and best practices
- **Architect** - System design and technical specifications  
- **Developer** - Code implementation and optimization
- **Tester** - Unit tests, integration tests, and QA
- **Reviewer** - Code review and security analysis
- **DevOps** - Deployment and infrastructure automation

### 🏗️ SPARC Methodology

Systematic software development with AI assistance:

```bash
# Complete SPARC workflow
claude-flow sparc run all "Payment processing system"

# Individual phases
claude-flow sparc run spec-pseudocode "User authentication"
claude-flow sparc run architect "Database schema design"  
claude-flow sparc run tdd "API endpoint implementation"
claude-flow sparc run security-review "Security audit"
```

**SPARC Phases:**
- **Specification** - Clear requirements and acceptance criteria
- **Pseudocode** - Algorithm design and logic planning
- **Architecture** - System design and component relationships
- **Refinement** - TDD implementation with continuous improvement
- **Completion** - Integration, testing, and deployment

### ⚙️ Seamless CLI Integration

Claude Flow integrates naturally into your existing workflow:

```bash
# Background daemon mode
claude-flow start --daemon --port 3000

# CI/CD integration
claude-flow swarm create "$(cat requirements.md)" \
  --config ./ci/claude-flow.json \
  --output ./generated/ \
  --format json

# Git hook integration
claude-flow sparc run code-review "$(git diff HEAD~1)" \
  --hook pre-commit
```

### 🧠 Intelligent Memory System

Agents learn and remember across sessions:

```bash
# Store project knowledge
claude-flow memory store project_patterns "$(cat coding-standards.md)"

# Query knowledge base
claude-flow memory search "authentication patterns"

# Cross-agent knowledge sharing
claude-flow memory share-knowledge --from agent-1 --to team
```

### 📊 Real-time Monitoring

Track progress and performance:

```bash
# Start monitoring dashboard
claude-flow monitor --ui --port 8080

# Get system status
claude-flow status --detailed

# Performance metrics
claude-flow metrics --export prometheus
```

---

## 🎨 Examples & Use Cases

### 🚀 Application Development

**Complete REST API** (5 minutes):
```bash
claude-flow swarm create "REST API for blog platform with:
- User authentication (JWT)
- CRUD operations for posts
- Comment system
- Rate limiting
- Comprehensive tests
- API documentation"
```

**Microservices Architecture**:
```bash
claude-flow sparc run architect "Design microservices for e-commerce:
- User service
- Product catalog  
- Order processing
- Payment gateway
- Notification service"
```

### 🧪 Test-Driven Development

**TDD with SPARC**:
```bash
claude-flow sparc run tdd "Shopping cart functionality" \
  --test-first \
  --coverage-threshold 95 \
  --test-framework jest
```

### 🔧 DevOps Automation

**Infrastructure as Code**:
```bash
claude-flow swarm create "Kubernetes deployment for Node.js app:
- Docker containerization
- K8s manifests
- Helm charts
- CI/CD pipeline
- Monitoring setup"
```

### 📚 Documentation Generation

**Comprehensive Docs**:
```bash
claude-flow sparc run docs-writer "Generate documentation for:
- API reference
- User guides  
- Developer setup
- Architecture diagrams
- Deployment instructions"
```

### 🛡️ Security & Compliance

**Security Review**:
```bash
claude-flow sparc run security-review "$(cat src/)" \
  --standards "OWASP,PCI-DSS" \
  --output security-report.md
```

---

## 📁 Rich Example Library

Explore our comprehensive examples:

```
examples/
├── 01-configurations/     # Setup examples for different scenarios
├── 02-workflows/          # Multi-agent workflow definitions  
├── 03-demos/             # Live demonstration scripts
├── 04-testing/           # Testing and validation examples
├── 05-swarm-apps/        # Complete applications created by swarms
└── 06-tutorials/         # Step-by-step learning guides
```

**Featured Examples:**
- **Task Manager CLI** - Complete CRUD app with tests (400+ lines)
- **REST API Advanced** - Production-ready API with Docker
- **Data Pipeline** - ETL processing with error handling
- **Flask API with SPARC** - Python web service
- **Chat Application** - Real-time messaging system

### 🎯 Run Examples

```bash
# Quick demo
cd examples/03-demos && ./quick-demo.sh

# Try a complete app
cd examples/05-swarm-apps/rest-api-advanced
npm install && npm start

# Follow tutorials
cd examples/06-tutorials/getting-started
cat 01-first-swarm.md
```

---

## 🔧 Integration Patterns

### 🔄 CI/CD Integration

**GitHub Actions**:
```yaml
- name: AI Code Review
  run: |
    npx @sethdouglasford/claude-flow sparc run code-review \
      "$(git diff origin/main)" \
      --format github-comment
```

**Jenkins Pipeline**:
```groovy
stage('AI Testing') {
    steps {
        sh 'claude-flow sparc run tdd "${CHANGE_TARGET}" --ci-mode'
    }
}
```

### 🛠️ IDE Integration

**VS Code Integration**:
```bash
# Install as workspace tool
claude-flow init --vscode-integration

# Use in terminal
claude-flow sparc run code "Implement user service"
```

### 🐳 Docker & Kubernetes

**Containerized Development**:
```bash
# Run in Docker
docker run -v $(pwd):/workspace sethdford/claude-flow \
  swarm create "Containerized microservice"

# Kubernetes job
kubectl apply -f examples/k8s/claude-flow-job.yaml
```

---

## 🎛️ Advanced Configuration

### 🌐 Multi-Provider Support

```bash
# AWS Bedrock (Recommended for Enterprise)
claude-flow config set provider bedrock
claude-flow config set model claude-3-5-sonnet-20241022

# OpenAI
claude-flow config set provider openai  
claude-flow config set model gpt-4

# Anthropic Direct
claude-flow config set provider anthropic
claude-flow config set model claude-3-5-sonnet-20241022
```

### ⚡ Performance Tuning

```bash
# High-performance mode
claude-flow config set performance.parallel-agents 10
claude-flow config set performance.memory-cache true
claude-flow config set performance.async-processing true

# Resource limits
claude-flow config set limits.max-memory "4GB"
claude-flow config set limits.timeout 300
```

### 🔒 Enterprise Security

```bash
# Enable audit logging
claude-flow config set security.audit-log true
claude-flow config set security.log-level detailed

# Network restrictions
claude-flow config set security.allowed-hosts "internal.company.com"
claude-flow config set security.require-auth true
```

---

## 🏢 Enterprise Features

### 📊 Analytics & Reporting

- **Usage Analytics** - Track agent performance and resource utilization
- **Quality Metrics** - Code quality scores and improvement trends  
- **Cost Management** - Monitor API usage and optimize spend
- **Custom Dashboards** - Real-time visibility into development metrics

### 🛡️ Security & Compliance

- **Audit Trails** - Complete logging of all agent activities
- **Access Control** - Role-based permissions and authentication
- **Data Encryption** - End-to-end encryption for sensitive data
- **Compliance Reports** - SOC2, GDPR, HIPAA compliance support

### 🌐 Scalability

- **Distributed Processing** - Scale across multiple machines
- **Load Balancing** - Intelligent workload distribution
- **Resource Management** - Automatic scaling based on demand
- **High Availability** - Fault tolerance and disaster recovery

---

## 🛠️ Background Agent Mode

Run Claude Flow as a background service:

```bash
# Start as daemon
claude-flow start --daemon --port 3000

# API integration
curl -X POST http://localhost:3000/api/swarm \
  -H "Content-Type: application/json" \
  -d '{"task": "Create user service", "strategy": "parallel"}'

# Webhook integration
claude-flow config set webhooks.github true
claude-flow config set webhooks.slack true
```

**Use Cases:**
- **Code Review Bot** - Automatic PR reviews
- **CI/CD Integration** - Automated testing and deployment
- **Monitoring Agent** - Continuous system health checks
- **Documentation Bot** - Auto-generate docs on code changes

---

## 📚 Learning Resources

### 🎓 Tutorials

1. **[Getting Started](examples/06-tutorials/getting-started/)** - Your first swarm
2. **[SPARC Methodology](examples/06-tutorials/sparc/)** - Systematic development
3. **[Multi-Agent Coordination](examples/06-tutorials/workflows/)** - Advanced patterns
4. **[Enterprise Integration](docs/enterprise/)** - Production deployment

### 📖 Documentation

- **[API Reference](docs/api/)** - Complete API documentation
- **[Configuration Guide](docs/configuration/)** - Setup and customization
- **[Best Practices](docs/best-practices/)** - Proven patterns and techniques
- **[Troubleshooting](docs/troubleshooting/)** - Common issues and solutions

### 🎬 Video Tutorials

- **Quick Start Guide** - 5-minute introduction
- **SPARC in Action** - Complete development workflow
- **Enterprise Setup** - Production deployment guide
- **Advanced Patterns** - Expert tips and tricks

---

## 🤝 Community & Support

### 💬 Get Help

- **[GitHub Issues](https://github.com/sethdford/vibex-claude-code-flow/issues)** - Bug reports and feature requests
- **[Discussions](https://github.com/sethdford/vibex-claude-code-flow/discussions)** - Community Q&A
- **[Discord Server](https://discord.gg/claude-flow)** - Real-time chat support
- **[Documentation](https://claude-flow.dev)** - Comprehensive guides

### 🎯 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for:
- Code contributions
- Documentation improvements  
- Example submissions
- Bug reports and feature requests

### 📈 Roadmap

**Coming Soon:**
- Visual workflow designer
- More AI provider integrations
- Advanced debugging tools
- Mobile app for monitoring
- Plugin ecosystem

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[@ruvnet](https://github.com/ruvnet)** - Original creator and visionary
- **Anthropic** - Claude AI models that power the intelligence
- **Open Source Community** - Contributors and supporters
- **Early Adopters** - Feedback and real-world testing

---

<div align="center">

**Transform Your Development Workflow Today**

[Get Started](https://claude-flow.dev/docs/getting-started) • [Examples](examples/) • [API Docs](docs/api/) • [Community](https://discord.gg/claude-flow)

Made with ❤️ by the Claude Flow community

</div> 