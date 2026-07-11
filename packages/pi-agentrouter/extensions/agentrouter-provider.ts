import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.AGENTROUTER_API_KEY;

export default function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-agentrouter] AGENTROUTER_API_KEY not set — provider not registered");
    return;
  }

  pi.registerProvider("agentrouter", {
    name: "AgentRouter",
    baseUrl: "https://agentrouter.org/v1",
    api: "openai-completions",
    apiKey: API_KEY,
    models: [
      {
        id: "gpt-5.5",
        name: "GPT-5.5",
        reasoning: true,
        input: ["text", "image"],
        contextWindow: 1048576,  // 1M (922K input + 128K output)
        maxTokens: 131072,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        id: "claude-opus-4-6",
        name: "Claude Opus 4.6",
        reasoning: true,
        input: ["text", "image"],
        contextWindow: 1000000,  // 1M tokens
        maxTokens: 131072,       // 128K output
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        id: "claude-opus-4-7",
        name: "Claude Opus 4.7",
        reasoning: true,
        input: ["text", "image"],
        contextWindow: 1000000,  // 1M tokens
        maxTokens: 131072,       // 128K output
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        id: "claude-opus-4-8",
        name: "Claude Opus 4.8",
        reasoning: true,
        input: ["text", "image"],
        contextWindow: 1000000,  // 1M tokens
        maxTokens: 131072,       // 128K output
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        id: "glm-5.2",
        name: "GLM-5.2",
        reasoning: true,
        input: ["text"],
        contextWindow: 1048576,  // 1M tokens
        maxTokens: 131072,       // 128K output
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ],
  });

  console.log("[pi-agentrouter] Registered 5 models (gpt-5.5, claude-opus-4-6/7/8, glm-5.2)");
}
