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
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Filter,
  MessageCircle,
  PieChart as PieChartIcon,
  Plus,
  QrCode,
  Receipt,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  calculateExpenseBreakdown,
  calculateIncomeCategoryBreakdown,
  calculateOrderTotal,
  calculatePaymentMethodBreakdown,
  FinanceTransaction,
  formatCLP,
  formatCompactCLP,
  MONTHLY_CHART_DATA,
  Order,
  PAYMENT_METHODS,
  PaymentMethod,
  PaymentStatus,
  QUICK_EXPENSE_PRESETS,
  QUICK_INCOME_PRESETS,
  TRANSACTION_CATEGORIES,
  TransactionCategory,
  WhatsAppTemplateType,
  WorkshopSettings,
} from '@/lib/workshop-data'

export type FinanceSubTab = 'analytics' | 'receivables' | 'register' | 'ledger'

interface FinanceAnalyticsModuleProps {
  transactions: FinanceTransaction[]
  orders: Order[]
  settings: WorkshopSettings
  activeSubTab: FinanceSubTab
  onSubTabChange: (tab: FinanceSubTab) => void
  onSaveTransaction: (
    txData: {
      description: string
      category: TransactionCategory
      type: 'income' | 'expense'
      amount: number
      paymentMethod: PaymentMethod
      status: PaymentStatus
      providerOrClient: string
      invoiceOrDoc: string
      orderId?: string
    },
    editingId: string | null
  ) => void
  onToggleTransactionStatus: (txId: string, nextStatus: PaymentStatus) => void
  onDeleteTransaction: (txId: string) => void
  onCollectOrderPayment: (order: Order, method?: PaymentMethod) => void
  onRevertOrderPayment?: (order: Order) => void
  onOpenWhatsApp?: (order: Order, template?: WhatsAppTemplateType) => void
  onSelectOrder: (orderId: string) => void
  onExportCSV: () => void
  isSupabaseOnline?: boolean
}

const EXPENSE_PIE_COLORS = [
  '#ea580c', // Naranja intenso (Sueldos / Repuestos)
  '#2563eb', // Azul corporativo
  '#f59e0b', // Ámbar
  '#7c3aed', // Violeta
  '#0d9488', // Teal
  '#db2777', // Rosa fuerte
  '#4f46e5', // Índigo
  '#64748b', // Slate
]

const PAYMENT_PIE_COLORS: Record<PaymentMethod, string> = {
  'QR Simple': '#16a34a',
  'Factura 30 días': '#2563eb',
  Efectivo: '#ea580c',
  Transferencia: '#7c3aed',
  'Tarjeta Débito/Crédito': '#0d9488',
}

export function FinanceAnalyticsModule({
  transactions,
  orders,
  settings,
  activeSubTab,
  onSubTabChange,
  onSaveTransaction,
  onToggleTransactionStatus,
  onDeleteTransaction,
  onCollectOrderPayment,
  onRevertOrderPayment,
  onOpenWhatsApp,
  onSelectOrder,
  onExportCSV,
  isSupabaseOnline = false,
}: FinanceAnalyticsModuleProps) {
  // Filtros del Libro Mayor Contable
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('Todas')
  const [txMethodFilter, setTxMethodFilter] = useState<string>('Todos')
  const [txStatusFilter, setTxStatusFilter] = useState<'Todos' | PaymentStatus>('Todos')
  const [txSearch, setTxSearch] = useState('')

  // Filtros del Módulo Quién Pagó / Quién Debe
  const [receivablesFilter, setReceivablesFilter] = useState<'all' | 'unpaid' | 'paid'>('all')
  const [receivablesSearch, setReceivablesSearch] = useState('')
  const [receivablesMethodFilter, setReceivablesMethodFilter] = useState<string>('Todos')

  // Estado interactivo de los gráficos de torta
  const [paymentChartScope, setPaymentChartScope] = useState<'income' | 'expense' | 'all'>('income')
  const [selectedPieCategory, setSelectedPieCategory] = useState<string | null>(null)

  // Estado del formulario de registro contable (Ingreso / Egreso)
  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [txDesc, setTxDesc] = useState('')
  const [txCategory, setTxCategory] = useState<TransactionCategory>('Repuestos')
  const [txAmount, setTxAmount] = useState('')
  const [txMethod, setTxMethod] = useState<PaymentMethod>('QR Simple')
  const [txStatus, setTxStatus] = useState<PaymentStatus>('Pagado')
  const [txProvider, setTxProvider] = useState('')
  const [txDoc, setTxDoc] = useState('')
  const [txOrderId, setTxOrderId] = useState('')
  const [selectedCollectMethod, setSelectedCollectMethod] = useState<Record<string, PaymentMethod>>(
    {}
  )

  // Cálculos financieros principales
  const financialTotals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0)
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0)
    const pendingPayables = transactions
      .filter((t) => t.type === 'expense' && t.status === 'Pendiente de pago')
      .reduce((acc, t) => acc + t.amount, 0)
    const fixedCategories: TransactionCategory[] = [
      'Arriendo / Fijos',
      'Sueldos y comisiones',
      'Servicios básicos (Luz/Agua/Net)',
      'Impuestos / Contabilidad',
    ]
    const fixedExpenses = transactions
      .filter((t) => t.type === 'expense' && fixedCategories.includes(t.category))
      .reduce((acc, t) => acc + t.amount, 0)
    const variableExpenses = Math.max(0, expense - fixedExpenses)
    const net = income - expense
    const marginPct = income > 0 ? Math.round((net / income) * 100) : 0
    const qrIncome = transactions
      .filter((t) => t.type === 'income' && t.paymentMethod === 'QR Simple')
      .reduce((acc, t) => acc + t.amount, 0)

    return {
      income,
      expense,
      net,
      marginPct,
      pendingPayables,
      fixedExpenses,
      variableExpenses,
      qrIncome,
      incomeCount: transactions.filter((t) => t.type === 'income').length,
      expenseCount: transactions.filter((t) => t.type === 'expense').length,
    }
  }, [transactions])

  const expenseBreakdown = useMemo(
    () => calculateExpenseBreakdown(transactions),
    [transactions]
  )

  const incomeBreakdown = useMemo(
    () => calculateIncomeCategoryBreakdown(transactions),
    [transactions]
  )

  const paymentMethodBreakdown = useMemo(
    () => calculatePaymentMethodBreakdown(transactions, paymentChartScope),
    [transactions, paymentChartScope]
  )

  const unpaidOrders = useMemo(() => orders.filter((o) => !o.paid), [orders])
  const pendingReceivablesTotal = useMemo(
    () => unpaidOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0),
    [unpaidOrders]
  )

  const paidOrders = useMemo(() => orders.filter((o) => o.paid), [orders])
  const paidOrdersTotal = useMemo(
    () => paidOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0),
    [paidOrders]
  )
  const totalBilledOrders = pendingReceivablesTotal + paidOrdersTotal
  const collectionRate =
    totalBilledOrders > 0 ? Math.round((paidOrdersTotal / totalBilledOrders) * 100) : 100
  const qrCollectedTotal = useMemo(
    () =>
      paidOrders
        .filter((o) => o.paidMethod === 'QR Simple')
        .reduce((sum, o) => sum + calculateOrderTotal(o), 0),
    [paidOrders]
  )

  const filteredReceivablesOrders = useMemo(() => {
    return orders.filter((o) => {
      if (receivablesFilter === 'unpaid' && o.paid) return false
      if (receivablesFilter === 'paid' && !o.paid) return false
      if (
        receivablesMethodFilter !== 'Todos' &&
        o.paid &&
        (o.paidMethod || 'QR Simple') !== receivablesMethodFilter
      ) {
        return false
      }
      if (!receivablesSearch.trim()) return true
      const q = receivablesSearch.toLowerCase()
      return (
        o.client.toLowerCase().includes(q) ||
        (o.clientNitOrCi && o.clientNitOrCi.toLowerCase().includes(q)) ||
        o.bike.toLowerCase().includes(q) ||
        o.plate.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.service.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q)
      )
    })
  }, [orders, receivablesFilter, receivablesMethodFilter, receivablesSearch])

  // Datos para Gráfico de Barras Mensual (Recharts)
  const monthlySeriesData = useMemo(() => {
    return MONTHLY_CHART_DATA.map((item, idx) => {
      const isCurrentMonth = idx === MONTHLY_CHART_DATA.length - 1
      const inc = isCurrentMonth ? financialTotals.income : item.baseIncome
      const exp = isCurrentMonth ? financialTotals.expense : item.baseExpense
      return {
        month: item.month,
        fullLabel: item.label,
        Ingresos: inc,
        Egresos: exp,
        Utilidad: Math.max(0, inc - exp),
      }
    })
  }, [financialTotals.income, financialTotals.expense])

  // Datos para Torta de Estructura Global (Costos Fijos, Variables y Ganancia Neta)
  const structurePieData = useMemo(() => {
    return [
      {
        name: 'Ganancia Neta (Utilidad)',
        value: Math.max(0, financialTotals.net),
        color: '#16a34a',
      },
      {
        name: 'Costos Fijos (Planilla/Alquiler/Servicios)',
        value: financialTotals.fixedExpenses,
        color: '#2563eb',
      },
      {
        name: 'Costos Variables (Repuestos/Insumos)',
        value: financialTotals.variableExpenses,
        color: '#ea580c',
      },
    ].filter((d) => d.value > 0)
  }, [financialTotals.net, financialTotals.fixedExpenses, financialTotals.variableExpenses])

  const budgetUsagePct = useMemo(() => {
    if (settings.monthlyExpenseBudget <= 0) return 0
    return Math.min(
      100,
      Math.round((financialTotals.expense / settings.monthlyExpenseBudget) * 100)
    )
  }, [financialTotals.expense, settings.monthlyExpenseBudget])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false
      if (txCategoryFilter !== 'Todas' && tx.category !== txCategoryFilter) return false
      if (txMethodFilter !== 'Todos' && (tx.paymentMethod ?? 'Transferencia') !== txMethodFilter)
        return false
      if (txStatusFilter !== 'Todos' && (tx.status ?? 'Pagado') !== txStatusFilter) return false
      if (!txSearch.trim()) return true
      return `${tx.description} ${tx.providerOrClient || ''} ${tx.invoiceOrDoc || ''} ${tx.category} ${tx.orderId || ''}`
        .toLowerCase()
        .includes(txSearch.toLowerCase())
    })
  }, [transactions, txTypeFilter, txCategoryFilter, txMethodFilter, txStatusFilter, txSearch])

  function handleOpenNewEntry(mode: 'income' | 'expense') {
    setEditingTxId(null)
    setTxType(mode)
    setTxCategory(mode === 'income' ? 'Servicio' : 'Repuestos')
    setTxMethod('QR Simple')
    setTxStatus('Pagado')
    setTxDesc('')
    setTxAmount('')
    setTxProvider('')
    setTxDoc('')
    setTxOrderId('')
    onSubTabChange('register')
  }

  function handleStartEdit(tx: FinanceTransaction) {
    setEditingTxId(tx.id)
    setTxType(tx.type)
    setTxCategory(tx.category)
    setTxDesc(tx.description)
    setTxAmount(String(tx.amount))
    setTxMethod(tx.paymentMethod ?? 'QR Simple')
    setTxStatus(tx.status ?? 'Pagado')
    setTxProvider(tx.providerOrClient ?? '')
    setTxDoc(tx.invoiceOrDoc ?? '')
    setTxOrderId(tx.orderId ?? '')
    onSubTabChange('register')
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = Number(txAmount.replace(/\D+/g, ''))
    if (!txDesc.trim() || !amountNum) return

    onSaveTransaction(
      {
        description: txDesc.trim(),
        category: txCategory,
        type: txType,
        amount: amountNum,
        paymentMethod: txMethod,
        status: txStatus,
        providerOrClient:
          txProvider.trim() ||
          (txType === 'income' ? 'Cliente Taller' : 'Proveedor Taller'),
        invoiceOrDoc:
          txDoc.trim() ||
          `${txType === 'income' ? 'REC' : 'FAC'}-${Math.floor(1000 + Math.random() * 9000)}`,
        orderId: txOrderId || undefined,
      },
      editingTxId
    )

    setEditingTxId(null)
    setTxDesc('')
    setTxAmount('')
    setTxProvider('')
    setTxDoc('')
    setTxOrderId('')
  }

  return (
    <div className="section-container">
      {/* 1. RESUMEN EJECUTIVO DE FINANZAS (4 TARJETAS KPI EN BS) */}
      <div className="stats-grid" style={{ padding: 0 }}>
        <article
          className="stat-card clickable"
          onClick={() => {
            setTxTypeFilter('income')
            setTxCategoryFilter('Todas')
            onSubTabChange('ledger')
          }}
        >
          <div className="stat-card-top">
            <div className="stat-icon green">
              <ArrowUpRight />
            </div>
            <span className="stat-change">
              {financialTotals.incomeCount} cobros · QR Simple: {formatCompactCLP(financialTotals.qrIncome)}
            </span>
          </div>
          <p className="stat-label">Ingresos Totales Cobrados</p>
          <h2 className="stat-value">{formatCLP(financialTotals.income)}</h2>
        </article>

        <article
          className="stat-card clickable"
          onClick={() => {
            setTxTypeFilter('expense')
            setTxCategoryFilter('Todas')
            onSubTabChange('ledger')
          }}
        >
          <div className="stat-card-top">
            <div className="stat-icon orange">
              <ArrowDownRight />
            </div>
            <span className="stat-change">
              Fijos: {formatCompactCLP(financialTotals.fixedExpenses)} · Var:{' '}
              {formatCompactCLP(financialTotals.variableExpenses)}
            </span>
          </div>
          <p className="stat-label">Egresos y Gastos Operativos</p>
          <h2 className="stat-value">{formatCLP(financialTotals.expense)}</h2>
        </article>

        <article
          className="stat-card clickable"
          onClick={() => onSubTabChange('analytics')}
        >
          <div className="stat-card-top">
            <div className="stat-icon blue">
              <TrendingUp />
            </div>
            <span className="stat-change">{financialTotals.marginPct}% rentabilidad neta</span>
          </div>
          <p className="stat-label">Utilidad / Ganancia Neta Caja</p>
          <h2 className="stat-value">{formatCLP(financialTotals.net)}</h2>
        </article>

        <article
          className="stat-card clickable"
          onClick={() => onSubTabChange('receivables')}
        >
          <div className="stat-card-top">
            <div className="stat-icon purple">
              <Wallet />
            </div>
            <span className="stat-change">
              {unpaidOrders.length} {unpaidOrders.length === 1 ? 'cliente debe' : 'clientes deben'}
            </span>
          </div>
          <p className="stat-label">Por Cobrar ({unpaidOrders.length} OTs activas)</p>
          <h2 className="stat-value">{formatCLP(pendingReceivablesTotal)}</h2>
        </article>
      </div>

      {/* 2. NAVEGACIÓN MODULAR DE FINANZAS (SEPARACIÓN LIMPIA DE INTERFACES) */}
      <div className="finance-module-nav">
        <div className="finance-subtabs">
          <button
            type="button"
            className={`finance-subtab-btn ${activeSubTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onSubTabChange('analytics')}
          >
            <PieChartIcon style={{ width: '15px', height: '15px' }} />
            <div>
              <strong>1. Estadísticas y Gráficos</strong>
              <span>Distribución de gastos, medios de pago QR y evolución en Bs</span>
            </div>
          </button>

          <button
            type="button"
            className={`finance-subtab-btn ${activeSubTab === 'receivables' ? 'active' : ''}`}
            onClick={() => onSubTabChange('receivables')}
          >
            <CreditCard style={{ width: '15px', height: '15px' }} />
            <div>
              <strong>2. Quién Pagó y Quién Debe ({unpaidOrders.length} por cobrar)</strong>
              <span>Control de clientes, cobros QR y conciliación con DB</span>
            </div>
          </button>

          <button
            type="button"
            className={`finance-subtab-btn ${activeSubTab === 'register' ? 'active' : ''}`}
            onClick={() => onSubTabChange('register')}
          >
            <Plus style={{ width: '15px', height: '15px' }} />
            <div>
              <strong>3. Registrar Ingreso (+) o Egreso (-)</strong>
              <span>Terminal contable de caja y gastos operativos</span>
            </div>
          </button>

          <button
            type="button"
            className={`finance-subtab-btn ${activeSubTab === 'ledger' ? 'active' : ''}`}
            onClick={() => onSubTabChange('ledger')}
          >
            <FileText style={{ width: '15px', height: '15px' }} />
            <div>
              <strong>4. Libro Mayor Contable ({transactions.length})</strong>
              <span>Auditoría de facturas SIN, recibos, filtros y exportación CSV</span>
            </div>
          </button>
        </div>

        <div className="finance-quick-cta">
          <button
            type="button"
            className="button secondary"
            style={{
              height: '34px',
              fontSize: '11px',
              borderColor: '#bbf7d0',
              background: '#f0fdf4',
              color: '#15803d',
              fontWeight: 700,
            }}
            onClick={() => handleOpenNewEntry('income')}
          >
            <ArrowUpRight style={{ width: '13px' }} /> + Nuevo Ingreso (Bs)
          </button>
          <button
            type="button"
            className="button secondary"
            style={{
              height: '34px',
              fontSize: '11px',
              borderColor: '#fed7aa',
              background: '#fff7ed',
              color: '#c2410c',
              fontWeight: 700,
            }}
            onClick={() => handleOpenNewEntry('expense')}
          >
            <ArrowDownRight style={{ width: '13px' }} /> - Nuevo Egreso / Gasto (Bs)
          </button>
        </div>
      </div>

      {/* =====================================================================
          SUB-TAB 1: ESTADÍSTICAS Y GRÁFICOS DE TORTA (RECHARTS BI)
      ===================================================================== */}
      {activeSubTab === 'analytics' && (
        <div className="finance-analytics-stack">
          {/* FILA 1: DOS GRÁFICOS DE TORTA INTERACTIVOS (EGRESOS POR CATEGORÍA + CANALES DE PAGO QR/EFECTIVO) */}
          <div className="finance-charts-grid">
            {/* GRÁFICO DE TORTA 1: DISTRIBUCIÓN DE EGRESOS Y GASTOS POR CATEGORÍA */}
            <section className="panel finance-chart-panel">
              <div className="panel-heading">
                <div>
                  <span className="finance-kicker">GRÁFICO DE TORTA · CONTROL DE COSTOS</span>
                  <h2>Distribución de Egresos por Categoría ({formatCLP(financialTotals.expense)})</h2>
                  <p>
                    Haz clic en cualquier porción o categoría para auditar sus comprobantes en el Libro Mayor
                  </p>
                </div>
                <span
                  className={`status-pill ${
                    budgetUsagePct > 95
                      ? 'orange'
                      : budgetUsagePct > 80
                        ? 'blue'
                        : 'green'
                  }`}
                >
                  {budgetUsagePct}% del presupuesto ({formatCompactCLP(settings.monthlyExpenseBudget)})
                </span>
              </div>

              <div className="pie-analytics-layout">
                <div className="pie-canvas-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={94}
                        paddingAngle={3}
                        onClick={(entry) => {
                          const cat =
                            (entry as { category?: string; name?: string })?.category ??
                            entry?.name
                          if (cat) {
                            setSelectedPieCategory((prev) =>
                              prev === String(cat) ? null : String(cat)
                            )
                          }
                        }}
                        style={{ cursor: 'pointer', outline: 'none' }}
                      >
                        {expenseBreakdown.map((entry, idx) => {
                          const color = EXPENSE_PIE_COLORS[idx % EXPENSE_PIE_COLORS.length]
                          const isSelected =
                            !selectedPieCategory || selectedPieCategory === entry.category
                          return (
                            <Cell
                              key={entry.category}
                              fill={color}
                              fillOpacity={isSelected ? 1 : 0.35}
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          )
                        })}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          formatCLP(Number(value ?? 0)),
                          'Gasto registrado',
                        ]}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          fontWeight: 600,
                          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-center-label">
                    <span>Total Gastos</span>
                    <strong>{formatCompactCLP(financialTotals.expense)}</strong>
                    <small>{financialTotals.expenseCount} comprobantes</small>
                  </div>
                </div>

                <div className="pie-legend-list">
                  {expenseBreakdown.map((item, idx) => {
                    const color = EXPENSE_PIE_COLORS[idx % EXPENSE_PIE_COLORS.length]
                    const isHighlighted = selectedPieCategory === item.category
                    return (
                      <div
                        key={item.category}
                        className={`pie-legend-item ${isHighlighted ? 'highlighted' : ''}`}
                        onClick={() => {
                          setTxTypeFilter('expense')
                          setTxCategoryFilter(item.category)
                          onSubTabChange('ledger')
                        }}
                        title="Haz clic para ver estos gastos en el Libro Mayor"
                      >
                        <div className="pie-legend-left">
                          <span
                            className="pie-color-dot"
                            style={{ backgroundColor: color }}
                          />
                          <div>
                            <strong>{item.category}</strong>
                            <span>{item.count} mov.</span>
                          </div>
                        </div>
                        <div className="pie-legend-right">
                          <strong>{formatCLP(item.amount)}</strong>
                          <span className="pie-pct-badge">{item.percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Barra de salud presupuestaria */}
              <div className="finance-budget-bar-box">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    marginBottom: '6px',
                  }}
                >
                  <span>
                    Ejecución presupuestaria mensual:{' '}
                    <strong>{formatCLP(financialTotals.expense)}</strong> de{' '}
                    <strong>{formatCLP(settings.monthlyExpenseBudget)}</strong>
                  </span>
                  <strong
                    style={{
                      color:
                        financialTotals.expense <= settings.monthlyExpenseBudget
                          ? '#15803d'
                          : '#dc2626',
                    }}
                  >
                    {financialTotals.expense <= settings.monthlyExpenseBudget
                      ? `Disponible: ${formatCLP(settings.monthlyExpenseBudget - financialTotals.expense)}`
                      : `Excedido en: ${formatCLP(financialTotals.expense - settings.monthlyExpenseBudget)}`}
                  </strong>
                </div>
                <div className="progress-track" style={{ height: '8px' }}>
                  <div
                    className={`progress-fill ${budgetUsagePct > 90 ? 'orange' : 'green'}`}
                    style={{ width: `${budgetUsagePct}%` }}
                  />
                </div>
              </div>
            </section>

            {/* GRÁFICO DE TORTA 2: ARQUEO POR MEDIO DE PAGO (QR SIMPLE, EFECTIVO, TRANSFERENCIA, FACTURA) */}
            <section className="panel finance-chart-panel">
              <div className="panel-heading">
                <div>
                  <span className="finance-kicker">GRÁFICO DE TORTA · ARQUEO DE CAJA Y BANCOS</span>
                  <h2>Distribución por Medio de Pago (Bolivia)</h2>
                  <p>
                    Participación de QR Simple, Efectivo, Transferencias y Facturación Corporativa
                  </p>
                </div>
                <div className="mini-scope-pills">
                  <button
                    type="button"
                    className={`filter-chip ${paymentChartScope === 'income' ? 'active' : ''}`}
                    onClick={() => setPaymentChartScope('income')}
                  >
                    Ingresos (+)
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${paymentChartScope === 'expense' ? 'active' : ''}`}
                    onClick={() => setPaymentChartScope('expense')}
                  >
                    Egresos (-)
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${paymentChartScope === 'all' ? 'active' : ''}`}
                    onClick={() => setPaymentChartScope('all')}
                  >
                    Todo
                  </button>
                </div>
              </div>

              <div className="pie-analytics-layout">
                <div className="pie-canvas-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={paymentMethodBreakdown}
                        dataKey="amount"
                        nameKey="method"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={94}
                        paddingAngle={3}
                        style={{ cursor: 'pointer', outline: 'none' }}
                      >
                        {paymentMethodBreakdown.map((entry) => (
                          <Cell
                            key={entry.method}
                            fill={PAYMENT_PIE_COLORS[entry.method] || '#2563eb'}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          formatCLP(Number(value ?? 0)),
                          paymentChartScope === 'income'
                            ? 'Ingresos por este medio'
                            : paymentChartScope === 'expense'
                              ? 'Pagos por este medio'
                              : 'Volumen operado',
                        ]}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          fontWeight: 600,
                          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-center-label">
                    <span>
                      {paymentChartScope === 'income'
                        ? 'Total Ingresos'
                        : paymentChartScope === 'expense'
                          ? 'Total Egresos'
                          : 'Volumen Caja'}
                    </span>
                    <strong>
                      {formatCompactCLP(
                        paymentMethodBreakdown.reduce((acc, item) => acc + item.amount, 0)
                      )}
                    </strong>
                    <small>Arqueo verificado</small>
                  </div>
                </div>

                <div className="pie-legend-list">
                  {paymentMethodBreakdown.map((item) => {
                    const color = PAYMENT_PIE_COLORS[item.method] || '#2563eb'
                    return (
                      <div
                        key={item.method}
                        className="pie-legend-item"
                        onClick={() => {
                          setTxTypeFilter(paymentChartScope)
                          setTxMethodFilter(item.method)
                          onSubTabChange('ledger')
                        }}
                        title="Filtrar este medio de pago en el Libro Mayor"
                      >
                        <div className="pie-legend-left">
                          <span
                            className="pie-color-dot"
                            style={{ backgroundColor: color }}
                          />
                          <div>
                            <strong>{item.method}</strong>
                            <span>{item.count} operaciones</span>
                          </div>
                        </div>
                        <div className="pie-legend-right">
                          <strong>{formatCLP(item.amount)}</strong>
                          <span className="pie-pct-badge">{item.percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Resumen de Estructura de Ingresos (Servicios vs Repuestos) */}
              <div className="finance-budget-bar-box" style={{ background: '#f8fafc' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                  }}
                >
                  <span>
                    <strong>Origen de Ingresos:</strong>{' '}
                    {incomeBreakdown
                      .map((inc) => `${inc.category}: ${formatCLP(inc.amount)} (${inc.percentage}%)`)
                      .join(' · ')}
                  </span>
                  <span style={{ color: '#15803d', fontWeight: 700 }}>
                    QR Simple líder en taller
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* FILA 2: EVOLUCIÓN MENSUAL DE FLUJO DE CAJA (BARRAS RECHARTS) + TORTA DE ESTRUCTURA Y PANEL SIN BOLIVIA */}
          <div className="finance-charts-grid">
            {/* GRÁFICO DE BARRAS COMPARATIVO: INGRESOS VS EGRESOS VS UTILIDAD (MAY - OCT) */}
            <section className="panel finance-chart-panel">
              <div className="panel-heading">
                <div>
                  <span className="finance-kicker">EVOLUCIÓN SEMESTRAL · FLUJO DE CAJA EN BS</span>
                  <h2>Comparativa Mensual: Ingresos vs. Egresos vs. Utilidad</h2>
                  <p>
                    Rendimiento histórico de los últimos 6 meses en Bolivianos (Bs)
                  </p>
                </div>
                <div className="chart-legend">
                  <span>
                    <i className="dot green" style={{ background: '#16a34a' }} /> Ingresos
                  </span>
                  <span>
                    <i className="dot orange" style={{ background: '#ea580c' }} /> Egresos
                  </span>
                  <span>
                    <i className="dot blue" style={{ background: '#2563eb' }} /> Utilidad Neta
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', height: 270, marginTop: '8px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlySeriesData}
                    margin={{ top: 10, right: 12, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(val) => `Bs ${Math.round(Number(val) / 1000)}k`}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        formatCLP(Number(value ?? 0)),
                        String(name),
                      ]}
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="Ingresos" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Egresos" fill="#ea580c" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Utilidad" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* TORTA 3: ESTRUCTURA DEL INGRESO (COSTOS FIJOS VS VARIABLES VS UTILIDAD) + ESTIMACIÓN IMPUESTOS SIN */}
            <section className="panel finance-chart-panel">
              <div className="panel-heading">
                <div>
                  <span className="finance-kicker">RENTABILIDAD E IMPUESTOS BOLIVIA (SIN)</span>
                  <h2>Estructura Operativa y Punto de Equilibrio</h2>
                  <p>
                    ¿A dónde va cada Boliviano que ingresa al taller este mes?
                  </p>
                </div>
                <span className="status-pill green">Margen Neto {financialTotals.marginPct}%</span>
              </div>

              <div className="pie-analytics-layout">
                <div className="pie-canvas-wrapper" style={{ height: '210px' }}>
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie
                        data={structurePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {structurePieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [formatCLP(Number(value ?? 0)), 'Monto']}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-center-label">
                    <span>Utilidad</span>
                    <strong>{financialTotals.marginPct}%</strong>
                  </div>
                </div>

                <div className="pie-legend-list">
                  {structurePieData.map((item) => {
                    const pct =
                      financialTotals.income > 0
                        ? Math.round((item.value / financialTotals.income) * 100)
                        : 0
                    return (
                      <div key={item.name} className="pie-legend-item" style={{ cursor: 'default' }}>
                        <div className="pie-legend-left">
                          <span
                            className="pie-color-dot"
                            style={{ backgroundColor: item.color }}
                          />
                          <div>
                            <strong>{item.name}</strong>
                          </div>
                        </div>
                        <div className="pie-legend-right">
                          <strong>{formatCLP(item.value)}</strong>
                          <span className="pie-pct-badge">{pct}%</span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Resumen Tributario Referencial Bolivia */}
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ color: '#475569' }}>
                        Crédito Fiscal compras facturadas (IVA 13%):
                      </span>
                      <strong style={{ color: '#15803d' }}>
                        {formatCLP(Math.round(financialTotals.expense * 0.13))}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#475569' }}>
                        Punto de equilibrio costos fijos taller:
                      </span>
                      <strong style={{ color: '#0f172a' }}>
                        {formatCLP(financialTotals.fixedExpenses)} / mes
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: CONTROL DE CARTERA · QUIÉN PAGÓ Y QUIÉN DEBE (CONEXIÓN DB)
      ===================================================================== */}
      {activeSubTab === 'receivables' && (
        <div className="finance-analytics-stack">
          {/* BANNER SUPERIOR CON ESTADO DE DB Y CARTERA */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #fed7aa',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#fff7ed',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Clock style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Quién Debe (Por Cobrar)
                </span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#c2410c' }}>
                  {formatCLP(pendingReceivablesTotal)}
                </div>
                <div style={{ fontSize: '10.5px', color: '#9a3412', fontWeight: 600 }}>
                  {unpaidOrders.length} {unpaidOrders.length === 1 ? 'orden pendiente' : 'órdenes pendientes'}
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #bbf7d0',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Quién ya Pagó (Al Día)
                </span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d' }}>
                  {formatCLP(paidOrdersTotal)}
                </div>
                <div style={{ fontSize: '10.5px', color: '#166534', fontWeight: 600 }}>
                  {paidOrders.length} {paidOrders.length === 1 ? 'orden liquidada' : 'órdenes liquidadas'}
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <QrCode style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Cobrado con QR Simple
                </span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#1d4ed8' }}>
                  {formatCLP(qrCollectedTotal)}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Transferencias directas
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrendingUp style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Efectividad de Cobro
                </span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                  {collectionRate}%
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  De {formatCLP(totalBilledOrders)} facturados
                </div>
              </div>
            </div>
          </div>

          {/* PANEL PRINCIPAL: TABLA DE CONTROL DE QUIÉN PAGÓ Y QUIÉN DEBE */}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="finance-kicker">CONTROL DE CARTERA · BOLIVIA (BS)</span>
                <h2>Conciliación de Clientes: Quién Pagó y Quién Debe</h2>
                <p>
                  Estado financiero en tiempo real. Sincronizado automáticamente con tu base de datos Supabase
                  y con el libro mayor contable.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: isSupabaseOnline ? '#f0fdf4' : '#fff7ed',
                    color: isSupabaseOnline ? '#15803d' : '#c2410c',
                    border: isSupabaseOnline ? '1px solid #bbf7d0' : '1px solid #fed7aa',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: isSupabaseOnline ? '#16a34a' : '#ea580c',
                    }}
                  />
                  {isSupabaseOnline ? '☁️ Supabase DB Conectada' : '💾 Modo Local'}
                </span>
              </div>
            </div>

            {/* FILTROS Y BUSCADOR */}
            <div className="filter-bar" style={{ padding: '0 0 14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`filter-chip ${receivablesFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setReceivablesFilter('all')}
                >
                  🔘 Todos los Clientes ({orders.length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${receivablesFilter === 'unpaid' ? 'active' : ''}`}
                  onClick={() => setReceivablesFilter('unpaid')}
                  style={
                    receivablesFilter === 'unpaid'
                      ? { background: '#fff7ed', borderColor: '#fdba74', color: '#c2410c' }
                      : {}
                  }
                >
                  ⚠️ Quién Debe ({unpaidOrders.length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${receivablesFilter === 'paid' ? 'active' : ''}`}
                  onClick={() => setReceivablesFilter('paid')}
                  style={
                    receivablesFilter === 'paid'
                      ? { background: '#f0fdf4', borderColor: '#86efac', color: '#15803d' }
                      : {}
                  }
                >
                  ✅ Quién ya Pagó ({paidOrders.length})
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                <div className="search-box" style={{ maxWidth: '240px' }}>
                  <Search style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Cliente, CI, moto, placa, OT..."
                    value={receivablesSearch}
                    onChange={(e) => setReceivablesSearch(e.target.value)}
                    style={{ height: '30px', fontSize: '11px' }}
                  />
                </div>

                <select
                  value={receivablesMethodFilter}
                  onChange={(e) => setReceivablesMethodFilter(e.target.value)}
                  style={{
                    height: '30px',
                    fontSize: '11px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    padding: '0 8px',
                    background: '#ffffff',
                  }}
                >
                  <option value="Todos">Todos los Medios</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TABLA PRINCIPAL DE DEUDAS Y PAGOS */}
            {filteredReceivablesOrders.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13px',
                }}
              >
                No se encontraron órdenes con los filtros seleccionados.
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Orden / Fecha</th>
                      <th>Cliente & Contacto</th>
                      <th>Motocicleta & Placa</th>
                      <th>Diagnóstico & Reparación</th>
                      <th>Total OT (Bs)</th>
                      <th>Estado de Pago</th>
                      <th style={{ textAlign: 'right' }}>Acciones Directas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceivablesOrders.map((order) => {
                      const total = calculateOrderTotal(order)
                      const isUnpaid = !order.paid
                      const methodForOrder =
                        selectedCollectMethod[order.id] ?? 'QR Simple'

                      return (
                        <tr
                          key={order.id}
                          style={{
                            background: isUnpaid ? '#fffbf7' : undefined,
                          }}
                        >
                          <td>
                            <button
                              type="button"
                              className="text-button"
                              style={{
                                padding: 0,
                                fontWeight: 800,
                                fontSize: '12px',
                                color: isUnpaid ? '#ea580c' : '#2563eb',
                              }}
                              onClick={() => onSelectOrder(order.id)}
                              title="Ver ficha técnica completa"
                            >
                              {order.id}
                            </button>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                              {order.createdAt}
                            </div>
                          </td>

                          <td>
                            <strong style={{ fontSize: '12px', color: '#0f172a' }}>
                              {order.client}
                            </strong>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                              CI/NIT: {order.clientNitOrCi || 'S/N'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '2px' }}>
                              📞 {order.phone}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>
                              {order.bike}
                            </div>
                            <span className="plate-chip" style={{ fontSize: '10px', marginTop: '2px' }}>
                              {order.plate}
                            </span>
                          </td>

                          <td style={{ maxWidth: '280px' }}>
                            <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 600 }}>
                              {order.service}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                              {order.diagnosis}
                            </div>
                            <div style={{ marginTop: '4px' }}>
                              <span className="status-pill blue" style={{ fontSize: '9px', padding: '1px 6px' }}>
                                {order.status}
                              </span>
                            </div>
                          </td>

                          <td>
                            <strong style={{ fontSize: '13px', color: isUnpaid ? '#c2410c' : '#15803d' }}>
                              {formatCLP(total)}
                            </strong>
                            <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                              {order.quoteItems.length} ítems cotizados
                            </div>
                          </td>

                          <td>
                            {isUnpaid ? (
                              <div>
                                <span
                                  className="status-pill orange"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 800,
                                    fontSize: '11px',
                                    background: '#ffedd5',
                                    color: '#c2410c',
                                    borderColor: '#fdba74',
                                  }}
                                >
                                  <Clock style={{ width: '12px', height: '12px' }} />
                                  DEBE: {formatCLP(total)}
                                </span>
                                <div style={{ fontSize: '9.5px', color: '#9a3412', marginTop: '3px', fontWeight: 600 }}>
                                  ⚠️ Pago Pendiente
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span
                                  className="status-pill green"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 800,
                                    fontSize: '11px',
                                  }}
                                >
                                  <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                                  PAGADO
                                </span>
                                <div style={{ fontSize: '10px', color: '#166534', marginTop: '3px', fontWeight: 600 }}>
                                  {order.paidMethod || 'QR Simple'}
                                </div>
                              </div>
                            )}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            {isUnpaid ? (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  justifyContent: 'flex-end',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <select
                                  value={methodForOrder}
                                  onChange={(e) =>
                                    setSelectedCollectMethod((prev) => ({
                                      ...prev,
                                      [order.id]: e.target.value as PaymentMethod,
                                    }))
                                  }
                                  style={{
                                    height: '28px',
                                    fontSize: '11px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    padding: '0 6px',
                                  }}
                                  title="Medio con el que paga el cliente"
                                >
                                  {PAYMENT_METHODS.map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  className="button whatsapp"
                                  style={{
                                    height: '28px',
                                    fontSize: '11px',
                                    padding: '0 9px',
                                    gap: '4px',
                                    background: '#25D366',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => onOpenWhatsApp?.(order, 'cobro_orden')}
                                  title={`Enviar detalle de cobro de ${formatCLP(total)} por WhatsApp a ${order.client}`}
                                >
                                  <MessageCircle style={{ width: '13px', height: '13px' }} />
                                  Cobro WhatsApp
                                </button>

                                <button
                                  type="button"
                                  className="button primary"
                                  style={{
                                    height: '28px',
                                    fontSize: '11px',
                                    padding: '0 10px',
                                    background: '#16a34a',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 700,
                                  }}
                                  onClick={() => onCollectOrderPayment(order, methodForOrder)}
                                  title="Registrar cobro y guardar en Supabase"
                                >
                                  <Check style={{ width: '13px', height: '13px' }} />
                                  Cobrar
                                </button>
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  justifyContent: 'flex-end',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <button
                                  type="button"
                                  className="button secondary"
                                  style={{
                                    height: '28px',
                                    fontSize: '11px',
                                    padding: '0 8px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  onClick={() => onSelectOrder(order.id)}
                                  title="Ver expediente técnico y cotización de respaldo"
                                >
                                  <FileText style={{ width: '12px', height: '12px' }} />
                                  Recibo
                                </button>

                                <button
                                  type="button"
                                  className="button secondary"
                                  style={{
                                    height: '28px',
                                    fontSize: '11px',
                                    padding: '0 8px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    borderColor: '#fca5a5',
                                    color: '#b91c1c',
                                    background: '#fff1f2',
                                  }}
                                  onClick={() => onRevertOrderPayment?.(order)}
                                  title="Marcar como pendiente y actualizar en Supabase"
                                >
                                  <RotateCcw style={{ width: '12px', height: '12px' }} />
                                  Revertir
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: TERMINAL EXCLUSIVA DE REGISTRO DE INGRESO (+) O EGRESO (-)
      ===================================================================== */}
      {activeSubTab === 'register' && (
        <div className="finance-top-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="finance-kicker">TERMINAL CONTABLE · CAJA Y FACTURACIÓN EN BS</span>
                <h2>
                  {editingTxId
                    ? 'Editando Comprobante Contable'
                    : txType === 'income'
                      ? 'Registrar Nuevo Ingreso a Caja (+ Bs)'
                      : 'Registrar Nuevo Egreso / Gasto Operativo (- Bs)'}
                </h2>
                <p>
                  Módulo 100% dedicado a contabilidad (separado de la recepción mecánica de motocicletas)
                </p>
              </div>
              {editingTxId && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setEditingTxId(null)
                    setTxDesc('')
                    setTxAmount('')
                    setTxProvider('')
                    setTxDoc('')
                  }}
                >
                  Cancelar edición
                </button>
              )}
            </div>

            {/* SELECTOR VISUAL DE MODO: INGRESO (+) VS EGRESO (-) */}
            <div className="finance-mode-selector">
              <button
                type="button"
                className={`finance-mode-card income ${txType === 'income' ? 'active' : ''}`}
                onClick={() => {
                  setTxType('income')
                  setTxCategory('Servicio')
                }}
              >
                <div className="finance-mode-icon">
                  <ArrowUpRight />
                </div>
                <div>
                  <strong>Registrar Ingreso (+ Bs)</strong>
                  <span>Cobro de servicio, venta de repuesto por mostrador o convenio</span>
                </div>
              </button>

              <button
                type="button"
                className={`finance-mode-card expense ${txType === 'expense' ? 'active' : ''}`}
                onClick={() => {
                  setTxType('expense')
                  setTxCategory('Repuestos')
                }}
              >
                <div className="finance-mode-icon">
                  <ArrowDownRight />
                </div>
                <div>
                  <strong>Registrar Egreso / Gasto (- Bs)</strong>
                  <span>Compra de repuestos, aceites, alquiler, planilla, luz/agua o SIN</span>
                </div>
              </button>
            </div>

            {/* PLANTILLAS RÁPIDAS SEGÚN EL MODO SELECCIONADO */}
            <div className="quick-expense-bar">
              <span className="quick-expense-title">
                {txType === 'income'
                  ? '⚡ Plantillas rápidas de Ingreso en Bs (1 clic):'
                  : '⚡ Plantillas rápidas de Gasto habitual en Bs (1 clic):'}
              </span>
              <div className="quick-expense-chips">
                {(txType === 'income' ? QUICK_INCOME_PRESETS : QUICK_EXPENSE_PRESETS).map(
                  (preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="preset-chip"
                      onClick={() => {
                        setTxDesc(preset.description)
                        setTxCategory(preset.category)
                        setTxAmount(String(preset.amount))
                        setTxProvider(preset.providerOrClient)
                        setTxMethod(preset.paymentMethod)
                        setTxStatus('Pagado')
                      }}
                    >
                      {preset.label}
                    </button>
                  )
                )}
              </div>
            </div>

            <form className="tx-form" onSubmit={handleFormSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Categoría contable</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as TransactionCategory)}
                  >
                    {TRANSACTION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Monto en Bolivianos (Bs)</label>
                  <input
                    type="number"
                    placeholder="Ej: 1450"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field full">
                  <label>Concepto o glosa del movimiento</label>
                  <input
                    type="text"
                    placeholder={
                      txType === 'income'
                        ? 'Ej: Venta directa kit de transmisión o cobro de servicio técnico...'
                        : 'Ej: Compra repuestos OEM, aceite Motul, alquiler galpón, planilla...'
                    }
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>
                    {txType === 'income'
                      ? 'Cliente / Pagador (Razón Social)'
                      : 'Proveedor / Beneficiario'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      txType === 'income'
                        ? 'Ej: Sofía Ramírez / Logística Express'
                        : 'Ej: Importadora Imoto Bolivia S.R.L.'
                    }
                    value={txProvider}
                    onChange={(e) => setTxProvider(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>N° Factura SIN / Recibo / Comprobante</label>
                  <input
                    type="text"
                    placeholder="Ej: FAC-77412 o REC-109"
                    value={txDoc}
                    onChange={(e) => setTxDoc(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Medio de pago</label>
                  <select
                    value={txMethod}
                    onChange={(e) => setTxMethod(e.target.value as PaymentMethod)}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Estado contable</label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value as PaymentStatus)}
                  >
                    <option value="Pagado">Pagado / Cobrado en caja</option>
                    <option value="Pendiente de pago">Pendiente de pago (Crédito)</option>
                  </select>
                </div>

                <div className="form-field full">
                  <label>Vincular a Orden de Trabajo (Opcional, para auditoría)</label>
                  <select
                    value={txOrderId}
                    onChange={(e) => setTxOrderId(e.target.value)}
                  >
                    <option value="">Sin orden vinculada (Movimiento general de taller)</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} — {o.bike} ({o.client})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginTop: '14px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                }}
              >
                <button
                  type="submit"
                  className="button primary"
                  style={{
                    background: txType === 'income' ? '#16a34a' : '#ea580c',
                  }}
                >
                  <Plus />{' '}
                  {editingTxId
                    ? 'Guardar cambios contables'
                    : txType === 'income'
                      ? 'Registrar Ingreso en Caja (+ Bs)'
                      : 'Registrar Egreso / Gasto (- Bs)'}
                </button>
              </div>
            </form>
          </section>

          {/* COLUMNA DERECHA: CUENTAS POR COBRAR DE ÓRDENES DE TRABAJO */}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="finance-kicker">LIQUIDACIÓN RÁPIDA DE ÓRDENES</span>
                <h2>Cuentas por Cobrar de Taller ({unpaidOrders.length})</h2>
                <p>
                  Liquida en 1 clic las órdenes de trabajo pendientes y genera su asiento automático en Bs
                </p>
              </div>
              <span className="status-pill orange">
                Total por cobrar: {formatCLP(pendingReceivablesTotal)}
              </span>
            </div>

            {unpaidOrders.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#15803d',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                ✓ Todas las órdenes de trabajo activas se encuentran cobradas y conciliadas en caja.
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Orden / Cliente</th>
                      <th>Estado OT</th>
                      <th>Importe (Bs)</th>
                      <th>Medio de Cobro</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidOrders.map((order) => {
                      const methodForOrder =
                        selectedCollectMethod[order.id] ?? 'QR Simple'
                      return (
                        <tr key={order.id}>
                          <td>
                            <button
                              type="button"
                              className="text-button"
                              style={{ padding: 0, fontWeight: 700 }}
                              onClick={() => onSelectOrder(order.id)}
                            >
                              {order.id} · {order.bike}
                            </button>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                              {order.client} · NIT/CI: {order.clientNitOrCi || 'S/N'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>
                              Reparación: {order.service}
                            </div>
                          </td>
                          <td>
                            <span className="status-pill blue">{order.status}</span>
                          </td>
                          <td>
                            <strong style={{ fontSize: '12px', color: '#0f172a' }}>{formatCLP(calculateOrderTotal(order))}</strong>
                          </td>
                          <td>
                            <select
                              value={methodForOrder}
                              onChange={(e) =>
                                setSelectedCollectMethod((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value as PaymentMethod,
                                }))
                              }
                              style={{
                                height: '28px',
                                fontSize: '11px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                padding: '0 6px',
                              }}
                            >
                              {PAYMENT_METHODS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="button whatsapp"
                                style={{
                                  height: '28px',
                                  fontSize: '11px',
                                  padding: '0 9px',
                                  gap: '4px',
                                  background: '#25D366',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                                onClick={() => onOpenWhatsApp?.(order, 'cobro_orden')}
                                title={`Mandar detalle de cobro de ${formatCLP(calculateOrderTotal(order))} por WhatsApp a ${order.client}`}
                              >
                                <MessageCircle style={{ width: '13px', height: '13px' }} />
                                Cobro WhatsApp
                              </button>
                              <button
                                type="button"
                                className="button primary"
                                style={{
                                  height: '28px',
                                  fontSize: '11px',
                                  padding: '0 10px',
                                  background: '#16a34a',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 700,
                                }}
                                onClick={() =>
                                  onCollectOrderPayment(order, methodForOrder)
                                }
                                title="Liquidar orden y asentar cobro en caja"
                              >
                                <Check style={{ width: '13px', height: '13px' }} />
                                Cobrar
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: LIBRO MAYOR CONTABLE Y ARQUEO DE MOVIMIENTOS
      ===================================================================== */}
      {activeSubTab === 'ledger' && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="finance-kicker">AUDITORÍA Y RESPALDO CONTABLE EN BS</span>
              <h2>Libro Mayor de Ingresos y Egresos ({filteredTransactions.length} de {transactions.length})</h2>
              <p>
                Filtra por tipo, categoría, medio de pago o estado y exporta tu respaldo contable en CSV
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button secondary"
                style={{ height: '32px', fontSize: '11px' }}
                onClick={onExportCSV}
              >
                <Download /> Exportar CSV Contable
              </button>
              <button
                type="button"
                className="button primary"
                style={{ height: '32px', fontSize: '11px' }}
                onClick={() => handleOpenNewEntry('expense')}
              >
                <Plus /> Nuevo Movimiento
              </button>
            </div>
          </div>

          <div className="section-toolbar">
            <div className="filter-bar">
              {(
                [
                  { id: 'all', label: 'Todos los movimientos' },
                  { id: 'income', label: 'Solo Ingresos (+)' },
                  { id: 'expense', label: 'Solo Egresos / Gastos (-)' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`filter-chip ${txTypeFilter === tab.id ? 'active' : ''}`}
                  onClick={() => setTxTypeFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
              {(['Todos', 'Pagado', 'Pendiente de pago'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`filter-chip ${txStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setTxStatusFilter(st)}
                >
                  {st === 'Todos' ? 'Estado: Todos' : st}
                </button>
              ))}
            </div>

            <div className="search-box" style={{ width: '250px' }}>
              <Search />
              <input
                type="text"
                placeholder="Buscar factura, proveedor, concepto..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-bar" style={{ paddingTop: '6px' }}>
            <span>Categoría:</span>
            {['Todas', ...TRANSACTION_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-chip ${txCategoryFilter === cat ? 'active' : ''}`}
                onClick={() => setTxCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="filter-bar" style={{ paddingTop: '6px' }}>
            <span>Medio de Pago:</span>
            {['Todos', ...PAYMENT_METHODS].map((m) => (
              <button
                key={m}
                type="button"
                className={`filter-chip ${txMethodFilter === m ? 'active' : ''}`}
                onClick={() => setTxMethodFilter(m)}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha / Doc.</th>
                  <th>Concepto / Glosa Contable</th>
                  <th>Proveedor / Cliente</th>
                  <th>Categoría</th>
                  <th>Medio de Pago</th>
                  <th>Estado</th>
                  <th>Monto (Bs)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <strong>{tx.date}</strong>
                      <div style={{ fontSize: '9px', color: '#87929e', marginTop: '2px' }}>
                        {tx.invoiceOrDoc || 'S/DOC'}
                      </div>
                    </td>
                    <td>
                      <strong>{tx.description}</strong>
                      {tx.orderId && (
                        <div>
                          <button
                            type="button"
                            className="text-button"
                            style={{ padding: 0, marginTop: '2px' }}
                            onClick={() => onSelectOrder(tx.orderId!)}
                          >
                            Orden vinculada: {tx.orderId}
                          </button>
                        </div>
                      )}
                    </td>
                    <td>{tx.providerOrClient || '—'}</td>
                    <td>
                      <span className="intake-badge">{tx.category}</span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${
                          tx.paymentMethod === 'QR Simple' ? 'green' : 'blue'
                        }`}
                      >
                        {tx.paymentMethod || 'Transferencia'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`status-pill clickable ${
                          (tx.status || 'Pagado') === 'Pagado' ? 'green' : 'orange'
                        }`}
                        onClick={() => {
                          const nextStatus: PaymentStatus =
                            (tx.status || 'Pagado') === 'Pagado'
                              ? 'Pendiente de pago'
                              : 'Pagado'
                          onToggleTransactionStatus(tx.id, nextStatus)
                        }}
                        title="Clic para alternar estado Pagado / Pendiente"
                      >
                        {tx.status || 'Pagado'}
                      </button>
                    </td>
                    <td>
                      <strong
                        className={
                          tx.type === 'income' ? 'positive-text' : 'negative-text'
                        }
                        style={{ fontSize: '12px' }}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCLP(tx.amount)}
                      </strong>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="mini-btn"
                          onClick={() => handleStartEdit(tx)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="mini-btn"
                          onClick={() => onDeleteTransaction(tx.id)}
                          aria-label={`Eliminar ${tx.description}`}
                        >
                          <Trash2 style={{ width: '12px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
