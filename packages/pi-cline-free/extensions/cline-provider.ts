import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  const CLINE_API_KEY = process.env.CLINE_API_KEY;

  if (!CLINE_API_KEY) {
    console.warn("[pi-cline] CLINE_API_KEY not set — provider not registered");
    return;
  }

  pi.registerProvider("cline", {
    name: "Cline (Free Models)",
    baseUrl: "https://api.cline.bot/api/v1",
    apiKey: CLINE_API_KEY,
    api: "openai-completions",
    models: [
      {
        id: "deepseek-ai/deepseek-v4-flash",
        name: "DeepSeek V4 Flash (Free)",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 1048576,
        maxTokens: 131072,
      },
      {
        id: "stepfun/step-3.7-flash",
        name: "StepFun Step 3.7 Flash (Free)",
        reasoning: true,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 262144,
        maxTokens: 256000,
      },
      {
        id: "poolside/laguna-s-2.1:free",
        name: "Laguna S 2.1 (Free)",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 262144,
        maxTokens: 32768,
      },
    ],
  });
}
