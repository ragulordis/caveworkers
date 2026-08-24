import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { activityEvents, companies, companyContext, companyMembers, conversations, dataSourcePermissions, employees, InsertUser, messages, qaToolPolicies, securityToolPolicies, tasks, users } from "../drizzle/schema";
import { dataAnalystPersona } from "./agents/personas/dataAnalyst";
import { qaEngineerPersona } from "./agents/personas/qaEngineer";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const key of ["name", "email", "loginMethod"] as const) { if (user[key] !== undefined) { values[key] = user[key]; updateSet[key] = user[key] ?? null; } }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

/** Repository boundary for user-to-company authorization. */
export async function getCompanyForUser(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ company: companies, member: companyMembers }).from(companyMembers).innerJoin(companies, eq(companyMembers.companyId, companies.id)).where(and(eq(companyMembers.userId, userId), eq(companyMembers.companyId, companyId))).limit(1);
  return result[0];
}

export async function listCompanyContext(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyContext).where(eq(companyContext.companyId, companyId)).orderBy(desc(companyContext.updatedAt));
}

export async function listCompanyTasks(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.companyId, companyId)).orderBy(desc(tasks.updatedAt));
}

export type CreateCompanyWorkspaceInput = {
  name: string;
  description?: string;
  industry?: string;
  goals?: string;
  teamContext?: string;
  technologyStack: string[];
};

export function getCreatedRecordId(result: unknown) {
  const candidate = Array.isArray(result) ? result[0] : result;
  const insertId = candidate && typeof candidate === "object" && "insertId" in candidate ? (candidate as { insertId?: unknown }).insertId : undefined;
  const numericId = typeof insertId === "bigint" ? Number(insertId) : Number(insertId);
  return Number.isFinite(numericId) && numericId > 0 ? numericId : undefined;
}

export async function resolveCreatedTaskId(result: unknown, findCreatedTask: () => Promise<{ id: number } | undefined>) {
  return getCreatedRecordId(result) ?? (await findCreatedTask())?.id;
}

/** Creates the initial company, membership, context, employee, and shared engineering conversation atomically. */
export async function createCompanyWorkspace(userId: number, input: CreateCompanyWorkspaceInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  return db.transaction(async (tx) => {
    const createdCompany = await tx.insert(companies).values({
      name: input.name,
      description: input.description,
      industry: input.industry,
      goals: input.goals,
      createdByUserId: userId,
    });
    const companyId = getCreatedRecordId(createdCompany) ?? (await tx.select().from(companies).where(and(eq(companies.createdByUserId, userId), eq(companies.name, input.name))).orderBy(desc(companies.id)).limit(1))[0]?.id;
    if (!companyId) throw new Error("Unable to resolve the newly created company workspace");

    const resolveEmployeeId = async (created: unknown, key: string) => {
      const directId = getCreatedRecordId(created);
      if (directId) return directId;
      const employee = (await tx.select().from(employees).where(and(eq(employees.companyId, companyId), eq(employees.key, key))).limit(1))[0];
      if (!employee) throw new Error(`Unable to resolve the ${key} employee`);
      return employee.id;
    };

    await tx.insert(companyMembers).values({ companyId, userId, role: "owner" });
    await tx.insert(companyContext).values([
      { companyId, category: "identity", title: "Company name", value: input.name, source: "onboarding" },
      ...(input.description ? [{ companyId, category: "business_context" as const, title: "Company description", value: input.description, source: "onboarding" }] : []),
      ...(input.goals ? [{ companyId, category: "goals" as const, title: "Business goals", value: input.goals, source: "onboarding" }] : []),
      ...(input.teamContext ? [{ companyId, category: "team" as const, title: "Team context", value: input.teamContext, source: "onboarding" }] : []),
      ...input.technologyStack.map((technology) => ({ companyId, category: "technology_stack" as const, title: technology, value: technology, source: "onboarding" })),
    ]);

    const createdEmployee = await tx.insert(employees).values({
      companyId,
      key: "full-stack-developer",
      name: "Alex",
      role: "Full-Stack Developer",
      status: "idle",
      model: "openrouter-configured-model",
      systemPromptKey: "full-stack-developer-v1",
      temperature: 20,
      maxTokens: 1200,
      toolPermissions: ["repository.read", "task.plan", "memory.read"],
    });
    const employeeId = await resolveEmployeeId(createdEmployee, "full-stack-developer");
    const createdSecurityEmployee = await tx.insert(employees).values({
      companyId,
      key: "cybersecurity-analyst",
      name: "Maya",
      role: "Cybersecurity Analyst",
      status: "monitoring",
      model: "openrouter-configured-model",
      systemPromptKey: "cybersecurity-analyst-v1",
      temperature: 10,
      maxTokens: 1200,
      toolPermissions: ["repository.read", "security.scan", "logs.read", "configuration.read"],
    });
    const securityEmployeeId = await resolveEmployeeId(createdSecurityEmployee, "cybersecurity-analyst");
    await tx.insert(securityToolPolicies).values([
      { employeeId: securityEmployeeId, toolName: "repository", canRead: true, canExecute: false, canWrite: false, requiresApproval: false },
      { employeeId: securityEmployeeId, toolName: "dependency_scanner", canRead: true, canExecute: true, canWrite: false, requiresApproval: false },
      { employeeId: securityEmployeeId, toolName: "http_api_tester", canRead: true, canExecute: true, canWrite: false, requiresApproval: true },
      { employeeId: securityEmployeeId, toolName: "production", canRead: false, canExecute: false, canWrite: false, requiresApproval: true },
    ]);
    const createdDataEmployee = await tx.insert(employees).values({
      companyId,
      key: "data-analyst",
      name: dataAnalystPersona.name,
      role: dataAnalystPersona.role,
      status: "monitoring",
      model: dataAnalystPersona.modelConfig.model,
      systemPromptKey: dataAnalystPersona.systemPromptKey,
      temperature: 10,
      maxTokens: dataAnalystPersona.modelConfig.maxTokens,
      toolPermissions: [...dataAnalystPersona.modelConfig.toolPermissions],
    });
    const dataEmployeeId = await resolveEmployeeId(createdDataEmployee, "data-analyst");
    await tx.insert(dataSourcePermissions).values({ employeeId: dataEmployeeId, canRead: true, canQuery: true, canAnalyze: true, canWrite: false, requiresApproval: true });
    const createdQaEmployee = await tx.insert(employees).values({ companyId, key: "qa-automation-engineer", name: qaEngineerPersona.name, role: qaEngineerPersona.role, status: "monitoring", model: qaEngineerPersona.modelConfig.model, systemPromptKey: qaEngineerPersona.systemPromptKey, temperature: 10, maxTokens: qaEngineerPersona.modelConfig.maxTokens, toolPermissions: [...qaEngineerPersona.modelConfig.toolPermissions] });
    const qaEmployeeId = await resolveEmployeeId(createdQaEmployee, "qa-automation-engineer");
    await tx.insert(qaToolPolicies).values([
      { employeeId: qaEmployeeId, toolName: "test_runner", toolType: "framework", canRead: true, canExecute: true, canWrite: false, requiresApproval: false },
      { employeeId: qaEmployeeId, toolName: "browser_automation", toolType: "browser", canRead: true, canExecute: true, canWrite: false, requiresApproval: false },
      { employeeId: qaEmployeeId, toolName: "api_client", toolType: "rest", canRead: true, canExecute: true, canWrite: false, requiresApproval: false },
      { employeeId: qaEmployeeId, toolName: "production_load_test", toolType: "performance", canRead: false, canExecute: false, canWrite: false, requiresApproval: true },
    ]);
    const createdConversation = await tx.insert(conversations).values({ companyId, title: "Engineering", visibility: "company", createdByUserId: userId });
    const conversationId = getCreatedRecordId(createdConversation) ?? (await tx.select().from(conversations).where(and(eq(conversations.companyId, companyId), eq(conversations.title, "Engineering"))).limit(1))[0]?.id;
    if (!conversationId) throw new Error("Unable to resolve the shared engineering conversation");

    return { companyId, employeeId, securityEmployeeId, dataEmployeeId, qaEmployeeId, conversationId };
  });
}

export async function getPrimaryCompanyForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ company: companies }).from(companyMembers).innerJoin(companies, eq(companyMembers.companyId, companies.id)).where(eq(companyMembers.userId, userId)).orderBy(asc(companyMembers.createdAt)).limit(1);
  return result[0]?.company;
}

/** Ensures a signed-in user has an initial private workspace before any company-scoped operation. */
export async function provisionWhenMissing<T>(findExisting: () => Promise<T | undefined>, provision: () => Promise<void>) {
  const existing = await findExisting();
  if (existing) return existing;
  await provision();
  return findExisting();
}

export async function ensureCompanyForUserWithDependencies<T>(dependencies: { findExisting: () => Promise<T | undefined>; ownerName: () => Promise<string | undefined>; createWorkspace: (input: CreateCompanyWorkspaceInput) => Promise<void> }) {
  const company = await provisionWhenMissing(dependencies.findExisting, async () => {
    const ownerName = (await dependencies.ownerName())?.trim() || "My";
    await dependencies.createWorkspace({ name: `${ownerName}'s workspace`, description: "Initial private workspace", technologyStack: [] });
  });
  if (!company) throw new Error("Unable to provision an initial company workspace");
  return company;
}

export async function ensurePrimaryCompanyForUser(userId: number) {
  return ensureCompanyForUserWithDependencies({
    findExisting: () => getPrimaryCompanyForUser(userId),
    ownerName: async () => {
    const db = await getDb();
    if (!db) throw new Error("Database is not available");
    const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
      return user?.name ?? undefined;
    },
    createWorkspace: async (input) => { await createCompanyWorkspace(userId, input); },
  });
}

export async function getWorkspaceRecordsForUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const company = await ensurePrimaryCompanyForUser(userId);
  const [employeeRows, conversationRows, taskRows, contextRows, eventRows] = await Promise.all([
    db.select().from(employees).where(eq(employees.companyId, company.id)),
    db.select().from(conversations).where(eq(conversations.companyId, company.id)).orderBy(asc(conversations.createdAt)).limit(1),
    db.select().from(tasks).where(eq(tasks.companyId, company.id)).orderBy(desc(tasks.updatedAt)),
    db.select().from(companyContext).where(eq(companyContext.companyId, company.id)).orderBy(desc(companyContext.updatedAt)),
    db.select().from(activityEvents).where(eq(activityEvents.companyId, company.id)).orderBy(desc(activityEvents.createdAt)).limit(12),
  ]);
  const conversation = conversationRows[0];
  const conversationMessages = conversation ? await db.select().from(messages).where(eq(messages.conversationId, conversation.id)).orderBy(asc(messages.createdAt)) : [];
  return { company, employee: employeeRows.find((employee) => employee.key === "full-stack-developer") ?? employeeRows[0], employees: employeeRows, conversation, tasks: taskRows, context: contextRows, events: eventRows, messages: conversationMessages };
}

async function getAuthorizedCompany(dbUserId: number) {
  return ensurePrimaryCompanyForUser(dbUserId);
}

export async function createTaskWithDependencies(userId: number, input: { title: string; description?: string }, dependencies: { company: () => Promise<{ id: number }>; employee: (companyId: number) => Promise<{ id: number } | undefined>; insertTask: (value: { companyId: number; requestedByUserId: number; assignedEmployeeId?: number; title: string; description?: string }) => Promise<number>; insertActivity: (value: { companyId: number; employeeId?: number; taskId: number; action: string; summary: string; status: "started" }) => Promise<void> }) {
  const company = await dependencies.company();
  const employee = await dependencies.employee(company.id);
  const taskId = await dependencies.insertTask({ companyId: company.id, requestedByUserId: userId, assignedEmployeeId: employee?.id, title: input.title, description: input.description });
  await dependencies.insertActivity({ companyId: company.id, employeeId: employee?.id, taskId, action: "task_created", summary: `Captured a new task: ${input.title}`, status: "started" });
  return { id: taskId, title: input.title, description: input.description, status: "planning" as const, progress: 0 };
}

export async function createTaskForUser(userId: number, input: { title: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return createTaskWithDependencies(userId, input, {
    company: () => getAuthorizedCompany(userId),
    employee: async (companyId) => (await db.select().from(employees).where(eq(employees.companyId, companyId)).limit(1))[0],
    insertTask: async (value) => {
      const result = await db.insert(tasks).values({ ...value, status: "planning", progress: 0 });
      const taskId = await resolveCreatedTaskId(result, async () => (await db.select().from(tasks).where(and(eq(tasks.companyId, value.companyId), eq(tasks.requestedByUserId, value.requestedByUserId), eq(tasks.title, value.title))).orderBy(desc(tasks.id)).limit(1))[0]);
      if (!taskId) throw new Error("Unable to resolve the newly created task");
      return taskId;
    },
    insertActivity: async (value) => { await db.insert(activityEvents).values(value); },
  });
}

export async function updateTaskForUser(userId: number, input: { taskId: number; status: "backlog" | "planning" | "in_progress" | "waiting" | "review" | "completed" | "blocked"; progress?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const company = await getAuthorizedCompany(userId);
  const result = await db.update(tasks).set({ status: input.status, ...(input.progress !== undefined ? { progress: input.progress } : {}), ...(input.status === "completed" ? { completedAt: new Date() } : {}) }).where(and(eq(tasks.id, input.taskId), eq(tasks.companyId, company.id)));
  if ((result as unknown as { affectedRows?: number }).affectedRows === 0) throw new Error("Task was not found in this company workspace");
  return input;
}

export async function appendMessageForUser(userId: number, input: { content: string; relatedTaskId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const company = await getAuthorizedCompany(userId);
  const conversation = (await db.select().from(conversations).where(eq(conversations.companyId, company.id)).orderBy(asc(conversations.createdAt)).limit(1))[0];
  if (!conversation) throw new Error("Company engineering conversation was not found");
  const result = await db.insert(messages).values({ conversationId: conversation.id, senderType: "user", senderUserId: userId, content: input.content, messageType: input.relatedTaskId ? "task_assignment" : "message", relatedTaskId: input.relatedTaskId, createdBy: "user" });
  return { id: Number((result as unknown as { insertId: number }).insertId), createdAt: Date.now() };
}
