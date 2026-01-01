// Pluggable rate limiter with optional Upstash Redis backend.
// Falls back to in-memory sliding window when Upstash is not configured or on error.

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterMs?: number
}

type Entry = {
  count: number
  resetAt: number
}

const memoryBuckets: Map<string, Entry> = new Map()

function memoryRateLimit(namespacedKey: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = memoryBuckets.get(namespacedKey)
  if (!entry || entry.resetAt <= now) {
    memoryBuckets.set(namespacedKey, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1 }
  }
  if (entry.count < max) {
    entry.count += 1
    return { allowed: true, remaining: max - entry.count }
  }
  return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now }
}

async function upstashRateLimit(namespacedKey: string, max: number, windowMs: number): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return memoryRateLimit(namespacedKey, max, windowMs)
  }

  const now = Date.now()
  const windowId = Math.floor(now / windowMs)
  const key = `rl:${namespacedKey}:${windowId}`
  const remainingMs = windowMs - (now - windowId * windowMs)

  try {
    // Pipeline: INCR key; PEXPIRE key remainingMs
    const body = [
      { command: ['INCR', key] },
      { command: ['PEXPIRE', key, String(remainingMs)] },
      { command: ['PTTL', key] },
    ]

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!resp.ok) throw new Error(`Upstash error: ${resp.status}`)
    const results: Array<{ result: number }> = await resp.json()
    const count = Number(results?.[0]?.result ?? 1)
    const pttl = Number(results?.[2]?.result ?? remainingMs)
    const allowed = count <= max
    return { allowed, remaining: Math.max(0, max - count), retryAfterMs: allowed ? undefined : pttl }
  } catch (e) {
    // Fallback to memory on any error
    return memoryRateLimit(namespacedKey, max, windowMs)
  }
}

export function getClientKey(req: Request, opts?: { userID?: string; teamID?: string }) {
  const h = (name: string) => req.headers.get(name)
  if (opts?.userID) return `uid:${opts.userID}`
  if (opts?.teamID) return `tid:${opts.teamID}`
  const xff = h('x-forwarded-for') || ''
  const ip = xff.split(',')[0]?.trim() || h('x-real-ip') || 'unknown'
  return `ip:${ip}`
}

export async function rateLimitAsync(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  return upstashRateLimit(key, max, windowMs)
}

// Backwards-compatible sync API (memory only)
export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  return memoryRateLimit(key, max, windowMs)
}

export function cleanupExpired() {
  const now = Date.now()
  for (const [k, v] of memoryBuckets.entries()) {
    if (v.resetAt <= now) memoryBuckets.delete(k)
  }
}
