import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'

import { describe, HermesError } from '../core/errors.js'
import { type HermesModel, fetchFreeModels, modelLines, toPiModel } from '../core/models.js'
import { ensureProxy } from '../core/proxy.js'

export type HermesContext = {
    baseUrl: string
    port: number
    models: HermesModel[]
}

export type Refresh = (options?: { allowStart?: boolean }) => Promise<HermesContext>

/** `/hermes models` — only models the proxy priced at zero. */
export function modelsCommand(refresh: Refresh) {
    return async function models(args: string): Promise<string> {
        if (args.trim() === 'refresh') {
            try {
                const ctx = await refresh()
                return [`Refreshed: ${ctx.models.length} Hermes free model(s).`, '', ...modelLines(ctx.models)].join(
                    '\n'
                )
            } catch (error) {
                return `Refresh failed: ${describe(error)}`
            }
        }
        const ctx = await refresh({ allowStart: false }).catch(() => undefined)
        const models = ctx?.models ?? []
        const official = models.filter((model) => model.officialFreeTier).length
        return [
            `${models.length} zero-priced model(s) via ${ctx?.baseUrl ?? 'proxy unavailable'} (${official} on the official free list):`,
            '',
            ...modelLines(models),
            '',
            'cost.input/output are reported as 0 by the proxy; no paid model is ever registered.'
        ].join('\n')
    }
}

/** `/hermes test` — real completion against the cheapest free model. */
export function testCommand(refresh: Refresh) {
    return async function test(): Promise<string> {
        let ctx: HermesContext
        try {
            ctx = await refresh()
        } catch (error) {
            return `Test failed: ${describe(error)}`
        }
        const preferred =
            ctx.models.find((model) => model.officialFreeTier && model.supportsReasoning) ??
            ctx.models.find((model) => model.officialFreeTier) ??
            ctx.models[0]
        if (!preferred) return 'Test failed: no free models registered.'

        const started = Date.now()
        try {
            const response = await fetch(`${ctx.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'content-type': 'application/json', authorization: 'Bearer hermes-local' },
                body: JSON.stringify({
                    model: preferred.id,
                    messages: [{ role: 'user', content: 'Reply with the single word OK' }],
                    max_tokens: 32
                }),
                signal: AbortSignal.timeout(60_000)
            })
            if (!response.ok) {
                const body = await response.text().catch(() => '')
                return `Test failed (${preferred.id}): ${describe(
                    new HermesError('bad-response', `HTTP ${response.status}`, body.slice(0, 160))
                )}`
            }
            const payload = (await response.json()) as {
                choices?: { message?: { content?: string } }[]
                usage?: { cost?: number; cost_details?: { source?: string } }
            }
            const content = payload.choices?.[0]?.message?.content?.trim() ?? '(empty)'
            const cost = payload.usage?.cost
            const source = payload.usage?.cost_details?.source ?? 'unknown'
            return [
                `OK — ${preferred.id} answered in ${Date.now() - started}ms`,
                `reply: ${content.slice(0, 120)}`,
                `cost: ${cost ?? 'n/a'} (source: ${source})`,
                ...(cost === 0 ? [] : ['warning: this call was not billed at zero — investigate before continuing.'])
            ].join('\n')
        } catch (error) {
            return `Test failed (${preferred.id}): ${describe(error)}`
        }
    }
}

export type Commands = {
    status: () => Promise<string>
    models: ReturnType<typeof modelsCommand>
    test: ReturnType<typeof testCommand>
    refresh: () => Promise<string>
    setup: () => Promise<string>
    quota: string
}

export function registerHermesCommands(pi: ExtensionAPI, commands: Commands): void {
    pi.registerCommand('hermes', {
        description: 'Hermes / Nous Portal free models: status, models, refresh, test',
        getArgumentCompletions: (prefix: string) =>
            ['status', 'models', 'refresh', 'test', 'setup', 'quota']
                .map((value) => ({ value, label: value, description: `hermes ${value}` }))
                .filter((item) => item.value.startsWith(prefix.trim())),
        handler: async (args: string) => {
            const sub = args.trim().split(/\s+/).filter(Boolean)[0] ?? 'status'
            let text: string
            switch (sub) {
                case 'models':
                    text = await commands.models(args)
                    break
                case 'test':
                    text = await commands.test()
                    break
                case 'refresh':
                    text = await commands.refresh()
                    break
                case 'setup':
                    text = await commands.setup()
                    break
                case 'quota':
                    text = commands.quota
                    break
                default:
                    text = await commands.status()
            }
            await pi.sendMessage({ customType: 'hermes-portal', display: true, content: text }, { triggerTurn: false })
        }
    })
}