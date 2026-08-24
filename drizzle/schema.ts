import {
  boolean,
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
  category: mysqlEnum("category", ["identity", "business_context", "products", "projects", "technology_stack", "infrastructure", "databases", "apis", "repositories", "policies", "goals", "constraints", "team"]).notNull(),
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

export const employeeMemories = mysqlTable("employeeMemories", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().references(() => companies.id),
  employeeId: int("employeeId").notNull().references(() => employees.id),
  projectId: int("projectId").references(() => projects.id),
  type: mysqlEnum("type", ["technical_fact", "decision", "preference", "task_context", "project_context", "known_issue", "security_architecture", "threat_model", "compliance", "accepted_risk", "security_finding", "security_incident"]).notNull(),
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type SecurityReview = typeof securityReviews.$inferSelect;
export type SecurityFinding = typeof securityFindings.$inferSelect;
