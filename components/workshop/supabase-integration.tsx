'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Check,
  Cloud,
  Copy,
  Database,
  ExternalLink,
  Layers,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Zap,
} from 'lucide-react'
import {
  FinanceTransaction,
  InventoryItem,
  Order,
  WorkshopSettings,
} from '@/lib/workshop-data'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { seedInitialDataToSupabase } from '@/lib/supabase/service'

interface SupabaseIntegrationPanelProps {
  orders: Order[]
  inventory: InventoryItem[]
  transactions: FinanceTransaction[]
  settings: WorkshopSettings
  isOnline: boolean
  onShowToast: (msg: string) => void
  onRefreshData?: () => void
}

export function SupabaseIntegrationPanel({
  orders,
  inventory,
  transactions,
  settings,
  isOnline,
  onShowToast,
  onRefreshData,
}: SupabaseIntegrationPanelProps) {
  const [isSeeding, setIsSeeding] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  const handleSeedDatabase = async () => {
    if (!isOnline) {
      onShowToast('Configura NEXT_PUBLIC_SUPABASE_URL y ANON_KEY en tu .env.local primero.')
      return
    }

    setIsSeeding(true)
    try {
      const res = await seedInitialDataToSupabase(orders, inventory, transactions, settings)
      if (res.success) {
        onShowToast(res.message)
        if (onRefreshData) onRefreshData()
      } else {
        onShowToast(`Error: ${res.message}`)
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      onShowToast(`Error inesperado: ${errorMsg}`)
    } finally {
      setIsSeeding(false)
    }
  }

  const handleCopySqlInstructions = () => {
    const instructions = `-- Archivo de migración ubicado en: supabase/migrations/20261110_init_workshop.sql
-- Ejecuta este script en el SQL Editor de tu proyecto en https://supabase.com/dashboard
-- Crea las tablas: orders, inventory, finance_transactions, activities, workshop_settings
-- Y habilita Realtime y el Storage bucket workshop-photos.`

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(instructions)
      setCopiedSql(true)
      setTimeout(() => setCopiedSql(false), 2800)
      onShowToast('Ruta del script SQL de migración copiada al portapapeles')
    }
  }

  return (
    <section className="panel" style={{ marginTop: '16px', border: '1.5px solid #cbd5e1' }}>
      <div className="panel-heading">
        <div>
          <span className="finance-kicker">
            ☁️ INFRAESTRUCTURA DE PRODUCCIÓN · SUPABASE POSTGRESQL & REALTIME
          </span>
          <h2>Conexión con Supabase y Sincronización Multi-Dispositivo</h2>
          <p>
            Permite que el Administrador, los Mecánicos (desde su celular) y los Clientes consulten
            y actualicen la información en tiempo real desde la nube.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className={`status-pill ${isOnline ? 'green' : 'orange'}`}
            style={{ fontWeight: 700 }}
          >
            {isOnline ? '● Supabase Conectado (En vivo)' : '○ Modo Local (Fallback localStorage)'}
          </span>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <Database style={{ width: '16px', color: '#ea580c' }} />
              <strong>Base de Datos PostgreSQL</strong>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>
              Tablas: <code>orders</code>, <code>inventory</code>, <code>finance_transactions</code>,{' '}
              <code>activities</code>
            </p>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <Radio style={{ width: '16px', color: '#16a34a' }} />
              <strong>Supabase Realtime</strong>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>
              Actualización instantánea en vivo sin recargar la pantalla cuando un mecánico avanza
              estado.
            </p>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <UploadCloud style={{ width: '16px', color: '#2563eb' }} />
              <strong>Storage Bucket de Fotos</strong>
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>
              Bucket <code>workshop-photos</code> para fotos de diagnóstico e inspección de rampa.
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '14px',
            borderRadius: '10px',
            background: isOnline ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${isOnline ? '#bbf7d0' : '#fde68a'}`,
            marginBottom: '16px',
            fontSize: '11.5px',
            color: '#334155',
            lineHeight: 1.5,
          }}
        >
          {isOnline ? (
            <div>
              <strong style={{ color: '#15803d', display: 'block', marginBottom: '4px' }}>
                ✓ Tu aplicación está vinculada a Supabase
              </strong>
              Las lecturas y escrituras se sincronizan automáticamente con tu base de datos en la
              nube. Si tu base de datos es nueva o está vacía, puedes presionar el botón de abajo
              para cargar las órdenes y el catálogo de repuestos de prueba.
            </div>
          ) : (
            <div>
              <strong style={{ color: '#b45309', display: 'block', marginBottom: '4px' }}>
                ⚠️ Supabase aún no está configurado (Trabajando en Modo Local)
              </strong>
              Para conectar con tu proyecto en la nube:
              <ol style={{ paddingLeft: '18px', margin: '6px 0' }}>
                <li>
                  Crea tu proyecto gratuito en{' '}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#ea580c', fontWeight: 600 }}
                  >
                    supabase.com
                  </a>
                  .
                </li>
                <li>
                  Ejecuta el script SQL incluido en{' '}
                  <code>supabase/migrations/20261110_init_workshop.sql</code> en el SQL Editor de
                  Supabase.
                </li>
                <li>
                  Agrega en tu archivo <code>.env.local</code> (o en las variables de entorno de tu
                  hosting Vercel):
                  <div
                    style={{
                      background: '#1e293b',
                      color: '#f8fafc',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '10.5px',
                      marginTop: '4px',
                    }}
                  >
                    NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
                    <br />
                    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
                  </div>
                </li>
              </ol>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button primary"
            onClick={handleSeedDatabase}
            disabled={isSeeding || !isOnline}
            style={{
              background: isOnline ? '#16a34a' : '#94a3b8',
              cursor: isOnline ? 'pointer' : 'not-allowed',
            }}
          >
            {isSeeding ? (
              <>
                <RefreshCw className="rotating" style={{ width: '13px' }} /> Sembrando base de
                datos...
              </>
            ) : (
              <>
                <Sparkles style={{ width: '13px' }} /> Sembrar / Inicializar Datos en Supabase (1
                clic)
              </>
            )}
          </button>

          <button
            type="button"
            className="button secondary"
            onClick={handleCopySqlInstructions}
          >
            {copiedSql ? (
              <>
                <Check style={{ width: '13px' }} /> ¡Ruta copiada!
              </>
            ) : (
              <>
                <Copy style={{ width: '13px' }} /> Copiar referencia del Script SQL
              </>
            )}
          </button>

          {isOnline && onRefreshData && (
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                onRefreshData()
                onShowToast('Sincronizando datos con Supabase...')
              }}
            >
              <RefreshCw style={{ width: '13px' }} /> Forzar Sincronización
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

