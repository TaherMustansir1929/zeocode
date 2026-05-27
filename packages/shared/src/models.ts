export type SupportedProvider = "anthropic" | "openai" | "google";

interface SupportedChatModelDefinition {
  id: string;
  provider: SupportedProvider;
}

export const SUPPORTED_CHAT_MODELS = [
  {
    id: "gemini-3.1-flash-lite",
    provider: "google",
  },
  {
    id: "claude-sonnet-4-6",
    provider: "anthropic",
  },
  {
    id: "claude-haiku-4-5",
    provider: "anthropic",
  },
  {
    id: "claude-opus-4-6",
    provider: "anthropic",
  },
  {
    id: "gpt-5.4",
    provider: "openai",
  },
  {
    id: "gpt-5.4-mini",
    provider: "openai",
  },
  {
    id: "gpt-5.4-nano",
    provider: "openai",
  },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];

export function findSupportedChatModel(modelId: string) {
  return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId =
  "gemini-3.1-flash-lite";
