# pi-router9

Registers **Router9** provider in pi with **1 models**.

## Setup

1. Set your API key:
   ```bash
   export ROUTER9_API_KEY="your-key-here"
   ```

2. Install the package:
   ```bash
   pi install git:github.com/Xenonesis/Pi-Powerkit/tree/main/packages/pi-router9
   ```

Or copy `extensions/router9-provider.ts` to `~/.pi/agent/extensions/`.

## Models & Real Context Windows

| Model | Context | Max Output | Reasoning |
|-------|---------|-----------|:---------:|
| `minimax/minimax-m3` | **1,000,000** (1000K) | **65,536** (66K) | ✅ |

## API Key

Set `ROUTER9_API_KEY` environment variable.
