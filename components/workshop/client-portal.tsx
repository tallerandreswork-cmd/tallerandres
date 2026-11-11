'use client'

import { useMemo, useState } from 'react'
import {
  Bike,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  FileText,
  MessageCircle,
  PackageCheck,
  Printer,
  QrCode,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'
import {
  STATUS_META,
  type AuthSession,
  type Order,
  type OrderStatus,
  type WhatsAppTemplateType,
  type WorkshopSettings,
  buildClientTechnicalCertificate,
  buildWhatsAppUrl,
  calculateBikeHealthScore,
  calculateOrderTotal,
  findOrderByQuery,
  formatCLP,
  getDefaultIntakeChecklist,
  openPrintableOfficialReceipt,
} from '@/lib/workshop-data'

function StatusPill({ status }: { status: OrderStatus }) {
  const tone =
    status === 'Listo para entrega' || status === 'Entregado'
      ? 'status-green'
      : status === 'En reparación'
        ? 'status-orange'
        : status === 'En diagnóstico'
          ? 'status-blue'
          : 'status-muted'
  return (
    <span className={`status-badge ${tone}`}>
      <span className="status-dot" />
      {status}
    </span>
  )
}

export function ClientPortal({
  orders,
  settings,
  authSession,
  clientTab,
  setClientTab,
  clientQuery,
  setClientQuery,
  searchedQuery,
  setSearchedQuery,
  searched,
  setSearched,
  onApproveQuote,
  onSignIntakeConformity,
  onNotifyQrPayment,
  onSendClientComment,
  onOpenWhatsAppForOrder,
  onToast,
}: {
  orders: Order[]
  settings: WorkshopSettings
  authSession?: AuthSession | null
  clientTab: 'Consultar orden' | 'Historial'
  setClientTab: (tab: 'Consultar orden' | 'Historial') => void
  clientQuery: string
  setClientQuery: (value: string) => void
  searchedQuery: string
  setSearchedQuery: (value: string) => void
  searched: boolean
  setSearched: (value: boolean) => void
  onApproveQuote: (orderId: string) => void
  onSignIntakeConformity?: (orderId: string) => void
  onNotifyQrPayment?: (orderId: string) => void
  onSendClientComment: (orderId: string, comment: string) => void
  onOpenWhatsAppForOrder: (order: Order, template: WhatsAppTemplateType) => void
  onToast: (msg: string) => void
}) {
  const [subView, setSubView] = useState<'estado' | 'piezas' | 'historial'>('estado')
  const [commentText, setCommentText] = useState('')

  // Sync sidebar tab with internal subView
  const effectiveView = clientTab === 'Historial' ? 'historial' : subView

  const activeOrder = useMemo(
    () => findOrderByQuery(orders, searchedQuery) || orders[0] || null,
    [orders, searchedQuery]
  )

  const handleSearch = () => {
    const clean = clientQuery.trim().toLowerCase()
    if (!clean) return

    // Buscar únicamente dentro de las órdenes permitidas para este cliente
    const matched = orders.find(
      (o) =>
        o.plate.toLowerCase() === clean ||
        o.id.toLowerCase() === clean ||
        o.bike.toLowerCase().includes(clean)
    )

    if (!matched) {
      onToast(
        `Por privacidad y seguridad, solo tienes acceso al expediente de tu propia motocicleta (${orders[0]?.plate || ''}).`
      )
      return
    }

    setSearchedQuery(matched.plate)
    setSearched(true)
    setClientTab('Consultar orden')
  }

  const selectQuickOrder = (plate: string) => {
    const matched = orders.find((o) => o.plate.toLowerCase() === plate.toLowerCase())
    if (!matched) return
    setClientQuery(matched.plate)
    setSearchedQuery(matched.plate)
    setSearched(true)
  }

  const statusStepIndex = useMemo(() => {
    if (!activeOrder) return 2
    if (activeOrder.status === 'Agendado') return 0
    if (activeOrder.status === 'En diagnóstico') return 1
    if (activeOrder.status === 'En reparación') return 2
    return 3
  }, [activeOrder])

  const progressPct =
    statusStepIndex === 0
      ? 25
      : statusStepIndex === 1
        ? 55
        : statusStepIndex === 2
          ? 80
          : 100

  const progressWidth =
    statusStepIndex === 0
      ? '15%'
      : statusStepIndex === 1
        ? '42%'
        : statusStepIndex === 2
          ? '68%'
          : '100%'

  const healthScore = useMemo(
    () => (activeOrder ? calculateBikeHealthScore(activeOrder) : 92),
    [activeOrder]
  )

  const totalHistoricalPartsCount = useMemo(() => {
    if (!activeOrder) return 0
    const pastParts = activeOrder.history.reduce(
      (acc, h) => acc + (h.partsChanged?.length ?? 0),
      0
    )
    return activeOrder.replacedParts.length + pastParts
  }, [activeOrder])

  const timelineSteps = useMemo(() => {
    if (!activeOrder) return []
    return [
      [
        'Agendado / Recepción',
        activeOrder.timeline.Agendado,
        'Motocicleta recepcionada con inventario y diagnóstico de ingreso',
      ],
      [
        'En diagnóstico técnico',
        activeOrder.timeline['En diagnóstico'],
        statusStepIndex >= 1
          ? 'Inspección multipunto de 6 sistemas completada'
          : 'En fila para pruebas de banco',
      ],
      [
        'En reparación e instalación',
        activeOrder.timeline['En reparación'],
        statusStepIndex >= 2
          ? `${activeOrder.replacedParts.length} componentes intervenidos por ${activeOrder.mechanic}`
          : 'Pendiente de montaje de piezas',
      ],
      [
        'Control de calidad / Lista',
        activeOrder.timeline['Listo para entrega'],
        statusStepIndex >= 3
          ? 'Prueba de ruta superada · Lista para retiro'
          : 'Te notificaremos por WhatsApp al finalizar',
      ],
    ] as const
  }, [activeOrder, statusStepIndex])

  const handleDownloadCertificate = (order: Order) => {
    const content = buildClientTechnicalCertificate(order, settings.workshopName)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `respaldo_tecnico_${order.plate}_${order.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
    onToast(`Certificado técnico de ${order.plate} (${order.id}) descargado`)
  }

  return (
    <div className="client-page">
      {/* HERO DE TELEMETRÍA Y SEGUIMIENTO */}
      <div className="client-hero">
        <div>
          <p className="eyebrow">EXPEDIENTE TÉCNICO DIGITAL · TIEMPO REAL</p>
          <h1>
            {activeOrder
              ? `${activeOrder.bike} · Placa ${activeOrder.plate}`
              : 'Expediente de tu Motocicleta'}
          </h1>
          <p>
            {activeOrder
              ? `Propietario: ${activeOrder.client} · Mecánico titular: ${activeOrder.mechanic} · Historial clínico exclusivo de tu motocicleta.`
              : 'Consulta el estado en vivo, diagnóstico de ingreso, piezas reemplazadas por el mecánico y tu historial clínico.'}
          </p>
        </div>
        <div className="client-hero-art" aria-hidden="true">
          <Bike />
        </div>
      </div>

      {/* BUSCADOR DE PLACA U ORDEN */}
      <div className="client-search panel">
        <div className="client-search-copy">
          <Search />
          <div>
            <strong>Expediente de tu Motocicleta</strong>
            <span>Datos protegidos · Solo visible para ti y el taller</span>
          </div>
        </div>
        <div className="client-search-input">
          <input
            value={clientQuery}
            onChange={(e) => setClientQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch()
            }}
            aria-label="Placa o código de orden"
            placeholder={orders[0] ? `Ej: ${orders[0].plate} o ${orders[0].id}` : 'Tu placa'}
          />
          <button className="button primary" onClick={handleSearch}>
            Consultar <ChevronRight />
          </button>
        </div>

        {orders.length > 1 ? (
          <div className="Quick-chips">
            <span>Tus motocicletas registradas en taller:</span>
            {orders.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`filter-chip ${activeOrder?.id === o.id ? 'active' : ''}`}
                onClick={() => selectQuickOrder(o.plate)}
              >
                {o.plate} ({o.bike} · {o.id})
              </button>
            ))}
          </div>
        ) : orders.length === 1 ? (
          <div className="Quick-chips" style={{ alignItems: 'center' }}>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>
              ✓ Motocicleta vinculada a tu cuenta:
            </span>
            <span className="plate-chip active" style={{ fontSize: '11px', padding: '3px 9px' }}>
              {orders[0].plate} · {orders[0].bike} ({orders[0].id})
            </span>
          </div>
        ) : null}
      </div>

      {!searched || !activeOrder ? (
        <section className="panel empty-state" style={{ marginTop: '14px' }}>
          <strong>No encontramos ninguna orden para “{searchedQuery}”</strong>
          <p style={{ marginTop: '6px' }}>
            Verifica el número de placa o código asignado a tu motocicleta (por ejemplo: {orders[0]?.plate || 'KLM-42D'}). Recuerda que por privacidad y seguridad solo tienes acceso a tus propios datos.
          </p>
        </section>
      ) : (
        <>
          {/* BANNER PRINCIPAL DE ALERTA RÁPIDA DE LA MOTO */}
          <section
            className="panel"
            style={{
              marginTop: '14px',
              padding: '16px 20px',
              borderLeft:
                activeOrder.status === 'Listo para entrega'
                  ? '4px solid #16a34a'
                  : !activeOrder.quoteApproved
                    ? '4px solid #ea580c'
                    : activeOrder.status === 'En reparación'
                      ? '4px solid #2563eb'
                      : '4px solid #64748b',
              background:
                activeOrder.status === 'Listo para entrega'
                  ? '#f0fdf4'
                  : !activeOrder.quoteApproved
                    ? '#fff7ed'
                    : activeOrder.status === 'En reparación'
                      ? '#eff6ff'
                      : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '26px' }} role="img" aria-label="Alerta">
                {activeOrder.status === 'Listo para entrega'
                  ? '🎉'
                  : !activeOrder.quoteApproved
                    ? '⚠️'
                    : activeOrder.status === 'En reparación'
                      ? '🔧'
                      : '📋'}
              </span>
              <div>
                <strong style={{ fontSize: '13px', display: 'block', color: '#0f172a', fontWeight: 700 }}>
                  {activeOrder.status === 'Listo para entrega'
                    ? '¡Tu motocicleta está LISTA PARA RETIRO!'
                    : !activeOrder.quoteApproved
                      ? 'Presupuesto pendiente de tu aprobación'
                      : activeOrder.status === 'En reparación'
                        ? `En reparación activa con ${activeOrder.mechanic}`
                        : 'Motocicleta en diagnóstico multipunto'}
                </strong>
                <span style={{ fontSize: '11px', color: '#475569', marginTop: '2px', display: 'block' }}>
                  {activeOrder.status === 'Listo para entrega'
                    ? `Pruebas de ruta superadas. Puedes retirar tu moto en horario de atención o pagar por QR Simple Bolivia (${formatCLP(calculateOrderTotal(activeOrder))}).`
                    : !activeOrder.quoteApproved
                      ? `Revisa las piezas y costos formulados por ${activeOrder.mechanic} (Total: ${formatCLP(calculateOrderTotal(activeOrder))}). Al aprobar, el mecánico inicia el montaje inmediato.`
                      : activeOrder.status === 'En reparación'
                        ? `Se están instalando ${activeOrder.replacedParts.length} piezas con garantía de taller. Entrega estimada: ${activeOrder.eta}.`
                        : `Revisando diagnóstico de ingreso: "${activeOrder.diagnosis}".`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {!activeOrder.quoteApproved && (
                <button
                  type="button"
                  className="button primary"
                  style={{ fontSize: '12px', padding: '7px 14px' }}
                  onClick={() => onApproveQuote(activeOrder.id)}
                >
                  <Check /> Aprobar Cotización ({formatCLP(calculateOrderTotal(activeOrder))})
                </button>
              )}

              {activeOrder.status === 'Listo para entrega' && (
                <button
                  type="button"
                  className="button secondary"
                  style={{ fontSize: '12px', padding: '7px 14px' }}
                  onClick={() => openPrintableOfficialReceipt(activeOrder, settings)}
                >
                  <Printer /> Ver Recibo Oficial (NIT/CI)
                </button>
              )}
            </div>
          </section>

          {/* KPIs DE TELEMETRÍA DE LA MOTO DEL CLIENTE */}
          <div className="client-telemetry-bar">
            <div className="telemetry-card">
              <span className="telemetry-label">Estado de la Orden ({activeOrder.id})</span>
              <div className="telemetry-value-row">
                <strong>{progressPct}% completado</strong>
                <StatusPill status={activeOrder.status} />
              </div>
              <small>Entrega estimada: {activeOrder.eta}</small>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">Salud Mecánica Multipunto</span>
              <div className="telemetry-value-row">
                <strong style={{ color: healthScore >= 90 ? '#178b44' : '#d96229' }}>
                  {healthScore}% Óptimo
                </strong>
                <span className="intake-badge">6 sistemas evaluados</span>
              </div>
              <small>Próximo servicio: {activeOrder.nextServiceKm || 'En 5.000 km'}</small>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">Piezas Cambiadas en Taller</span>
              <div className="telemetry-value-row">
                <strong>{activeOrder.replacedParts.length} en esta OT</strong>
                <span className="intake-badge">
                  {totalHistoricalPartsCount} piezas en historial
                </span>
              </div>
              <small>Con código OEM y garantía de taller</small>
            </div>

            <div className="telemetry-card">
              <span className="telemetry-label">Mecánico Responsable</span>
              <div className="telemetry-value-row">
                <strong>{activeOrder.mechanic}</strong>
                <span className="intake-badge" style={{ background: '#e9f8f0', color: '#178b44' }}>
                  ✓ Certificado
                </span>
              </div>
              <small>
                Recepción: {activeOrder.mileage || '15.000 km'} · Tanque {activeOrder.fuelLevel || '1/2'}
              </small>
            </div>
          </div>

          {/* SUB-NAVEGACIÓN INTELIGENTE DEL PORTAL CLIENTE */}
          <div className="client-portal-tabs">
            <button
              type="button"
              className={`client-portal-tab ${effectiveView === 'estado' ? 'active' : ''}`}
              onClick={() => {
                setClientTab('Consultar orden')
                setSubView('estado')
              }}
            >
              <Wrench />
              <span>1. Estado en Vivo y Diagnóstico</span>
            </button>
            <button
              type="button"
              className={`client-portal-tab ${effectiveView === 'piezas' ? 'active' : ''}`}
              onClick={() => {
                setClientTab('Consultar orden')
                setSubView('piezas')
              }}
            >
              <PackageCheck />
              <span>
                2. Piezas Cambiadas por el Mecánico ({activeOrder.replacedParts.length})
              </span>
            </button>
            <button
              type="button"
              className={`client-portal-tab ${effectiveView === 'historial' ? 'active' : ''}`}
              onClick={() => {
                setClientTab('Historial')
                setSubView('historial')
              }}
            >
              <FileText />
              <span>
                3. Historial Clínico y Respaldo ({1 + activeOrder.history.length} visitas)
              </span>
            </button>
          </div>

          {/* ===================== VISTA 1: ESTADO EN VIVO Y DIAGNÓSTICO ===================== */}
          {effectiveView === 'estado' && (
            <div className="client-result-grid">
              <section className="panel tracking-card">
                <div className="result-heading">
                  <div>
                    <span className="order-id">
                      ORDEN {activeOrder.id} · INGRESADA EL {activeOrder.createdAt.toUpperCase()}
                    </span>
                    <h2>
                      {activeOrder.bike} <span className="plate-chip">{activeOrder.plate}</span>
                    </h2>
                    <p>
                      Cliente: {activeOrder.client} · CI/NIT:{' '}
                      <strong>{activeOrder.clientNitOrCi || 'S/N'}</strong> · WhatsApp: {activeOrder.phone} ·
                      Mecánico asignado: <strong>{activeOrder.mechanic}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ height: '30px', fontSize: '10px' }}
                      onClick={() => openPrintableOfficialReceipt(activeOrder, settings)}
                    >
                      <Printer /> Imprimir Recibo Oficial (NIT/CI)
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ height: '30px', fontSize: '10px' }}
                      onClick={() => handleDownloadCertificate(activeOrder)}
                    >
                      <Download /> Descargar Respaldo
                    </button>
                    <StatusPill status={activeOrder.status} />
                  </div>
                </div>

                {/* ACTA DE RECEPCIÓN FÍSICA / INVENTARIO DE INGRESO (CHECKLIST ANTI-RECLAMOS) */}
                {(() => {
                  const chk = activeOrder.intakeChecklist ?? getDefaultIntakeChecklist()
                  return (
                    <div
                      style={{
                        margin: '12px 22px 4px',
                        padding: '12px 15px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '11px', color: '#0f172a', display: 'block' }}>
                            🛡️ Acta de Recepción Física / Inventario de Ingreso (Respaldo Anti-Reclamos)
                          </strong>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>
                            Registro físico de pertenencias en custodia y estado estético al ingresar al taller
                          </span>
                        </div>
                        {chk.clientConformitySigned ? (
                          <span
                            className="intake-badge"
                            style={{ background: '#e9f8f0', color: '#178b44', fontWeight: 700 }}
                          >
                            ✓ Conformidad firmada ({chk.clientConformitySignedAt || 'Confirmado'})
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="button primary"
                            style={{ height: '28px', fontSize: '10px' }}
                            onClick={() => onSignIntakeConformity?.(activeOrder.id)}
                          >
                            <Check /> Firmar conformidad de recepción
                          </button>
                        )}
                      </div>
                      <div className="intake-badges" style={{ marginBottom: '6px' }}>
                        <span className="intake-badge">
                          🪖 Casco en custodia: <strong>{chk.leftHelmet ? 'SÍ' : 'NO'}</strong>
                        </span>
                        <span className="intake-badge">
                          🪪 Documentos RUAT/SOAT: <strong>{chk.leftDocuments ? 'SÍ' : 'NO'}</strong>
                        </span>
                        <span className="intake-badge">
                          🔑 Llave / Control: <strong>{chk.leftKeys ? 'SÍ' : 'NO'}</strong>
                        </span>
                        <span className="intake-badge">
                          🧰 Herramientas / Alforjas: <strong>{chk.leftToolsOrBag ? 'SÍ' : 'NO'}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#334155' }}>
                        <strong>Observaciones estéticas de recepción:</strong> “{chk.aestheticNotes}”
                      </div>
                    </div>
                  )
                })()}

                {/* BANNER ANIMADO DE ESTADO EN VIVO PARA EL CLIENTE */}
                <div
                  className={STATUS_META[activeOrder.status].cssState}
                  style={{ margin: '10px 22px 0' }}
                >
                  <div className="live-state-banner" style={{ padding: '8px 12px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="pulse-dot" />
                      <span>
                        <strong>Estado actual ({activeOrder.status}):</strong>{' '}
                        {STATUS_META[activeOrder.status].liveLabel}
                      </span>
                    </div>
                    <strong>{STATUS_META[activeOrder.status].progressPct}% completado</strong>
                  </div>
                  <div className="order-progress-track" style={{ height: '7px', margin: '4px 0 0' }}>
                    <div
                      className="order-progress-fill"
                      style={{ width: `${STATUS_META[activeOrder.status].progressPct}%` }}
                    />
                  </div>
                </div>

                {/* LÍNEA DE TIEMPO EN VIVO */}
                <div className="timeline">
                  <div className="timeline-line">
                    <span style={{ width: progressWidth }} />
                  </div>
                  {timelineSteps.map(([title, time, desc], i) => {
                    const isDone = i <= statusStepIndex
                    const isCurrent = i === statusStepIndex
                    return (
                      <div
                        className={`timeline-step ${isDone ? 'done' : ''} ${
                          isCurrent ? 'current' : ''
                        }`}
                        key={title}
                      >
                        <div className="timeline-dot">
                          {i < statusStepIndex ? (
                            <Check />
                          ) : isCurrent ? (
                            <Wrench />
                          ) : (
                            <Clock3 />
                          )}
                        </div>
                        <div>
                          <strong>{title}</strong>
                          <span>{time}</span>
                          <p>{desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* COMPARATIVA DIAGNÓSTICO DE INGRESO VS TRABAJO EN CURSO */}
                <div className="client-diagnosis-comparison">
                  <div className="diagnosis-box" style={{ padding: '14px 16px' }}>
                    <strong>
                      📋 1. Diagnóstico con el que entró al taller ({activeOrder.createdAt})
                    </strong>
                    <p style={{ margin: '6px 0 8px', fontSize: '11px', color: '#334155', lineHeight: 1.5 }}>
                      “{activeOrder.diagnosis}”
                    </p>
                    <div className="intake-badges">
                      <span className="intake-badge">
                        Odómetro recepción: {activeOrder.mileage || '15.000 km'}
                      </span>
                      <span className="intake-badge">
                        Combustible: {activeOrder.fuelLevel || '1/2 tanque'}
                      </span>
                    </div>
                  </div>

                  <div className="work-progress-box" style={{ padding: '14px 16px' }}>
                    <strong>
                      🔧 2. Lo que tu mecánico ({activeOrder.mechanic}) está haciendo ahora
                    </strong>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                      Servicio: {activeOrder.service}
                    </div>
                    <p style={{ margin: '5px 0 8px', fontSize: '11px', color: '#334155', lineHeight: 1.5 }}>
                      “{activeOrder.mechanicNote}”
                    </p>
                    <div className="intake-badges">
                      <span className="intake-badge">
                        Actualizado: {activeOrder.mechanicNoteUpdatedAt}
                      </span>
                      <span className="intake-badge">
                        Evidencia: {activeOrder.photosCount} fotos técnicas
                      </span>
                      <span className="intake-badge">ETA: {activeOrder.eta}</span>
                    </div>
                  </div>
                </div>

                {/* SEMÁFORO MULTIPUNTO DE 6 SISTEMAS DE LA MOTO */}
                <div className="health-grid-section">
                  <div className="health-grid-header">
                    <div>
                      <strong>
                        🩺 Inspección Digital Multipunto — Estado Técnico de tu {activeOrder.bike}
                      </strong>
                      <span>
                        Evaluación realizada en banco por {activeOrder.mechanic} · Salud general:{' '}
                        {healthScore}%
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setSubView('piezas')}
                    >
                      Ver piezas cambiadas ({activeOrder.replacedParts.length}) →
                    </button>
                  </div>

                  <div className="health-systems-grid">
                    {activeOrder.healthCheck.map((sys) => {
                      const badgeTone =
                        sys.status === 'Óptimo'
                          ? 'health-optimo'
                          : sys.status === 'En intervención'
                            ? 'health-intervencion'
                            : 'health-atencion'
                      return (
                        <div className="health-system-card" key={sys.system}>
                          <div className="health-system-top">
                            <strong>{sys.system}</strong>
                            <span className={`health-pill ${badgeTone}`}>
                              {sys.status} · {sys.score}%
                            </span>
                          </div>
                          <div className="health-bar-track">
                            <div
                              className={`health-bar-fill ${badgeTone}`}
                              style={{ width: `${sys.score}%` }}
                            />
                          </div>
                          <p>{sys.observation}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* RESUMEN RÁPIDO DE PIEZAS CAMBIADAS EN ESTA ORDEN */}
                <div style={{ margin: '0 22px 18px' }}>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '12px', display: 'block' }}>
                          🔩 Piezas y componentes reemplazados por {activeOrder.mechanic} en esta orden ({activeOrder.replacedParts.length})
                        </strong>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          Trazabilidad completa con código OEM, estado de la pieza retirada y garantía
                        </span>
                      </div>
                      <button
                        type="button"
                        className="button secondary"
                        style={{ height: '28px', fontSize: '10px' }}
                        onClick={() => setSubView('piezas')}
                      >
                        Ver detalle de piezas y garantías
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activeOrder.replacedParts.map((part) => (
                        <div
                          key={part.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'white',
                            padding: '9px 12px',
                            borderRadius: '7px',
                            border: '1px solid #edf2f7',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '11px', color: '#1e293b' }}>
                              {part.partName}
                            </strong>{' '}
                            <span className="plate-chip">{part.partCode}</span>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                              <strong>Motivo cambio:</strong> {part.oldPartCondition}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {part.oldPartReturnedToClient && (
                              <span
                                className="intake-badge"
                                style={{ background: '#e9f8f0', color: '#178b44' }}
                              >
                                ✓ Pieza vieja guardada para entrega
                              </span>
                            )}
                            <span className="intake-badge">
                              Garantía: {part.warrantyMonths} meses
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* MENSAJE DIRECTO AL MECÁNICO */}
                <div
                  style={{
                    margin: '0 22px 22px',
                    paddingTop: '14px',
                    borderTop: '1px solid #edf0f3',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <input
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      height: '36px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '0 10px',
                      fontSize: '11px',
                    }}
                    placeholder={`Escribe una nota o indicación para tu mecánico ${activeOrder.mechanic} (ej. "Por favor guardar los repuestos usados")...`}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button
                    className="button secondary"
                    onClick={() => {
                      if (!commentText.trim()) return
                      onSendClientComment(activeOrder.id, commentText.trim())
                      setCommentText('')
                    }}
                  >
                    Enviar indicación al mecánico
                  </button>
                </div>
              </section>

              <aside className="client-side">
                <section className="panel quote-card">
                  <div className="panel-heading compact">
                    <div>
                      <h2>Cotización y Respaldo</h2>
                      <p>
                        {activeOrder.quoteApproved
                          ? `Aprobada ${activeOrder.quoteApprovedAt ? `(${activeOrder.quoteApprovedAt})` : 'por cliente'}`
                          : 'Pendiente de tu aprobación'}
                      </p>
                    </div>
                    <ShieldCheck />
                  </div>
                  <div className="quote-total">
                    <span>Total orden {activeOrder.id}</span>
                    <strong>{formatCLP(calculateOrderTotal(activeOrder))}</strong>
                  </div>
                  <div className="quote-lines">
                    {activeOrder.quoteItems.map((item) => (
                      <div key={item.id}>
                        <span>{item.description}</span>
                        <strong>{formatCLP(item.amount)}</strong>
                      </div>
                    ))}
                  </div>
                  <button
                    className={`button ${
                      activeOrder.quoteApproved ? 'success' : 'primary'
                    } full-width`}
                    onClick={() => {
                      if (!activeOrder.quoteApproved) {
                        onApproveQuote(activeOrder.id)
                      }
                    }}
                    disabled={activeOrder.quoteApproved}
                  >
                    <Check />{' '}
                    {activeOrder.quoteApproved
                      ? 'Cotización aprobada y respaldada'
                      : 'Aprobar cotización ahora'}
                  </button>
                </section>

                {/* PAGO CON QR SIMPLE BOLIVIA (Bs) */}
                <section className="panel" style={{ padding: '16px 18px' }}>
                  <div className="panel-heading compact" style={{ padding: 0, marginBottom: '10px' }}>
                    <div>
                      <h2 style={{ fontSize: '13px', margin: 0 }}>Pago con QR Simple Bolivia (Bs)</h2>
                      <p style={{ fontSize: '10px', margin: '2px 0 0', color: '#64748b' }}>
                        {activeOrder.paid
                          ? `✓ Orden pagada (${activeOrder.paidMethod || 'QR Simple'})`
                          : 'Escanea desde tu app bancaria (BNB, Mercantil, BCP, Unión, Sol, Tigo Money)'}
                      </p>
                    </div>
                    <QrCode style={{ color: 'var(--orange)', width: '18px' }} />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '10px',
                      padding: '12px',
                      marginBottom: '10px',
                      textAlign: 'center',
                    }}
                  >
                    {/* QR Simple Bolivia SVG determinista */}
                    <svg
                      width="116"
                      height="116"
                      viewBox="0 0 29 29"
                      shapeRendering="crispEdges"
                      style={{
                        background: 'white',
                        padding: '6px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '8px',
                      }}
                      aria-label={`Código QR Simple por ${formatCLP(calculateOrderTotal(activeOrder))}`}
                    >
                      <path
                        fill="#0f172a"
                        d="M1 1h7v7H1V1zm1 1v5h5V2H2zm1 1h3v3H3V3zm18-2h7v7h-7V1zm1 1v5h5V2h-5zm1 1h3v3h-3V3zM1 21h7v7H1v-7zm1 1v5h5v-5H2zm1 1h3v3H3v-3zM10 1h2v2h-2V1zm4 0h1v3h-1V1zm3 1h2v2h-2V2zM10 5h3v1h-3V5zm5 0h2v3h-2V5zM1 10h3v2H1v-2zm5 0h2v3H6v-3zm4 0h4v2h-4v-2zm6 0h2v4h-2v-4zm4 1h3v2h-3v-2zm5-1h3v2h-3v-2zM2 14h2v3H2v-3zm4 1h3v2H6v-2zm5-1h3v3h-3v-3zm5 2h2v3h-2v-3zm4-1h4v2h-4v-2zm6 1h2v3h-2v-3zM10 20h2v3h-2v-3zm4 1h3v2h-3v-2zm5-1h2v4h-2v-4zm4 2h4v2h-4v-2zM10 25h3v3h-3v-3zm5 1h2v2h-2v-2zm4-1h3v3h-3v-3zm5 1h4v2h-4v-2z"
                      />
                    </svg>
                    <strong style={{ fontSize: '12px', color: '#0f172a' }}>
                      Importe QR: {formatCLP(calculateOrderTotal(activeOrder))}
                    </strong>
                    <span style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                      {settings.bankName} · {settings.bankAccount}
                    </span>
                    <span style={{ fontSize: '9px', color: '#64748b' }}>
                      NIT Taller: {settings.workshopNit} · Glosa: {activeOrder.id} ({activeOrder.plate})
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      type="button"
                      className="button whatsapp full-width"
                      onClick={() => {
                        const totalFormatted = formatCLP(calculateOrderTotal(activeOrder))
                        const msg = `Hola ${settings.workshopName} 👋,\n\nLes notifico que acabo de realizar el pago por *QR Simple* para mi motocicleta:\n\n🏍️ *Moto:* ${activeOrder.bike}\n🔢 *Placa:* ${activeOrder.plate}\n📋 *Orden:* ${activeOrder.id}\n👤 *Cliente:* ${activeOrder.client}\n💰 *Monto Pagado:* ${totalFormatted}\n\nAdjunto a continuación la captura de pantalla de mi comprobante bancario para que puedan registrarlo y tener lista mi moto para entrega. ¡Muchas gracias!`
                        const targetPhone = settings.workshopPhone || '+591 7700 1234'
                        const url = buildWhatsAppUrl(targetPhone, msg)
                        window.open(url, '_blank', 'noopener,noreferrer')
                        if (onNotifyQrPayment) {
                          onNotifyQrPayment(activeOrder.id)
                        }
                        onToast(
                          `Abriendo WhatsApp del Taller (${targetPhone}) para notificar pago de ${totalFormatted}`
                        )
                      }}
                    >
                      <MessageCircle /> Enviar comprobante al Taller por WhatsApp
                    </button>
                    <button
                      type="button"
                      className="button secondary full-width"
                      onClick={() => openPrintableOfficialReceipt(activeOrder, settings)}
                    >
                      <Printer /> Imprimir Recibo Oficial / Garantía (NIT/CI)
                    </button>
                  </div>
                </section>

                <section className="panel history-card">
                  <div className="panel-heading compact">
                    <div>
                      <h2>Bitácora de Visitas</h2>
                      <p>{1 + activeOrder.history.length} ingresos registrados en taller</p>
                    </div>
                    <FileText />
                  </div>
                  <div className="history-item">
                    <div>
                      <strong>Hoy · {activeOrder.id} (Actual)</strong>
                      <span>
                        {activeOrder.service} · {activeOrder.replacedParts.length} piezas
                      </span>
                    </div>
                    <strong>{formatCLP(calculateOrderTotal(activeOrder))}</strong>
                  </div>
                  {activeOrder.history.map((item) => (
                    <div className="history-item" key={item.id}>
                      <div>
                        <strong>
                          {item.date} {item.orderCode ? `· ${item.orderCode}` : ''}
                        </strong>
                        <span>
                          {item.service} ({item.mileage || 'Mantención'})
                        </span>
                      </div>
                      <strong>{formatCLP(item.amount)}</strong>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="button secondary full-width"
                    style={{ marginTop: '6px' }}
                    onClick={() => {
                      setClientTab('Historial')
                      setSubView('historial')
                    }}
                  >
                    Abrir historial clínico completo
                  </button>
                </section>
              </aside>
            </div>
          )}

          {/* ===================== VISTA 2: PIEZAS CAMBIADAS POR EL MECÁNICO ===================== */}
          {effectiveView === 'piezas' && (
            <section className="panel" style={{ marginTop: '14px', padding: '20px 22px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span className="eyebrow" style={{ color: 'var(--orange)' }}>
                    TRAZABILIDAD DE REPUESTOS Y GARANTÍA DE TALLER
                  </span>
                  <h2 style={{ margin: '4px 0', fontSize: '17px' }}>
                    Piezas cambiadas en tu {activeOrder.bike} ({activeOrder.plate})
                  </h2>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                    Cada componente instalado por <strong>{activeOrder.mechanic}</strong> queda registrado con su código OEM/SKU, el diagnóstico de la pieza vieja retirada y su certificado de garantía.
                  </p>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => handleDownloadCertificate(activeOrder)}
                >
                  <Download /> Descargar Certificado de Piezas (.TXT)
                </button>
              </div>

              <div className="replaced-parts-grid">
                {activeOrder.replacedParts.map((part) => (
                  <article className="replaced-part-card" key={part.id}>
                    <div className="replaced-part-top">
                      <div>
                        <span className="part-category-tag">{part.systemCategory}</span>
                        <h3>{part.partName}</h3>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          Marca: <strong>{part.brand}</strong> · Código OEM/SKU:{' '}
                          <span className="plate-chip">{part.partCode}</span>
                        </div>
                      </div>
                      <span className="status-badge status-green">{part.actionTaken}</span>
                    </div>

                    <div className="old-part-diagnosis-box">
                      <strong>🔍 Estado de la pieza reemplazada (diagnóstico del mecánico):</strong>
                      <p>“{part.oldPartCondition}”</p>
                    </div>

                    <div className="replaced-part-meta">
                      <div>
                        <span>Instalado por:</span>
                        <strong>{part.installedBy}</strong>
                      </div>
                      <div>
                        <span>Fecha / Hora montaje:</span>
                        <strong>{part.installedAt}</strong>
                      </div>
                      <div>
                        <span>Garantía oficial taller:</span>
                        <strong style={{ color: '#178b44' }}>{part.warrantyMonths} meses</strong>
                      </div>
                      <div>
                        <span>Valor unitario:</span>
                        <strong>
                          {part.unitCost > 0 ? formatCLP(part.unitCost) : 'Incluido en servicio'}
                        </strong>
                      </div>
                    </div>

                    <div className="replaced-part-footer">
                      {part.oldPartReturnedToClient ? (
                        <span
                          className="intake-badge"
                          style={{ background: '#e9f8f0', color: '#178b44' }}
                        >
                          ✓ Pieza usada guardada en caja sellada para entrega al cliente
                        </span>
                      ) : (
                        <span className="intake-badge">
                          ♻️ Insumo/fluido enviado a reciclaje certificado
                        </span>
                      )}
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        Respaldado en Orden {activeOrder.id}
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              {/* PIEZAS CAMBIADAS EN VISITAS ANTERIORES */}
              <div style={{ marginTop: '24px', borderTop: '1px solid #edf0f3', paddingTop: '18px' }}>
                <h3 style={{ fontSize: '14px', margin: '0 0 10px' }}>
                  Archivo de piezas reemplazadas en visitas anteriores ({activeOrder.history.length}{' '}
                  órdenes previas)
                </h3>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fecha / Orden</th>
                        <th>Kilometraje</th>
                        <th>Mecánico</th>
                        <th>Diagnóstico de ingreso en esa visita</th>
                        <th>Piezas cambiadas en taller</th>
                        <th>Garantía</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrder.history.map((h) => (
                        <tr key={h.id}>
                          <td>
                            <strong>{h.orderCode || 'OT-HIST'}</strong>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{h.date}</div>
                          </td>
                          <td>{h.mileage || '—'}</td>
                          <td>{h.mechanic || activeOrder.mechanic}</td>
                          <td style={{ maxWidth: '260px', fontSize: '10px' }}>
                            {h.intakeDiagnosis || h.service}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {(h.partsChanged ?? [h.service]).map((pName, i) => (
                                <span key={i} className="intake-badge">
                                  🔩 {pName}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span
                              className="intake-badge"
                              style={{
                                background:
                                  h.warrantyStatus === 'Garantía vigente' ? '#e9f8f0' : '#f1f5f9',
                                color:
                                  h.warrantyStatus === 'Garantía vigente' ? '#178b44' : '#64748b',
                              }}
                            >
                              {h.warrantyStatus || 'Cumplida'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ===================== VISTA 3: HISTORIAL CLÍNICO Y RESPALDO ===================== */}
          {effectiveView === 'historial' && (
            <div className="section-container" style={{ padding: 0, marginTop: '14px' }}>
              <section className="panel" style={{ padding: '20px 22px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <span className="eyebrow" style={{ color: 'var(--blue)' }}>
                      HISTORIAL CLÍNICO DE DIAGNÓSTICOS Y MANTENCIONES
                    </span>
                    <h2 style={{ margin: '4px 0', fontSize: '17px' }}>
                      Expediente histórico de {activeOrder.bike} ({activeOrder.plate})
                    </h2>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      Respaldo íntegro de cada ingreso al taller, qué diagnóstico tuvo, cómo se resolvió y qué piezas se cambiaron.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        const cert = buildClientTechnicalCertificate(
                          activeOrder,
                          settings.workshopName
                        )
                        navigator.clipboard?.writeText(cert)
                        onToast('Certificado técnico copiado al portapapeles')
                      }}
                    >
                      <Copy /> Copiar Respaldo
                    </button>
                    <button
                      type="button"
                      className="button primary"
                      onClick={() => handleDownloadCertificate(activeOrder)}
                    >
                      <Download /> Descargar Certificado Técnico (.TXT)
                    </button>
                  </div>
                </div>

                {/* LÍNEA DE TIEMPO CLÍNICA COMPLETA (ORDEN ACTUAL + HISTORIAL) */}
                <div className="clinical-history-stack">
                  {/* Orden Actual */}
                  <article className="clinical-visit-card current-visit">
                    <div className="clinical-visit-header">
                      <div>
                        <span className="order-id">
                          VISITA ACTUAL · {activeOrder.id} · {activeOrder.createdAt}
                        </span>
                        <h3>
                          {activeOrder.service} — Odómetro: {activeOrder.mileage || '15.000 km'}
                        </h3>
                        <span>Mecánico responsable: {activeOrder.mechanic}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <StatusPill status={activeOrder.status} />
                        <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px' }}>
                          {formatCLP(calculateOrderTotal(activeOrder))}
                        </div>
                      </div>
                    </div>

                    <div className="clinical-visit-grid">
                      <div className="diagnosis-box">
                        <strong>Diagnóstico con el que ingresó al taller:</strong>
                        <span>“{activeOrder.diagnosis}”</span>
                      </div>
                      <div className="work-progress-box">
                        <strong>Resolución técnica / Trabajo en curso:</strong>
                        <span>“{activeOrder.mechanicNote}”</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <strong style={{ fontSize: '10px', color: '#475569', display: 'block', marginBottom: '6px' }}>
                        Piezas reemplazadas en esta orden ({activeOrder.replacedParts.length}):
                      </strong>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {activeOrder.replacedParts.map((rp) => (
                          <span key={rp.id} className="intake-badge">
                            🔩 {rp.partName} ({rp.partCode}) · Garantía {rp.warrantyMonths}m
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>

                  {/* Visitas Anteriores */}
                  {activeOrder.history.map((h) => (
                    <article className="clinical-visit-card" key={h.id}>
                      <div className="clinical-visit-header">
                        <div>
                          <span className="order-id" style={{ color: '#64748b' }}>
                            VISITA HISTÓRICA · {h.orderCode || 'OT-HIST'} · {h.date.toUpperCase()}
                          </span>
                          <h3>
                            {h.service} — Odómetro: {h.mileage || 'Registro previo'}
                          </h3>
                          <span>
                            Mecánico que intervino: {h.mechanic || activeOrder.mechanic}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <StatusPill status="Entregado" />
                          <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px' }}>
                            {formatCLP(h.amount)}
                          </div>
                        </div>
                      </div>

                      <div className="clinical-visit-grid">
                        <div className="diagnosis-box">
                          <strong>Diagnóstico de ingreso en esa fecha:</strong>
                          <span>
                            “{h.intakeDiagnosis || `Ingreso programado para ${h.service}`}”
                          </span>
                        </div>
                        <div className="work-progress-box">
                          <strong>Trabajo técnico realizado:</strong>
                          <span>
                            “
                            {h.technicalResolution ||
                              'Mantenimiento ejecutado conforme a manual de servicio y entregado en conformidad.'}
                            ”
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <strong style={{ fontSize: '10px', color: '#475569', display: 'block', marginBottom: '6px' }}>
                          Piezas cambiadas en esa visita:
                        </strong>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {(h.partsChanged ?? [h.service]).map((partStr, idx) => (
                            <span key={idx} className="intake-badge">
                              ✓ {partStr}
                            </span>
                          ))}
                          <span
                            className="intake-badge"
                            style={{ background: '#e9f8f0', color: '#178b44' }}
                          >
                            {h.warrantyStatus || 'Garantía cumplida'}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  )
}

