# pi-databricks

Registers **Databricks** provider in pi with **1 models**.

## Setup

1. Set your API key:
   ```bash
   export DATABRICKS_API_KEY="your-key-here"
   ```

2. Install the package:
   ```bash
   pi install git:github.com/Xenonesis/Pi-Powerkit/tree/main/packages/pi-databricks
   ```

Or copy `extensions/databricks-provider.ts` to `~/.pi/agent/extensions/`.

## Models & Real Context Windows

| Model | Context | Max Output | Reasoning |
|-------|---------|-----------|:---------:|
| `system.ai.glm-5-2` | **128,000** (128K) | **32,768** (33K) | ❌ |

## API Key

Set `DATABRICKS_API_KEY` environment variable.
