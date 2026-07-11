# pi-agentrouter

Registers **AgentRouter** provider in pi with **5 models**.

## Setup

1. Set your AgentRouter API key:
   ```bash
   export AGENTROUTER_API_KEY="your-key-here"
   ```

2. Add to `~/.pi/agent/settings.json`:
   ```json
   {
     "packages": ["git:github.com/Xenonesis/Pi-Powerkit.git/packages/pi-agentrouter"]
   }
   ```

Or just copy `extensions/agentrouter-provider.ts` to `~/.pi/agent/extensions/`.

## Models & Real Context Windows

| Model | Provider | Context | Max Output | Input |
|-------|----------|---------|-----------|-------|
| `gpt-5.5` | OpenAI | **1,048,576** (1M) | **131,072** (128K) | text, image |
| `claude-opus-4-6` | Anthropic | **1,000,000** (1M) | **131,072** (128K) | text, image |
| `claude-opus-4-7` | Anthropic | **1,000,000** (1M) | **131,072** (128K) | text, image |
| `claude-opus-4-8` | Anthropic | **1,000,000** (1M) | **131,072** (128K) | text, image |
| `glm-5.2` | Z.ai | **1,048,576** (1M) | **131,072** (128K) | text |

## API Key

Set `AGENTROUTER_API_KEY` environment variable. Get one at [agentrouter.org](https://agentrouter.org).
