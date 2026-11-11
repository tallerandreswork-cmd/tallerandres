'use client'

import React, { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Award,
  Check,
  Copy,
  Flame,
  Megaphone,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Video,
  Wrench,
  Zap,
} from 'lucide-react'
import {
  buildWhatsAppUrl,
  calculateMechanicLeaderboard,
  calculateTopServicesAnalytics,
  formatCLP,
  formatCompactCLP,
  generateMarketingCampaigns,
  InventoryItem,
  Order,
  WorkshopSettings,
} from '@/lib/workshop-data'

interface DashboardIntelligenceSectionProps {
  orders: Order[]
  inventory: InventoryItem[]
  settings: WorkshopSettings
  activeMechanicFilter: string
  onSelectMechanicFilter: (mechanicName: string) => void
  onCopyText: (text: string, label: string) => void
  onNavigateToOrders: (searchQuery?: string) => void
}

const SERVICE_PIE_COLORS = [
  '#ea580c', // Naranja principal
  '#2563eb', // Azul
  '#16a34a', // Verde
  '#7c3aed', // Violeta
  '#0d9488', // Teal
]

export function DashboardIntelligenceSection({
  orders,
  inventory,
  settings,
  activeMechanicFilter,
  onSelectMechanicFilter,
  onCopyText,
  onNavigateToOrders,
}: DashboardIntelligenceSectionProps) {
  const mechanicLeaderboard = useMemo(
    () => calculateMechanicLeaderboard(orders, settings.mechanics),
    [orders, settings.mechanics]
  )

  const topServices = useMemo(() => calculateTopServicesAnalytics(orders), [orders])

  const marketingCampaigns = useMemo(
    () =>
      generateMarketingCampaigns(
        orders,
        inventory,
        settings.workshopName,
        settings.workshopPhone
      ),
    [orders, inventory, settings.workshopName, settings.workshopPhone]
  )

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('camp-volumen')
  const [targetClientId, setTargetClientId] = useState<string>(orders[0]?.id ?? 'OT-2048')

  const activeCampaign = useMemo(
    () =>
      marketingCampaigns.find((c) => c.id === selectedCampaignId) ?? marketingCampaigns[0],
    [marketingCampaigns, selectedCampaignId]
  )

  const mostRequestedService = useMemo(() => {
    return (
      topServices.slice().sort((a, b) => b.jobsCount - a.jobsCount)[0] ?? topServices[0]
    )
  }, [topServices])

  const highestRevenueService = topServices[0]
  const topMechanic = mechanicLeaderboard[0]

  const mechanicChartData = useMemo(() => {
    return mechanicLeaderboard.map((m) => ({
      name: m.mechanic.split(' ')[0],
      fullName: m.mechanic,
      Facturado: m.totalGeneratedBOB,
      ComisionMecanico: m.estimatedCommissionBOB,
    }))
  }, [mechanicLeaderboard])

  const targetClientOrder = useMemo(
    () => orders.find((o) => o.id === targetClientId) ?? orders[0],
    [orders, targetClientId]
  )

  return (
    <div className="dashboard-bi-section">
      {/* BANNER EJECUTIVO DE INTELIGENCIA DEL MES */}
      <div className="bi-executive-banner">
        <div className="bi-banner-left">
          <span className="bi-kicker">
            <Sparkles style={{ width: '12px', height: '12px' }} /> INTELIGENCIA DE TALLER &
            MARKETING EN VIVO (BOLIVIA · BS)
          </span>
          <h2>Radiografía de Productividad, Servicios Estrella y Generador de Publicidad</h2>
          <p>
            Descubre de un vistazo qué mecánico está generando y ganando más, qué trabajo salió
            más este mes y lanza promociones listas para Facebook, TikTok y WhatsApp.
          </p>
        </div>

        <div className="bi-highlight-pills">
          {topMechanic && (
            <div className="bi-mini-highlight gold">
              <Trophy style={{ width: '16px', height: '16px' }} />
              <div>
                <span>Mecánico #1 del Mes</span>
                <strong>
                  {topMechanic.mechanic} ({formatCLP(topMechanic.estimatedCommissionBOB)} ganados)
                </strong>
              </div>
            </div>
          )}
          {mostRequestedService && (
            <div className="bi-mini-highlight orange">
              <Flame style={{ width: '16px', height: '16px' }} />
              <div>
                <span>Trabajo que más salió</span>
                <strong>
                  {mostRequestedService.serviceCategory} ({mostRequestedService.jobsCount} motos)
                </strong>
              </div>
            </div>
          )}
          {highestRevenueService && (
            <div className="bi-mini-highlight green">
              <TrendingUp style={{ width: '16px', height: '16px' }} />
              <div>
                <span>Servicio más rentable</span>
                <strong>
                  {formatCLP(highestRevenueService.totalRevenueBOB)} (Ticket prom.{' '}
                  {formatCLP(highestRevenueService.avgTicketBOB)})
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FILA 1: RANKING DE MECÁNICOS (QUIÉN GANA MÁS) + TRABAJOS QUE MÁS SALIERON ESTE MES */}
      <div className="bi-two-col-grid">
        {/* PANEL 1: RANKING DE MECÁNICOS Y COMISIONES EN BS */}
        <section className="panel bi-panel">
          <div className="panel-heading">
            <div>
              <span className="finance-kicker">
                🏆 RENDIMIENTO DE EQUIPO TÉCNICO · PRODUCCIÓN Y COMISIONES
              </span>
              <h2>¿Qué mecánico está produciendo y ganando más este mes?</h2>
              <p>
                Cálculo automático sobre órdenes activas + historial cerrado (32% comisión técnica
                + bono por repuesto instalado)
              </p>
            </div>
            {activeMechanicFilter !== 'Todos' && (
              <button
                type="button"
                className="filter-chip active"
                onClick={() => onSelectMechanicFilter('Todos')}
              >
                Filtro activo: {activeMechanicFilter} ✕
              </button>
            )}
          </div>

          <div className="mechanic-leaderboard-list">
            {mechanicLeaderboard.map((mec, idx) => {
              const isLeader = idx === 0
              const isSelected = activeMechanicFilter === mec.mechanic
              return (
                <article
                  key={mec.mechanic}
                  className={`mechanic-rank-card ${isLeader ? 'leader' : ''} ${
                    isSelected ? 'selected-filter' : ''
                  }`}
                  onClick={() =>
                    onSelectMechanicFilter(
                      activeMechanicFilter === mec.mechanic ? 'Todos' : mec.mechanic
                    )
                  }
                  title={`Haz clic para filtrar las motos de ${mec.mechanic} en el tablero Kanban`}
                >
                  <div className="mec-rank-left">
                    <div className={`mec-rank-badge rank-${idx + 1}`}>
                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : `#${idx + 1}`}
                    </div>
                    <div className="mec-avatar-circle">{mec.initials}</div>
                    <div className="mec-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong>{mec.mechanic}</strong>
                        {isLeader && (
                          <span className="leader-crown-pill">⭐ Líder en Ganancias</span>
                        )}
                      </div>
                      <span className="mec-specialty">{mec.topSpecialty}</span>
                      <div className="mec-micro-metrics">
                        <span>
                          🏍️ <strong>{mec.totalJobsCount}</strong> servicios ({mec.activeOrdersCount}{' '}
                          en taller · {mec.completedHistoryCount} cerrados)
                        </span>
                        <span>
                          🔩 <strong>{mec.partsInstalledCount}</strong> piezas cambiadas
                        </span>
                        <span>
                          🛡️ Salud prom.: <strong>{mec.avgHealthScore}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mec-rank-right">
                    <div className="mec-earning-box">
                      <span>Ganancia / Comisión Mecánico</span>
                      <strong className="mec-commission-value">
                        {formatCLP(mec.estimatedCommissionBOB)}
                      </strong>
                    </div>
                    <div className="mec-generated-box">
                      <span>Generado para el Taller:</span>
                      <strong>
                        {formatCLP(mec.totalGeneratedBOB)} ({mec.sharePercentage}%)
                      </strong>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Mini Gráfico de Barras Recharts: Generado Taller vs Ganancia Mecánico */}
          <div className="bi-mini-chart-box">
            <div className="bi-mini-chart-header">
              <strong>Comparativa Visual: Producción Taller vs. Ganancia Mecánico (Bs)</strong>
              <div className="chart-legend">
                <span>
                  <i className="dot blue" style={{ background: '#2563eb' }} /> Generado al Taller
                </span>
                <span>
                  <i className="dot green" style={{ background: '#16a34a' }} /> Ganancia Mecánico
                </span>
              </div>
            </div>
            <div style={{ width: '100%', height: 165 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mechanicChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `Bs ${v}`}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={65}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCLP(Number(value ?? 0)),
                      name === 'Facturado' ? 'Facturado para Taller' : 'Ganancia / Comisión Mecánico',
                    ]}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="Facturado" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={14} />
                  <Bar
                    dataKey="ComisionMecanico"
                    fill="#16a34a"
                    radius={[0, 6, 6, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* PANEL 2: QUÉ TRABAJO SE TRABAJÓ Y SALIÓ MÁS ESTE MES (TORTA + RANKING DE DEMANDA) */}
        <section className="panel bi-panel">
          <div className="panel-heading">
            <div>
              <span className="finance-kicker">
                🔥 DEMANDA DE TALLER · TRABAJOS QUE MÁS SALIERON ESTE MES
              </span>
              <h2>¿Qué servicios se trabajaron más y cuáles dejaron más dinero?</h2>
              <p>
                Analítica real de órdenes actuales e historial para detectar tu servicio estrella
              </p>
            </div>
            <span className="status-pill orange">
              Top Demanda: {mostRequestedService?.jobsCount ?? 0} servicios
            </span>
          </div>

          <div className="pie-analytics-layout" style={{ marginTop: '2px' }}>
            <div className="pie-canvas-wrapper" style={{ height: '215px' }}>
              <ResponsiveContainer width="100%" height={215}>
                <PieChart>
                  <Pie
                    data={topServices}
                    dataKey="totalRevenueBOB"
                    nameKey="serviceCategory"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {topServices.map((entry, idx) => (
                      <Cell
                        key={entry.serviceCategory}
                        fill={SERVICE_PIE_COLORS[idx % SERVICE_PIE_COLORS.length]}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      formatCLP(Number(value ?? 0)),
                      'Facturación acumulada',
                    ]}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-center-label">
                <span>Total Servicios</span>
                <strong>
                  {topServices.reduce((acc, s) => acc + s.jobsCount, 0)} motos
                </strong>
                <small>Atendidas</small>
              </div>
            </div>

            <div className="pie-legend-list">
              {topServices.map((srv, idx) => {
                const color = SERVICE_PIE_COLORS[idx % SERVICE_PIE_COLORS.length]
                return (
                  <div
                    key={srv.serviceCategory}
                    className="service-demand-row"
                    onClick={() => onNavigateToOrders(srv.sampleServiceName.split(' ')[0])}
                    title="Clic para buscar órdenes de este tipo de trabajo"
                  >
                    <div className="service-demand-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span
                          className="pie-color-dot"
                          style={{ backgroundColor: color }}
                        />
                        <strong>{srv.serviceCategory}</strong>
                      </div>
                      <span className="service-jobs-pill">
                        {srv.jobsCount} {srv.jobsCount === 1 ? 'salida' : 'salidas'} ·{' '}
                        {formatCLP(srv.totalRevenueBOB)}
                      </span>
                    </div>
                    <div className="service-demand-sub">
                      <span className="marketing-tag-chip">{srv.marketingTag}</span>
                      <span>
                        Ticket prom.: <strong>{formatCLP(srv.avgTicketBOB)}</strong> (
                        {srv.sharePercentage}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bi-insight-callout">
            <Zap style={{ width: '16px', height: '16px', color: '#ea580c', flexShrink: 0 }} />
            <div>
              <strong>Recomendación de Ingeniería Comercial para tu Taller:</strong> El trabajo que
              más salió en cantidad es{' '}
              <strong>{mostRequestedService?.serviceCategory}</strong> ({mostRequestedService?.jobsCount}{' '}
              motos), mientras que el que deja el ticket más alto por moto es{' '}
              <strong>{highestRevenueService?.serviceCategory}</strong> (promedio{' '}
              <strong>{formatCLP(highestRevenueService?.avgTicketBOB ?? 0)}</strong>). Usa el
              generador de abajo para lanzar tu publicidad hoy mismo.
            </div>
          </div>
        </section>
      </div>

      {/* FILA 2: GENERADOR INTELIGENTE DE PUBLICIDAD Y CAMPAÑAS (MARKETING STUDIO) */}
      {activeCampaign && (
        <section className="panel marketing-studio-panel">
          <div className="panel-heading">
            <div>
              <span className="finance-kicker">
                📣 MARKETING STUDIO · GENERADOR AUTOMÁTICO DE PUBLICIDAD BASADO EN TUS VENTAS
              </span>
              <h2>Crea tu Publicidad del Mes en 1 Clic (Facebook, Instagram, TikTok y WhatsApp)</h2>
              <p>
                Textos publicitarios y guiones de video generados inteligentemente según los
                trabajos que más salieron y tu stock real en Bolivianos (Bs)
              </p>
            </div>

            <div className="campaign-selector-tabs">
              {marketingCampaigns.map((camp) => {
                let label = camp.title
                if (camp.id === 'camp-volumen') {
                  label = `🔥 1. Más Vendido: ${camp.title.replace('Campaña Masiva: ', '').replace('Campaña: ', '')}`
                } else if (camp.id === 'camp-rentabilidad') {
                  label = `💎 2. Mayor Ganancia: ${camp.title.replace('Campaña Alto Ticket: ', '').replace('Campaña: ', '')}`
                } else if (camp.id === 'camp-stock-bodega') {
                  label = `📦 3. Liquidar Stock Bodega`
                } else {
                  label = `⚡ ${camp.title.replace('Campaña: ', '')}`
                }

                return (
                  <button
                    key={camp.id}
                    type="button"
                    className={`campaign-tab-btn ${
                      activeCampaign.id === camp.id ? 'active' : ''
                    }`}
                    onClick={() => setSelectedCampaignId(camp.id)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="marketing-studio-grid">
            {/* COLUMNA 1: COPY PARA REDES SOCIALES (FACEBOOK / INSTAGRAM) */}
            <div className="marketing-card">
              <div className="marketing-card-header">
                <div>
                  <span className="marketing-badge">{activeCampaign.badge}</span>
                  <h3>{activeCampaign.title}</h3>
                </div>
                <div className="promo-price-tag">
                  <span>Precio Promo Sugerido</span>
                  <strong>{formatCLP(activeCampaign.promoPriceBOB)}</strong>
                  <small>Normal: {formatCLP(activeCampaign.normalPriceBOB)}</small>
                </div>
              </div>

              <p className="marketing-hook-text">“{activeCampaign.promoHook}”</p>

              {/* ESTRATEGIA COMERCIAL PARA ATRAER CLIENTES AL TALLER */}
              {(activeCampaign.strategyTip || activeCampaign.targetAudience) && (
                <div className="bi-strategy-box">
                  <div className="bi-strategy-header">
                    <Target style={{ width: '15px', height: '15px', color: '#ea580c', flexShrink: 0 }} />
                    <span>Estrategia Comercial para Atraer Clientes al Taller:</span>
                  </div>
                  {activeCampaign.strategyTip && (
                    <p className="bi-strategy-text">
                      💡 <strong>Cómo captar clientes:</strong> {activeCampaign.strategyTip}
                    </p>
                  )}
                  {activeCampaign.targetAudience && (
                    <p className="bi-strategy-audience">
                      🎯 <strong>Público Objetivo Recomendado:</strong> {activeCampaign.targetAudience}
                    </p>
                  )}
                </div>
              )}

              <label className="marketing-label">
                📱 Arte de Texto / Copy listo para publicar en Facebook e Instagram:
              </label>
              <pre className="marketing-copy-box">{activeCampaign.socialCopy}</pre>

              <div className="marketing-card-actions">
                <button
                  type="button"
                  className="button primary"
                  onClick={() =>
                    onCopyText(
                      activeCampaign.socialCopy,
                      `Anuncio "${activeCampaign.title}" copiado para Facebook/Instagram`
                    )
                  }
                >
                  <Copy /> Copiar Anuncio para Facebook / IG
                </button>
                <span className="expected-impact-tag">
                  📈 Impacto estimado: <strong>{activeCampaign.expectedImpact}</strong>
                </span>
              </div>
            </div>

            {/* COLUMNA 2: GUION PARA TIKTOK / REEL + DIFUSIÓN DIRECTA POR WHATSAPP */}
            <div className="marketing-card">
              <div className="marketing-card-header">
                <div>
                  <span className="marketing-badge purple">
                    🎬 GUION DE VIDEO CORTO (15 SEG) + DIFUSIÓN WHATSAPP
                  </span>
                  <h3>Guion para TikTok / Reel & Campaña de Retorno por WhatsApp</h3>
                </div>
              </div>

              <label className="marketing-label">
                🎥 Guion paso a paso (15 seg) para grabar en el taller con tu celular:
              </label>
              <pre className="marketing-copy-box compact">{activeCampaign.reelScript}</pre>

              <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  className="button secondary"
                  style={{ height: '30px', fontSize: '11px' }}
                  onClick={() =>
                    onCopyText(
                      activeCampaign.reelScript,
                      'Guion de TikTok / Reel copiado al portapapeles'
                    )
                  }
                >
                  <Video style={{ width: '13px' }} /> Copiar Guion de TikTok / Reel
                </button>
              </div>

              <div className="whatsapp-promo-sender">
                <label className="marketing-label">
                  💬 Enviar esta promoción directamente al WhatsApp de un cliente del taller:
                </label>
                <p className="wa-preview-line">{activeCampaign.whatsappBroadcastText}</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="button secondary"
                    style={{ height: '30px', fontSize: '11px' }}
                    onClick={() =>
                      onCopyText(
                        activeCampaign.whatsappBroadcastText,
                        'Mensaje de difusión de WhatsApp copiado al portapapeles'
                      )
                    }
                  >
                    <Copy style={{ width: '13px' }} /> Copiar Texto para Estados / Difusión
                  </button>
                </div>
                <div className="wa-sender-controls">
                  <select
                    value={targetClientId}
                    onChange={(e) => setTargetClientId(e.target.value)}
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.client} — {o.bike} ({o.phone})
                      </option>
                    ))}
                  </select>
                  {targetClientOrder && (
                    <a
                      href={buildWhatsAppUrl(
                        targetClientOrder.phone,
                        activeCampaign.whatsappBroadcastText
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button primary"
                      style={{
                        background: '#16a34a',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <MessageCircle /> Enviar Promo a {targetClientOrder.client.split(' ')[0]}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

