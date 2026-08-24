import { and, desc, eq, or } from "drizzle-orm";
import { getDb, getPrimaryCompanyForUser } from "../db";
import { analyses, analysisResults, analysisSchedules, analysisVisualizations, companyContext, conversations, dataEvents, dataQualityChecks, dataSourcePermissions, dataSources, employeeMemories, employees, messages, taskDependencies, taskSteps, tasks } from "../../drizzle/schema";
import { dataAnalystPersona } from "../agents/personas/dataAnalyst";

export const analysisWorkflowSteps = [
  "Understand metric", "Identify comparison period", "Retrieve relevant datasets", "Validate data quality", "Analyze trends", "Segment results", "Identify anomalies", "Produce findings", "Generate recommendations", "Communicate findings to team",
];

export type AnalysisType = "trend" | "anomaly" | "kpi" | "customer" | "revenue" | "product" | "funnel" | "cohort" | "experiment" | "operational";
export type ResultType = "fact" | "observation" | "inference" | "hypothesis" | "recommendation";

export function buildDataHandoff(input: { teammate: "full-stack-developer" | "cybersecurity-analyst"; title: string; evidence: string; confidence: string }) {
  const teammate = input.teammate === "full-stack-developer" ? "Alex" : "Maya";
  const request = input.teammate === "full-stack-developer" ? "Please check whether a technical release or endpoint change correlates with this result." : "Please check whether this pattern is consistent with authentication abuse, fraud, or another security signal.";
  return {
    analystMessage: `${teammate}, I recorded ${input.title}. Evidence: ${input.evidence} Confidence: ${input.confidence}. ${request}`,
    teammateMessage: input.teammate === "full-stack-developer" ? "I’ll investigate the technical change window and return the implementation context to Noor." : "I’ll assess the security signal and return evidence or limitations to Noor.",
  };
}

function emptyDashboard() {
  return {
    analyst: { name: dataAnalystPersona.name, role: dataAnalystPersona.role, status: "Monitoring", currentAnalysis: "Awaiting a governed data source", kpiStatus: "No source connected", latestFinding: "No evidence has been recorded yet" },
    sources: [] as Array<{ id: string; name: string; sourceType: string; status: string; schemaSummary: string }>,
    activeAnalysis: null as { id: string; title: string; status: string; confidence: string; dataQualityStatus: string; dataQualitySummary: string } | null,
    results: [] as Array<{ id: string; resultType: ResultType; title: string; content: string; evidence: string; impact: string; confidence: string }>,
    visualizations: [] as Array<{ id: string; visualizationType: string; title: string; data: Record<string, unknown>; caption: string }>,
    qualityChecks: [] as Array<{ id: string; checkType: string; status: string; affectedPercent: number; summary: string }>,
    events: [] as Array<{ id: string; action: string; summary: string; createdAt: number }>,
    schedule: { status: "Foundation ready", detail: "Schedules remain drafts until an authorized deployed heartbeat is configured." },
  };
}

async function requireCompany(userId: number) {
  const company = await getPrimaryCompanyForUser(userId);
  if (!company) throw new Error("No company workspace is available for this user");
  return company;
}

export async function ensureDataAnalyst(companyId: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const existing = (await db.select().from(employees).where(and(eq(employees.companyId, companyId), eq(employees.key, "data-analyst"))).limit(1))[0];
  if (existing) return existing;
  const result = await db.insert(employees).values({ companyId, key: "data-analyst", name: dataAnalystPersona.name, role: dataAnalystPersona.role, status: "monitoring", model: dataAnalystPersona.modelConfig.model, systemPromptKey: dataAnalystPersona.systemPromptKey, temperature: 10, maxTokens: dataAnalystPersona.modelConfig.maxTokens, toolPermissions: [...dataAnalystPersona.modelConfig.toolPermissions] });
  const employeeId = Number((result as unknown as { insertId: number }).insertId);
  await db.insert(dataSourcePermissions).values({ employeeId, canRead: true, canQuery: true, canAnalyze: true, canWrite: false, requiresApproval: true });
  return (await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1))[0]!;
}

export async function getDataInsightsForUser(userId?: number) {
  if (!userId) return emptyDashboard();
  const db = await getDb(); if (!db) return emptyDashboard(); const company = await getPrimaryCompanyForUser(userId); if (!company) return emptyDashboard(); const analyst = await ensureDataAnalyst(company.id);
  const [sources, analysisRows, events, schedules] = await Promise.all([
    db.select().from(dataSources).where(eq(dataSources.companyId, company.id)).orderBy(desc(dataSources.updatedAt)),
    db.select().from(analyses).where(eq(analyses.companyId, company.id)).orderBy(desc(analyses.updatedAt)),
    db.select().from(dataEvents).where(eq(dataEvents.companyId, company.id)).orderBy(desc(dataEvents.createdAt)).limit(12),
    db.select().from(analysisSchedules).where(eq(analysisSchedules.companyId, company.id)).orderBy(desc(analysisSchedules.updatedAt)).limit(1),
  ]);
  const active = analysisRows.find((analysis) => analysis.status !== "completed") ?? analysisRows[0];
  const [resultRows, visualizationRows, checkRows] = active ? await Promise.all([
    db.select().from(analysisResults).where(eq(analysisResults.analysisId, active.id)),
    db.select().from(analysisVisualizations).where(eq(analysisVisualizations.analysisId, active.id)),
    db.select().from(dataQualityChecks).where(eq(dataQualityChecks.analysisId, active.id)),
  ]) : [[], [], []];
  const latestFinding = resultRows.find((result) => ["fact", "observation", "inference"].includes(result.resultType));
  return { analyst: { name: analyst.name, role: analyst.role, status: analyst.status, currentAnalysis: active?.title ?? "Awaiting a governed data source", kpiStatus: active ? `${active.confidence} confidence` : "No source connected", latestFinding: latestFinding?.title ?? "No evidence has been recorded yet" }, sources: sources.map((source) => ({ id: String(source.id), name: source.name, sourceType: source.sourceType, status: source.status, schemaSummary: source.schemaSummary ?? "Schema not profiled" })), activeAnalysis: active ? { id: `AN-${active.id}`, title: active.title, status: active.status, confidence: active.confidence, dataQualityStatus: active.dataQualityStatus, dataQualitySummary: active.dataQualitySummary ?? "Quality validation has not been recorded yet." } : null, results: resultRows.map((result) => ({ id: String(result.id), resultType: result.resultType, title: result.title, content: result.content, evidence: result.evidence, impact: result.impact ?? "", confidence: result.confidence })), visualizations: visualizationRows.map((visualization) => ({ id: String(visualization.id), visualizationType: visualization.visualizationType, title: visualization.title, data: visualization.data, caption: visualization.caption ?? "" })), qualityChecks: checkRows.map((check) => ({ id: String(check.id), checkType: check.checkType, status: check.status, affectedPercent: check.affectedPercent, summary: check.summary })), events: events.map((event) => ({ id: String(event.id), action: event.action, summary: event.summary, createdAt: event.createdAt.getTime() })), schedule: schedules[0] ? { status: schedules[0].status, detail: `${schedules[0].title} is stored as a ${schedules[0].status} schedule foundation.` } : { status: "Foundation ready", detail: "Schedules remain drafts until an authorized deployed heartbeat is configured." } };
}

export async function registerDataSourceForUser(userId: number, input: { name: string; sourceType: "csv" | "excel" | "sql_database" | "rest_api" | "json" | "analytics_system" | "data_warehouse"; connectorKey: string; schemaSummary?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const analyst = await ensureDataAnalyst(company.id);
  const result = await db.insert(dataSources).values({ companyId: company.id, name: input.name, sourceType: input.sourceType, connectorKey: input.connectorKey, schemaSummary: input.schemaSummary, status: "pending" });
  const sourceId = Number((result as unknown as { insertId: number }).insertId); await db.insert(dataSourcePermissions).values({ employeeId: analyst.id, dataSourceId: sourceId, canRead: true, canQuery: true, canAnalyze: true, canWrite: false, requiresApproval: true });
  return { sourceId, status: "pending" as const };
}

export async function createAnalysisForUser(userId: number, input: { title: string; question: string; analysisType: AnalysisType; dataSourceId?: number; comparisonPeriod?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const analyst = await ensureDataAnalyst(company.id);
  if (input.dataSourceId) { const source = (await db.select().from(dataSources).where(and(eq(dataSources.id, input.dataSourceId), eq(dataSources.companyId, company.id))).limit(1))[0]; if (!source) throw new Error("Data source was not found in this company workspace"); }
  return db.transaction(async (tx) => {
    const task = await tx.insert(tasks).values({ companyId: company.id, assignedEmployeeId: analyst.id, requestedByUserId: userId, title: input.title, description: input.question, status: "planning", progress: 0 });
    const taskId = Number((task as unknown as { insertId: number }).insertId);
    await tx.insert(taskSteps).values(analysisWorkflowSteps.map((title, orderIndex) => ({ taskId, orderIndex: orderIndex + 1, title, status: orderIndex === 0 ? "active" as const : "pending" as const })));
    const created = await tx.insert(analyses).values({ companyId: company.id, employeeId: analyst.id, taskId, dataSourceId: input.dataSourceId, title: input.title, question: input.question, analysisType: input.analysisType, status: "retrieving", comparisonPeriod: input.comparisonPeriod, dataQualityStatus: "unknown", confidence: "insufficient" });
    const analysisId = Number((created as unknown as { insertId: number }).insertId);
    await tx.insert(dataEvents).values({ companyId: company.id, employeeId: analyst.id, analysisId, taskId, action: "analysis_started", summary: `Started ${input.title}.` });
    const conversation = (await tx.select().from(conversations).where(eq(conversations.companyId, company.id)).limit(1))[0]; if (conversation) await tx.insert(messages).values({ conversationId: conversation.id, senderType: "employee", senderEmployeeId: analyst.id, content: dataAnalystPersona.opening, messageType: "task_assignment", relatedTaskId: taskId, createdBy: "employee:data-analyst" });
    return { analysisId, taskId };
  });
}

export async function recordAnalysisResultForUser(userId: number, input: { analysisId: number; resultType: ResultType; title: string; content: string; evidence: string; impact?: string; confidence: "high" | "medium" | "low" | "insufficient" }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const analysis = (await db.select().from(analyses).where(and(eq(analyses.id, input.analysisId), eq(analyses.companyId, company.id))).limit(1))[0]; if (!analysis) throw new Error("Analysis was not found in this company workspace");
  const result = await db.insert(analysisResults).values({ analysisId: analysis.id, resultType: input.resultType, title: input.title, content: input.content, evidence: input.evidence, impact: input.impact, confidence: input.confidence }); const resultId = Number((result as unknown as { insertId: number }).insertId);
  await db.update(analyses).set({ status: "analyzing", confidence: input.confidence }).where(eq(analyses.id, analysis.id)); await db.insert(dataEvents).values({ companyId: company.id, employeeId: analysis.employeeId, analysisId: analysis.id, taskId: analysis.taskId, action: "finding_created", summary: `${input.resultType}: ${input.title}` }); return { resultId };
}

export async function recordVisualizationForUser(userId: number, input: { analysisId: number; visualizationType: "kpi" | "table" | "line" | "bar" | "funnel" | "trend" | "anomaly"; title: string; data: Record<string, unknown>; caption?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const analysis = (await db.select().from(analyses).where(and(eq(analyses.id, input.analysisId), eq(analyses.companyId, company.id))).limit(1))[0]; if (!analysis) throw new Error("Analysis was not found in this company workspace");
  const result = await db.insert(analysisVisualizations).values({ analysisId: analysis.id, visualizationType: input.visualizationType, title: input.title, data: input.data, caption: input.caption }); return { visualizationId: Number((result as unknown as { insertId: number }).insertId) };
}

export async function storeDataMemoryForUser(userId: number, input: { type: "dataset_metadata" | "schema_definition" | "kpi_definition" | "reporting_convention" | "analysis_finding" | "dashboard_reference" | "recurring_report"; title: string; value: string; importance?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const analyst = await ensureDataAnalyst(company.id); const result = await db.insert(employeeMemories).values({ companyId: company.id, employeeId: analyst.id, type: input.type, title: input.title, value: input.value, importance: input.importance ?? 50 }); return { memoryId: Number((result as unknown as { insertId: number }).insertId) };
}

export async function storeSharedDataMemoryForUser(userId: number, input: { category: "kpis" | "reporting" | "dashboards" | "data_sources"; title: string; value: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const result = await db.insert(companyContext).values({ companyId: company.id, category: input.category, title: input.title, value: input.value, source: "data-analyst" }); return { contextId: Number((result as unknown as { insertId: number }).insertId) };
}

export async function linkAnalysisDependencyForUser(userId: number, input: { analysisId: number; dependentTaskId: number; dependencyType: "blocks" | "relates_to" | "handoff" }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const analysis = (await db.select().from(analyses).where(and(eq(analyses.id, input.analysisId), eq(analyses.companyId, company.id))).limit(1))[0]; if (!analysis?.taskId) throw new Error("Analysis task was not found in this company workspace"); const task = (await db.select().from(tasks).where(and(eq(tasks.id, input.dependentTaskId), eq(tasks.companyId, company.id))).limit(1))[0]; if (!task) throw new Error("Dependent task was not found in this company workspace"); const result = await db.insert(taskDependencies).values({ parentTaskId: analysis.taskId, childTaskId: task.id, dependencyType: input.dependencyType }); return { dependencyId: Number((result as unknown as { insertId: number }).insertId) };
}

export async function recordDataQualityForUser(userId: number, input: { analysisId: number; checkType: "missing_values" | "duplicates" | "invalid_values" | "schema_change" | "timestamp_quality" | "outliers" | "definition_consistency"; status: "passed" | "warning" | "failed"; affectedPercent: number; summary: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const analysis = (await db.select().from(analyses).where(and(eq(analyses.id, input.analysisId), eq(analyses.companyId, company.id))).limit(1))[0]; if (!analysis) throw new Error("Analysis was not found in this company workspace");
  const result = await db.insert(dataQualityChecks).values({ analysisId: analysis.id, checkType: input.checkType, status: input.status, affectedPercent: input.affectedPercent, summary: input.summary }); const checkId = Number((result as unknown as { insertId: number }).insertId); const quality = input.status === "passed" ? "good" : input.status === "warning" ? "warning" : "insufficient"; await db.update(analyses).set({ dataQualityStatus: quality, dataQualitySummary: input.summary, confidence: quality === "insufficient" ? "low" : analysis.confidence }).where(eq(analyses.id, analysis.id)); if (input.status !== "passed") await db.insert(dataEvents).values({ companyId: company.id, employeeId: analysis.employeeId, analysisId: analysis.id, taskId: analysis.taskId, action: "data_quality_warning", summary: input.summary }); return { checkId, quality };
}

export async function handoffAnalysisForUser(userId: number, input: { analysisId: number; teammate: "full-stack-developer" | "cybersecurity-analyst"; title: string; evidence: string; confidence: "high" | "medium" | "low" | "insufficient" }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const analysis = (await db.select().from(analyses).where(and(eq(analyses.id, input.analysisId), eq(analyses.companyId, company.id))).limit(1))[0]; if (!analysis?.taskId) throw new Error("Analysis task was not found in this company workspace");
  const analysisTaskId = analysis.taskId;
  const [analyst, teammate, conversation] = await Promise.all([ensureDataAnalyst(company.id), db.select().from(employees).where(and(eq(employees.companyId, company.id), eq(employees.key, input.teammate))).limit(1).then((rows) => rows[0]), db.select().from(conversations).where(eq(conversations.companyId, company.id)).limit(1).then((rows) => rows[0])]); if (!teammate || !conversation) throw new Error("Requested teammate or shared conversation is unavailable"); const handoff = buildDataHandoff(input);
  let dependentTaskId = 0; await db.transaction(async (tx) => { const createdTask = await tx.insert(tasks).values({ companyId: company.id, assignedEmployeeId: teammate.id, requestedByUserId: userId, title: `Investigate: ${input.title}`, description: input.evidence, status: "planning", progress: 0 }); dependentTaskId = Number((createdTask as unknown as { insertId: number }).insertId); await tx.insert(taskDependencies).values({ parentTaskId: analysisTaskId, childTaskId: dependentTaskId, dependencyType: "handoff" }); await tx.insert(messages).values([{ conversationId: conversation.id, senderType: "employee", senderEmployeeId: analyst.id, content: handoff.analystMessage, messageType: "handoff", relatedTaskId: analysisTaskId, createdBy: "employee:data-analyst" }, { conversationId: conversation.id, senderType: "employee", senderEmployeeId: teammate.id, content: handoff.teammateMessage, messageType: "task_update", relatedTaskId: dependentTaskId, createdBy: `employee:${input.teammate}` }]); await tx.insert(dataEvents).values({ companyId: company.id, employeeId: analyst.id, analysisId: analysis.id, taskId: dependentTaskId, action: input.teammate === "full-stack-developer" ? "developer_handoff" : "security_handoff", summary: `Shared ${input.title} with ${teammate.name}.` }); }); return { teammateName: teammate.name, dependentTaskId };
}

export async function prepareAnalysisScheduleForUser(userId: number, input: { title: string; analysisType: AnalysisType; cronExpression: string; prompt: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const analyst = await ensureDataAnalyst(company.id); const result = await db.insert(analysisSchedules).values({ companyId: company.id, employeeId: analyst.id, title: input.title, analysisType: input.analysisType, cronExpression: input.cronExpression, prompt: input.prompt, status: "draft" }); const scheduleId = Number((result as unknown as { insertId: number }).insertId); await db.insert(dataEvents).values({ companyId: company.id, employeeId: analyst.id, action: "schedule_prepared", summary: `Prepared draft schedule: ${input.title}.` }); return { scheduleId, status: "draft" as const };
}

export async function getRelevantDataContextForUser(userId: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not available"); const company = await requireCompany(userId); const analyst = await ensureDataAnalyst(company.id); const [context, memory, sources] = await Promise.all([db.select().from(companyContext).where(eq(companyContext.companyId, company.id)), db.select().from(employeeMemories).where(and(eq(employeeMemories.companyId, company.id), eq(employeeMemories.employeeId, analyst.id))), db.select().from(dataSources).where(eq(dataSources.companyId, company.id))]); return { companyContext: context.filter((item) => ["business_context", "products", "goals", "team", "constraints", "technology_stack", "kpis", "reporting", "dashboards", "data_sources"].includes(item.category)), employeeMemory: memory.filter((item) => ["dataset_metadata", "schema_definition", "kpi_definition", "reporting_convention", "analysis_finding", "dashboard_reference", "recurring_report"].includes(item.type)), dataSources: sources.map((source) => ({ id: source.id, name: source.name, sourceType: source.sourceType, status: source.status })) };
}
