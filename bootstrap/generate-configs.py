#!/usr/bin/env python3
"""
Pi-Powerkit Config Generator
Generates model configs for OMP, Zed, Copilot, JCode from Pi's full provider list.

Usage:
  python3 generate-configs.py omp        # YAML for ~/.omp/agent/models.yml
  python3 generate-configs.py zed        # JSON snippet for Zed settings.json
  python3 generate-configs.py copilot    # JSON snippet for Copilot chatLanguageModels.json
  python3 generate-configs.py jcode      # Bash commands for jcode provider add
"""
import json
import os
import sys

# ── Provider Definitions (mirrors Pi's models.json + extension files) ──────────

PROVIDERS = [
    {
        "name": "opencode-zen",
        "label": "OpenCode Zen",
        "baseUrl": "https://opencode.ai/zen/v1",
        "envKey": "GITHUB_TOKEN",
        "models": [
            {"id": "deepseek-v4-flash-free", "name": "DeepSeek V4 Flash (FREE)", "reasoning": False, "ctx": 1000000, "out": 128000, "input": ["text"]},
            {"id": "mimo-v2.5-free", "name": "MiMo V2.5 (FREE)", "reasoning": True, "ctx": 1000000, "out": 65536, "input": ["text"]},
            {"id": "north-mini-code-free", "name": "North Mini Code (FREE)", "reasoning": False, "ctx": 128000, "out": 8192, "input": ["text"]},
            {"id": "nemotron-3-ultra-free", "name": "Nemotron 3 Ultra (FREE)", "reasoning": True, "ctx": 1000000, "out": 32768, "input": ["text"]},
            {"id": "ling-3.0-flash-free", "name": "Ling 3.0 Flash (FREE)", "reasoning": True, "ctx": 256000, "out": 65536, "input": ["text"]},
            {"id": "laguna-s-2.1-free", "name": "Laguna S 2.1 (FREE)", "reasoning": False, "ctx": 128000, "out": 32768, "input": ["text"]},
        ],
    },
    {
        "name": "opencode",
        "label": "OpenCode (Dynamic)",
        "baseUrl": "https://opencode.ai/zen/v1",
        "envKey": "OPENCODE_API_KEY",
        "models": [
            {"id": "deepseek-v4-flash-free", "name": "DeepSeek V4 Flash (Free)", "reasoning": True, "ctx": 1048576, "out": 128000, "input": ["text"]},
            {"id": "mimo-v2.5-free", "name": "MiMo V2.5 (Free)", "reasoning": True, "ctx": 1048576, "out": 131000, "input": ["text", "image"]},
            {"id": "nemotron-3-ultra-free", "name": "Nemotron 3 Ultra (Free)", "reasoning": True, "ctx": 1000000, "out": 16384, "input": ["text"]},
            {"id": "north-mini-code-free", "name": "North Mini Code (Free)", "reasoning": True, "ctx": 256000, "out": 64000, "input": ["text"]},
            {"id": "qwen3.6-plus-free", "name": "Qwen 3.6 Plus (Free)", "reasoning": True, "ctx": 1048576, "out": 128000, "input": ["text"]},
            {"id": "minimax-m3-free", "name": "MiniMax M3 (Free)", "reasoning": True, "ctx": 1048576, "out": 512000, "input": ["text"]},
            {"id": "big-pickle", "name": "Big Pickle (Free)", "reasoning": True, "ctx": 1048576, "out": 128000, "input": ["text"]},
        ],
    },
    {
        "name": "kilocode",
        "label": "KiloCode",
        "baseUrl": "https://api.kilo.ai/api/openrouter/v1",
        "envKey": "KILO_API_KEY",
        "models": [
            {"id": "kilo-auto/free", "name": "Kilo Auto (free)", "reasoning": True, "ctx": 128000, "out": 65536, "input": ["text"]},
            {"id": "stepfun/step-3.7-flash:free", "name": "StepFun Step 3.7 Flash (free)", "reasoning": True, "ctx": 262144, "out": 65536, "input": ["text"]},
            {"id": "nvidia/nemotron-3-ultra-550b-a55b:free", "name": "NVIDIA Nemotron 3 Ultra 550B (free)", "reasoning": True, "ctx": 1000000, "out": 65536, "input": ["text"]},
            {"id": "nvidia/nemotron-3-super-120b-a12b:free", "name": "NVIDIA Nemotron 3 Super 120B (free)", "reasoning": True, "ctx": 1000000, "out": 262144, "input": ["text"]},
            {"id": "openrouter/free", "name": "OpenRouter Free", "reasoning": True, "ctx": 200000, "out": 8192, "input": ["text"]},
        ],
    },
    {
        "name": "modal",
        "label": "Modal",
        "baseUrl": "https://api.modal.com/v1",
        "envKey": "MODAL_API_KEY",
        "models": [
            {"id": "zai-org/GLM-5-FP8", "name": "ZAI GLM-5 FP8", "reasoning": False, "ctx": 128000, "out": 32768, "input": ["text"]},
            {"id": "zai-org/GLM-5.1-FP8", "name": "ZAI GLM-5.1 FP8", "reasoning": False, "ctx": 128000, "out": 32768, "input": ["text"]},
        ],
    },
    {
        "name": "databricks",
        "label": "Databricks",
        "baseUrl": "https://dbc-3e029138-076b.cloud.databricks.com/ai-gateway/mlflow/v1",
        "envKey": "DATABRICKS_API_KEY",
        "models": [
            {"id": "system.ai.glm-5-2", "name": "Databricks GLM-5-2", "reasoning": False, "ctx": 128000, "out": 32768, "input": ["text"]},
        ],
    },
    {
        "name": "xiaomi",
        "label": "Xiaomi MiMo",
        "baseUrl": "https://api.xiaomimimo.com/v1",
        "envKey": "XIAOMI_API_KEY",
        "models": [
            {"id": "mimo-v2.5", "name": "MiMo V2.5", "reasoning": False, "ctx": 1048576, "out": 131072, "input": ["text"]},
            {"id": "mimo-v2.5-pro", "name": "MiMo V2.5 Pro", "reasoning": False, "ctx": 1048576, "out": 131072, "input": ["text"]},
        ],
    },
    {
        "name": "opengateway",
        "label": "OpenGateway",
        "baseUrl": "https://opengateway.gitlawb.com/v1",
        "envKey": "OPENGATEWAY_API_KEY",
        "models": [
            {"id": "inclusionai/ling-3.0-flash:free", "name": "Ling 3.0 Flash (Free)", "reasoning": True, "ctx": 262144, "out": 65536, "input": ["text"]},
            {"id": "nvidia/nemotron-3-ultra-550b-a55b:free", "name": "Nemotron 3 Ultra (Free)", "reasoning": True, "ctx": 131072, "out": 65536, "input": ["text"]},
            {"id": "mindai/macaron-v1-tall", "name": "Macaron V1 Tall (Free)", "reasoning": True, "ctx": 262144, "out": 65536, "input": ["text"]},
        ],
    },
    {
        "name": "agentrouter",
        "label": "AgentRouter",
        "baseUrl": "https://agentrouter.org/v1",
        "envKey": "AGENTROUTER_API_KEY",
        "models": [
            {"id": "gpt-5.5", "name": "GPT-5.5", "reasoning": True, "ctx": 1048576, "out": 131072, "input": ["text", "image"]},
            {"id": "claude-opus-4-6", "name": "Claude Opus 4.6", "reasoning": True, "ctx": 1000000, "out": 131072, "input": ["text", "image"]},
            {"id": "claude-opus-4-7", "name": "Claude Opus 4.7", "reasoning": True, "ctx": 1000000, "out": 131072, "input": ["text", "image"]},
            {"id": "claude-opus-4-8", "name": "Claude Opus 4.8", "reasoning": True, "ctx": 1000000, "out": 131072, "input": ["text", "image"]},
            {"id": "glm-5.2", "name": "GLM-5.2", "reasoning": True, "ctx": 1048576, "out": 131072, "input": ["text"]},
        ],
    },
    {
        "name": "aihubmix",
        "label": "AIHubMix",
        "baseUrl": "https://aihubmix.com/v1",
        "envKey": "AIHUBMIX_API_KEY",
        "models": [
            {"id": "coding-glm-5.2-free", "name": "Coding GLM-5.2 Free", "reasoning": True, "ctx": 128000, "out": 65536, "input": ["text"]},
            {"id": "coding-kimi-k3-free", "name": "Coding Kimi K3 Free", "reasoning": False, "ctx": 128000, "out": 32768, "input": ["text"]},
            {"id": "gemini-3.5-flash-lite-free", "name": "Gemini 3.5 Flash Lite Free", "reasoning": False, "ctx": 128000, "out": 16384, "input": ["text"]},
            {"id": "gemini-3.6-flash-free", "name": "Gemini 3.6 Flash Free", "reasoning": False, "ctx": 128000, "out": 32768, "input": ["text"]},
            {"id": "gpt-oss-20b-free", "name": "GPT-OSS 20B Free", "reasoning": False, "ctx": 128000, "out": 16384, "input": ["text"]},
            {"id": "nemotron-nano-9b-v2-free", "name": "Nemotron Nano 9B V2 Free", "reasoning": True, "ctx": 128000, "out": 16384, "input": ["text"]},
            {"id": "laguna-m.1-free", "name": "Laguna M.1 Free", "reasoning": True, "ctx": 256000, "out": 32768, "input": ["text"]},
            {"id": "nemotron-3-ultra-550b-a55b-free", "name": "Nemotron 3 Ultra 550B Free", "reasoning": True, "ctx": 1000000, "out": 65536, "input": ["text"]},
            {"id": "nemotron-3-nano-30b-a3b-free", "name": "Nemotron 3 Nano 30B Free", "reasoning": False, "ctx": 128000, "out": 16384, "input": ["text"]},
            {"id": "gemma-4-26b-a4b-it-free", "name": "Gemma 4 26B Free", "reasoning": False, "ctx": 262144, "out": 32768, "input": ["text"]},
            {"id": "gpt-5.5-free", "name": "GPT-5.5 Free", "reasoning": False, "ctx": 272000, "out": 65536, "input": ["text"]},
            {"id": "xiaomi-mimo-v2-omni-free", "name": "Xiaomi MiMo V2 Omni Free", "reasoning": False, "ctx": 1048576, "out": 131072, "input": ["text"]},
            {"id": "xiaomi-mimo-v2-pro-free", "name": "Xiaomi MiMo V2 Pro Free", "reasoning": False, "ctx": 1048576, "out": 131072, "input": ["text"]},
            {"id": "xiaomi-mimo-v2.5-free", "name": "Xiaomi MiMo V2.5 Free", "reasoning": False, "ctx": 1048576, "out": 131072, "input": ["text"]},
            {"id": "xiaomi-mimo-v2.5-pro-free", "name": "Xiaomi MiMo V2.5 Pro Free", "reasoning": False, "ctx": 1048576, "out": 131072, "input": ["text"]},
            {"id": "coding-minimax-m2.7-free", "name": "Coding MiniMax M2.7 Free", "reasoning": False, "ctx": 256000, "out": 65536, "input": ["text"]},
            {"id": "coding-glm-5.1-free", "name": "Coding GLM-5.1 Free", "reasoning": False, "ctx": 128000, "out": 32768, "input": ["text"]},
            {"id": "coding-glm-5-free", "name": "Coding GLM-5 Free", "reasoning": False, "ctx": 128000, "out": 32768, "input": ["text"]},
            {"id": "coding-glm-5-turbo-free", "name": "Coding GLM-5 Turbo Free", "reasoning": False, "ctx": 128000, "out": 32768, "input": ["text"]},
            {"id": "coding-minimax-m2.5-free", "name": "Coding MiniMax M2.5 Free", "reasoning": False, "ctx": 256000, "out": 65536, "input": ["text"]},
            {"id": "gemini-3-flash-preview-free", "name": "Gemini 3 Flash Preview Free", "reasoning": False, "ctx": 128000, "out": 16384, "input": ["text"]},
            {"id": "mimo-v2-flash-free", "name": "MiMo V2 Flash Free", "reasoning": False, "ctx": 1048576, "out": 131072, "input": ["text"]},
            {"id": "kimi-for-coding-free", "name": "Kimi for Coding Free", "reasoning": False, "ctx": 128000, "out": 16384, "input": ["text"]},
            {"id": "k2.6-code-preview-free", "name": "K2.6 Code Preview Free", "reasoning": False, "ctx": 128000, "out": 16384, "input": ["text"]},
            {"id": "qwen3.6-plus-preview-free", "name": "Qwen 3.6 Plus Preview Free", "reasoning": False, "ctx": 128000, "out": 16384, "input": ["text"]},
        ],
    },
    {
        "name": "router9",
        "label": "Router9",
        "baseUrl": "https://api.router9.com/v1",
        "envKey": "ROUTER9_API_KEY",
        "models": [
            {"id": "minimax/minimax-m3", "name": "MiniMax M3 (via Router9)", "reasoning": True, "ctx": 1000000, "out": 65536, "input": ["text", "image"]},
        ],
    },
    {
        "name": "cline",
        "label": "Cline",
        "baseUrl": "https://api.cline.bot/api/v1",
        "envKey": "CLINE_API_KEY",
        "models": [
            {"id": "deepseek-ai/deepseek-v4-flash", "name": "DeepSeek V4 Flash (Free)", "reasoning": True, "ctx": 128000, "out": 32000, "input": ["text"]},
            {"id": "stepfun/step-3.7-flash", "name": "StepFun Step 3.7 Flash (Free)", "reasoning": True, "ctx": 262144, "out": 65536, "input": ["text"]},
            {"id": "poolside/laguna-s-2.1:free", "name": "Laguna S 2.1 (Free)", "reasoning": False, "ctx": 256000, "out": 32768, "input": ["text"]},
        ],
    },
]


# ── Output Generators ──────────────────────────────────────────────────────────

def generate_omp():
    """YAML for ~/.omp/agent/models.yml"""
    lines = ["# Custom providers (generated by Pi-Powerkit setup)", "providers:"]
    for p in PROVIDERS:
        key = os.environ.get(p["envKey"], f"${{{p['envKey']}}}")
        if key == "":
            key = f"${{{p['envKey']}}}"
        lines.append(f"  {p['name']}:")
        lines.append(f"    baseUrl: {p['baseUrl']}")
        lines.append(f"    apiKey: {key}")
        lines.append(f"    auth: apiKey")
        lines.append(f"    api: openai-completions")
        lines.append(f"    models:")
        for m in p["models"]:
            input_str = ", ".join(m["input"])
            lines.append(f"      - id: {m['id']}")
            lines.append(f"        name: {m['name']}")
            lines.append(f"        reasoning: {'true' if m['reasoning'] else 'false'}")
            lines.append(f"        input: [{input_str}]")
            lines.append(f"        contextWindow: {m['ctx']}")
            lines.append(f"        maxTokens: {m['out']}")
        lines.append("")
    return "\n".join(lines)


def generate_zed():
    """JSON dict for Zed settings.json → language_models.openai_compatible"""
    oc = {}
    for p in PROVIDERS:
        provider_key = p["name"].replace("-", "_")
        models = []
        for m in p["models"]:
            entry = {
                "name": m["id"],
                "display_name": m["name"],
                "max_tokens": m["ctx"],
                "max_output_tokens": m["out"],
                "protocol": "openai_chat",
                "subscription": "free",
                "reasoning_effort_levels": ["low", "medium", "high"]
            }
            models.append(entry)
        oc[provider_key] = {
            "api_url": p["baseUrl"],
            "available_models": models,
        }
    return json.dumps(oc, indent=4)


def generate_copilot():
    """JSON array for Copilot chatLanguageModels.json"""
    entries = []
    for p in PROVIDERS:
        key = os.environ.get(p["envKey"], "")
        models = []
        for m in p["models"]:
            entry = {
                "id": m["id"],
                "name": m["name"],
                "url": f"{p['baseUrl'].rstrip('/')}/chat/completions",
                "toolCalling": True,
                "maxInputTokens": m["ctx"],
                "maxOutputTokens": m["out"],
            }
            if m["reasoning"]:
                entry["thinking"] = True
                entry["supportsReasoningEffort"] = ["low", "medium", "high"]
            models.append(entry)
        entries.append({
            "name": p["label"],
            "vendor": "customendpoint",
            "apiKey": key,
            "apiType": "chat-completions",
            "models": models,
        })
    return json.dumps(entries, indent=4)


def generate_jcode():
    """Shell commands for jcode provider add"""
    cmds = []
    for p in PROVIDERS:
        key_var = p["envKey"]
        key_val = os.environ.get(key_var, "")
        if not key_val:
            cmds.append(f"# Skipped {p['name']} (${key_var} not set)")
            continue
        cmds.append(
            f'printf \'%s\' "{key_val}" | jcode provider add {p["name"]} '
            f'--base-url {p["baseUrl"]} '
            f'--model {p["models"][0]["id"]} '
            f'--api-key-stdin '
            f'--context-window {p["models"][0]["ctx"]} 2>/dev/null '
            f'&& echo "  {p["name"]} provider added to jcode" '
            f'|| echo "  jcode {p["name"]} skipped (may already exist)"'
        )
    return "\n".join(cmds)


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: generate-configs.py {omp|zed|copilot|jcode}", file=sys.stderr)
        sys.exit(1)

    target = sys.argv[1]
    if target == "omp":
        print(generate_omp())
    elif target == "zed":
        print(generate_zed())
    elif target == "copilot":
        print(generate_copilot())
    elif target == "jcode":
        print(generate_jcode())
    else:
        print(f"Unknown target: {target}", file=sys.stderr)
        print("Valid: omp, zed, copilot, jcode", file=sys.stderr)
        sys.exit(1)
