export type OrderStatus =
  | 'Agendado'
  | 'En diagnóstico'
  | 'En reparación'
  | 'Listo para entrega'
  | 'Entregado'

export type AccentTone = 'orange' | 'blue' | 'green' | 'purple'

export type UserRole = 'admin' | 'mechanic' | 'client'

export interface AuthSession {
  role: UserRole
  userName: string
  userSubtitle: string
  mechanicName?: string
  clientPlateOrOrder?: string
}

export type WhatsAppTemplateType =
  | 'diagnostico_ingreso'
  | 'avance_reparacion'
  | 'lista_entrega'
  | 'recordatorio_mantenimiento'
  | 'cobro_orden'

export type TransactionCategory =
  | 'Servicio'
  | 'Repuestos'
  | 'Insumos'
  | 'Arriendo / Fijos'
  | 'Sueldos y comisiones'
  | 'Servicios básicos (Luz/Agua/Net)'
  | 'Herramientas y equipos'
  | 'Impuestos / Contabilidad'
  | 'Otros'

export type PaymentMethod =
  | 'QR Simple'
  | 'Transferencia'
  | 'Efectivo'
  | 'Tarjeta Débito/Crédito'
  | 'Factura 30 días'

export type PaymentStatus = 'Pagado' | 'Pendiente de pago'

export type PartSystemCategory =
  | 'Transmisión'
  | 'Frenos'
  | 'Motor y Lubricación'
  | 'Eléctrico y Batería'
  | 'Suspensión y Neumáticos'
  | 'Inyección y Admisión'

export interface QuoteItem {
  id: string
  description: string
  amount: number
}

export interface ReplacedPartItem {
  id: string
  partName: string
  partCode: string
  brand: string
  systemCategory: PartSystemCategory
  oldPartCondition: string
  actionTaken: 'Reemplazado por nuevo' | 'Reparado / Calibrado' | 'En instalación'
  installedBy: string
  installedAt: string
  warrantyMonths: number
  unitCost: number
  oldPartReturnedToClient: boolean
}

export interface BikeSystemCheck {
  system: string
  status: 'Óptimo' | 'En intervención' | 'Atención sugerida'
  score: number
  observation: string
}

export interface IntakeChecklist {
  leftHelmet: boolean
  leftDocuments: boolean
  leftKeys: boolean
  leftToolsOrBag: boolean
  aestheticNotes: string
  clientConformitySigned: boolean
  clientConformitySignedAt?: string
}

export interface InventoryItem {
  id: string
  sku: string
  name: string
  brand: string
  category: PartSystemCategory
  stock: number
  minStock: number
  unitPriceBOB: number
}

export interface HistoryItem {
  id: string
  orderCode?: string
  date: string
  mileage?: string
  mechanic?: string
  service: string
  intakeDiagnosis?: string
  technicalResolution?: string
  partsChanged?: string[]
  warrantyStatus?: string
  amount: number
}

export interface WhatsAppLogItem {
  id: string
  sentAt: string
  template: WhatsAppTemplateType
  summary: string
}

export interface OrderTimeline {
  Agendado: string
  'En diagnóstico': string
  'En reparación': string
  'Listo para entrega': string
}

export interface Order {
  id: string
  bike: string
  plate: string
  client: string
  clientPin?: string
  clientNitOrCi?: string
  phone: string
  email: string
  service: string
  diagnosis: string
  mileage?: string
  fuelLevel?: string
  mechanic: string
  status: OrderStatus
  eta: string
  createdAt: string
  accent: AccentTone
  avatar: string
  mechanicNote: string
  mechanicNoteUpdatedAt: string
  quoteItems: QuoteItem[]
  quoteApproved: boolean
  quoteApprovedAt?: string
  paid?: boolean
  paidMethod?: PaymentMethod
  qrPaymentNotified?: boolean
  clientComment?: string
  photosCount: number
  timeline: OrderTimeline
  replacedParts: ReplacedPartItem[]
  healthCheck: BikeSystemCheck[]
  intakeChecklist?: IntakeChecklist
  nextServiceKm?: string
  history: HistoryItem[]
  whatsappLogs?: WhatsAppLogItem[]
}

export interface ActivityItem {
  id: string
  tone: 'orange' | 'green' | 'blue'
  iconType: 'wrench' | 'check' | 'image' | 'dollar' | 'plus' | 'whatsapp'
  actor: string
  action: string
  target: string
  orderId?: string
  time: string
  read: boolean
}

export interface FinanceTransaction {
  id: string
  date: string
  month: string
  description: string
  category: TransactionCategory
  type: 'income' | 'expense'
  amount: number
  paymentMethod?: PaymentMethod
  status?: PaymentStatus
  providerOrClient?: string
  invoiceOrDoc?: string
  orderId?: string
  notes?: string
}

export interface ExpenseCategorySummary {
  category: TransactionCategory
  amount: number
  count: number
  percentage: number
}

export interface PaymentMethodSummary {
  method: PaymentMethod
  amount: number
  count: number
  percentage: number
}

export interface MechanicPerformanceSummary {
  mechanic: string
  initials: string
  activeOrdersCount: number
  completedHistoryCount: number
  totalJobsCount: number
  activeRevenueBOB: number
  historicalRevenueBOB: number
  totalGeneratedBOB: number
  estimatedCommissionBOB: number
  partsInstalledCount: number
  avgHealthScore: number
  topSpecialty: string
  sharePercentage: number
}

export interface ServiceDemandSummary {
  serviceCategory: string
  sampleServiceName: string
  jobsCount: number
  totalRevenueBOB: number
  avgTicketBOB: number
  sharePercentage: number
  marketingTag: string
  recommendedPromoPriceBOB: number
}

export interface MarketingCampaignSuggestion {
  id: string
  badge: string
  title: string
  targetService: string
  promoHook: string
  promoPriceBOB: number
  normalPriceBOB: number
  socialCopy: string
  reelScript: string
  whatsappBroadcastText: string
  expectedImpact: string
  strategyTip?: string
  targetAudience?: string
}

export interface WorkshopSettings {
  workshopName: string
  workshopSubtitle: string
  workshopPhone: string
  workshopNit?: string
  bankName?: string
  bankAccount?: string
  whatsappSignature: string
  defaultLaborRate: number
  monthlyExpenseBudget: number
  adminName: string
  adminRole: string
  mechanics: string[]
  notificationsEnabled: boolean
}

export const STATUS_FLOW: OrderStatus[] = [
  'Agendado',
  'En diagnóstico',
  'En reparación',
  'Listo para entrega',
]

export const ALL_STATUSES: OrderStatus[] = [
  'Agendado',
  'En diagnóstico',
  'En reparación',
  'Listo para entrega',
  'Entregado',
]

export const PART_SYSTEM_CATEGORIES: PartSystemCategory[] = [
  'Transmisión',
  'Frenos',
  'Motor y Lubricación',
  'Eléctrico y Batería',
  'Suspensión y Neumáticos',
  'Inyección y Admisión',
]

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'Servicio',
  'Repuestos',
  'Insumos',
  'Arriendo / Fijos',
  'Sueldos y comisiones',
  'Servicios básicos (Luz/Agua/Net)',
  'Herramientas y equipos',
  'Impuestos / Contabilidad',
  'Otros',
]

export const PAYMENT_METHODS: PaymentMethod[] = [
  'QR Simple',
  'Transferencia',
  'Efectivo',
  'Tarjeta Débito/Crédito',
  'Factura 30 días',
]

export const QUICK_EXPENSE_PRESETS: {
  label: string
  description: string
  category: TransactionCategory
  amount: number
  providerOrClient: string
  paymentMethod: PaymentMethod
}[] = [
  {
    label: '+ Factura Repuestos (Bs)',
    description: 'Compra de repuestos originales y kits de transmisión',
    category: 'Repuestos',
    amount: 2400,
    providerOrClient: 'Importadora Imoto Bolivia S.R.L.',
    paymentMethod: 'Factura 30 días',
  },
  {
    label: '+ Lubricantes / Insumos (Bs)',
    description: 'Caja aceites sintéticos Motul 7100, limpiafrenos y filtros',
    category: 'Insumos',
    amount: 1350,
    providerOrClient: 'Distribuidora Motul Bolivia',
    paymentMethod: 'QR Simple',
  },
  {
    label: '+ Alquiler Taller (Bs)',
    description: 'Pago mensual alquiler galpón comercial MotoLab Bolivia',
    category: 'Arriendo / Fijos',
    amount: 4500,
    providerOrClient: 'Inmobiliaria Central S.R.L.',
    paymentMethod: 'Transferencia',
  },
  {
    label: '+ Sueldo / Comisión Mecánico',
    description: 'Liquidación sueldo base y comisiones por órdenes cerradas',
    category: 'Sueldos y comisiones',
    amount: 3800,
    providerOrClient: 'Equipo Técnico Taller',
    paymentMethod: 'QR Simple',
  },
  {
    label: '+ Luz / Agua / Internet',
    description: 'Electricidad trifásica compresor, agua potable y fibra óptica',
    category: 'Servicios básicos (Luz/Agua/Net)',
    amount: 850,
    providerOrClient: 'CRE / Saguapac / Entel Fibra',
    paymentMethod: 'QR Simple',
  },
  {
    label: '+ Herramientas / Equipos',
    description: 'Insumos de diagnóstico, torquímetro y mantención elevador',
    category: 'Herramientas y equipos',
    amount: 950,
    providerOrClient: 'Ferretería Industrial Würth Bolivia',
    paymentMethod: 'Tarjeta Débito/Crédito',
  },
]

export const QUICK_INCOME_PRESETS: {
  label: string
  description: string
  category: TransactionCategory
  amount: number
  providerOrClient: string
  paymentMethod: PaymentMethod
}[] = [
  {
    label: '+ Servicio Mantenimiento Preventivo (Bs)',
    description: 'Mantenimiento periódico, cambio de aceite sintético y revisión 25 puntos',
    category: 'Servicio',
    amount: 480,
    providerOrClient: 'Cliente Mostrador / Taller',
    paymentMethod: 'QR Simple',
  },
  {
    label: '+ Venta Repuestos Mostrador (Bs)',
    description: 'Venta directa de repuestos OEM, pastillas de freno o lubricantes',
    category: 'Repuestos',
    amount: 650,
    providerOrClient: 'Venta Directa Mostrador',
    paymentMethod: 'QR Simple',
  },
  {
    label: '+ Diagnóstico Escáner Electrónico (Bs)',
    description: 'Lectura de códigos OBD2, reseteo de cuerpo de aceleración y prueba de carga',
    category: 'Servicio',
    amount: 220,
    providerOrClient: 'Servicio Rápido Express',
    paymentMethod: 'Efectivo',
  },
  {
    label: '+ Facturación Flota Corporativa (Bs)',
    description: 'Liquidación mensual de mantenimiento preventivo para flota de reparto',
    category: 'Servicio',
    amount: 4200,
    providerOrClient: 'Convenio Flota Corporativa S.R.L.',
    paymentMethod: 'Factura 30 días',
  },
]

export const MONTHLY_CHART_DATA = [
  { month: 'May', label: 'Mayo 2024', incomePct: 38, expensePct: 18, baseIncome: 46500, baseExpense: 19800 },
  { month: 'Jun', label: 'Junio 2024', incomePct: 52, expensePct: 25, baseIncome: 58200, baseExpense: 22400 },
  { month: 'Jul', label: 'Julio 2024', incomePct: 44, expensePct: 21, baseIncome: 52600, baseExpense: 21100 },
  { month: 'Ago', label: 'Agosto 2024', incomePct: 70, expensePct: 34, baseIncome: 74500, baseExpense: 26800 },
  { month: 'Sep', label: 'Septiembre 2024', incomePct: 58, expensePct: 28, baseIncome: 63400, baseExpense: 24200 },
  { month: 'Oct', label: 'Octubre 2024', incomePct: 82, expensePct: 39, baseIncome: 84800, baseExpense: 28600 },
]

// Formateo determinista en Bolivianos (Bs) 100% libre de discrepancias de hidratación SSR/CSR
export function formatCLP(amount: number): string {
  const rounded = Math.round(Math.abs(amount))
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (amount < 0 ? '-Bs ' : 'Bs ') + formatted
}

export function formatCompactCLP(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = (amount / 1_000_000).toFixed(2).replace('.', ',')
    return `Bs ${millions}M`
  }
  return formatCLP(amount)
}

export const formatBOB = formatCLP
export const formatCompactBOB = formatCompactCLP

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'CL'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function calculateOrderTotal(order: Order): number {
  return order.quoteItems.reduce((sum, item) => sum + item.amount, 0)
}

export function calculateBikeHealthScore(order: Order): number {
  if (!order.healthCheck || order.healthCheck.length === 0) return 90
  const sum = order.healthCheck.reduce((acc, item) => acc + item.score, 0)
  return Math.round(sum / order.healthCheck.length)
}

export function getDefaultIntakeChecklist(): IntakeChecklist {
  return {
    leftHelmet: true,
    leftDocuments: false,
    leftKeys: true,
    leftToolsOrBag: false,
    aestheticNotes:
      'Recepción sin golpes estructurales; tanque, espejos y direccionales verificados en presencia del cliente.',
    clientConformitySigned: false,
  }
}

export function getDefaultHealthCheck(service: string): BikeSystemCheck[] {
  return [
    {
      system: 'Motor y Compresión',
      status: 'Óptimo',
      score: 94,
      observation: 'Compresión pareja, sin ruidos de distribución ni fugas en cárter.',
    },
    {
      system: 'Transmisión y Arrastre',
      status: 'En intervención',
      score: 82,
      observation: `Revisión y ajuste durante ${service.toLowerCase()}.`,
    },
    {
      system: 'Sistema de Frenos',
      status: 'Óptimo',
      score: 91,
      observation: 'Presión hidráulica firme y discos dentro de tolerancia nominal.',
    },
    {
      system: 'Sistema Eléctrico y Carga',
      status: 'Óptimo',
      score: 95,
      observation: 'Batería 12.8V en reposo y 14.1V regulando en ralentí.',
    },
    {
      system: 'Suspensión y Dirección',
      status: 'Óptimo',
      score: 90,
      observation: 'Retenes de telescópica secos y rodamientos de dirección sin juego.',
    },
    {
      system: 'Neumáticos y Seguridad',
      status: 'Óptimo',
      score: 89,
      observation: 'Presión calibrada (32/36 PSI) y dibujo sobre 3.5 mm.',
    },
  ]
}

export function getOrdersForMechanic(orders: Order[], mechanicName: string): Order[] {
  const clean = mechanicName.trim().toLowerCase()
  return orders.filter((o) => o.mechanic.trim().toLowerCase() === clean)
}

export function deductInventoryForReplacedPart(
  inventory: InventoryItem[],
  partCodeOrName: string
): { updatedInventory: InventoryItem[]; matchedItem: InventoryItem | null } {
  const clean = partCodeOrName.trim().toLowerCase()
  if (!clean) return { updatedInventory: inventory, matchedItem: null }

  let matched: InventoryItem | null = null
  const updatedInventory = inventory.map((item) => {
    if (
      !matched &&
      (item.sku.toLowerCase() === clean ||
        clean.includes(item.sku.toLowerCase()) ||
        item.name.toLowerCase().includes(clean) ||
        clean.includes(item.name.toLowerCase()))
    ) {
      matched = { ...item, stock: Math.max(0, item.stock - 1) }
      return matched
    }
    return item
  })

  return { updatedInventory, matchedItem: matched }
}

export function calculateExpenseBreakdown(
  transactions: FinanceTransaction[]
): ExpenseCategorySummary[] {
  const expenses = transactions.filter((t) => t.type === 'expense')
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0)
  if (totalExpense <= 0) return []

  const map = new Map<TransactionCategory, { amount: number; count: number }>()
  for (const tx of expenses) {
    const prev = map.get(tx.category) ?? { amount: 0, count: 0 }
    map.set(tx.category, { amount: prev.amount + tx.amount, count: prev.count + 1 })
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: Math.round((data.amount / totalExpense) * 100),
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function calculateIncomeCategoryBreakdown(
  transactions: FinanceTransaction[]
): ExpenseCategorySummary[] {
  const incomes = transactions.filter((t) => t.type === 'income')
  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0)
  if (totalIncome <= 0) return []

  const map = new Map<TransactionCategory, { amount: number; count: number }>()
  for (const tx of incomes) {
    const prev = map.get(tx.category) ?? { amount: 0, count: 0 }
    map.set(tx.category, { amount: prev.amount + tx.amount, count: prev.count + 1 })
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: Math.round((data.amount / totalIncome) * 100),
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function calculatePaymentMethodBreakdown(
  transactions: FinanceTransaction[],
  filterType: 'all' | 'income' | 'expense' = 'all'
): PaymentMethodSummary[] {
  const filtered =
    filterType === 'all' ? transactions : transactions.filter((t) => t.type === filterType)
  const total = filtered.reduce((sum, t) => sum + t.amount, 0)
  if (total <= 0) return []

  const map = new Map<PaymentMethod, { amount: number; count: number }>()
  for (const tx of filtered) {
    const method: PaymentMethod = tx.paymentMethod ?? 'Transferencia'
    const prev = map.get(method) ?? { amount: 0, count: 0 }
    map.set(method, { amount: prev.amount + tx.amount, count: prev.count + 1 })
  }

  return Array.from(map.entries())
    .map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      percentage: Math.round((data.amount / total) * 100),
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function calculateMechanicLeaderboard(
  orders: Order[],
  mechanicsList: string[] = ['Marco Ríos', 'Lucía Vidal']
): MechanicPerformanceSummary[] {
  const allNames = Array.from(
    new Set([
      ...mechanicsList,
      ...orders.map((o) => o.mechanic),
      ...orders.flatMap((o) => o.history.map((h) => h.mechanic).filter(Boolean) as string[]),
    ])
  )

  const rawStats = allNames.map((mechanic) => {
    const activeOrders = orders.filter(
      (o) => o.mechanic.trim().toLowerCase() === mechanic.trim().toLowerCase()
    )
    const activeRevenueBOB = activeOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0)

    const historyItems = orders.flatMap((o) =>
      o.history.filter(
        (h) => (h.mechanic || o.mechanic).trim().toLowerCase() === mechanic.trim().toLowerCase()
      )
    )
    const historicalRevenueBOB = historyItems.reduce((sum, h) => sum + h.amount, 0)

    const totalGeneratedBOB = activeRevenueBOB + historicalRevenueBOB
    // Comisión técnica estimada del mecánico en taller (32% sobre producción + bono por pieza instalada)
    const partsInstalledCount =
      activeOrders.reduce((sum, o) => sum + o.replacedParts.length, 0) +
      historyItems.reduce((sum, h) => sum + (h.partsChanged?.length ?? 0), 0)

    const estimatedCommissionBOB = Math.round(totalGeneratedBOB * 0.32 + partsInstalledCount * 25)

    const avgHealthScore =
      activeOrders.length > 0
        ? Math.round(
            activeOrders.reduce((sum, o) => sum + calculateBikeHealthScore(o), 0) /
              activeOrders.length
          )
        : 92

    const topSpecialty =
      activeOrders[0]?.replacedParts[0]?.systemCategory ||
      (mechanic.toLowerCase().includes('marco')
        ? 'Transmisión, Kit Arrastre & Frenos ABS'
        : mechanic.toLowerCase().includes('lucía') || mechanic.toLowerCase().includes('lucia')
          ? 'Mantenimiento Preventivo & Inyección'
          : 'Diagnóstico Multimarca & Motor')

    return {
      mechanic,
      initials: getInitials(mechanic),
      activeOrdersCount: activeOrders.length,
      completedHistoryCount: historyItems.length,
      totalJobsCount: activeOrders.length + historyItems.length,
      activeRevenueBOB,
      historicalRevenueBOB,
      totalGeneratedBOB,
      estimatedCommissionBOB,
      partsInstalledCount,
      avgHealthScore,
      topSpecialty,
    }
  })

  const grandTotal = rawStats.reduce((sum, item) => sum + item.totalGeneratedBOB, 0) || 1

  return rawStats
    .map((item) => ({
      ...item,
      sharePercentage: Math.round((item.totalGeneratedBOB / grandTotal) * 100),
    }))
    .sort((a, b) => b.totalGeneratedBOB - a.totalGeneratedBOB)
}

function classifyServiceBucket(serviceText: string): string {
  const lower = serviceText.toLowerCase()
  if (
    lower.includes('mantenimiento') ||
    lower.includes('mantención') ||
    lower.includes('aceite') ||
    lower.includes('5.000') ||
    lower.includes('10.000') ||
    lower.includes('válvula')
  ) {
    return 'Mantenimiento Preventivo y Lubricación'
  }
  if (
    lower.includes('arrastre') ||
    lower.includes('cadena') ||
    lower.includes('corona') ||
    lower.includes('transmisión') ||
    lower.includes('embrague')
  ) {
    return 'Kit de Arrastre y Transmisión'
  }
  if (lower.includes('freno') || lower.includes('pastilla') || lower.includes('disco')) {
    return 'Frenos Hidráulicos y Pastillas ABS'
  }
  if (
    lower.includes('eléctric') ||
    lower.includes('batería') ||
    lower.includes('estator') ||
    lower.includes('escáner') ||
    lower.includes('inyección')
  ) {
    return 'Diagnóstico Eléctrico e Inyección'
  }
  if (lower.includes('neumático') || lower.includes('llanta') || lower.includes('suspensión')) {
    return 'Neumáticos, Suspensión y Tren Delantero'
  }
  return 'Servicios Generales de Taller'
}

export function calculateTopServicesAnalytics(orders: Order[]): ServiceDemandSummary[] {
  const bucketMap = new Map<
    string,
    { jobsCount: number; totalRevenueBOB: number; sampleServiceName: string }
  >()

  for (const order of orders) {
    const bucket = classifyServiceBucket(order.service)
    const amount = calculateOrderTotal(order)
    const prev = bucketMap.get(bucket) ?? {
      jobsCount: 0,
      totalRevenueBOB: 0,
      sampleServiceName: order.service,
    }
    bucketMap.set(bucket, {
      jobsCount: prev.jobsCount + 1,
      totalRevenueBOB: prev.totalRevenueBOB + amount,
      sampleServiceName: prev.sampleServiceName,
    })

    for (const hist of order.history) {
      const hBucket = classifyServiceBucket(hist.service)
      const hPrev = bucketMap.get(hBucket) ?? {
        jobsCount: 0,
        totalRevenueBOB: 0,
        sampleServiceName: hist.service,
      }
      bucketMap.set(hBucket, {
        jobsCount: hPrev.jobsCount + 1,
        totalRevenueBOB: hPrev.totalRevenueBOB + hist.amount,
        sampleServiceName: hPrev.sampleServiceName,
      })
    }
  }

  const totalRev =
    Array.from(bucketMap.values()).reduce((sum, v) => sum + v.totalRevenueBOB, 0) || 1

  return Array.from(bucketMap.entries())
    .map(([serviceCategory, data]) => {
      const avgTicketBOB = Math.round(data.totalRevenueBOB / Math.max(1, data.jobsCount))
      const sharePercentage = Math.round((data.totalRevenueBOB / totalRev) * 100)
      let marketingTag = '⚡ Servicio recurrente'
      if (data.jobsCount >= 5) {
        marketingTag = '🔥 Trabajo #1 más solicitado (Ideal Publicidad)'
      } else if (avgTicketBOB >= 900) {
        marketingTag = '💎 Mayor ganancia por moto (Alto Ticket)'
      } else if (serviceCategory.includes('Frenos')) {
        marketingTag = '🛡️ Campaña Seguridad Vial (Alta conversión)'
      }

      return {
        serviceCategory,
        sampleServiceName: data.sampleServiceName,
        jobsCount: data.jobsCount,
        totalRevenueBOB: data.totalRevenueBOB,
        avgTicketBOB,
        sharePercentage,
        marketingTag,
        recommendedPromoPriceBOB: Math.max(120, Math.round((avgTicketBOB * 0.85) / 10) * 10),
      }
    })
    .sort((a, b) => b.totalRevenueBOB - a.totalRevenueBOB)
}

export function buildDynamicServiceCampaign({
  id,
  badge,
  serviceCategory,
  sampleServiceName,
  avgTicketBOB,
  promoPriceBOB,
  jobsCount,
  workshopName,
  workshopPhone,
  topMechanic,
  campaignKind,
}: {
  id: string
  badge: string
  serviceCategory: string
  sampleServiceName: string
  avgTicketBOB: number
  promoPriceBOB: number
  jobsCount: number
  workshopName: string
  workshopPhone: string
  topMechanic: string
  campaignKind: 'volumen' | 'rentabilidad' | 'especialidad'
}): MarketingCampaignSuggestion {
  const isOil =
    serviceCategory.includes('Mantenimiento') ||
    serviceCategory.includes('Lubricación') ||
    sampleServiceName.toLowerCase().includes('aceite')

  const isTransmission =
    serviceCategory.includes('Arrastre') ||
    serviceCategory.includes('Transmisión') ||
    sampleServiceName.toLowerCase().includes('cadena')

  const isBrakes =
    serviceCategory.includes('Frenos') ||
    sampleServiceName.toLowerCase().includes('pastilla') ||
    sampleServiceName.toLowerCase().includes('freno')

  const isElectric =
    serviceCategory.includes('Eléctrico') ||
    serviceCategory.includes('Inyección') ||
    sampleServiceName.toLowerCase().includes('escáner') ||
    sampleServiceName.toLowerCase().includes('batería')

  const isSuspension =
    serviceCategory.includes('Suspensión') ||
    serviceCategory.includes('Neumáticos') ||
    sampleServiceName.toLowerCase().includes('retén')

  if (isOil) {
    return {
      id,
      badge:
        campaignKind === 'volumen'
          ? '🔥 TRABAJO #1 MÁS SOLICITADO · ALTA ROTACIÓN'
          : badge,
      title: `Campaña ${campaignKind === 'volumen' ? 'Volumen' : 'Estrella'}: Mantenimiento Preventivo y Lubricación`,
      targetService: serviceCategory,
      promoHook: '¿Cuándo fue tu último cambio de aceite? Protege tu motor y evita reparaciones caras.',
      promoPriceBOB,
      normalPriceBOB: avgTicketBOB,
      strategyTip:
        '🎯 Atrae volumen masivo de clientes nuevos con un costo accesible de entrada. Al subir la moto a rampa para el cambio de aceite, el mecánico aplica la inspección multipunto de 6 sistemas y detecta frenos o transmisión gastada para cotizar trabajos adicionales.',
      targetAudience:
        'Motociclistas de uso diario, repartidores de delivery (PedidosYa/Yango) y dueños de motos de 125cc a 400cc.',
      socialCopy:
        `🏍️💨 ¿CUÁNDO FUE EL ÚLTIMO CAMBIO DE ACEITE DE TU MOTO? 💨🏍️\n\n` +
        `El calor y el tráfico degradan el aceite rápidamente. En ${workshopName.toUpperCase()} cuidamos el corazón de tu motocicleta para que rinda al 100%.\n\n` +
        `🎁 PACK MANTENIMIENTO PREVENTIVO PRO:\n` +
        `✅ Aceite 100% sintético Motul + Tamiz centrífugo limpio\n` +
        `✅ Bujía calibrada y filtro de aire OEM revisado\n` +
        `✅ Chequeo multipunto de 6 sistemas (frenos, cadena, batería, dirección)\n` +
        `✅ Lavado técnico y lubricación de piolas y mandos\n\n` +
        `💰 PRECIO PROMO: ${formatCLP(promoPriceBOB)} (Antes ${formatCLP(avgTicketBOB)})\n` +
        `⏱️ Tiempo en rampa: 45 min · Garantía oficial escrita\n` +
        `💳 Pagos: QR Simple Bolivia, Efectivo y Transferencia\n\n` +
        `📲 Reserva tu rampa por WhatsApp al ${workshopPhone} (Cupos diarios limitados).`,
      reelScript:
        `🎬 [0-3s] Primer plano a varilla sacando aceite negro y quemado: "¿Hace cuánto no le cambias el aceite a tu moto? Mira esto..."\n` +
        `🔧 [4-9s] ${topMechanic} drenando cárter, mostrando aceite Motul nuevo dorado y calibrando holgura de válvulas con galgas.\n` +
        `📲 [10-15s] Moto encendiendo con sonido parejo: "Mantenimiento preventivo completo por solo ${formatCLP(promoPriceBOB)} en ${workshopName}. ¡Escríbenos al WhatsApp antes del fin de semana!"`,
      whatsappBroadcastText:
        `Hola 👋 Te escribimos de *${workshopName}*. Queremos recordarte que el motor de tu moto necesita lubricación fresca para evitar desgaste. Esta semana activamos nuestra *Promo de Mantenimiento Preventivo Full* por solo *${formatCLP(promoPriceBOB)}* (incluye aceite sintético + revisión de 6 sistemas). ¿Te agendamos un turno para estos días?`,
      expectedImpact: `+${Math.max(6, jobsCount * 2)} motos agendadas en 7 días (Alta rotación y flujo constante de caja)`,
    }
  }

  if (isTransmission) {
    return {
      id,
      badge:
        campaignKind === 'rentabilidad'
          ? '💎 MAYOR GANANCIA POR MOTO · ALTO TICKET'
          : badge,
      title: 'Campaña Alto Ticket: Kit de Arrastre Reforzado y Transmisión',
      targetService: serviceCategory,
      promoHook: '¿Tu cadena tiene juego o salta al acelerar? No arriesgues tu seguridad en carretera.',
      promoPriceBOB,
      normalPriceBOB: avgTicketBOB,
      strategyTip:
        '🎯 Es el servicio con mayor margen de utilidad del taller (repuesto importado + mano de obra especializada). Atrae clientes de motos de media y alta cilindrada con un ticket superior a Bs 1.000.',
      targetAudience:
        'Dueños de Yamaha MT/FZ, Honda CB/Tornado, Kawasaki Z, KTM Duke y Bajaj Dominar 400.',
      socialCopy:
        `⚙️🏁 ¿TU CADENA TIENE JUEGO O LA CORONA TIENE DIENTES DE TIBURÓN? 🏁⚙️\n\n` +
        `Una cadena estirada puede cortarse y romper la tapa del cárter o trabar la rueda en plena carretera. ¡No te arriesgues!\n\n` +
        `🔧 PACK KIT DE ARRASTRE JAPONÉS GARANTIZADO:\n` +
        `✅ Cadena reforzada con O-Ring / X-Ring (DID Japan / JT)\n` +
        `✅ Corona y piñón de ataque de acero templado\n` +
        `✅ Instalación con remachadora hidráulica profesional\n` +
        `✅ Alineación y centrado láser por ${topMechanic}\n` +
        `📦 Te entregamos tus piezas viejas en caja para 100% transparencia\n\n` +
        `💥 PACK INSTALADO DESDE: ${formatCLP(promoPriceBOB)} (Normal: ${formatCLP(avgTicketBOB)})\n` +
        `🛡️ Garantía escrita de 6 a 12 meses\n\n` +
        `📲 Envíanos foto o modelo de tu moto al WhatsApp ${workshopPhone} y cotiza al instante.`,
      reelScript:
        `🎬 [0-4s] Comparación en mano: corona gastada con dientes afilados como sierra vs. corona y cadena DID dorada nueva.\n` +
        `🔧 [5-10s] ${topMechanic} usando remachadora hidráulica y torquímetro digital: "Nunca uses uniones con clip abierto en motos de potencia".\n` +
        `📲 [11-15s] Centrado láser de la rueda: "Instalación profesional garantizada en ${workshopName}. ¡Cotiza tu kit por WhatsApp!"`,
      whatsappBroadcastText:
        `Hola 👋 Desde *${workshopName}* te recordamos que revisar la tensión y desgaste del kit de arrastre es vital para tu seguridad. Esta semana tenemos *Instalación Bonificada* en Kits de Arrastre reforzados (desde ${formatCLP(promoPriceBOB)} con garantía escrita). ¿Nos mandas una foto de tu corona para decirte si aún aguanta?`,
      expectedImpact: `+${formatCLP(promoPriceBOB * 4)} en facturación proyectada con 4 órdenes`,
    }
  }

  if (isBrakes) {
    return {
      id,
      badge: '🛡️ SEGURIDAD VIAL · ALTA CONVERSIÓN',
      title: 'Campaña Seguridad: Frenos Deportivos y Purga DOT 4',
      targetService: serviceCategory,
      promoHook: '¿Tu freno chilla o la maneta se hunde? Frena en seco y con total seguridad.',
      promoPriceBOB,
      normalPriceBOB: avgTicketBOB,
      strategyTip:
        '🎯 Campaña de urgencia y seguridad vial: es la que tiene la mayor tasa de respuesta porque ningún motociclista quiere arriesgar su vida con frenos largos.',
      targetAudience:
        'Conductores que circulan en lluvia, motoviajeros y repartidores urbanos.',
      socialCopy:
        `🛑🏍️ ¿TU MOTO ESTÁ FRENANDO LARGO O CHILLA AL PARAR? 🏍️🛑\n\n` +
        `En dos ruedas los frenos son tu vida. La humedad y el desgaste reducen drásticamente la capacidad de frenado.\n\n` +
        `🛡️ SERVICIO INTEGRAL DE FRENOS DEPORTIVOS:\n` +
        `✅ Pastillas sinterizadas de alto agarre térmico (EBC / Brembo OEM)\n` +
        `✅ Purga completa con líquido de freno sintético DOT 4\n` +
        `✅ Limpieza y lubricación de pistones de cáliper\n` +
        `✅ Chequeo de disco y sensores ABS con escáner\n\n` +
        `💰 PRECIO ESPECIAL: ${formatCLP(promoPriceBOB)} (Normal: ${formatCLP(avgTicketBOB)})\n` +
        `⚡ Listo en 40 minutos con prueba de frenado certificada\n\n` +
        `📲 Agenda tu rampa express al WhatsApp ${workshopPhone}`,
      reelScript:
        `🎬 [0-3s] Calibrador digital midiendo pastilla gastada con menos de 1 mm: "¡Mira lo cerca que estaba este cliente de romper su disco de freno!"\n` +
        `🔧 [4-9s] Purga de líquido viejo oscuro con máquina de vacío y montaje de pastillas nuevas con grasa de cobre anti-ruido.\n` +
        `📲 [10-15s] Maneta dura y tacto preciso al frenar: "Frena al instante. Agenda tu mantenimiento de frenos en ${workshopName} por WhatsApp".`,
      whatsappBroadcastText:
        `Hola 👋 En *${workshopName}* cuidamos tu seguridad. Si sientes la maneta de freno esponjosa o escuchas ruidos al detenerte, aprovecha nuestra *Promo de Frenos y Purga DOT 4* por solo *${formatCLP(promoPriceBOB)}*. ¿Te gustaría que le demos una revisada rápida hoy?`,
      expectedImpact: `+${formatCLP(promoPriceBOB * 5)} proyectados con 5 servicios de frenos rápidos`,
    }
  }

  if (isElectric) {
    return {
      id,
      badge: '⚡ TECNOLOGÍA Y PRECISIÓN · AUTORIDAD TÉCNICA',
      title: 'Campaña Autoridad: Escáner de Inyección y Diagnóstico Eléctrico',
      targetService: serviceCategory,
      promoHook: 'Diagnóstico por escáner OBD2 sin adivinanzas ni gastos innecesarios.',
      promoPriceBOB,
      normalPriceBOB: avgTicketBOB,
      strategyTip:
        '🎯 Posiciona al taller como el referente técnico más avanzado de la ciudad. Trae clientes frustrados con otros talleres que no pudieron encontrar fallas eléctricas o de sensores.',
      targetAudience:
        'Motos a inyección electrónica (EFI), motos con fallas de arranque en frío o testigos en tablero.',
      socialCopy:
        `⚡🏍️ ¿TU MOTO NO ENCIENDE EN FRÍO O SE APAGA EN PLENA MARCHA? 🏍️⚡\n\n` +
        `¡Basta de adivinar y cambiar piezas por gusto! En ${workshopName} diagnosticamos con escáner de inyección y banco electrónico.\n\n` +
        `🔬 DIAGNÓSTICO ELECTRÓNICO AVANZADO:\n` +
        `✅ Lectura de códigos de falla ECU / Check Engine\n` +
        `✅ Medición de estator trifásico y regulador rectificador MOSFET\n` +
        `✅ Prueba de conductancia CCA y vida útil de batería\n` +
        `✅ Prueba de presión de bomba de gasolina e inyectores\n\n` +
        `💡 PRECIO PROMO: ${formatCLP(promoPriceBOB)} (Normal: ${formatCLP(avgTicketBOB)})\n` +
        `📋 Te entregamos informe computarizado impreso y en WhatsApp\n\n` +
        `📲 Reserva tu rampa de escaneo al ${workshopPhone}`,
      reelScript:
        `🎬 [0-4s] Luz Check Engine parpadeando en tablero de moto o motor que no da chispa: "¿Tu moto te hace renegar al encender?"\n` +
        `🔧 [5-10s] ${topMechanic} conectando escáner portátil, mostrando gráfica de sensores en pantalla y regulador marcando 14.4V estables.\n` +
        `📲 [11-15s] Moto rugiendo al primer toque del botón: "Diagnóstico certero con escáner profesional en ${workshopName}. ¡Escríbenos!"`,
      whatsappBroadcastText:
        `Hola 👋 Te saludamos de *${workshopName}*. Si tu moto ha tenido tirones, fallas de arranque o luces en el tablero, esta semana tenemos disponible nuestra rampa de *Escáner Electrónico + Chequeo Eléctrico* a precio especial de *${formatCLP(promoPriceBOB)}*. Responde para reservar tu horario.`,
      expectedImpact: `+${formatCLP(promoPriceBOB * 4)} atrayendo clientes de alto valor técnico`,
    }
  }

  if (isSuspension) {
    return {
      id,
      badge: '🏁 ESTABILIDAD Y CONFORT EN RUTA',
      title: 'Campaña Confort: Mantenimiento de Suspensión y Retenes',
      targetService: serviceCategory,
      promoHook: 'Adiós a las vibraciones y fugas de aceite en la horquilla delantera.',
      promoPriceBOB,
      normalPriceBOB: avgTicketBOB,
      strategyTip:
        '🎯 Servicio altamente visual: muestra fotos de barras manchadas de aceite para activar el deseo de reparación inmediata antes de que arruine las pastillas de freno.',
      targetAudience:
        'Motociclistas que transitan por baches, motoviajeros y repartidores.',
      socialCopy:
        `🛞🏁 ¿TIENES FUGA DE ACEITE EN LAS BARRAS O TU MOTO SALTA DEMASIADO? 🏁🛞\n\n` +
        `El aceite de suspensión desgastado arruina tus frenos y hace que la moto sea inestable en curvas.\n\n` +
        `🔧 SERVICIO DE SUSPENSIÓN Y TREN DELANTERO:\n` +
        `✅ Cambio de retenes y guardapolvos de horquilla\n` +
        `✅ Aceite de suspensión hidráulico graduado por peso y cilindrada\n` +
        `✅ Revisión de rodamientos de dirección cónicos\n` +
        `✅ Montaje y balanceo de neumático con presión exacta\n\n` +
        `💥 PACK INSTALADO: ${formatCLP(promoPriceBOB)} (Normal: ${formatCLP(avgTicketBOB)})\n` +
        `🛡️ Garantía de estanqueidad y confort en ruta\n\n` +
        `📲 Cotiza tu modelo de moto por WhatsApp al ${workshopPhone}`,
      reelScript:
        `🎬 [0-4s] Barra de suspensión manchada de aceite aceitoso chorreando hacia el freno: "Esto es lo que pasa cuando se rompe un retén..."\n` +
        `🔧 [5-10s] ${topMechanic} desarmando botella, limpiando flauta y cargando aceite nuevo con probeta graduada.\n` +
        `📲 [11-15s] Suspensión trabajando suave y firme: "Maneja seguro y sin baches extraños. ¡Cotiza tu suspensión en ${workshopName}!"`,
      whatsappBroadcastText:
        `Hola 👋 En *${workshopName}* tenemos en promo esta semana el *Mantenimiento de Suspensión Delantera* por *${formatCLP(promoPriceBOB)}* (incluye retenes + aceite de horquilla). Responde este mensaje si deseas agendar tu moto.`,
      expectedImpact: `+${formatCLP(promoPriceBOB * 3)} en facturación de tren delantero`,
    }
  }

  // Servicios Generales por defecto
  return {
    id,
    badge: '🔧 SERVICIO DE CONFIANZA EN TALLER',
    title: `Campaña Especial: ${serviceCategory}`,
    targetService: serviceCategory,
    promoHook: `Mantenimiento profesional garantizado para tu moto en ${workshopName}.`,
    promoPriceBOB,
    normalPriceBOB: avgTicketBOB,
    strategyTip:
      '🎯 Ofrece una puesta a punto integral para conductores que quieren dejar su moto al día antes de viajar o para empezar la semana laboral.',
    targetAudience: 'Conductores de motocicletas urbanas y deportivas.',
    socialCopy:
      `🏍️🔧 ¡DEJA TU MOTO A PUNTO EN ${workshopName.toUpperCase()}! 🔧🏍️\n\n` +
      `¿Sientes ruidos extraños o falta de potencia? En ${workshopName} revisamos tu moto a fondo con repuestos originales y trazabilidad OEM.\n\n` +
      `✅ Revisión multipunto integral de seguridad\n` +
      `✅ Ajuste general de chasis con torquímetro\n` +
      `✅ Reporte técnico digital y seguimiento en vivo por WhatsApp\n\n` +
      `💰 PRECIO ESPECIAL: ${formatCLP(promoPriceBOB)} (Normal: ${formatCLP(avgTicketBOB)})\n\n` +
      `📲 Escríbenos al WhatsApp ${workshopPhone} para reservar rampa.`,
    reelScript:
      `🎬 [0-4s] ${topMechanic} recibiendo moto en rampa de taller: "Tu moto merece atención profesional y repuestos de verdad".\n` +
      `🔧 [5-10s] Proceso de desmontaje, limpieza y ajuste con herramientas de precisión.\n` +
      `📲 [11-15s] Cliente recibiendo su moto lista y recibo oficial: "Agenda hoy en ${workshopName}!"`,
    whatsappBroadcastText:
      `Hola 👋 Desde *${workshopName}* te recordamos que tenemos turnos disponibles para *${serviceCategory}* con precio especial de *${formatCLP(promoPriceBOB)}*. ¿Te reservamos un horario esta semana?`,
    expectedImpact: `+${Math.max(4, jobsCount)} motos agendadas en 7 días`,
  }
}

export function generateMarketingCampaigns(
  orders: Order[],
  inventory: InventoryItem[],
  workshopName = 'MotoLab Bolivia',
  workshopPhone = '+591 7642-3390'
): MarketingCampaignSuggestion[] {
  const topServices = calculateTopServicesAnalytics(orders)
  const mechanics = calculateMechanicLeaderboard(orders)
  const topMechanic = mechanics[0]?.mechanic ?? 'Marco Ríos'

  // 1. Servicio más vendido / pedido por volumen (más órdenes)
  const mostPopular =
    topServices.slice().sort((a, b) => b.jobsCount - a.jobsCount)[0] ?? topServices[0]

  // 2. Servicio de mayor ganancia / alto ticket (garantizar que sea diferente del más popular para dar variedad estratégica)
  const highestTicket =
    topServices
      .filter((s) => s.serviceCategory !== mostPopular?.serviceCategory)
      .sort((a, b) => b.avgTicketBOB - a.avgTicketBOB)[0] ??
    topServices.find((s) => s.serviceCategory !== mostPopular?.serviceCategory) ??
    topServices[1] ??
    topServices[0]

  // 3. Repuesto con mayor stock en bodega para liquidación
  const highStockItem =
    inventory.slice().sort((a, b) => b.stock - a.stock)[0] ?? inventory[0]

  const popularNormal = mostPopular ? mostPopular.avgTicketBOB : 450
  const popularPromo = mostPopular ? mostPopular.recommendedPromoPriceBOB : 380

  const highTicketNormal = highestTicket ? highestTicket.avgTicketBOB : 1450
  const highTicketPromo = highestTicket ? highestTicket.recommendedPromoPriceBOB : 1250

  // Campaña 1: Más vendido (Volumen)
  const campVolumen = buildDynamicServiceCampaign({
    id: 'camp-volumen',
    badge: '🔥 BASADO EN EL TRABAJO QUE MÁS SALIÓ ESTE MES',
    serviceCategory: mostPopular?.serviceCategory || 'Mantenimiento Preventivo y Lubricación',
    sampleServiceName: mostPopular?.sampleServiceName || 'Mantenimiento preventivo',
    avgTicketBOB: popularNormal,
    promoPriceBOB: popularPromo,
    jobsCount: mostPopular?.jobsCount ?? 6,
    workshopName,
    workshopPhone,
    topMechanic,
    campaignKind: 'volumen',
  })

  // Campaña 2: Mayor ganancia (Alto Ticket)
  const campRentabilidad = buildDynamicServiceCampaign({
    id: 'camp-rentabilidad',
    badge: '💎 SERVICIO QUE MÁS DINERO DEJÓ AL TALLER',
    serviceCategory: highestTicket?.serviceCategory || 'Kit de Arrastre y Transmisión',
    sampleServiceName: highestTicket?.sampleServiceName || 'Cambio de kit de arrastre',
    avgTicketBOB: highTicketNormal,
    promoPriceBOB: highTicketPromo,
    jobsCount: highestTicket?.jobsCount ?? 3,
    workshopName,
    workshopPhone,
    topMechanic,
    campaignKind: 'rentabilidad',
  })

  // Campaña 3: Stock en bodega (Rotación de Inventario)
  const stockNormal = highStockItem ? highStockItem.unitPriceBOB + 180 : 310
  const stockPromo = highStockItem ? highStockItem.unitPriceBOB + 110 : 240
  const campStock: MarketingCampaignSuggestion = {
    id: 'camp-stock-bodega',
    badge: '📦 CAMPAÑA INTELIGENTE DE STOCK EN BODEGA',
    title: `Promo Rotación: ${highStockItem?.name || 'Insumos en Bodega'}`,
    targetService: highStockItem?.category || 'Motor y Lubricación',
    promoHook: `Aprovecha nuestras ${highStockItem?.stock ?? 14} unidades de ${highStockItem?.name || 'repuestos'} con mano de obra bonificada.`,
    promoPriceBOB: stockPromo,
    normalPriceBOB: stockNormal,
    strategyTip:
      '🎯 Transforma repuestos detenidos en efectivo líquido inmediato para pagar gastos fijos del taller. Al ofrecer la mano de obra a precio combo, atraes clientes que solo tenían pensado comprar el repuesto por su cuenta.',
    targetAudience:
      'Motociclistas que buscan ahorrar en repuestos originales sin perder la garantía del taller.',
    socialCopy:
      `🚨 STOCK RECIÉN LLEGADO A ${workshopName.toUpperCase()} 🚨\n\n` +
      `Tenemos disponibles ${highStockItem?.stock ?? 14} unidades de *${highStockItem?.name || 'Aceite Sintético Motul 7100'}* (${highStockItem?.brand || 'OEM'}) listos para instalación inmediata.\n\n` +
      `🎁 *PROMO COMBO LIQUIDACIÓN:*\n` +
      `✅ Repuesto original con trazabilidad SKU: ${highStockItem?.sku || 'OEM'}\n` +
      `✅ Mano de obra bonificada de instalación en rampa\n` +
      `✅ Chequeo de seguridad de 6 sistemas GRATIS\n\n` +
      `💰 *Total Pack Express:* ${formatCLP(stockPromo)} (Normal: ${formatCLP(stockNormal)})\n` +
      `📲 Escríbenos al ${workshopPhone} antes de que se agoten las ${highStockItem?.stock ?? 14} unidades.`,
    reelScript:
      `🎬 [0-4s]: Mostrar estantería con ${highStockItem?.name || 'repuesto'} en bodega del taller: "Tenemos ${highStockItem?.stock ?? 14} unidades listas para entrega".\n` +
      `🔧 [5-10s]: Instalación express en rampa por ${topMechanic} con torquímetro.\n` +
      `📲 [11-15s]: "Solo por esta semana a ${formatCLP(stockPromo)} con QR Simple. ¡Reserva por WhatsApp!"`,
    whatsappBroadcastText:
      `Hola 👋 En *${workshopName}* acabamos de habilitar una *Promo Combo* con nuestro stock de *${highStockItem?.name || 'repuestos'}* + chequeo preventivo por solo *${formatCLP(stockPromo)}*. ¿Te reservamos cupo para hoy o mañana?`,
    expectedImpact: 'Convierte stock detenido de bodega en liquidez inmediata en Bs',
  }

  // Campañas adicionales para todos los otros servicios analizados en el taller
  const extraCampaigns = topServices
    .filter(
      (s) =>
        s.serviceCategory !== campVolumen.targetService &&
        s.serviceCategory !== campRentabilidad.targetService
    )
    .map((s, idx) =>
      buildDynamicServiceCampaign({
        id: `camp-servicio-${idx + 4}`,
        badge: s.marketingTag.toUpperCase(),
        serviceCategory: s.serviceCategory,
        sampleServiceName: s.sampleServiceName,
        avgTicketBOB: s.avgTicketBOB,
        promoPriceBOB: s.recommendedPromoPriceBOB,
        jobsCount: s.jobsCount,
        workshopName,
        workshopPhone,
        topMechanic,
        campaignKind: 'especialidad',
      })
    )

  return [campVolumen, campRentabilidad, campStock]
}

export function getNextStatus(current: OrderStatus): OrderStatus {
  if (current === 'Agendado') return 'En diagnóstico'
  if (current === 'En diagnóstico') return 'En reparación'
  if (current === 'En reparación') return 'Listo para entrega'
  return 'Listo para entrega'
}

export function getPrevStatus(current: OrderStatus): OrderStatus {
  if (current === 'Entregado') return 'Listo para entrega'
  if (current === 'Listo para entrega') return 'En reparación'
  if (current === 'En reparación') return 'En diagnóstico'
  if (current === 'En diagnóstico') return 'Agendado'
  return 'Agendado'
}

export const STATUS_META: Record<
  OrderStatus,
  {
    shortLabel: string
    liveLabel: string
    progressPct: number
    cssState: 'state-agendado' | 'state-diagnostico' | 'state-reparacion' | 'state-listo' | 'state-entregado'
  }
> = {
  Agendado: {
    shortLabel: '1. Agendado',
    liveLabel: 'Recepcionada · En fila técnica',
    progressPct: 25,
    cssState: 'state-agendado',
  },
  'En diagnóstico': {
    shortLabel: '2. Diagnóstico',
    liveLabel: 'Escáner e inspección multipunto activa',
    progressPct: 55,
    cssState: 'state-diagnostico',
  },
  'En reparación': {
    shortLabel: '3. Reparación',
    liveLabel: 'En rampa mecánica · Intervención en vivo',
    progressPct: 80,
    cssState: 'state-reparacion',
  },
  'Listo para entrega': {
    shortLabel: '4. Lista',
    liveLabel: 'Control de calidad superado · Lista para retiro',
    progressPct: 100,
    cssState: 'state-listo',
  },
  Entregado: {
    shortLabel: 'Entregada',
    liveLabel: 'Entregada en conformidad al cliente',
    progressPct: 100,
    cssState: 'state-entregado',
  },
}

export function sanitizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D+/g, '')
  if (!digits) return '59176423390'
  if (digits.startsWith('591')) return digits
  if (digits.length === 8 && (digits.startsWith('6') || digits.startsWith('7'))) {
    return `591${digits}`
  }
  return digits
}

export function buildWhatsAppMessage(
  order: Order,
  template: WhatsAppTemplateType,
  workshopName = 'MotoLab Bolivia',
  signature = 'Equipo Técnico MotoLab Bolivia',
  trackingBaseUrl?: string
): string {
  const total = formatCLP(calculateOrderTotal(order))
  const itemsList = order.quoteItems
    .map((item) => `  • ${item.description}: ${formatCLP(item.amount)}`)
    .join('\n')

  const partsText =
    order.replacedParts && order.replacedParts.length > 0
      ? `\n🔩 *Piezas cambiadas / intervenidas por ${order.mechanic}:*\n` +
        order.replacedParts
          .map(
            (p) =>
              `  • ${p.partName} (${p.brand} · SKU ${p.partCode}) — Garantía ${p.warrantyMonths} meses`
          )
          .join('\n') +
        '\n'
      : ''

  const trackingLinkText = trackingBaseUrl
    ? `\n📲 *Seguimiento en vivo y expediente digital (sin clave):*\n${trackingBaseUrl.replace(/\/$/, '')}/?placa=${encodeURIComponent(order.plate)}\n`
    : ''

  if (template === 'diagnostico_ingreso') {
    return (
      `Hola *${order.client}* 👋, te escribimos de *${workshopName}* respecto a tu motocicleta *${order.bike}* (Placa *${order.plate}*, Orden *${order.id}*).\n\n` +
      `📋 *Diagnóstico de ingreso al taller:*\n"${order.diagnosis}"\n\n` +
      `🔧 *Trabajo que se le está realizando:*\n${order.service}\n\n` +
      `👨‍🔧 *Nota de tu mecánico (${order.mechanic}):*\n"${order.mechanicNote}"\n` +
      partsText +
      `\n💰 *Presupuesto desglosado en Bolivianos (${order.quoteApproved ? 'Aprobado' : 'Pendiente de aprobación'}):*\n${itemsList}\n*Total estimado:* ${total}\n\n` +
      `⏰ *Entrega estimada:* ${order.eta}\n` +
      trackingLinkText +
      `— ${signature}`
    )
  }

  if (template === 'avance_reparacion') {
    return (
      `Hola *${order.client}* 👋, te enviamos una actualización en vivo de tu *${order.bike}* (*${order.plate}*) en *${workshopName}*:\n\n` +
      `📌 *Estado actual:* ${order.status}\n` +
      `🩺 *Diagnóstico con el que ingresó:* ${order.diagnosis}\n` +
      `🛠️ *Lo que estamos haciendo ahora:* ${order.service}\n` +
      `💬 *Reporte técnico de ${order.mechanic}:*\n"${order.mechanicNote}"\n` +
      partsText +
      `\n⏰ *Entrega estimada:* ${order.eta}\n` +
      trackingLinkText +
      `— ${signature}`
    )
  }

  if (template === 'lista_entrega') {
    return (
      `¡Buenas noticias, *${order.client}*! 🎉 Tu *${order.bike}* (Placa *${order.plate}*, Orden *${order.id}*) ya está *LISTA PARA ENTREGA* en *${workshopName}*.\n\n` +
      `📋 *Diagnóstico inicial:* ${order.diagnosis}\n` +
      `✅ *Trabajo completado:* ${order.service}\n` +
      `💬 *Resumen final de ${order.mechanic}:*\n"${order.mechanicNote}"\n` +
      partsText +
      `\n💳 *Total final:* ${total} (Puedes pagar en taller o por QR Simple Bolivia)\n` +
      `Puedes pasar a retirarla en nuestro horario de atención. ¡Te esperamos!\n` +
      trackingLinkText +
      `— ${signature}`
    )
  }

  if (template === 'cobro_orden') {
    return (
      `Hola *${order.client}* 👋, te escribimos de *${workshopName}* con la orden y liquidación de tu motocicleta *${order.bike}* (Placa *${order.plate}*, Orden *${order.id}*):\n\n` +
      `🛠️ *Reparación realizada:* ${order.service}\n` +
      `📋 *Diagnóstico:* "${order.diagnosis}"\n` +
      `👨‍🔧 *Mecánico a cargo:* ${order.mechanic}\n` +
      partsText +
      `\n💰 *Detalle de la cuenta a liquidar:*\n${itemsList}\n` +
      `💵 *TOTAL A PAGAR: ${total}*\n` +
      `📌 *Estado del pago:* ${order.paid ? '✅ Pagado' : '⏳ Pendiente de cobro en caja'}\n\n` +
      `💳 *Medios de pago disponibles:*\n` +
      `• QR Simple Bolivia (Banco Unión, BNB, BCP o cualquier banco)\n` +
      `• Transferencia Bancaria Directa\n` +
      `• Efectivo o Tarjeta en caja del taller\n\n` +
      `Por favor, envíanos tu comprobante o confirma tu pago por este chat.\n` +
      trackingLinkText +
      `— ${signature}`
    )
  }

  return (
    `Hola *${order.client}* 👋, te enviamos un recordatorio desde *${workshopName}* para tu *${order.bike}* (Placa *${order.plate}*).\n\n` +
    `🔎 *Último diagnóstico registrado:* ${order.diagnosis}\n` +
    `🔧 *Servicio asociado (${order.id}):* ${order.service}\n` +
    `📌 *Nota del taller:* "${order.mechanicNote}"\n` +
    partsText +
    `\nResponde a este mensaje si deseas confirmar horario o tienes cualquier consulta.\n` +
    trackingLinkText +
    `— ${signature}`
  )
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = sanitizePhoneForWhatsApp(phone)
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function buildClientTechnicalCertificate(
  order: Order,
  workshopName = 'MotoLab Bolivia'
): string {
  const healthScore = calculateBikeHealthScore(order)
  const total = formatCLP(calculateOrderTotal(order))
  const checklist = order.intakeChecklist ?? getDefaultIntakeChecklist()
  const partsLines =
    order.replacedParts.length > 0
      ? order.replacedParts
          .map(
            (p, idx) =>
              `${idx + 1}. ${p.partName} | Marca: ${p.brand} | Código OEM/SKU: ${p.partCode}\n` +
              `   - Sistema: ${p.systemCategory} | Acción: ${p.actionTaken}\n` +
              `   - Diagnóstico de pieza reemplazada: ${p.oldPartCondition}\n` +
              `   - Instalado por: ${p.installedBy} (${p.installedAt}) | Garantía: ${p.warrantyMonths} meses\n` +
              `   - Pieza usada guardada para cliente: ${p.oldPartReturnedToClient ? 'Sí (En caja de entrega)' : 'Descarte ecológico'}`
          )
          .join('\n')
      : 'Sin reemplazo de componentes registrado en esta orden.'

  const historyLines =
    order.history.length > 0
      ? order.history
          .map(
            (h) =>
              `• [${h.date}] ${h.orderCode || 'OT-HIST'} (${h.mileage || 'S/KM'}) — ${h.service}\n` +
              `  Diagnóstico ingreso: ${h.intakeDiagnosis || 'Mantenimiento preventivo programado'}\n` +
              `  Resolución: ${h.technicalResolution || 'Servicio completado según manual'}\n` +
              `  Piezas cambiadas: ${(h.partsChanged ?? []).join(', ') || 'Insumos menores'} | Monto: ${formatCLP(h.amount)}`
          )
          .join('\n')
      : 'Sin visitas previas registradas.'

  return [
    `===================================================================`,
    `CERTIFICADO TÉCNICO Y NOTA DE RESPALDO — ${workshopName.toUpperCase()}`,
    `===================================================================`,
    `Orden de Trabajo : ${order.id} (${order.status})`,
    `Fecha de Ingreso : ${order.createdAt}`,
    `Cliente          : ${order.client} | CI / NIT: ${order.clientNitOrCi || 'S/N'}`,
    `Contacto         : ${order.phone} · ${order.email}`,
    `Motocicleta      : ${order.bike} | Placa: ${order.plate}`,
    `Recepción        : Kilometraje ${order.mileage || '15.000 km'} | Combustible ${order.fuelLevel || '1/2 tanque'}`,
    `Mecánico a Cargo : ${order.mechanic}`,
    `Índice de Salud  : ${healthScore}% (Inspección multipunto de 6 sistemas)`,
    `Próximo Servicio : ${order.nextServiceKm || 'En 5.000 km o 6 meses'}`,
    ``,
    `0. ACTA DE RECEPCIÓN FÍSICA / INVENTARIO ANTI-RECLAMOS`,
    `-------------------------------------------------------------------`,
    `Objetos dejados  : Casco [${checklist.leftHelmet ? 'SÍ' : 'NO'}] | Documentos RUAT/SOAT [${checklist.leftDocuments ? 'SÍ' : 'NO'}] | Llave [${checklist.leftKeys ? 'SÍ' : 'NO'}] | Herramientas [${checklist.leftToolsOrBag ? 'SÍ' : 'NO'}]`,
    `Estado estético  : "${checklist.aestheticNotes}"`,
    `Conformidad      : ${checklist.clientConformitySigned ? `FIRMADA POR CLIENTE (${checklist.clientConformitySignedAt || 'Verificado'})` : 'Pendiente de firma digital'}`,
    ``,
    `1. DIAGNÓSTICO DE INGRESO AL TALLER`,
    `-------------------------------------------------------------------`,
    `"${order.diagnosis}"`,
    ``,
    `2. INTERVENCIÓN ACTUAL Y NOTA TÉCNICA DEL MECÁNICO`,
    `-------------------------------------------------------------------`,
    `Servicio principal : ${order.service}`,
    `Reporte técnico    : "${order.mechanicNote}" (Actualizado: ${order.mechanicNoteUpdatedAt})`,
    ``,
    `3. TRAZABILIDAD DE PIEZAS CAMBIADAS EN TALLER (${order.replacedParts.length})`,
    `-------------------------------------------------------------------`,
    partsLines,
    ``,
    `4. PRESUPUESTO EN BOLIVIANOS (Bs) Y ESTADO DE APROBACIÓN`,
    `-------------------------------------------------------------------`,
    `Estado cotización: ${order.quoteApproved ? 'APROBADA POR EL CLIENTE' : 'PENDIENTE DE APROBACIÓN'}`,
    ...order.quoteItems.map((q) => `  - ${q.description}: ${formatCLP(q.amount)}`),
    `TOTAL ORDEN: ${total} (${order.paid ? 'PAGADO' : 'PENDIENTE DE PAGO'})`,
    ``,
    `5. HISTORIAL CLÍNICO DE DIAGNÓSTICOS Y MANTENCIONES PREVIAS`,
    `-------------------------------------------------------------------`,
    historyLines,
    `===================================================================`,
  ].join('\n')
}

export const defaultSettings: WorkshopSettings = {
  workshopName: 'MotoLab Bolivia',
  workshopSubtitle: 'Taller Especializado · Bolivia',
  workshopPhone: '+591 7700 1234',
  workshopNit: '3849201015',
  bankName: 'Banco Unión / BNB — QR Simple Bolivia',
  bankAccount: 'Cta. Corriente Bs: 1000-482910-01',
  whatsappSignature: 'Equipo Técnico MotoLab Bolivia',
  defaultLaborRate: 250,
  monthlyExpenseBudget: 32000,
  adminName: 'Marco Ríos',
  adminRole: 'Administrador General',
  mechanics: ['Marco Ríos', 'Lucía Vidal', 'Carlos Méndez'],
  notificationsEnabled: true,
}

export const initialInventoryData: InventoryItem[] = [
  {
    id: 'inv-1',
    sku: 'DID-525VX3-108ZB',
    name: 'Kit de arrastre DID 525VX3 Gold + Corona JT',
    brand: 'DID Japan',
    category: 'Transmisión',
    stock: 2,
    minStock: 3,
    unitPriceBOB: 1250,
  },
  {
    id: 'inv-2',
    sku: 'MOT-7100-10W50',
    name: 'Aceite Motul 7100 10W-50 100% Sintético (1L)',
    brand: 'Motul France',
    category: 'Motor y Lubricación',
    stock: 14,
    minStock: 6,
    unitPriceBOB: 130,
  },
  {
    id: 'inv-3',
    sku: 'EBC-FA296HH',
    name: 'Pastillas de freno sinterizadas EBC Double-H',
    brand: 'EBC Brakes UK',
    category: 'Frenos',
    stock: 2,
    minStock: 4,
    unitPriceBOB: 420,
  },
  {
    id: 'inv-4',
    sku: 'HON-17210-K70-600',
    name: 'Filtro de aire original Honda CB190R OEM',
    brand: 'Honda Genuine',
    category: 'Inyección y Admisión',
    stock: 6,
    minStock: 3,
    unitPriceBOB: 130,
  },
  {
    id: 'inv-5',
    sku: 'YUA-YTX9-BS',
    name: 'Batería AGM Libre de Mantenimiento Yuasa YTX9-BS',
    brand: 'Yuasa Japan',
    category: 'Eléctrico y Batería',
    stock: 1,
    minStock: 2,
    unitPriceBOB: 480,
  },
  {
    id: 'inv-6',
    sku: 'BMW-12318552692',
    name: 'Regulador Rectificador MOSFET BMW G310',
    brand: 'BMW Motorrad OEM',
    category: 'Eléctrico y Batería',
    stock: 2,
    minStock: 2,
    unitPriceBOB: 850,
  },
  {
    id: 'inv-7',
    sku: 'NGK-CR8EIX',
    name: 'Bujía NGK Iridium IX Alta Performance',
    brand: 'NGK Japan',
    category: 'Eléctrico y Batería',
    stock: 9,
    minStock: 4,
    unitPriceBOB: 95,
  },
]

export const initialOrdersData: Order[] = [
  {
    id: 'OT-2048',
    bike: 'Yamaha MT-07',
    plate: 'KLM-42D',
    client: 'Sofía Ramírez',
    clientNitOrCi: '7841920 SC',
    phone: '+591 7642 3390',
    email: 'sofia.ramirez@email.com',
    service: 'Cambio de kit de arrastre',
    diagnosis:
      'Ingresó con desgaste severo en corona trasera, ruido metálico cíclico en cadena de transmisión y holgura superior a 45 mm.',
    mileage: '24.380 km',
    fuelLevel: '3/4 tanque',
    nextServiceKm: '29.500 km (Reajuste y lubricación a los 500 km)',
    mechanic: 'Marco Ríos',
    status: 'En reparación',
    eta: 'Hoy, 17:30',
    createdAt: '12 de octubre, 2024',
    accent: 'orange',
    avatar: 'SR',
    mechanicNote:
      'El kit de arrastre DID 525VX3 Gold está siendo instalado con remachadora hidráulica. Encontramos los dampers de maza y el tensor en buen estado, por lo que no será necesario reemplazarlos.',
    mechanicNoteUpdatedAt: 'Hace 2 horas',
    quoteItems: [
      { id: 'q-1', description: 'Kit de arrastre DID reforzado', amount: 1250 },
      { id: 'q-2', description: 'Mano de obra e instalación', amount: 350 },
    ],
    quoteApproved: false,
    paid: false,
    photosCount: 3,
    timeline: {
      Agendado: '12 oct · 09:30',
      'En diagnóstico': '12 oct · 11:45',
      'En reparación': '13 oct · 14:20',
      'Listo para entrega': 'Próximamente',
    },
    intakeChecklist: {
      leftHelmet: true,
      leftDocuments: true,
      leftKeys: true,
      leftToolsOrBag: false,
      aestheticNotes:
        'Rayón leve previo en contrapeso derecho de manillar. Tanque, escape y carenado lateral impecables.',
      clientConformitySigned: true,
      clientConformitySignedAt: '12 oct · 09:35',
    },
    replacedParts: [
      {
        id: 'rp-101',
        partName: 'Cadena DID 525VX3 X-Ring Gold (108 eslabones)',
        partCode: 'DID-525VX3-108ZB',
        brand: 'DID Japan',
        systemCategory: 'Transmisión',
        oldPartCondition:
          'Cadena anterior con eslabones engarrotados, retenes O-ring cortados y estiramiento fuera de rango.',
        actionTaken: 'Reemplazado por nuevo',
        installedBy: 'Marco Ríos',
        installedAt: '13 oct · 15:40',
        warrantyMonths: 6,
        unitCost: 750,
        oldPartReturnedToClient: true,
      },
      {
        id: 'rp-102',
        partName: 'Corona trasera JT Sprockets 43T + Piñón ataque 16T',
        partCode: 'JTR-1876-43 / JTF-1591-16',
        brand: 'JT Sprockets OEM',
        systemCategory: 'Transmisión',
        oldPartCondition:
          'Dientes de corona en punta ("aleta de tiburón") causando vibración al acelerar.',
        actionTaken: 'Reemplazado por nuevo',
        installedBy: 'Marco Ríos',
        installedAt: '13 oct · 16:10',
        warrantyMonths: 6,
        unitCost: 500,
        oldPartReturnedToClient: true,
      },
      {
        id: 'rp-103',
        partName: 'Tuerca de seguridad eje piñón + Alineación láser de rueda',
        partCode: 'YAM-90179-18001',
        brand: 'Yamaha Genuine',
        systemCategory: 'Transmisión',
        oldPartCondition: 'Pestaña de bloqueo de tuerca anterior fatigada por uso previo.',
        actionTaken: 'Reemplazado por nuevo',
        installedBy: 'Marco Ríos',
        installedAt: '13 oct · 16:30',
        warrantyMonths: 12,
        unitCost: 0,
        oldPartReturnedToClient: false,
      },
    ],
    healthCheck: [
      {
        system: 'Motor y Compresión',
        status: 'Óptimo',
        score: 96,
        observation: 'Motor CP2 689cc sin fugas, ralentí estable a 1.250 RPM y nivel de aceite OK.',
      },
      {
        system: 'Transmisión y Arrastre',
        status: 'En intervención',
        score: 88,
        observation: 'Instalando kit DID 525VX3 nuevo; holgura calibrada a 30 mm según manual.',
      },
      {
        system: 'Sistema de Frenos',
        status: 'Óptimo',
        score: 92,
        observation: 'Pastillas delanteras al 75% (cambiadas en enero) y líquido DOT 4 limpio.',
      },
      {
        system: 'Sistema Eléctrico y Carga',
        status: 'Óptimo',
        score: 95,
        observation: 'Tensión de carga 14.2V constante; sin códigos de falla en ECU.',
      },
      {
        system: 'Suspensión y Dirección',
        status: 'Óptimo',
        score: 90,
        observation: 'Horquilla delantera sin sudoración en retenes; monoshock en rango.',
      },
      {
        system: 'Neumáticos y Seguridad',
        status: 'Atención sugerida',
        score: 76,
        observation: 'Neumático trasero Michelin Road 5 al 35% de vida útil (próximo cambio en ~3.000 km).',
      },
    ],
    history: [
      {
        id: 'h-1',
        orderCode: 'OT-1892',
        date: '18 jun 2024',
        mileage: '20.110 km',
        mechanic: 'Marco Ríos',
        service: 'Mantenimiento general',
        intakeDiagnosis:
          'Ingreso por pauta preventiva de 20.000 km; aceite degradado y cuerpos de aceleración con desfase leve.',
        technicalResolution:
          'Cambio de aceite sintético Motul 7100 10W-40, bujías NGK y sincronización con vacuómetro digital.',
        partsChanged: [
          'Aceite Motul 7100 10W-40 (3L)',
          'Filtro de aceite Yamaha OEM 5GH-13440-80',
          '2x Bujías NGK LMAR8A-9',
        ],
        warrantyStatus: 'Garantía cumplida',
        amount: 580,
      },
      {
        id: 'h-2',
        orderCode: 'OT-1614',
        date: '09 ene 2024',
        mileage: '16.400 km',
        mechanic: 'Lucía Vidal',
        service: 'Cambio de pastillas de freno',
        intakeDiagnosis:
          'Chirrido metálico en frenada delantera y nivel bajo en depósito de bomba delantera.',
        technicalResolution:
          'Reemplazo de pastillas delanteras sinterizadas, limpieza de pistones de cáliper y purga DOT 4.',
        partsChanged: [
          'Juego pastillas delanteras Brembo Sinter',
          'Líquido de frenos Motul DOT 4 LV',
        ],
        warrantyStatus: 'Garantía cumplida',
        amount: 420,
      },
    ],
    whatsappLogs: [
      {
        id: 'wa-1',
        sentAt: '12 oct · 12:00',
        template: 'diagnostico_ingreso',
        summary: 'Reporte de diagnóstico inicial y cotización enviado por WhatsApp',
      },
    ],
  },
  {
    id: 'OT-2047',
    bike: 'Honda CB190R',
    plate: 'MNP-19A',
    client: 'Diego Torres',
    clientNitOrCi: '6192044 LP',
    phone: '+591 7112 9084',
    email: 'diego.torres@email.com',
    service: 'Mantenimiento 10.000 km',
    diagnosis:
      'Ingresó para pauta preventiva de 10.000 km; cliente reporta ralentí inestable en frío y manilla de embrague alta.',
    mileage: '10.120 km',
    fuelLevel: '1/2 tanque',
    nextServiceKm: '15.000 km',
    mechanic: 'Lucía Vidal',
    status: 'En diagnóstico',
    eta: 'Hoy, 15:00',
    createdAt: '13 de octubre, 2024',
    accent: 'blue',
    avatar: 'DT',
    mechanicNote:
      'Inspección de compresión y bujía completada. Se instaló filtro de aire original Honda, cambio de aceite sintético y regulación de holgura de cable de embrague.',
    mechanicNoteUpdatedAt: 'Hace 8 minutos',
    quoteItems: [
      { id: 'q-3', description: 'Aceite sintético 10W-30 + Filtro', amount: 240 },
      { id: 'q-4', description: 'Filtro de aire Honda OEM', amount: 130 },
      { id: 'q-5', description: 'Mano de obra pauta 10.000 km', amount: 280 },
    ],
    quoteApproved: true,
    quoteApprovedAt: '13 oct · 11:30',
    paid: true,
    paidMethod: 'QR Simple',
    photosCount: 2,
    timeline: {
      Agendado: '13 oct · 08:45',
      'En diagnóstico': '14 oct · 10:15',
      'En reparación': 'Pendiente',
      'Listo para entrega': 'Próximamente',
    },
    intakeChecklist: {
      leftHelmet: false,
      leftDocuments: true,
      leftKeys: true,
      leftToolsOrBag: true,
      aestheticNotes:
        'Sin detalles de pintura. Dejó estuche de herramientas original bajo el asiento.',
      clientConformitySigned: true,
      clientConformitySignedAt: '13 oct · 08:50',
    },
    replacedParts: [
      {
        id: 'rp-201',
        partName: 'Filtro de aire elemento viscoso Honda OEM',
        partCode: 'HON-17210-K70-600',
        brand: 'Honda Genuine Parts',
        systemCategory: 'Inyección y Admisión',
        oldPartCondition:
          'Elemento filtrante saturado de polvo urbano, restringiendo paso de aire en ralentí.',
        actionTaken: 'Reemplazado por nuevo',
        installedBy: 'Lucía Vidal',
        installedAt: '14 oct · 10:40',
        warrantyMonths: 6,
        unitCost: 130,
        oldPartReturnedToClient: true,
      },
      {
        id: 'rp-202',
        partName: 'Aceite Pro Honda 10W-30 Full Synthetic + Golilla drenaje',
        partCode: 'HON-08232-M99-K1J',
        brand: 'Pro Honda',
        systemCategory: 'Motor y Lubricación',
        oldPartCondition: 'Aceite con 5.100 km de uso, viscosidad reducida por temperatura.',
        actionTaken: 'Reemplazado por nuevo',
        installedBy: 'Lucía Vidal',
        installedAt: '14 oct · 11:05',
        warrantyMonths: 6,
        unitCost: 240,
        oldPartReturnedToClient: false,
      },
    ],
    healthCheck: [
      {
        system: 'Motor y Compresión',
        status: 'Óptimo',
        score: 95,
        observation: 'Luz de válvulas verificada (Adm 0.08mm / Esc 0.24mm) y compresión 158 PSI.',
      },
      {
        system: 'Transmisión y Arrastre',
        status: 'Óptimo',
        score: 91,
        observation: 'Cable de embrague regulado con juego libre de 12 mm; cadena lubricada.',
      },
      {
        system: 'Sistema de Frenos',
        status: 'Óptimo',
        score: 90,
        observation: 'Pastillas Nissin al 70% adelante y 80% atrás.',
      },
      {
        system: 'Sistema Eléctrico y Carga',
        status: 'Óptimo',
        score: 97,
        observation: 'Sistema PGM-FI reseteado y cuerpo de aceleración limpio.',
      },
      {
        system: 'Suspensión y Dirección',
        status: 'Óptimo',
        score: 93,
        observation: 'Horquilla invertida USD en perfecto estado.',
      },
      {
        system: 'Neumáticos y Seguridad',
        status: 'Óptimo',
        score: 92,
        observation: 'Neumáticos con desgaste uniforme y presión calibrada.',
      },
    ],
    history: [
      {
        id: 'h-3',
        orderCode: 'OT-1705',
        date: '04 mar 2024',
        mileage: '5.040 km',
        mechanic: 'Lucía Vidal',
        service: 'Mantenimiento 5.000 km',
        intakeDiagnosis: 'Revisión periódica de 5.000 km; ajuste de cadena y cambio de aceite.',
        technicalResolution:
          'Cambio de aceite 10W-30, limpieza de tamiz centrífugo y reapriete general de chasis con torquímetro.',
        partsChanged: ['Aceite Pro Honda 10W-30', 'Empaquetadura tapa embrague OEM'],
        warrantyStatus: 'Garantía cumplida',
        amount: 450,
      },
    ],
    whatsappLogs: [],
  },
  {
    id: 'OT-2046',
    bike: 'Kawasaki Z400',
    plate: 'QRS-88B',
    client: 'Andrés Molina',
    clientNitOrCi: '4829103 CB',
    phone: '+591 6835 4412',
    email: 'andres.molina@email.com',
    service: 'Revisión de frenos',
    diagnosis:
      'Ingresó por vibración al frenar con freno delantero, tacto esponjoso en bomba y pastillas al 15% de vida útil.',
    mileage: '16.840 km',
    fuelLevel: 'Lleno',
    nextServiceKm: '22.000 km',
    mechanic: 'Marco Ríos',
    status: 'Listo para entrega',
    eta: 'Pendiente de retiro',
    createdAt: '11 de octubre, 2024',
    accent: 'green',
    avatar: 'AM',
    mechanicNote:
      'Se reemplazaron pastillas sinterizadas delanteras, limpieza ultrasónica de cálipers y purga completa de circuito ABS con líquido DOT 4. Prueba de ruta aprobada al 100%.',
    mechanicNoteUpdatedAt: 'Hace 24 minutos',
    quoteItems: [
      { id: 'q-6', description: 'Pastillas sinterizadas EBC HH', amount: 420 },
      { id: 'q-7', description: 'Líquido de frenos Motul DOT 4', amount: 90 },
      { id: 'q-8', description: 'Mano de obra sistema de frenos', amount: 220 },
    ],
    quoteApproved: true,
    quoteApprovedAt: '11 oct · 13:10',
    paid: true,
    paidMethod: 'Tarjeta Débito/Crédito',
    photosCount: 4,
    timeline: {
      Agendado: '11 oct · 10:00',
      'En diagnóstico': '11 oct · 12:30',
      'En reparación': '12 oct · 16:00',
      'Listo para entrega': '14 oct · 11:10',
    },
    intakeChecklist: {
      leftHelmet: true,
      leftDocuments: false,
      leftKeys: true,
      leftToolsOrBag: false,
      aestheticNotes:
        'Protector de escape con raspón antiguo. Casco integral LS2 entregado en custodia.',
      clientConformitySigned: true,
      clientConformitySignedAt: '11 oct · 10:05',
    },
    replacedParts: [
      {
        id: 'rp-301',
        partName: 'Pastillas de freno sinterizadas EBC Double-H',
        partCode: 'EBC-FA296HH',
        brand: 'EBC Brakes UK',
        systemCategory: 'Frenos',
        oldPartCondition:
          'Pastillas originales con 1.2 mm de compuesto remanente y superficie cristalizada por temperatura.',
        actionTaken: 'Reemplazado por nuevo',
        installedBy: 'Marco Ríos',
        installedAt: '12 oct · 17:15',
        warrantyMonths: 6,
        unitCost: 420,
        oldPartReturnedToClient: true,
      },
      {
        id: 'rp-302',
        partName: 'Fluido hidráulico sintético Motul DOT 4 Brake Fluid',
        partCode: 'MOT-100948',
        brand: 'Motul France',
        systemCategory: 'Frenos',
        oldPartCondition:
          'Líquido anterior con 3.2% de humedad medida con tester electrónico y microburbujas.',
        actionTaken: 'Reemplazado por nuevo',
        installedBy: 'Marco Ríos',
        installedAt: '12 oct · 17:50',
        warrantyMonths: 12,
        unitCost: 90,
        oldPartReturnedToClient: false,
      },
    ],
    healthCheck: [
      {
        system: 'Motor y Compresión',
        status: 'Óptimo',
        score: 96,
        observation: 'Bicilíndrico 399cc impecable, sin ruidos ni fugas.',
      },
      {
        system: 'Transmisión y Arrastre',
        status: 'Óptimo',
        score: 93,
        observation: 'Embrague antirrebote suave y kit de transmisión al 80%.',
      },
      {
        system: 'Sistema de Frenos',
        status: 'Óptimo',
        score: 100,
        observation: 'Pastillas EBC HH nuevas, cáliper descontaminado y módulo ABS verificado.',
      },
      {
        system: 'Sistema Eléctrico y Carga',
        status: 'Óptimo',
        score: 95,
        observation: 'Sensores de velocidad de rueda ABS y batería al 100%.',
      },
      {
        system: 'Suspensión y Dirección',
        status: 'Óptimo',
        score: 94,
        observation: 'Estabilidad en frenada de emergencia comprobada en prueba de ruta.',
      },
      {
        system: 'Neumáticos y Seguridad',
        status: 'Óptimo',
        score: 97,
        observation: 'Neumáticos Pirelli Diablo Rosso III instalados en mayo al 90% de vida.',
      },
    ],
    history: [
      {
        id: 'h-4',
        orderCode: 'OT-1840',
        date: '22 may 2024',
        mileage: '13.500 km',
        mechanic: 'Marco Ríos',
        service: 'Cambio de neumáticos Pirelli',
        intakeDiagnosis: 'Desgaste cuadrado en banda central de neumáticos originales de fábrica.',
        technicalResolution:
          'Montaje de par Pirelli Diablo Rosso III, cambio de válvulas tubeless y balanceo dinámico computarizado.',
        partsChanged: [
          'Neumático delantero Pirelli 110/70 R17',
          'Neumático trasero Pirelli 150/60 R17',
          '2x Válvulas aluminio 90°',
        ],
        warrantyStatus: 'Garantía vigente',
        amount: 1850,
      },
      {
        id: 'h-5',
        orderCode: 'OT-1502',
        date: '15 nov 2023',
        mileage: '9.800 km',
        mechanic: 'Carlos Méndez',
        service: 'Sincronización cuerpo aceleración',
        intakeDiagnosis: 'Pequeños tirones a bajas revoluciones entre 2.500 y 3.500 RPM.',
        technicalResolution:
          'Limpieza ultrasónica de inyectores, cambio de bujías y sincronización electrónica de mariposas.',
        partsChanged: ['2x Bujías NGK Iridium CR8EIX', 'Sello admisión Kawasaki OEM'],
        warrantyStatus: 'Garantía cumplida',
        amount: 520,
      },
    ],
    whatsappLogs: [
      {
        id: 'wa-2',
        sentAt: '14 oct · 11:15',
        template: 'lista_entrega',
        summary: 'Aviso de moto lista para retiro enviado por WhatsApp',
      },
    ],
  },
  {
    id: 'OT-2045',
    bike: 'Bajaj Dominar 400',
    plate: 'TUV-07C',
    client: 'Valentina Cruz',
    clientNitOrCi: '8391042 SC',
    phone: '+591 7548 1120',
    email: 'valentina.cruz@email.com',
    service: 'Cambio de aceite',
    diagnosis:
      'Ingresó por cambio de aceite sintético cada 5.000 km, revisión de tensión de cadena y chequeo de fugas en empaquetadura.',
    mileage: '15.200 km',
    fuelLevel: '1/4 tanque',
    nextServiceKm: '20.200 km',
    mechanic: 'Lucía Vidal',
    status: 'Agendado',
    eta: 'Mañana, 09:30',
    createdAt: '14 de octubre, 2024',
    accent: 'purple',
    avatar: 'VC',
    mechanicNote:
      'Orden agendada y repuestos reservados en bodega a nombre del cliente. Lubricación y cambio de filtro programados para primera hora.',
    mechanicNoteUpdatedAt: 'Hace 1 hora',
    quoteItems: [
      { id: 'q-9', description: 'Aceite Motul 7100 10W-50 (2L)', amount: 260 },
      { id: 'q-10', description: 'Filtro de aceite + O-ring', amount: 65 },
      { id: 'q-11', description: 'Mano de obra e inspección 15 puntos', amount: 150 },
    ],
    quoteApproved: true,
    quoteApprovedAt: '14 oct · 09:15',
    paid: false,
    photosCount: 0,
    timeline: {
      Agendado: '14 oct · 09:00',
      'En diagnóstico': 'Pendiente',
      'En reparación': 'Pendiente',
      'Listo para entrega': 'Próximamente',
    },
    intakeChecklist: {
      leftHelmet: false,
      leftDocuments: false,
      leftKeys: true,
      leftToolsOrBag: false,
      aestheticNotes:
        'Defensas laterales slider sin daños. Moto recepcionada limpia sin rayones.',
      clientConformitySigned: false,
    },
    replacedParts: [
      {
        id: 'rp-401',
        partName: 'Aceite Motul 7100 10W-50 100% Sintético Ester (2L)',
        partCode: 'MOT-7100-10W50',
        brand: 'Motul France',
        systemCategory: 'Motor y Lubricación',
        oldPartCondition: 'Aceite con 5.000 km cumplidos por pauta preventiva.',
        actionTaken: 'En instalación',
        installedBy: 'Lucía Vidal',
        installedAt: 'Reservado en bahía',
        warrantyMonths: 6,
        unitCost: 260,
        oldPartReturnedToClient: false,
      },
      {
        id: 'rp-402',
        partName: 'Filtro de aceite Bajaj OEM + O-Ring tapa filtro',
        partCode: 'BAJ-JG571014',
        brand: 'Bajaj Genuine Parts',
        systemCategory: 'Motor y Lubricación',
        oldPartCondition: 'Reemplazo preventivo junto con cambio de lubricante.',
        actionTaken: 'En instalación',
        installedBy: 'Lucía Vidal',
        installedAt: 'Reservado en bahía',
        warrantyMonths: 6,
        unitCost: 65,
        oldPartReturnedToClient: true,
      },
    ],
    healthCheck: [
      {
        system: 'Motor y Compresión',
        status: 'En intervención',
        score: 89,
        observation: 'Programado cambio de aceite 10W-50 y limpieza de cedazo magnético.',
      },
      {
        system: 'Transmisión y Arrastre',
        status: 'Óptimo',
        score: 90,
        observation: 'Cadena con holgura normal; se incluirá limpieza y lubricación.',
      },
      {
        system: 'Sistema de Frenos',
        status: 'Óptimo',
        score: 92,
        observation: 'Frenos ByBre con buen tacto y pastillas al 65%.',
      },
      {
        system: 'Sistema Eléctrico y Carga',
        status: 'Óptimo',
        score: 94,
        observation: 'Sistema de carga reparado en abril funcionando a 14.1V.',
      },
      {
        system: 'Suspensión y Dirección',
        status: 'Óptimo',
        score: 91,
        observation: 'Horquilla invertida de 43mm sin fugas.',
      },
      {
        system: 'Neumáticos y Seguridad',
        status: 'Óptimo',
        score: 88,
        observation: 'Presión y desgaste parejos en ambas ruedas.',
      },
    ],
    history: [
      {
        id: 'h-6',
        orderCode: 'OT-1780',
        date: '10 abr 2024',
        mileage: '10.200 km',
        mechanic: 'Lucía Vidal',
        service: 'Revisión sistema de carga',
        intakeDiagnosis: 'Testigo de batería parpadeando en tráfico denso.',
        technicalResolution:
          'Limpieza de conector trifásico de estator, aplicación de grasa dieléctrica y recarga profunda de batería.',
        partsChanged: ['Conector sellado 3 vías AMP', 'Fusible principal 30A OEM'],
        warrantyStatus: 'Garantía vigente',
        amount: 320,
      },
    ],
    whatsappLogs: [],
  },
  {
    id: 'OT-2044',
    bike: 'BMW G 310 R',
    plate: 'ABC-31E',
    client: 'Nicolás Soto',
    clientNitOrCi: '5910238 LP',
    phone: '+591 6229 7781',
    email: 'nicolas.soto@email.com',
    service: 'Diagnóstico eléctrico',
    diagnosis:
      'Ingresó en grúa por fallo intermitente en arranque en frío, testigo de batería encendido y caída de tensión bajo 11.4V.',
    mileage: '19.510 km',
    fuelLevel: '1/2 tanque',
    nextServiceKm: '25.000 km',
    mechanic: 'Marco Ríos',
    status: 'En reparación',
    eta: 'Mañana, 12:00',
    createdAt: '12 de octubre, 2024',
    accent: 'orange',
    avatar: 'NS',
    mechanicNote:
      'Se detectó regulador de voltaje con diodo en cortocircuito y batería sulfatada. Reemplazando regulador original BMW y batería Yuasa AGM activada en banco.',
    mechanicNoteUpdatedAt: 'Hace 3 horas',
    quoteItems: [
      { id: 'q-12', description: 'Regulador rectificador BMW G310', amount: 850 },
      { id: 'q-13', description: 'Batería Yuasa YTX9-BS', amount: 480 },
      { id: 'q-14', description: 'Diagnóstico electrónico y mano de obra', amount: 290 },
    ],
    quoteApproved: false,
    paid: false,
    photosCount: 2,
    timeline: {
      Agendado: '12 oct · 15:00',
      'En diagnóstico': '13 oct · 09:20',
      'En reparación': '13 oct · 17:45',
      'Listo para entrega': 'Próximamente',
    },
    intakeChecklist: {
      leftHelmet: true,
      leftDocuments: true,
      leftKeys: true,
      leftToolsOrBag: true,
      aestheticNotes:
        'Ingresó en grúa; dejó casco AGV, carpeta RUAT y alforja trasera impermeable.',
      clientConformitySigned: true,
      clientConformitySignedAt: '12 oct · 15:10',
    },
    replacedParts: [
      {
        id: 'rp-501',
        partName: 'Regulador Rectificador de Voltaje MOSFET BMW Motorrad',
        partCode: 'BMW-12318552692',
        brand: 'BMW Motorrad OEM',
        systemCategory: 'Eléctrico y Batería',
        oldPartCondition:
          'Diodo rectificador de fase 2 quemado por temperatura; entregaba solo 11.3V en marcha.',
        actionTaken: 'Reemplazado por nuevo',
        installedBy: 'Marco Ríos',
        installedAt: '13 oct · 18:10',
        warrantyMonths: 12,
        unitCost: 850,
        oldPartReturnedToClient: true,
      },
      {
        id: 'rp-502',
        partName: 'Batería AGM Libre de Mantenimiento Yuasa YTX9-BS',
        partCode: 'YUA-YTX9-BS',
        brand: 'Yuasa Japan',
        systemCategory: 'Eléctrico y Batería',
        oldPartCondition:
          'Celdas sulfatadas tras descarga profunda; caía a 7.8V al accionar motor de partida (CCA insuficiente).',
        actionTaken: 'Reemplazado por nuevo',
        installedBy: 'Marco Ríos',
        installedAt: '13 oct · 18:35',
        warrantyMonths: 12,
        unitCost: 480,
        oldPartReturnedToClient: true,
      },
    ],
    healthCheck: [
      {
        system: 'Motor y Compresión',
        status: 'Óptimo',
        score: 93,
        observation: 'Motor 313cc arranca al primer pulso con batería nueva.',
      },
      {
        system: 'Transmisión y Arrastre',
        status: 'Óptimo',
        score: 88,
        observation: 'Kit de transmisión al 70% de vida útil.',
      },
      {
        system: 'Sistema de Frenos',
        status: 'Óptimo',
        score: 91,
        observation: 'Frenos ByBre con ABS operativo sin códigos de error.',
      },
      {
        system: 'Sistema Eléctrico y Carga',
        status: 'En intervención',
        score: 86,
        observation: 'Regulador BMW y batería Yuasa instalados; verificando carga a 14.3V.',
      },
      {
        system: 'Suspensión y Dirección',
        status: 'Óptimo',
        score: 92,
        observation: 'Telescópicas KYB de 41mm sin fugas.',
      },
      {
        system: 'Neumáticos y Seguridad',
        status: 'Óptimo',
        score: 90,
        observation: 'Neumáticos Michelin Pilot Street con buen dibujo.',
      },
    ],
    history: [
      {
        id: 'h-7',
        orderCode: 'OT-1934',
        date: '29 jul 2024',
        mileage: '17.100 km',
        mechanic: 'Marco Ríos',
        service: 'Cambio líquido refrigerante',
        intakeDiagnosis: 'Mantenimiento preventivo del circuito de refrigeración antes de temporada.',
        technicalResolution:
          'Purga completa de radiador, lavado de vaso expansor y carga de refrigerante orgánico BMW.',
        partsChanged: [
          'Refrigerante orgánico BMW Motorrad (1.5L)',
          'Tapa presurizada radiador 1.1 Bar',
        ],
        warrantyStatus: 'Garantía vigente',
        amount: 290,
      },
    ],
    whatsappLogs: [],
  },
]

export const initialActivitiesData: ActivityItem[] = [
  {
    id: 'act-1',
    tone: 'orange',
    iconType: 'wrench',
    actor: 'Lucía',
    action: 'agregó una nota a',
    target: 'OT-2047',
    orderId: 'OT-2047',
    time: 'Hace 8 minutos',
    read: false,
  },
  {
    id: 'act-2',
    tone: 'green',
    iconType: 'check',
    actor: 'OT-2046',
    action: 'marcada como',
    target: 'lista para entrega',
    orderId: 'OT-2046',
    time: 'Hace 24 minutos',
    read: false,
  },
  {
    id: 'act-3',
    tone: 'blue',
    iconType: 'image',
    actor: 'Marco',
    action: 'subió 3 fotos a',
    target: 'OT-2048',
    orderId: 'OT-2048',
    time: 'Hace 1 hora',
    read: true,
  },
]

export const initialTransactionsData: FinanceTransaction[] = [
  {
    id: 'fin-inc-1',
    date: '14 oct 2024',
    month: 'Oct',
    description: 'Pago Orden OT-2046 - Revisión de frenos y pastillas Kawasaki Z400',
    category: 'Servicio',
    type: 'income',
    amount: 730,
    paymentMethod: 'Tarjeta Débito/Crédito',
    status: 'Pagado',
    providerOrClient: 'Andrés Molina',
    invoiceOrDoc: 'FAC-4092',
    orderId: 'OT-2046',
  },
  {
    id: 'fin-inc-2',
    date: '13 oct 2024',
    month: 'Oct',
    description: 'Pago Orden OT-2047 - Mantenimiento pauta 10.000 km Honda CB190R',
    category: 'Servicio',
    type: 'income',
    amount: 650,
    paymentMethod: 'QR Simple',
    status: 'Pagado',
    providerOrClient: 'Diego Torres',
    invoiceOrDoc: 'FAC-4088',
    orderId: 'OT-2047',
  },
  {
    id: 'fin-inc-3',
    date: '12 oct 2024',
    month: 'Oct',
    description: 'Abono inicial repuestos OT-2048 (Kit arrastre Yamaha MT-07)',
    category: 'Repuestos',
    type: 'income',
    amount: 1120,
    paymentMethod: 'QR Simple',
    status: 'Pagado',
    providerOrClient: 'Sofía Ramírez',
    invoiceOrDoc: 'REC-1104',
    orderId: 'OT-2048',
  },
  {
    id: 'fin-inc-4',
    date: '11 oct 2024',
    month: 'Oct',
    description: 'Facturación flota repartidores urbanos (14 mantenciones preventivas)',
    category: 'Servicio',
    type: 'income',
    amount: 22400,
    paymentMethod: 'Factura 30 días',
    status: 'Pagado',
    providerOrClient: 'Logística Express Moto S.R.L.',
    invoiceOrDoc: 'FAC-1890',
  },
  {
    id: 'fin-inc-5',
    date: '08 oct 2024',
    month: 'Oct',
    description: 'Servicios mayores de motor, embragues, suspensiones y escáner (Semana 1-2)',
    category: 'Servicio',
    type: 'income',
    amount: 41300,
    paymentMethod: 'QR Simple',
    status: 'Pagado',
    providerOrClient: 'Clientes Taller (26 Órdenes cerradas)',
    invoiceOrDoc: 'RES-OCT-01',
  },
  {
    id: 'fin-inc-6',
    date: '04 oct 2024',
    month: 'Oct',
    description: 'Venta directa por mostrador de neumáticos Pirelli, cascos y lubricantes',
    category: 'Repuestos',
    type: 'income',
    amount: 18600,
    paymentMethod: 'Efectivo',
    status: 'Pagado',
    providerOrClient: 'Ventas Mostrador MotoLab Bolivia',
    invoiceOrDoc: 'RES-VTA-10',
  },
  {
    id: 'fin-exp-1',
    date: '14 oct 2024',
    month: 'Oct',
    description: 'Compra stock repuestos OEM (kits de arrastre DID, pastillas EBC, baterías Yuasa)',
    category: 'Repuestos',
    type: 'expense',
    amount: 8200,
    paymentMethod: 'Factura 30 días',
    status: 'Pagado',
    providerOrClient: 'Importadora Imoto Bolivia S.R.L.',
    invoiceOrDoc: 'FAC-77412',
    orderId: 'OT-2048',
  },
  {
    id: 'fin-exp-2',
    date: '12 oct 2024',
    month: 'Oct',
    description: 'Compra tambor aceite sintético Motul 7100, líquido frenos DOT4 y limpiafrenos',
    category: 'Insumos',
    type: 'expense',
    amount: 3400,
    paymentMethod: 'QR Simple',
    status: 'Pagado',
    providerOrClient: 'Distribuidora Motul Bolivia',
    invoiceOrDoc: 'FAC-33910',
  },
  {
    id: 'fin-exp-3',
    date: '10 oct 2024',
    month: 'Oct',
    description: 'Sueldos base y comisiones de taller (Marco Ríos, Lucía Vidal y Carlos Méndez)',
    category: 'Sueldos y comisiones',
    type: 'expense',
    amount: 8900,
    paymentMethod: 'Transferencia',
    status: 'Pagado',
    providerOrClient: 'Planilla Equipo Mecánicos',
    invoiceOrDoc: 'PLA-OCT-24',
  },
  {
    id: 'fin-exp-4',
    date: '05 oct 2024',
    month: 'Oct',
    description: 'Alquiler mensual galpón comercial y bodega MotoLab Bolivia',
    category: 'Arriendo / Fijos',
    type: 'expense',
    amount: 4500,
    paymentMethod: 'Transferencia',
    status: 'Pagado',
    providerOrClient: 'Inmobiliaria Central S.R.L.',
    invoiceOrDoc: 'ALQ-10-2024',
  },
  {
    id: 'fin-exp-5',
    date: '04 oct 2024',
    month: 'Oct',
    description: 'Electricidad trifásica, agua potable, internet fibra Entel e insumos de aseo',
    category: 'Servicios básicos (Luz/Agua/Net)',
    type: 'expense',
    amount: 1150,
    paymentMethod: 'QR Simple',
    status: 'Pagado',
    providerOrClient: 'CRE / Saguapac / Entel Bolivia',
    invoiceOrDoc: 'SRV-10-2024',
  },
  {
    id: 'fin-exp-6',
    date: '03 oct 2024',
    month: 'Oct',
    description: 'Mantención elevador electrohidráulico y compra de puntas torx/hexagonal',
    category: 'Herramientas y equipos',
    type: 'expense',
    amount: 1250,
    paymentMethod: 'Tarjeta Débito/Crédito',
    status: 'Pagado',
    providerOrClient: 'Ferretería Industrial Würth Bolivia',
    invoiceOrDoc: 'FAC-90125',
  },
  {
    id: 'fin-exp-7',
    date: '02 oct 2024',
    month: 'Oct',
    description: 'Honorarios contabilidad mensual e impuestos SIN (IVA Form. 200 / IT Form. 400)',
    category: 'Impuestos / Contabilidad',
    type: 'expense',
    amount: 1200,
    paymentMethod: 'Transferencia',
    status: 'Pendiente de pago',
    providerOrClient: 'Consultora Contable & Impuestos Nacionales (SIN)',
    invoiceOrDoc: 'SIN-IVA-OCT',
  },
]

export function findOrderByQuery(orders: Order[], query: string): Order | undefined {
  const clean = query.trim().toLowerCase()
  if (!clean) return undefined

  return (
    orders.find(
      (o) =>
        o.plate.toLowerCase() === clean ||
        o.id.toLowerCase() === clean ||
        `orden ${o.id.toLowerCase()}` === clean
    ) ??
    orders.find(
      (o) =>
        o.plate.toLowerCase().includes(clean) ||
        o.id.toLowerCase().includes(clean) ||
        o.bike.toLowerCase().includes(clean) ||
        o.client.toLowerCase().includes(clean)
    )
  )
}

export function openPrintableOfficialReceipt(order: Order, settings: WorkshopSettings) {
  if (typeof window === 'undefined') return
  const total = calculateOrderTotal(order)
  const chk = order.intakeChecklist ?? getDefaultIntakeChecklist()
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Nota de Entrega y Garantía ${order.id} - ${order.plate}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 24px; font-size: 12px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
    .title { font-size: 18px; font-weight: 800; margin: 0; }
    .sub { font-size: 11px; color: #475569; margin: 2px 0; }
    .box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; }
    .box-title { font-weight: 700; font-size: 11px; text-transform: uppercase; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; }
    .total-row { font-size: 14px; font-weight: 800; text-align: right; margin-top: 8px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 42px; gap: 30px; }
    .sig-block { flex: 1; border-top: 1px solid #0f172a; padding-top: 6px; text-align: center; font-size: 11px; }
    @media print { .no-print { display: none; } body { margin: 10mm; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:14px; text-align:right;">
    <button onclick="window.print()" style="padding:8px 14px; background:#ea580c; color:#fff; border:none; border-radius:6px; font-weight:700; cursor:pointer;">🖨️ Imprimir Recibo Oficial (A4 / Térmico)</button>
  </div>
  <div class="header">
    <div>
      <p class="title">${settings.workshopName}</p>
      <p class="sub">NIT Taller: <strong>${settings.workshopNit || '3849201015'}</strong> · Tel/WhatsApp: ${settings.workshopPhone}</p>
      <p class="sub">${settings.workshopSubtitle}</p>
    </div>
    <div style="text-align:right;">
      <p class="title">ORDEN ${order.id}</p>
      <p class="sub">Fecha ingreso: ${order.createdAt}</p>
      <p class="sub">Estado: <strong>${order.status}</strong></p>
    </div>
  </div>

  <div class="box">
    <div class="box-title">1. Datos del Cliente y Motocicleta</div>
    <p style="margin:3px 0;"><strong>Cliente:</strong> ${order.client} &nbsp;|&nbsp; <strong>CI / NIT:</strong> ${order.clientNitOrCi || 'S/N'} &nbsp;|&nbsp; <strong>WhatsApp:</strong> ${order.phone}</p>
    <p style="margin:3px 0;"><strong>Motocicleta:</strong> ${order.bike} &nbsp;|&nbsp; <strong>Placa:</strong> ${order.plate} &nbsp;|&nbsp; <strong>Odómetro:</strong> ${order.mileage || '15.000 km'} &nbsp;|&nbsp; <strong>Combustible:</strong> ${order.fuelLevel || '1/2 tanque'}</p>
    <p style="margin:3px 0;"><strong>Mecánico Responsable:</strong> ${order.mechanic} &nbsp;|&nbsp; <strong>Próximo Servicio:</strong> ${order.nextServiceKm || 'En 5.000 km'}</p>
  </div>

  <div class="box">
    <div class="box-title">2. Acta de Recepción Física / Inventario Anti-Reclamos</div>
    <p style="margin:3px 0;">
      <strong>Casco en custodia:</strong> ${chk.leftHelmet ? 'SÍ' : 'NO'} &nbsp;|&nbsp;
      <strong>Documentos RUAT/SOAT:</strong> ${chk.leftDocuments ? 'SÍ' : 'NO'} &nbsp;|&nbsp;
      <strong>Llave / Control:</strong> ${chk.leftKeys ? 'SÍ' : 'NO'} &nbsp;|&nbsp;
      <strong>Herramientas / Alforjas:</strong> ${chk.leftToolsOrBag ? 'SÍ' : 'NO'}
    </p>
    <p style="margin:3px 0;"><strong>Observaciones estéticas de ingreso:</strong> ${chk.aestheticNotes}</p>
    <p style="margin:3px 0;"><strong>Conformidad de recepción:</strong> ${chk.clientConformitySigned ? `Firmada por cliente (${chk.clientConformitySignedAt || 'Confirmado'})` : 'Pendiente de firma'}</p>
  </div>

  <div class="box">
    <div class="box-title">3. Diagnóstico de Ingreso y Trabajo Técnico Ejecutado</div>
    <p style="margin:3px 0;"><strong>Diagnóstico de ingreso:</strong> “${order.diagnosis}”</p>
    <p style="margin:3px 0;"><strong>Servicio (${order.service}):</strong> “${order.mechanicNote}”</p>
  </div>

  <div class="box">
    <div class="box-title">4. Piezas Reemplazadas con Garantía Oficial y Custodia de Piezas Usadas</div>
    <table>
      <thead>
        <tr>
          <th>Repuesto / Componente</th>
          <th>Marca / SKU</th>
          <th>Estado pieza retirada</th>
          <th>Custodia pieza vieja</th>
          <th>Garantía</th>
        </tr>
      </thead>
      <tbody>
        ${order.replacedParts
          .map(
            (p) => `<tr>
          <td><strong>${p.partName}</strong></td>
          <td>${p.brand} (${p.partCode})</td>
          <td>${p.oldPartCondition}</td>
          <td>${p.oldPartReturnedToClient ? 'Entregada en caja al cliente' : 'Reciclaje taller'}</td>
          <td>${p.warrantyMonths} meses</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <div class="box">
    <div class="box-title">5. Liquidación Económica en Bolivianos (Bs)</div>
    <table>
      <thead>
        <tr>
          <th>Concepto / Ítem</th>
          <th style="text-align:right;">Importe (Bs)</th>
        </tr>
      </thead>
      <tbody>
        ${order.quoteItems
          .map(
            (q) => `<tr>
          <td>${q.description}</td>
          <td style="text-align:right;">${formatCLP(q.amount)}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>
    <div class="total-row">
      TOTAL ORDEN: ${formatCLP(total)} (${order.paid ? `PAGADO · ${order.paidMethod || 'QR Simple / Caja'}` : 'PENDIENTE DE PAGO'})
    </div>
  </div>

  <div class="signatures">
    <div class="sig-block">
      <strong>${order.mechanic} / ${settings.adminName}</strong><br/>
      Firma y Sello ${settings.workshopName}<br/>
      NIT: ${settings.workshopNit}
    </div>
    <div class="sig-block">
      <strong>${order.client}</strong><br/>
      CI / NIT: ${order.clientNitOrCi || '________________'}<br/>
      Recibí motocicleta y piezas usadas en conformidad
    </div>
  </div>
</body>
</html>`
  const win = window.open('', '_blank', 'width=860,height=780')
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
  }
}

// ==========================================
// ESTRATEGIAS DE CONTRASEÑAS INTELIGENTES PARA CLIENTES
// ==========================================

export type ClientPinStrategy = 'phone_last4' | 'ci_last4' | 'random_secure' | 'custom'

export interface SmartClientPinOptions {
  phone?: string
  nitOrCi?: string
  strategy?: ClientPinStrategy
}

export interface GeneratedClientPin {
  pin: string
  strategyUsed: ClientPinStrategy
  explanation: string
}

// Patrones triviales o débiles a evitar en PINs automáticos
const WEAK_PIN_PATTERNS = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '2345', '3456', '4567', '5678', '6789', '0123',
  '4321', '5432', '6543', '7654', '8765', '9876', '3210',
  '1000', '2000', '2024', '2025', '2026', '1212', '6969'
])

/**
 * Genera un PIN numérico de 4 dígitos robusto que descarta secuencias predecibles
 */
export function generateSecure4DigitPin(): string {
  for (let i = 0; i < 50; i++) {
    const num = Math.floor(1000 + Math.random() * 9000).toString()
    if (!WEAK_PIN_PATTERNS.has(num)) {
      return num
    }
  }
  return '7392'
}

/**
 * Genera una contraseña / PIN inteligente para el cliente:
 * - 'phone_last4' (por defecto): Toma los últimos 4 dígitos del WhatsApp del cliente (imposible de olvidar).
 * - 'ci_last4': Toma los últimos 4 dígitos numéricos de su C.I. o NIT boliviano.
 * - 'random_secure': Genera un PIN no trivial de 4 dígitos.
 */
export function generateSmartClientPin(options: SmartClientPinOptions = {}): GeneratedClientPin {
  const strategy = options.strategy || 'phone_last4'
  const rawPhone = (options.phone || '').replace(/\D/g, '')
  const rawCi = (options.nitOrCi || '').replace(/\D/g, '')

  if (strategy === 'phone_last4' && rawPhone.length >= 4) {
    const last4 = rawPhone.slice(-4)
    return {
      pin: last4,
      strategyUsed: 'phone_last4',
      explanation: `Últimos 4 dígitos del WhatsApp (...${last4})`,
    }
  }

  if (strategy === 'ci_last4' && rawCi.length >= 4) {
    const last4 = rawCi.slice(-4)
    return {
      pin: last4,
      strategyUsed: 'ci_last4',
      explanation: `Últimos 4 dígitos del C.I. / NIT (...${last4})`,
    }
  }

  // Si eligió teléfono pero todavía no tiene 4 dígitos, pero sí ingresó CI
  if (strategy === 'phone_last4' && rawCi.length >= 4) {
    const last4 = rawCi.slice(-4)
    return {
      pin: last4,
      strategyUsed: 'ci_last4',
      explanation: `Últimos 4 dígitos del C.I. / NIT (...${last4})`,
    }
  }

  // Fallback seguro de 4 dígitos
  const securePin = generateSecure4DigitPin()
  return {
    pin: securePin,
    strategyUsed: 'random_secure',
    explanation: 'PIN de 4 dígitos seguro y no secuencial',
  }
}

/**
 * Validador unificado de credenciales del cliente.
 * Comprueba de manera tolerante y segura el PIN explícito, el CI/NIT,
 * los últimos 4 dígitos del celular, o credenciales maestras de test.
 */
export function isClientPinValid(
  pinAttempt: string,
  order: { clientPin?: string; clientNitOrCi?: string; phone?: string }
): boolean {
  if (!pinAttempt) return false
  const clean = pinAttempt.trim().toLowerCase().replace(/\s+/g, '')
  if (!clean) return false

  // Atajos de prueba en entorno demo
  if (clean === '1234' || clean === 'cliente') return true

  // 1. Coincidencia con clientPin explícito
  if (order.clientPin) {
    const cleanPin = order.clientPin.trim().toLowerCase().replace(/\s+/g, '')
    if (clean === cleanPin) return true
  }

  // 2. Coincidencia con clientNitOrCi
  if (order.clientNitOrCi) {
    const rawCi = order.clientNitOrCi.trim().toLowerCase().replace(/\s+/g, '')
    if (clean === rawCi) return true

    // Si tiene un formato compuesto como "4821 · 7492011 SC"
    const parts = order.clientNitOrCi.split(/[\s·-]+/).map((p) => p.trim().toLowerCase())
    if (parts.includes(clean)) return true

    const digitsCi = order.clientNitOrCi.replace(/\D/g, '')
    if (digitsCi.length >= 4 && clean === digitsCi.slice(-4)) return true
  }

  // 3. Coincidencia con celular del cliente
  if (order.phone) {
    const phoneDigits = order.phone.replace(/\D/g, '')
    if (clean === phoneDigits) return true
    if (phoneDigits.length >= 4 && clean === phoneDigits.slice(-4)) return true
  }

  return false
}

