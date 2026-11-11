'use client'

import { useState } from 'react'
import {
  Bike,
  ChevronRight,
  Lock,
  Search,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { isClientPinValid, type AuthSession, type Order, type WorkshopSettings } from '@/lib/workshop-data'

export function LoginGateway({
  orders,
  settings,
  onLoginSuccess,
}: {
  orders: Order[]
  settings: WorkshopSettings
  onLoginSuccess: (session: AuthSession) => void
}) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Protección anti fuerza bruta: si está bloqueado, rechazar intento
    if (lockedUntil && Date.now() < lockedUntil) {
      const remainingSecs = Math.ceil((lockedUntil - Date.now()) / 1000)
      setErrorMessage(
        `Demasiados intentos fallidos. Bloqueado temporalmente por seguridad. Espera ${remainingSecs} segundos.`
      )
      return
    }

    // Sanitización y defensa contra inyección de cadenas masivas
    const rawId = identifier.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 80).trim()
    const cleanId = rawId.toLowerCase()
    const rawPass = password.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 64).trim()

    if (!rawId || !rawPass) {
      setErrorMessage('Ingresa tu usuario o placa y tu contraseña o PIN.')
      return
    }

    setLoading(true)

    const handleFailedAuth = (customMsg?: string) => {
      setLoading(false)
      const nextFail = failedAttempts + 1
      setFailedAttempts(nextFail)
      if (nextFail >= 5) {
        const lockoutTime = Date.now() + 30000 // 30 segundos de penalización
        setLockedUntil(lockoutTime)
        setErrorMessage(
          'Demasiados intentos fallidos. Por seguridad, el acceso se ha bloqueado temporalmente durante 30 segundos.'
        )
      } else {
        setErrorMessage(customMsg || 'Usuario o contraseña incorrectos.')
      }
    }

    try {
      // AUTENTICACIÓN SEGURA DEL LADO DEL SERVIDOR
      // Las contraseñas residen exclusivamente en variables privadas de servidor (Node.js).
      // NINGUNA contraseña queda expuesta en el JavaScript descargado por el navegador.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          password: rawPass,
          orders,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success && data.session) {
        setLoading(false)
        setFailedAttempts(0)
        setLockedUntil(null)
        onLoginSuccess(data.session)
        return
      }

      handleFailedAuth(data.error)
    } catch {
      handleFailedAuth('Error de conexión con el servicio de autenticación.')
    }
  }

  return (
    <div className="login-shell">
      <div className="login-container">
        {/* PANEL IZQUIERDO: EXCLUSIVO DE CLIENTES Y SEGUIMIENTO EN VIVO */}
        <div className="login-Left">
          <div>
            <div className="brand" style={{ padding: '0 0 28px' }}>
              <div className="brand-mark">
                <Wrench />
              </div>
              <div>
                <div className="brand-name">MOTOLAB</div>
                <div className="brand-sub">WORKSHOP OS</div>
              </div>
            </div>

            <span className="eyebrow" style={{ color: 'var(--orange)' }}>
              PORTAL DE CLIENTES Y SEGUIMIENTO
            </span>
            <h1 style={{ fontSize: '26px', margin: '12px 0 14px', lineHeight: 1.25, fontWeight: 800 }}>
              Consulta y Estado de Reparación
            </h1>
            <p style={{ fontSize: '13px', color: '#9ca7b3', lineHeight: 1.6, margin: 0 }}>
              Sigue en tiempo real el diagnóstico mecánico, fotos del avance, repuestos instalados
              y la fecha estimada de retiro de tu motocicleta.
            </p>

            <div
              style={{
                marginTop: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Bike style={{ width: '16px', color: 'var(--green)', flexShrink: 0 }} />
                <span style={{ color: '#d1d5db' }}>
                  Avance en rampa de tu moto en vivo
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <ShieldCheck style={{ width: '16px', color: 'var(--orange)', flexShrink: 0 }} />
                <span style={{ color: '#d1d5db' }}>
                  Presupuesto aprobado y piezas garantizadas
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Lock style={{ width: '16px', color: '#60a5fa', flexShrink: 0 }} />
                <span style={{ color: '#d1d5db' }}>
                  Acceso directo sin necesidad de Gmail
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid #35404b',
              paddingTop: '18px',
              marginTop: '40px',
              fontSize: '11px',
              color: '#84909e',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{settings.workshopName}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Lock style={{ width: '12px', height: '12px' }} /> Conexión Cifrada SSL
            </span>
          </div>
        </div>

        {/* PANEL DERECHO: FORMULARIO NORMAL Y DIRECTO */}
        <div className="login-Right" style={{ justifyContent: 'center' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                Iniciar Sesión
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Ingresa con la cuenta proporcionada por el taller (Placa o Usuario y PIN).
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label className="login-field">
                <span>Placa de motocicleta o Usuario</span>
                <input
                  type="text"
                  autoFocus
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  placeholder="ej. KLM-42D o tu usuario"
                  style={{ width: '100%', height: '42px', fontSize: '13px' }}
                />
              </label>

              <label className="login-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Contraseña o PIN</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '11px',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  placeholder="PIN entregado por el taller"
                  style={{ width: '100%', height: '42px', fontSize: '13px' }}
                />
              </label>
            </div>

            {errorMessage && (
              <div
                role="alert"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  borderRadius: '8px',
                  padding: '11px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Lock style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="button primary"
              style={{
                height: '46px',
                fontSize: '14px',
                fontWeight: 700,
                width: '100%',
                justifyContent: 'center',
                marginTop: '4px',
              }}
            >
              {loading ? 'Verificando cuenta...' : 'Entrar a Mi Panel'}
              {!loading && <ChevronRight style={{ width: '16px', height: '16px' }} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
