import { z } from 'zod'

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
})
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

export function jsonError(code: string, message: string, status = 500, details?: unknown) {
  const body: ErrorResponse = { error: { code, message, details } }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function methodGuard(req: Request, allowed: string[]) {
  if (!allowed.includes(req.method)) {
    return jsonError('method_not_allowed', `Method ${req.method} not allowed`, 405)
  }
  return null
}

export function withTimeout<T>(promise: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`))
    }, ms)

    const onAbort = () => {
      clearTimeout(id)
      reject(new Error('Aborted'))
    }

    if (signal) {
      if (signal.aborted) onAbort()
      signal.addEventListener('abort', onAbort, { once: true })
    }

    promise
      .then((v) => {
        clearTimeout(id)
        resolve(v)
      })
      .catch((e) => {
        clearTimeout(id)
        reject(e)
      })
  })
}

export function parseJson<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request) => {
    try {
      const data = await req.json()
      const parsed = schema.safeParse(data)
      if (!parsed.success) {
        return {
          ok: false as const,
          error: jsonError('invalid_request', 'Invalid JSON payload', 400, parsed.error.flatten()),
        }
      }
      return { ok: true as const, data: parsed.data as z.infer<T> }
    } catch (e) {
      return { ok: false as const, error: jsonError('invalid_json', 'Malformed JSON body', 400) }
    }
  }
}
