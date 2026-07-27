import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.MODAL_API_KEY;

const MODELS = [
    {
      id: "zai-org/GLM-5-FP8",
      name: "GLM-5 FP8",
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 32768
    },
    {
      id: "zai-org/GLM-5.1-FP8",
      name: "GLM-5.1 FP8",
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 32768
    }
];

export default function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-modal] MODAL_API_KEY not set — provider not registered");
    return;
  }

  pi.registerProvider("modal", {
    name: "Modal",
    baseUrl: "https://api.modal.com/v1",
    apiKey: API_KEY,
    models: MODELS
  });
}
