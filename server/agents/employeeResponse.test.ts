import { describe, expect, it, vi } from "vitest";
import { generateEmployeeReply } from "./employeeResponse";
import { routeTaskToSpecialists, specialistProfiles } from "./specialists";

const config = { provider: "manus" as const, model: "manus-managed-model", temperature: 0.2, maxTokens: 400, contextLimit: 16_000, systemPromptKey: "full-stack-developer-v1", toolPermissions: ["repository.read", "task.plan", "memory.read"] };
const input = { specialist: specialistProfiles[0], companyName: "Northstar", taskTitle: "Review the API boundary", history: [] as const };

describe("employee response generation", () => {
  it("returns the configured Manus response for a new company task", async () => {
    const provider = { complete: vi.fn().mockResolvedValue({ content: "I’ll review the boundary, map risks, and return a rollout plan.", model: "gpt-5-mini" }) };
    const reply = await generateEmployeeReply(input, { provider: () => provider, config });
    expect(reply).toMatchObject({ employeeName: "Alex", employeeRole: "Full-Stack Developer", isFallback: false, model: "gpt-5-mini", content: expect.stringContaining("I’ll review the boundary") });
    expect(reply.content).toContain("Skills: system design");
    expect(provider.complete).toHaveBeenCalledOnce();
    expect(provider.complete.mock.calls[0][0].messages[0].content).toContain("Repository reader");
  });

  it("returns a persisted user-facing fallback when Manus is unavailable or a request fails", async () => {
    await expect(generateEmployeeReply(input, { provider: () => ({ complete: async () => { throw new Error("unavailable"); } }), config })).resolves.toMatchObject({ isFallback: true, content: expect.stringContaining("saved as a task") });
    await expect(generateEmployeeReply(input, { provider: () => ({ complete: async () => new Promise(() => {}) }), config, timeoutMs: 1 })).resolves.toMatchObject({ isFallback: true });
  });

  it("routes work to the specialist with matching skills and lets a team request involve every employee", () => {
    expect(routeTaskToSpecialists("Assess our authorization risks").map((specialist) => specialist.name)).toEqual(["Maya"]);
    expect(routeTaskToSpecialists("Analyze our KPI trend from the CSV").map((specialist) => specialist.name)).toEqual(["Noor"]);
    expect(routeTaskToSpecialists("Can I talk to Noor?").map((specialist) => specialist.name)).toEqual(["Noor"]);
    expect(routeTaskToSpecialists("Create an end-to-end regression suite").map((specialist) => specialist.name)).toEqual(["Priya"]);
    expect(routeTaskToSpecialists("Build a secure analytics dashboard").map((specialist) => specialist.name)).toEqual(["Alex", "Maya", "Noor"]);
    expect(routeTaskToSpecialists("Hello everyone, how many of you are here?").map((specialist) => specialist.name)).toEqual(["Alex", "Maya", "Noor", "Priya"]);
  });
});
