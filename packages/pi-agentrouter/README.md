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

## Models

| Model | Type | Context |
|-------|------|---------|
| `gpt-5.5` | OpenAI-compat | 128K |
| `claude-opus-4-6` | Claude Opus | 200K |
| `claude-opus-4-7` | Claude Opus | 200K |
| `claude-opus-4-8` | Claude Opus | 200K |
| `glm-5.2` | GLM | 128K |

## API Key

Set `AGENTROUTER_API_KEY` environment variable. Get one at [agentrouter.org](https://agentrouter.org).
