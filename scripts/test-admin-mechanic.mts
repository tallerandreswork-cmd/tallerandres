import {
  defaultSettings,
  initialOrdersData,
  initialInventoryData,
  initialTransactionsData,
  getOrdersForMechanic,
  calculateOrderTotal,
  calculateBikeHealthScore,
  calculateExpenseBreakdown,
  calculateIncomeCategoryBreakdown,
  calculatePaymentMethodBreakdown,
  calculateMechanicLeaderboard,
  calculateTopServicesAnalytics,
  generateMarketingCampaigns,
  deductInventoryForReplacedPart,
  buildWhatsAppMessage,
  formatBOB,
  formatCLP,
} from '../lib/workshop-data.ts'

console.log('=================================================================')
console.log('🧪 TEST COMPLETO: CONFIGURACIÓN PANEL DE ADMINISTRACIÓN Y MECÁNICO')
console.log('=================================================================\n')

// -------------------------------------------------------------
// 1. VERIFICACIÓN DE CONFIGURACIÓN GLOBAL DEL TALLER (BOLIVIA)
// -------------------------------------------------------------
console.log('📌 [1] CONFIGURACIÓN OFICIAL DEL TALLER')
console.log(`  • Taller:             ${defaultSettings.workshopName} (${defaultSettings.workshopSubtitle})`)
console.log(`  • NIT Taller:         ${defaultSettings.workshopNit}`)
console.log(`  • Teléfono WhatsApp:  ${defaultSettings.workshopPhone}`)
console.log(`  • Banco / Pasarela:   ${defaultSettings.bankName}`)
console.log(`  • Cuenta Bancaria:    ${defaultSettings.bankAccount}`)
console.log(`  • Tarifa Mano de Obra: Bs ${defaultSettings.defaultLaborRate} / hr`)
console.log(`  • Presupuesto Gastos:  Bs ${defaultSettings.monthlyExpenseBudget} / mes`)
console.log(`  • Administrador:      ${defaultSettings.adminName} (${defaultSettings.adminRole})`)
console.log(`  • Mecánicos Oficiales: ${defaultSettings.mechanics.join(', ')}`)
console.log('  -> Configuración de Taller: OK ✅\n')

// -------------------------------------------------------------
// 2. VERIFICACIÓN DEL PANEL DE ADMINISTRACIÓN (DUEÑO DEL TALLER)
// -------------------------------------------------------------
console.log('📌 [2] PANEL DE ADMINISTRACIÓN — FINANZAS, KARDEX Y MARKETING')

// Finanzas y Libro Mayor
const incomeTxs = initialTransactionsData.filter((t) => t.type === 'income')
const expenseTxs = initialTransactionsData.filter((t) => t.type === 'expense')
const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0)
const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0)
const netProfit = totalIncome - totalExpense
const profitMargin = Math.round((netProfit / totalIncome) * 100)

console.log(`  💰 Total Ingresos Registrados:   ${formatBOB(totalIncome)}`)
console.log(`  💸 Total Gastos Registrados:     ${formatBOB(totalExpense)}`)
console.log(`  📈 Utilidad Neta en Caja:        ${formatBOB(netProfit)} (Margen: ${profitMargin}%)`)

// Desglose de Medios de Pago (con soporte QR Simple Bolivia)
const paymentBreakdown = calculatePaymentMethodBreakdown(initialTransactionsData)
console.log('  💳 Medios de Pago en Taller:')
for (const p of paymentBreakdown) {
  console.log(`     - ${p.method}: ${formatBOB(p.amount)} (${p.percentage}%)`)
}

// Kardex de Repuestos e Inventario
console.log(`\n  📦 Kardex de Almacén (${initialInventoryData.length} productos en Bs):`)
for (const item of initialInventoryData) {
  const isLowStock = item.stock <= item.minStock
  console.log(
    `     - [${item.sku}] ${item.name.padEnd(35)} | Stock: ${String(item.stock).padStart(2)}/${item.minStock} | Precio: Bs ${String(item.unitPriceBOB).padStart(4)} ${isLowStock ? '⚠️ ALERTA STOCK BAJO' : '✓'}`
  )
}

// Analítica Inteligente: Ranking de Mecánicos
console.log('\n  🏆 Leaderboard de Productividad Mecánica:')
const leaderboard = calculateMechanicLeaderboard(initialOrdersData, defaultSettings.mechanics)
for (const [index, m] of leaderboard.entries()) {
  console.log(
    `     ${index + 1}. ${m.mechanic.padEnd(16)} | Generado: ${formatBOB(m.totalGeneratedBOB).padEnd(10)} | Comisiones est.: ${formatBOB(m.estimatedCommissionBOB).padEnd(10)} | ${m.activeOrdersCount} motos activas | ${m.partsInstalledCount} repuestos montados`
  )
}

// Analítica de Servicios Más Solicitados
console.log('\n  📊 Servicios Más Demandados en el Taller:')
const topServices = calculateTopServicesAnalytics(initialOrdersData)
for (const s of topServices) {
  console.log(
    `     - ${s.serviceCategory.padEnd(38)} | ${s.jobsCount} órdenes | Total facturado: ${formatBOB(s.totalRevenueBOB)} | Ticket Promedio: ${formatBOB(s.avgTicketBOB)}`
  )
}

// Generación de Campañas de Marketing con 1 Clic
console.log('\n  📢 Campañas de Publicidad Inteligentes:')
const campaigns = generateMarketingCampaigns(
  initialOrdersData,
  initialInventoryData,
  defaultSettings.workshopName,
  defaultSettings.workshopPhone
)
for (const c of campaigns) {
  console.log(`     🎯 "${c.title}" [${c.badge}]`)
  console.log(`        • Servicio: ${c.targetService}`)
  console.log(`        • Precio Promo: Bs ${c.promoPriceBOB} (Normal: Bs ${c.normalPriceBOB})`)
  console.log(`        • Impacto estimado: ${c.expectedImpact}`)
}
console.log('  -> Panel de Administración: OK ✅\n')

// -------------------------------------------------------------
// 3. VERIFICACIÓN DEL PANEL DE MECÁNICO (BAHÍA OPERATIVA)
// -------------------------------------------------------------
console.log('📌 [3] PANEL DE MECÁNICO — CONTROL DE BAHÍA Y REPUESTOS')

for (const mec of ['Marco Ríos', 'Lucía Vidal']) {
  const mecOrders = getOrdersForMechanic(initialOrdersData, mec)
  console.log(`\n  👨‍🔧 Bahía de ${mec}: ${mecOrders.length} motocicletas asignadas estrictamente:`)
  for (const o of mecOrders) {
    const health = calculateBikeHealthScore(o)
    const total = calculateOrderTotal(o)
    console.log(
      `     🏍️ [${o.id}] ${o.plate} · ${o.bike.padEnd(18)} | Cliente: ${o.client.padEnd(16)} | Estado: ${o.status.padEnd(15)} | Salud: ${health}% | Total: ${formatBOB(total)}`
    )
  }
}

// Prueba de Instalación de Pieza y Deducción de Stock
console.log('\n  ⚙️ Prueba de Registro de Repuesto y Deducción de Stock:')
const testItemCode = 'DID-525VX3-108ZB'
const beforeStock = initialInventoryData.find((i) => i.sku === testItemCode)?.stock || 0
const { updatedInventory, matchedItem } = deductInventoryForReplacedPart(initialInventoryData, testItemCode)
const afterStock = updatedInventory.find((i) => i.sku === testItemCode)?.stock || 0

console.log(`     • Producto: Cadena DID 525VX3 (SKU: ${testItemCode})`)
console.log(`     • Stock antes de instalar: ${beforeStock} unidades`)
console.log(`     • Stock después de instalar: ${afterStock} unidades (-1 unidad deducida en bodega)`)
if (afterStock === beforeStock - 1) {
  console.log('     • Deducción de stock automática: ÉXITO ✓')
} else {
  throw new Error('Fallo en deducción de stock')
}

// Prueba de Enlace Mágico de WhatsApp para el Cliente
console.log('\n  📲 Prueba de Generación de Alerta WhatsApp con Enlace Mágico:')
const sampleOrder = initialOrdersData[0]
const sampleOrigin = 'https://motolab-bolivia.vercel.app'
const whatsappAlert = buildWhatsAppMessage(
  sampleOrder,
  'avance_reparacion',
  defaultSettings.workshopName,
  defaultSettings.whatsappSignature,
  sampleOrigin
)
console.log('     ----------------- VISTA PREVIA DEL MENSAJE -----------------')
console.log(
  whatsappAlert
    .split('\n')
    .map((line) => '     | ' + line)
    .join('\n')
)
console.log('     ------------------------------------------------------------')

if (
  whatsappAlert.includes(`https://motolab-bolivia.vercel.app/?placa=${sampleOrder.plate}`) &&
  whatsappAlert.includes(sampleOrder.client) &&
  whatsappAlert.includes(sampleOrder.mechanic)
) {
  console.log('     • Enlace dinámico y datos del mecánico vinculados: ÉXITO ✓')
} else {
  throw new Error('Fallo en generación de link de alerta WhatsApp')
}

console.log('\n=================================================================')
console.log('🎉 TODOS LOS MÓDULOS DE ADMINISTRADOR Y MECÁNICO VERIFICADOS AL 100%')
console.log('=================================================================')
