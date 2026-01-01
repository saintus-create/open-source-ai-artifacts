import { NextResponse } from 'next/server'
import { validateEnvironment, getAvailableProviders } from '@/lib/validation'

export const dynamic = 'force-dynamic'

function authGuard(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = process.env.ADMIN_TOKEN
  const isProd = process.env.NODE_ENV === 'production'
  if (isProd && token) {
    if (!auth.startsWith('Bearer ') || auth.slice(7) !== token) {
      return NextResponse.json({ error: { code: 'unauthorized', message: 'Missing or invalid admin token' } }, { status: 401 })
    }
  }
  return null
}

export async function GET(req: Request) {
  const guard = authGuard(req)
  if (guard) return guard

  const report: any = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    providers: [] as string[],
    checks: {
      envValid: false,
      vertexCredentialsValid: true,
    },
    details: {
      missingEnv: [] as string[],
      vertexMissingFields: [] as string[],
    }
  }

  // Validate general environment
  try {
    validateEnvironment()
    report.checks.envValid = true
  } catch (e: any) {
    report.status = 'degraded'
    report.checks.envValid = false
    report.details.missingEnv = (e?.message || '').split('\n').slice(1).filter(Boolean)
  }

  // Providers from env
  try {
    report.providers = getAvailableProviders()
  } catch {}

  // Vertex credentials sanity check (no external calls)
  try {
    if (process.env.GOOGLE_VERTEX_CREDENTIALS) {
      const creds = JSON.parse(process.env.GOOGLE_VERTEX_CREDENTIALS)
      const needed = ['client_email', 'private_key', 'project_id']
      const missing = needed.filter((k) => !creds?.[k])
      if (missing.length) {
        report.status = 'degraded'
        report.checks.vertexCredentialsValid = false
        report.details.vertexMissingFields = missing
      }
    }
  } catch {
    report.status = 'degraded'
    report.checks.vertexCredentialsValid = false
  }

  return NextResponse.json(report, { status: report.status === 'ok' ? 200 : 200 })
}
