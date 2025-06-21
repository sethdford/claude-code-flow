import { IStrategy, DecompositionResult } from "./base.js";
import { TaskDefinition, SwarmObjective, TaskId } from "../types.js";
import { logger } from "../../core/logger.js";

/**
 * Testing Strategy - Comprehensive testing coordination with distributed validation
 * Based on the Testing Swarm Pattern from swarm documentation
 * 
 * Features:
 * - Test planning and strategy
 * - Test case generation
 * - Parallel test execution
 * - Results aggregation and reporting
 */
export class TestingStrategy implements IStrategy {
  async decomposeObjective(objective: SwarmObjective): Promise<DecompositionResult> {
    logger.info(`Decomposing testing objective: ${objective.description}`);
    
    const timestamp = Date.now();
    const tasks: TaskDefinition[] = [];
    const dependencies = new Map<string, string[]>();

    // 1. Test Planning and Strategy
    const testPlanningTaskId = `test-planning-${timestamp}`;
    tasks.push({
      id: {
        id: testPlanningTaskId,
        swarmId: objective.id,
        sequence: 1,
        priority: 1,
      } as TaskId,
      name: "Test Planning",
      description: "Create comprehensive test plan and strategy",
      status: "created",
      priority: "high",
      type: "testing",
      requirements: {
        capabilities: ["test_planning", "strategy_development", "risk_analysis"],
        tools: ["memory", "file_operations", "analysis_tools"],
        permissions: ["read", "write"],
      },
      constraints: {
        dependencies: [],
        dependents: [],
        conflicts: [],
      },
      input: { objective: objective.description, phase: "test_planning" },
      instructions: `
        Create test plan for: ${objective.description}
        
        Tasks:
        1. Analyze system requirements and identify test scope
        2. Define test objectives, priorities, and success criteria
        3. Identify risk areas and critical paths
        4. Store test strategy in Memory under 'test_strategy'
        5. Create TodoWrite tasks for test case generation
        
        Coordination:
        - Define test levels (unit, integration, system, acceptance)
        - Establish test environment requirements
        - Create test schedule and resource allocation
        - Document test entry/exit criteria
      `,
      context: { strategy: "testing", coordination: "test_planner" },
      createdAt: new Date(),
      updatedAt: new Date(),
      attempts: [],
      statusHistory: [],
    });

    // 2. Unit Test Generation (depends on test planning)
    const unitTestTaskId = `unit-tests-${timestamp}`;
    tasks.push({
      id: {
        id: unitTestTaskId,
        swarmId: objective.id,
        sequence: 2,
        priority: 2,
      } as TaskId,
      name: "Unit Test Generation",
      description: "Generate comprehensive unit tests",
      status: "created",
      priority: "normal",
      type: "testing",
      requirements: {
        capabilities: ["unit_testing", "test_automation", "code_analysis"],
        tools: ["memory", "test_frameworks", "code_analysis_tools"],
        permissions: ["read", "write", "create"],
      },
      constraints: {
        dependencies: [],
        dependents: [],
        conflicts: [],
      },
      input: { objective: objective.description, phase: "unit_testing" },
      instructions: `
        Generate unit tests for: ${objective.description}
        
        Tasks:
        1. Retrieve test strategy from Memory 'test_strategy'
        2. Analyze code structure and identify testable units
        3. Generate comprehensive unit test cases
        4. Store unit tests in Memory under 'unit_tests'
        5. Create TodoWrite tasks for test execution
        
        Coordination:
        - Ensure high code coverage (>90%)
        - Test edge cases and error conditions
        - Use appropriate mocking and stubbing
        - Follow testing best practices and patterns
      `,
      context: { strategy: "testing", coordination: "unit_test_generator" },
      createdAt: new Date(),
      updatedAt: new Date(),
      attempts: [],
      statusHistory: [],
    });

    // 3. Integration Test Generation (parallel with unit tests)
    const integrationTestTaskId = `integration-tests-${timestamp}`;
    tasks.push({
      id: {
        id: integrationTestTaskId,
        swarmId: objective.id,
        sequence: 2,
        priority: 2,
      } as TaskId,
      name: "Integration Test Generation",
      description: "Generate integration and API tests",
      status: "created",
      priority: "normal",
      type: "testing",
      requirements: {
        capabilities: ["integration_testing", "api_testing", "system_testing"],
        tools: ["memory", "test_frameworks", "api_tools"],
        permissions: ["read", "write", "create"],
      },
      constraints: {
        dependencies: [],
        dependents: [],
        conflicts: [],
      },
      input: { objective: objective.description, phase: "integration_testing" },
      instructions: `
        Generate integration tests for: ${objective.description}
        
        Tasks:
        1. Retrieve test strategy from Memory 'test_strategy'
        2. Identify integration points and API contracts
        3. Generate integration test scenarios
        4. Store integration tests in Memory under 'integration_tests'
        5. Create TodoWrite tasks for test data setup
        
        Coordination:
        - Test component interactions and data flow
        - Validate API contracts and error handling
        - Test database integration and transactions
        - Coordinate with unit test team for dependencies
      `,
      context: { strategy: "testing", coordination: "integration_test_generator" },
      createdAt: new Date(),
      updatedAt: new Date(),
      attempts: [],
      statusHistory: [],
    });

    // 4. Test Execution (depends on test generation)
    const testExecutionTaskId = `test-execution-${timestamp}`;
    tasks.push({
      id: {
        id: testExecutionTaskId,
        swarmId: objective.id,
        sequence: 3,
        priority: 1,
      } as TaskId,
      name: "Test Execution",
      description: "Execute all test suites in parallel",
      status: "created",
      priority: "high",
      type: "testing",
      requirements: {
        capabilities: ["test_execution", "parallel_testing", "test_automation"],
        tools: ["memory", "test_runners", "ci_cd_tools"],
        permissions: ["read", "write", "execute"],
      },
      constraints: {
        dependencies: [],
        dependents: [],
        conflicts: [],
      },
      input: { objective: objective.description, phase: "test_execution" },
      instructions: `
        Execute tests for: ${objective.description}
        
        Tasks:
        1. Retrieve all test cases from Memory
        2. Setup test environments and test data
        3. Execute unit and integration tests in parallel
        4. Store test results in Memory under 'test_results'
        5. Create TodoWrite tasks for result analysis
        
        Coordination:
        - Use parallel execution for independent test suites
        - Monitor test execution progress and resource usage
        - Handle test failures and retries
        - Collect performance metrics and coverage data
      `,
      context: { strategy: "testing", coordination: "test_executor" },
      createdAt: new Date(),
      updatedAt: new Date(),
      attempts: [],
      statusHistory: [],
    });

    // 5. Results Analysis and Reporting (depends on test execution)
    const resultsAnalysisTaskId = `results-analysis-${timestamp}`;
    tasks.push({
      id: {
        id: resultsAnalysisTaskId,
        swarmId: objective.id,
        sequence: 4,
        priority: 1,
      } as TaskId,
      name: "Results Analysis",
      description: "Analyze test results and generate reports",
      status: "created",
      priority: "high",
      type: "testing",
      requirements: {
        capabilities: ["result_analysis", "reporting", "quality_assessment"],
        tools: ["memory", "reporting_tools", "analysis_tools"],
        permissions: ["read", "write", "create"],
      },
      constraints: {
        dependencies: [],
        dependents: [],
        conflicts: [],
      },
      input: { objective: objective.description, phase: "results_analysis" },
      instructions: `
        Analyze test results for: ${objective.description}
        
        Tasks:
        1. Retrieve test results from Memory 'test_results'
        2. Analyze test coverage, pass/fail rates, and performance
        3. Identify patterns in test failures and quality issues
        4. Generate comprehensive test reports
        5. Store final analysis in Memory under 'test_analysis'
        
        Coordination:
        - Create executive summary for stakeholders
        - Identify areas requiring additional testing
        - Provide recommendations for quality improvements
        - Document lessons learned and best practices
      `,
      context: { strategy: "testing", coordination: "results_analyzer" },
      createdAt: new Date(),
      updatedAt: new Date(),
      attempts: [],
      statusHistory: [],
    });

    // Set up dependencies
    dependencies.set(unitTestTaskId, [testPlanningTaskId]);
    dependencies.set(integrationTestTaskId, [testPlanningTaskId]);
    dependencies.set(testExecutionTaskId, [unitTestTaskId, integrationTestTaskId]);
    dependencies.set(resultsAnalysisTaskId, [testExecutionTaskId]);

    logger.info(`Created ${tasks.length} testing tasks with dependencies`);
    
    return {
      tasks,
      dependencies,
      estimatedDuration: 60, // 1 hour for typical testing task
    };
  }
} 