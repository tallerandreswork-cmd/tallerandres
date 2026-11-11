import Link from 'next/link'
import { Bike, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
          padding: '36px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            background: '#ffedd5',
            color: '#ea580c',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Bike style={{ width: '28px', height: '28px' }} />
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#ea580c',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Error 404 · No encontrado
        </span>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '6px 0 8px',
          }}
        >
          Página no encontrada
        </h1>

        <p
          style={{
            fontSize: '13px',
            color: '#64748b',
            lineHeight: 1.5,
            margin: '0 0 24px',
          }}
        >
          La sección o expediente que estás buscando no existe o fue reubicada en el sistema del taller.
        </p>

        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0f172a',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          <ArrowLeft style={{ width: '15px', height: '15px' }} />
          Volver al Portal del Taller
        </Link>
      </div>
    </div>
  )
}

