import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit } from './lib/rate-limiter'

export function middleware(request: NextRequest) {
  // Ignorar peticiones de recursos estáticos internos de Next.js
  const pathname = request.nextUrl.pathname
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    pathname.includes('.') // archivos como .ico, .png, .svg, .css, etc.
  ) {
    return NextResponse.next()
  }

  // Obtener IP real del cliente (compatible con Vercel, proxies inversos y Cloudflare)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const clientIp =
    (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1'

  // Aplicar Rate Limiting: Máximo 120 consultas por minuto por dirección IP
  const rateLimitResult = checkRateLimit(clientIp, {
    limit: 120,
    windowMs: 60000,
  })

  // Si la IP supera el umbral permitido, bloquear con HTTP 429 Too Many Requests
  if (!rateLimitResult.success) {
    return new NextResponse(
      JSON.stringify({
        status: 429,
        error: 'Too Many Requests',
        message:
          'Has alcanzado el límite de consultas permitidas. Por favor espera unos segundos antes de reintentar.',
        retryAfterSeconds: rateLimitResult.reset,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': String(rateLimitResult.reset),
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        },
      }
    )
  }

  // Continuar con la petición normal agregando las cabeceras estándar de tasa
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit))
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
  response.headers.set('X-RateLimit-Reset', String(rateLimitResult.reset))

  return response
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto archivos estáticos
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

