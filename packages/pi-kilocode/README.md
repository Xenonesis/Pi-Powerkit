# pi-kilocode

Registers **KiloCode** provider in pi with **17 live verified free models**.

## Setup

1. Set your KiloCode API key:
   ```bash
   export KILO_API_KEY="your-key-here"
   ```

2. Add to `~/.pi/agent/settings.json`:
   ```json
   {
     "packages": ["git:github.com/Xenonesis/Pi-Powerkit.git/packages/pi-kilocode"]
   }
   ```

Or just copy `extensions/kilocode-provider.ts` to `~/.pi/agent/extensions/`.

## Live Free Models (17 Models)

| Model | Context | Max Tokens | Modalities |
|-------|---------|------------|------------|
| `kilo-auto/free` | 256K | 32K | text |
| `stealth/space-bunny-alpha` | 1M | 524K | text, image, video |
| `poolside/laguna-s-2.1:free` | 262K | 32K | text |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1M | 65K | text (reasoning) |
| `dots-studio/dots-3-note-preview:free` | 512K | 460K | text, image (reasoning) |
| `inclusionai/ling-3.0-flash-sante:free` | 262K | 32K | text |
| `inclusionai/ling-3.0-flash-fin:free` | 262K | 32K | text |
| `qwen/qwen3.8-27b:free` | 262K | 235K | text, image, video |
| `liquid/lfm-2.5-2.6b:free` | 65K | 8K | text |
| `nvidia/nemotron-3.5-lightning:free` | 1M | 65K | text |
| `thinkingmachines/inkling-small:free` | 1M | 262K | text, image, audio |
| `poolside/laguna-xs-2.1:free` | 262K | 32K | text |
| `cohere/north-mini-code:free` | 256K | 64K | text |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | 256K | 65K | text, audio, image, video (reasoning) |
| `nvidia/nemotron-3-super-120b-a12b:free` | 262K | 235K | text |
| `openrouter/free` | 200K | 32K | text, image |
| `stepfun/step-3.7-flash:free` | 262K | 262K | text, image (reasoning) |

> **Note:** The extension dynamically fetches and caches the free model list from KiloCode API at startup, falling back to this verified static list.

## Removed Models

The following were removed because they consistently return `content: null` (reasoning-only or empty):
- `poolside/laguna-m.1:free` — never produces content
- `cohere/north-mini-code:free` — rate limited / empty
- `nvidia/nemotron-3.5-content-safety:free` — content safety (no output)
- `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` — API errors
- `poolside/laguna-xs.2:free` — empty

## API Key

Set `KILO_API_KEY` environment variable. Get one at [kilo.ai](https://kilo.ai).
