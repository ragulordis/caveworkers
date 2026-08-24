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
  status: mysqlEnum("status", ["idle", "thinking", "planning", "working", "waiting", "reviewing", "testing", "blocked", "completed", "error"]).default("idle").notNull(),
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
  type: mysqlEnum("type", ["technical_fact", "decision", "preference", "task_context", "project_context", "known_issue"]).notNull(),
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Message = typeof messages.$inferSelect;
