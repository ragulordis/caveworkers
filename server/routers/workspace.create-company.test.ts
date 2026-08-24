import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const calls = vi.hoisted(() => ({ created: [] as Array<{ userId: number; name: string }> }));

vi.mock("../db", () => ({
  createCompanyWorkspace: async (userId: number, input: { name: string }) => { calls.created.push({ userId, name: input.name }); return { companyId: 17, employeeId: 18, securityEmployeeId: 19, dataEmployeeId: 20, qaEmployeeId: 21, conversationId: 22 }; },
  createTaskForUser: async () => { throw new Error("unused"); },
  updateTaskForUser: async () => { throw new Error("unused"); },
  appendMessageForUser: async () => { throw new Error("unused"); },
}));

import { appRouter } from "../routers";

describe("workspace.createCompany first-time setup", () => {
  it("creates a company workspace for an authenticated user who has no pre-existing membership", async () => {
    calls.created = [];
    const ctx = { user: { id: 1, openId: "first-time-user", role: "user", name: "First User", email: null, loginMethod: "google", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
    const result = await appRouter.createCaller(ctx).workspace.createCompany({ name: "First workspace", description: "New company", technologyStack: [] });
    expect(result.persistence).toBe("saved");
    expect(result.workspace.companyId).toBe(17);
    expect(calls.created).toEqual([{ userId: 1, name: "First workspace" }]);
  });
});
