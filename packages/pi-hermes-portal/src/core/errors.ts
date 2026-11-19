export type HermesErrorCode =
    | 'hermes-not-installed'
    | 'not-logged-in'
    | 'proxy-unreachable'
    | 'proxy-start-failed'
    | 'auth-expired'
    | 'quota-exhausted'
    | 'rate-limited'
    | 'no-free-models'
    | 'bad-response'
    | 'unsupported-host'

export class HermesError extends Error {
    readonly code: HermesErrorCode
    readonly hint?: string

    constructor(code: HermesErrorCode, message: string, hint?: string) {
        super(message)
        this.name = 'HermesError'
        this.code = code
        this.hint = hint
    }
}

const STATUS_BY_CODE: Record<string, HermesErrorCode> = {
    '401': 'auth-expired',
    '403': 'auth-expired',
    '402': 'quota-exhausted',
    '429': 'rate-limited'
}

export function fromHttpStatus(status: number, body: string): HermesError {
    const code = STATUS_BY_CODE[String(status)] ?? 'bad-response'
    const detail = extractMessage(body)
    const hint =
        code === 'auth-expired'
            ? 'Run `hermes portal login`, then /hermes refresh.'
            : code === 'quota-exhausted'
              ? 'Free-tier allowance is exhausted. Nothing was switched to a paid model.'
              : code === 'rate-limited'
                ? 'Free-tier rate limit hit. Wait and retry with /hermes test.'
                : undefined
    return new HermesError(code, `Hermes proxy returned HTTP ${status}${detail ? `: ${detail}` : ''}`, hint)
}

function extractMessage(body: string): string | undefined {
    if (!body) return undefined
    try {
        const parsed = JSON.parse(body) as { error?: { message?: string } | string; message?: string }
        if (typeof parsed.error === 'string') return parsed.error
        if (parsed.error && typeof parsed.error === 'object') return parsed.error.message
        return parsed.message
    } catch {
        return body.slice(0, 200)
    }
}

export function describe(error: unknown): string {
    if (error instanceof HermesError) return error.hint ? `${error.message} — ${error.hint}` : error.message
    return error instanceof Error ? error.message : String(error)
}