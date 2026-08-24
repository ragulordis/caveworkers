import { describe, expect, it, vi } from "vitest";
import { generateEmployeeReply } from "./employeeResponse";
import { routeTaskToSpecialists, specialistProfiles } from "./specialists";

const config = { provider: "openrouter" as const, model: "openrouter/auto", temperature: 0.2, maxTokens: 400, contextLimit: 16_000, systemPromptKey: "full-stack-developer-v1", toolPermissions: [] };
const input = { specialist: specialistProfiles[0], companyName: "Northstar", taskTitle: "Review the API boundary", history: [] as const };

describe("employee response generation", () => {
  it("returns the configured provider response for a new company task", async () => {
    const provider = { complete: vi.fn().mockResolvedValue({ content: "I’ll review the boundary, map risks, and return a rollout plan.", model: "openrouter/auto" }) };
    const reply = await generateEmployeeReply(input, { provider: () => provider, config });
    expect(reply).toMatchObject({ employeeName: "Alex", employeeRole: "Full-Stack Developer", isFallback: false, content: expect.stringContaining("I’ll review the boundary") });
    expect(reply.content).toContain("Skills: system design");
    expect(provider.complete).toHaveBeenCalledOnce();
  });

  it("returns a persisted user-facing fallback when no provider is configured or a request fails", async () => {
    await expect(generateEmployeeReply(input, { provider: () => null, config })).resolves.toMatchObject({ isFallback: true, content: expect.stringContaining("saved as a task") });
    await expect(generateEmployeeReply(input, { provider: () => ({ complete: async () => { throw new Error("unavailable"); } }), config })).resolves.toMatchObject({ isFallback: true });
    await expect(generateEmployeeReply(input, { provider: () => ({ complete: async () => new Promise(() => {}) }), config, timeoutMs: 1 })).resolves.toMatchObject({ isFallback: true });
  });

  it("routes work to the specialist with matching skills and lets a team request involve every employee", () => {
    expect(routeTaskToSpecialists("Assess our authorization risks").map((specialist) => specialist.name)).toEqual(["Maya"]);
    expect(routeTaskToSpecialists("Analyze our KPI trend from the CSV").map((specialist) => specialist.name)).toEqual(["Noor"]);
    expect(routeTaskToSpecialists("Can I talk to Noor?").map((specialist) => specialist.name)).toEqual(["Noor"]);
    expect(routeTaskToSpecialists("Create an end-to-end regression suite").map((specialist) => specialist.name)).toEqual(["Priya"]);
    expect(routeTaskToSpecialists("Hello everyone, how many of you are here?").map((specialist) => specialist.name)).toEqual(["Alex", "Maya", "Noor", "Priya"]);
  });
});
