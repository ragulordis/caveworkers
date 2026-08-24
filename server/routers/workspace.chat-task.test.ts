import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const state = vi.hoisted(() => ({ messages: 0, tasks: 0 }));
vi.mock("../db", () => ({
  createCompanyWorkspace: async () => ({ companyId: 7 }),
  appendMessageForUser: async () => { state.messages += 1; return { id: 41, createdAt: Date.now() }; },
  createTaskForUser: async (_userId: number, input: { title: string }) => { state.tasks += 1; return { id: 42, title: input.title, status: "planning" as const, progress: 0 }; },
  updateTaskForUser: async () => { throw new Error("unused"); },
}));
import { appRouter } from "../routers";

describe("workspace chat-to-task flow", () => {
  it("persists the submitted chat message and creates its follow-on task without an invalid activity identifier", async () => {
    state.messages = 0; state.tasks = 0;
    const ctx = { user: { id: 1, openId: "workspace-user", role: "user", name: "Workspace User", email: null, loginMethod: "google", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    const message = await caller.workspace.appendMessage({ content: "heyy" });
    const task = await caller.workspace.createTask({ title: "heyy", description: "Captured from chat" });
    expect(message.message.id).toBe(41);
    expect(task.task).toMatchObject({ id: 42, status: "planning" });
    expect(state).toEqual({ messages: 1, tasks: 1 });
  });
});
