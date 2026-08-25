import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const API_KEY = process.env.OPENGATEWAY_API_KEY;

export default function (pi: ExtensionAPI) {
  if (!API_KEY) {
    console.warn("[pi-opengateway] OPENGATEWAY_API_KEY not set — provider not registered");
    return;
  }

  pi.registerProvider("opengateway", {
    name: "OpenGateway (gitlawb.com)",
    baseUrl: "https://opengateway.gitlawb.com/v1",
    api: "openai-completions",
    apiKey: API_KEY,
    models: [
      {
        id: "nvidia/nemotron-3-ultra-550b-a55b:free",
        name: "Nemotron 3 Ultra (Free)",
        reasoning: true,
        input: ["text"],
        contextWindow: 1000000,
        maxTokens: 65536,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ],
  });

  console.log("[pi-opengateway] Registered 1 free model");
}
