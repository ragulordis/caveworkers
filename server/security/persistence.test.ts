import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ selectQueue: [] as unknown[][], inserted: [] as unknown[], updates: [] as unknown[] }));

vi.mock("../db", () => {
  const selectResult = () => ({
    from: () => ({ where: () => ({ limit: async () => state.selectQueue.shift() ?? [] }) }),
  });
  const insertResult = (table: unknown) => ({ values: async (value: unknown) => { state.inserted.push({ table, value }); return { insertId: state.inserted.length }; } });
  const updateResult = (table: unknown) => ({ set: (value: unknown) => ({ where: async () => { state.updates.push({ table, value }); return { affectedRows: 1 }; } }) });
  const db = {
    select: selectResult,
    insert: insertResult,
    update: updateResult,
    transaction: async (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
  };
  return { getDb: async () => db, getPrimaryCompanyForUser: async () => ({ id: 7, name: "Test Company" }) };
});

import { createSecurityFindingForUser, handoffFindingToDeveloperForUser, verifySecurityRemediationForUser } from "./service";

describe("security persistence workflows", () => {
  beforeEach(() => { state.selectQueue = []; state.inserted = []; state.updates = []; });

  it("persists an evidence-aware finding and audit event", async () => {
    state.selectQueue = [[{ id: 14, companyId: 7, employeeId: 2, taskId: 9 }]];
    const result = await createSecurityFindingForUser(1, { reviewId: 14, severity: "medium", confidence: "likely", title: "Refresh policy needs verification", description: "Policy is not documented.", impact: "Token lifetime could be wider than intended.", likelihood: "Moderate", evidence: "No documented reuse detection exists.", recommendation: "Confirm rotation and expiry controls." });
    expect(result.findingId).toBeGreaterThan(0);
    expect(state.inserted).toHaveLength(2);
  });

  it("persists a structured Maya-to-Alex handoff with messages, task, remediation, and events", async () => {
    state.selectQueue = [
      [{ id: 22, companyId: 7, title: "Missing ownership check", severity: "high", recommendation: "Add tenant-bound ownership validation." }],
      [{ id: 2, companyId: 7, key: "cybersecurity-analyst", name: "Maya" }],
      [{ id: 3, companyId: 7, key: "full-stack-developer", name: "Alex" }],
      [{ id: 4, companyId: 7, title: "Engineering" }],
    ];
    const result = await handoffFindingToDeveloperForUser(1, { findingId: 22 });
    expect(result.taskId).toBeGreaterThan(0);
    expect(state.inserted).toHaveLength(4);
  });

  it("persists a resolved finding and verified remediation summary", async () => {
    state.selectQueue = [
      [{ id: 22, companyId: 7, title: "Missing ownership check" }],
      [{ id: 2, companyId: 7, key: "cybersecurity-analyst", name: "Maya" }],
      [{ id: 30, findingId: 22, status: "ready_for_verification" }],
    ];
    const result = await verifySecurityRemediationForUser(1, { findingId: 22, verificationSummary: "Verified tenant-bound authorization with regression coverage." });
    expect(result.status).toBe("resolved");
    expect(state.updates).toHaveLength(2);
    expect(state.inserted).toHaveLength(1);
  });
});
