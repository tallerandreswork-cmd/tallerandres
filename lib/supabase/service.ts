import { isSupabaseConfigured, supabase } from './client'
import type {
  ActivityItem,
  FinanceTransaction,
  InventoryItem,
  Order,
  OrderStatus,
  WorkshopSettings,
} from '../workshop-data'

// Mapeo entre modelo Order y fila Supabase
function orderToRow(o: Order) {
  const compositeNitCi = o.clientPin
    ? o.clientNitOrCi && o.clientNitOrCi !== o.clientPin
      ? `${o.clientPin} · ${o.clientNitOrCi}`
      : o.clientPin
    : o.clientNitOrCi || null

  return {
    id: o.id,
    bike: o.bike,
    plate: o.plate,
    client: o.client,
    client_nit_ci: compositeNitCi,
    phone: o.phone,
    email: o.email || null,
    service: o.service,
    diagnosis: o.diagnosis,
    mileage: o.mileage || null,
    fuel_level: o.fuelLevel || null,
    mechanic: o.mechanic,
    status: o.status,
    eta: o.eta,
    created_at_label: o.createdAt,
    accent: o.accent,
    avatar: o.avatar,
    mechanic_note: o.mechanicNote,
    mechanic_note_updated_at: o.mechanicNoteUpdatedAt,
    quote_approved: o.quoteApproved,
    quote_approved_at: o.quoteApprovedAt || null,
    paid: o.paid ?? false,
    paid_method: o.paidMethod || null,
    qr_payment_notified: o.qrPaymentNotified ?? false,
    client_comment: o.clientComment || null,
    photos_count: o.photosCount,
    timeline: o.timeline,
    replaced_parts: o.replacedParts,
    health_check: o.healthCheck,
    intake_checklist: o.intakeChecklist || {},
    next_service_km: o.nextServiceKm || null,
    quote_items: o.quoteItems,
    history: o.history,
    whatsapp_logs: o.whatsappLogs || [],
  }
}

interface OrderRow {
  id: string
  bike: string
  plate: string
  client: string
  client_nit_ci?: string | null
  phone: string
  email?: string | null
  service: string
  diagnosis: string
  mileage?: string | null
  fuel_level?: string | null
  mechanic: string
  status: OrderStatus
  eta: string
  created_at_label?: string | null
  accent: Order['accent']
  avatar: string
  mechanic_note: string
  mechanic_note_updated_at: string
  quote_approved: boolean
  quote_approved_at?: string | null
  paid: boolean
  paid_method?: Order['paidMethod'] | null
  qr_payment_notified?: boolean | null
  client_comment?: string | null
  photos_count: number
  timeline: Order['timeline']
  replaced_parts: Order['replacedParts']
  health_check: Order['healthCheck']
  intake_checklist?: Order['intakeChecklist']
  next_service_km?: string | null
  quote_items: Order['quoteItems']
  history: Order['history']
  whatsapp_logs?: Order['whatsappLogs']
}

function rowToOrder(r: OrderRow): Order {
  const rawNitCi = r.client_nit_ci || undefined
  let parsedPin: string | undefined = undefined
  let parsedNitCi: string | undefined = rawNitCi

  if (rawNitCi && rawNitCi.includes(' · ')) {
    const parts = rawNitCi.split(' · ')
    parsedPin = parts[0]?.trim()
    parsedNitCi = parts[1]?.trim()
  } else if (rawNitCi) {
    parsedPin = rawNitCi.split(' ')[0]
  }

  return {
    id: r.id,
    bike: r.bike,
    plate: r.plate,
    client: r.client,
    clientPin: parsedPin,
    clientNitOrCi: parsedNitCi,
    phone: r.phone,
    email: r.email || '',
    service: r.service,
    diagnosis: r.diagnosis,
    mileage: r.mileage || undefined,
    fuelLevel: r.fuel_level || undefined,
    mechanic: r.mechanic,
    status: r.status,
    eta: r.eta,
    createdAt: r.created_at_label || 'Hoy, 09:30',
    accent: r.accent || 'orange',
    avatar: r.avatar || 'MR',
    mechanicNote: r.mechanic_note || '',
    mechanicNoteUpdatedAt: r.mechanic_note_updated_at || 'Hace un momento',
    quoteItems: r.quote_items || [],
    quoteApproved: r.quote_approved ?? false,
    quoteApprovedAt: r.quote_approved_at || undefined,
    paid: r.paid ?? false,
    paidMethod: r.paid_method || undefined,
    qrPaymentNotified: r.qr_payment_notified ?? false,
    clientComment: r.client_comment || undefined,
    photosCount: r.photos_count || 0,
    timeline: r.timeline,
    replacedParts: r.replaced_parts || [],
    healthCheck: r.health_check || [],
    intakeChecklist: r.intake_checklist,
    nextServiceKm: r.next_service_km || undefined,
    history: r.history || [],
    whatsappLogs: r.whatsapp_logs || [],
  }
}

interface InventoryRow {
  id: string
  sku: string
  name: string
  brand: string
  category: InventoryItem['category']
  stock: number
  min_stock: number
  unit_price_bob: number
}

function rowToInventory(r: InventoryRow): InventoryItem {
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    brand: r.brand,
    category: r.category,
    stock: Number(r.stock),
    minStock: Number(r.min_stock),
    unitPriceBOB: Number(r.unit_price_bob),
  }
}

interface TransactionRow {
  id: string
  date: string
  month: string
  description: string
  category: FinanceTransaction['category']
  type: 'income' | 'expense'
  amount: number
  payment_method?: FinanceTransaction['paymentMethod']
  status?: FinanceTransaction['status']
  provider_or_client?: string | null
  invoice_or_doc?: string | null
  order_id?: string | null
  notes?: string | null
}

function rowToTransaction(r: TransactionRow): FinanceTransaction {
  return {
    id: r.id,
    date: r.date,
    month: r.month,
    description: r.description,
    category: r.category,
    type: r.type,
    amount: Number(r.amount),
    paymentMethod: r.payment_method,
    status: r.status,
    providerOrClient: r.provider_or_client || undefined,
    invoiceOrDoc: r.invoice_or_doc || undefined,
    orderId: r.order_id || undefined,
    notes: r.notes || undefined,
  }
}

// Cargar todos los datos desde Supabase
export async function fetchWorkshopDataFromSupabase(): Promise<{
  orders: Order[]
  inventory: InventoryItem[]
  transactions: FinanceTransaction[]
  activities: ActivityItem[]
  settings?: WorkshopSettings
} | null> {
  if (!supabase) return null

  try {
    const [ordersRes, invRes, txRes, actRes, settingsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('inventory').select('*').order('name'),
      supabase.from('finance_transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(40),
      supabase.from('workshop_settings').select('*').eq('id', 'default_settings').maybeSingle(),
    ])

    if (ordersRes.error || invRes.error || txRes.error) {
      console.warn('Error leyendo datos de Supabase, usando fallback local:', {
        ordersErr: ordersRes.error,
        invErr: invRes.error,
        txErr: txRes.error,
      })
      return null
    }

    const orders = (ordersRes.data || []).map((r) => rowToOrder(r as unknown as OrderRow))
    const inventory = (invRes.data || []).map((r) => rowToInventory(r as unknown as InventoryRow))
    const transactions = (txRes.data || []).map((r) =>
      rowToTransaction(r as unknown as TransactionRow)
    )
    const activities: ActivityItem[] = (actRes.data || []).map((a: {
      id: string
      tone: ActivityItem['tone']
      icon_type: ActivityItem['iconType']
      actor: string
      action: string
      target: string
      order_id?: string | null
      time: string
      read: boolean
    }) => ({
      id: a.id,
      tone: a.tone,
      iconType: a.icon_type,
      actor: a.actor,
      action: a.action,
      target: a.target,
      orderId: a.order_id || undefined,
      time: a.time,
      read: a.read,
    }))

    let settings: WorkshopSettings | undefined = undefined
    if (settingsRes.data) {
      const s = settingsRes.data
      settings = {
        workshopName: s.workshop_name,
        workshopSubtitle: s.workshop_subtitle,
        workshopPhone: s.workshop_phone,
        workshopNit: s.workshop_nit,
        bankName: s.bank_name,
        bankAccount: s.bank_account,
        whatsappSignature: s.whatsapp_signature,
        defaultLaborRate: Number(s.default_labor_rate),
        monthlyExpenseBudget: Number(s.monthly_expense_budget),
        adminName: s.admin_name,
        adminRole: s.admin_role,
        mechanics: s.mechanics || ['Marco Ríos', 'Lucía Vidal'],
        notificationsEnabled: s.notifications_enabled,
      }
    }

    return { orders, inventory, transactions, activities, settings }
  } catch (err) {
    console.error('Error conectando a Supabase:', err)
    return null
  }
}

// Guardar o actualizar una orden en Supabase
export async function saveOrderToSupabase(order: Order): Promise<boolean> {
  if (!supabase) return false
  try {
    const row = orderToRow(order)
    const { error } = await supabase.from('orders').upsert(row, { onConflict: 'id' })
    if (error) {
      console.error('Error guardando orden en Supabase:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Error en saveOrderToSupabase:', err)
    return false
  }
}

// Actualizar estado de una orden
export async function updateOrderStatusInSupabase(
  orderId: string,
  newStatus: OrderStatus
): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
    return !error
  } catch {
    return false
  }
}

// Guardar una transacción financiera
export async function saveTransactionToSupabase(tx: FinanceTransaction): Promise<boolean> {
  if (!supabase) return false
  try {
    const row = {
      id: tx.id,
      date: tx.date,
      month: tx.month,
      description: tx.description,
      category: tx.category,
      type: tx.type,
      amount: tx.amount,
      payment_method: tx.paymentMethod || 'QR Simple',
      status: tx.status || 'Pagado',
      provider_or_client: tx.providerOrClient || null,
      invoice_or_doc: tx.invoiceOrDoc || null,
      order_id: tx.orderId || null,
      notes: tx.notes || null,
    }
    const { error } = await supabase
      .from('finance_transactions')
      .upsert(row, { onConflict: 'id' })
    return !error
  } catch {
    return false
  }
}

// Eliminar transacción de Supabase
export async function deleteTransactionFromSupabase(txId: string): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('finance_transactions').delete().eq('id', txId)
    return !error
  } catch {
    return false
  }
}

// Guardar o actualizar ítem de inventario
export async function saveInventoryItemToSupabase(item: InventoryItem): Promise<boolean> {
  if (!supabase) return false
  try {
    const row = {
      id: item.id,
      sku: item.sku,
      name: item.name,
      brand: item.brand,
      category: item.category,
      stock: item.stock,
      min_stock: item.minStock,
      unit_price_bob: item.unitPriceBOB,
    }
    const { error } = await supabase.from('inventory').upsert(row, { onConflict: 'id' })
    return !error
  } catch {
    return false
  }
}

// Eliminar ítem de inventario de Supabase
export async function deleteInventoryItemFromSupabase(itemId: string): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('inventory').delete().eq('id', itemId)
    return !error
  } catch {
    return false
  }
}

// Guardar actividad de taller
export async function saveActivityToSupabase(act: ActivityItem): Promise<boolean> {
  if (!supabase) return false
  try {
    const row = {
      id: act.id,
      tone: act.tone,
      icon_type: act.iconType,
      actor: act.actor,
      action: act.action,
      target: act.target,
      order_id: act.orderId || null,
      time: act.time,
      read: act.read,
    }
    const { error } = await supabase.from('activities').upsert(row, { onConflict: 'id' })
    return !error
  } catch {
    return false
  }
}

// Sembrar datos iniciales en Supabase con 1 clic si la base de datos está vacía
export async function seedInitialDataToSupabase(
  initialOrders: Order[],
  initialInventory: InventoryItem[],
  initialTransactions: FinanceTransaction[],
  initialSettings: WorkshopSettings
): Promise<{ success: boolean; message: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase no está configurado en .env.local' }
  }

  try {
    // 1. Guardar settings
    await supabase.from('workshop_settings').upsert({
      id: 'default_settings',
      workshop_name: initialSettings.workshopName,
      workshop_subtitle: initialSettings.workshopSubtitle,
      workshop_phone: initialSettings.workshopPhone,
      workshop_nit: initialSettings.workshopNit,
      bank_name: initialSettings.bankName,
      bank_account: initialSettings.bankAccount,
      whatsapp_signature: initialSettings.whatsappSignature,
      default_labor_rate: initialSettings.defaultLaborRate,
      monthly_expense_budget: initialSettings.monthlyExpenseBudget,
      admin_name: initialSettings.adminName,
      admin_role: initialSettings.adminRole,
      mechanics: initialSettings.mechanics,
      notifications_enabled: initialSettings.notificationsEnabled,
    })

    // 2. Guardar órdenes iniciales
    const orderRows = initialOrders.map(orderToRow)
    await supabase.from('orders').upsert(orderRows, { onConflict: 'id' })

    // 3. Guardar inventario
    const invRows = initialInventory.map((i) => ({
      id: i.id,
      sku: i.sku,
      name: i.name,
      brand: i.brand,
      category: i.category,
      stock: i.stock,
      min_stock: i.minStock,
      unit_price_bob: i.unitPriceBOB,
    }))
    await supabase.from('inventory').upsert(invRows, { onConflict: 'id' })

    // 4. Guardar finanzas iniciales
    const txRows = initialTransactions.map((tx) => ({
      id: tx.id,
      date: tx.date,
      month: tx.month,
      description: tx.description,
      category: tx.category,
      type: tx.type,
      amount: tx.amount,
      payment_method: tx.paymentMethod || 'QR Simple',
      status: tx.status || 'Pagado',
      provider_or_client: tx.providerOrClient || null,
      invoice_or_doc: tx.invoiceOrDoc || null,
      order_id: tx.orderId || null,
    }))
    await supabase.from('finance_transactions').upsert(txRows, { onConflict: 'id' })

    return {
      success: true,
      message: `¡Base de datos sembrada con éxito en Supabase! (${initialOrders.length} órdenes, ${initialInventory.length} repuestos Kardex y finanzas en Bs)`,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: `Error al sembrar datos: ${errorMsg}` }
  }
}

// Suscripción Realtime para sincronización instantánea entre Admin, Mecánico y Cliente
export function subscribeToWorkshopRealtime(
  onOrdersUpdated: () => void,
  onActivitiesUpdated: () => void
) {
  if (!supabase) return () => {}

  const channel = supabase
    .channel('workshop-realtime-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => {
        onOrdersUpdated()
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'activities' },
      () => {
        onActivitiesUpdated()
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inventory' },
      () => {
        onOrdersUpdated()
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'finance_transactions' },
      () => {
        onOrdersUpdated()
      }
    )
    .subscribe()

  return () => {
    if (supabase) {
      supabase.removeChannel(channel)
    }
  }
}
