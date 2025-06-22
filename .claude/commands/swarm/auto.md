# Auto Swarm Command

## Usage
```bash
claude-flow swarm "Any objective" --strategy auto
```

## Description
Automatically determines the best approach based on objective analysis. The system intelligently classifies your objective and selects the optimal strategy.

## Strategy Features
- Intelligent objective classification
- Dynamic strategy selection  
- Adaptive task decomposition
- Performance monitoring and adjustment

## Best Practices
- Use when unsure which strategy fits best
- Great for general purpose tasks
- Ideal for experimental objectives
- Perfect for learning and exploration

## Auto-Selection Logic
The system analyzes your objective for keywords and patterns:
- **Development keywords** → Development strategy
- **Research keywords** → Research strategy  
- **Performance keywords** → Optimization strategy
- **Testing keywords** → Testing strategy
- **Analysis keywords** → Analysis strategy
- **Maintenance keywords** → Maintenance strategy

## Example Objectives
- "Build a web application" → Development strategy
- "Research market trends" → Research strategy
- "Optimize database performance" → Optimization strategy
- "Create test suite" → Testing strategy 