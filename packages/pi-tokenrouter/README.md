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
## Known issue: multi-turn tool-call 400 on DeepSeek

TokenRouter's DeepSeek upstream requires **non-empty `reasoning_content`** on assistant
messages when replaying a thinking tool-call history. Pi's compiled OpenAI adapter
(`openai-completions.js`, ~line 976) sets `reasoning_content = ""` (empty) when no
thinking was captured, which the upstream rejects with:

```
400 messages[N].reasoning_content is required for thinking tool-call history
```

**Workaround (applied locally):** patch the compiled adapter to use a non-empty
placeholder (a single space) instead of `""`:

```js
// dist/api/openai-completions.js
assistantMsg.reasoning_content = " ";  // non-empty placeholder
```

Any non-empty string satisfies the upstream. **Note:** this is a patch to a compiled
node_modules file — a `pi update` will reset it and the patch must be re-applied.
