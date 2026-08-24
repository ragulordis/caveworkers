import { describe, expect, it } from "vitest";

describe("OpenRouter server credential", () => {
  it("authenticates a lightweight server-side models request", async () => {
    const key = process.env.OPENROUTER_API_KEY;
    expect(key).toBeTruthy();
    const response = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${key}` } });
    expect(response.ok).toBe(true);
  }, 20_000);
});
