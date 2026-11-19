import assert from 'node:assert/strict'
import { test } from 'node:test'

import { findHermes } from '../src/core/hermes.ts'
import { DEFAULT_HOST, ensureProxy, proxyBaseUrl } from '../src/core/proxy.ts'
import { HermesError } from '../src/core/errors.ts'

test('proxyBaseUrl is hard-bound to localhost', () => {
    assert.equal(proxyBaseUrl(8645), 'http://127.0.0.1:8645/v1')
    assert.equal(proxyBaseUrl().includes(DEFAULT_HOST), true)
    assert.equal(proxyBaseUrl().includes('0.0.0.0'), false)
})

test('ensureProxy refuses to start a proxy when Hermes is absent', async () => {
    await assert.rejects(
        () => ensureProxy(undefined, { port: 65000, allowStart: true }),
        (error: unknown) => error instanceof HermesError && error.code === 'hermes-not-installed'
    )
})

test('findHermes returns a path on this machine or undefined, never throws', () => {
    const cli = findHermes()
    assert.ok(cli === undefined || typeof cli.bin === 'string')
})