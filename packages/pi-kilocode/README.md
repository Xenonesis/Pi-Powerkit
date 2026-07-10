# pi-kilocode

Registers **KiloCode** provider in pi with **10 free models**.

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

## Models

- `kilo-auto/free`
- `poolside/laguna-m.1:free`
- `stepfun/step-3.7-flash:free`
- `cohere/north-mini-code:free`
- `nvidia/nemotron-3.5-content-safety:free`
- `nvidia/nemotron-3-ultra-550b-a55b:free`
- `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
- `poolside/laguna-xs.2:free`
- `nvidia/nemotron-3-super-120b-a12b:free`
- `openrouter/free`

## API Key

Set `KILO_API_KEY` environment variable. Get one at [kilo.ai](https://kilo.ai).
