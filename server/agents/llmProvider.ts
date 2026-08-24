import { invokeLLM, listLLMModels } from "../_core/llm";

export type EmployeeProvider = "manus";

export type EmployeeModelConfig = {
  provider: EmployeeProvider;
  /** A Manus catalog model ID, or a legacy value that will be migrated at runtime. */
  model?: string;
  temperature: number;
  maxTokens: number;
  contextLimit: number;
  systemPromptKey: string;
  /** Permission keys are enforced by the employee runtime before tools are exposed. */
  toolPermissions: string[];
};

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmCompletion = {
  content: string;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number };
};

const LEGACY_MODEL_VALUES = new Set([
  "",
  "openrouter-configured-model",
  "openrouter/auto",
  "manus-managed-model",
]);

let modelCatalogPromise: Promise<string[]> | undefined;

async function getModelCatalog() {
  modelCatalogPromise ??= listLLMModels()
    .then(({ data }) => data.map((model) => model.id))
    .catch(() => []);
  return modelCatalogPromise;
}

/**
 * Converts persisted legacy OpenRouter values into a currently available Manus model.
 * Explicit non-OpenRouter model IDs are retained so each employee can be configured independently.
 */
export async function resolveEmployeeModel(model?: string, availableModels?: string[]) {
  const requested = model?.trim() ?? "";
  if (requested && !LEGACY_MODEL_VALUES.has(requested) && !requested.startsWith("openrouter/")) return requested;

  const available = availableModels ?? await getModelCatalog();
  return available.find((id) => id === "gpt-5-mini")
    ?? available.find((id) => id.startsWith("gpt-5"))
    ?? available.find((id) => id.startsWith("claude-sonnet"))
    ?? available[0];
}

type InvokeLlm = (input: Parameters<typeof invokeLLM>[0]) => ReturnType<typeof invokeLLM>;

export interface LlmProvider {
  complete(input: { config: EmployeeModelConfig; messages: LlmMessage[] }): Promise<LlmCompletion>;
}

/**
 * Server-side adapter for a CaveWorkers employee agent.
 * Manus injects the credentials into the project runtime; they never reach the browser.
 */
export class ManusAgentProvider implements LlmProvider {
  constructor(private readonly invoke: InvokeLlm = invokeLLM) {}

  async complete({ config, messages }: { config: EmployeeModelConfig; messages: LlmMessage[] }): Promise<LlmCompletion> {
    const model = await resolveEmployeeModel(config.model);
    const response = await this.invoke({
      ...(model ? { model } : {}),
      messages,
      maxTokens: config.maxTokens,
    });
    const message = response.choices?.[0]?.message;
    const content = typeof message?.content === "string" ? message.content : "";
    return {
      content,
      model: response.model ?? model ?? "manus-managed",
      usage: {
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      },
    };
  }
}

/** The platform-managed provider is available in deployed CaveWorkers runtimes. */
export function getConfiguredProvider(): LlmProvider {
  return new ManusAgentProvider();
}
