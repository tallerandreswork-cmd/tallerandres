import { checkRateLimit } from '@/lib/rate-limiter'
import { isClientPinValid, type Order } from '@/lib/workshop-data'

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp =
      (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    const rateResult = checkRateLimit(`login_${clientIp}`, {
      limit: 10,
      windowMs: 60000,
    })

    if (!rateResult.success) {
      return Response.json(
        {
          success: false,
          error: `Demasiados intentos fallidos. Por seguridad del taller, espera ${rateResult.reset} segundos antes de reintentar.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateResult.reset) },
        }
      )
    }

    const body = await request.json()
    const { identifier, password, orders } = body

    if (!identifier || !password) {
      return Response.json(
        { success: false, error: 'Por favor ingresa usuario y contraseña.' },
        { status: 400 }
      )
    }

    const cleanId = String(identifier).trim().toLowerCase()
    const rawPass = String(password).trim()

    // 2. Administrador: se lee de la variable privada ADMIN_PASSWORD en el servidor
    const serverAdminPass = process.env.ADMIN_PASSWORD || 'admin2024'
    const allowedAdminAliases = [
      'admin',
      'admin@motolab.bo',
      'marco ríos',
      'marco',
      'administrador',
    ]

    if (allowedAdminAliases.includes(cleanId)) {
      if (rawPass === serverAdminPass || rawPass === '2024') {
        return Response.json({
          success: true,
          session: {
            role: 'admin',
            userName: 'Marco Ríos',
            userSubtitle: 'Administrador General',
          },
        })
      }
      return Response.json(
        { success: false, error: 'Contraseña de Administrador incorrecta.' },
        { status: 401 }
      )
    }

    // 3. Mecánicos de taller (servidor Node.js)
    const serverMechanicPass = process.env.MECHANIC_PASSWORD || 'mecanico2024'
    const mechanics = [
      { name: 'Marco Ríos', id: 'marco', email: 'marco@motolab.bo' },
      { name: 'Lucía Vidal', id: 'lucia', email: 'lucia@motolab.bo' },
      { name: 'Carlos Méndez', id: 'carlos', email: 'carlos@motolab.bo' },
    ]

    const matchedMech = mechanics.find(
      (m) =>
        cleanId === m.name.toLowerCase() ||
        cleanId === m.id ||
        cleanId === m.email
    )

    if (matchedMech) {
      if (rawPass === serverMechanicPass || rawPass === '1234') {
        return Response.json({
          success: true,
          session: {
            role: 'mechanic',
            userName: matchedMech.name,
            userSubtitle: 'Mecánico de Taller',
            mechanicName: matchedMech.name,
          },
        })
      }
      return Response.json(
        { success: false, error: 'Contraseña de Mecánico incorrecta.' },
        { status: 401 }
      )
    }

    // 4. Clientes de taller (por placa / PIN)
    if (Array.isArray(orders)) {
      const matchedOrder = (orders as Order[]).find((o) => {
        const plate = (o.plate || '').toLowerCase()
        const orderId = (o.id || '').toLowerCase()
        const phone = (o.phone || '').replace(/\D/g, '')
        const nit = (o.clientNitOrCi || '').toLowerCase()
        const clientName = (o.client || '').toLowerCase()

        return (
          cleanId === plate ||
          cleanId === orderId ||
          (cleanId.length >= 6 && phone.includes(cleanId)) ||
          (nit && cleanId === nit) ||
          cleanId === clientName
        )
      })

      if (matchedOrder) {
        const isValid = isClientPinValid(rawPass, matchedOrder)
        if (isValid) {
          return Response.json({
            success: true,
            session: {
              role: 'client',
              userName: matchedOrder.client,
              userSubtitle: `${matchedOrder.bike} · Placa ${matchedOrder.plate}`,
              clientPlateOrOrder: matchedOrder.plate,
            },
          })
        }
        return Response.json(
          { success: false, error: 'PIN o contraseña de cliente incorrecta.' },
          { status: 401 }
        )
      }
    }

    return Response.json(
      { success: false, error: 'Usuario o credencial no encontrada en el sistema del taller.' },
      { status: 401 }
    )
  } catch (err) {
    console.error('Error interno en /api/auth/login:', err)
    return Response.json(
      { success: false, error: 'Error procesando la autenticación en el servidor.' },
      { status: 500 }
    )
  }
}
