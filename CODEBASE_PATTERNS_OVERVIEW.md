# Claude-Flow Codebase Patterns Overview

## Overall Architecture

### Multi-Layered Design
1. **CLI Layer**: Command-line interface using Commander.js
2. **Core Layer**: Orchestrator, EventBus, Logger, Persistence  
3. **Service Layer**: Terminal Management, Memory Management, Coordination, MCP Integration
4. **Utility Layer**: Common types, errors, helpers, formatters

### Key Modules
- **cli**: CLI commands and UI components
- **core**: Core orchestration and system management
- **coordination**: Task scheduling, resource management, messaging
- **memory**: Multi-backend storage with SQLite/Markdown options
- **terminal**: Cross-platform terminal pool management
- **mcp**: Model Context Protocol server integration
- **swarm**: Multi-agent coordination and execution
- **enterprise**: Advanced features for enterprise deployment
- **task**: Task management and workflow engine
- **utils**: Shared utilities and type definitions

## Common Code Patterns and Conventions

### Import/Export Patterns
- **ALWAYS** use ES modules syntax (`import`/`export`), never CommonJS (`require`)
- **ALWAYS** include `.js` extension in relative imports (even for TypeScript files)
- Destructure imports when possible: `import { foo, bar } from "./module.js"`
- Export interfaces and types alongside implementations
- Use `export interface` for public APIs

Example:
```typescript
import { IEventBus } from "./core/event-bus.js";
import { ILogger } from "./core/logger.js";
import { SystemError, InitializationError } from "../utils/errors.js";
```

### Interface-First Design
- All major components have corresponding interfaces (prefixed with `I`)
- Examples: `IOrchestrator`, `IMemoryManager`, `ICoordinationManager`, `IEventBus`
- Interfaces define contracts before implementation

### Dependency Injection
- Constructor-based dependency injection throughout
- Dependencies passed as constructor parameters
- Enables testability and loose coupling

Example:
```typescript
constructor(
  private config: Config,
  private eventBus: IEventBus,
  private logger: ILogger,
) {
  // initialization
}
```

### Async/Await Patterns
- All async operations use async/await (no Promise chains)
- Proper error handling in try/catch blocks
- Timeout handling with Promise.race patterns
- Retry logic with exponential backoff

### Event-Driven Communication
- Central EventBus for component communication
- Strongly-typed events using SystemEvents enum
- Event handlers setup during initialization

## TypeScript Configuration

### Strict Mode Settings
- `strict: true` - All strict checks enabled
- `noImplicitAny: true` - No implicit any types
- `strictNullChecks: true` - Null/undefined checking
- `strictFunctionTypes: true` - Strict function type checking
- `noImplicitReturns: true` - All code paths must return

### Module Settings
- Target: ES2022
- Module: ES2022
- ModuleResolution: node
- ES module interop enabled
- Allow synthetic default imports

### ESLint Rules
- `prefer-const`: Always use const where possible
- `no-var`: Never use var
- `prefer-nullish-coalescing`: Use ?? operator
- `prefer-optional-chain`: Use ?. operator
- `no-floating-promises`: Handle all promises
- `quotes: ["error", "double"]`: Use double quotes
- `indent: ["error", 2]`: 2-space indentation
- `semi: ["error", "always"]`: Always use semicolons
- `comma-dangle: ["error", "always-multiline"]`: Trailing commas in multiline

## Error Handling Patterns

### Custom Error Hierarchy
- Base class: `ClaudeFlowError` extends Error
- Domain-specific errors extend base class
- All errors include code, message, and optional details

Example hierarchy:
```typescript
ClaudeFlowError
├── TerminalError
│   ├── TerminalSpawnError
│   └── TerminalCommandError
├── MemoryError
│   ├── MemoryBackendError
│   └── MemoryConflictError
├── CoordinationError
│   ├── DeadlockError
│   └── ResourceLockError
└── SystemError
    ├── InitializationError
    └── ShutdownError
```

### Error Handling Patterns
- Wrap operations in try/catch blocks
- Log errors with context
- Re-throw with additional context when needed
- Use custom error types for different scenarios

## Key Dependencies and Usage

### CLI & UI
- **Commander**: CLI framework for command parsing
- **chalk**: Terminal text styling
- **blessed**: Terminal UI components
- **inquirer**: Interactive prompts
- **ora**: Loading spinners

### Core Infrastructure
- **express**: HTTP server for APIs
- **ws**: WebSocket server
- **node-pty**: Terminal emulation
- **better-sqlite3**: SQLite database

### Utilities
- **nanoid**: Unique ID generation
- **p-queue**: Queue management
- **fs-extra**: Enhanced file operations
- **glob**: File pattern matching

### Development
- **TypeScript**: Type safety
- **ESLint**: Code linting
- **Jest**: Testing framework
- **ts-jest**: TypeScript testing
- **esbuild**: Fast bundling

## Common Patterns for Fixing Linting Errors

### Import Path Issues
- Add `.js` extension to all relative imports
- Use path aliases defined in tsconfig.json
- Ensure proper module resolution

### Type Safety Issues
- Add explicit types to function parameters
- Handle null/undefined with optional chaining
- Use type guards for runtime checks

### Async/Promise Issues
- Always await async functions
- Handle promise rejections
- Add proper return types to async functions

### Code Style Issues
- Use double quotes for strings
- Add semicolons to all statements
- Use 2-space indentation
- Add trailing commas in multiline objects/arrays

## Best Practices

1. **Always use interfaces** for public APIs
2. **Handle errors gracefully** with custom error types
3. **Log at appropriate levels** (debug, info, warn, error)
4. **Use event-driven patterns** for loose coupling
5. **Implement circuit breakers** for external dependencies
6. **Add retry logic** with exponential backoff
7. **Use TypeScript strict mode** for better type safety
8. **Follow ESLint rules** consistently
9. **Test with Jest** and maintain coverage
10. **Document with JSDoc** for public APIs

This overview should help in understanding the codebase patterns and fixing any linting errors that arise.