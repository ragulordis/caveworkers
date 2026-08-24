import { describe, expect, it, vi } from "vitest";
import { generateEmployeeReply } from "./employeeResponse";

const config = { provider: "openrouter" as const, model: "openrouter/auto", temperature: 0.2, maxTokens: 400, contextLimit: 16_000, systemPromptKey: "full-stack-developer-v1", toolPermissions: [] };
const input = { employeeName: "Alex", employeeRole: "Full-Stack Developer", companyName: "Northstar", taskTitle: "Review the API boundary", history: [] as const };

describe("employee response generation", () => {
  it("returns the configured provider response for a new company task", async () => {
    const provider = { complete: vi.fn().mockResolvedValue({ content: "I’ll review the boundary, map risks, and return a rollout plan.", model: "openrouter/auto" }) };
    const reply = await generateEmployeeReply(input, { provider: () => provider, config });
    expect(reply).toMatchObject({ isFallback: false, content: "I’ll review the boundary, map risks, and return a rollout plan." });
    expect(provider.complete).toHaveBeenCalledOnce();
  });

  it("returns a persisted user-facing fallback when no provider is configured or a request fails", async () => {
    await expect(generateEmployeeReply(input, { provider: () => null, config })).resolves.toMatchObject({ isFallback: true, content: expect.stringContaining("saved as a task") });
    await expect(generateEmployeeReply(input, { provider: () => ({ complete: async () => { throw new Error("unavailable"); } }), config })).resolves.toMatchObject({ isFallback: true });
    await expect(generateEmployeeReply(input, { provider: () => ({ complete: async () => new Promise(() => {}) }), config, timeoutMs: 1 })).resolves.toMatchObject({ isFallback: true });
  });
});
