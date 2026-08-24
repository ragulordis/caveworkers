import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const state = vi.hoisted(() => ({ companyId: undefined as number | undefined, createdTasks: 0 }));
vi.mock("../db", () => ({
  createCompanyWorkspace: async () => ({ companyId: 42 }),
  createTaskForUser: async (userId: number, input: { title: string; description?: string }) => { if (!state.companyId) state.companyId = 42; state.createdTasks += 1; return { id: 100, title: input.title, description: input.description, status: "planning" as const, progress: 0 }; },
  updateTaskForUser: async () => { throw new Error("unused"); },
  appendMessageForUser: async () => { throw new Error("unused"); },
}));
vi.mock("../agents/employeeResponse", () => ({ respondToTaskForUser: async () => ({ employeeName: "Alex", content: "I’ll begin with a focused plan.", isFallback: false }) }));
import { appRouter } from "../routers";

describe("workspace mutation after automatic provisioning", () => {
  it("creates the first workspace implicitly and completes the initial task mutation", async () => {
    state.companyId = undefined; state.createdTasks = 0;
    const ctx = { user: { id: 1, openId: "unaffiliated", role: "user", name: "First User", email: null, loginMethod: "google", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
    const result = await appRouter.createCaller(ctx).workspace.createTask({ title: "Create initial task", description: "First operation" });
    expect(state.companyId).toBe(42);
    expect(state.createdTasks).toBe(1);
    expect(result.task).toMatchObject({ id: 100, status: "planning" });
  });
});
