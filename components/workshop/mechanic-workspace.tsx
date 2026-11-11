'use client'

import { useMemo, useState } from 'react'
import {
  Bike,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ImagePlus,
  MessageCircle,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Search,
  Wrench,
  X,
} from 'lucide-react'
import {
  ALL_STATUSES,
  PART_SYSTEM_CATEGORIES,
  STATUS_FLOW,
  STATUS_META,
  type InventoryItem,
  type Order,
  type OrderStatus,
  type PartSystemCategory,
  type ReplacedPartItem,
  calculateBikeHealthScore,
  calculateOrderTotal,
  formatCLP,
  getNextStatus,
  getOrdersForMechanic,
  getPrevStatus,
} from '@/lib/workshop-data'

const columns: { name: string; key: OrderStatus; tone: string }[] = [
  { name: 'Agendado', key: 'Agendado', tone: 'muted' },
  { name: 'En diagnóstico', key: 'En diagnóstico', tone: 'blue' },
  { name: 'En reparación', key: 'En reparación', tone: 'orange' },
  { name: 'Listo para entrega', key: 'Listo para entrega', tone: 'green' },
]

export function MechanicWorkspace({
  mechanicName,
  activeTab,
  orders,
  inventory = [],
  onSelectOrder,
  onAdvanceStatus,
  onChangeOrderStatus,
  onOpenNewOrderForMe,
  onOpenWhatsAppForOrder,
  onQuickUpdateMechanicNote,
  onAddReplacedPart,
  onAddPhoto,
}: {
  mechanicName: string
  activeTab: 'Mi Bahía' | 'Mis Diagnósticos'
  orders: Order[]
  inventory?: InventoryItem[]
  onSelectOrder: (orderId: string) => void
  onAdvanceStatus: (orderId: string) => void
  onChangeOrderStatus?: (orderId: string, status: OrderStatus) => void
  onOpenNewOrderForMe: () => void
  onOpenWhatsAppForOrder: (order: Order) => void
  onQuickUpdateMechanicNote: (
    orderId: string,
    diagnosis: string,
    service: string,
    note: string
  ) => void
  onAddReplacedPart: (
    orderId: string,
    part: ReplacedPartItem,
    addToQuote: boolean
  ) => void
  onAddPhoto: (orderId: string) => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Todas')
  const [editingInlineId, setEditingInlineId] = useState<string | null>(null)
  const [draftDiagnosis, setDraftDiagnosis] = useState('')
  const [draftService, setDraftService] = useState('')
  const [draftNote, setDraftNote] = useState('')

  // Quick form to register a replaced part on a bike
  const [addingPartOrderId, setAddingPartOrderId] = useState<string | null>(null)
  const [partForm, setPartForm] = useState<{
    partName: string
    brand: string
    partCode: string
    systemCategory: PartSystemCategory
    oldPartCondition: string
    warrantyMonths: string
    unitCost: string
    oldPartReturnedToClient: boolean
    addToQuote: boolean
  }>({
    partName: '',
    brand: 'OEM Original',
    partCode: '',
    systemCategory: 'Motor y Lubricación',
    oldPartCondition: '',
    warrantyMonths: '6',
    unitCost: '220',
    oldPartReturnedToClient: true,
    addToQuote: true,
  })

  // Strict RBAC: Only orders assigned to this mechanic
  const myOrders = useMemo(
    () => getOrdersForMechanic(orders, mechanicName),
    [orders, mechanicName]
  )

  const myActiveOrders = useMemo(
    () => myOrders.filter((o) => o.status !== 'Entregado'),
    [myOrders]
  )

  const filteredActiveOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return myActiveOrders
    return myActiveOrders.filter((o) =>
      `${o.id} ${o.bike} ${o.plate} ${o.client} ${o.service} ${o.diagnosis}`
        .toLowerCase()
        .includes(q)
    )
  }, [myActiveOrders, search])

  const inDiagnosisCount = myActiveOrders.filter((o) => o.status === 'En diagnóstico').length
  const inRepairCount = myActiveOrders.filter((o) => o.status === 'En reparación').length
  const totalPartsInstalledByMe = myOrders.reduce(
    (sum, o) => sum + o.replacedParts.length,
    0
  )

  const handleSavePart = (orderId: string) => {
    if (!partForm.partName.trim()) return
    const newPart: ReplacedPartItem = {
      id: `rp-${Date.now()}`,
      partName: partForm.partName.trim(),
      brand: partForm.brand.trim() || 'OEM Original',
      partCode:
        partForm.partCode.trim().toUpperCase() ||
        `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      systemCategory: partForm.systemCategory,
      oldPartCondition:
        partForm.oldPartCondition.trim() ||
        'Componente reemplazado por desgaste detectado en inspección técnica.',
      actionTaken: 'Reemplazado por nuevo',
      installedBy: mechanicName,
      installedAt: 'Hoy · En bahía',
      warrantyMonths: Math.max(1, Number(partForm.warrantyMonths) || 6),
      unitCost: Math.max(0, Number(partForm.unitCost) || 0),
      oldPartReturnedToClient: partForm.oldPartReturnedToClient,
    }
    onAddReplacedPart(orderId, newPart, partForm.addToQuote)
    setAddingPartOrderId(null)
    setPartForm({
      partName: '',
      brand: 'OEM Original',
      partCode: '',
      systemCategory: 'Motor y Lubricación',
      oldPartCondition: '',
      warrantyMonths: '6',
      unitCost: '220',
      oldPartReturnedToClient: true,
      addToQuote: true,
    })
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow" style={{ color: 'var(--blue)' }}>
            BAHÍA TÉCNICA PERSONAL · SOLO TUS REPARACIONES ASIGNADAS
          </p>
          <h1>
            Hola, {mechanicName.split(' ')[0]} <span>🔧</span>
          </h1>
          <p className="heading-sub">
            Aquí ves únicamente tus motocicletas asignadas ({myActiveOrders.length} en bahía). Todo diagnóstico y pieza que registres se sincroniza con el Portal del Cliente y el Respaldo del Admin.
          </p>
        </div>
        <div className="heading-actions">
          <button className="button primary" onClick={onOpenNewOrderForMe}>
            <Plus /> Ingresar moto a mi bahía
          </button>
        </div>
      </div>

      {/* KPIs exclusivos del mecánico */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon orange">
              <Bike />
            </div>
            <span className="stat-change">Asignadas a ti</span>
          </div>
          <div className="stat-label">Mis motos activas</div>
          <div className="stat-value">{String(myActiveOrders.length).padStart(2, '0')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon blue">
              <Search />
            </div>
            <span className="stat-change">Revisión inicial</span>
          </div>
          <div className="stat-label">En diagnóstico</div>
          <div className="stat-value">{String(inDiagnosisCount).padStart(2, '0')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon purple">
              <Wrench />
            </div>
            <span className="stat-change">En rampa ahora</span>
          </div>
          <div className="stat-label">En reparación</div>
          <div className="stat-value">{String(inRepairCount).padStart(2, '0')}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon green">
              <PackageCheck />
            </div>
            <span className="stat-change">Con respaldo cliente</span>
          </div>
          <div className="stat-label">Piezas instaladas</div>
          <div className="stat-value">{String(totalPartsInstalledByMe).padStart(2, '0')}</div>
        </div>
      </div>

      {activeTab === 'Mi Bahía' ? (
        <div className="section-container">
          <section className="panel kanban-panel">
            <div className="panel-heading">
              <div>
                <h2>Mi tablero de reparación ({mechanicName})</h2>
                <p>
                  Gestiona el estado de tus motos, registra piezas cambiadas, sube fotos o envía el avance por WhatsApp
                </p>
              </div>
              <div className="panel-tools">
                <div className="search-box">
                  <Search />
                  <input
                    aria-label="Buscar en mis motos"
                    placeholder="Buscar placa, modelo o cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      className="more-mini"
                      aria-label="Limpiar búsqueda"
                      onClick={() => setSearch('')}
                    >
                      <X />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="kanban-board">
              {columns.map((column) => {
                const colOrders = filteredActiveOrders.filter((o) => o.status === column.key)
                return (
                  <div className="kanban-column" key={column.key}>
                    <div className="column-heading">
                      <span className={`column-indicator ${column.tone}`} />
                      <strong>{column.name}</strong>
                      <span className="column-count">{colOrders.length}</span>
                    </div>
                    <div className="card-stack">
                      {colOrders.map((order) => {
                        const meta = STATUS_META[order.status]
                        const currentStageIdx = STATUS_FLOW.indexOf(order.status)
                        return (
                          <article
                            className={`order-card ${meta.cssState}`}
                            key={order.id}
                          >
                            <div className="order-top">
                              <span
                                className="order-id"
                                style={{ cursor: 'pointer' }}
                                onClick={() => onSelectOrder(order.id)}
                              >
                                {order.id}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button
                                  className="more-mini"
                                  title={`Enviar reporte técnico por WhatsApp a ${order.client}`}
                                  onClick={() => onOpenWhatsAppForOrder(order)}
                                  style={{ color: '#178b44' }}
                                >
                                  <MessageCircle />
                                </button>
                                <button
                                  className="more-mini"
                                  aria-label={`Editar ${order.id}`}
                                  onClick={() => onSelectOrder(order.id)}
                                >
                                  <MoreHorizontal />
                                </button>
                              </div>
                            </div>

                            <div
                              className="bike-row"
                              onClick={() => onSelectOrder(order.id)}
                              title="Abrir ficha técnica para editar diagnóstico y piezas cambiadas"
                            >
                              <div className={`bike-icon ${order.accent}`}>
                                {order.status === 'En reparación' ? <Wrench /> : <Bike />}
                              </div>
                              <div>
                                <strong>{order.bike}</strong>
                                <span>
                                  {order.plate} · {order.client}
                                </span>
                              </div>
                            </div>

                            {/* Banner animado de estado en vivo y barra de progreso */}
                            <div className="live-state-banner">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span className="pulse-dot" />
                                <span>{meta.liveLabel}</span>
                              </div>
                              <span>{meta.progressPct}%</span>
                            </div>
                            <div className="order-progress-track">
                              <div
                                className="order-progress-fill"
                                style={{ width: `${meta.progressPct}%` }}
                              />
                            </div>

                            <div
                              className="diagnosis-box"
                              style={{ marginBottom: '6px', padding: '7px 9px', fontSize: '9px' }}
                            >
                              <strong>Diagnóstico ingreso:</strong>
                              {order.diagnosis}
                            </div>

                            <div
                              className="work-progress-box"
                              style={{ padding: '7px 9px', fontSize: '9px', marginBottom: '6px' }}
                            >
                              <strong>Haciendo ({order.service}):</strong>
                              “{order.mechanicNote}”
                            </div>

                            <div className="intake-badges">
                              <span className="intake-badge">
                                🔩 {order.replacedParts.length} piezas cambiadas
                              </span>
                              <span className="intake-badge">
                                Salud: {calculateBikeHealthScore(order)}%
                              </span>
                            </div>

                            {/* Botonera interactiva de 4 etapas para mover con 1 clic */}
                            <div className="stage-stepper" role="group" aria-label="Mover estado directamente">
                              {(
                                [
                                  ['Agendado', 'Agend.', 'tone-muted'],
                                  ['En diagnóstico', 'Diagn.', 'tone-blue'],
                                  ['En reparación', 'Repar.', 'tone-orange'],
                                  ['Listo para entrega', 'Lista', 'tone-green'],
                                ] as const
                              ).map(([st, label, toneClass], idx) => {
                                const isCurrent = order.status === st
                                const isDone = idx < currentStageIdx
                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    className={`stage-pill-btn ${toneClass} ${
                                      isCurrent ? 'active' : isDone ? 'done' : ''
                                    }`}
                                    title={`Mover ${order.id} a "${st}"`}
                                    onClick={() =>
                                      onChangeOrderStatus
                                        ? onChangeOrderStatus(order.id, st)
                                        : onAdvanceStatus(order.id)
                                    }
                                  >
                                    {label}
                                  </button>
                                )
                              })}
                            </div>

                            <div className="order-footer">
                              <button
                                type="button"
                                className="mini-btn"
                                style={{ fontSize: '9px', padding: '2px 6px' }}
                                onClick={() => onAddPhoto(order.id)}
                              >
                                <ImagePlus style={{ width: '11px' }} /> Foto ({order.photosCount})
                              </button>
                              <span className="eta">
                                <Clock3 />
                                {order.eta}
                              </span>
                            </div>

                            {/* Controles Anterior / Siguiente etapa */}
                            <div className="stage-nav-controls">
                              <button
                                type="button"
                                className="stage-nav-btn"
                                disabled={order.status === 'Agendado'}
                                title="Volver a la etapa anterior"
                                onClick={() =>
                                  onChangeOrderStatus?.(order.id, getPrevStatus(order.status))
                                }
                              >
                                <ChevronLeft style={{ width: '11px' }} /> Anterior
                              </button>
                              <button
                                type="button"
                                className={`stage-nav-btn ${
                                  order.status === 'Listo para entrega'
                                    ? 'deliver-ready'
                                    : 'primary-next'
                                }`}
                                onClick={() => onAdvanceStatus(order.id)}
                              >
                                {order.status === 'Listo para entrega'
                                  ? 'Entregar ✓'
                                  : `Pasar a ${getNextStatus(order.status)}`}{' '}
                                <ChevronRight style={{ width: '11px' }} />
                              </button>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="section-container">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Mis motocicletas, diagnósticos y registro de piezas cambiadas</h2>
                <p>
                  Actualiza el diagnóstico, la nota técnica y las piezas reemplazadas que verá el cliente en su portal y el administrador en su respaldo
                </p>
              </div>
              <div className="search-box">
                <Search />
                <input
                  placeholder="Buscar por placa o modelo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-bar">
              <span>Estado de mis motos:</span>
              {['Todas', ...ALL_STATUSES].map((st) => (
                <button
                  key={st}
                  className={`filter-chip ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st} (
                  {st === 'Todas'
                    ? myOrders.length
                    : myOrders.filter((o) => o.status === st).length}
                  )
                </button>
              ))}
            </div>

            <div className="clients-grid" style={{ padding: '18px 20px' }}>
              {myOrders
                .filter((o) => {
                  if (statusFilter !== 'Todas' && o.status !== statusFilter) return false
                  if (!search.trim()) return true
                  return `${o.id} ${o.bike} ${o.plate} ${o.client} ${o.service} ${o.diagnosis}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
                })
                .map((order) => {
                  const isEditing = editingInlineId === order.id
                  const isAddingPart = addingPartOrderId === order.id
                  const meta = STATUS_META[order.status]
                  const currentStageIdx = STATUS_FLOW.indexOf(order.status)
                  return (
                    <article
                      className={`panel client-card order-card ${meta.cssState}`}
                      key={order.id}
                    >
                      <div className="client-card-header">
                        <div>
                          <span className="order-id">{order.id}</span>
                          <h3 style={{ margin: '3px 0 0', fontSize: '14px' }}>
                            {order.bike} <span className="plate-chip">{order.plate}</span>
                          </h3>
                          <span style={{ fontSize: '10px', color: '#87929e' }}>
                            Cliente: {order.client} ({order.phone}) · {order.mileage || '15.000 km'}
                          </span>
                        </div>
                        <span className="status-badge status-orange">
                          <span className="status-dot" />
                          {order.status}
                        </span>
                      </div>

                      {/* Estado animado en vivo y botones para mover etapa */}
                      <div>
                        <div className="live-state-banner" style={{ margin: '0 0 5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span className="pulse-dot" />
                            <span>{meta.liveLabel}</span>
                          </div>
                          <span>{meta.progressPct}%</span>
                        </div>
                        <div className="order-progress-track" style={{ margin: '0 0 6px' }}>
                          <div
                            className="order-progress-fill"
                            style={{ width: `${meta.progressPct}%` }}
                          />
                        </div>
                        <div className="stage-stepper" role="group" aria-label="Mover etapa">
                          {(
                            [
                              ['Agendado', '1. Agendado', 'tone-muted'],
                              ['En diagnóstico', '2. Diagnóstico', 'tone-blue'],
                              ['En reparación', '3. Reparación', 'tone-orange'],
                              ['Listo para entrega', '4. Lista', 'tone-green'],
                            ] as const
                          ).map(([st, label, toneClass], idx) => (
                            <button
                              key={st}
                              type="button"
                              className={`stage-pill-btn ${toneClass} ${
                                order.status === st ? 'active' : idx < currentStageIdx ? 'done' : ''
                              }`}
                              onClick={() =>
                                onChangeOrderStatus
                                  ? onChangeOrderStatus(order.id, st)
                                  : onAdvanceStatus(order.id)
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '10px', fontWeight: 700, color: '#4b5967' }}>
                            Diagnóstico con el que entró al taller:
                            <textarea
                              style={{
                                width: '100%',
                                minHeight: '52px',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                fontSize: '11px',
                                marginTop: '4px',
                              }}
                              value={draftDiagnosis}
                              onChange={(e) => setDraftDiagnosis(e.target.value)}
                            />
                          </label>
                          <label style={{ fontSize: '10px', fontWeight: 700, color: '#4b5967' }}>
                            Trabajo que se le está realizando:
                            <input
                              style={{
                                width: '100%',
                                height: '32px',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '0 8px',
                                fontSize: '11px',
                                marginTop: '4px',
                              }}
                              value={draftService}
                              onChange={(e) => setDraftService(e.target.value)}
                            />
                          </label>
                          <label style={{ fontSize: '10px', fontWeight: 700, color: '#4b5967' }}>
                            Nota técnica del mecánico (avance actual):
                            <textarea
                              style={{
                                width: '100%',
                                minHeight: '56px',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                fontSize: '11px',
                                marginTop: '4px',
                              }}
                              value={draftNote}
                              onChange={(e) => setDraftNote(e.target.value)}
                            />
                          </label>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'end' }}>
                            <button
                              type="button"
                              className="button secondary"
                              style={{ height: '30px', fontSize: '10px' }}
                              onClick={() => setEditingInlineId(null)}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="button primary"
                              style={{ height: '30px', fontSize: '10px' }}
                              onClick={() => {
                                onQuickUpdateMechanicNote(
                                  order.id,
                                  draftDiagnosis.trim() || order.diagnosis,
                                  draftService.trim() || order.service,
                                  draftNote.trim() || order.mechanicNote
                                )
                                setEditingInlineId(null)
                              }}
                            >
                              <Check /> Guardar diagnóstico y nota
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="diagnosis-box">
                            <strong>1. Diagnóstico con el que entró al taller:</strong>
                            <span>“{order.diagnosis}”</span>
                          </div>

                          <div className="work-progress-box">
                            <strong>2. Lo que le estoy haciendo ({order.service}):</strong>
                            <span>“{order.mechanicNote}”</span>
                          </div>
                        </>
                      )}

                      {/* LISTA DE PIEZAS CAMBIADAS EN ESTA MOTO */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 12px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '6px',
                          }}
                        >
                          <strong style={{ fontSize: '10px', color: '#334155' }}>
                            🔩 Piezas cambiadas registradas ({order.replacedParts.length}):
                          </strong>
                          <button
                            type="button"
                            className="mini-btn"
                            style={{ fontSize: '9px' }}
                            onClick={() =>
                              setAddingPartOrderId(isAddingPart ? null : order.id)
                            }
                          >
                            <Plus style={{ width: '11px' }} /> Registrar pieza cambiada
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {order.replacedParts.map((rp) => (
                            <div
                              key={rp.id}
                              style={{
                                fontSize: '10px',
                                background: 'white',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #edf2f7',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontWeight: 700,
                                }}
                              >
                                <span>
                                  {rp.partName} ({rp.partCode})
                                </span>
                                <span style={{ color: '#178b44' }}>
                                  Garantía {rp.warrantyMonths}m
                                </span>
                              </div>
                              <div style={{ color: '#64748b', fontSize: '9px', marginTop: '2px' }}>
                                Estado pieza vieja: {rp.oldPartCondition}
                              </div>
                            </div>
                          ))}
                        </div>

                        {isAddingPart && (
                          <div
                            style={{
                              marginTop: '10px',
                              paddingTop: '10px',
                              borderTop: '1px dashed #cbd5e1',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '7px',
                            }}
                          >
                            <strong style={{ fontSize: '10px', color: 'var(--orange)' }}>
                              Nuevo reemplazo de pieza (se respalda en Portal Cliente y Admin y descuenta Stock):
                            </strong>
                            {inventory.length > 0 && (
                              <select
                                style={{
                                  height: '30px',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  padding: '0 6px',
                                  fontSize: '10px',
                                  background: '#fff',
                                }}
                                defaultValue=""
                                onChange={(e) => {
                                  const picked = inventory.find((it) => it.id === e.target.value)
                                  if (!picked) return
                                  setPartForm((prev) => ({
                                    ...prev,
                                    partName: picked.name,
                                    brand: picked.brand,
                                    partCode: picked.sku,
                                    systemCategory: picked.category,
                                    unitCost: String(picked.unitPriceBOB),
                                  }))
                                }}
                              >
                                <option value="">
                                  📦 Seleccionar repuesto del Kardex de Bodega (autocompletar en Bs)...
                                </option>
                                {inventory.map((it) => (
                                  <option key={it.id} value={it.id} disabled={it.stock <= 0}>
                                    {it.stock <= 0
                                      ? '❌ [AGOTADO / NO HAY] '
                                      : it.stock <= it.minStock
                                        ? '⚠️ [STOCK CRÍTICO] '
                                        : '✅ '}
                                    {it.name} ({it.sku}) — {formatCLP(it.unitPriceBOB)} ·{' '}
                                    {it.stock <= 0 ? 'SIN STOCK' : `Stock: ${it.stock} unid.`}
                                  </option>
                                ))}
                              </select>
                            )}
                            <input
                              style={{
                                height: '30px',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '0 8px',
                                fontSize: '10px',
                              }}
                              placeholder="Nombre de pieza (ej. Bujía NGK Iridium CR9EIX)"
                              value={partForm.partName}
                              onChange={(e) =>
                                setPartForm((prev) => ({ ...prev, partName: e.target.value }))
                              }
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              <input
                                style={{
                                  height: '30px',
                                  border: '1px solid var(--border)',
                                  borderRadius: '6px',
                                  padding: '0 8px',
                                  fontSize: '10px',
                                }}
                                placeholder="Marca (ej. NGK Japan)"
                                value={partForm.brand}
                                onChange={(e) =>
                                  setPartForm((prev) => ({ ...prev, brand: e.target.value }))
                                }
                              />
                              <input
                                style={{
                                  height: '30px',
                                  border: '1px solid var(--border)',
                                  borderRadius: '6px',
                                  padding: '0 8px',
                                  fontSize: '10px',
                                }}
                                placeholder="Código OEM / SKU"
                                value={partForm.partCode}
                                onChange={(e) =>
                                  setPartForm((prev) => ({ ...prev, partCode: e.target.value }))
                                }
                              />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                              <select
                                style={{
                                  height: '30px',
                                  border: '1px solid var(--border)',
                                  borderRadius: '6px',
                                  padding: '0 6px',
                                  fontSize: '10px',
                                }}
                                value={partForm.systemCategory}
                                onChange={(e) =>
                                  setPartForm((prev) => ({
                                    ...prev,
                                    systemCategory: e.target.value as PartSystemCategory,
                                  }))
                                }
                              >
                                {PART_SYSTEM_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                style={{
                                  height: '30px',
                                  border: '1px solid var(--border)',
                                  borderRadius: '6px',
                                  padding: '0 8px',
                                  fontSize: '10px',
                                }}
                                placeholder="Costo Bs"
                                value={partForm.unitCost}
                                onChange={(e) =>
                                  setPartForm((prev) => ({ ...prev, unitCost: e.target.value }))
                                }
                              />
                              <input
                                type="number"
                                style={{
                                  height: '30px',
                                  border: '1px solid var(--border)',
                                  borderRadius: '6px',
                                  padding: '0 8px',
                                  fontSize: '10px',
                                }}
                                placeholder="Garantía (meses)"
                                value={partForm.warrantyMonths}
                                onChange={(e) =>
                                  setPartForm((prev) => ({
                                    ...prev,
                                    warrantyMonths: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <input
                              style={{
                                height: '30px',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '0 8px',
                                fontSize: '10px',
                              }}
                              placeholder="Diagnóstico de la pieza retirada (ej. Electrodo desgastado y aislador fisurado)"
                              value={partForm.oldPartCondition}
                              onChange={(e) =>
                                setPartForm((prev) => ({
                                  ...prev,
                                  oldPartCondition: e.target.value,
                                }))
                              }
                            />
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '10px',
                                flexWrap: 'wrap',
                                gap: '6px',
                              }}
                            >
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="checkbox"
                                  checked={partForm.oldPartReturnedToClient}
                                  onChange={(e) =>
                                    setPartForm((prev) => ({
                                      ...prev,
                                      oldPartReturnedToClient: e.target.checked,
                                    }))
                                  }
                                />
                                Guardar pieza vieja para el cliente
                              </label>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="button secondary"
                                  style={{ height: '28px', fontSize: '10px' }}
                                  onClick={() => setAddingPartOrderId(null)}
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  className="button primary"
                                  style={{ height: '28px', fontSize: '10px' }}
                                  onClick={() => handleSavePart(order.id)}
                                >
                                  <Check /> Guardar pieza
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {order.clientComment && (
                        <div
                          style={{
                            background: '#edf3ff',
                            border: '1px solid #cfe0ff',
                            borderRadius: '7px',
                            padding: '8px 10px',
                            fontSize: '10px',
                          }}
                        >
                          <strong>Mensaje del cliente ({order.client}):</strong> “
                          {order.clientComment}”
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '10px',
                          color: '#687584',
                        }}
                      >
                        <span>
                          Cotización: <strong>{formatCLP(calculateOrderTotal(order))}</strong> (
                          {order.quoteApproved ? 'Aprobada' : 'Por aprobar'})
                        </span>
                        <span>Fotos: {order.photosCount}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                        <button
                          type="button"
                          className="button secondary"
                          style={{ height: '32px', fontSize: '10px' }}
                          onClick={() => {
                            setEditingInlineId(order.id)
                            setDraftDiagnosis(order.diagnosis)
                            setDraftService(order.service)
                            setDraftNote(order.mechanicNote)
                          }}
                        >
                          Editar diagnóstico/nota
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          style={{ height: '32px', fontSize: '10px' }}
                          onClick={() => onSelectOrder(order.id)}
                        >
                          Ficha y repuestos
                        </button>
                        <button
                          type="button"
                          className="button whatsapp"
                          style={{ height: '32px', fontSize: '10px', marginLeft: 'auto' }}
                          onClick={() => onOpenWhatsAppForOrder(order)}
                        >
                          <MessageCircle /> WhatsApp al cliente
                        </button>
                      </div>
                    </article>
                  )
                })}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
