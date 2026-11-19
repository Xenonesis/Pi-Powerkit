import assert from 'node:assert/strict'
import { test } from 'node:test'

import { fromHttpStatus, HermesError } from '../src/core/errors.ts'
import { fetchFreeModels, fromRaw, isFree, officialFreeIds, toPiModel } from '../src/core/models.ts'

const freeIds = new Set(['stepfun/step-3.7-flash:free', 'upstage/solar-mini4:free'])

function raw(overrides: Record<string, unknown> = {}) {
    return {
        id: 'stepfun/step-3.7-flash:free',
        name: 'StepFun: Step 3.7 Flash (free)',
        context_length: 262144,
        pricing: { prompt: '0', completion: '0' },
        supported_parameters: ['tools', 'tool_choice', 'reasoning', 'reasoning_effort'],
        top_provider: { max_completion_tokens: 256000 },
        architecture: { input_modalities: ['text', 'image'] },
        ...overrides
    }
}

test('isFree only accepts zero prompt AND zero completion', () => {
    assert.equal(isFree(raw()), true)
    assert.equal(isFree(raw({ pricing: { prompt: '0', completion: '0.0000001' } })), false)
    assert.equal(isFree(raw({ pricing: { prompt: '0.000003', completion: '0' } })), false)
    assert.equal(isFree(raw({ pricing: {} })), false)
})

test('fromRaw maps context, tools and reasoning from real fields', () => {
    const model = fromRaw(raw(), freeIds)
    assert.ok(model)
    assert.equal(model.contextLength, 262144)
    assert.equal(model.maxCompletionTokens, 256000)
    assert.equal(model.supportsTools, true)
    assert.equal(model.supportsReasoning, true)
    assert.equal(model.officialFreeTier, true)
})

test('fromRaw flags zero-priced models missing from the official free list', () => {
    const model = fromRaw(raw({ id: 'qwen/qwen4-max:free' }), freeIds)
    assert.ok(model)
    assert.equal(model.officialFreeTier, false)
})

test('toPiModel always reports zero cost so paid models cannot be selected', () => {
    const model = fromRaw(raw({ id: 'qwen/qwen4-max:free' }), freeIds)
    const pi = toPiModel(model!)
    assert.deepEqual(pi.cost, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 })
    assert.equal(pi.name.includes('zero-priced'), true)
    assert.deepEqual(pi.input, ['text', 'image'])
})

test('toPiModel falls back to text-only when no image modality is advertised', () => {
    const model = fromRaw(raw({ architecture: { input_modalities: ['text'] } }), freeIds)
    assert.deepEqual(toPiModel(model!).input, ['text'])
})

test('fetchFreeModels drops paid entries and keeps zero-priced ones', async () => {
    const payload = {
        data: [
            raw(),
            raw({ id: 'google/gemini-4-neon', pricing: { prompt: '0.000003', completion: '0.000015' } }),
            raw({ id: 'upstage/solar-mini4:free' })
        ]
    }
    const original = globalThis.fetch
    globalThis.fetch = (async () => new Response(JSON.stringify(payload), { status: 200 })) as typeof fetch
    try {
        const models = await fetchFreeModels('http://127.0.0.1:8645/v1', { freeIds })
        assert.deepEqual(
            models.map((model) => model.id),
            ['stepfun/step-3.7-flash:free', 'upstage/solar-mini4:free']
        )
    } finally {
        globalThis.fetch = original
    }
})

test('fetchFreeModels reports proxy failures as HermesError', async () => {
    const original = globalThis.fetch
    globalThis.fetch = (async () => {
        throw new Error('ECONNREFUSED')
    }) as typeof fetch
    try {
        await assert.rejects(
            () => fetchFreeModels('http://127.0.0.1:8645/v1', { freeIds }),
            (error: unknown) => error instanceof HermesError && error.code === 'proxy-unreachable'
        )
    } finally {
        globalThis.fetch = original
    }
})

test('fetchFreeModels raises no-free-models instead of returning an empty catalogue', async () => {
    const original = globalThis.fetch
    globalThis.fetch = (async () =>
        new Response(JSON.stringify({ data: [raw({ pricing: { prompt: '1', completion: '1' } })] }), {
            status: 200
        })) as typeof fetch
    try {
        await assert.rejects(
            () => fetchFreeModels('http://127.0.0.1:8645/v1', { freeIds }),
            (error: unknown) => error instanceof HermesError && error.code === 'no-free-models'
        )
    } finally {
        globalThis.fetch = original
    }
})

test('auth and quota statuses map to actionable errors', () => {
    const auth = fromHttpStatus(401, 'unauthorized')
    assert.equal(auth.code, 'auth-expired')
    assert.match(auth.hint ?? '', /hermes portal login/)

    const quota = fromHttpStatus(429, 'slow down')
    assert.equal(quota.code, 'rate-limited')

    const broke = fromHttpStatus(402, 'insufficient_user_quota')
    assert.equal(broke.code, 'quota-exhausted')
})

test('officialFreeIds tolerates a missing cache file', () => {
    const ids = officialFreeIds()
    assert.ok(ids instanceof Set)
})