import { describe, expect, it } from "vitest";
import { getDemoWorkspace } from "./demo";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

describe("getDemoWorkspace", () => {
  it("returns a Full-Stack Developer workspace with task and memory boundaries", () => {
    const workspace = getDemoWorkspace();
    expect(workspace.employee.role).toBe("Full-Stack Developer");
    expect(workspace.tasks.some((task) => task.progress > 0)).toBe(true);
    expect(workspace.memory.every((item) => item.title.length > 0 && item.value.length > 0)).toBe(true);
  });

  it("returns a traceable message event with sender metadata", () => {
    const message = getDemoWorkspace().messages[0];
    expect(message).toMatchObject({ sender: "system", messageType: "handoff" });
    expect(message.createdAt).toEqual(expect.any(Number));
  });

  it("validates company onboarding input before calling persistence", async () => {
    const ctx = { user: { id: 1 }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.workspace.createCompany({ name: "x", technologyStack: [] })).rejects.toThrow();
  });

  it("rejects task persistence when the user has no company authorization boundary", async () => {
    const ctx = { user: { id: 999_999 }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.workspace.createTask({ title: "Review the service boundary" })).rejects.toThrow();
    await expect(caller.workspace.appendMessage({ content: "Please review this work." })).rejects.toThrow();
  });

  it("rejects invalid task status inputs before any update can be attempted", async () => {
    const ctx = { user: { id: 1 }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.workspace.updateTaskStatus({ taskId: 0, status: "planning" })).rejects.toThrow();
  });
});
