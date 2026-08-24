export type EmployeeModelConfig = {
  provider: "openrouter";
  model: string;
  temperature: number;
  maxTokens: number;
  contextLimit: number;
  systemPromptKey: string;
  toolPermissions: string[];
};

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };
export type LlmCompletion = { content: string; model: string; usage?: { inputTokens?: number; outputTokens?: number } };

export const DEFAULT_OPENROUTER_MODEL = "openrouter/auto";

/** Replaces the configuration placeholder with an optional deployment override or OpenRouter's router model. */
export function resolveEmployeeModel(model: string) {
  return model && model !== "openrouter-configured-model" ? model : process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
}

export interface LlmProvider {
  complete(input: { config: EmployeeModelConfig; messages: LlmMessage[] }): Promise<LlmCompletion>;
}

/**
 * Server-side-only adapter for the provider selected for each employee.
 * Callers receive a provider contract instead of coupling UI or agents to a vendor SDK.
 */
export class OpenRouterProvider implements LlmProvider {
  constructor(private readonly apiKey: string, private readonly fetchImpl: typeof fetch = fetch) {}

  async complete({ config, messages }: { config: EmployeeModelConfig; messages: LlmMessage[] }): Promise<LlmCompletion> {
    const response = await this.fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.model, messages, temperature: config.temperature, max_tokens: config.maxTokens }),
    });
    if (!response.ok) throw new Error(`LLM provider request failed with status ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; model?: string; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    return { content: data.choices?.[0]?.message?.content ?? "", model: data.model ?? config.model, usage: { inputTokens: data.usage?.prompt_tokens, outputTokens: data.usage?.completion_tokens } };
  }
}

export function getConfiguredProvider(): LlmProvider | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  return apiKey ? new OpenRouterProvider(apiKey) : null;
}
