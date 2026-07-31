# pi-opengateway

Registers **OpenGateway** (gitlawb.com) provider in pi with free models.

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

## Models

| Model | Context | Cost |
|-------|---------|------|
| `inclusionai/ling-3.0-flash:free` | 262K | Free |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 131K | Free |
| `mindai/macaron-v1-tall` | 262K | Free (promo) |
| `tencent/hy3` | 262K | Paid |

## API Key

Set `OPENGATEWAY_API_KEY` environment variable. Get one at [gitlawb.com](https://gitlawb.com/opengateway).
