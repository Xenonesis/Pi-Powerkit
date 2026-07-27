# pi-xiaomi

Registers **Xiaomi** provider in pi with **2 models**.

## Setup

1. Set your API key:
   ```bash
   export XIAOMI_API_KEY="your-key-here"
   ```

2. Install the package:
   ```bash
   pi install git:github.com/Xenonesis/Pi-Powerkit/tree/main/packages/pi-xiaomi
   ```

Or copy `extensions/xiaomi-provider.ts` to `~/.pi/agent/extensions/`.

## Models & Real Context Windows

| Model | Context | Max Output | Reasoning |
|-------|---------|-----------|:---------:|
| `mimo-v2.5` | **1,048,576** (1049K) | **131,072** (131K) | ❌ |
| `mimo-v2.5-pro` | **1,048,576** (1049K) | **131,072** (131K) | ❌ |

## API Key

Set `XIAOMI_API_KEY` environment variable.
