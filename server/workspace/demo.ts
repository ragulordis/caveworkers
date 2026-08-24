export type WorkspaceTaskState = "Planning" | "In progress" | "Review" | "Complete";

export type WorkspaceOverview = {
  company: { id: string; name: string; description: string; industry: string; goals: string };
  employee: { id: string; name: string; role: string; status: "working"; model: string; currentTaskId: string; toolPermissions: string[] };
  messages: Array<{ id: string; sender: "user" | "employee" | "system"; content: string; createdAt: number; messageType: string; employeeName?: string; employeeKey?: string }>;
  tasks: Array<{ id: string; title: string; state: WorkspaceTaskState; progress: number; updatedAt: number; detail: string; tags: string[] }>;
  memory: Array<{ id: string; category: string; title: string; value: string }>;
  documents: Array<{ id: string; name: string; contentType: string; sizeBytes: number; createdAt: number }>;
  events: Array<{ id: string; action: string; summary: string; status: "started" | "completed"; createdAt: number }>;
};

const now = Date.now();

/**
 * A read-only product preview used until an authenticated company has persisted workspace data.
 * It intentionally stays outside the database; it is not customer data and is never inserted.
 */
export function getDemoWorkspace(): WorkspaceOverview {
  return {
    company: {
      id: "demo-company",
      name: "Helio Systems",
      description: "Enterprise infrastructure for reliable operations.",
      industry: "Enterprise SaaS",
      goals: "Build trustworthy infrastructure for enterprise teams.",
    },
    employee: {
      id: "employee-full-stack-developer",
      name: "Alex",
      role: "Full-Stack Developer",
      status: "working",
      model: "manus-managed-model",
      currentTaskId: "CW-042",
      toolPermissions: ["repository.read", "task.plan", "memory.read"],
    },
    messages: [
      { id: "message-1", sender: "system", content: "Handoff complete. Full-Stack Developer is assigned to the Authentication architecture review.", createdAt: now - 300_000, messageType: "handoff" },
      { id: "message-2", sender: "user", content: "Review the authentication architecture and flag anything that could slow down the Q3 enterprise release.", createdAt: now - 240_000, messageType: "task_assignment" },
      { id: "message-3", sender: "employee", content: "I’m tracing the sign-in flow, tenant boundaries, and service dependencies first.", createdAt: now - 180_000, messageType: "progress_report", employeeName: "Alex", employeeKey: "full-stack-developer" },
      { id: "message-4", sender: "employee", content: "I’ll perform a security review covering authentication, authorization, session management, secrets, rate limiting, and abuse cases. I will report evidence-backed findings before recommending remediation.", createdAt: now - 120_000, messageType: "task_assignment", employeeName: "Maya", employeeKey: "cybersecurity-analyst" },
    ],
    tasks: [
      { id: "CW-042", title: "Authentication architecture review", state: "In progress", progress: 62, updatedAt: now - 120_000, detail: "Trace identity boundaries and document release risks.", tags: ["security", "api"] },
      { id: "CW-041", title: "Map webhook retry strategy", state: "Planning", progress: 25, updatedAt: now - 2_280_000, detail: "Define durable retry semantics for event delivery.", tags: ["architecture"] },
      { id: "CW-038", title: "Tenant audit trail schema", state: "Review", progress: 86, updatedAt: now - 86_400_000, detail: "Review the event model with security and QA handoffs.", tags: ["database", "qa"] },
    ],
    memory: [
      { id: "memory-1", category: "Company context", title: "Enterprise release posture", value: "Security and auditability are release gates for Q3." },
      { id: "memory-2", category: "Technical decision", title: "Identity boundary", value: "Tenant claims are verified at the API gateway before service routing." },
      { id: "memory-3", category: "Project memory", title: "Atlas API", value: "Node.js, tRPC, MySQL and managed queues. Monorepo uses pnpm." },
      { id: "memory-4", category: "Technical constraint", title: "Release compatibility", value: "New services must retain the current enterprise SSO and audit event contracts." },
      { id: "memory-5", category: "Reference", title: "Architecture handbook", value: "Auth gateway and tenant isolation decision record, updated for Q3 planning." },
    ],
    documents: [],
    events: [
      { id: "event-1", action: "reviewed_authentication", summary: "Reviewed token refresh flow across 14 API endpoints.", status: "completed", createdAt: now - 120_000 },
      { id: "event-2", action: "recorded_decision", summary: "Recorded the tenant-claim gateway decision.", status: "completed", createdAt: now - 780_000 },
    ],
  };
}
