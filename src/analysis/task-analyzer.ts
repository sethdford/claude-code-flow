import { logger } from "../core/logger.js";
import { getModelHierarchy } from "../config/model-config.js";
import { generateId } from "../utils/helpers.js";

export interface TaskComplexityAnalysis {
  taskId: string;
  title: string;
  description: string;
  complexityScore: number; // 1-10 scale
  complexityLevel: "trivial" | "simple" | "moderate" | "complex" | "expert";
  estimatedHours: number;
  riskFactors: string[];
  dependencies: string[];
  skillsRequired: string[];
  recommendedSubtasks: number;
  breakdownRecommendation: "none" | "optional" | "recommended" | "required";
  reasoning: string;
}

export interface SubtaskDefinition {
  id: string;
  title: string;
  description: string;
  type: "setup" | "implementation" | "testing" | "documentation" | "integration";
  priority: "low" | "medium" | "high" | "critical";
  estimatedHours: number;
  dependencies: string[];
  skillsRequired: string[];
  acceptanceCriteria: string[];
  notes?: string;
}

export interface TaskBreakdownResult {
  originalTask: {
    id: string;
    title: string;
    description: string;
  };
  analysis: TaskComplexityAnalysis;
  subtasks: SubtaskDefinition[];
  totalEstimatedHours: number;
  criticalPath: string[];
  recommendations: string[];
}

export class TaskAnalyzer {
  constructor() {
    // No need to store model config as a property since we use functions
  }

  /**
   * Analyze task complexity using AI
   */
  async analyzeComplexity(
    taskId: string,
    title: string,
    description: string,
    context?: {
      projectType?: string;
      techStack?: string[];
      teamSize?: number;
      timeline?: string;
    }
  ): Promise<TaskComplexityAnalysis> {
    logger.info(`Analyzing complexity for task: ${title}`);

    const prompt = this.buildComplexityAnalysisPrompt(title, description, context);
    
    try {
      const response = await this.callAI(prompt);
      const analysis = this.parseComplexityResponse(response, taskId, title, description);
      
      logger.info(`Task complexity analysis completed: ${analysis.complexityLevel} (${analysis.complexityScore}/10)`);
      return analysis;
    } catch (error) {
      logger.error("Error analyzing task complexity:", error);
      // Return fallback analysis
      return this.createFallbackAnalysis(taskId, title, description);
    }
  }

  /**
   * Break down a complex task into subtasks
   */
  async breakdownTask(
    taskId: string,
    title: string,
    description: string,
    targetSubtasks?: number,
    context?: {
      projectType?: string;
      techStack?: string[];
      constraints?: string[];
      preferences?: string[];
    }
  ): Promise<TaskBreakdownResult> {
    logger.info(`Breaking down task: ${title}`);

    // First analyze complexity
    const analysis = await this.analyzeComplexity(taskId, title, description, context);
    
    // Determine if breakdown is needed
    if (analysis.breakdownRecommendation === "none") {
      return {
        originalTask: { id: taskId, title, description },
        analysis,
        subtasks: [],
        totalEstimatedHours: analysis.estimatedHours,
        criticalPath: [taskId],
        recommendations: ["Task is simple enough to complete as-is"]
      };
    }

    const subtaskCount = targetSubtasks || analysis.recommendedSubtasks;
    const prompt = this.buildBreakdownPrompt(title, description, analysis, subtaskCount, context);
    
    try {
      const response = await this.callAI(prompt);
      const breakdown = this.parseBreakdownResponse(response, taskId, title, description, analysis);
      
      logger.info(`Task breakdown completed: ${breakdown.subtasks.length} subtasks created`);
      return breakdown;
    } catch (error) {
      logger.error("Error breaking down task:", error);
      // Return fallback breakdown
      return this.createFallbackBreakdown(taskId, title, description, analysis);
    }
  }

  /**
   * Analyze multiple tasks and recommend which ones need breakdown
   */
  async analyzeTaskList(
    tasks: Array<{
      id: string;
      title: string;
      description: string;
    }>,
    context?: {
      projectType?: string;
      techStack?: string[];
      teamExperience?: "junior" | "mid" | "senior" | "mixed";
    }
  ): Promise<{
    analyses: TaskComplexityAnalysis[];
    recommendations: {
      immediate: string[];
      optional: string[];
      defer: string[];
    };
    totalEstimatedHours: number;
  }> {
    logger.info(`Analyzing ${tasks.length} tasks for complexity`);

    const analyses: TaskComplexityAnalysis[] = [];
    
    // Analyze each task
    for (const task of tasks) {
      const analysis = await this.analyzeComplexity(task.id, task.title, task.description, context);
      analyses.push(analysis);
    }

    // Categorize recommendations
    const immediate = analyses
      .filter(a => a.breakdownRecommendation === "required")
      .map(a => a.taskId);
    
    const optional = analyses
      .filter(a => a.breakdownRecommendation === "recommended")
      .map(a => a.taskId);
    
    const defer = analyses
      .filter(a => a.breakdownRecommendation === "optional")
      .map(a => a.taskId);

    const totalEstimatedHours = analyses.reduce((sum, a) => sum + a.estimatedHours, 0);

    return {
      analyses,
      recommendations: { immediate, optional, defer },
      totalEstimatedHours
    };
  }

  private buildComplexityAnalysisPrompt(
    title: string,
    description: string,
    context?: any
  ): string {
    return `You are an expert software development task analyzer. Analyze the following task for complexity and provide a detailed assessment.

TASK TO ANALYZE:
Title: ${title}
Description: ${description}

${context ? `CONTEXT:
${context.projectType ? `Project Type: ${context.projectType}` : ''}
${context.techStack ? `Tech Stack: ${context.techStack.join(', ')}` : ''}
${context.teamSize ? `Team Size: ${context.teamSize}` : ''}
${context.timeline ? `Timeline: ${context.timeline}` : ''}` : ''}

Please provide a comprehensive analysis in the following JSON format:

{
  "complexityScore": <number 1-10>,
  "complexityLevel": "<trivial|simple|moderate|complex|expert>",
  "estimatedHours": <number>,
  "riskFactors": ["<risk1>", "<risk2>", ...],
  "dependencies": ["<dependency1>", "<dependency2>", ...],
  "skillsRequired": ["<skill1>", "<skill2>", ...],
  "recommendedSubtasks": <number>,
  "breakdownRecommendation": "<none|optional|recommended|required>",
  "reasoning": "<detailed explanation of complexity assessment>"
}

COMPLEXITY SCORING GUIDE:
- 1-2: Trivial (simple config changes, typo fixes)
- 3-4: Simple (single function implementation, basic UI changes)
- 5-6: Moderate (feature implementation, API integration)
- 7-8: Complex (system design, major refactoring)
- 9-10: Expert (architecture changes, performance optimization)

BREAKDOWN RECOMMENDATIONS:
- none: Task is simple enough to complete as-is
- optional: Could benefit from breakdown but not necessary
- recommended: Should be broken down for better management
- required: Too complex to complete without breakdown

Focus on practical development considerations including technical complexity, testing requirements, integration challenges, and potential blockers.`;
  }

  private buildBreakdownPrompt(
    title: string,
    description: string,
    analysis: TaskComplexityAnalysis,
    subtaskCount: number,
    context?: any
  ): string {
    return `You are an expert software development task breakdown specialist. Break down the following complex task into ${subtaskCount} well-defined subtasks.

ORIGINAL TASK:
Title: ${title}
Description: ${description}

COMPLEXITY ANALYSIS:
Complexity Level: ${analysis.complexityLevel}
Estimated Hours: ${analysis.estimatedHours}
Risk Factors: ${analysis.riskFactors.join(', ')}
Skills Required: ${analysis.skillsRequired.join(', ')}
Reasoning: ${analysis.reasoning}

${context ? `CONTEXT:
${context.projectType ? `Project Type: ${context.projectType}` : ''}
${context.techStack ? `Tech Stack: ${context.techStack.join(', ')}` : ''}
${context.constraints ? `Constraints: ${context.constraints.join(', ')}` : ''}
${context.preferences ? `Preferences: ${context.preferences.join(', ')}` : ''}` : ''}

Please break this down into ${subtaskCount} subtasks following software development best practices. Provide the breakdown in the following JSON format:

{
  "subtasks": [
    {
      "id": "<unique-id>",
      "title": "<clear, actionable title>",
      "description": "<detailed description>",
      "type": "<setup|implementation|testing|documentation|integration>",
      "priority": "<low|medium|high|critical>",
      "estimatedHours": <number>,
      "dependencies": ["<subtask-id1>", "<subtask-id2>", ...],
      "skillsRequired": ["<skill1>", "<skill2>", ...],
      "acceptanceCriteria": ["<criteria1>", "<criteria2>", ...],
      "notes": "<optional additional notes>"
    }
  ],
  "criticalPath": ["<subtask-id1>", "<subtask-id2>", ...],
  "recommendations": ["<recommendation1>", "<recommendation2>", ...]
}

SUBTASK BREAKDOWN GUIDELINES:
1. Start with setup/preparation tasks
2. Include implementation tasks with clear scope
3. Add testing tasks for quality assurance
4. Include documentation where needed
5. Consider integration and deployment
6. Ensure proper dependency ordering
7. Balance task sizes (avoid too small or too large)
8. Include acceptance criteria for each subtask
9. Consider parallel execution opportunities
10. Account for code review and feedback cycles

Make sure subtasks are:
- Independently testable
- Clearly defined with specific deliverables
- Appropriately sized (2-8 hours each typically)
- Properly sequenced with dependencies
- Include acceptance criteria for validation`;
  }

  private parseComplexityResponse(
    response: string,
    taskId: string,
    title: string,
    description: string
  ): TaskComplexityAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        taskId,
        title,
        description,
        complexityScore: Math.max(1, Math.min(10, parsed.complexityScore || 5)),
        complexityLevel: parsed.complexityLevel || "moderate",
        estimatedHours: Math.max(0.5, parsed.estimatedHours || 4),
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
        dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : [],
        skillsRequired: Array.isArray(parsed.skillsRequired) ? parsed.skillsRequired : [],
        recommendedSubtasks: Math.max(2, Math.min(10, parsed.recommendedSubtasks || 3)),
        breakdownRecommendation: parsed.breakdownRecommendation || "optional",
        reasoning: parsed.reasoning || "Complexity analysis completed"
      };
    } catch (error) {
      logger.error("Error parsing complexity response:", error);
      return this.createFallbackAnalysis(taskId, title, description);
    }
  }

  private parseBreakdownResponse(
    response: string,
    taskId: string,
    title: string,
    description: string,
    analysis: TaskComplexityAnalysis
  ): TaskBreakdownResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      const subtasks: SubtaskDefinition[] = (parsed.subtasks || []).map((st: any, index: number) => ({
        id: st.id || `${taskId}-subtask-${index + 1}`,
        title: st.title || `Subtask ${index + 1}`,
        description: st.description || "Subtask description",
        type: st.type || "implementation",
        priority: st.priority || "medium",
        estimatedHours: Math.max(0.5, st.estimatedHours || 2),
        dependencies: Array.isArray(st.dependencies) ? st.dependencies : [],
        skillsRequired: Array.isArray(st.skillsRequired) ? st.skillsRequired : [],
        acceptanceCriteria: Array.isArray(st.acceptanceCriteria) ? st.acceptanceCriteria : [],
        notes: st.notes
      }));

      const totalEstimatedHours = subtasks.reduce((sum, st) => sum + st.estimatedHours, 0);
      
      return {
        originalTask: { id: taskId, title, description },
        analysis,
        subtasks,
        totalEstimatedHours,
        criticalPath: Array.isArray(parsed.criticalPath) ? parsed.criticalPath : subtasks.map(st => st.id),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
      };
    } catch (error) {
      logger.error("Error parsing breakdown response:", error);
      return this.createFallbackBreakdown(taskId, title, description, analysis);
    }
  }

  private createFallbackAnalysis(taskId: string, title: string, description: string): TaskComplexityAnalysis {
    // Simple heuristic-based analysis
    const wordCount = description.split(/\s+/).length;
    const hasComplexKeywords = /\b(architecture|design|system|integration|performance|security|database|api|framework)\b/i.test(description);
    
    let complexityScore = 5; // Default moderate
    if (wordCount < 10) complexityScore = 3; // Simple
    if (wordCount > 50) complexityScore = 7; // Complex
    if (hasComplexKeywords) complexityScore += 2;
    
    complexityScore = Math.max(1, Math.min(10, complexityScore));
    
    const complexityLevel = 
      complexityScore <= 2 ? "trivial" :
      complexityScore <= 4 ? "simple" :
      complexityScore <= 6 ? "moderate" :
      complexityScore <= 8 ? "complex" : "expert";

    return {
      taskId,
      title,
      description,
      complexityScore,
      complexityLevel,
      estimatedHours: complexityScore * 2,
      riskFactors: hasComplexKeywords ? ["Technical complexity", "Integration challenges"] : [],
      dependencies: [],
      skillsRequired: hasComplexKeywords ? ["Technical expertise", "System design"] : ["Basic development"],
      recommendedSubtasks: Math.max(2, Math.min(6, Math.floor(complexityScore / 2))),
      breakdownRecommendation: complexityScore >= 7 ? "required" : complexityScore >= 5 ? "recommended" : "optional",
      reasoning: "Fallback analysis based on heuristics"
    };
  }

  private createFallbackBreakdown(
    taskId: string,
    title: string,
    description: string,
    analysis: TaskComplexityAnalysis
  ): TaskBreakdownResult {
    const subtasks: SubtaskDefinition[] = [
      {
        id: `${taskId}-setup`,
        title: "Setup and Preparation",
        description: `Prepare environment and dependencies for: ${title}`,
        type: "setup",
        priority: "high",
        estimatedHours: 1,
        dependencies: [],
        skillsRequired: ["Environment setup"],
        acceptanceCriteria: ["Development environment ready", "Dependencies installed"]
      },
      {
        id: `${taskId}-implementation`,
        title: "Core Implementation",
        description: `Implement main functionality for: ${title}`,
        type: "implementation",
        priority: "high",
        estimatedHours: Math.max(2, analysis.estimatedHours * 0.6),
        dependencies: [`${taskId}-setup`],
        skillsRequired: analysis.skillsRequired,
        acceptanceCriteria: ["Core functionality implemented", "Basic functionality working"]
      },
      {
        id: `${taskId}-testing`,
        title: "Testing and Validation",
        description: `Test and validate implementation for: ${title}`,
        type: "testing",
        priority: "medium",
        estimatedHours: Math.max(1, analysis.estimatedHours * 0.3),
        dependencies: [`${taskId}-implementation`],
        skillsRequired: ["Testing"],
        acceptanceCriteria: ["Tests passing", "Functionality validated"]
      }
    ];

    return {
      originalTask: { id: taskId, title, description },
      analysis,
      subtasks,
      totalEstimatedHours: subtasks.reduce((sum, st) => sum + st.estimatedHours, 0),
      criticalPath: subtasks.map(st => st.id),
      recommendations: ["Fallback breakdown created", "Consider reviewing and refining subtasks"]
    };
  }

  private async callAI(prompt: string): Promise<string> {
    // Use the model configuration to get the appropriate model
    const hierarchy = getModelHierarchy("development");
    const model = hierarchy.primary;
    
    // This is a placeholder - in a real implementation, you'd call the actual AI service
    // For now, we'll simulate with a mock response
    logger.debug("AI call simulated for task analysis");
    
    // In a real implementation, this would be:
    // return await aiService.complete(prompt, { model, maxTokens: 2000 });
    
    // Check if this is a breakdown prompt (contains "break down" or "subtasks")
    if (prompt.toLowerCase().includes("break down") || prompt.toLowerCase().includes("subtasks")) {
      // Mock breakdown response
      return JSON.stringify({
        subtasks: [
          {
            id: "auth-setup",
            title: "Setup Authentication Infrastructure",
            description: "Set up authentication middleware, JWT configuration, and password hashing utilities",
            type: "setup",
            priority: "high",
            estimatedHours: 2,
            dependencies: [],
            skillsRequired: ["Node.js", "JWT", "bcrypt"],
            acceptanceCriteria: [
              "JWT configuration is properly set up",
              "Password hashing utilities are implemented",
              "Authentication middleware is created"
            ]
          },
          {
            id: "auth-endpoints",
            title: "Implement Authentication Endpoints",
            description: "Create login, register, and logout API endpoints with proper validation",
            type: "implementation",
            priority: "high",
            estimatedHours: 3,
            dependencies: ["auth-setup"],
            skillsRequired: ["API development", "Validation", "Express.js"],
            acceptanceCriteria: [
              "Register endpoint validates and creates users",
              "Login endpoint authenticates and returns JWT",
              "Logout endpoint invalidates tokens properly"
            ]
          },
          {
            id: "auth-middleware",
            title: "Create Protected Route Middleware",
            description: "Implement middleware to protect routes and verify JWT tokens",
            type: "implementation",
            priority: "medium",
            estimatedHours: 2,
            dependencies: ["auth-endpoints"],
            skillsRequired: ["Middleware", "JWT verification", "Security"],
            acceptanceCriteria: [
              "Middleware verifies JWT tokens correctly",
              "Protected routes reject invalid tokens",
              "User context is properly extracted from tokens"
            ]
          },
          {
            id: "auth-testing",
            title: "Test Authentication System",
            description: "Write comprehensive tests for authentication flows and security",
            type: "testing",
            priority: "medium",
            estimatedHours: 1.5,
            dependencies: ["auth-middleware"],
            skillsRequired: ["Testing", "Security testing", "Jest/Mocha"],
            acceptanceCriteria: [
              "All authentication endpoints are tested",
              "Security edge cases are covered",
              "Integration tests verify complete flows"
            ]
          }
        ],
        criticalPath: ["auth-setup", "auth-endpoints", "auth-middleware", "auth-testing"],
        recommendations: [
          "Consider implementing refresh token mechanism for better security",
          "Add rate limiting to authentication endpoints",
          "Implement proper error handling and logging",
          "Consider adding 2FA support for enhanced security"
        ]
      });
    }
    
    // Mock complexity analysis response
    return JSON.stringify({
      complexityScore: 6,
      complexityLevel: "moderate",
      estimatedHours: 8,
      riskFactors: ["Integration complexity", "Testing requirements"],
      dependencies: ["Database setup", "API configuration"],
      skillsRequired: ["JavaScript/TypeScript", "API development", "Testing"],
      recommendedSubtasks: 4,
      breakdownRecommendation: "recommended",
      reasoning: "This task involves API development with database integration, which requires careful planning and testing. The complexity is moderate due to integration requirements."
    });
  }
} 