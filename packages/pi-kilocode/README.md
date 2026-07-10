# pi-kilocode

Registers **KiloCode** provider in pi with **5 proven free models** that produce content output.

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

## Models (Content-Producing)

| Model | Context | Max Tokens | Notes |
|-------|---------|-----------|-------|
| `kilo-auto/free` | 128K | 65K | Auto-router, sometimes reasoning-only |
| `stepfun/step-3.7-flash:free` | 262K | 65K | Fast, sometimes reasoning-only |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1M | 65K | 1M context, sometimes reasoning-only |
| `nvidia/nemotron-3-super-120b-a12b:free` | 1M | 262K | **Most reliable**, consistently produces content |
| `openrouter/free` | 200K | 8K | Consistent content output |

> **Note:** KiloCode proxies through OpenRouter's free tier. Models may occasionally return reasoning-only responses. Retry if you get empty output.

## Removed Models

The following were removed because they consistently return `content: null` (reasoning-only or empty):
- `poolside/laguna-m.1:free` — never produces content
- `cohere/north-mini-code:free` — rate limited / empty
- `nvidia/nemotron-3.5-content-safety:free` — content safety (no output)
- `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` — API errors
- `poolside/laguna-xs.2:free` — empty

## API Key

Set `KILO_API_KEY` environment variable. Get one at [kilo.ai](https://kilo.ai).
