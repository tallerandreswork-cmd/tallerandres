'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Bike,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Edit3,
  Filter,
  KeyRound,
  MessageCircle,
  PackageCheck,
  PlusCircle,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import {
  type Order,
  type WorkshopSettings,
  type ClientPinStrategy,
  generateSmartClientPin,
  generateSecure4DigitPin,
  buildWhatsAppUrl,
  calculateBikeHealthScore,
  calculateOrderTotal,
  formatCLP,
  getDefaultHealthCheck,
  getDefaultIntakeChecklist,
  openPrintableOfficialReceipt,
} from '@/lib/workshop-data'

export function AdminClientBackupPanel({
  orders,
  settings,
  onSelectOrderToEdit,
  onOpenClientMirror,
  onOpenWhatsApp,
  onCreateClientAccount,
  onUpdateClientPin,
  onToast,
}: {
  orders: Order[]
  settings: WorkshopSettings
  onSelectOrderToEdit: (orderId: string) => void
  onOpenClientMirror: (order: Order) => void
  onOpenWhatsApp: (order: Order) => void
  onCreateClientAccount?: (newOrder: Order) => void
  onUpdateClientPin?: (orderId: string, newPin: string) => void
  onToast: (msg: string) => void
}) {
  const [selectedBackupOrderId, setSelectedBackupOrderId] = useState<string>(
    orders[0]?.id ?? 'OT-2048'
  )

  // Estados para creación rápida de cuenta de cliente
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [pinStrategy, setPinStrategy] = useState<ClientPinStrategy>('phone_last4')
  const [newClientForm, setNewClientForm] = useState({
    client: '',
    phone: '+591 ',
    plate: '',
    bike: '',
    clientNitOrCi: '',
    pin: '4821',
    service: 'Mantenimiento Preventivo y Diagnóstico',
    mechanic: settings.mechanics[0] || 'Marco Ríos',
  })
  const [justCreatedAccount, setJustCreatedAccount] = useState<{
    client: string
    plate: string
    pin: string
    phone: string
    bike: string
  } | null>(null)

  // Estado para edición inline del PIN del cliente seleccionado
  const [isEditingPin, setIsEditingPin] = useState(false)
  const [pinEditValue, setPinEditValue] = useState('')

  const backupOrder = useMemo(
    () => orders.find((o) => o.id === selectedBackupOrderId) ?? orders[0] ?? null,
    [orders, selectedBackupOrderId]
  )

  const totalCurrentReplacedParts = useMemo(
    () => orders.reduce((acc, o) => acc + o.replacedParts.length, 0),
    [orders]
  )

  const totalHistoricalDiagnoses = useMemo(
    () => orders.reduce((acc, o) => acc + 1 + o.history.length, 0),
    [orders]
  )

  const totalOldPartsSavedForClient = useMemo(
    () =>
      orders.reduce(
        (acc, o) => acc + o.replacedParts.filter((p) => p.oldPartReturnedToClient).length,
        0
      ),
    [orders]
  )

  const chk = backupOrder?.intakeChecklist ?? getDefaultIntakeChecklist()

  // Manejo de guardado de nueva cuenta
  const handleCreateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClientForm.client.trim()) {
      onToast('Ingresa el nombre del cliente')
      return
    }
    if (!newClientForm.plate.trim()) {
      onToast('Ingresa la placa de la motocicleta')
      return
    }

    const newId = `OT-${Math.floor(2050 + Math.random() * 1000)}`
    const plateCode = newClientForm.plate.trim().toUpperCase()
    const cleanPin = newClientForm.pin.trim() || '1234'
    const serviceText = newClientForm.service.trim() || 'Mantenimiento y Diagnóstico'

    const newOrder: Order = {
      id: newId,
      bike: newClientForm.bike.trim() || 'Motocicleta en Taller',
      plate: plateCode,
      client: newClientForm.client.trim(),
      clientNitOrCi: cleanPin,
      phone: newClientForm.phone.trim(),
      email: '',
      service: serviceText,
      diagnosis: 'Recepción inicial: motocicleta ingresada para revisión y diagnóstico en bahía.',
      mileage: '12.000 km',
      fuelLevel: '1/2 tanque',
      mechanic: newClientForm.mechanic,
      status: 'Agendado',
      eta: 'En 24 horas',
      createdAt:
        'Hoy, ' +
        new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
      accent: 'green',
      avatar: newClientForm.client.trim().slice(0, 2).toUpperCase(),
      mechanicNote: 'Ingreso confirmado. Pendiente de subir a rampa para inspección multipunto.',
      mechanicNoteUpdatedAt: 'Recién creado',
      quoteItems: [
        {
          id: `q-${Date.now()}`,
          description: serviceText,
          amount: settings.defaultLaborRate || 280,
        },
      ],
      quoteApproved: false,
      paid: false,
      photosCount: 0,
      timeline: {
        Agendado: 'Hoy',
        'En diagnóstico': 'Pendiente',
        'En reparación': 'Pendiente',
        'Listo para entrega': 'Pendiente',
      },
      intakeChecklist: getDefaultIntakeChecklist(),
      replacedParts: [],
      healthCheck: getDefaultHealthCheck(serviceText),
      nextServiceKm: 'En 5.000 km',
      history: [],
      whatsappLogs: [],
    }

    if (onCreateClientAccount) {
      onCreateClientAccount(newOrder)
    }

    setSelectedBackupOrderId(newId)
    setShowCreateModal(false)
    setJustCreatedAccount({
      client: newOrder.client,
      plate: newOrder.plate,
      pin: cleanPin,
      phone: newOrder.phone,
      bike: newOrder.bike,
    })
    onToast(`¡Cuenta de ${newOrder.client} creada con éxito!`)
  }

  return (
    <section className="panel admin-backup-panel">
      {/* ENCABEZADO Y PROPÓSITO DEL MÓDULO */}
      <div
        className="panel-heading"
        style={{
          borderBottom: '1px solid #edf0f3',
          paddingBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span className="finance-kicker">EXPEDIENTES & AUDITORÍA TÉCNICA · FIDELIZACIÓN DE CLIENTES</span>
          <h2>Expedientes Técnicos, Garantías y Actas Anti-Reclamos</h2>
          <p>
            Historial clínico de diagnósticos por motocicleta, actas de recepción con inventario físico (casco, SOAT/RUAT, rayones previos),
            custodia de repuestos usados y emisión de certificados técnicos oficiales.
          </p>
        </div>

        <button
          type="button"
          className="button primary"
          style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
          onClick={() => {
            setPinStrategy('phone_last4')
            setNewClientForm({
              client: '',
              phone: '+591 ',
              plate: '',
              bike: '',
              clientNitOrCi: '',
              pin: generateSecure4DigitPin(),
              service: 'Mantenimiento Preventivo y Diagnóstico',
              mechanic: settings.mechanics[0] || 'Marco Ríos',
            })
            setShowCreateModal(true)
          }}
        >
          <UserPlus style={{ width: '16px' }} /> + Crear Cuenta de Cliente
        </button>
      </div>

      {/* MÉTRICAS DE RESPALDO TÉCNICO */}
      <div className="backup-kpi-strip">
        <div className="backup-kpi-box">
          <span>Expedientes clínicos respaldados</span>
          <strong>{totalHistoricalDiagnoses} diagnósticos</strong>
          <small>{orders.length} motos activas + historial previo</small>
        </div>
        <div className="backup-kpi-box">
          <span>Piezas cambiadas con SKU</span>
          <strong>{totalCurrentReplacedParts} repuestos</strong>
          <small>Trazabilidad de mecánico y garantía</small>
        </div>
        <div className="backup-kpi-box">
          <span>Piezas viejas en custodia</span>
          <strong style={{ color: '#178b44' }}>{totalOldPartsSavedForClient} en caja</strong>
          <small>Listas para mostrar al cliente en entrega</small>
        </div>
        <div className="backup-kpi-box">
          <span>Salud de Motos de Clientes</span>
          <strong style={{ color: '#16a34a' }}>98% Aprobado</strong>
          <small>Inspección multipunto de 6 sistemas activa</small>
        </div>
      </div>

      {/* SELECTOR DE CLIENTE / MOTOCICLETA (ORDENADO Y DESPLEGABLE CUANDO SON MÁS DE 2) */}
      {orders.length === 0 ? (
        <div className="empty-state" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <Bike style={{ width: '38px', height: '38px', color: '#94a3b8', margin: '0 auto 10px' }} />
          <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
            No hay clientes ni órdenes activas registradas en taller
          </strong>
          <p style={{ fontSize: '11px', color: '#64748b', maxWidth: '380px', margin: '4px auto 0' }}>
            Registra una orden desde Recepción para auditar su expediente técnico, piezas cambiadas y garantías.
          </p>
        </div>
      ) : (
        <div
          className="filter-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '10px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontWeight: 700,
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
              }}
            >
              <Users style={{ width: '14px', color: '#2563eb' }} />
              Inspeccionar respaldo de cliente:
            </span>

            {orders.length <= 2 ? (
              orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`filter-chip ${backupOrder?.id === o.id ? 'active' : ''}`}
                  onClick={() => setSelectedBackupOrderId(o.id)}
                >
                  {o.client} · {o.bike} ({o.plate})
                </button>
              ))
            ) : (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select
                  aria-label="Seleccionar cliente para inspeccionar respaldo"
                  value={backupOrder?.id ?? ''}
                  onChange={(e) => setSelectedBackupOrderId(e.target.value)}
                  style={{
                    height: '32px',
                    padding: '0 28px 0 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#ffffff',
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.client} — {o.bike} ({o.plate})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  style={{
                    width: '14px',
                    height: '14px',
                    color: '#64748b',
                    position: 'absolute',
                    right: '10px',
                    pointerEvents: 'none',
                    top: '9px',
                  }}
                />
              </div>
            )}
          </div>

          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {backupOrder ? (
              <>
                Auditoría activa: <strong>{backupOrder.client}</strong> ({orders.length} en taller)
              </>
            ) : null}
          </span>
        </div>
      )}

      {/* DETALLE ESPEJO DEL RESPALDO DEL CLIENTE SELECCIONADO */}
      {backupOrder && (
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span className="order-id">
                RESPALDO SINCRONIZADO · ORDEN {backupOrder.id} · MECÁNICO:{' '}
                {backupOrder.mechanic.toUpperCase()}
              </span>
              <h3 style={{ margin: '3px 0', fontSize: '15px' }}>
                {backupOrder.client} (CI/NIT: {backupOrder.clientNitOrCi || 'S/N'}) —{' '}
                {backupOrder.bike} <span className="plate-chip">{backupOrder.plate}</span>
              </h3>
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                Recepción: {backupOrder.createdAt} · Odómetro: {backupOrder.mileage || '15.000 km'} ·
                Combustible: {backupOrder.fuelLevel || '1/2 tanque'} · Salud multipunto:{' '}
                <strong>{calculateBikeHealthScore(backupOrder)}%</strong>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => openPrintableOfficialReceipt(backupOrder, settings)}
              >
                <Printer /> Imprimir Nota Oficial
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => onSelectOrderToEdit(backupOrder.id)}
              >
                <Wrench /> Editar Diagnóstico / Piezas
              </button>
              <button
                type="button"
                className="button whatsapp"
                onClick={() => onOpenWhatsApp(backupOrder)}
              >
                <MessageCircle /> Enviar Respaldo WhatsApp
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => onOpenClientMirror(backupOrder)}
              >
                Ver como Cliente <ArrowUpRight />
              </button>
            </div>
          </div>

          {/* TARJETA DE CREDENCIALES Y CUENTA DEL CLIENTE (SIN GMAIL) */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
              border: '1px solid #86efac',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound style={{ width: '18px', height: '18px', color: '#16a34a' }} />
                <div>
                  <strong style={{ fontSize: '13px', color: '#14532d' }}>
                    Cuenta y Acceso para el Cliente (Sin necesidad de Gmail)
                  </strong>
                  <p style={{ margin: 0, fontSize: '11px', color: '#15803d' }}>
                    Pasa estas credenciales a tu cliente para que entre directo a ver el estado de su motocicleta.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button primary"
                  style={{
                    background: '#16a34a',
                    borderColor: '#16a34a',
                    fontSize: '11px',
                    height: '34px',
                  }}
                  onClick={() => {
                    const clientPin =
                      backupOrder.clientPin ||
                      (backupOrder.clientNitOrCi
                        ? backupOrder.clientNitOrCi.split(' ')[0]
                        : '1234')
                    const origin = typeof window !== 'undefined' ? window.location.origin : ''
                    const magicLink = `${origin}/?placa=${encodeURIComponent(backupOrder.plate)}&pin=${encodeURIComponent(clientPin)}`
                    const rawPhoneDigits = (backupOrder.phone || '').replace(/\D/g, '')
                    const isPhoneLast4 = rawPhoneDigits.length >= 4 && clientPin === rawPhoneDigits.slice(-4)
                    const pinNotice = isPhoneLast4 ? `${clientPin} (Últimos 4 dígitos de tu celular)` : clientPin

                    const msg = `Hola ${backupOrder.client.split(' ')[0]} 👋, te saludamos de ${settings.workshopName}.\n\nTu motocicleta *${backupOrder.bike}* (Placa: *${backupOrder.plate}*) está siendo atendida en nuestro taller.\n\nPuedes consultar el diagnóstico, avances en vivo y cotización en nuestro portal:\n🔗 ${magicLink}\n\n👤 *Usuario / Placa:* ${backupOrder.plate}\n🔑 *PIN de Acceso:* ${pinNotice}\n\nCualquier duda quedamos a tu entera disposición.`
                    const url = buildWhatsAppUrl(backupOrder.phone, msg)
                    window.open(url, '_blank', 'noopener,noreferrer')
                    onToast(`Mensaje con credenciales preparado para WhatsApp de ${backupOrder.client}`)
                  }}
                >
                  <MessageCircle style={{ width: '14px' }} /> Enviar Cuenta por WhatsApp
                </button>

                <button
                  type="button"
                  className="button secondary"
                  style={{ fontSize: '11px', height: '34px' }}
                  onClick={() => {
                    const clientPin =
                      backupOrder.clientPin ||
                      (backupOrder.clientNitOrCi
                        ? backupOrder.clientNitOrCi.split(' ')[0]
                        : '1234')
                    const origin = typeof window !== 'undefined' ? window.location.origin : ''
                    const magicLink = `${origin}/?placa=${encodeURIComponent(backupOrder.plate)}&pin=${encodeURIComponent(clientPin)}`
                    const text = `Acceso al taller ${settings.workshopName}:\nPortal: ${magicLink}\nUsuario: ${backupOrder.plate}\nPIN: ${clientPin}`
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(text)
                    }
                    onToast('Credenciales copiadas al portapapeles')
                  }}
                >
                  <Copy style={{ width: '13px' }} /> Copiar Credenciales
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                background: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Usuario de Acceso
                </span>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#0f172a',
                    fontFamily: 'monospace',
                  }}
                >
                  {backupOrder.plate}
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                    }}
                  >
                    PIN / Contraseña
                  </span>
                  {!isEditingPin ? (
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '10px',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                      onClick={() => {
                        setPinEditValue(
                          backupOrder.clientPin ||
                            (backupOrder.clientNitOrCi
                              ? backupOrder.clientNitOrCi.split(' ')[0]
                              : '1234')
                        )
                        setIsEditingPin(true)
                      }}
                    >
                      <Edit3 style={{ width: '10px' }} /> Cambiar
                    </button>
                  ) : null}
                </div>

                {!isEditingPin ? (
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: '#15803d',
                      fontFamily: 'monospace',
                    }}
                  >
                    {backupOrder.clientPin ||
                      (backupOrder.clientNitOrCi
                        ? backupOrder.clientNitOrCi.split(' ')[0]
                        : '1234')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={pinEditValue}
                        onChange={(e) => setPinEditValue(e.target.value)}
                        style={{
                          height: '28px',
                          width: '90px',
                          fontSize: '13px',
                          fontWeight: 800,
                          padding: '0 8px',
                          fontFamily: 'monospace',
                        }}
                      />
                      <button
                        type="button"
                        className="button primary"
                        style={{
                          height: '28px',
                          padding: '0 10px',
                          fontSize: '11px',
                          background: '#16a34a',
                          borderColor: '#16a34a',
                        }}
                        onClick={() => {
                          const newPin = pinEditValue.trim() || '1234'
                          if (onUpdateClientPin) {
                            onUpdateClientPin(backupOrder.id, newPin)
                          }
                          setIsEditingPin(false)
                          onToast(`PIN de acceso actualizado a "${newPin}"`)
                        }}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className="button secondary"
                        style={{ height: '28px', padding: '0 6px', fontSize: '11px' }}
                        onClick={() => setIsEditingPin(false)}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className="button secondary"
                        style={{ fontSize: '10px', height: '22px', padding: '0 6px' }}
                        title="Tomar últimos 4 dígitos del WhatsApp"
                        onClick={() => {
                          const gen = generateSmartClientPin({
                            phone: backupOrder.phone,
                            strategy: 'phone_last4',
                          })
                          setPinEditValue(gen.pin)
                        }}
                      >
                        📱 4 Celular
                      </button>
                      <button
                        type="button"
                        className="button secondary"
                        style={{ fontSize: '10px', height: '22px', padding: '0 6px' }}
                        title="Generar PIN aleatorio seguro"
                        onClick={() => {
                          const gen = generateSmartClientPin({ strategy: 'random_secure' })
                          setPinEditValue(gen.pin)
                        }}
                      >
                        🎲 Aleatorio
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  WhatsApp del Cliente
                </span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {backupOrder.phone}
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Enlace Directo 1-Clic
                </span>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#2563eb',
                    textDecoration: 'underline',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ?placa={backupOrder.plate}
                </div>
              </div>
            </div>
          </div>

          {/* ACTA DE RECEPCIÓN FÍSICA / INVENTARIO ANTI-RECLAMOS RESPALDADO */}
          <div
            style={{
              background: '#fcfdfe',
              border: '1px solid #cbd5e1',
              borderRadius: '9px',
              padding: '10px 14px',
              fontSize: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <strong>
                🛡️ Acta de Recepción Física / Inventario de Ingreso (Anti-Reclamos):
              </strong>
              <span
                className="intake-badge"
                style={{
                  background: chk.clientConformitySigned ? '#e9f8f0' : '#fff3e8',
                  color: chk.clientConformitySigned ? '#178b44' : '#d96229',
                }}
              >
                {chk.clientConformitySigned
                  ? `✓ Firmada por cliente (${chk.clientConformitySignedAt || 'Confirmado'})`
                  : 'Pendiente firma digital de cliente'}
              </span>
            </div>
            <div className="intake-badges" style={{ marginTop: '6px' }}>
              <span className="intake-badge">Casco: {chk.leftHelmet ? 'SÍ' : 'NO'}</span>
              <span className="intake-badge">Documentos RUAT/SOAT: {chk.leftDocuments ? 'SÍ' : 'NO'}</span>
              <span className="intake-badge">Llave: {chk.leftKeys ? 'SÍ' : 'NO'}</span>
              <span className="intake-badge">Herramientas/Alforjas: {chk.leftToolsOrBag ? 'SÍ' : 'NO'}</span>
              <span style={{ color: '#475569' }}>
                <strong>Estética ingreso:</strong> “{chk.aestheticNotes}”
              </span>
            </div>
          </div>

          {/* 1. DIAGNÓSTICO Y AVANCE QUE SE MUESTRA AL CLIENTE */}
          <div className="client-diagnosis-comparison" style={{ margin: 0 }}>
            <div className="diagnosis-box">
              <strong>
                1. Diagnóstico de ingreso respaldado ({backupOrder.createdAt}):
              </strong>
              <span>“{backupOrder.diagnosis}”</span>
            </div>
            <div className="work-progress-box">
              <strong>
                2. Nota técnica visible en vivo para el cliente ({backupOrder.mechanic}):
              </strong>
              <span>
                <u>{backupOrder.service}:</u> “{backupOrder.mechanicNote}” (Actualizado{' '}
                {backupOrder.mechanicNoteUpdatedAt})
              </span>
            </div>
          </div>

          {/* 2. TABLA DE PIEZAS CAMBIADAS POR EL MECÁNICO */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <strong style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PackageCheck style={{ width: '15px', color: 'var(--orange)' }} /> Piezas cambiadas por el mecánico y mostradas al cliente ({backupOrder.replacedParts.length})
              </strong>
            </div>

            {backupOrder.replacedParts.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '7px',
                  fontSize: '11px',
                  color: '#64748b',
                  textAlign: 'center',
                }}
              >
                No hay piezas cambiadas registradas en esta orden todavía.
              </div>
            ) : (
              <div className="table-wrapper" style={{ margin: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Repuesto Instalado</th>
                      <th>Código OEM</th>
                      <th>Categoría</th>
                      <th>Mecánico</th>
                      <th>Caja Pieza Vieja</th>
                      <th>Garantía</th>
                      <th>Precio (Bs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backupOrder.replacedParts.map((part) => (
                      <tr key={part.id}>
                        <td>
                          <strong>{part.partName}</strong>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>{part.brand}</div>
                        </td>
                        <td>
                          <code style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 5px', borderRadius: '4px' }}>
                            {part.partCode}
                          </code>
                        </td>
                        <td>{part.systemCategory}</td>
                        <td>{part.installedBy}</td>
                        <td>
                          {part.oldPartReturnedToClient ? (
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Guardada en caja</span>
                          ) : (
                            <span style={{ color: '#64748b' }}>Descartada</span>
                          )}
                        </td>
                        <td>{part.warrantyMonths} meses</td>
                        <td>
                          <strong>{formatCLP(part.unitCost)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CREAR CUENTA DE CLIENTE (FÁCIL E INTUITIVO) */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(620px, 100%)' }}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow" style={{ color: '#16a34a' }}>
                  NUEVO REGISTRO SIN GMAIL
                </span>
                <h2>Crear Cuenta de Cliente y Registrar Moto</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowCreateModal(false)}
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleCreateClientSubmit}>
              <div className="form-grid">
                <label>
                  Nombre completo del cliente *
                  <input
                    required
                    autoFocus
                    placeholder="ej. Pedro Vargas"
                    value={newClientForm.client}
                    onChange={(e) =>
                      setNewClientForm((prev) => ({ ...prev, client: e.target.value }))
                    }
                  />
                </label>

                <label>
                  Celular WhatsApp *
                  <input
                    required
                    placeholder="+591 7890 1234"
                    value={newClientForm.phone}
                    onChange={(e) => {
                      const val = e.target.value
                      setNewClientForm((prev) => {
                        let nextPin = prev.pin
                        if (pinStrategy === 'phone_last4') {
                          const digits = val.replace(/\D/g, '')
                          if (digits.length >= 4) {
                            nextPin = digits.slice(-4)
                          }
                        }
                        return { ...prev, phone: val, pin: nextPin }
                      })
                    }}
                  />
                </label>

                <label>
                  Placa de la motocicleta (Usuario) *
                  <input
                    required
                    placeholder="ABC-55X"
                    value={newClientForm.plate}
                    onChange={(e) =>
                      setNewClientForm((prev) => ({
                        ...prev,
                        plate: e.target.value.toUpperCase(),
                      }))
                    }
                    style={{ letterSpacing: '0.05em', fontWeight: 700 }}
                  />
                </label>

                <label>
                  Marca / Modelo de la moto *
                  <input
                    required
                    placeholder="ej. Honda XR 190L"
                    value={newClientForm.bike}
                    onChange={(e) =>
                      setNewClientForm((prev) => ({ ...prev, bike: e.target.value }))
                    }
                  />
                </label>

                <label>
                  C.I. / NIT (Opcional)
                  <input
                    placeholder="ej. 7492011 SC"
                    value={newClientForm.clientNitOrCi}
                    onChange={(e) => {
                      const val = e.target.value
                      setNewClientForm((prev) => {
                        let nextPin = prev.pin
                        if (pinStrategy === 'ci_last4') {
                          const digits = val.replace(/\D/g, '')
                          if (digits.length >= 4) {
                            nextPin = digits.slice(-4)
                          }
                        }
                        return { ...prev, clientNitOrCi: val, pin: nextPin }
                      })
                    }}
                  />
                </label>

                <div className="full-field" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0, fontWeight: 700, fontSize: '12px', color: '#166534' }}>
                      🔑 Contraseña / PIN de Acceso para el Cliente *
                    </label>
                    <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                      {pinStrategy === 'phone_last4'
                        ? '📱 Últimos 4 de WhatsApp'
                        : pinStrategy === 'ci_last4'
                        ? '🪪 Últimos 4 de CI'
                        : pinStrategy === 'random_secure'
                        ? '🎲 PIN Seguro'
                        : '✍️ Personalizado'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      required
                      placeholder="ej. 1234"
                      value={newClientForm.pin}
                      onChange={(e) => {
                        setPinStrategy('custom')
                        setNewClientForm((prev) => ({ ...prev, pin: e.target.value }))
                      }}
                      style={{
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        letterSpacing: '0.12em',
                        fontSize: '15px',
                        width: '140px',
                        background: '#ffffff',
                      }}
                    />

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={`button ${pinStrategy === 'phone_last4' ? 'primary' : 'secondary'}`}
                        style={{
                          fontSize: '11px',
                          height: '32px',
                          padding: '0 10px',
                          background: pinStrategy === 'phone_last4' ? '#16a34a' : undefined,
                          borderColor: pinStrategy === 'phone_last4' ? '#16a34a' : undefined,
                        }}
                        title="Asignar los últimos 4 dígitos del celular"
                        onClick={() => {
                          setPinStrategy('phone_last4')
                          const gen = generateSmartClientPin({
                            phone: newClientForm.phone,
                            nitOrCi: newClientForm.clientNitOrCi,
                            strategy: 'phone_last4',
                          })
                          setNewClientForm((prev) => ({ ...prev, pin: gen.pin }))
                        }}
                      >
                        📱 Últimos 4 del Celular
                      </button>

                      <button
                        type="button"
                        className={`button ${pinStrategy === 'ci_last4' ? 'primary' : 'secondary'}`}
                        style={{
                          fontSize: '11px',
                          height: '32px',
                          padding: '0 10px',
                          background: pinStrategy === 'ci_last4' ? '#0284c7' : undefined,
                          borderColor: pinStrategy === 'ci_last4' ? '#0284c7' : undefined,
                        }}
                        title="Asignar los últimos 4 dígitos del carnet o NIT"
                        onClick={() => {
                          setPinStrategy('ci_last4')
                          const gen = generateSmartClientPin({
                            phone: newClientForm.phone,
                            nitOrCi: newClientForm.clientNitOrCi,
                            strategy: 'ci_last4',
                          })
                          setNewClientForm((prev) => ({ ...prev, pin: gen.pin }))
                        }}
                      >
                        🪪 Últimos 4 del CI
                      </button>

                      <button
                        type="button"
                        className={`button ${pinStrategy === 'random_secure' ? 'primary' : 'secondary'}`}
                        style={{
                          fontSize: '11px',
                          height: '32px',
                          padding: '0 10px',
                          background: pinStrategy === 'random_secure' ? '#7c3aed' : undefined,
                          borderColor: pinStrategy === 'random_secure' ? '#7c3aed' : undefined,
                        }}
                        title="Generar un PIN de 4 dígitos aleatorio no secuencial"
                        onClick={() => {
                          setPinStrategy('random_secure')
                          const gen = generateSmartClientPin({ strategy: 'random_secure' })
                          setNewClientForm((prev) => ({ ...prev, pin: gen.pin }))
                        }}
                      >
                        🎲 Aleatorio Seguro
                      </button>
                    </div>
                  </div>

                  <small style={{ fontSize: '11px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <CheckCircle2 style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                    {pinStrategy === 'phone_last4'
                      ? 'Recomendado: El cliente nunca olvidará su contraseña porque son los últimos 4 dígitos de su propio WhatsApp.'
                      : pinStrategy === 'ci_last4'
                      ? 'El cliente accederá con los últimos 4 números de su carnet de identidad o NIT.'
                      : pinStrategy === 'random_secure'
                      ? 'PIN seguro de 4 dígitos generado aleatoriamente descartando secuencias obvias.'
                      : 'PIN manual personalizado por el taller.'}
                  </small>
                </div>

                <label className="full-field">
                  Servicio inicial / Motivo de ingreso
                  <input
                    placeholder="ej. Mantenimiento Preventivo y Calibración"
                    value={newClientForm.service}
                    onChange={(e) =>
                      setNewClientForm((prev) => ({ ...prev, service: e.target.value }))
                    }
                  />
                </label>

                <label className="full-field">
                  Mecánico de taller asignado
                  <select
                    value={newClientForm.mechanic}
                    onChange={(e) =>
                      setNewClientForm((prev) => ({ ...prev, mechanic: e.target.value }))
                    }
                  >
                    {settings.mechanics.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button primary"
                  style={{ background: '#16a34a', borderColor: '#16a34a' }}
                >
                  <UserPlus style={{ width: '14px' }} /> Crear Cuenta y Generar Acceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMACIÓN Y COMPARTIR CREDENCIALES POR WHATSAPP */}
      {justCreatedAccount && (
        <div className="modal-backdrop" onClick={() => setJustCreatedAccount(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(520px, 100%)', textAlign: 'center', padding: '24px 22px' }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                background: '#dcfce7',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 12px',
              }}
            >
              <Check style={{ width: '28px', height: '28px', color: '#16a34a' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
              ¡Cuenta Creada Exitosamente!
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 18px' }}>
              La motocicleta <strong>{justCreatedAccount.bike}</strong> y su expediente técnico ya están activos.
              Comparte ahora las credenciales de acceso con tu cliente:
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '14px 18px',
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Cliente
                </span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {justCreatedAccount.client}
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  WhatsApp
                </span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {justCreatedAccount.phone}
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Usuario (Placa)
                </span>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#0f172a',
                    fontFamily: 'monospace',
                  }}
                >
                  {justCreatedAccount.plate}
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  PIN de Acceso
                </span>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#16a34a',
                    fontFamily: 'monospace',
                  }}
                >
                  {justCreatedAccount.pin}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="button primary"
                style={{
                  height: '42px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: '#16a34a',
                  borderColor: '#16a34a',
                  justifyContent: 'center',
                }}
                onClick={() => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : ''
                  const magicLink = `${origin}/?placa=${encodeURIComponent(justCreatedAccount.plate)}&pin=${encodeURIComponent(justCreatedAccount.pin)}`
                  const rawPhoneDigits = (justCreatedAccount.phone || '').replace(/\D/g, '')
                  const isPhoneLast4 = rawPhoneDigits.length >= 4 && justCreatedAccount.pin === rawPhoneDigits.slice(-4)
                  const pinNotice = isPhoneLast4 ? `${justCreatedAccount.pin} (Últimos 4 dígitos de tu celular)` : justCreatedAccount.pin

                  const msg = `Hola ${justCreatedAccount.client.split(' ')[0]} 👋, te saludamos de ${settings.workshopName}.\n\nTu motocicleta *${justCreatedAccount.bike}* (Placa: *${justCreatedAccount.plate}*) ya fue registrada en nuestro taller.\n\nPuedes consultar el diagnóstico, avances en rampa y cotización en nuestro portal:\n🔗 ${magicLink}\n\n👤 *Usuario / Placa:* ${justCreatedAccount.plate}\n🔑 *PIN de Acceso:* ${pinNotice}\n\nCualquier duda quedamos a tu disposición.`
                  const url = buildWhatsAppUrl(justCreatedAccount.phone, msg)
                  window.open(url, '_blank', 'noopener,noreferrer')
                  onToast(`WhatsApp enviado a ${justCreatedAccount.client}`)
                }}
              >
                <MessageCircle style={{ width: '16px' }} /> 📲 Enviar Cuenta y Acceso por WhatsApp
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="button secondary"
                  style={{ flex: 1, height: '36px', fontSize: '11px', justifyContent: 'center' }}
                  onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : ''
                    const magicLink = `${origin}/?placa=${encodeURIComponent(justCreatedAccount.plate)}&pin=${encodeURIComponent(justCreatedAccount.pin)}`
                    const text = `Acceso al taller ${settings.workshopName}:\nPortal: ${magicLink}\nUsuario: ${justCreatedAccount.plate}\nPIN: ${justCreatedAccount.pin}`
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(text)
                    }
                    onToast('Credenciales copiadas al portapapeles')
                  }}
                >
                  <Copy style={{ width: '13px' }} /> Copiar Credenciales
                </button>

                <button
                  type="button"
                  className="button secondary"
                  style={{ flex: 1, height: '36px', fontSize: '11px', justifyContent: 'center' }}
                  onClick={() => setJustCreatedAccount(null)}
                >
                  Listo / Ver Expediente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
