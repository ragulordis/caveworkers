import type { SpecialistKey } from "./specialists";

export type EmployeeTool = {
  permission: string;
  name: string;
  description: string;
  operation: "read" | "plan" | "analyze" | "execute" | "visualize";
  requiresApproval: boolean;
};

/**
 * Capability metadata for the four employee agents. This registry describes tools;
 * actual execution remains server-side and must be added behind the same permission key.
 */
export const employeeToolRegistry: Record<SpecialistKey, EmployeeTool[]> = {
  "full-stack-developer": [
    { permission: "repository.read", name: "Repository reader", description: "Inspect authorized repository files and structure.", operation: "read", requiresApproval: false },
    { permission: "task.plan", name: "Task planner", description: "Break an approved task into ordered implementation steps.", operation: "plan", requiresApproval: false },
    { permission: "memory.read", name: "Engineering memory", description: "Read relevant company and engineering memory scoped to the current tenant.", operation: "read", requiresApproval: false },
  ],
  "cybersecurity-analyst": [
    { permission: "repository.read", name: "Repository reader", description: "Inspect authorized repository files and security boundaries.", operation: "read", requiresApproval: false },
    { permission: "security.scan", name: "Security scanner", description: "Run approved non-destructive security checks against authorized artifacts.", operation: "analyze", requiresApproval: false },
    { permission: "logs.read", name: "Log reader", description: "Review authorized application and audit logs without exposing secrets.", operation: "read", requiresApproval: false },
    { permission: "configuration.read", name: "Configuration reader", description: "Inspect non-secret configuration and deployment settings.", operation: "read", requiresApproval: false },
  ],
  "data-analyst": [
    { permission: "data.read", name: "Data reader", description: "Read tenant-authorized datasets and metadata.", operation: "read", requiresApproval: false },
    { permission: "data.query", name: "Data query", description: "Run read-only queries against tenant-authorized data sources.", operation: "analyze", requiresApproval: false },
    { permission: "data.profile", name: "Data profiler", description: "Profile schema quality, missingness, duplicates, and outliers.", operation: "analyze", requiresApproval: false },
    { permission: "data.visualize", name: "Data visualizer", description: "Create analysis-ready visual summaries from authorized data.", operation: "visualize", requiresApproval: false },
  ],
  "qa-automation-engineer": [
    { permission: "repository.read", name: "Repository reader", description: "Inspect authorized source and test files.", operation: "read", requiresApproval: false },
    { permission: "test.plan", name: "Test planner", description: "Translate requirements into focused acceptance and regression coverage.", operation: "plan", requiresApproval: false },
    { permission: "test.run", name: "Test runner", description: "Run approved non-production test suites and collect evidence.", operation: "execute", requiresApproval: false },
    { permission: "api.test", name: "API tester", description: "Exercise authorized non-production API endpoints with bounded inputs.", operation: "execute", requiresApproval: false },
    { permission: "browser.test", name: "Browser tester", description: "Run approved browser workflows against authorized environments.", operation: "execute", requiresApproval: false },
    { permission: "artifact.read", name: "Artifact reader", description: "Read test reports, screenshots, traces, and build artifacts.", operation: "read", requiresApproval: false },
  ],
};

export function getAllowedEmployeeTools(employeeKey: SpecialistKey, permissions: string[]) {
  const allowed = new Set(permissions);
  return employeeToolRegistry[employeeKey].filter((tool) => allowed.has(tool.permission));
}

export function formatAllowedEmployeeTools(employeeKey: SpecialistKey, permissions: string[]) {
  const tools = getAllowedEmployeeTools(employeeKey, permissions);
  if (!tools.length) return "none";
  return tools.map((tool) => `${tool.name} (${tool.permission}; ${tool.operation}${tool.requiresApproval ? "; approval required" : ""})`).join(", ");
}
