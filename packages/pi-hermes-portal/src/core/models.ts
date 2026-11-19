import { HermesError, fromHttpStatus } from './errors.js'
import { PROXY_PLACEHOLDER_KEY } from './proxy.js'

export type HermesModel = {
    id: string
    name: string
    contextLength: number
    maxCompletionTokens?: number
    pricing: { prompt: number; completion: number }
    supportsTools: boolean
    supportsReasoning: boolean
    inputModalities: string[]
    /** true when Nous Portal lists the model in `freeRecommendedModels` */
    officialFreeTier: boolean
}

export type PiModel = {
    id: string
    name: string
    reasoning: boolean
    input: ('text' | 'image')[]
    cost: { input: number; output: number; cacheRead: number; cacheWrite: number }
    contextWindow: number
    maxTokens: number
}

const DEFAULT_CONTEXT = 128_000
const DEFAULT_MAX_TOKENS = 16_384

/**
 * Model IDs on Nous Portal's published free-tier list, read from the
 * Hermes model picker cache. Absent cache means "unknown", never "paid".
 */
export function officialFreeIds(): Set<string> {
    const root = process.env.LOCALAPPDATA
    if (!root) return new Set()
    const candidates = [
        `${root}\\hermes\\cache\\nous_recommended_cache.json`,
        `${root}/hermes/cache/nous_recommended_cache.json`
    ]
    for (const path of candidates) {
        try {
            const raw = require('node:fs') as typeof import('node:fs')
            const text = raw.readFileSync(path, 'utf8')
            const parsed = JSON.parse(text) as Record<string, { data?: Record<string, unknown> }>
            const sections = Object.values(parsed)
            const free = sections
                .flatMap((section) => section?.data ?? {})
                .flatMap((data) => {
                    const list = (data as { freeRecommendedModels?: { modelName?: string }[] })
                        .freeRecommendedModels
                    return Array.isArray(list) ? list : []
                })
                .map((entry) => entry?.modelName)
                .filter((id): id is string => typeof id === 'string' && id.length > 0)
            if (free.length > 0) return new Set(free)
        } catch {
            // cache absent or unreadable — continue
        }
    }
    return new Set()
}

type RawModel = {
    id?: string
    name?: string
    context_length?: number
    pricing?: { prompt?: string | number; completion?: string | number }
    supported_parameters?: string[]
    top_provider?: { max_completion_tokens?: number }
    architecture?: { input_modalities?: string[] }
}

function num(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Only zero-priced models are ever exposed, so a paid model cannot be selected.
 * Missing pricing is NOT free: unknown cost is treated as paid (fail closed).
 */
export function isFree(raw: RawModel): boolean {
    const prompt = raw.pricing?.prompt
    const completion = raw.pricing?.completion
    if (prompt === undefined || completion === undefined || prompt === null || completion === null) return false
    return num(prompt) === 0 && num(completion) === 0
}

export function toPiModel(model: HermesModel): PiModel {
    const acceptsImage = model.inputModalities.includes('image')
    return {
        id: model.id,
        name: `${model.name}${model.officialFreeTier ? '' : ' (zero-priced)'}`,
        reasoning: model.supportsReasoning,
        input: acceptsImage ? ['text', 'image'] : ['text'],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: model.contextLength || DEFAULT_CONTEXT,
        maxTokens: model.maxCompletionTokens || DEFAULT_MAX_TOKENS
    }
}

export function fromRaw(raw: RawModel, freeIds: Set<string>): HermesModel | undefined {
    if (!raw.id) return undefined
    const parameters = raw.supported_parameters ?? []
    const modalities = raw.architecture?.input_modalities ?? ['text']
    return {
        id: raw.id,
        name: raw.name?.trim() || raw.id,
        contextLength: raw.context_length ?? DEFAULT_CONTEXT,
        maxCompletionTokens: raw.top_provider?.max_completion_tokens,
        pricing: {
            prompt: num(raw.pricing?.prompt),
            completion: num(raw.pricing?.completion)
        },
        supportsTools: parameters.includes('tools') || parameters.includes('tool_choice'),
        supportsReasoning:
            parameters.includes('reasoning') ||
            parameters.includes('reasoning_effort') ||
            parameters.includes('include_reasoning'),
        inputModalities: modalities,
        officialFreeTier: freeIds.has(raw.id)
    }
}

export async function fetchFreeModels(
    baseUrl: string,
    options: { signal?: AbortSignal; freeIds?: Set<string> } = {}
): Promise<HermesModel[]> {
    const freeIds = options.freeIds ?? officialFreeIds()
    let response: Response
    try {
        response = await fetch(`${baseUrl}/models`, {
            headers: { authorization: `Bearer ${PROXY_PLACEHOLDER_KEY}` },
            signal: options.signal ?? AbortSignal.timeout(20_000)
        })
    } catch (error) {
        throw new HermesError(
            'proxy-unreachable',
            `Cannot reach Hermes proxy at ${baseUrl}`,
            error instanceof Error ? error.message : undefined
        )
    }
    if (!response.ok) throw fromHttpStatus(response.status, await response.text().catch(() => ''))

    const payload = (await response.json()) as { data?: RawModel[]; models?: RawModel[] }
    const list = payload.data ?? payload.models ?? []
    const free = list
        .filter(isFree)
        .map((raw) => fromRaw(raw, freeIds))
        .filter((model): model is HermesModel => model !== undefined)

    if (free.length === 0) {
        throw new HermesError(
            'no-free-models',
            'Proxy reported no zero-priced models for this account',
            'Free-tier availability can change. Re-check https://portal.nousresearch.com.'
        )
    }
    return free
}

export function modelLines(models: HermesModel[]): string[] {
    if (models.length === 0) return ['No Hermes free models available.']
    return models.map((model) => {
        const flags = [
            model.officialFreeTier ? 'free-tier' : 'zero-priced',
            model.supportsTools ? 'tools' : null,
            model.supportsReasoning ? 'reasoning' : null,
            `ctx ${Math.round(model.contextLength / 1024)}K`
        ].filter(Boolean)
        return `  hermes-portal/${model.id}  (${flags.join(', ')})`
    })
}