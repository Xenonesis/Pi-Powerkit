# pi-tokenrouter

Free TokenRouter model provider for the Pi coding agent.

Adds the `tokenrouter` provider with a single verified free model:

- `qwen/qwen3.8-max-free`

## Models

| Model | Context | Max Tokens | Reasoning |
|-------|---------|-----------|-----------|
| `qwen/qwen3.8-max-free` | 1,048,576 (1M) | 65,536 | no |

## Setup

Requires `TOKENROUTER_API_KEY` environment variable:

```bash
export TOKENROUTER_API_KEY="sk-..."
```

## Usage

```bash
pi --model tokenrouter/qwen/qwen3.8-max-free
```

## Known issues

- TokenRouter's upstream proxy may intermittently reject large requests. However, the
  proto fix in this package matters: **all provider-side tools must define a `parameters`
  schema** (via `Type.Object`) or the upstream rejects the entire request with a 422. This
  was the root cause of earlier failures (`headroom_*` tools lacking `parameters`).
- API keys are passed via `process.env.TOKENROUTER_API_KEY` — never hardcoded in this repo.