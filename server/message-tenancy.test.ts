import { describe, expect, it, vi } from "vitest";
import { appendMessageWithDependencies } from "./db";

describe("message task tenancy", () => {
  it("does not insert a message when its related task belongs to another company", async () => {
    const insert = vi.fn();
    await expect(appendMessageWithDependencies(3, { content: "Review this task", relatedTaskId: 92 }, { company: async () => ({ id: 7 }), conversation: async () => ({ id: 8 }), task: async () => ({ id: 92, companyId: 44 }), insert })).rejects.toThrow("Related task was not found in this company workspace");
    expect(insert).not.toHaveBeenCalled();
  });

  it("persists a task-linked message only when the task belongs to the caller tenant", async () => {
    const insert = vi.fn().mockResolvedValue({ insertId: 19 });
    const message = await appendMessageWithDependencies(3, { content: "Review this task", relatedTaskId: 92 }, { company: async () => ({ id: 7 }), conversation: async () => ({ id: 8 }), task: async () => ({ id: 92, companyId: 7 }), insert });
    expect(message.id).toBe(19);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ conversationId: 8, relatedTaskId: 92, messageType: "task_assignment" }));
  });
});
