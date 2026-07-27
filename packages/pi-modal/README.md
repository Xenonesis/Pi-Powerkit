# pi-modal

Registers **Modal** provider in pi with **2 models**.

## Setup

1. Set your API key:
   ```bash
   export MODAL_API_KEY="your-key-here"
   ```

2. Install the package:
   ```bash
   pi install git:github.com/Xenonesis/Pi-Powerkit/tree/main/packages/pi-modal
   ```

Or copy `extensions/modal-provider.ts` to `~/.pi/agent/extensions/`.

## Models & Real Context Windows

| Model | Context | Max Output | Reasoning |
|-------|---------|-----------|:---------:|
| `zai-org/GLM-5-FP8` | **128,000** (128K) | **32,768** (33K) | ❌ |
| `zai-org/GLM-5.1-FP8` | **128,000** (128K) | **32,768** (33K) | ❌ |

## API Key

Set `MODAL_API_KEY` environment variable.
