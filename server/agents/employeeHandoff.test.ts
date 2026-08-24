import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectQueue: [] as unknown[][], inserts: [] as unknown[] }));
vi.mock("../db", () => {
  const db = {
    select: () => { const result = state.selectQueue.shift() ?? []; return { from: () => ({ where: () => ({ then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(result).then(resolve), orderBy: () => ({ limit: async () => result }) }) }) }; },
    insert: (table: unknown) => ({ values: async (value: unknown) => { state.inserts.push({ table, value }); return { insertId: 100 + state.inserts.length }; } }),
    update: () => ({ set: () => ({ where: async () => ({ affectedRows: 1 }) }) }),
    transaction: async (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
  };
  return { getDb: async () => db, ensurePrimaryCompanyForUser: async () => ({ id: 7, name: "Northstar" }), getCreatedRecordId: (result: { insertId?: number }) => result.insertId };
});
vi.mock("./llmProvider", () => ({ getConfiguredProvider: () => ({ complete: async () => ({ content: "I’ll take the next scoped step.", model: "openrouter/auto" }) }), resolveEmployeeModel: (model: string) => model }));

import { respondToTaskForUser } from "./employeeResponse";

describe("employee handoff persistence", () => {
  it("creates dependent specialist work and shared handoff messages when a task needs multiple skill sets", async () => {
    state.inserts = [];
    state.selectQueue = [[
      { id: 1, companyId: 7, key: "full-stack-developer", name: "Alex", role: "Full-Stack Developer", model: "openrouter/auto", temperature: 20, maxTokens: 400, systemPromptKey: "full-stack-developer-v1", toolPermissions: [] },
      { id: 2, companyId: 7, key: "cybersecurity-analyst", name: "Maya", role: "Cybersecurity Analyst", model: "openrouter/auto", temperature: 10, maxTokens: 400, systemPromptKey: "cybersecurity-analyst-v1", toolPermissions: [] },
      { id: 3, companyId: 7, key: "data-analyst", name: "Noor", role: "Data Analyst", model: "openrouter/auto", temperature: 10, maxTokens: 400, systemPromptKey: "data-analyst-v1", toolPermissions: [] },
    ], [{ id: 8, companyId: 7, title: "Engineering" }], []];
    const result = await respondToTaskForUser(1, { id: 9, title: "Build a secure analytics dashboard" });
    expect(result.replies.map((reply) => reply.employeeName)).toEqual(["Alex", "Maya", "Noor"]);
    expect(result.handoffs).toEqual([{ from: "Alex", to: "Maya", taskId: 101 }, { from: "Alex", to: "Noor", taskId: 103 }]);
    expect(state.inserts).toHaveLength(6);
  });
});
