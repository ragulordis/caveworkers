import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectQueue: [] as unknown[][], inserted: [] as unknown[], updates: [] as unknown[] }));

vi.mock("../db", () => {
  const selectResult = () => ({ from: () => ({ where: () => ({ limit: async () => state.selectQueue.shift() ?? [] }) }) });
  const insertResult = (table: unknown) => ({ values: async (value: unknown) => { state.inserted.push({ table, value }); return { insertId: state.inserted.length }; } });
  const updateResult = (table: unknown) => ({ set: (value: unknown) => ({ where: async () => { state.updates.push({ table, value }); return { affectedRows: 1 }; } }) });
  const db = { select: selectResult, insert: insertResult, update: updateResult, transaction: async (callback: (tx: typeof db) => Promise<unknown>) => callback(db) };
  return { getDb: async () => db, getPrimaryCompanyForUser: async () => ({ id: 7, name: "Test Company" }) };
});

import { createAnalysisForUser, handoffAnalysisForUser, recordAnalysisResultForUser, recordDataQualityForUser, registerDataSourceForUser } from "./service";

describe("Data Analyst persistence workflows", () => {
  beforeEach(() => { state.selectQueue = []; state.inserted = []; state.updates = []; });
  it("persists a governed source registration and global read-only permission", async () => {
    state.selectQueue = [[{ id: 4, companyId: 7, key: "data-analyst", name: "Noor" }]];
    const result = await registerDataSourceForUser(1, { name: "Revenue warehouse", sourceType: "data_warehouse", connectorKey: "warehouse" });
    expect(result.sourceId).toBeGreaterThan(0); expect(state.inserted).toHaveLength(2);
  });
  it("persists an analysis, quality check, and evidence-aware result", async () => {
    state.selectQueue = [[{ id: 4, companyId: 7, key: "data-analyst", name: "Noor" }], [{ id: 8, companyId: 7, title: "Engineering" }]];
    const created = await createAnalysisForUser(1, { title: "Revenue decline", question: "Why did revenue change?", analysisType: "revenue" });
    expect(created.analysisId).toBeGreaterThan(0); expect(state.inserted.length).toBeGreaterThanOrEqual(5);
    state.selectQueue = [[{ id: created.analysisId, companyId: 7, employeeId: 4, taskId: created.taskId, confidence: "insufficient" }]];
    await recordDataQualityForUser(1, { analysisId: created.analysisId, checkType: "missing_values", status: "warning", affectedPercent: 12, summary: "12% of rows lack timestamps." });
    state.selectQueue = [[{ id: created.analysisId, companyId: 7, employeeId: 4, taskId: created.taskId }]];
    const result = await recordAnalysisResultForUser(1, { analysisId: created.analysisId, resultType: "observation", title: "Mobile revenue declined", content: "Revenue declined in mobile traffic.", evidence: "Segmented period comparison.", confidence: "medium" });
    expect(result.resultId).toBeGreaterThan(0); expect(state.updates.length).toBeGreaterThanOrEqual(2);
  });
  it("persists the dependent teammate task and handoff dependency with the shared messages", async () => {
    state.selectQueue = [[{ id: 12, companyId: 7, employeeId: 4, taskId: 20 }], [{ id: 4, companyId: 7, key: "data-analyst", name: "Noor" }], [{ id: 2, companyId: 7, key: "full-stack-developer", name: "Alex" }], [{ id: 8, companyId: 7, title: "Engineering" }]];
    const result = await handoffAnalysisForUser(1, { analysisId: 12, teammate: "full-stack-developer", title: "Mobile conversion decline", evidence: "The trend began after a release.", confidence: "medium" });
    expect(result.dependentTaskId).toBeGreaterThan(0); expect(state.inserted).toHaveLength(4);
  });
});
