# pi-aihubmix

Registers **Aihubmix** provider in pi with **25 models**.

## Setup

1. Set your API key:
   ```bash
   export AIHUBMIX_API_KEY="your-key-here"
   ```

2. Install the package:
   ```bash
   pi install git:github.com/Xenonesis/Pi-Powerkit/tree/main/packages/pi-aihubmix
   ```

Or copy `extensions/aihubmix-provider.ts` to `~/.pi/agent/extensions/`.

## Models & Real Context Windows

| Model | Context | Max Output | Reasoning |
|-------|---------|-----------|:---------:|
| `coding-glm-5.2-free` | **128,000** (128K) | **65,536** (66K) | ✅ |
| `coding-kimi-k3-free` | **128,000** (128K) | **32,768** (33K) | ❌ |
| `gemini-3.5-flash-lite-free` | **128,000** (128K) | **16,384** (16K) | ❌ |
| `gemini-3.6-flash-free` | **128,000** (128K) | **32,768** (33K) | ❌ |
| `gpt-oss-20b-free` | **128,000** (128K) | **16,384** (16K) | ❌ |
| `nemotron-nano-9b-v2-free` | **128,000** (128K) | **16,384** (16K) | ✅ |
| `laguna-m.1-free` | **256,000** (256K) | **32,768** (33K) | ✅ |
| `nemotron-3-ultra-550b-a55b-free` | **1,000,000** (1000K) | **65,536** (66K) | ✅ |
| `nemotron-3-nano-30b-a3b-free` | **128,000** (128K) | **16,384** (16K) | ❌ |
| `gemma-4-26b-a4b-it-free` | **262,144** (262K) | **32,768** (33K) | ❌ |
| `gpt-5.5-free` | **272,000** (272K) | **65,536** (66K) | ❌ |
| `xiaomi-mimo-v2-omni-free` | **1,048,576** (1049K) | **131,072** (131K) | ❌ |
| `xiaomi-mimo-v2-pro-free` | **1,048,576** (1049K) | **131,072** (131K) | ❌ |
| `xiaomi-mimo-v2.5-free` | **1,048,576** (1049K) | **131,072** (131K) | ❌ |
| `xiaomi-mimo-v2.5-pro-free` | **1,048,576** (1049K) | **131,072** (131K) | ❌ |
| `coding-minimax-m2.7-free` | **256,000** (256K) | **65,536** (66K) | ❌ |
| `coding-glm-5.1-free` | **128,000** (128K) | **32,768** (33K) | ❌ |
| `coding-glm-5-free` | **128,000** (128K) | **32,768** (33K) | ❌ |
| `coding-glm-5-turbo-free` | **128,000** (128K) | **32,768** (33K) | ❌ |
| `coding-minimax-m2.5-free` | **256,000** (256K) | **65,536** (66K) | ❌ |
| `gemini-3-flash-preview-free` | **128,000** (128K) | **16,384** (16K) | ❌ |
| `mimo-v2-flash-free` | **1,048,576** (1049K) | **131,072** (131K) | ❌ |
| `kimi-for-coding-free` | **128,000** (128K) | **16,384** (16K) | ❌ |
| `k2.6-code-preview-free` | **128,000** (128K) | **16,384** (16K) | ❌ |
| `qwen3.6-plus-preview-free` | **128,000** (128K) | **16,384** (16K) | ❌ |

## API Key

Set `AIHUBMIX_API_KEY` environment variable.
