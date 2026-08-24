import { and, desc, eq } from "drizzle-orm";
import { getDb, getPrimaryCompanyForUser } from "../db";
import { companyContext, conversations, employeeMemories, employees, messages, securityApprovals, securityEvents, securityFindings, securityRemediations, securityReviews, securityToolPolicies, taskSteps, tasks } from "../../drizzle/schema";
import { cybersecurityAnalystPersona } from "../agents/personas/cybersecurityAnalyst";

export const securityReviewSteps = [
  "Understand architecture", "Identify attack surface", "Review authentication", "Review authorization", "Review input validation", "Review sensitive data handling", "Review logging", "Review dependencies", "Assign severity", "Produce remediation recommendations", "Coordinate with developer", "Verify remediation",
];

export function buildDeveloperHandoff(input: { findingTitle: string; severity: string; recommendation: string }) {
  return {
    analystMessage: `Alex, I identified a ${input.severity} security finding: ${input.findingTitle}. Recommendation: ${input.recommendation} Please inspect the affected boundary and prepare a remediation update for verification.`,
    developerMessage: `I’ll inspect the affected implementation boundary, prepare the remediation, and return it to Maya for verification.`,
  };
}

type ReviewType = "security_assessment" | "threat_model" | "code_review" | "api_review" | "authentication_review" | "authorization_review" | "dependency_review" | "infrastructure_review" | "configuration_review" | "incident_analysis" | "verification";
type FindingSeverity = "critical" | "high" | "medium" | "low" | "informational";
type FindingConfidence = "confirmed" | "likely" | "potential" | "insufficient_evidence";

export type SecurityDashboard = {
  analyst: { name: string; role: string; status: string; currentTask: string; riskLevel: string; latestFinding: string };
  securityStatus: "Healthy" | "Attention" | "Elevated";
  riskScore: number;
  openFindings: { critical: number; high: number; medium: number; low: number; informational: number };
  activeReview: { id: string; title: string; status: string; riskScore: number } | null;
  findings: Array<{ id: string; severity: FindingSeverity; confidence: FindingConfidence; status: string; title: string; impact: string; evidence: string; recommendation: string }>;
  events: Array<{ id: string; action: string; summary: string; createdAt: number }>;
  pendingRemediation: number;
  lastScan: number | null;
  toolPolicies: Array<{ toolName: string; canRead: boolean; canExecute: boolean; canWrite: boolean; requiresApproval: boolean }>;
  context: Array<{ title: string; value: string }>;
};

function demoSecurityDashboard(): SecurityDashboard {
  const now = Date.now();
  return {
    analyst: { name: "Maya", role: "Cybersecurity Analyst", status: "Analyzing", currentTask: "Authentication API security review", riskLevel: "Moderate", latestFinding: "Session renewal policy requires verification" },
    securityStatus: "Healthy", riskScore: 24,
    openFindings: { critical: 0, high: 0, medium: 2, low: 1, informational: 1 },
    activeReview: { id: "SEC-014", title: "Authentication API security review", status: "Analyzing", riskScore: 24 },
    findings: [
      { id: "F-021", severity: "medium", confidence: "likely", status: "open", title: "Session renewal policy requires verification", impact: "Unexpected token lifetime could widen the replay window.", evidence: "Refresh-token rotation policy is not documented in the available architecture context.", recommendation: "Confirm rotation, reuse detection, and expiry behaviour before release." },
      { id: "F-022", severity: "low", confidence: "potential", status: "acknowledged", title: "Audit log retention needs ownership", impact: "Insufficient retention could limit incident reconstruction.", evidence: "No retention owner was captured in company context.", recommendation: "Record the audit retention period and operational owner." },
    ],
    events: [
      { id: "security-event-1", action: "security_scan_started", summary: "Started authentication API security review.", createdAt: now - 18 * 60_000 },
      { id: "security-event-2", action: "developer_notified", summary: "Asked Alex to confirm the refresh-token lifecycle.", createdAt: now - 7 * 60_000 },
    ],
    pendingRemediation: 1, lastScan: now - 18 * 60_000,
    toolPolicies: [
      { toolName: "repository", canRead: true, canExecute: false, canWrite: false, requiresApproval: false },
      { toolName: "dependency_scanner", canRead: true, canExecute: true, canWrite: false, requiresApproval: false },
      { toolName: "http_api_tester", canRead: true, canExecute: true, canWrite: false, requiresApproval: true },
    ],
    context: [{ title: "Authentication architecture", value: "Tenant claims are verified at the API gateway." }, { title: "Release posture", value: "Security and auditability are release gates for Q3." }],
  };
}

async function requireCompany(userId: number) {
  const company = await getPrimaryCompanyForUser(userId);
  if (!company) throw new Error("No company workspace is available for this user");
  return company;
}

export async function ensureSecurityAnalyst(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = (await db.select().from(employees).where(and(eq(employees.companyId, companyId), eq(employees.key, "cybersecurity-analyst"))).limit(1))[0];
  if (existing) return existing;
  const result = await db.insert(employees).values({ companyId, key: "cybersecurity-analyst", name: cybersecurityAnalystPersona.name, role: cybersecurityAnalystPersona.role, status: "monitoring", model: cybersecurityAnalystPersona.modelConfig.model, systemPromptKey: cybersecurityAnalystPersona.systemPromptKey, temperature: 10, maxTokens: cybersecurityAnalystPersona.modelConfig.maxTokens, toolPermissions: [...cybersecurityAnalystPersona.modelConfig.toolPermissions] });
  const employeeId = Number((result as unknown as { insertId: number }).insertId);
  await db.insert(securityToolPolicies).values([
    { employeeId, toolName: "repository", canRead: true, canExecute: false, canWrite: false, requiresApproval: false },
    { employeeId, toolName: "dependency_scanner", canRead: true, canExecute: true, canWrite: false, requiresApproval: false },
    { employeeId, toolName: "http_api_tester", canRead: true, canExecute: true, canWrite: false, requiresApproval: true },
    { employeeId, toolName: "production", canRead: false, canExecute: false, canWrite: false, requiresApproval: true },
  ]);
  return (await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1))[0]!;
}

export async function getSecurityDashboardForUser(userId?: number): Promise<SecurityDashboard> {
  if (!userId) return demoSecurityDashboard();
  const db = await getDb();
  if (!db) return demoSecurityDashboard();
  const company = await getPrimaryCompanyForUser(userId);
  if (!company) return demoSecurityDashboard();
  const analyst = await ensureSecurityAnalyst(company.id);
  const [reviews, findings, remediations, events, policies, context, taskRows] = await Promise.all([
    db.select().from(securityReviews).where(eq(securityReviews.companyId, company.id)).orderBy(desc(securityReviews.updatedAt)),
    db.select().from(securityFindings).where(eq(securityFindings.companyId, company.id)).orderBy(desc(securityFindings.updatedAt)),
    db.select().from(securityRemediations).where(eq(securityRemediations.companyId, company.id)),
    db.select().from(securityEvents).where(eq(securityEvents.companyId, company.id)).orderBy(desc(securityEvents.createdAt)).limit(16),
    db.select().from(securityToolPolicies).where(eq(securityToolPolicies.employeeId, analyst.id)),
    db.select().from(companyContext).where(eq(companyContext.companyId, company.id)).limit(12),
    db.select().from(tasks).where(and(eq(tasks.companyId, company.id), eq(tasks.assignedEmployeeId, analyst.id))).orderBy(desc(tasks.updatedAt)).limit(1),
  ]);
  const open = findings.filter((finding) => !["resolved", "accepted_risk"].includes(finding.status));
  const counts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
  open.forEach((finding) => { counts[finding.severity] += 1; });
  const riskScore = Math.min(100, counts.critical * 50 + counts.high * 25 + counts.medium * 10 + counts.low * 3);
  const activeReview = reviews.find((review) => review.status !== "completed") ?? null;
  const latestFinding = open[0];
  return { analyst: { name: analyst.name, role: analyst.role, status: analyst.status, currentTask: taskRows[0]?.title ?? activeReview?.title ?? "Monitoring company context", riskLevel: riskScore >= 60 ? "High" : riskScore >= 30 ? "Moderate" : "Low", latestFinding: latestFinding?.title ?? "No open findings" }, securityStatus: riskScore >= 60 ? "Elevated" : riskScore >= 30 ? "Attention" : "Healthy", riskScore, openFindings: counts, activeReview: activeReview ? { id: `SEC-${activeReview.id}`, title: activeReview.title, status: activeReview.status, riskScore: activeReview.riskScore } : null, findings: findings.map((finding) => ({ id: `F-${finding.id}`, severity: finding.severity, confidence: finding.confidence, status: finding.status, title: finding.title, impact: finding.impact, evidence: finding.evidence, recommendation: finding.recommendation })), events: events.map((event) => ({ id: String(event.id), action: event.action, summary: event.summary, createdAt: event.createdAt.getTime() })), pendingRemediation: remediations.filter((remediation) => !["verified"].includes(remediation.status)).length, lastScan: events.find((event) => event.action === "security_scan_started")?.createdAt.getTime() ?? null, toolPolicies: policies.map((policy) => ({ toolName: policy.toolName, canRead: policy.canRead, canExecute: policy.canExecute, canWrite: policy.canWrite, requiresApproval: policy.requiresApproval })), context: context.filter((item) => ["infrastructure", "databases", "apis", "policies", "constraints", "technology_stack"].includes(item.category)).map((item) => ({ title: item.title, value: item.value })) };
}

export async function createSecurityReviewForUser(userId: number, input: { title: string; reviewType: ReviewType; description?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const company = await requireCompany(userId); const analyst = await ensureSecurityAnalyst(company.id);
  const developer = (await db.select().from(employees).where(and(eq(employees.companyId, company.id), eq(employees.key, "full-stack-developer"))).limit(1))[0];
  return db.transaction(async (tx) => {
    const taskResult = await tx.insert(tasks).values({ companyId: company.id, assignedEmployeeId: analyst.id, requestedByUserId: userId, title: input.title, description: input.description, status: "planning", progress: 0 });
    const taskId = Number((taskResult as unknown as { insertId: number }).insertId);
    await tx.insert(taskSteps).values(securityReviewSteps.map((title, orderIndex) => ({ taskId, orderIndex: orderIndex + 1, title, status: orderIndex === 0 ? "active" as const : "pending" as const })));
    const reviewResult = await tx.insert(securityReviews).values({ companyId: company.id, taskId, employeeId: analyst.id, title: input.title, reviewType: input.reviewType, status: "analyzing", riskScore: 0, summary: input.description, startedAt: new Date() });
    const reviewId = Number((reviewResult as unknown as { insertId: number }).insertId);
    await tx.insert(securityEvents).values({ companyId: company.id, employeeId: analyst.id, reviewId, taskId, action: "security_scan_started", summary: `Started ${input.title}.` });
    const conversation = (await tx.select().from(conversations).where(eq(conversations.companyId, company.id)).limit(1))[0];
    if (conversation) await tx.insert(messages).values({ conversationId: conversation.id, senderType: "employee", senderEmployeeId: analyst.id, content: `${cybersecurityAnalystPersona.opening} I will coordinate remediation with ${developer?.name ?? "the Full-Stack Developer"}.`, messageType: "task_assignment", relatedTaskId: taskId, createdBy: "employee:cybersecurity-analyst" });
    return { reviewId, taskId, employeeId: analyst.id };
  });
}

export async function createSecurityFindingForUser(userId: number, input: { reviewId: number; severity: FindingSeverity; confidence: FindingConfidence; title: string; description: string; impact: string; likelihood: string; evidence: string; recommendation: string; requiresApproval?: boolean }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId);
  const review = (await db.select().from(securityReviews).where(and(eq(securityReviews.id, input.reviewId), eq(securityReviews.companyId, company.id))).limit(1))[0]; if (!review) throw new Error("Security review was not found in this company workspace");
  const result = await db.insert(securityFindings).values({ companyId: company.id, reviewId: review.id, taskId: review.taskId, severity: input.severity, confidence: input.confidence, title: input.title, description: input.description, impact: input.impact, likelihood: input.likelihood, evidence: input.evidence, recommendation: input.recommendation, requiresApproval: input.requiresApproval ?? false });
  const findingId = Number((result as unknown as { insertId: number }).insertId); await db.insert(securityEvents).values({ companyId: company.id, employeeId: review.employeeId, reviewId: review.id, findingId, taskId: review.taskId, action: "finding_created", summary: `${input.confidence.replaceAll("_", " ")}: ${input.title}` });
  return { findingId };
}

export async function handoffFindingToDeveloperForUser(userId: number, input: { findingId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId);
  const finding = (await db.select().from(securityFindings).where(and(eq(securityFindings.id, input.findingId), eq(securityFindings.companyId, company.id))).limit(1))[0];
  if (!finding) throw new Error("Security finding was not found in this company workspace");
  const [analyst, developer, conversation] = await Promise.all([
    ensureSecurityAnalyst(company.id),
    db.select().from(employees).where(and(eq(employees.companyId, company.id), eq(employees.key, "full-stack-developer"))).limit(1).then((rows) => rows[0]),
    db.select().from(conversations).where(eq(conversations.companyId, company.id)).limit(1).then((rows) => rows[0]),
  ]);
  if (!developer || !conversation) throw new Error("Developer or shared conversation is unavailable");
  return db.transaction(async (tx) => {
    const handoffTask = await tx.insert(tasks).values({ companyId: company.id, assignedEmployeeId: developer.id, requestedByUserId: userId, title: `Remediate: ${finding.title}`, description: finding.recommendation, status: "planning", progress: 0 });
    const taskId = Number((handoffTask as unknown as { insertId: number }).insertId);
    const handoff = buildDeveloperHandoff({ findingTitle: finding.title, severity: finding.severity, recommendation: finding.recommendation });
    await tx.insert(messages).values([
      { conversationId: conversation.id, senderType: "employee", senderEmployeeId: analyst.id, content: handoff.analystMessage, messageType: "handoff", relatedTaskId: taskId, createdBy: "employee:cybersecurity-analyst" },
      { conversationId: conversation.id, senderType: "employee", senderEmployeeId: developer.id, content: handoff.developerMessage, messageType: "task_update", relatedTaskId: taskId, createdBy: "employee:full-stack-developer" },
    ]);
    await tx.insert(securityRemediations).values({ companyId: company.id, findingId: finding.id, taskId, assignedEmployeeId: developer.id, status: "requested", summary: finding.recommendation });
    await tx.insert(securityEvents).values([
      { companyId: company.id, employeeId: analyst.id, findingId: finding.id, taskId, action: "developer_notified", summary: `Notified ${developer.name} about ${finding.title}.` },
      { companyId: company.id, employeeId: analyst.id, findingId: finding.id, taskId, action: "remediation_requested", summary: `Requested remediation for ${finding.title}.` },
    ]);
    return { taskId, developerName: developer.name, analystName: analyst.name };
  });
}

export async function verifySecurityRemediationForUser(userId: number, input: { findingId: number; verificationSummary: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId);
  const finding = (await db.select().from(securityFindings).where(and(eq(securityFindings.id, input.findingId), eq(securityFindings.companyId, company.id))).limit(1))[0];
  if (!finding) throw new Error("Security finding was not found in this company workspace");
  const analyst = await ensureSecurityAnalyst(company.id);
  await db.transaction(async (tx) => {
    await tx.update(securityFindings).set({ status: "resolved", verification: input.verificationSummary }).where(eq(securityFindings.id, finding.id));
    const remediation = (await tx.select().from(securityRemediations).where(eq(securityRemediations.findingId, finding.id)).limit(1))[0];
    if (remediation) await tx.update(securityRemediations).set({ status: "verified", verificationSummary: input.verificationSummary }).where(eq(securityRemediations.id, remediation.id));
    else await tx.insert(securityRemediations).values({ companyId: company.id, findingId: finding.id, status: "verified", summary: "Remediation verified directly by the Cybersecurity Analyst.", verificationSummary: input.verificationSummary });
    await tx.insert(securityEvents).values({ companyId: company.id, employeeId: analyst.id, findingId: finding.id, action: "verification_completed", summary: `Verified remediation for ${finding.title}.` });
  });
  return { findingId: finding.id, status: "resolved" as const, verificationSummary: input.verificationSummary };
}

export async function requestSecurityOperationForUser(userId: number, input: { toolName: string; operation: string; reason: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const analyst = await ensureSecurityAnalyst(company.id);
  const policy = (await db.select().from(securityToolPolicies).where(and(eq(securityToolPolicies.employeeId, analyst.id), eq(securityToolPolicies.toolName, input.toolName))).limit(1))[0];
  if (!policy || (!policy.canExecute && !policy.canWrite)) throw new Error("This security operation is not permitted for the Cybersecurity Analyst");
  const result = await db.insert(securityApprovals).values({ companyId: company.id, requestedByEmployeeId: analyst.id, operation: input.operation, reason: input.reason, status: "pending" });
  const approvalId = Number((result as unknown as { insertId: number }).insertId); await db.insert(securityEvents).values({ companyId: company.id, employeeId: analyst.id, action: "approval_requested", summary: `Approval requested for ${input.operation}.` }); return { approvalId, status: "pending" as const, requiresApproval: true };
}

export async function getRelevantSecurityContextForUser(userId: number) {
  const company = await requireCompany(userId); const db = await getDb(); if (!db) throw new Error("Database is not available"); const analyst = await ensureSecurityAnalyst(company.id);
  const [sharedContext, memory] = await Promise.all([db.select().from(companyContext).where(eq(companyContext.companyId, company.id)), db.select().from(employeeMemories).where(and(eq(employeeMemories.companyId, company.id), eq(employeeMemories.employeeId, analyst.id)))]);
  return { companyContext: sharedContext.filter((item) => ["infrastructure", "databases", "apis", "policies", "constraints", "technology_stack"].includes(item.category)), employeeMemory: memory.filter((item) => ["security_architecture", "threat_model", "compliance", "accepted_risk", "security_finding", "security_incident"].includes(item.type)) };
}
