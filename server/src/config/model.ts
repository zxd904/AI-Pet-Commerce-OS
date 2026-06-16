export const MODEL_CONFIG = {
  provider: "ollama" as const,
  baseUrl: "http://localhost:11434",
  model: "qwen2.5:14b",
  timeout: 180000,
  maxTokens: 4096
};

export type ModelName = "qwen2.5:7b" | "qwen2.5:14b" | "deepseek-r1:8b" | "llama3:8b" | string;

export const SUPPORTED_MODELS: ModelName[] = [
  "qwen2.5:7b",
  "qwen2.5:14b",
  "deepseek-r1:8b", 
  "llama3:8b",
  "mixtral:8x7b"
];
