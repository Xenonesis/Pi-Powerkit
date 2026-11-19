# pi-twigpine

Registers **Twigpine** (twigpine.com/opengateway) provider in pi with **3 free models**.

## Setup

1. Set your Twigpine API key:
   ```bash
   export OPENGATEWAY_API_KEY="your-key-here"
   ```

2. Add to `~/.pi/agent/settings.json`:
   ```json
   {
     "packages": ["git:github.com/Xenonesis/Pi-Powerkit.git/packages/pi-opengateway"]
   }
   ```

Or just copy `extensions/opengateway-provider.ts` to `~/.pi/agent/extensions/`.

## Models (All FREE)

| Model | Context | Max Tokens | Input | Notes |
|-------|---------|-----------|-------|-------|
| `qwen/qwen3.8-max` | 262K | 8K | text | Qwen 3.8 Max, reasoning, free promo till 2026-11-13 |
| `qwen/qwen3.8-flash` | 1M | 8K | text | Qwen 3.8 Flash, fast reasoning, free promo till 2026-11-13 |
| `nvidia/nemotron-3.5-super-vl:free` | 1M | 131K | text+image | Nemotron 3.5 Super VL, vision |

## Rotated out (no longer free / gone from gateway)

- `nvidia/nemotron-3-ultra-550b-a55b:free` (replaced by nemotron-3.5-super-vl:free)
- `inclusionai/ling-3.0-flash:free` (now paid)
- `mindai/macaron-v1-tall` (promo ended)

## API Key

Set `OPENGATEWAY_API_KEY` environment variable. Get one at [twigpine.com/opengateway](https://twigpine.com/opengateway).
