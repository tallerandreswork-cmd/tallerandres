'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Bike,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Copy,
  Download,
  FileText,
  Filter,
  Gauge,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Package,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { AdminClientBackupPanel } from '@/components/workshop/admin-client-backup'
import { InventoryKardexPanel } from '@/components/workshop/inventory-kardex'
import { ClientPortal } from '@/components/workshop/client-portal'
import { DashboardIntelligenceSection } from '@/components/workshop/dashboard-intelligence'
import {
  FinanceAnalyticsModule,
  type FinanceSubTab,
} from '@/components/workshop/finance-analytics'
import { LoginGateway } from '@/components/workshop/login-gateway'
import { MechanicWorkspace } from '@/components/workshop/mechanic-workspace'
import { SupabaseIntegrationPanel } from '@/components/workshop/supabase-integration'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import {
  deleteInventoryItemFromSupabase,
  deleteTransactionFromSupabase,
  fetchWorkshopDataFromSupabase,
  saveActivityToSupabase,
  saveInventoryItemToSupabase,
  saveOrderToSupabase,
  saveTransactionToSupabase,
  subscribeToWorkshopRealtime,
  updateOrderStatusInSupabase,
} from '@/lib/supabase/service'
import {
  ALL_STATUSES,
  MONTHLY_CHART_DATA,
  PART_SYSTEM_CATEGORIES,
  PAYMENT_METHODS,
  QUICK_EXPENSE_PRESETS,
  STATUS_FLOW,
  STATUS_META,
  TRANSACTION_CATEGORIES,
  type AccentTone,
  type ActivityItem,
  type AuthSession,
  type FinanceTransaction,
  type InventoryItem,
  type Order,
  type OrderStatus,
  type PartSystemCategory,
  type PaymentMethod,
  type PaymentStatus,
  type ReplacedPartItem,
  type TransactionCategory,
  type WhatsAppTemplateType,
  type WorkshopSettings,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  calculateExpenseBreakdown,
  calculateOrderTotal,
  deductInventoryForReplacedPart,
  defaultSettings,
  formatCLP,
  formatCompactCLP,
  getDefaultHealthCheck,
  getDefaultIntakeChecklist,
  getInitials,
  getNextStatus,
  getOrdersForMechanic,
  getPrevStatus,
  generateSmartClientPin,
  isClientPinValid,
  initialActivitiesData,
  initialInventoryData,
  initialOrdersData,
  initialTransactionsData,
  openPrintableOfficialReceipt,
} from '@/lib/workshop-data'

const STORAGE_KEY = 'motolab_workshop_state_v7'

const columns: { name: string; key: OrderStatus; tone: string }[] = [
  { name: 'Agendado', key: 'Agendado', tone: 'muted' },
  { name: 'En diagnóstico', key: 'En diagnóstico', tone: 'blue' },
  { name: 'En reparación', key: 'En reparación', tone: 'orange' },
  { name: 'Listo para entrega', key: 'Listo para entrega', tone: 'green' },
]

const PERIODS = ['Este mes', 'Esta semana', 'Hoy', 'Todo el año'] as const

const WHATSAPP_TEMPLATES: { key: WhatsAppTemplateType; label: string; badge: string }[] = [
  {
    key: 'diagnostico_ingreso',
    label: 'Diagnóstico de ingreso + Cotización',
    badge: 'Ingreso',
  },
  {
    key: 'avance_reparacion',
    label: 'Nota de lo que se le está haciendo',
    badge: 'En taller',
  },
  {
    key: 'lista_entrega',
    label: 'Aviso: Moto lista para retiro',
    badge: 'Entrega',
  },
  {
    key: 'recordatorio_mantenimiento',
    label: 'Recordatorio de mantenimiento / seguimiento',
    badge: 'Recordatorio',
  },
  {
    key: 'cobro_orden',
    label: 'Liquidación y Cobro de Reparación (Bs)',
    badge: 'Cobro',
  },
]

export function StatusBadge({
  status,
  onClick,
}: {
  status: string
  onClick?: () => void
}) {
  const cls =
    status === 'En reparación' || status === 'Pendiente de pago'
      ? 'status-orange'
      : status === 'En diagnóstico'
        ? 'status-blue'
        : status === 'Listo para entrega' || status === 'Entregado' || status === 'Pagado'
          ? 'status-green'
          : 'status-muted'
  return (
    <span
      className={`status-badge ${cls}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      title={onClick ? 'Clic para cambiar estado' : undefined}
    >
      <span className="status-dot" />
      {status}
    </span>
  )
}

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string
  value: string
  change: string
  icon: typeof Gauge
  tone: string
  onClick?: () => void
}) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      title={onClick ? `Ir a detalle de ${label}` : undefined}
    >
      <div className="stat-card-top">
        <div className={`stat-icon ${tone}`}>
          <Icon />
        </div>
        <span className="stat-change">{change}</span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}

function ActivityIcon({ iconType }: { iconType: ActivityItem['iconType'] }) {
  if (iconType === 'check') return <Check />
  if (iconType === 'image') return <ImagePlus />
  if (iconType === 'dollar') return <CircleDollarSign />
  if (iconType === 'plus') return <Plus />
  if (iconType === 'whatsapp') return <MessageCircle />
  return <Wrench />
}

export default function Page() {
  // Multi-role Auth Session (null = show LoginGateway)
  const [authSession, setAuthSession] = useState<AuthSession | null>(null)

  const [activeNav, setActiveNav] = useState<string>('Resumen')
  const [mechanicTab, setMechanicTab] = useState<'Mi Bahía' | 'Mis Diagnósticos'>('Mi Bahía')
  const [clientTab, setClientTab] = useState<'Consultar orden' | 'Historial'>('Consultar orden')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Core persisted state
  const [orders, setOrders] = useState<Order[]>(initialOrdersData)
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventoryData)
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivitiesData)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(initialTransactionsData)
  const [settings, setSettings] = useState<WorkshopSettings>(defaultSettings)
  const [hydrated, setHydrated] = useState(false)
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(false)
  const [syncingWithSupabase, setSyncingWithSupabase] = useState<boolean>(false)

  // Filters & UI state
  const [search, setSearch] = useState('')
  const [mechanicFilter, setMechanicFilter] = useState<string>('Todos')
  const [showFilterBar, setShowFilterBar] = useState(false)
  const [periodIndex, setPeriodIndex] = useState(0)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(5)
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Client view state
  const [clientQuery, setClientQuery] = useState('KLM-42D')
  const [searchedQuery, setSearchedQuery] = useState('KLM-42D')
  const [searched, setSearched] = useState(true)

  // Modals & specialized panels state
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [ordersTabFilter, setOrdersTabFilter] = useState<string>('Todas')
  const [ordersPaymentFilter, setOrdersPaymentFilter] = useState<'Todos' | 'Por cobrar' | 'Pagada'>('Todos')
  const [clientsFilter, setClientsFilter] = useState<'Todos' | 'En taller' | 'Listas para retiro'>('Todos')

  // Smart WhatsApp composer state
  const [whatsappOrderId, setWhatsappOrderId] = useState<string>('OT-2048')
  const [whatsappTemplate, setWhatsappTemplate] = useState<WhatsAppTemplateType>('avance_reparacion')
  const [customWhatsappMessage, setCustomWhatsappMessage] = useState<string>('')
  const [showWhatsappModal, setShowWhatsappModal] = useState<boolean>(false)

  // Finance filters & complete transaction form state
  const [financeSubTab, setFinanceSubTab] = useState<FinanceSubTab>('analytics')
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('Todas')
  const [txStatusFilter, setTxStatusFilter] = useState<'Todos' | PaymentStatus>('Todos')
  const [txSearch, setTxSearch] = useState<string>('')
  const [editingTxId, setEditingTxId] = useState<string | null>(null)

  const [newTxForm, setNewTxForm] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: 'Repuestos' as TransactionCategory,
    providerOrClient: '',
    paymentMethod: 'QR Simple' as PaymentMethod,
    invoiceOrDoc: '',
    status: 'Pagado' as PaymentStatus,
    date: '14 oct 2024',
    orderId: '',
  })

  // New Order Form controlled state
  const [newOrderForm, setNewOrderForm] = useState({
    client: '',
    clientPin: '',
    pinStrategy: 'phone_last4' as 'phone_last4' | 'ci_last4' | 'random_secure' | 'custom',
    clientNitOrCi: '',
    phone: '',
    bike: '',
    plate: '',
    mileage: '12.500 km',
    fuelLevel: '1/2 tanque',
    service: '',
    date: '2024-10-14',
    eta: 'Mañana, 16:00',
    mechanic: 'Marco Ríos',
    partsAmount: '450',
    laborAmount: '250',
    diagnosis: '',
    leftHelmet: false,
    leftDocuments: true,
    leftKeys: true,
    leftToolsOrBag: false,
    aestheticNotes: 'Motocicleta recepcionada sin abolladuras nuevas.',
  })

  // New mechanic input for Settings
  const [newMechanicName, setNewMechanicName] = useState('')

  // Load from localStorage or Supabase on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.orders) && parsed.orders.length > 0) setOrders(parsed.orders)
        if (Array.isArray(parsed.inventory) && parsed.inventory.length > 0)
          setInventory(parsed.inventory)
        if (Array.isArray(parsed.activities)) setActivities(parsed.activities)
        if (Array.isArray(parsed.transactions)) setTransactions(parsed.transactions)
        if (parsed.settings) setSettings({ ...defaultSettings, ...parsed.settings })
        if (parsed.authSession) setAuthSession(parsed.authSession)
      }
    } catch {
      // fallback to defaults
    } finally {
      setHydrated(true)
    }

    // Check if Supabase credentials are configured
    const online = isSupabaseConfigured()
    setIsSupabaseOnline(online)

    if (online) {
      setSyncingWithSupabase(true)
      fetchWorkshopDataFromSupabase()
        .then((data) => {
          if (data && data.orders.length > 0) {
            setOrders(data.orders)
            if (data.inventory.length > 0) setInventory(data.inventory)
            if (data.transactions.length > 0) setTransactions(data.transactions)
            if (data.activities.length > 0) setActivities(data.activities)
            if (data.settings) setSettings(data.settings)
          }
        })
        .catch((err) => {
          console.warn('Fallback a almacenamiento local tras error Supabase:', err)
        })
        .finally(() => {
          setSyncingWithSupabase(false)
        })

      // Suscripción Realtime en vivo
      const unsubscribe = subscribeToWorkshopRealtime(
        () => {
          fetchWorkshopDataFromSupabase().then((data) => {
            if (data) {
              setOrders(data.orders)
              if (data.inventory.length > 0) setInventory(data.inventory)
              if (data.transactions.length > 0) setTransactions(data.transactions)
            }
          })
        },
        () => {
          fetchWorkshopDataFromSupabase().then((data) => {
            if (data && data.activities.length > 0) {
              setActivities(data.activities)
            }
          })
        }
      )

      return () => {
        unsubscribe()
      }
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ orders, inventory, activities, transactions, settings, authSession })
      )
    } catch {
      // ignore storage errors
    }
  }, [orders, inventory, activities, transactions, settings, authSession, hydrated])

  // Auto-acceso seguro para clientes únicamente con Enlace Mágico firmado (?placa=...&pin=...)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)

    if (params.get('logout') === 'true' || params.get('login') === 'true') {
      setAuthSession(null)
      return
    }

    const placaParam = params.get('placa') || params.get('plate')
    const ordenParam = params.get('orden') || params.get('ot') || params.get('order')
    const pinParam = (params.get('pin') || params.get('clave') || '').trim()
    const query = (placaParam || ordenParam || '').trim().toLowerCase()

    if (query && pinParam && orders.length > 0) {
      const target = orders.find(
        (o) => o.plate.toLowerCase() === query || o.id.toLowerCase() === query
      )
      if (target) {
        const cleanPin = pinParam.toLowerCase().replace(/\s+/g, '')
        const isValidPin = isClientPinValid(cleanPin, target)

        if (isValidPin) {
          setAuthSession({
            role: 'client',
            userName: target.client,
            userSubtitle: `${target.bike} · Placa ${target.plate}`,
            clientPlateOrOrder: target.plate,
          })
          setClientQuery(target.plate)
          setSearchedQuery(target.plate)
          setSearched(true)
          setClientTab('Consultar orden')
          showToast(`Expediente digital verificado de ${target.bike} (${target.plate})`)
        }
      }
    }
  }, [orders, settings])

  const whatsappTargetOrder = useMemo(
    () => orders.find((o) => o.id === whatsappOrderId) ?? orders[0] ?? null,
    [orders, whatsappOrderId]
  )

  useEffect(() => {
    if (!whatsappTargetOrder) return
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const generated = buildWhatsAppMessage(
      whatsappTargetOrder,
      whatsappTemplate,
      settings.workshopName,
      settings.whatsappSignature,
      origin
    )
    setCustomWhatsappMessage(generated)
  }, [whatsappTargetOrder, whatsappTemplate, settings.workshopName, settings.whatsappSignature])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev))
    }, 3400)
  }

  const addActivity = (
    actor: string,
    action: string,
    target: string,
    tone: ActivityItem['tone'] = 'orange',
    iconType: ActivityItem['iconType'] = 'wrench',
    orderId?: string
  ) => {
    const newAct: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tone,
      iconType,
      actor,
      action,
      target,
      orderId,
      time: 'Justo ahora',
      read: false,
    }
    setActivities((prev) => [newAct, ...prev])
    if (isSupabaseConfigured()) {
      saveActivityToSupabase(newAct).catch(() => {})
    }
  }

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session)
    if (session.role === 'client' && session.clientPlateOrOrder) {
      setClientQuery(session.clientPlateOrOrder)
      setSearchedQuery(session.clientPlateOrOrder)
      setSearched(true)
      setClientTab('Consultar orden')
    }
    if (session.role === 'mechanic') {
      setMechanicTab('Mi Bahía')
    }
    if (session.role === 'admin') {
      setActiveNav('Resumen')
    }
    showToast(`Sesión iniciada como ${session.userName}`)
  }

  const openSmartWhatsApp = (
    order: Order,
    preferredTemplate?: WhatsAppTemplateType,
    openModal = true
  ) => {
    const autoTemplate: WhatsAppTemplateType =
      preferredTemplate ??
      (order.status === 'Listo para entrega'
        ? 'lista_entrega'
        : order.status === 'Agendado'
          ? 'diagnostico_ingreso'
          : 'avance_reparacion')

    setWhatsappOrderId(order.id)
    setWhatsappTemplate(autoTemplate)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    setCustomWhatsappMessage(
      buildWhatsAppMessage(
        order,
        autoTemplate,
        settings.workshopName,
        settings.whatsappSignature,
        origin
      )
    )
    if (openModal) {
      setShowWhatsappModal(true)
    }
  }

  const handleSendWhatsApp = (
    order: Order,
    messageText: string,
    templateUsed: WhatsAppTemplateType
  ) => {
    const url = buildWhatsAppUrl(order.phone, messageText)
    window.open(url, '_blank', 'noopener,noreferrer')

    const nowLabel =
      'Hoy · ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const summaryLabel =
      WHATSAPP_TEMPLATES.find((t) => t.key === templateUsed)?.label ?? 'Mensaje de WhatsApp'

    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              whatsappLogs: [
                {
                  id: `wa-${Date.now()}`,
                  sentAt: nowLabel,
                  template: templateUsed,
                  summary: summaryLabel,
                },
                ...(o.whatsappLogs ?? []),
              ],
            }
          : o
      )
    )

    addActivity(
      'WhatsApp',
      `enviado a ${order.client} (${summaryLabel.toLowerCase()}) en`,
      order.id,
      'green',
      'whatsapp',
      order.id
    )
    showToast(`WhatsApp abierto para ${order.client} (${order.phone}) y registrado en historial`)
  }

  const handleActivityClick = (act: ActivityItem) => {
    const matchOrderId =
      act.orderId ||
      (act.target.startsWith('OT-') ? act.target : act.actor.startsWith('OT-') ? act.actor : undefined)
    if (matchOrderId) {
      const exists = orders.find((o) => o.id === matchOrderId)
      if (exists) {
        if (
          authSession?.role === 'mechanic' &&
          exists.mechanic !== authSession.mechanicName
        ) {
          showToast('Esta orden pertenece a otro mecánico')
          return
        }
        setSelectedOrderId(exists.id)
        setShowNotifications(false)
        return
      }
    }
    if (act.iconType === 'dollar' && authSession?.role === 'admin') {
      setActiveNav('Finanzas')
      setShowNotifications(false)
    }
  }

  // Filtered orders for Admin Kanban
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (o.status === 'Entregado') return false
      if (mechanicFilter !== 'Todos' && o.mechanic !== mechanicFilter) return false
      if (!q) return true
      return `${o.id} ${o.bike} ${o.plate} ${o.client} ${o.service} ${o.mechanic} ${o.diagnosis}`
        .toLowerCase()
        .includes(q)
    })
  }, [orders, search, mechanicFilter])

  // Dynamic financial calculations & expense breakdowns
  const financialTotals = useMemo(() => {
    const incomeTxs = transactions.filter((t) => t.type === 'income')
    const expenseTxs = transactions.filter((t) => t.type === 'expense')

    const baseIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0)
    const baseExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0)

    const fixedCategories: TransactionCategory[] = [
      'Arriendo / Fijos',
      'Sueldos y comisiones',
      'Servicios básicos (Luz/Agua/Net)',
      'Impuestos / Contabilidad',
    ]
    const fixedExpenses = expenseTxs
      .filter((t) => fixedCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0)
    const variableExpenses = baseExpense - fixedExpenses

    const pendingExpensesAmount = expenseTxs
      .filter((t) => t.status === 'Pendiente de pago')
      .reduce((sum, t) => sum + t.amount, 0)

    const currentPeriod = PERIODS[periodIndex]
    const multiplier =
      currentPeriod === 'Hoy'
        ? 0.08
        : currentPeriod === 'Esta semana'
          ? 0.28
          : currentPeriod === 'Todo el año'
            ? 8.5
            : 1

    const selectedMonth = MONTHLY_CHART_DATA[selectedMonthIndex]
    const monthRatio = selectedMonthIndex === 5 ? 1 : selectedMonth.baseIncome / 84800

    const income = Math.round(baseIncome * multiplier * monthRatio)
    const expense = Math.round(baseExpense * multiplier * monthRatio)
    const net = income - expense
    const marginPct = income > 0 ? Math.round((net / income) * 100) : 0

    return {
      income,
      expense,
      net,
      marginPct,
      fixedExpenses,
      variableExpenses,
      pendingExpensesAmount,
      incomeCount: incomeTxs.length,
      expenseCount: expenseTxs.length,
      monthLabel: selectedMonth.label,
    }
  }, [transactions, periodIndex, selectedMonthIndex])

  const expenseBreakdown = useMemo(
    () => calculateExpenseBreakdown(transactions),
    [transactions]
  )

  const paymentMethodTotals = useMemo(() => {
    return PAYMENT_METHODS.map((method) => {
      const inc = transactions
        .filter((t) => t.type === 'income' && (t.paymentMethod ?? 'Transferencia') === method)
        .reduce((s, t) => s + t.amount, 0)
      const exp = transactions
        .filter((t) => t.type === 'expense' && (t.paymentMethod ?? 'Transferencia') === method)
        .reduce((s, t) => s + t.amount, 0)
      return { method, inc, exp }
    })
  }, [transactions])

  const financeRows = useMemo(
    () => [
      {
        label: 'Ingresos',
        value: formatCLP(financialTotals.income),
        delta: '+18,4%',
        positive: true,
        icon: ArrowUpRight,
      },
      {
        label: 'Egresos',
        value: formatCLP(financialTotals.expense),
        delta: '+7,2%',
        positive: false,
        icon: ArrowDownRight,
      },
      {
        label: 'Ganancia neta',
        value: formatCLP(financialTotals.net),
        delta: '+24,1%',
        positive: true,
        icon: CircleDollarSign,
      },
    ],
    [financialTotals]
  )

  const activeWorkshopOrders = useMemo(
    () => orders.filter((o) => o.status !== 'Entregado'),
    [orders]
  )
  const readyOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'Listo para entrega').length,
    [orders]
  )
  const unreadNotificationsCount = useMemo(
    () => activities.filter((a) => !a.read).length,
    [activities]
  )

  const handleCollectOrderPayment = (order: Order, method: PaymentMethod = 'QR Simple') => {
    if (order.paid) {
      showToast(`La orden ${order.id} ya figura como pagada`)
      return
    }
    const total = calculateOrderTotal(order)
    const updatedOrder: Order = {
      ...order,
      paid: true,
      paidMethod: method,
      quoteApproved: true,
    }
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)))

    const newTx: FinanceTransaction = {
      id: `fin-${Date.now()}`,
      date: '14 oct 2024',
      month: 'Oct',
      description: `Cobro ${order.id} - ${order.service} (${order.bike})`,
      category: 'Servicio',
      type: 'income',
      amount: total,
      paymentMethod: method,
      status: 'Pagado',
      providerOrClient: order.client,
      invoiceOrDoc: `REC-${Math.floor(4100 + Math.random() * 800)}`,
      orderId: order.id,
    }
    setTransactions((prev) => [newTx, ...prev])

    if (isSupabaseConfigured()) {
      saveOrderToSupabase(updatedOrder).catch(() => {})
      saveTransactionToSupabase(newTx).catch(() => {})
    }
    addActivity(
      settings.adminName.split(' ')[0],
      `registró cobro de ${formatCLP(total)} (${method}) en`,
      order.id,
      'green',
      'dollar',
      order.id
    )
    showToast(`Pago de ${formatCLP(total)} (${method}) registrado para ${order.id}`)
  }

  const handleRevertOrderPayment = (order: Order) => {
    if (!order.paid) return
    const updatedOrder: Order = {
      ...order,
      paid: false,
      paidMethod: undefined,
    }
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)))

    const matchedTx = transactions.find((t) => t.orderId === order.id && t.type === 'income')
    if (matchedTx) {
      setTransactions((prev) => prev.filter((t) => t.id !== matchedTx.id))
      if (isSupabaseConfigured()) {
        deleteTransactionFromSupabase(matchedTx.id).catch(() => {})
      }
    }

    if (isSupabaseConfigured()) {
      saveOrderToSupabase(updatedOrder).catch((err) => {
        console.error('Error al revertir orden en Supabase:', err)
      })
    }

    addActivity(
      settings.adminName.split(' ')[0],
      `marcó como pendiente de cobro la orden`,
      order.id,
      'orange',
      'dollar',
      order.id
    )
    showToast(`Orden ${order.id} marcada nuevamente como pendiente de cobro`)
  }

  const handleSaveTransaction = () => {
    const amt = Number(newTxForm.amount)
    if (!newTxForm.description.trim() || !amt || amt <= 0) {
      showToast('Ingresa una descripción y un monto mayor a 0')
      return
    }

    if (editingTxId) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTxId
            ? {
                ...t,
                description: newTxForm.description.trim(),
                amount: amt,
                type: newTxForm.type,
                category: newTxForm.category,
                providerOrClient:
                  newTxForm.providerOrClient.trim() ||
                  (newTxForm.type === 'expense' ? 'Proveedor Taller' : 'Cliente Taller'),
                paymentMethod: newTxForm.paymentMethod,
                invoiceOrDoc: newTxForm.invoiceOrDoc.trim() || 'S/DOC',
                status: newTxForm.status,
                date: newTxForm.date.trim() || '14 oct 2024',
                orderId: newTxForm.orderId || undefined,
              }
            : t
        )
      )
      setEditingTxId(null)
      showToast('Movimiento actualizado correctamente')
    } else {
      const tx: FinanceTransaction = {
        id: `fin-${Date.now()}`,
        date: newTxForm.date.trim() || '14 oct 2024',
        month: 'Oct',
        description: newTxForm.description.trim(),
        category: newTxForm.category,
        type: newTxForm.type,
        amount: amt,
        paymentMethod: newTxForm.paymentMethod,
        status: newTxForm.status,
        providerOrClient:
          newTxForm.providerOrClient.trim() ||
          (newTxForm.type === 'expense' ? 'Proveedor Taller' : 'Cliente Taller'),
        invoiceOrDoc:
          newTxForm.invoiceOrDoc.trim() ||
          (newTxForm.type === 'expense'
            ? `FAC-${Math.floor(1000 + Math.random() * 9000)}`
            : `BOL-${Math.floor(1000 + Math.random() * 9000)}`),
        orderId: newTxForm.orderId || undefined,
      }
      setTransactions((prev) => [tx, ...prev])
      addActivity(
        settings.adminName.split(' ')[0],
        newTxForm.type === 'income'
          ? `registró ingreso (${tx.category}) por`
          : `registró gasto (${tx.category}) por`,
        formatCLP(amt),
        newTxForm.type === 'income' ? 'green' : 'orange',
        'dollar',
        newTxForm.orderId || undefined
      )
      showToast(
        newTxForm.type === 'expense'
          ? `Gasto de ${formatCLP(amt)} (${tx.category}) registrado`
          : `Ingreso de ${formatCLP(amt)} registrado`
      )
    }

    setNewTxForm({
      description: '',
      amount: '',
      type: 'expense',
      category: 'Repuestos',
      providerOrClient: '',
      paymentMethod: 'Transferencia',
      invoiceOrDoc: '',
      status: 'Pagado',
      date: '14 oct 2024',
      orderId: '',
    })
  }

  const startEditTransaction = (tx: FinanceTransaction) => {
    setEditingTxId(tx.id)
    setNewTxForm({
      description: tx.description,
      amount: String(tx.amount),
      type: tx.type,
      category: tx.category,
      providerOrClient: tx.providerOrClient || '',
      paymentMethod: tx.paymentMethod || 'Transferencia',
      invoiceOrDoc: tx.invoiceOrDoc || '',
      status: tx.status || 'Pagado',
      date: tx.date,
      orderId: tx.orderId || '',
    })
  }

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Fecha',
      'Tipo',
      'Categoria',
      'Concepto',
      'Proveedor_o_Cliente',
      'Documento',
      'Metodo_Pago',
      'Estado',
      'Orden_Asociada',
      'Monto_Bs',
    ]
    const rows = transactions.map((t) => [
      t.id,
      `"${t.date}"`,
      t.type === 'income' ? 'Ingreso' : 'Egreso/Gasto',
      `"${t.category}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${(t.providerOrClient || '').replace(/"/g, '""')}"`,
      `"${t.invoiceOrDoc || ''}"`,
      `"${t.paymentMethod || 'Transferencia'}"`,
      `"${t.status || 'Pagado'}"`,
      t.orderId || '',
      t.type === 'income' ? t.amount : -t.amount,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `libro_ingresos_y_gastos_motolab.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Reporte contable CSV descargado correctamente')
  }

  // Set order to any specific status directly (forward, backward, or jump)
  const changeOrderStatus = (id: string, targetStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === id)
    if (!targetOrder || targetOrder.status === targetStatus) return

    if (targetStatus === 'Entregado') {
      const orderTotal = calculateOrderTotal(targetOrder)
      setOrders((current) =>
        current.map((o) =>
          o.id === id ? { ...o, status: 'Entregado', eta: 'Entregada', paid: true } : o
        )
      )
      if (!targetOrder.paid) {
        setTransactions((prev) => [
          {
            id: `fin-${Date.now()}`,
            date: '14 oct 2024',
            month: 'Oct',
            description: `Entrega ${targetOrder.id} - ${targetOrder.bike} (${targetOrder.client})`,
            category: 'Servicio',
            type: 'income',
            amount: orderTotal,
            paymentMethod: 'QR Simple',
            status: 'Pagado',
            providerOrClient: targetOrder.client,
            invoiceOrDoc: `REC-${Math.floor(4100 + Math.random() * 800)}`,
            orderId: targetOrder.id,
          },
          ...prev,
        ])
      }
      addActivity(targetOrder.id, 'entregada a', targetOrder.client, 'green', 'check', targetOrder.id)
      if (isSupabaseConfigured()) {
        updateOrderStatusInSupabase(id, 'Entregado').catch(() => {})
      }
      showToast(`Orden ${targetOrder.id} entregada y cerrada`)
      return
    }

    const nowTime =
      'Hoy · ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== id) return order
        return {
          ...order,
          status: targetStatus,
          eta: targetStatus === 'Listo para entrega' ? 'Pendiente de retiro' : order.eta,
          timeline: {
            ...order.timeline,
            [targetStatus]: nowTime,
          },
        }
      })
    )

    if (isSupabaseConfigured()) {
      updateOrderStatusInSupabase(id, targetStatus).catch(() => {})
    }

    addActivity(
      targetOrder.id,
      'cambió de estado a',
      targetStatus.toLowerCase(),
      targetStatus === 'Listo para entrega'
        ? 'green'
        : targetStatus === 'En diagnóstico'
          ? 'blue'
          : 'orange',
      targetStatus === 'Listo para entrega' ? 'check' : 'wrench',
      targetOrder.id
    )
    showToast(`Estado de ${targetOrder.id} movido a "${targetStatus}"`)
  }

  // Advance order status on Kanban
  const updateStatus = (id: string) => {
    const targetOrder = orders.find((o) => o.id === id)
    if (!targetOrder) return
    if (targetOrder.status === 'Listo para entrega') {
      changeOrderStatus(id, 'Entregado')
      return
    }
    changeOrderStatus(id, getNextStatus(targetOrder.status))
  }

  // Create a new order from the modal
  const handleCreateOrder = () => {
    const clientName = newOrderForm.client.trim() || 'Cliente Nuevo'
    const bikeModel = newOrderForm.bike.trim() || 'Motocicleta estándar'
    const plateCode = (
      newOrderForm.plate.trim() || `NEW-${Math.floor(10 + Math.random() * 89)}A`
    ).toUpperCase()
    const serviceText =
      newOrderForm.service.trim() ||
      newOrderForm.diagnosis.trim().slice(0, 42) ||
      'Diagnóstico y mantenimiento general'

    const maxNum = orders.reduce((max, o) => {
      const match = o.id.match(/(\d+)/)
      return match ? Math.max(max, Number(match[1])) : max
    }, 2048)
    const nextId = `OT-${maxNum + 1}`

    const partsAmt = Math.max(0, Number(newOrderForm.partsAmount) || 0)
    const laborAmt = Math.max(0, Number(newOrderForm.laborAmount) || settings.defaultLaborRate)

    const quoteItems = []
    if (partsAmt > 0) {
      quoteItems.push({
        id: `q-${Date.now()}-1`,
        description: `Repuestos e insumos (${serviceText})`,
        amount: partsAmt,
      })
    }
    quoteItems.push({
      id: `q-${Date.now()}-2`,
      description: 'Mano de obra especializada',
      amount: laborAmt,
    })

    const accents: AccentTone[] = ['orange', 'blue', 'green', 'purple']
    const accent = accents[orders.length % accents.length]

    const assignedMechanic =
      authSession?.role === 'mechanic' && authSession.mechanicName
        ? authSession.mechanicName
        : newOrderForm.mechanic || settings.mechanics[0] || 'Marco Ríos'

    const derivedPin =
      newOrderForm.clientPin.trim() ||
      generateSmartClientPin({
        phone: newOrderForm.phone,
        nitOrCi: newOrderForm.clientNitOrCi,
        strategy: 'phone_last4',
      }).pin

    const newOrder: Order = {
      id: nextId,
      bike: bikeModel,
      plate: plateCode,
      client: clientName,
      clientPin: derivedPin,
      clientNitOrCi: newOrderForm.clientNitOrCi.trim() || derivedPin,
      phone: newOrderForm.phone.trim() || '+591 7000 0000',
      email: `${clientName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      service: serviceText,
      diagnosis:
        newOrderForm.diagnosis.trim() ||
        `Ingreso a taller para ${serviceText.toLowerCase()}. Revisión general de seguridad.`,
      mileage: newOrderForm.mileage.trim() || '12.500 km',
      fuelLevel: newOrderForm.fuelLevel || '1/2 tanque',
      mechanic: assignedMechanic,
      status: 'Agendado',
      eta: newOrderForm.eta.trim() || 'Mañana, 16:00',
      createdAt: newOrderForm.date || '14 de octubre, 2024',
      accent,
      avatar: getInitials(clientName),
      mechanicNote:
        newOrderForm.diagnosis.trim() ||
        'Motocicleta recepcionada en taller. Pendiente de iniciar diagnóstico técnico.',
      mechanicNoteUpdatedAt: 'Justo ahora',
      quoteItems,
      quoteApproved: false,
      paid: false,
      photosCount: 0,
      timeline: {
        Agendado: 'Hoy · Recepción',
        'En diagnóstico': 'Pendiente',
        'En reparación': 'Pendiente',
        'Listo para entrega': 'Próximamente',
      },
      intakeChecklist: {
        leftHelmet: newOrderForm.leftHelmet,
        leftDocuments: newOrderForm.leftDocuments,
        leftKeys: newOrderForm.leftKeys,
        leftToolsOrBag: newOrderForm.leftToolsOrBag,
        aestheticNotes:
          newOrderForm.aestheticNotes.trim() || 'Motocicleta recepcionada sin abolladuras nuevas.',
        clientConformitySigned: false,
      },
      replacedParts:
        partsAmt > 0
          ? [
              {
                id: `rp-${Date.now()}-init`,
                partName: `Kit de repuestos para ${serviceText}`,
                partCode: `OEM-${Math.floor(1000 + Math.random() * 8999)}`,
                brand: 'OEM Original',
                systemCategory: 'Motor y Lubricación',
                oldPartCondition:
                  newOrderForm.diagnosis.trim() ||
                  'Componente programado para reemplazo tras diagnóstico de recepción.',
                actionTaken: 'En instalación',
                installedBy: assignedMechanic,
                installedAt: 'Hoy · En recepción',
                warrantyMonths: 6,
                unitCost: partsAmt,
                oldPartReturnedToClient: true,
              },
            ]
          : [],
      healthCheck: getDefaultHealthCheck(serviceText),
      nextServiceKm: 'En 5.000 km o 6 meses',
      history: [],
      whatsappLogs: [],
    }

    setOrders((prev) => [newOrder, ...prev])
    if (isSupabaseConfigured()) {
      saveOrderToSupabase(newOrder).catch((err) =>
        console.error('Error sincronizando nueva orden en Supabase:', err)
      )
    }
    setWhatsappOrderId(nextId)
    addActivity(
      assignedMechanic.split(' ')[0],
      'puso a reparar la orden',
      nextId,
      'orange',
      'plus',
      nextId
    )
    setShowNewOrder(false)
    setNewOrderForm({
      client: '',
      clientPin: '',
      pinStrategy: 'phone_last4',
      clientNitOrCi: '',
      phone: '',
      bike: '',
      plate: '',
      mileage: '12.500 km',
      fuelLevel: '1/2 tanque',
      service: '',
      date: '2024-10-14',
      eta: 'Mañana, 16:00',
      mechanic: assignedMechanic,
      partsAmount: '450',
      laborAmount: String(settings.defaultLaborRate),
      diagnosis: '',
      leftHelmet: false,
      leftDocuments: true,
      leftKeys: true,
      leftToolsOrBag: false,
      aestheticNotes: 'Motocicleta recepcionada sin abolladuras nuevas.',
    })
    showToast(`Orden ${nextId} (${plateCode}) asignada a ${assignedMechanic}`)
  }

  const openNewOrderForClient = (prefill: Partial<typeof newOrderForm>) => {
    setNewOrderForm((prev) => ({
      ...prev,
      ...prefill,
    }))
    setShowNewOrder(true)
  }

  const handleResetDemoData = () => {
    setOrders(initialOrdersData)
    setInventory(initialInventoryData)
    setActivities(initialActivitiesData)
    setTransactions(initialTransactionsData)
    setSettings(defaultSettings)
    window.localStorage.removeItem(STORAGE_KEY)
    showToast('Datos de demostración restaurados correctamente')
  }

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  )

  const currentRole: 'admin' | 'mechanic' | 'client' = authSession?.role ?? 'admin'
  const currentMechanicName = authSession?.mechanicName || settings.mechanics[0] || 'Marco Ríos'

  const myMechanicOrdersCount = useMemo(
    () =>
      getOrdersForMechanic(orders, currentMechanicName).filter((o) => o.status !== 'Entregado')
        .length,
    [orders, currentMechanicName]
  )

  // Aislamiento estricto de datos para clientes: solo acceden a sus propias motocicletas y órdenes
  const clientScopedOrders = useMemo(() => {
    if (currentRole !== 'client' || !authSession) return orders
    const targetPlate = (authSession.clientPlateOrOrder || '').trim().toLowerCase()
    const targetName = (authSession.userName || '').trim().toLowerCase()

    const matched = orders.filter((o) => {
      const matchPlate = targetPlate && o.plate.toLowerCase() === targetPlate
      const matchOrder = targetPlate && o.id.toLowerCase() === targetPlate
      const matchClient = targetName && o.client.toLowerCase() === targetName
      return Boolean(matchPlate || matchOrder || matchClient)
    })

    if (matched.length > 0) return matched
    return orders.length > 0 ? [orders[0]] : []
  }, [orders, currentRole, authSession])

  // If no active session is selected, show the Multi-Role Login Gateway
  if (hydrated && !authSession) {
    return (
      <>
        <LoginGateway
          orders={orders}
          settings={settings}
          onLoginSuccess={handleLoginSuccess}
        />
        {toastMessage && (
          <div className="toast-banner" role="status" aria-live="polite">
            <Check />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    )
  }

  return (
    <main className="app-shell">
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div
          className="brand"
          onClick={() => {
            if (currentRole === 'admin') setActiveNav('Resumen')
            else if (currentRole === 'mechanic') setMechanicTab('Mi Bahía')
            else setClientTab('Consultar orden')
            setMobileMenuOpen(false)
          }}
          title="Ir al inicio de tu sesión"
        >
          <div className="brand-mark">
            <Wrench />
          </div>
          <div>
            <div className="brand-name">MOTOLAB</div>
            <div className="brand-sub">WORKSHOP OS</div>
          </div>
        </div>

        <div className="workspace-label">SESIÓN ACTIVA ({currentRole.toUpperCase()})</div>
        <button
          className="workspace-switch"
          onClick={() => setAuthSession(null)}
          title="Clic para cambiar de usuario o rol en el Login"
        >
          <div className="workspace-avatar">
            {getInitials(authSession?.userName || settings.adminName)}
          </div>
          <div className="workspace-copy">
            <strong>
              {currentRole === 'admin'
                ? settings.workshopName
                : currentRole === 'mechanic'
                  ? `Bahía: ${currentMechanicName}`
                  : 'Portal Cliente'}
            </strong>
            <span>
              {currentRole === 'admin'
                ? 'Modo Administrador'
                : currentRole === 'mechanic'
                  ? 'Solo mis reparaciones'
                  : authSession?.userSubtitle || 'Seguimiento público'}
            </span>
          </div>
          <ChevronRight />
        </button>

        <nav className="nav-list" aria-label="Navegación principal">
          {currentRole === 'admin' && (
            <>
              {(
                [
                  ['Resumen', LayoutDashboard],
                  ['Órdenes de trabajo', ClipboardList],
                  ['Clientes', Users],
                  ['Repuestos', Package],
                  ['Finanzas', CircleDollarSign],
                ] as const
              ).map(([label, Icon]) => (
                <button
                  key={label}
                  className={`nav-item ${activeNav === label ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNav(label)
                    setMobileMenuOpen(false)
                  }}
                >
                  <Icon />
                  <span>{label}</span>
                  {label === 'Órdenes de trabajo' && (
                    <span className="nav-count">{activeWorkshopOrders.length}</span>
                  )}
                  {label === 'Clientes' && <span className="nav-count">{orders.length}</span>}
                  {label === 'Repuestos' && (
                    <span
                      className="nav-count"
                      style={
                        inventory.some((i) => i.stock <= i.minStock)
                          ? { background: '#fff3e8', color: '#c2410c' }
                          : undefined
                      }
                    >
                      {inventory.length}
                    </span>
                  )}
                  {label === 'Finanzas' && (
                    <span className="nav-count">{transactions.length}</span>
                  )}
                </button>
              ))}
            </>
          )}

          {currentRole === 'mechanic' && (
            <>
              <button
                className={`nav-item ${mechanicTab === 'Mi Bahía' ? 'active' : ''}`}
                onClick={() => {
                  setMechanicTab('Mi Bahía')
                  setMobileMenuOpen(false)
                }}
              >
                <Wrench />
                <span>Mi Bahía (Kanban)</span>
                <span className="nav-count">{myMechanicOrdersCount}</span>
              </button>
              <button
                className={`nav-item ${mechanicTab === 'Mis Diagnósticos' ? 'active' : ''}`}
                onClick={() => {
                  setMechanicTab('Mis Diagnósticos')
                  setMobileMenuOpen(false)
                }}
              >
                <ClipboardList />
                <span>Mis Diagnósticos</span>
              </button>
            </>
          )}

          {currentRole === 'client' && (
            <>
              <button
                className={`nav-item ${clientTab === 'Consultar orden' ? 'active' : ''}`}
                onClick={() => {
                  setClientTab('Consultar orden')
                  setMobileMenuOpen(false)
                }}
              >
                <Search />
                <span>Mi Motocicleta</span>
              </button>
              <button
                className={`nav-item ${clientTab === 'Historial' ? 'active' : ''}`}
                onClick={() => {
                  setClientTab('Historial')
                  setMobileMenuOpen(false)
                }}
              >
                <FileText />
                <span>Historial</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-bottom">
          {currentRole === 'admin' && (
            <button
              className={`nav-item ${activeNav === 'Configuración' ? 'active' : ''}`}
              onClick={() => {
                setActiveNav('Configuración')
                setMobileMenuOpen(false)
              }}
            >
              <Settings2 />
              <span>Configuración</span>
            </button>
          )}

          <button
            className="nav-item"
            onClick={() => setAuthSession(null)}
            style={{ color: '#f7b596' }}
          >
            <LogOut />
            <span>Cambiar rol / Salir</span>
          </button>

          <button
            className="user-card"
            onClick={() => setAuthSession(null)}
            title="Cambiar de cuenta o rol"
          >
            <div className="user-avatar">
              {getInitials(authSession?.userName || settings.adminName)}
            </div>
            <div>
              <strong>{authSession?.userName || settings.adminName}</strong>
              <span>
                {currentRole === 'admin'
                  ? settings.adminRole
                  : currentRole === 'mechanic'
                    ? 'Mecánico de Taller'
                    : 'Cliente Registrado'}
              </span>
            </div>
            <MoreHorizontal />
          </button>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Abrir menú"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <Menu />
          </button>

          <div className="breadcrumb">
            <span>
              {currentRole === 'admin'
                ? 'Administración'
                : currentRole === 'mechanic'
                  ? `Taller · ${currentMechanicName}`
                  : 'Portal Cliente'}
            </span>
            <ChevronRight />
            <strong>
              {currentRole === 'admin'
                ? activeNav
                : currentRole === 'mechanic'
                  ? mechanicTab
                  : clientTab}
            </strong>
          </div>

          <div className="top-actions">
            <span
              className={`role-pill-badge ${
                currentRole === 'admin'
                  ? 'role-pill-admin'
                  : currentRole === 'mechanic'
                    ? 'role-pill-mechanic'
                    : 'role-pill-client'
              }`}
            >
              {currentRole === 'admin'
                ? 'Rol: Admin'
                : currentRole === 'mechanic'
                  ? `Mecánico: ${currentMechanicName.split(' ')[0]}`
                  : `Cliente: ${searchedQuery}`}
            </span>

            <span
              className="role-pill-badge"
              style={{
                background: isSupabaseOnline ? '#f0fdf4' : '#fff7ed',
                color: isSupabaseOnline ? '#15803d' : '#c2410c',
                borderColor: isSupabaseOnline ? '#bbf7d0' : '#fed7aa',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (currentRole === 'admin') setActiveNav('Configuración')
              }}
              title={
                isSupabaseOnline
                  ? 'Base de datos en la nube Supabase conectada con sincronización Realtime'
                  : 'Modo local activo (fallback offline). Configura Supabase en .env.local para producción'
              }
            >
              {isSupabaseOnline ? '☁️ Supabase En Vivo' : '💾 Modo Local'}
            </span>

            <button
              className="icon-button"
              aria-label="Notificaciones"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <Bell />
              {unreadNotificationsCount > 0 && <span className="notification-dot" />}
            </button>

            {showNotifications && (
              <div
                className="notifications-popover"
                role="dialog"
                aria-label="Centro de notificaciones"
              >
                <div className="notifications-header">
                  <span>Notificaciones ({unreadNotificationsCount} nuevas)</span>
                  <button
                    className="text-button"
                    onClick={() => {
                      setActivities((prev) => prev.map((a) => ({ ...a, read: true })))
                      showToast('Notificaciones marcadas como leídas')
                    }}
                  >
                    Marcar leídas
                  </button>
                </div>
                <div className="notifications-body">
                  {activities.slice(0, 7).map((act) => (
                    <div
                      className="activity-item clickable"
                      key={act.id}
                      onClick={() => handleActivityClick(act)}
                      title="Clic para abrir el registro relacionado"
                    >
                      <span className={`activity-icon ${act.tone}`}>
                        <ActivityIcon iconType={act.iconType} />
                      </span>
                      <div>
                        <p>
                          <strong>{act.actor}</strong> {act.action} <strong>{act.target}</strong>
                        </p>
                        <span>{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              className="view-toggle"
              onClick={() => setAuthSession(null)}
              title="Abrir pantalla de Login para cambiar entre Admin, Mecánico y Cliente"
            >
              <span>Cambiar rol / Login</span>
              <LogOut />
            </button>
          </div>
        </header>

        {/* ===================== ROL 2: MECÁNICO (SOLO VE SUS REPARACIONES) ===================== */}
        {currentRole === 'mechanic' && (
          <MechanicWorkspace
            mechanicName={currentMechanicName}
            activeTab={mechanicTab}
            orders={orders}
            inventory={inventory}
            onSelectOrder={(id) => setSelectedOrderId(id)}
            onAdvanceStatus={(id) => updateStatus(id)}
            onChangeOrderStatus={(id, targetStatus) => changeOrderStatus(id, targetStatus)}
            onOpenNewOrderForMe={() => {
              setNewOrderForm((prev) => ({
                ...prev,
                mechanic: currentMechanicName,
              }))
              setShowNewOrder(true)
            }}
            onOpenWhatsAppForOrder={(ord) => openSmartWhatsApp(ord, 'avance_reparacion', true)}
            onQuickUpdateMechanicNote={(orderId, diagnosis, service, note) => {
              const target = orders.find((o) => o.id === orderId)
              const updated = target
                ? {
                    ...target,
                    diagnosis,
                    service,
                    mechanicNote: note,
                    mechanicNoteUpdatedAt: 'Hace un momento',
                  }
                : null

              setOrders((prev) =>
                prev.map((o) => (o.id === orderId && updated ? updated : o))
              )
              if (updated && isSupabaseConfigured()) {
                saveOrderToSupabase(updated).catch(() => {})
              }
              addActivity(
                currentMechanicName.split(' ')[0],
                'actualizó diagnóstico y avance en',
                orderId,
                'orange',
                'wrench',
                orderId
              )
              showToast(`Diagnóstico y nota de ${orderId} actualizados`)
            }}
            onAddReplacedPart={(orderId, part, addToQuote) => {
              const { updatedInventory, matchedItem } = deductInventoryForReplacedPart(
                inventory,
                part.partCode || part.partName
              )
              if (matchedItem) {
                setInventory(updatedInventory)
                if (isSupabaseConfigured()) {
                  saveInventoryItemToSupabase(matchedItem).catch(() => {})
                }
              }
              const target = orders.find((o) => o.id === orderId)
              const nextQuote =
                target && addToQuote && part.unitCost > 0
                  ? [
                      ...target.quoteItems,
                      {
                        id: `q-${Date.now()}`,
                        description: `${part.partName} (${part.partCode})`,
                        amount: part.unitCost,
                      },
                    ]
                  : target?.quoteItems ?? []

              const updated = target
                ? {
                    ...target,
                    replacedParts: [part, ...target.replacedParts],
                    quoteItems: nextQuote,
                    mechanicNoteUpdatedAt: 'Hace un momento',
                  }
                : null

              setOrders((prev) =>
                prev.map((o) => (o.id === orderId && updated ? updated : o))
              )
              if (updated && isSupabaseConfigured()) {
                saveOrderToSupabase(updated).catch(() => {})
              }
              addActivity(
                currentMechanicName.split(' ')[0],
                `registró pieza cambiada (${part.partName}) en`,
                orderId,
                'green',
                'wrench',
                orderId
              )
              showToast(
                matchedItem
                  ? `Pieza "${part.partName}" registrada en ${orderId} (Stock bodega restante: ${matchedItem.stock} unid.)`
                  : `Pieza "${part.partName}" registrada en ${orderId} y respaldada para Cliente y Admin`
              )
            }}
            onAddPhoto={(orderId) => {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === orderId ? { ...o, photosCount: o.photosCount + 1 } : o
                )
              )
              addActivity(
                currentMechanicName.split(' ')[0],
                'subió una foto a',
                orderId,
                'blue',
                'image',
                orderId
              )
              showToast(`Foto técnica adjuntada a ${orderId}`)
            }}
          />
        )}

        {/* ===================== ROL 1: ADMINISTRADOR ===================== */}
        {currentRole === 'admin' && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">
                  {activeNav === 'Finanzas'
                    ? 'MÓDULO CONTABLE, ESTADÍSTICAS Y FLUJO DE CAJA · BOLIVIA (BS)'
                    : activeNav === 'Repuestos'
                      ? 'KARDEX E INVENTARIO EN BODEGA · REPUESTOS E INSUMOS EN BS'
                      : activeNav === 'Clientes'
                        ? 'EXPEDIENTE Y AUDITORÍA TÉCNICA DE CLIENTES · MOTOLAB'
                        : 'LUNES, 14 DE OCTUBRE DE 2024'}
                </p>
                <h1>
                  {activeNav === 'Finanzas' ? (
                    <>
                      Centro Financiero y Estadísticas <span>✦</span>
                    </>
                  ) : activeNav === 'Repuestos' ? (
                    <>
                      Kardex de Repuestos e Insumos <span>✦</span>
                    </>
                  ) : activeNav === 'Clientes' ? (
                    <>
                      Expediente y Auditoría de Clientes <span>✦</span>
                    </>
                  ) : (
                    <>
                      Buenos días, {settings.adminName.split(' ')[0]} <span>✦</span>
                    </>
                  )}
                </h1>
                <p className="heading-sub">
                  {activeNav === 'Finanzas'
                    ? 'Analítica visual en forma de torta, control de ingresos (+), gastos operativos (-) y arqueo contable en Bolivianos (Bs).'
                    : activeNav === 'Repuestos'
                      ? 'Control de stock físico en bodega, alertas de reposición crítica y registro de piezas para cotizaciones.'
                      : activeNav === 'Clientes'
                        ? 'Trazabilidad clínica de cada motocicleta, actas anti-reclamos, piezas en custodia y portal de cliente.'
                        : 'Aquí tienes el pulso de tu taller para hoy.'}
                </p>
              </div>
              <div className="heading-actions">
                <button
                  className="button secondary"
                  onClick={() => setPeriodIndex((prev) => (prev + 1) % PERIODS.length)}
                  title="Cambiar periodo de visualización"
                >
                  <CalendarDays /> {PERIODS[periodIndex]} <ChevronRight />
                </button>
                {activeNav === 'Finanzas' ? (
                  <>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={handleExportCSV}
                    >
                      <Download /> Exportar Libro CSV
                    </button>
                    <button
                      type="button"
                      className="button primary"
                      onClick={() => setFinanceSubTab('register')}
                    >
                      <Plus /> Registrar Ingreso / Gasto (Bs)
                    </button>
                  </>
                ) : (
                  <button className="button primary" onClick={() => setShowNewOrder(true)}>
                    <Plus /> Nueva orden
                  </button>
                )}
              </div>
            </div>

            {activeNav === 'Resumen' && (
              <>
                <div className="stats-grid">
                  <StatCard
                    label="Motos en taller"
                    value={String(activeWorkshopOrders.length).padStart(2, '0')}
                    change="+3 esta semana"
                    icon={Bike}
                    tone="orange"
                    onClick={() => {
                      setOrdersTabFilter('Todas')
                      setActiveNav('Órdenes de trabajo')
                    }}
                  />
                  <StatCard
                    label="Listas para entrega"
                    value={String(readyOrdersCount).padStart(2, '0')}
                    change={`${readyOrdersCount} para retiro`}
                    icon={Check}
                    tone="green"
                    onClick={() => {
                      setOrdersTabFilter('Listo para entrega')
                      setActiveNav('Órdenes de trabajo')
                    }}
                  />
                  <StatCard
                    label={`Ingresos (${PERIODS[periodIndex].toLowerCase()})`}
                    value={formatCompactCLP(financialTotals.income)}
                    change="+18,4% vs. anterior"
                    icon={ArrowUpRight}
                    tone="blue"
                    onClick={() => {
                      setTxTypeFilter('income')
                      setActiveNav('Finanzas')
                    }}
                  />
                  <StatCard
                    label="Ganancia neta"
                    value={formatCompactCLP(financialTotals.net)}
                    change="+24,1% vs. anterior"
                    icon={CircleDollarSign}
                    tone="purple"
                    onClick={() => {
                      setTxTypeFilter('all')
                      setActiveNav('Finanzas')
                    }}
                  />
                </div>

                <div className="content-grid">
                  <section className="panel kanban-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Flujo de trabajo</h2>
                        <p>
                          Órdenes activas ({filteredOrders.length}) · Clic en tarjeta para editar o enviar WhatsApp
                        </p>
                      </div>
                      <div className="panel-tools">
                        <div className="search-box">
                          <Search />
                          <input
                            aria-label="Buscar órdenes"
                            placeholder="Buscar orden, moto..."
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
                        <button
                          className={`icon-button bordered ${
                            showFilterBar || mechanicFilter !== 'Todos' ? 'active-filter' : ''
                          }`}
                          aria-label="Filtrar órdenes"
                          onClick={() => setShowFilterBar((prev) => !prev)}
                        >
                          <Filter />
                        </button>
                      </div>
                    </div>

                    {(showFilterBar || mechanicFilter !== 'Todos') && (
                      <div className="filter-bar">
                        <span>Filtrar por mecánico:</span>
                        {['Todos', ...settings.mechanics].map((m) => (
                          <button
                            key={m}
                            className={`filter-chip ${mechanicFilter === m ? 'active' : ''}`}
                            onClick={() => setMechanicFilter(m)}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="kanban-board">
                      {columns.map((column) => {
                        const colOrders = filteredOrders.filter((o) => o.status === column.key)
                        return (
                          <div className="kanban-column" key={column.key}>
                            <div className="column-heading">
                              <span className={`column-indicator ${column.tone}`} />
                              <strong>{column.name}</strong>
                              <span className="column-count">{colOrders.length}</span>
                              <MoreHorizontal />
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
                                        onClick={() => setSelectedOrderId(order.id)}
                                      >
                                        {order.id}
                                      </span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <button
                                          className="more-mini"
                                          title={`Enviar avance o diagnóstico por WhatsApp a ${order.client}`}
                                          aria-label={`WhatsApp para ${order.id}`}
                                          onClick={() => openSmartWhatsApp(order)}
                                          style={{ color: '#178b44' }}
                                        >
                                          <MessageCircle />
                                        </button>
                                        <button
                                          className="more-mini"
                                          aria-label={`Más acciones para ${order.id}`}
                                          onClick={() => setSelectedOrderId(order.id)}
                                        >
                                          <MoreHorizontal />
                                        </button>
                                      </div>
                                    </div>
                                    <div
                                      className="bike-row"
                                      onClick={() => setSelectedOrderId(order.id)}
                                      title="Clic para abrir ficha completa, diagnóstico y cotización"
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
                                    <div
                                      className="service-name"
                                      onClick={() => setSelectedOrderId(order.id)}
                                      style={{ cursor: 'pointer' }}
                                    >
                                      {order.service}
                                    </div>

                                    {/* Banner animado del estado en vivo + barra de progreso */}
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

                                    <div className="intake-badges">
                                      <span
                                        className="intake-badge"
                                        style={{
                                          background: order.quoteApproved ? '#e9f8f0' : '#fff0e9',
                                          color: order.quoteApproved ? '#2d9465' : '#d96229',
                                        }}
                                      >
                                        {order.quoteApproved ? '✓ Cotiz. aprobada' : 'Cotiz. pendiente'}
                                      </span>
                                      <span className="intake-badge">
                                        {formatCLP(calculateOrderTotal(order))}
                                      </span>
                                    </div>

                                    {/* Botonera rápida de 4 etapas para mover con 1 clic */}
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
                                            onClick={() => changeOrderStatus(order.id, st)}
                                          >
                                            {label}
                                          </button>
                                        )
                                      })}
                                    </div>

                                    <div className="order-footer">
                                      <div
                                        className="person"
                                        onClick={() =>
                                          setMechanicFilter((prev) =>
                                            prev === order.mechanic ? 'Todos' : order.mechanic
                                          )
                                        }
                                        title={`Filtrar por ${order.mechanic}`}
                                      >
                                        <span className="person-avatar">{order.avatar}</span>
                                        <span>{order.mechanic}</span>
                                      </div>
                                      <span className="eta">
                                        <Clock3 />
                                        {order.eta}
                                      </span>
                                    </div>

                                    {/* Botones interactivos Etapa Anterior / Siguiente */}
                                    <div className="stage-nav-controls">
                                      <button
                                        type="button"
                                        className="stage-nav-btn"
                                        disabled={order.status === 'Agendado'}
                                        title="Volver a la etapa anterior"
                                        onClick={() =>
                                          changeOrderStatus(order.id, getPrevStatus(order.status))
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
                                        onClick={() => updateStatus(order.id)}
                                      >
                                        {order.status === 'Listo para entrega'
                                          ? 'Registrar entrega ✓'
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

                  <aside className="right-rail">
                    <section className="panel quick-panel">
                      <div className="panel-heading compact">
                        <div>
                          <h2>Actividad reciente</h2>
                          <p>Clic en un evento para abrir la orden</p>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => setShowAllActivities((prev) => !prev)}
                        >
                          {showAllActivities ? 'Ver menos' : 'Ver todo'}
                        </button>
                      </div>
                      <div className="activity-list">
                        {(showAllActivities ? activities : activities.slice(0, 4)).map((act) => (
                          <div
                            className="activity-item clickable"
                            key={act.id}
                            onClick={() => handleActivityClick(act)}
                            title="Abrir detalle del movimiento"
                          >
                            <span className={`activity-icon ${act.tone}`}>
                              <ActivityIcon iconType={act.iconType} />
                            </span>
                            <div>
                              <p>
                                <strong>{act.actor}</strong> {act.action}{' '}
                                <strong>{act.target}</strong>
                              </p>
                              <span>{act.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="panel finance-panel">
                      <div className="panel-heading compact">
                        <div>
                          <h2>Resumen financiero</h2>
                          <p>
                            {financialTotals.monthLabel} ({PERIODS[periodIndex]})
                          </p>
                        </div>
                        <button
                          className="icon-button"
                          aria-label="Ir a finanzas"
                          onClick={() => setActiveNav('Finanzas')}
                          title="Abrir módulo completo de Ingresos y Gastos"
                        >
                          <MoreHorizontal />
                        </button>
                      </div>
                      <div className="finance-list">
                        {financeRows.map(({ label, value, delta, positive, icon: Icon }) => (
                          <div
                            className="finance-row"
                            key={label}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (label === 'Ingresos') setTxTypeFilter('income')
                              else if (label === 'Egresos') setTxTypeFilter('expense')
                              else setTxTypeFilter('all')
                              setActiveNav('Finanzas')
                            }}
                          >
                            <div className={`finance-icon ${positive ? 'positive' : 'negative'}`}>
                              <Icon />
                            </div>
                            <div className="finance-copy">
                              <span>{label}</span>
                              <strong>{value}</strong>
                            </div>
                            <small className={positive ? 'positive-text' : 'negative-text'}>
                              {delta}
                            </small>
                          </div>
                        ))}
                      </div>
                      <div className="mini-chart">
                        <div className="chart-labels">
                          <span>Ingresos vs egresos (clic en mes)</span>
                          <span>Últimos 6 meses</span>
                        </div>
                        <div className="bars">
                          {MONTHLY_CHART_DATA.map((m, i) => (
                            <div
                              className={`bar-group ${selectedMonthIndex === i ? 'selected' : ''}`}
                              key={m.month}
                              onClick={() => {
                                setSelectedMonthIndex(i)
                                showToast(`Mostrando balance de ${m.label}`)
                              }}
                              title={`Ver balance de ${m.label}`}
                            >
                              <div className="bar income" style={{ height: `${m.incomePct}%` }} />
                              <div className="bar expense" style={{ height: `${m.expensePct}%` }} />
                            </div>
                          ))}
                        </div>
                        <div className="chart-months">
                          {MONTHLY_CHART_DATA.map((m, i) => (
                            <span
                              key={m.month}
                              style={{
                                cursor: 'pointer',
                                fontWeight: selectedMonthIndex === i ? 800 : 400,
                                color: selectedMonthIndex === i ? 'var(--orange)' : undefined,
                              }}
                              onClick={() => setSelectedMonthIndex(i)}
                            >
                              {m.month}
                            </span>
                          ))}
                        </div>
                      </div>
                    </section>
                  </aside>
                </div>

                {/* SECCIÓN DE INTELIGENCIA DE TALLER: MECÁNICOS QUE MÁS GANAN, TRABAJOS QUE MÁS SALIERON & PUBLICIDAD */}
                <DashboardIntelligenceSection
                  orders={orders}
                  inventory={inventory}
                  settings={settings}
                  activeMechanicFilter={mechanicFilter}
                  onSelectMechanicFilter={(mechanicName) => {
                    setMechanicFilter(mechanicName)
                    showToast(
                      mechanicName === 'Todos'
                        ? 'Mostrando órdenes de todos los mecánicos'
                        : `Tablero Kanban filtrado por mecánico: ${mechanicName}`
                    )
                  }}
                  onCopyText={(text, label) => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(text)
                    }
                    showToast(label)
                  }}
                  onNavigateToOrders={(query) => {
                    if (query) setSearch(query)
                    setActiveNav('Órdenes de trabajo')
                  }}
                />
              </>
            )}

            {activeNav === 'Órdenes de trabajo' && (
              <div className="section-container">
                {/* RIBBON DE KPIS INTELIGENTES EN VIVO */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '12px',
                    marginBottom: '6px',
                  }}
                >
                  <div className="panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Motos en Taller
                      </span>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        {orders.filter((o) => o.status !== 'Entregado').length}{' '}
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a' }}>activas</span>
                      </div>
                    </div>
                    <Bike style={{ width: '28px', height: '28px', color: '#94a3b8' }} />
                  </div>

                  <div className="panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        En Bahía de Trabajo
                      </span>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                        {orders.filter((o) => o.status === 'En diagnóstico' || o.status === 'En reparación').length}{' '}
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>en curso</span>
                      </div>
                    </div>
                    <Wrench style={{ width: '26px', height: '26px', color: '#fdba74' }} />
                  </div>

                  <div className="panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Listas para Retiro
                      </span>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                        {orders.filter((o) => o.status === 'Listo para entrega').length}{' '}
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>por entregar</span>
                      </div>
                    </div>
                    <Check style={{ width: '26px', height: '26px', color: '#86efac' }} />
                  </div>

                  <div className="panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Por Cobrar en Taller
                      </span>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                        {formatCLP(
                          orders.filter((o) => !o.paid).reduce((acc, o) => acc + calculateOrderTotal(o), 0)
                        )}
                      </div>
                    </div>
                    <CircleDollarSign style={{ width: '26px', height: '26px', color: '#93c5fd' }} />
                  </div>
                </div>

                <section className="panel">
                  {/* ENCABEZADO PRINCIPAL LIMPIO */}
                  <div
                    style={{
                      padding: '18px 22px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      borderBottom: '1px solid #edf0f3',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                        Órdenes de Trabajo en Taller
                      </h2>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                        Control de diagnósticos de ingreso, trabajo en rampa, cotizaciones y cobros en Bolivianos
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="search-box" style={{ width: '270px' }}>
                        <Search />
                        <input
                          aria-label="Filtrar listado de órdenes"
                          placeholder="Buscar por placa, cliente o falla..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        {search ? (
                          <button
                            type="button"
                            onClick={() => setSearch('')}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                            title="Borrar búsqueda"
                          >
                            <X style={{ width: '13px', height: '13px' }} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* 1. TABS MODERNOS DE ESTADO (SEGMENTED STRIP HORIZONTAL) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '0 20px',
                      borderBottom: '1px solid #edf0f3',
                      background: '#ffffff',
                      overflowX: 'auto',
                    }}
                  >
                    {['Todas', ...ALL_STATUSES].map((st) => {
                      const count =
                        st === 'Todas'
                          ? orders.length
                          : orders.filter((o) => o.status === st).length
                      const isActive = ordersTabFilter === st

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setOrdersTabFilter(st)}
                          style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: isActive ? '2px solid var(--orange)' : '2px solid transparent',
                            padding: '11px 13px',
                            fontSize: '12px',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#0f172a' : '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{st}</span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '99px',
                              background: isActive ? '#fff0e9' : '#f1f5f9',
                              color: isActive ? 'var(--orange)' : '#64748b',
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* 2. BARRA DE FILTROS SECUNDARIOS (MECÁNICO, COBRO Y TOTALES) */}
                  <div
                    style={{
                      padding: '10px 22px',
                      background: '#f8fafc',
                      borderBottom: '1px solid #edf0f3',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      {/* SELECTOR DE MECÁNICO */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Mecánico:</span>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <select
                            aria-label="Filtrar por mecánico"
                            value={mechanicFilter}
                            onChange={(e) => setMechanicFilter(e.target.value)}
                            style={{
                              height: '29px',
                              padding: '0 26px 0 9px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#0f172a',
                              background: '#ffffff',
                              cursor: 'pointer',
                              appearance: 'none',
                            }}
                          >
                            <option value="Todos">Todos los mecánicos</option>
                            {settings.mechanics.map((m) => (
                              <option key={m} value={m}>
                                {m} ({orders.filter((o) => o.mechanic === m).length} motos)
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            style={{
                              width: '12px',
                              height: '12px',
                              color: '#64748b',
                              position: 'absolute',
                              right: '8px',
                              top: '8px',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                      </div>

                      {/* SEGMENTO DE COBRO */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Cobro:</span>
                        <div
                          style={{
                            display: 'inline-flex',
                            background: '#e2e8f0',
                            padding: '2px',
                            borderRadius: '6px',
                          }}
                        >
                          {(['Todos', 'Por cobrar', 'Pagada'] as const).map((p) => {
                            const isPSelected = ordersPaymentFilter === p
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setOrdersPaymentFilter(p)}
                                style={{
                                  background: isPSelected ? '#ffffff' : 'transparent',
                                  color: isPSelected
                                    ? p === 'Por cobrar'
                                      ? '#c2410c'
                                      : p === 'Pagada'
                                        ? '#15803d'
                                        : '#0f172a'
                                    : '#64748b',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '3px 9px',
                                  fontSize: '11px',
                                  fontWeight: isPSelected ? 700 : 500,
                                  cursor: 'pointer',
                                  boxShadow: isPSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {p === 'Todos'
                                  ? 'Todos'
                                  : p === 'Por cobrar'
                                    ? `⚠️ Por cobrar (${orders.filter((o) => !o.paid).length})`
                                    : `✓ Pagadas (${orders.filter((o) => o.paid).length})`}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* BOTÓN LIMPIAR FILTROS */}
                      {(ordersTabFilter !== 'Todas' ||
                        mechanicFilter !== 'Todos' ||
                        ordersPaymentFilter !== 'Todos' ||
                        search) && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrdersTabFilter('Todas')
                            setMechanicFilter('Todos')
                            setOrdersPaymentFilter('Todos')
                            setSearch('')
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 6px',
                          }}
                        >
                          <X style={{ width: '12px', height: '12px' }} /> Limpiar filtros
                        </button>
                      )}
                    </div>

                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                      Mostrando{' '}
                      <strong>
                        {
                          orders.filter((o) => {
                            if (ordersTabFilter !== 'Todas' && o.status !== ordersTabFilter) {
                              return false
                            }
                            if (mechanicFilter !== 'Todos' && o.mechanic !== mechanicFilter) {
                              return false
                            }
                            if (ordersPaymentFilter === 'Por cobrar' && o.paid) {
                              return false
                            }
                            if (ordersPaymentFilter === 'Pagada' && !o.paid) {
                              return false
                            }
                            if (!search.trim()) return true
                            return `${o.id} ${o.bike} ${o.plate} ${o.client} ${o.service} ${o.diagnosis}`
                              .toLowerCase()
                              .includes(search.toLowerCase())
                          }).length
                        }
                      </strong>{' '}
                      de <strong>{orders.length}</strong> órdenes
                    </span>
                  </div>

                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Orden</th>
                          <th>Motocicleta / Cliente</th>
                          <th>Diagnóstico de ingreso & Trabajo actual</th>
                          <th>Mecánico</th>
                          <th>Estado & Progreso</th>
                          <th>Cotización / Pago</th>
                          <th>Acciones rápidas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders
                          .filter((o) => {
                            if (ordersTabFilter !== 'Todas' && o.status !== ordersTabFilter) {
                              return false
                            }
                            if (mechanicFilter !== 'Todos' && o.mechanic !== mechanicFilter) {
                              return false
                            }
                            if (ordersPaymentFilter === 'Por cobrar' && o.paid) {
                              return false
                            }
                            if (ordersPaymentFilter === 'Pagada' && !o.paid) {
                              return false
                            }
                            if (!search.trim()) return true
                            return `${o.id} ${o.bike} ${o.plate} ${o.client} ${o.service} ${o.diagnosis}`
                              .toLowerCase()
                              .includes(search.toLowerCase())
                          })
                          .map((order) => (
                            <tr key={order.id}>
                              <td>
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: '#fff7ed',
                                    border: '1px solid #ffedd5',
                                    color: '#c2410c',
                                    fontWeight: 800,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => setSelectedOrderId(order.id)}
                                  title="Ver expediente técnico completo"
                                >
                                  {order.id}
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                  {order.createdAt}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: '12px', color: '#0f172a' }}>{order.bike}</strong>
                                  <span className="plate-chip" style={{ fontSize: '10px' }}>{order.plate}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                                  {order.client}{' '}
                                  <span style={{ color: '#94a3b8', fontSize: '10px' }}>({order.phone})</span>
                                </div>
                              </td>
                              <td style={{ maxWidth: '340px' }}>
                                <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.4 }}>
                                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
                                    INGRESO:
                                  </span>{' '}
                                  {order.diagnosis}
                                </div>
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: '#0f172a',
                                    marginTop: '6px',
                                    background: '#f8fafc',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    borderLeft: '3px solid var(--orange)',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Wrench style={{ width: '11px', color: 'var(--orange)' }} />
                                    <span>{order.service}</span>
                                  </div>
                                  {order.mechanicNote && (
                                    <div style={{ fontSize: '10px', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                                      “{order.mechanicNote}”
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '50%',
                                      background: '#eff6ff',
                                      color: '#2563eb',
                                      display: 'grid',
                                      placeItems: 'center',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      flexShrink: 0,
                                      border: '1px solid #dbeafe',
                                    }}
                                  >
                                    {getInitials(order.mechanic)}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '11px' }}>
                                      {order.mechanic}
                                    </div>
                                    <div style={{ fontSize: '9px', color: '#16a34a', fontWeight: 600 }}>
                                      ✓ Mecánico titular
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ minWidth: '170px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                  <StatusBadge
                                    status={order.status}
                                    onClick={() => updateStatus(order.id)}
                                  />
                                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569' }}>
                                    {STATUS_META[order.status].progressPct}%
                                  </span>
                                </div>
                                <div
                                  style={{
                                    width: '100%',
                                    height: '4px',
                                    background: '#e2e8f0',
                                    borderRadius: '999px',
                                    overflow: 'hidden',
                                    marginTop: '6px',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${STATUS_META[order.status].progressPct}%`,
                                      height: '100%',
                                      background:
                                        order.status === 'Listo para entrega' || order.status === 'Entregado'
                                          ? '#16a34a'
                                          : order.status === 'En reparación'
                                            ? '#ea580c'
                                            : '#2563eb',
                                      borderRadius: '999px',
                                      transition: 'width 0.3s ease',
                                    }}
                                  />
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                  ⏱️ {order.eta}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                                  {formatCLP(calculateOrderTotal(order))}
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '4px',
                                    marginTop: '5px',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <span
                                    className="intake-badge"
                                    style={{
                                      background: order.quoteApproved ? '#e9f8f0' : '#fff0e9',
                                      color: order.quoteApproved ? '#16a34a' : '#c2410c',
                                      border: order.quoteApproved ? '1px solid #bbf7d0' : '1px solid #fed7aa',
                                      fontSize: '10px',
                                    }}
                                  >
                                    {order.quoteApproved ? '✓ Aprobada' : '⏳ Por aprobar'}
                                  </span>
                                  <span
                                    className="intake-badge"
                                    style={{
                                      background: order.paid ? '#eff6ff' : '#f8fafc',
                                      color: order.paid ? '#2563eb' : '#64748b',
                                      border: order.paid ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                      fontSize: '10px',
                                    }}
                                  >
                                    {order.paid ? '💳 Pagada' : '⚠️ Por cobrar'}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="table-actions">
                                  <button
                                    type="button"
                                    className="mini-btn whatsapp-mini"
                                    onClick={() => openSmartWhatsApp(order)}
                                    title="Enviar diagnóstico y avance por WhatsApp con enlace mágico"
                                    style={{ padding: '5px 9px', borderRadius: '6px' }}
                                  >
                                    <MessageCircle style={{ width: '12px' }} /> WhatsApp
                                  </button>
                                  <button
                                    type="button"
                                    className="mini-btn"
                                    onClick={() => setSelectedOrderId(order.id)}
                                    title="Abrir expediente técnico completo"
                                    style={{ padding: '5px 9px', borderRadius: '6px' }}
                                  >
                                    Ficha
                                  </button>
                                  {!order.paid && (
                                    <button
                                      type="button"
                                      className="mini-btn"
                                      onClick={() => handleCollectOrderPayment(order)}
                                      title="Registrar cobro de esta orden en caja"
                                      style={{
                                        padding: '5px 9px',
                                        borderRadius: '6px',
                                        background: '#f0fdf4',
                                        color: '#15803d',
                                        borderColor: '#bbf7d0',
                                        fontWeight: 700,
                                      }}
                                    >
                                      Cobrar
                                    </button>
                                  )}
                                  {order.status === 'Listo para entrega' ? (
                                    <button
                                      type="button"
                                      className="mini-btn"
                                      onClick={() => updateStatus(order.id)}
                                      title="Entregar motocicleta al cliente"
                                      style={{
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        background: '#16a34a',
                                        color: 'white',
                                        borderColor: '#16a34a',
                                        fontWeight: 700,
                                      }}
                                    >
                                      Entregar ✓
                                    </button>
                                  ) : order.status !== 'Entregado' ? (
                                    <button
                                      type="button"
                                      className="mini-btn"
                                      onClick={() => updateStatus(order.id)}
                                      title={`Avanzar a ${getNextStatus(order.status)}`}
                                      style={{
                                        padding: '5px 9px',
                                        borderRadius: '6px',
                                        background: '#f8fafc',
                                        fontWeight: 600,
                                      }}
                                    >
                                      Avanzar <ChevronRight style={{ width: '11px' }} />
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {activeNav === 'Clientes' && (
              <div className="section-container">
                {/* BÓVEDA DE RESPALDO TÉCNICO Y AUDITORÍA DE CLIENTES (TODO LO QUE SE MUESTRA AL CLIENTE) */}
                <AdminClientBackupPanel
                  orders={orders}
                  settings={settings}
                  onSelectOrderToEdit={(id) => setSelectedOrderId(id)}
                  onOpenClientMirror={(order) => {
                    setClientQuery(order.plate)
                    setSearchedQuery(order.plate)
                    setSearched(true)
                    setClientTab('Consultar orden')
                    setAuthSession({
                      role: 'client',
                      userName: order.client,
                      userSubtitle: `${order.bike} · Placa ${order.plate}`,
                      clientPlateOrOrder: order.plate,
                    })
                    showToast(`Vista Espejo activada: viendo el portal de ${order.client}`)
                  }}
                  onOpenWhatsApp={(order) => openSmartWhatsApp(order, 'avance_reparacion', true)}
                  onCreateClientAccount={(newOrder) => {
                    setOrders((prev) => [newOrder, ...prev])
                    if (isSupabaseConfigured()) {
                      saveOrderToSupabase(newOrder).catch((err) =>
                        console.error('Error sincronizando cuenta en Supabase:', err)
                      )
                    }
                    addActivity(
                      settings.adminName.split(' ')[0],
                      'creó cuenta de cliente para',
                      `${newOrder.client} (${newOrder.plate})`,
                      'green',
                      'plus',
                      newOrder.id
                    )
                    showToast(`Cuenta creada para ${newOrder.client} (${newOrder.plate})`)
                  }}
                  onUpdateClientPin={(orderId, newPin) => {
                    setOrders((prev) =>
                      prev.map((o) =>
                        o.id === orderId
                          ? { ...o, clientPin: newPin, clientNitOrCi: o.clientNitOrCi || newPin }
                          : o
                      )
                    )
                    const target = orders.find((o) => o.id === orderId)
                    if (target && isSupabaseConfigured()) {
                      saveOrderToSupabase({
                        ...target,
                        clientPin: newPin,
                        clientNitOrCi: target.clientNitOrCi || newPin,
                      }).catch(() => {})
                    }
                    showToast(`PIN de acceso actualizado para ${target?.client || orderId}`)
                  }}
                  onToast={showToast}
                />
              </div>
            )}

            {activeNav === 'Repuestos' && (
              <InventoryKardexPanel
                inventory={inventory}
                isSupabaseOnline={isSupabaseOnline}
                onAddInventoryItem={(newItem) => {
                  setInventory((prev) => [newItem, ...prev])
                  if (isSupabaseConfigured()) {
                    saveInventoryItemToSupabase(newItem).catch((err) => {
                      console.warn('Error syncing inventory item to Supabase:', err)
                    })
                  }
                  addActivity(
                    settings.adminName.split(' ')[0],
                    'registró nuevo repuesto en inventario:',
                    `${newItem.name} (${newItem.sku}) · Stock: ${newItem.stock}`,
                    'green',
                    'check'
                  )
                  showToast(`Repuesto "${newItem.name}" guardado y sincronizado en la nube`)
                }}
                onUpdateInventoryItem={(updatedItem) => {
                  setInventory((prev) =>
                    prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
                  )
                  if (isSupabaseConfigured()) {
                    saveInventoryItemToSupabase(updatedItem).catch((err) => {
                      console.warn('Error syncing updated inventory item to Supabase:', err)
                    })
                  }
                  showToast(`Repuesto "${updatedItem.name}" actualizado en Kardex`)
                }}
                onDeleteInventoryItem={(itemId) => {
                  const target = inventory.find((i) => i.id === itemId)
                  setInventory((prev) => prev.filter((i) => i.id !== itemId))
                  if (isSupabaseConfigured()) {
                    deleteInventoryItemFromSupabase(itemId).catch((err) => {
                      console.warn('Error deleting inventory item from Supabase:', err)
                    })
                  }
                  addActivity(
                    settings.adminName.split(' ')[0],
                    'eliminó repuesto del Kardex:',
                    target ? `${target.name} (${target.sku})` : itemId,
                    'orange',
                    'wrench'
                  )
                  showToast(`Repuesto eliminado del inventario`)
                }}
                onUpdateStock={(itemId, newStock) => {
                  const target = inventory.find((i) => i.id === itemId)
                  if (!target) return
                  const safeStock = Math.max(0, newStock)
                  const updatedItem = { ...target, stock: safeStock }
                  setInventory((prev) =>
                    prev.map((i) => (i.id === itemId ? updatedItem : i))
                  )
                  if (isSupabaseConfigured()) {
                    saveInventoryItemToSupabase(updatedItem).catch((err) => {
                      console.warn('Error syncing stock to Supabase:', err)
                    })
                  }
                  if (safeStock === 0) {
                    showToast(`⚠️ "${target.name}" marcado como AGOTADO (Sin Stock)`)
                  } else {
                    showToast(`Stock de "${target.name}": ${safeStock} unidades`)
                  }
                }}
                onToast={showToast}
              />
            )}

            {activeNav === 'Finanzas' && (
              <FinanceAnalyticsModule
                transactions={transactions}
                orders={orders}
                settings={settings}
                activeSubTab={financeSubTab}
                onSubTabChange={setFinanceSubTab}
                onSaveTransaction={(txData, editId) => {
                  if (editId) {
                    setTransactions((prev) =>
                      prev.map((t) =>
                        t.id === editId
                          ? {
                              ...t,
                              description: txData.description,
                              category: txData.category,
                              type: txData.type,
                              amount: txData.amount,
                              paymentMethod: txData.paymentMethod,
                              status: txData.status,
                              providerOrClient: txData.providerOrClient,
                              invoiceOrDoc: txData.invoiceOrDoc,
                              orderId: txData.orderId,
                            }
                          : t
                      )
                    )
                    showToast('Comprobante contable actualizado en el Libro Mayor')
                  } else {
                    const newTx: FinanceTransaction = {
                      id: `fin-${Date.now()}`,
                      date: '14 oct 2024',
                      month: 'Oct',
                      description: txData.description,
                      category: txData.category,
                      type: txData.type,
                      amount: txData.amount,
                      paymentMethod: txData.paymentMethod,
                      status: txData.status,
                      providerOrClient: txData.providerOrClient,
                      invoiceOrDoc: txData.invoiceOrDoc,
                      orderId: txData.orderId,
                    }
                    setTransactions((prev) => [newTx, ...prev])
                    if (isSupabaseConfigured()) {
                      saveTransactionToSupabase(newTx).catch(() => {})
                    }
                    addActivity(
                      settings.adminName.split(' ')[0],
                      txData.type === 'income'
                        ? `registró ingreso (${txData.category}) por`
                        : `registró gasto (${txData.category}) por`,
                      formatCLP(txData.amount),
                      txData.type === 'income' ? 'green' : 'orange',
                      'dollar',
                      txData.orderId
                    )
                    showToast(
                      txData.type === 'income'
                        ? `Ingreso de ${formatCLP(txData.amount)} registrado en caja`
                        : `Egreso / gasto de ${formatCLP(txData.amount)} (${txData.category}) registrado`
                    )
                  }
                }}
                onToggleTransactionStatus={(txId, nextStatus) => {
                  setTransactions((prev) =>
                    prev.map((item) =>
                      item.id === txId ? { ...item, status: nextStatus } : item
                    )
                  )
                  showToast(`Estado contable cambiado a "${nextStatus}"`)
                }}
                onDeleteTransaction={(txId) => {
                  setTransactions((prev) => prev.filter((item) => item.id !== txId))
                  if (isSupabaseConfigured()) {
                    deleteTransactionFromSupabase(txId).catch(() => {})
                  }
                  showToast('Movimiento eliminado del Libro Mayor')
                }}
                onCollectOrderPayment={(order, method) =>
                  handleCollectOrderPayment(order, method)
                }
                onRevertOrderPayment={(order) =>
                  handleRevertOrderPayment(order)
                }
                onOpenWhatsApp={(order, template) =>
                  openSmartWhatsApp(order, template || 'cobro_orden', true)
                }
                onSelectOrder={(orderId) => setSelectedOrderId(orderId)}
                onExportCSV={handleExportCSV}
                isSupabaseOnline={isSupabaseOnline}
              />
            )}

            {activeNav === 'Configuración' && (
              <div className="section-container">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Configuración operativa, presupuesto de gastos y WhatsApp</h2>
                      <p>
                        Personaliza los datos del taller, meta de presupuesto mensual de gastos, firma de WhatsApp y equipo técnico
                      </p>
                    </div>
                    <button className="button secondary" onClick={handleResetDemoData}>
                      <RotateCcw /> Restaurar datos de fábrica
                    </button>
                  </div>
                  <div className="form-grid">
                    <label>
                      Nombre del taller
                      <input
                        value={settings.workshopName}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, workshopName: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Subtítulo de espacio
                      <input
                        value={settings.workshopSubtitle}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, workshopSubtitle: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      WhatsApp oficial del taller
                      <input
                        value={settings.workshopPhone}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, workshopPhone: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Firma en mensajes de WhatsApp
                      <input
                        value={settings.whatsappSignature}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, whatsappSignature: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Administrador responsable
                      <input
                        value={settings.adminName}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, adminName: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Presupuesto máximo mensual de gastos (Bs)
                      <input
                        type="number"
                        value={settings.monthlyExpenseBudget}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            monthlyExpenseBudget: Number(e.target.value) || 32000,
                          }))
                        }
                      />
                    </label>

                    <div className="full-field">
                      <strong style={{ fontSize: '11px', color: '#667382' }}>
                        Equipo de mecánicos y carga de trabajo actual (clic para entrar como ese mecánico o filtrar)
                      </strong>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginTop: '8px',
                          marginBottom: '10px',
                        }}
                      >
                        {settings.mechanics.map((mec) => {
                          const assignedCount = orders.filter(
                            (o) => o.mechanic === mec && o.status !== 'Entregado'
                          ).length
                          return (
                            <span
                              key={mec}
                              className="filter-chip"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <span
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setMechanicFilter(mec)
                                  setActiveNav('Órdenes de trabajo')
                                }}
                                title={`Ver órdenes asignadas a ${mec}`}
                              >
                                {mec} ({assignedCount} activas)
                              </span>
                              {settings.mechanics.length > 1 && (
                                <button
                                  style={{
                                    border: 0,
                                    background: 'transparent',
                                    color: '#99a3ae',
                                    padding: 0,
                                  }}
                                  onClick={() =>
                                    setSettings((prev) => ({
                                      ...prev,
                                      mechanics: prev.mechanics.filter((m) => m !== mec),
                                    }))
                                  }
                                  aria-label={`Quitar mecánico ${mec}`}
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', maxWidth: '360px' }}>
                        <input
                          placeholder="Nuevo mecánico (ej. Pedro Silva)"
                          value={newMechanicName}
                          onChange={(e) => setNewMechanicName(e.target.value)}
                        />
                        <button
                          className="button secondary"
                          onClick={() => {
                            const clean = newMechanicName.trim()
                            if (!clean) return
                            if (!settings.mechanics.includes(clean)) {
                              setSettings((prev) => ({
                                ...prev,
                                mechanics: [...prev.mechanics, clean],
                              }))
                              setNewMechanicName('')
                              showToast(`Mecánico ${clean} añadido al equipo`)
                            }
                          }}
                        >
                          <Plus /> Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button
                      className="button primary"
                      onClick={() => showToast('Configuración guardada correctamente')}
                    >
                      <Check /> Guardar cambios
                    </button>
                  </div>
                </section>

                {/* PANEL DE CONTROL DE SUPABASE EN PRODUCCIÓN */}
                <SupabaseIntegrationPanel
                  orders={orders}
                  inventory={inventory}
                  transactions={transactions}
                  settings={settings}
                  isOnline={isSupabaseOnline}
                  onShowToast={showToast}
                  onRefreshData={() => {
                    fetchWorkshopDataFromSupabase().then((data) => {
                      if (data) {
                        if (data.orders.length > 0) setOrders(data.orders)
                        if (data.inventory.length > 0) setInventory(data.inventory)
                        if (data.transactions.length > 0) setTransactions(data.transactions)
                        if (data.settings) setSettings(data.settings)
                      }
                    })
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* ===================== ROL 3: CLIENTE ===================== */}
        {currentRole === 'client' && (
          <ClientPortal
            orders={clientScopedOrders}
            settings={settings}
            authSession={authSession}
            clientTab={clientTab}
            setClientTab={setClientTab}
            clientQuery={clientQuery}
            setClientQuery={setClientQuery}
            searchedQuery={searchedQuery}
            setSearchedQuery={setSearchedQuery}
            searched={searched}
            setSearched={setSearched}
            onApproveQuote={(orderId) => {
              const target = orders.find((o) => o.id === orderId)
              if (!target) return
              const nowStamp =
                'Hoy · ' +
                new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
              const updated = { ...target, quoteApproved: true, quoteApprovedAt: nowStamp }
              setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? updated : o))
              )
              if (isSupabaseConfigured()) {
                saveOrderToSupabase(updated).catch(() => {})
              }
              addActivity(
                target.client,
                'aprobó la cotización de',
                target.id,
                'green',
                'check',
                target.id
              )
              showToast(`Cotización de ${target.id} aprobada y respaldada exitosamente`)
            }}
            onSignIntakeConformity={(orderId) => {
              const target = orders.find((o) => o.id === orderId)
              if (!target) return
              const nowStamp =
                'Hoy · ' +
                new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
              const updated = {
                ...target,
                intakeChecklist: {
                  ...(target.intakeChecklist ?? getDefaultIntakeChecklist()),
                  clientConformitySigned: true,
                  clientConformitySignedAt: nowStamp,
                },
              }
              setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? updated : o))
              )
              if (isSupabaseConfigured()) {
                saveOrderToSupabase(updated).catch(() => {})
              }
              addActivity(
                target.client,
                'firmó conformidad de Acta de Recepción en',
                target.id,
                'green',
                'check',
                target.id
              )
              showToast(`Conformidad de recepción física de ${target.id} firmada y respaldada`)
            }}
            onNotifyQrPayment={(orderId) => {
              const target = orders.find((o) => o.id === orderId)
              if (!target) return
              const updated = { ...target, qrPaymentNotified: true }
              setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? updated : o))
              )
              if (isSupabaseConfigured()) {
                saveOrderToSupabase(updated).catch(() => {})
              }
              addActivity(
                target.client,
                'notificó envío de comprobante QR Simple en',
                target.id,
                'green',
                'dollar',
                target.id
              )
              showToast(`Comprobante QR de ${target.id} notificado a administración`)
            }}
            onSendClientComment={(orderId, comment) => {
              const target = orders.find((o) => o.id === orderId)
              if (!target) return
              const updated = { ...target, clientComment: comment }
              setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? updated : o))
              )
              if (isSupabaseConfigured()) {
                saveOrderToSupabase(updated).catch(() => {})
              }
              addActivity(
                target.client,
                'envió un comentario en',
                target.id,
                'blue',
                'wrench',
                target.id
              )
              showToast('Tu mensaje fue enviado al mecánico a cargo y respaldado en Administración')
            }}
            onOpenWhatsAppForOrder={(order, template) => {
              const origin = typeof window !== 'undefined' ? window.location.origin : ''
              const msg = buildWhatsAppMessage(
                order,
                template,
                settings.workshopName,
                settings.whatsappSignature,
                origin
              )
              handleSendWhatsApp(order, msg, template)
            }}
            onToast={showToast}
          />
        )}
      </section>

      {/* Modal Rápido de WhatsApp */}
      {showWhatsappModal && whatsappTargetOrder && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wa-modal-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow" style={{ color: '#178b44' }}>
                  RECORDATORIO Y REPORTE TÉCNICO POR WHATSAPP
                </p>
                <h2 id="wa-modal-title">
                  Enviar a {whatsappTargetOrder.client} ({whatsappTargetOrder.bike} ·{' '}
                  {whatsappTargetOrder.plate})
                </h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowWhatsappModal(false)}
                aria-label="Cerrar WhatsApp"
              >
                <X />
              </button>
            </div>

            <div style={{ padding: '18px 23px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div className="diagnosis-box">
                  <strong>Diagnóstico con el que entró al taller:</strong>
                  <div>“{whatsappTargetOrder.diagnosis}”</div>
                </div>
                <div className="work-progress-box">
                  <strong>Lo que se le está haciendo ({whatsappTargetOrder.status}):</strong>
                  <div>
                    {whatsappTargetOrder.service} — “{whatsappTargetOrder.mechanicNote}”
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {WHATSAPP_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    className={`filter-chip whatsapp-chip ${
                      whatsappTemplate === tpl.key ? 'active' : ''
                    }`}
                    onClick={() => setWhatsappTemplate(tpl.key)}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>

              <textarea
                className="whatsapp-preview-textarea"
                value={customWhatsappMessage}
                onChange={(e) => setCustomWhatsappMessage(e.target.value)}
              />
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(customWhatsappMessage)
                  showToast('Mensaje copiado al portapapeles')
                }}
              >
                <Copy /> Copiar mensaje
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowWhatsappModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="button whatsapp"
                  onClick={() => {
                    handleSendWhatsApp(
                      whatsappTargetOrder,
                      customWhatsappMessage,
                      whatsappTemplate
                    )
                    setShowWhatsappModal(false)
                  }}
                >
                  <Send /> Abrir WhatsApp y Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear nueva orden */}
      {showNewOrder && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-order-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">
                  {currentRole === 'mechanic'
                    ? `INGRESO A BAHÍA DE ${currentMechanicName.toUpperCase()}`
                    : 'NUEVO INGRESO'}
                </p>
                <h2 id="new-order-title">
                  {currentRole === 'mechanic'
                    ? 'Poner motocicleta a reparar en mi bahía'
                    : 'Crear orden de trabajo'}
                </h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowNewOrder(false)}
                aria-label="Cerrar"
              >
                <X />
              </button>
            </div>
            <div className="form-grid">
              <label>
                Cliente
                <input
                  placeholder="Nombre completo"
                  value={newOrderForm.client}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, client: e.target.value }))
                  }
                />
              </label>
              <label>
                CI / NIT del Cliente (Bolivia)
                <input
                  placeholder="Ej. 6492014 SC o NIT"
                  value={newOrderForm.clientNitOrCi}
                  onChange={(e) => {
                    const newCi = e.target.value
                    setNewOrderForm((prev) => {
                      let nextPin = prev.clientPin
                      if (prev.pinStrategy === 'ci_last4') {
                        const digits = newCi.replace(/\D/g, '')
                        if (digits.length >= 4) {
                          nextPin = digits.slice(-4)
                        }
                      }
                      return { ...prev, clientNitOrCi: newCi, clientPin: nextPin }
                    })
                  }}
                />
              </label>
              <label>
                Teléfono WhatsApp
                <input
                  placeholder="+591 7654 3210"
                  value={newOrderForm.phone}
                  onChange={(e) => {
                    const newPhone = e.target.value
                    setNewOrderForm((prev) => {
                      let nextPin = prev.clientPin
                      if (prev.pinStrategy === 'phone_last4') {
                        const digits = newPhone.replace(/\D/g, '')
                        if (digits.length >= 4) {
                          nextPin = digits.slice(-4)
                        }
                      }
                      return { ...prev, phone: newPhone, clientPin: nextPin }
                    })
                  }}
                />
              </label>

              <div
                className="full-field"
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '10px 14px',
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
                  <label style={{ margin: 0, fontWeight: 700, fontSize: '12px', color: '#166534' }}>
                    🔑 PIN de Acceso para el Cliente (Portal de Seguimiento)
                  </label>
                  <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>
                    {newOrderForm.pinStrategy === 'phone_last4'
                      ? '📱 Últimos 4 de WhatsApp'
                      : newOrderForm.pinStrategy === 'ci_last4'
                      ? '🪪 Últimos 4 de CI'
                      : newOrderForm.pinStrategy === 'random_secure'
                      ? '🎲 PIN Seguro'
                      : '✍️ Personalizado'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    placeholder="ej. 3210"
                    value={newOrderForm.clientPin}
                    onChange={(e) =>
                      setNewOrderForm((prev) => ({
                        ...prev,
                        clientPin: e.target.value,
                        pinStrategy: 'custom',
                      }))
                    }
                    style={{
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      letterSpacing: '0.12em',
                      fontSize: '15px',
                      width: '130px',
                      background: '#ffffff',
                    }}
                  />

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`button ${newOrderForm.pinStrategy === 'phone_last4' ? 'primary' : 'secondary'}`}
                      style={{
                        fontSize: '11px',
                        height: '32px',
                        padding: '0 10px',
                        background:
                          newOrderForm.pinStrategy === 'phone_last4' ? '#16a34a' : undefined,
                        borderColor:
                          newOrderForm.pinStrategy === 'phone_last4' ? '#16a34a' : undefined,
                      }}
                      title="Asignar los últimos 4 dígitos del WhatsApp"
                      onClick={() => {
                        const gen = generateSmartClientPin({
                          phone: newOrderForm.phone,
                          nitOrCi: newOrderForm.clientNitOrCi,
                          strategy: 'phone_last4',
                        })
                        setNewOrderForm((prev) => ({
                          ...prev,
                          clientPin: gen.pin,
                          pinStrategy: 'phone_last4',
                        }))
                      }}
                    >
                      📱 Últimos 4 de Celular
                    </button>

                    <button
                      type="button"
                      className={`button ${newOrderForm.pinStrategy === 'ci_last4' ? 'primary' : 'secondary'}`}
                      style={{
                        fontSize: '11px',
                        height: '32px',
                        padding: '0 10px',
                        background:
                          newOrderForm.pinStrategy === 'ci_last4' ? '#0284c7' : undefined,
                        borderColor:
                          newOrderForm.pinStrategy === 'ci_last4' ? '#0284c7' : undefined,
                      }}
                      title="Asignar los últimos 4 dígitos del CI o NIT"
                      onClick={() => {
                        const gen = generateSmartClientPin({
                          phone: newOrderForm.phone,
                          nitOrCi: newOrderForm.clientNitOrCi,
                          strategy: 'ci_last4',
                        })
                        setNewOrderForm((prev) => ({
                          ...prev,
                          clientPin: gen.pin,
                          pinStrategy: 'ci_last4',
                        }))
                      }}
                    >
                      🪪 Últimos 4 de CI
                    </button>

                    <button
                      type="button"
                      className={`button ${newOrderForm.pinStrategy === 'random_secure' ? 'primary' : 'secondary'}`}
                      style={{
                        fontSize: '11px',
                        height: '32px',
                        padding: '0 10px',
                        background:
                          newOrderForm.pinStrategy === 'random_secure' ? '#7c3aed' : undefined,
                        borderColor:
                          newOrderForm.pinStrategy === 'random_secure' ? '#7c3aed' : undefined,
                      }}
                      title="Generar un PIN de 4 dígitos seguro"
                      onClick={() => {
                        const gen = generateSmartClientPin({ strategy: 'random_secure' })
                        setNewOrderForm((prev) => ({
                          ...prev,
                          clientPin: gen.pin,
                          pinStrategy: 'random_secure',
                        }))
                      }}
                    >
                      🎲 Aleatorio Seguro
                    </button>
                  </div>
                </div>

                <small
                  style={{
                    fontSize: '11px',
                    color: '#15803d',
                    display: 'block',
                    marginTop: '5px',
                  }}
                >
                  💡 <strong>Recomendado:</strong> El cliente ingresará a ver su moto con su Placa y los últimos 4 dígitos de su celular (no requiere registrarse ni recordar contraseñas complejas).
                </small>
              </div>
              <label>
                Modelo de moto
                <input
                  placeholder="Ej. Yamaha MT-07"
                  value={newOrderForm.bike}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, bike: e.target.value }))
                  }
                />
              </label>
              <label>
                Placa
                <input
                  placeholder="ABC-123"
                  value={newOrderForm.plate}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, plate: e.target.value }))
                  }
                />
              </label>
              <label>
                Kilometraje de ingreso
                <input
                  placeholder="Ej. 18.400 km"
                  value={newOrderForm.mileage}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, mileage: e.target.value }))
                  }
                />
              </label>
              <label>
                Nivel de combustible
                <select
                  value={newOrderForm.fuelLevel}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, fuelLevel: e.target.value }))
                  }
                >
                  <option value="Reserva">Reserva</option>
                  <option value="1/4 tanque">1/4 tanque</option>
                  <option value="1/2 tanque">1/2 tanque</option>
                  <option value="3/4 tanque">3/4 tanque</option>
                  <option value="Lleno">Lleno</option>
                </select>
              </label>
              <label>
                Servicio principal a realizar
                <input
                  placeholder="Ej. Mantenimiento 10.000 km"
                  value={newOrderForm.service}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, service: e.target.value }))
                  }
                />
              </label>
              <label>
                Entrega estimada (ETA)
                <input
                  placeholder="Ej. Hoy, 18:00 o Mañana, 11:00"
                  value={newOrderForm.eta}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, eta: e.target.value }))
                  }
                />
              </label>
              <label>
                Fecha de ingreso
                <input
                  type="date"
                  value={newOrderForm.date}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </label>
              <label>
                Mecánico asignado
                <select
                  value={
                    currentRole === 'mechanic' ? currentMechanicName : newOrderForm.mechanic
                  }
                  disabled={currentRole === 'mechanic'}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, mechanic: e.target.value }))
                  }
                >
                  {settings.mechanics.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Repuestos estimados (Bs)
                <input
                  type="number"
                  placeholder="450"
                  value={newOrderForm.partsAmount}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, partsAmount: e.target.value }))
                  }
                />
              </label>
              <label>
                Mano de obra (Bs)
                <input
                  type="number"
                  placeholder="250"
                  value={newOrderForm.laborAmount}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, laborAmount: e.target.value }))
                  }
                />
              </label>
              <label className="full-field">
                Diagnóstico inicial (con el que entra al taller)
                <textarea
                  placeholder="Describe el motivo de ingreso, síntomas reportados por el cliente o hallazgos en recepción..."
                  value={newOrderForm.diagnosis}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, diagnosis: e.target.value }))
                  }
                />
              </label>
              <div
                className="full-field"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 12px',
                }}
              >
                <strong style={{ fontSize: '11px', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  🛡️ Acta de Recepción Física / Inventario Anti-Reclamos
                </strong>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11px', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={newOrderForm.leftHelmet}
                      onChange={(e) =>
                        setNewOrderForm((prev) => ({ ...prev, leftHelmet: e.target.checked }))
                      }
                    />
                    Dejó Casco
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={newOrderForm.leftDocuments}
                      onChange={(e) =>
                        setNewOrderForm((prev) => ({ ...prev, leftDocuments: e.target.checked }))
                      }
                    />
                    Dejó Documentos (RUAT/SOAT)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={newOrderForm.leftKeys}
                      onChange={(e) =>
                        setNewOrderForm((prev) => ({ ...prev, leftKeys: e.target.checked }))
                      }
                    />
                    Dejó Llave / Control
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={newOrderForm.leftToolsOrBag}
                      onChange={(e) =>
                        setNewOrderForm((prev) => ({ ...prev, leftToolsOrBag: e.target.checked }))
                      }
                    />
                    Dejó Herramientas / Alforjas
                  </label>
                </div>
                <input
                  placeholder="Observaciones estéticas de ingreso (rayones previos, espejos, tanque)..."
                  value={newOrderForm.aestheticNotes}
                  onChange={(e) =>
                    setNewOrderForm((prev) => ({ ...prev, aestheticNotes: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="button secondary" onClick={() => setShowNewOrder(false)}>
                Cancelar
              </button>
              <button className="button primary" onClick={handleCreateOrder}>
                <Plus /> Crear orden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalle y Edición de Orden */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          mechanics={settings.mechanics}
          isMechanicRole={currentRole === 'mechanic'}
          onClose={() => setSelectedOrderId(null)}
          onUpdateOrder={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
            if (isSupabaseConfigured()) {
              saveOrderToSupabase(updated).catch(() => {})
            }
            addActivity(
              updated.mechanic.split(' ')[0],
              'actualizó la ficha de',
              updated.id,
              'orange',
              'wrench',
              updated.id
            )
            showToast(`Orden ${updated.id} actualizada`)
          }}
          onAddPhoto={(orderId) => {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === orderId ? { ...o, photosCount: o.photosCount + 1 } : o
              )
            )
            addActivity(
              selectedOrder.mechanic.split(' ')[0],
              'subió una foto a',
              orderId,
              'blue',
              'image',
              orderId
            )
            showToast(`Foto adjuntada a ${orderId}`)
          }}
          onDeleteOrder={(orderId) => {
            setOrders((prev) => prev.filter((o) => o.id !== orderId))
            setSelectedOrderId(null)
            showToast(`Orden ${orderId} eliminada`)
          }}
          onOpenInClientPortal={(plate) => {
            setSelectedOrderId(null)
            setClientQuery(plate)
            setSearchedQuery(plate)
            setSearched(true)
            setClientTab('Consultar orden')
            setAuthSession({
              role: 'client',
              userName: selectedOrder.client,
              userSubtitle: `${selectedOrder.bike} · Placa ${plate}`,
              clientPlateOrOrder: plate,
            })
          }}
          onOpenWhatsApp={(ord) => {
            setSelectedOrderId(null)
            openSmartWhatsApp(ord)
          }}
        />
      )}

      {toastMessage && (
        <div className="toast-banner" role="status" aria-live="polite">
          <Check />
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  )
}

function OrderDetailModal({
  order,
  mechanics,
  isMechanicRole,
  onClose,
  onUpdateOrder,
  onAddPhoto,
  onDeleteOrder,
  onOpenInClientPortal,
  onOpenWhatsApp,
}: {
  order: Order
  mechanics: string[]
  isMechanicRole?: boolean
  onClose: () => void
  onUpdateOrder: (updated: Order) => void
  onAddPhoto: (orderId: string) => void
  onDeleteOrder: (orderId: string) => void
  onOpenInClientPortal: (plate: string) => void
  onOpenWhatsApp: (order: Order) => void
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [mechanic, setMechanic] = useState(order.mechanic)
  const [phone, setPhone] = useState(order.phone)
  const [service, setService] = useState(order.service)
  const [diagnosis, setDiagnosis] = useState(order.diagnosis)
  const [eta, setEta] = useState(order.eta)
  const [mechanicNote, setMechanicNote] = useState(order.mechanicNote)
  const [quoteItems, setQuoteItems] = useState(order.quoteItems)
  const [replacedParts, setReplacedParts] = useState<ReplacedPartItem[]>(order.replacedParts)
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')

  // New Replaced Part inside OrderDetailModal
  const [newPartName, setNewPartName] = useState('')
  const [newPartBrand, setNewPartBrand] = useState('OEM Original')
  const [newPartCode, setNewPartCode] = useState('')
  const [newPartCategory, setNewPartCategory] = useState<PartSystemCategory>('Motor y Lubricación')
  const [newPartCondition, setNewPartCondition] = useState('')
  const [newPartWarranty, setNewPartWarranty] = useState('6')
  const [newPartCost, setNewPartCost] = useState('')

  const totalQuote = quoteItems.reduce((sum, item) => sum + item.amount, 0)

  const buildUpdatedOrder = (): Order => {
    const nowTime =
      'Hoy · ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const updatedTimeline = { ...order.timeline }
    if (status !== order.status && status !== 'Entregado') {
      updatedTimeline[status] = nowTime
    }

    return {
      ...order,
      status,
      mechanic,
      phone,
      service,
      diagnosis,
      eta,
      mechanicNote,
      mechanicNoteUpdatedAt:
        mechanicNote !== order.mechanicNote ? 'Hace un momento' : order.mechanicNoteUpdatedAt,
      quoteItems,
      replacedParts,
      timeline: updatedTimeline,
    }
  }

  const handleSave = () => {
    onUpdateOrder(buildUpdatedOrder())
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-order-title"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">
              GESTIÓN DE ORDEN Y RESPALDO CLIENTE · {order.id} · PLACA {order.plate}
            </p>
            <h2 id="edit-order-title">
              {order.bike} — {order.client}
            </h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar detalle">
            <X />
          </button>
        </div>

        <div className="form-grid">
          <div className="full-field">
            <strong
              style={{ fontSize: '10px', color: '#667382', display: 'block', marginBottom: '6px' }}
            >
              Estado de la orden
            </strong>
            <div className="status-selector-group">
              {ALL_STATUSES.map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`filter-chip ${status === st ? 'active' : ''}`}
                  onClick={() => setStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <label>
            Servicio / Trabajo que se realiza
            <input value={service} onChange={(e) => setService(e.target.value)} />
          </label>
          <label>
            Teléfono WhatsApp del cliente
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Mecánico responsable
            <select
              value={mechanic}
              disabled={isMechanicRole}
              onChange={(e) => setMechanic(e.target.value)}
            >
              {mechanics.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            Entrega estimada (ETA)
            <input value={eta} onChange={(e) => setEta(e.target.value)} />
          </label>

          <label className="full-field">
            Diagnóstico con el que entró al taller (Respaldado para Cliente y Admin)
            <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </label>

          <label className="full-field">
            Nota técnica de lo que se le está haciendo a la moto (visible para el cliente y WhatsApp)
            <textarea value={mechanicNote} onChange={(e) => setMechanicNote(e.target.value)} />
          </label>

          <div className="full-field" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="button whatsapp"
              onClick={() => {
                const updated = buildUpdatedOrder()
                onUpdateOrder(updated)
                onOpenWhatsApp(updated)
              }}
            >
              <MessageCircle /> Enviar diagnóstico, piezas y avance por WhatsApp
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => onAddPhoto(order.id)}
            >
              <ImagePlus /> Subir foto ({order.photosCount})
            </button>
            {!isMechanicRole && (
              <button
                type="button"
                className="button secondary"
                onClick={() => onOpenInClientPortal(order.plate)}
              >
                Ver en portal cliente <ArrowUpRight />
              </button>
            )}
          </div>

          {order.clientComment && (
            <div
              className="full-field"
              style={{
                background: '#edf3ff',
                border: '1px solid #cfe0ff',
                borderRadius: '7px',
                padding: '10px 12px',
                fontSize: '11px',
              }}
            >
              <strong>Mensaje del cliente ({order.client}):</strong> “{order.clientComment}”
            </div>
          )}

          {/* EDITOR DE PIEZAS CAMBIADAS EN TALLER (SINCRONIZADO CON CLIENTE Y RESPALDO ADMIN) */}
          <div className="full-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '11px', color: '#334155' }}>
                🔩 Trazabilidad de piezas cambiadas por el mecánico ({replacedParts.length})
              </strong>
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                Se muestra en el Portal del Cliente y en la Bóveda del Admin
              </span>
            </div>

            <div className="quote-editor-list" style={{ marginTop: '8px' }}>
              {replacedParts.map((rp) => (
                <div
                  key={rp.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '7px',
                    padding: '8px 10px',
                    fontSize: '10px',
                    gap: '8px',
                  }}
                >
                  <div>
                    <strong>{rp.partName}</strong> ({rp.brand} ·{' '}
                    <span className="plate-chip">{rp.partCode}</span>) — Garantía{' '}
                    {rp.warrantyMonths}m
                    <div style={{ color: '#64748b', marginTop: '2px' }}>
                      Estado pieza retirada: {rp.oldPartCondition}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mini-btn"
                    onClick={() =>
                      setReplacedParts((prev) => prev.filter((item) => item.id !== rp.id))
                    }
                    aria-label={`Quitar pieza ${rp.partName}`}
                  >
                    <Trash2 style={{ width: '12px' }} />
                  </button>
                </div>
              ))}

              <div
                style={{
                  background: '#fcfdfe',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '6px',
                }}
              >
                <input
                  placeholder="Pieza reemplazada (ej. Pastillas EBC)"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                />
                <input
                  placeholder="Marca (ej. EBC / OEM)"
                  value={newPartBrand}
                  onChange={(e) => setNewPartBrand(e.target.value)}
                />
                <input
                  placeholder="Código SKU / OEM"
                  value={newPartCode}
                  onChange={(e) => setNewPartCode(e.target.value)}
                />
                <select
                  value={newPartCategory}
                  onChange={(e) => setNewPartCategory(e.target.value as PartSystemCategory)}
                >
                  {PART_SYSTEM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Diagnóstico pieza vieja retirada..."
                  value={newPartCondition}
                  onChange={(e) => setNewPartCondition(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Valor Bs (opcional)"
                  value={newPartCost}
                  onChange={(e) => setNewPartCost(e.target.value)}
                />
                <button
                  type="button"
                  className="mini-btn"
                  onClick={() => {
                    if (!newPartName.trim()) return
                    const costNum = Math.max(0, Number(newPartCost) || 0)
                    const sku =
                      newPartCode.trim().toUpperCase() ||
                      `OEM-${Math.floor(1000 + Math.random() * 8999)}`
                    const createdPart: ReplacedPartItem = {
                      id: `rp-${Date.now()}`,
                      partName: newPartName.trim(),
                      brand: newPartBrand.trim() || 'OEM Original',
                      partCode: sku,
                      systemCategory: newPartCategory,
                      oldPartCondition:
                        newPartCondition.trim() ||
                        'Reemplazado por desgaste detectado en revisión técnica.',
                      actionTaken: 'Reemplazado por nuevo',
                      installedBy: mechanic,
                      installedAt: 'Hoy · En taller',
                      warrantyMonths: Math.max(1, Number(newPartWarranty) || 6),
                      unitCost: costNum,
                      oldPartReturnedToClient: true,
                    }
                    setReplacedParts((prev) => [createdPart, ...prev])
                    if (costNum > 0) {
                      setQuoteItems((prev) => [
                        ...prev,
                        {
                          id: `q-${Date.now()}`,
                          description: `${createdPart.partName} (${sku})`,
                          amount: costNum,
                        },
                      ])
                    }
                    setNewPartName('')
                    setNewPartCode('')
                    setNewPartCondition('')
                    setNewPartCost('')
                    setNewPartWarranty('6')
                  }}
                >
                  <Plus style={{ width: '12px' }} /> Registrar pieza
                </button>
              </div>
            </div>
          </div>

          <div className="full-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '11px', color: '#667382' }}>
                Desglose de cotización (
                {order.quoteApproved ? 'Aprobada por cliente' : 'Pendiente de aprobación'})
              </strong>
              <strong style={{ fontSize: '13px' }}>Total: {formatCLP(totalQuote)}</strong>
            </div>

            <div className="quote-editor-list">
              {quoteItems.map((item) => (
                <div className="quote-editor-row" key={item.id}>
                  <input
                    value={item.description}
                    onChange={(e) =>
                      setQuoteItems((prev) =>
                        prev.map((q) =>
                          q.id === item.id ? { ...q, description: e.target.value } : q
                        )
                      )
                    }
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) =>
                      setQuoteItems((prev) =>
                        prev.map((q) =>
                          q.id === item.id ? { ...q, amount: Number(e.target.value) || 0 } : q
                        )
                      )
                    }
                  />
                  <button
                    type="button"
                    className="mini-btn"
                    onClick={() =>
                      setQuoteItems((prev) => prev.filter((q) => q.id !== item.id))
                    }
                    aria-label={`Eliminar ítem ${item.description}`}
                  >
                    <Trash2 style={{ width: '12px' }} />
                  </button>
                </div>
              ))}

              <div className="quote-editor-row">
                <input
                  placeholder="Añadir repuesto o mano de obra..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Monto Bs"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                />
                <button
                  type="button"
                  className="mini-btn"
                  onClick={() => {
                    const amt = Number(newItemAmount)
                    if (!newItemDesc.trim() || !amt) return
                    setQuoteItems((prev) => [
                      ...prev,
                      {
                        id: `q-${Date.now()}`,
                        description: newItemDesc.trim(),
                        amount: amt,
                      },
                    ])
                    setNewItemDesc('')
                    setNewItemAmount('')
                  }}
                >
                  <Plus style={{ width: '12px' }} /> Añadir
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          {!isMechanicRole ? (
            <button
              type="button"
              className="button danger"
              onClick={() => onDeleteOrder(order.id)}
            >
              <Trash2 /> Eliminar orden
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="button secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="button primary" onClick={handleSave}>
              <Check /> Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
