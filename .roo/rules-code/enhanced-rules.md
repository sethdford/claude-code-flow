Enhanced Code Generation Rules

## Overview
Based on reverse-engineering LLM client architecture, these enhanced rules implement hierarchical model strategies and context-aware code generation patterns.

## 1. Hierarchical Model Strategy

### Primary Model (High-Level Planning)
- **Role**: Complex reasoning, architecture decisions, problem decomposition
- **Use Cases**: 
  - System design and component relationships
  - Complex algorithm implementation
  - Security analysis and code review
  - Multi-file refactoring strategies

### Apply Model (Code Implementation)
- **Role**: Fast, precise code edits and simple implementations
- **Use Cases**:
  - Simple function implementations
  - Variable renaming and refactoring
  - Import statement management
  - Basic syntax fixes
- **Threshold**: Use for edits < 50 lines or straightforward implementations

### Review Model (Quality Assurance)
- **Role**: Code quality validation and optimization suggestions
- **Use Cases**:
  - Final code review before completion
  - Performance optimization analysis
  - Security vulnerability detection
  - Best practice compliance checking

## 2. Context-Aware Code Generation

### Smart Context Selection
- **Immediate Context**: Current file + directly imported files
- **Extended Context**: Files that import current file + test files
- **Project Context**: Package.json, config files, README
- **Semantic Context**: Files with similar functionality or naming patterns

## Implementation Priority

1. **Phase 1**: Implement hierarchical model strategy in swarm agents
2. **Phase 2**: Add context-aware file selection and chunking
3. **Phase 3**: Enhance error prevention and recovery mechanisms
4. **Phase 4**: Implement multi-agent coordination protocols
5. **Phase 5**: Add performance optimization and caching layers 