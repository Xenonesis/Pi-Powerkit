# pi-opengateway

Registers **OpenGateway** (gitlawb.com) provider in pi with **3 free models**.

## Setup

1. Set your OpenGateway API key:
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

| Model | Context | Max Tokens | Notes |
|-------|---------|-----------|-------|
| `inclusionai/ling-3.0-flash:free` | 262K | 65K | Ling 3.0 Flash, token-efficient |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 131K | 65K | Nemotron 3 Ultra, reasoning |
| `mindai/macaron-v1-tall` | 262K | 65K | Macaron V1 Tall, free promo till Aug 10 |
| ~~`tencent/hy3`~~ | ~~262K~~ | ~~65K~~ | **Removed** (paid model) |

> Free promo on macaron-v1-tall ends 2026-08-10. Tencom/hy3 is paid.

## API Key

Set `OPENGATEWAY_API_KEY` environment variable. Get one at [gitlawb.com/opengateway](https://gitlawb.com/opengateway).
