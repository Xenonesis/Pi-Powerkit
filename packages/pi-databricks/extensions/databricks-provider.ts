import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.DATABRICKS_API_KEY;

const MODELS = [
    {
      id: "system.ai.glm-5-2",
      name: "Databricks GLM-5.2",
      
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 32768
    }
];

export default function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-databricks] DATABRICKS_API_KEY not set — provider not registered");
    return;
  }

  pi.registerProvider("databricks", {
    name: "Databricks",
    api: "openai-completions",
    baseUrl: "https://dbc-3e029138-076b.cloud.databricks.com/ai-gateway/mlflow/v1",
    apiKey: API_KEY,
    models: MODELS
  });
}
