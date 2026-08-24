import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 120 }),
  goals: text("goals"),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const companyMembers = mysqlTable("companyMembers", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  userId: int("userId").notNull().references(() => users.id),
  role: mysqlEnum("role", ["owner", "member"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  key: varchar("key", { length: 80 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  role: varchar("role", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["idle", "thinking", "planning", "working", "waiting", "reviewing", "testing", "blocked", "completed", "error", "monitoring", "analyzing", "investigating", "warning", "resolved"]).default("idle").notNull(),
  model: varchar("model", { length: 160 }).notNull(),
  systemPromptKey: varchar("systemPromptKey", { length: 100 }).notNull(),
  temperature: int("temperature").default(20).notNull(),
  maxTokens: int("maxTokens").default(1200).notNull(),
  toolPermissions: json("toolPermissions").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const companyContext = mysqlTable("companyContext", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  category: mysqlEnum("category", ["identity", "business_context", "products", "projects", "technology_stack", "infrastructure", "databases", "apis", "repositories", "policies", "goals", "constraints", "team", "kpis", "reporting", "dashboards", "data_sources", "testing_standards", "release_workflow", "quality_risks", "critical_user_flows"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  value: text("value").notNull(),
  source: varchar("source", { length: 120 }).default("onboarding").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "paused", "completed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  projectId: int("projectId").references(() => projects.id),
  title: varchar("title", { length: 180 }).notNull(),
  visibility: mysqlEnum("visibility", ["company", "team", "private"]).default("company").notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  projectId: int("projectId").references(() => projects.id),
  assignedEmployeeId: int("assignedEmployeeId").references(() => employees.id),
  requestedByUserId: int("requestedByUserId").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["backlog", "planning", "in_progress", "waiting", "review", "completed", "blocked"]).default("backlog").notNull(),
  progress: int("progress").default(0).notNull(),
  resultSummary: text("resultSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => conversations.id),
  senderType: mysqlEnum("senderType", ["user", "employee", "system"]).notNull(),
  senderUserId: int("senderUserId").references(() => users.id),
  senderEmployeeId: int("senderEmployeeId").references(() => employees.id),
  content: text("content").notNull(),
  replyToMessageId: int("replyToMessageId"),
  messageType: mysqlEnum("messageType", ["message", "task_assignment", "task_update", "progress_report", "clarification", "recommendation", "escalation", "handoff"]).default("message").notNull(),
  visibility: mysqlEnum("visibility", ["company", "team", "private"]).default("company").notNull(),
  relatedTaskId: int("relatedTaskId").references(() => tasks.id),
  createdBy: varchar("createdBy", { length: 80 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const companyDocuments = mysqlTable("companyDocuments", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  uploadedByUserId: int("uploadedByUserId").notNull().references(() => users.id),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  contentType: varchar("contentType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("companyDocuments_companyId_createdAt_idx").on(table.companyId, table.createdAt)]);

export const taskSteps = mysqlTable("taskSteps", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull().references(() => tasks.id),
  orderIndex: int("orderIndex").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "active", "completed", "skipped", "blocked"]).default("pending").notNull(),
  resultSummary: text("resultSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const taskDependencies = mysqlTable("taskDependencies", {
  id: int("id").autoincrement().primaryKey(),
  parentTaskId: int("parentTaskId").notNull().references(() => tasks.id),
  childTaskId: int("childTaskId").notNull().references(() => tasks.id),
  dependencyType: mysqlEnum("dependencyType", ["blocks", "relates_to", "handoff"]).default("handoff").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const employeeMemories = mysqlTable("employeeMemories", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  projectId: int("projectId").references(() => projects.id),
  type: mysqlEnum("type", ["technical_fact", "decision", "preference", "task_context", "project_context", "known_issue", "security_architecture", "threat_model", "compliance", "accepted_risk", "security_finding", "security_incident", "dataset_metadata", "schema_definition", "kpi_definition", "reporting_convention", "analysis_finding", "dashboard_reference", "recurring_report", "test_suite", "regression_history", "recurring_bug", "testing_convention", "flaky_test", "important_user_flow", "quality_risk"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  value: text("value").notNull(),
  importance: int("importance").default(50).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const decisions = mysqlTable("decisions", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  taskId: int("taskId").references(() => tasks.id),
  employeeId: int("employeeId").references(() => employees.id),
  title: varchar("title", { length: 180 }).notNull(),
  rationale: text("rationale").notNull(),
  status: mysqlEnum("status", ["proposed", "accepted", "superseded"]).default("proposed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const activityEvents = mysqlTable("activityEvents", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  employeeId: int("employeeId").references(() => employees.id),
  taskId: int("taskId").references(() => tasks.id),
  action: varchar("action", { length: 160 }).notNull(),
  summary: text("summary").notNull(),
  status: mysqlEnum("status", ["started", "completed", "blocked", "failed"]).default("started").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const toolExecutions = mysqlTable("toolExecutions", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  taskId: int("taskId").references(() => tasks.id),
  toolName: varchar("toolName", { length: 100 }).notNull(),
  permission: varchar("permission", { length: 100 }).notNull(),
  inputSummary: text("inputSummary"),
  resultSummary: text("resultSummary"),
  status: mysqlEnum("status", ["requested", "running", "completed", "failed", "denied"]).default("requested").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const securityReviews = mysqlTable("securityReviews", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  projectId: int("projectId").references(() => projects.id),
  taskId: int("taskId").references(() => tasks.id),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  title: varchar("title", { length: 255 }).notNull(),
  reviewType: mysqlEnum("reviewType", ["security_assessment", "threat_model", "code_review", "api_review", "authentication_review", "authorization_review", "dependency_review", "infrastructure_review", "configuration_review", "incident_analysis", "verification"]).notNull(),
  status: mysqlEnum("status", ["planned", "analyzing", "reviewing", "waiting", "blocked", "completed"]).default("planned").notNull(),
  riskScore: int("riskScore").default(0).notNull(),
  summary: text("summary"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const securityFindings = mysqlTable("securityFindings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  reviewId: int("reviewId").notNull().references(() => securityReviews.id),
  taskId: int("taskId").references(() => tasks.id),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low", "informational"]).notNull(),
  confidence: mysqlEnum("confidence", ["confirmed", "likely", "potential", "insufficient_evidence"]).notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "remediation_in_progress", "resolved", "accepted_risk"]).default("open").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  impact: text("impact").notNull(),
  likelihood: varchar("likelihood", { length: 80 }).notNull(),
  evidence: text("evidence").notNull(),
  recommendation: text("recommendation").notNull(),
  remediation: text("remediation"),
  verification: text("verification"),
  requiresApproval: boolean("requiresApproval").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const securityRemediations = mysqlTable("securityRemediations", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  findingId: int("findingId").notNull().references(() => securityFindings.id),
  taskId: int("taskId").references(() => tasks.id),
  assignedEmployeeId: int("assignedEmployeeId").references(() => employees.id),
  status: mysqlEnum("status", ["requested", "in_progress", "ready_for_verification", "verified", "blocked"]).default("requested").notNull(),
  summary: text("summary").notNull(),
  verificationSummary: text("verificationSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const securityApprovals = mysqlTable("securityApprovals", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  reviewId: int("reviewId").references(() => securityReviews.id),
  findingId: int("findingId").references(() => securityFindings.id),
  requestedByEmployeeId: int("requestedByEmployeeId").notNull().references(() => employees.id),
  approvedByUserId: int("approvedByUserId").references(() => users.id),
  operation: varchar("operation", { length: 120 }).notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "declined"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export const securityToolPolicies = mysqlTable("securityToolPolicies", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  toolName: varchar("toolName", { length: 100 }).notNull(),
  canRead: boolean("canRead").default(false).notNull(),
  canExecute: boolean("canExecute").default(false).notNull(),
  canWrite: boolean("canWrite").default(false).notNull(),
  requiresApproval: boolean("requiresApproval").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const securityEvents = mysqlTable("securityEvents", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  employeeId: int("employeeId").references(() => employees.id),
  reviewId: int("reviewId").references(() => securityReviews.id),
  findingId: int("findingId").references(() => securityFindings.id),
  taskId: int("taskId").references(() => tasks.id),
  action: mysqlEnum("action", ["security_scan_started", "finding_created", "severity_changed", "developer_notified", "remediation_requested", "finding_resolved", "verification_completed", "approval_requested", "approval_resolved"]).notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const dataSources = mysqlTable("dataSources", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  name: varchar("name", { length: 180 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["csv", "excel", "sql_database", "rest_api", "json", "analytics_system", "data_warehouse"]).notNull(),
  status: mysqlEnum("status", ["connected", "pending", "unavailable", "needs_review"]).default("pending").notNull(),
  connectorKey: varchar("connectorKey", { length: 120 }).notNull(),
  schemaSummary: text("schemaSummary"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  lastProfiledAt: timestamp("lastProfiledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const dataSourcePermissions = mysqlTable("dataSourcePermissions", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  dataSourceId: int("dataSourceId").references(() => dataSources.id),
  canRead: boolean("canRead").default(false).notNull(),
  canQuery: boolean("canQuery").default(false).notNull(),
  canAnalyze: boolean("canAnalyze").default(false).notNull(),
  canWrite: boolean("canWrite").default(false).notNull(),
  requiresApproval: boolean("requiresApproval").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  taskId: int("taskId").references(() => tasks.id),
  dataSourceId: int("dataSourceId").references(() => dataSources.id),
  title: varchar("title", { length: 255 }).notNull(),
  question: text("question").notNull(),
  analysisType: mysqlEnum("analysisType", ["trend", "anomaly", "kpi", "customer", "revenue", "product", "funnel", "cohort", "experiment", "operational"]).notNull(),
  status: mysqlEnum("status", ["planned", "retrieving", "validating", "analyzing", "waiting", "blocked", "completed"]).default("planned").notNull(),
  comparisonPeriod: varchar("comparisonPeriod", { length: 160 }),
  dataQualityStatus: mysqlEnum("dataQualityStatus", ["unknown", "good", "warning", "insufficient"]).default("unknown").notNull(),
  dataQualitySummary: text("dataQualitySummary"),
  confidence: mysqlEnum("confidence", ["high", "medium", "low", "insufficient"]).default("medium").notNull(),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const analysisResults = mysqlTable("analysisResults", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull().references(() => analyses.id),
  resultType: mysqlEnum("resultType", ["fact", "observation", "inference", "hypothesis", "recommendation"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  evidence: text("evidence").notNull(),
  impact: text("impact"),
  confidence: mysqlEnum("confidence", ["high", "medium", "low", "insufficient"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const analysisVisualizations = mysqlTable("analysisVisualizations", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull().references(() => analyses.id),
  visualizationType: mysqlEnum("visualizationType", ["kpi", "table", "line", "bar", "funnel", "trend", "anomaly"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  data: json("data").$type<Record<string, unknown>>().notNull(),
  caption: text("caption"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const dataQualityChecks = mysqlTable("dataQualityChecks", {
  id: int("id").autoincrement().primaryKey(),
  analysisId: int("analysisId").notNull().references(() => analyses.id),
  checkType: mysqlEnum("checkType", ["missing_values", "duplicates", "invalid_values", "schema_change", "timestamp_quality", "outliers", "definition_consistency"]).notNull(),
  status: mysqlEnum("status", ["passed", "warning", "failed"]).notNull(),
  affectedPercent: int("affectedPercent").default(0).notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const analysisSchedules = mysqlTable("analysisSchedules", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  analysisType: mysqlEnum("analysisType", ["trend", "anomaly", "kpi", "customer", "revenue", "product", "funnel", "cohort", "experiment", "operational"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  cronExpression: varchar("cronExpression", { length: 100 }).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  status: mysqlEnum("status", ["draft", "active", "paused"]).default("draft").notNull(),
  prompt: text("prompt").notNull(),
  lastRunAt: timestamp("lastRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("analysisSchedules_taskUid_idx").on(table.scheduleCronTaskUid)]);

export const dataEvents = mysqlTable("dataEvents", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  employeeId: int("employeeId").references(() => employees.id),
  analysisId: int("analysisId").references(() => analyses.id),
  taskId: int("taskId").references(() => tasks.id),
  action: mysqlEnum("action", ["analysis_started", "data_quality_warning", "finding_created", "insight_shared", "developer_handoff", "security_handoff", "schedule_prepared", "analysis_completed"]).notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const qaTestPlans = mysqlTable("qaTestPlans", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  taskId: int("taskId").references(() => tasks.id),
  title: varchar("title", { length: 255 }).notNull(),
  featureDescription: text("featureDescription").notNull(),
  status: mysqlEnum("status", ["planned", "designing", "ready", "running", "blocked", "completed"]).default("planned").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const qaTestCases = mysqlTable("qaTestCases", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull().references(() => qaTestPlans.id),
  title: varchar("title", { length: 255 }).notNull(),
  testType: mysqlEnum("testType", ["unit", "integration", "api", "ui", "end_to_end", "regression", "smoke", "performance", "security_regression"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  preconditions: text("preconditions"),
  steps: text("steps").notNull(),
  expectedResult: text("expectedResult").notNull(),
  automationStatus: mysqlEnum("automationStatus", ["manual", "candidate", "automated", "flaky"]).default("candidate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const qaToolPolicies = mysqlTable("qaToolPolicies", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  toolName: varchar("toolName", { length: 120 }).notNull(),
  toolType: varchar("toolType", { length: 80 }).notNull(),
  canRead: boolean("canRead").default(false).notNull(),
  canExecute: boolean("canExecute").default(false).notNull(),
  canWrite: boolean("canWrite").default(false).notNull(),
  requiresApproval: boolean("requiresApproval").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const ciAdapters = mysqlTable("ciAdapters", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  name: varchar("name", { length: 160 }).notNull(),
  adapterKey: varchar("adapterKey", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["draft", "connected", "unavailable", "disabled"]).default("draft").notNull(),
  capabilities: json("capabilities").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const qaTestRuns = mysqlTable("qaTestRuns", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  planId: int("planId").references(() => qaTestPlans.id),
  taskId: int("taskId").references(() => tasks.id),
  toolName: varchar("toolName", { length: 120 }).notNull(),
  suiteName: varchar("suiteName", { length: 255 }).notNull(),
  environment: varchar("environment", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["queued", "running", "passed", "failed", "blocked", "cancelled"]).default("queued").notNull(),
  total: int("total").default(0).notNull(),
  passed: int("passed").default(0).notNull(),
  failed: int("failed").default(0).notNull(),
  skipped: int("skipped").default(0).notNull(),
  durationSeconds: int("durationSeconds").default(0).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const qaTestResults = mysqlTable("qaTestResults", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId").notNull().references(() => qaTestRuns.id),
  testCaseId: int("testCaseId").references(() => qaTestCases.id),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["passed", "failed", "skipped", "flaky", "environment_error"]).notNull(),
  failureClass: mysqlEnum("failureClass", ["application_bug", "broken_test", "environment_failure", "dependency_problem", "flaky_test", "none"]).default("none").notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const qaDefects = mysqlTable("qaDefects", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  runId: int("runId").references(() => qaTestRuns.id),
  taskId: int("taskId").references(() => tasks.id),
  reportedByEmployeeId: int("reportedByEmployeeId").notNull().references(() => employees.id),
  suggestedOwnerEmployeeId: int("suggestedOwnerEmployeeId").references(() => employees.id),
  defectKey: varchar("defectKey", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  severity: mysqlEnum("severity", ["blocker", "critical", "high", "medium", "low"]).notNull(),
  status: mysqlEnum("status", ["open", "triaged", "in_progress", "ready_for_verification", "verified", "closed", "wont_fix"]).default("open").notNull(),
  environment: varchar("environment", { length: 100 }).notNull(),
  stepsToReproduce: text("stepsToReproduce").notNull(),
  expectedResult: text("expectedResult").notNull(),
  actualResult: text("actualResult").notNull(),
  evidence: text("evidence").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const qaVerifications = mysqlTable("qaVerifications", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  defectId: int("defectId").references(() => qaDefects.id),
  runId: int("runId").references(() => qaTestRuns.id),
  taskId: int("taskId").references(() => tasks.id),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  status: mysqlEnum("status", ["pending", "verified", "failed", "blocked"]).default("pending").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const qaArtifacts = mysqlTable("qaArtifacts", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId").references(() => qaTestRuns.id),
  defectId: int("defectId").references(() => qaDefects.id),
  artifactType: mysqlEnum("artifactType", ["log", "screenshot", "trace", "report", "video", "response"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const qaEvents = mysqlTable("qaEvents", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  employeeId: int("employeeId").references(() => employees.id),
  testPlanId: int("testPlanId").references(() => qaTestPlans.id),
  runId: int("runId").references(() => qaTestRuns.id),
  defectId: int("defectId").references(() => qaDefects.id),
  taskId: int("taskId").references(() => tasks.id),
  action: mysqlEnum("action", ["plan_created", "run_started", "run_completed", "defect_created", "developer_notified", "security_regression_created", "data_regression_created", "verification_requested", "verification_completed", "permission_denied"]).notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type SecurityReview = typeof securityReviews.$inferSelect;
export type SecurityFinding = typeof securityFindings.$inferSelect;
export type DataSource = typeof dataSources.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type QaTestPlan = typeof qaTestPlans.$inferSelect;
export type QaTestRun = typeof qaTestRuns.$inferSelect;
export type QaDefect = typeof qaDefects.$inferSelect;
