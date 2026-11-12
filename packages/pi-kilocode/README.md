# pi-kilocode

Registers **KiloCode** provider in pi with **11 live-verified free models** that produce content output.

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

## Models (live-verified 2026-11-12)

| Model | Context | Max Tokens | Reasoning | Vision |
|-------|---------|-----------|-----------|--------|
| `kilo-auto/free` | 256K | 32.8K | no | no |
| `nvidia/nemotron-3.5-super-vl:free` | 1.0M | 131K | yes | yes |
| `stealth/glyph-cluster` | 256K | 256K | yes | no |
| `baidu/ernie-5.5-flash-preview:free` | 1.0M | 921.6K | yes | no |
| `liquid/lfm-3-1.7b:free` | 262K | 8.2K | yes | no |
| `dots-studio/dots-3-note-preview:free` | 512K | 460.8K | yes | yes |
| `nvidia/nemotron-3.5-lightning:free` | 1.0M | 65.5K | yes | no |
| `cohere/north-mini-code:free` | 256K | 64K | yes | no |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1.0M | 65.5K | yes | no |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | 256K | 65.5K | yes | yes |
| `openrouter/free` | 200K | 32.8K | no | yes |

> **Note:** KiloCode proxies through OpenRouter's free tier. Models may occasionally return reasoning-only responses. Retry if you get empty output.

## Excluded Models

- `google/lyria-3-pro-preview` / `google/lyria-3-clip-preview` — music generation, not chat
- `nvidia/nemotron-3.5-content-safety:free` — content safety classifier, no output
- `thinkingmachines/inkling-2-small:free` — gateway lists it but returns `403 not available in your region`
- `stepfun/step-5-preview-free`, `inclusionai/ling-3.1-flash` — deprecated / rotated out

## Rotated Out (previously listed, no longer served by the gateway)

- `reflection/beam-free`
- `xingchen-agi/xing4.0-29b-a4b:free`
- `stealth/space-bunny-alpha`
- `nvidia/nemotron-3-super-120b-a12b:free`
- `minimax/minimax-m3.1-flash:free`
- `poolside/laguna-s-2.1:free`, `poolside/laguna-xs-2.1:free`
- `inclusionai/ling-3.0-flash-sante:free`, `inclusionai/ling-3.0-flash-fin:free`
- `qwen/qwen3.8-27b:free`
- `thinkingmachines/inkling-small:free`
- `stepfun/step-3.7-flash:free`
- `liquid/lfm-2.5-2.6b:free` (renamed to `liquid/lfm-3-1.7b:free`)

## API Key

Set `KILO_API_KEY` environment variable. Get one at [kilo.ai](https://kilo.ai).
