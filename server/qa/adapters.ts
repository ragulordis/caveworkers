export type QaToolKind = "framework" | "browser" | "rest" | "mobile" | "performance";
export type TestTool = { key: string; name: string; kind: QaToolKind; supports: string[]; requiresApproval: boolean };
export type CiAdapter = { key: string; startJob(input: { suiteName: string; environment: string }): Promise<{ jobId: string }>; getJob(jobId: string): Promise<{ status: "queued" | "running" | "passed" | "failed"; logs?: string; artifacts?: string[] }> };

export const testToolRegistry: TestTool[] = [
  { key: "pytest", name: "pytest", kind: "framework", supports: ["unit", "integration", "api", "regression"], requiresApproval: false },
  { key: "playwright", name: "Playwright", kind: "browser", supports: ["ui", "end_to_end", "regression"], requiresApproval: false },
  { key: "selenium", name: "Selenium", kind: "browser", supports: ["ui", "end_to_end"], requiresApproval: false },
  { key: "cypress", name: "Cypress", kind: "browser", supports: ["ui", "end_to_end", "regression"], requiresApproval: false },
  { key: "newman", name: "Postman/Newman", kind: "rest", supports: ["api", "integration", "security_regression"], requiresApproval: false },
  { key: "load-test", name: "Load test adapter", kind: "performance", supports: ["performance"], requiresApproval: true },
];

export function classifyQaFailure(input: { applicationEvidence?: boolean; testBroken?: boolean; environmentUnavailable?: boolean; dependencyUnavailable?: boolean; intermittent?: boolean }) {
  if (input.applicationEvidence) return "application_bug" as const;
  if (input.testBroken) return "broken_test" as const;
  if (input.environmentUnavailable) return "environment_failure" as const;
  if (input.dependencyUnavailable) return "dependency_problem" as const;
  if (input.intermittent) return "flaky_test" as const;
  return "none" as const;
}
