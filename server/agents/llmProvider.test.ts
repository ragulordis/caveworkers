import { describe, expect, it, vi } from "vitest";
import { ManusAgentProvider, resolveEmployeeModel } from "./llmProvider";

describe("Manus employee provider", () => {
  it("maps legacy persisted values to the preferred available Manus model", async () => {
    await expect(resolveEmployeeModel("openrouter-configured-model", ["gpt-5-mini", "claude-sonnet-4-6"])).resolves.toBe("gpt-5-mini");
    await expect(resolveEmployeeModel("gpt-5", ["gpt-5-mini"])).resolves.toBe("gpt-5");
  });

  it("keeps the provider call server-side and returns normalized completion data", async () => {
    const invoke = vi.fn().mockResolvedValue({
      model: "gpt-5-mini",
      choices: [{ message: { content: "Alex response" } }],
      usage: { prompt_tokens: 12, completion_tokens: 7 },
    });
    const provider = new ManusAgentProvider(invoke);
    const completion = await provider.complete({
      config: { provider: "manus", model: "gpt-5-mini", temperature: 0.2, maxTokens: 400, contextLimit: 16_000, systemPromptKey: "full-stack-developer-v1", toolPermissions: ["repository.read"] },
      messages: [{ role: "user", content: "Review the API boundary." }],
    });
    expect(invoke).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-5-mini", maxTokens: 400 }));
    expect(completion).toEqual({ content: "Alex response", model: "gpt-5-mini", usage: { inputTokens: 12, outputTokens: 7 } });
  });
});
