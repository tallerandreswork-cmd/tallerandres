/**
 * Sistema de Rate Limiting (Control de Tasa de Consultas y Protección Anti-Spam)
 * Diseñado para entornos Serverless (Vercel), Edge Middleware y Frontend CSR.
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

// Almacén en memoria con limpieza automática periódica
const ipRequestMap = new Map<string, RateLimitRecord>()

// Limpieza automática cada 60 segundos de IPs inactivas para evitar fugas de memoria
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [ip, record] of ipRequestMap.entries()) {
      if (now > record.resetTime) {
        ipRequestMap.delete(ip)
      }
    }
  }, 60000)

  // Permitir que el proceso Node se cierre limpiamente en tests o scripts
  if (typeof cleanupTimer === 'object' && cleanupTimer && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }
}

export interface RateLimitOptions {
  limit?: number // Máximo de peticiones permitidas en la ventana
  windowMs?: number // Tamaño de la ventana de tiempo en milisegundos (ej: 10000 = 10s)
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Evalúa si una dirección IP o identificador de cliente ha superado el límite de consultas
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = options.limit ?? 100 // 100 solicitudes por ventana por defecto
  const windowMs = options.windowMs ?? 60000 // 1 minuto por defecto
  const now = Date.now()

  const existing = ipRequestMap.get(identifier)

  if (!existing || now > existing.resetTime) {
    // Primera consulta o ventana expirada: iniciar nuevo ciclo
    const record: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    }
    ipRequestMap.set(identifier, record)
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((record.resetTime - now) / 1000),
    }
  }

  // Incrementar contador de peticiones en la ventana activa
  existing.count += 1

  if (existing.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil((existing.resetTime - now) / 1000),
    }
  }

  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    reset: Math.ceil((existing.resetTime - now) / 1000),
  }
}

/**
 * Debounce helper para evitar ráfagas de consultas al escribir en buscadores
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, waitMs)
  }
}

/**
 * Throttle helper para evitar ejecuciones repetidas antes de que pase un intervalo
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number = 500
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limitMs)
    }
  }
}
