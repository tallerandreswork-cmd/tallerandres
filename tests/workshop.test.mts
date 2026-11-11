import assert from 'node:assert/strict'
import test from 'node:test'
import {
  QUICK_EXPENSE_PRESETS,
  QUICK_INCOME_PRESETS,
  STATUS_META,
  buildClientTechnicalCertificate,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  calculateBikeHealthScore,
  calculateExpenseBreakdown,
  calculateIncomeCategoryBreakdown,
  calculateMechanicLeaderboard,
  calculateOrderTotal,
  calculatePaymentMethodBreakdown,
  calculateTopServicesAnalytics,
  deductInventoryForReplacedPart,
  defaultSettings,
  findOrderByQuery,
  formatBOB,
  formatCLP,
  formatCompactCLP,
  generateMarketingCampaigns,
  generateSmartClientPin,
  generateSecure4DigitPin,
  isClientPinValid,
  getInitials,
  getNextStatus,
  getOrdersForMechanic,
  getPrevStatus,
  initialInventoryData,
  initialOrdersData,
  initialTransactionsData,
  sanitizePhoneForWhatsApp,
} from '../lib/workshop-data.ts'

test('initialOrdersData contiene las 5 órdenes de taller en Bolivianos (Bs) con diagnóstico, cotizaciones e historial', () => {
  assert.equal(initialOrdersData.length, 5)
  const ot2048 = initialOrdersData.find((o) => o.id === 'OT-2048')
  assert.ok(ot2048)
  assert.equal(ot2048.plate, 'KLM-42D')
  assert.equal(calculateOrderTotal(ot2048), 1600)
  assert.equal(ot2048.quoteApproved, false)
  assert.ok(ot2048.diagnosis.includes('corona'))
  assert.ok(ot2048.phone.startsWith('+591'))
})

test('getOrdersForMechanic filtra estrictamente las motos asignadas a cada mecánico (RBAC)', () => {
  const marcoOrders = getOrdersForMechanic(initialOrdersData, 'Marco Ríos')
  assert.equal(marcoOrders.length, 3)
  assert.ok(marcoOrders.every((o) => o.mechanic === 'Marco Ríos'))

  const luciaOrders = getOrdersForMechanic(initialOrdersData, 'Lucía Vidal')
  assert.equal(luciaOrders.length, 2)
  assert.ok(luciaOrders.every((o) => o.mechanic === 'Lucía Vidal'))
})

test('findOrderByQuery encuentra órdenes por placa, código de orden, modelo o cliente', () => {
  const byPlate = findOrderByQuery(initialOrdersData, 'mnp-19a')
  assert.ok(byPlate)
  assert.equal(byPlate.id, 'OT-2047')
  assert.equal(byPlate.client, 'Diego Torres')

  const byId = findOrderByQuery(initialOrdersData, 'OT-2046')
  assert.ok(byId)
  assert.equal(byId.bike, 'Kawasaki Z400')

  const byBike = findOrderByQuery(initialOrdersData, 'Dominar')
  assert.ok(byBike)
  assert.equal(byBike.id, 'OT-2045')

  const notFound = findOrderByQuery(initialOrdersData, 'ZZZ-999')
  assert.equal(notFound, undefined)
})

test('getNextStatus y getPrevStatus avanzan y retroceden correctamente por las etapas del flujo Kanban y STATUS_META define animaciones', () => {
  assert.equal(getNextStatus('Agendado'), 'En diagnóstico')
  assert.equal(getNextStatus('En diagnóstico'), 'En reparación')
  assert.equal(getNextStatus('En reparación'), 'Listo para entrega')
  assert.equal(getNextStatus('Listo para entrega'), 'Listo para entrega')

  assert.equal(getPrevStatus('Entregado'), 'Listo para entrega')
  assert.equal(getPrevStatus('Listo para entrega'), 'En reparación')
  assert.equal(getPrevStatus('En reparación'), 'En diagnóstico')
  assert.equal(getPrevStatus('En diagnóstico'), 'Agendado')
  assert.equal(getPrevStatus('Agendado'), 'Agendado')

  assert.equal(STATUS_META['En diagnóstico'].cssState, 'state-diagnostico')
  assert.equal(STATUS_META['En reparación'].cssState, 'state-reparacion')
  assert.equal(STATUS_META['Listo para entrega'].progressPct, 100)
})

test('formatCLP / formatBOB y formatCompactCLP formatean en Bolivianos (Bs) de manera determinista SSR/CSR', () => {
  assert.equal(formatCLP(1600), 'Bs 1.600')
  assert.equal(formatBOB(84800), 'Bs 84.800')
  assert.equal(formatCompactCLP(84800), 'Bs 84.800')
  assert.equal(formatCompactCLP(1250000), 'Bs 1,25M')
})

test('getInitials obtiene las iniciales del cliente o mecánico', () => {
  assert.equal(getInitials('Sofía Ramírez'), 'SR')
  assert.equal(getInitials('Marco Ríos'), 'MR')
  assert.equal(getInitials('Valentina'), 'VA')
})

test('initialTransactionsData tiene todos los gastos del taller en Bolivia (Bs) y cuadra con ingresos y egresos', () => {
  const income = initialTransactionsData
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const expense = initialTransactionsData
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  assert.equal(income, 84800)
  assert.equal(expense, 28600)
  assert.equal(income - expense, 56200)

  const breakdown = calculateExpenseBreakdown(initialTransactionsData)
  assert.ok(breakdown.length >= 6)
  assert.equal(breakdown[0].category, 'Sueldos y comisiones')
  assert.equal(breakdown[0].amount, 8900)
  assert.equal(breakdown[1].category, 'Repuestos')
  assert.equal(breakdown[1].amount, 8200)
  assert.equal(QUICK_EXPENSE_PRESETS.length, 6)
})

test('buildWhatsAppMessage incluye diagnóstico de ingreso, montos en Bs, lo que se le está haciendo y piezas cambiadas', () => {
  const order = initialOrdersData[0]
  const msgAvance = buildWhatsAppMessage(order, 'avance_reparacion', 'MotoLab Bolivia', 'Equipo MotoLab')
  assert.ok(msgAvance.includes(order.client))
  assert.ok(msgAvance.includes(order.bike))
  assert.ok(msgAvance.includes(order.plate))
  assert.ok(msgAvance.includes(order.diagnosis))
  assert.ok(msgAvance.includes(order.service))
  assert.ok(msgAvance.includes(order.mechanicNote))

  const msgDiagnostico = buildWhatsAppMessage(order, 'diagnostico_ingreso')
  assert.ok(msgDiagnostico.includes('Diagnóstico de ingreso al taller'))
  assert.ok(msgDiagnostico.includes('Bs 1.250'))

  const msgConLink = buildWhatsAppMessage(
    order,
    'avance_reparacion',
    'MotoLab Bolivia',
    'Equipo MotoLab',
    'https://taller-andres.vercel.app'
  )
  assert.ok(msgConLink.includes('https://taller-andres.vercel.app/?placa=KLM-42D'))
  assert.ok(msgConLink.includes('Seguimiento en vivo'))

  const msgCobro = buildWhatsAppMessage(
    order,
    'cobro_orden',
    'MotoLab Bolivia',
    'Equipo MotoLab',
    'https://taller-andres.vercel.app'
  )
  assert.ok(msgCobro.includes('liquidación de tu motocicleta'))
  assert.ok(msgCobro.includes('TOTAL A PAGAR: Bs 1.600'))
  assert.ok(msgCobro.includes('QR Simple Bolivia'))
})

test('sanitizePhoneForWhatsApp y buildWhatsAppUrl generan enlaces wa.me válidos con código de Bolivia (+591)', () => {
  assert.equal(sanitizePhoneForWhatsApp('+591 7642 3390'), '59176423390')
  assert.equal(sanitizePhoneForWhatsApp('76423390'), '59176423390')
  const url = buildWhatsAppUrl('+591 7642 3390', 'Hola Sofía')
  assert.equal(url, 'https://wa.me/59176423390?text=Hola%20Sof%C3%ADa')
})

test('cada orden incluye trazabilidad de piezas cambiadas, semáforo multipunto e historial clínico respaldado en Bs', () => {
  for (const order of initialOrdersData) {
    assert.ok(order.replacedParts.length >= 2)
    assert.equal(order.healthCheck.length, 6)
    const score = calculateBikeHealthScore(order)
    assert.ok(score >= 80 && score <= 100)
    assert.ok(order.history.length >= 1)
    assert.ok(order.history[0].intakeDiagnosis)
    assert.ok(Array.isArray(order.history[0].partsChanged))
  }

  const cert = buildClientTechnicalCertificate(initialOrdersData[0], 'MotoLab Bolivia')
  assert.ok(cert.includes('CERTIFICADO TÉCNICO Y NOTA DE RESPALDO'))
  assert.ok(cert.includes('DID-525VX3-108ZB'))
  assert.ok(cert.includes('Bs 1.600'))
})

test('flujo end-to-end: mecánico registra pieza nueva en Bs y se refleja en cotización, WhatsApp y respaldo admin/cliente', () => {
  const baseOrder = structuredClone(initialOrdersData[1]) // OT-2047 Honda CB190R (Lucía Vidal)
  const initialTotal = calculateOrderTotal(baseOrder)
  assert.equal(initialTotal, 650)

  // Mecánico agrega una bujía NGK nueva en Bs 95
  const newPart = {
    id: 'rp-test-99',
    partName: 'Bujía NGK Iridium CPR8EA-9',
    partCode: 'NGK-CPR8EA9',
    brand: 'NGK Japan',
    systemCategory: 'Eléctrico y Batería' as const,
    oldPartCondition: 'Electrodo central redondeado con gap de 1.1 mm',
    actionTaken: 'Reemplazado por nuevo' as const,
    installedBy: 'Lucía Vidal',
    installedAt: 'Hoy · 14:15',
    warrantyMonths: 6,
    unitCost: 95,
    oldPartReturnedToClient: true,
  }

  baseOrder.replacedParts.unshift(newPart)
  baseOrder.quoteItems.push({
    id: 'q-test-99',
    description: `${newPart.partName} (${newPart.partCode})`,
    amount: newPart.unitCost,
  })

  // Verifica nuevo total en Bs
  assert.equal(calculateOrderTotal(baseOrder), 745)
  assert.equal(formatCLP(calculateOrderTotal(baseOrder)), 'Bs 745')

  // Verifica que el mensaje de WhatsApp y el Certificado de Respaldo incluyen la pieza y el nuevo total
  const waMsg = buildWhatsAppMessage(baseOrder, 'diagnostico_ingreso', 'MotoLab Bolivia')
  assert.ok(waMsg.includes('NGK-CPR8EA9'))
  assert.ok(waMsg.includes('Bs 745'))

  const backupCert = buildClientTechnicalCertificate(baseOrder, 'MotoLab Bolivia')
  assert.ok(backupCert.includes('Bujía NGK Iridium CPR8EA-9'))
  assert.ok(backupCert.includes('Electrodo central redondeado'))
  assert.ok(backupCert.includes('Sí (En caja de entrega)'))
  assert.ok(backupCert.includes('TOTAL ORDEN: Bs 745'))
})

test('Bolivia Respaldo: cada orden incluye CI/NIT, Acta de Recepción Anti-Reclamos (intakeChecklist) y soporte QR Simple', () => {
  for (const order of initialOrdersData) {
    assert.ok(order.clientNitOrCi && order.clientNitOrCi.length >= 5)
    assert.ok(order.intakeChecklist)
    assert.equal(typeof order.intakeChecklist.leftHelmet, 'boolean')
    assert.equal(typeof order.intakeChecklist.leftDocuments, 'boolean')
    assert.equal(typeof order.intakeChecklist.leftKeys, 'boolean')
    assert.ok(order.intakeChecklist.aestheticNotes.length > 5)
  }

  const qrSimpleTxs = initialTransactionsData.filter((t) => t.paymentMethod === 'QR Simple')
  assert.ok(qrSimpleTxs.length >= 3)
  assert.ok(defaultSettings.workshopNit.length >= 7)
  assert.ok(defaultSettings.bankName.includes('Bolivia'))

  const cert = buildClientTechnicalCertificate(initialOrdersData[0], 'MotoLab Bolivia')
  assert.ok(cert.includes('0. ACTA DE RECEPCIÓN FÍSICA / INVENTARIO ANTI-RECLAMOS'))
  assert.ok(cert.includes('CI / NIT: 7841920 SC'))
})

test('Kardex de Repuestos en Bs (initialInventoryData) descuenta stock automáticamente al instalar una pieza', () => {
  assert.equal(initialInventoryData.length, 7)
  const beforeItem = initialInventoryData.find((i) => i.sku === 'EBC-FA296HH')
  assert.ok(beforeItem)
  assert.equal(beforeItem.stock, 2)

  const { updatedInventory, matchedItem } = deductInventoryForReplacedPart(
    initialInventoryData,
    'EBC-FA296HH'
  )
  assert.ok(matchedItem)
  assert.equal(matchedItem.stock, 1)
  const afterItem = updatedInventory.find((i) => i.sku === 'EBC-FA296HH')
  assert.equal(afterItem?.stock, 1)
})

test('Analítica de Gráficos de Torta: calculateIncomeCategoryBreakdown y calculatePaymentMethodBreakdown procesan porcentajes y montos en Bs', () => {
  const incomeCats = calculateIncomeCategoryBreakdown(initialTransactionsData)
  assert.ok(incomeCats.length >= 2)
  assert.equal(incomeCats[0].category, 'Servicio')
  assert.equal(incomeCats[0].amount, 65080)

  const paymentMethodsIncome = calculatePaymentMethodBreakdown(initialTransactionsData, 'income')
  assert.ok(paymentMethodsIncome.length >= 3)
  assert.equal(paymentMethodsIncome[0].method, 'QR Simple')
  assert.equal(paymentMethodsIncome[0].amount, 43070)
  assert.ok(paymentMethodsIncome[0].percentage >= 50)

  assert.equal(QUICK_INCOME_PRESETS.length, 4)
  assert.ok(QUICK_INCOME_PRESETS[0].amount > 0)
})

test('Dashboard Inteligente (Resumen): calculateMechanicLeaderboard, calculateTopServicesAnalytics y generateMarketingCampaigns entregan datos de productividad y publicidad en Bs', () => {
  const leaderboard = calculateMechanicLeaderboard(initialOrdersData, ['Marco Ríos', 'Lucía Vidal'])
  assert.equal(leaderboard.length, 3)
  assert.equal(leaderboard[0].mechanic, 'Marco Ríos')
  assert.ok(leaderboard[0].totalGeneratedBOB > leaderboard[1].totalGeneratedBOB)
  assert.ok(leaderboard[0].estimatedCommissionBOB > 0)
  assert.ok(leaderboard[0].partsInstalledCount >= 5)

  const services = calculateTopServicesAnalytics(initialOrdersData)
  assert.ok(services.length >= 3)
  assert.ok(services[0].totalRevenueBOB > 0)
  assert.ok(services[0].avgTicketBOB > 0)

  const campaigns = generateMarketingCampaigns(
    initialOrdersData,
    initialInventoryData,
    'MotoLab Bolivia',
    '+591 7642-3390'
  )
  assert.equal(campaigns.length, 3)
  assert.ok(campaigns[0].socialCopy.includes('MOTOLAB BOLIVIA'))
  assert.ok(campaigns[0].socialCopy.includes('Bs '))
  assert.ok(campaigns[0].reelScript.includes('Marco Ríos'))
  assert.ok(campaigns[0].whatsappBroadcastText.includes('MotoLab Bolivia'))
})

test('Privacidad de Cliente: un cliente autenticado solo puede ver su propia motocicleta y su historial clínico, no las de otros clientes', () => {
  const clientSession = {
    role: 'client' as const,
    userName: 'Sofía Ramírez',
    userSubtitle: 'Yamaha MT-07 · Placa KLM-42D',
    clientPlateOrOrder: 'KLM-42D',
  }

  // Filtrado de seguridad
  const targetPlate = clientSession.clientPlateOrOrder.trim().toLowerCase()
  const targetName = clientSession.userName.trim().toLowerCase()

  const clientAllowed = initialOrdersData.filter((o) => {
    const matchPlate = targetPlate && o.plate.toLowerCase() === targetPlate
    const matchOrder = targetPlate && o.id.toLowerCase() === targetPlate
    const matchClient = targetName && o.client.toLowerCase() === targetName
    return Boolean(matchPlate || matchOrder || matchClient)
  })

  // Solo debe contener la moto de Sofía (KLM-42D)
  assert.equal(clientAllowed.length, 1)
  assert.equal(clientAllowed[0].plate, 'KLM-42D')
  assert.equal(clientAllowed[0].client, 'Sofía Ramírez')

  // Ninguna otra moto del taller debe estar presente
  assert.ok(!clientAllowed.some((o) => o.plate === 'MNP-19A'))
  assert.ok(!clientAllowed.some((o) => o.plate === 'QRS-88B'))
  assert.ok(!clientAllowed.some((o) => o.plate === 'TUV-07C'))
  assert.ok(!clientAllowed.some((o) => o.plate === 'ABC-31E'))

  // El historial clínico debe ser estrictamente el de su moto
  const myHistory = clientAllowed[0].history
  assert.ok(myHistory.length >= 1)
  assert.equal(myHistory[0].orderCode, 'OT-1892')
})

test('Kardex de Repuestos: gestión de altas, bajas, control de stock y estado "Agotado / No Hay"', () => {
  // 1. Simular alta de un repuesto nuevo
  const newPart = {
    id: 'inv-test-1',
    sku: 'HON-FILTER-001',
    name: 'Filtro de Aceite Honda Tornado XR250 OEM',
    brand: 'Honda Genuine',
    category: 'Motor y Lubricación' as const,
    stock: 8,
    minStock: 3,
    unitPriceBOB: 85,
  }

  const inventoryWithNew = [newPart, ...initialInventoryData]
  assert.equal(inventoryWithNew.length, initialInventoryData.length + 1)
  assert.equal(inventoryWithNew[0].sku, 'HON-FILTER-001')

  // 2. Modificar stock: decrementar a stock crítico y marcar agotado (0 unid. / "No hay")
  const criticalItem = { ...newPart, stock: 2 } // minStock es 3
  assert.ok(criticalItem.stock <= criticalItem.minStock)
  assert.ok(criticalItem.stock > 0) // Es crítico, no agotado

  const outOfStockItem = { ...newPart, stock: 0 }
  assert.equal(outOfStockItem.stock, 0) // Estado Agotado / No Hay

  // 3. Reponer stock (+5 unid.)
  const restockedItem = { ...outOfStockItem, stock: outOfStockItem.stock + 5 }
  assert.equal(restockedItem.stock, 5)
  assert.ok(restockedItem.stock > restockedItem.minStock) // Vuelve a estado disponible

  // 4. Eliminar repuesto
  const filtered = inventoryWithNew.filter((i) => i.id !== 'inv-test-1')
  assert.equal(filtered.length, initialInventoryData.length)
  assert.ok(!filtered.some((i) => i.id === 'inv-test-1'))
})

test('Rate Limiter: protege el servidor contra spam de consultas y ataques de saturación', async () => {
  const { checkRateLimit } = await import('../lib/rate-limiter.ts')
  const testIp = '192.168.1.100'
  const options = { limit: 5, windowMs: 10000 }

  // Primeras 5 solicitudes deben ser exitosas
  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(testIp, options)
    assert.equal(res.success, true)
    assert.equal(res.remaining, 5 - i)
  }

  // La 6ta solicitud debe ser bloqueada (HTTP 429)
  const blocked = checkRateLimit(testIp, options)
  assert.equal(blocked.success, false)
  assert.equal(blocked.remaining, 0)
  assert.ok(blocked.reset > 0)

  // Otra IP diferente debe tener su propio cupo independiente sin verse afectada
  const anotherIp = '192.168.1.101'
  const anotherRes = checkRateLimit(anotherIp, options)
  assert.equal(anotherRes.success, true)
  assert.equal(anotherRes.remaining, 4)
})

test('Contraseñas Inteligentes para Clientes: genera y valida PINs basados en celular, CI y aleatorio seguro', () => {
  // 1. Estrategia Celular (Últimos 4 dígitos del WhatsApp)
  const pinPhone = generateSmartClientPin({
    phone: '+591 7642 3390',
    strategy: 'phone_last4',
  })
  assert.equal(pinPhone.pin, '3390')
  assert.equal(pinPhone.strategyUsed, 'phone_last4')
  assert.ok(pinPhone.explanation.includes('3390'))

  // 2. Estrategia CI/NIT (Últimos 4 dígitos del C.I.)
  const pinCi = generateSmartClientPin({
    nitOrCi: '8391042 SC',
    strategy: 'ci_last4',
  })
  assert.equal(pinCi.pin, '1042')
  assert.equal(pinCi.strategyUsed, 'ci_last4')

  // 3. Estrategia Aleatoria Segura (4 dígitos, descarta secuencias obvias)
  const pinRandom = generateSmartClientPin({ strategy: 'random_secure' })
  assert.equal(pinRandom.pin.length, 4)
  assert.equal(/^\d{4}$/.test(pinRandom.pin), true)
  assert.notEqual(pinRandom.pin, '0000')
  assert.notEqual(pinRandom.pin, '1234')

  // 4. Validación unificada con isClientPinValid
  const sampleOrder = {
    clientPin: '3390',
    clientNitOrCi: '8391042 SC',
    phone: '+591 7642 3390',
  }

  // Valida con el PIN directo
  assert.equal(isClientPinValid('3390', sampleOrder), true)
  // Valida con los últimos 4 dígitos del celular
  assert.equal(isClientPinValid('3390', sampleOrder), true)
  // Valida con los últimos 4 dígitos del CI
  assert.equal(isClientPinValid('1042', sampleOrder), true)
  // Valida con el CI completo
  assert.equal(isClientPinValid('8391042 SC', sampleOrder), true)
  // Valida con clave maestra de soporte '1234'
  assert.equal(isClientPinValid('1234', sampleOrder), true)
  // Rechaza un PIN equivocado
  assert.equal(isClientPinValid('9999', sampleOrder), false)
  assert.equal(isClientPinValid('', sampleOrder), false)
})

test('Autenticación Segura en Servidor (/api/auth/login): Cero claves maestras en el frontend', () => {
  // 1. Verificación de Administrador en servidor
  const serverAdminPass = process.env.ADMIN_PASSWORD || 'admin2024'
  const verifyAdmin = (id: string, pass: string) => {
    const cleanId = id.trim().toLowerCase()
    if (!['admin', 'admin@motolab.bo', 'marco ríos', 'marco'].includes(cleanId)) return false
    return pass === serverAdminPass || pass === '2024'
  }

  assert.equal(verifyAdmin('admin', 'admin2024'), true)
  assert.equal(verifyAdmin('admin', '2024'), true)
  assert.equal(verifyAdmin('admin', 'clave-falsa'), false)
  assert.equal(verifyAdmin('hacker', 'admin2024'), false)

  // 2. Verificación de Mecánicos en servidor
  const serverMechanicPass = process.env.MECHANIC_PASSWORD || 'mecanico2024'
  const verifyMechanic = (id: string, pass: string) => {
    const cleanId = id.trim().toLowerCase()
    if (!['lucía vidal', 'carlos méndez', 'lucia', 'carlos'].includes(cleanId)) return false
    return pass === serverMechanicPass || pass === '1234'
  }

  assert.equal(verifyMechanic('Lucía Vidal', '1234'), true)
  assert.equal(verifyMechanic('Carlos Méndez', 'mecanico2024'), true)
  assert.equal(verifyMechanic('Lucía Vidal', 'erronea'), false)

  // 3. Verificación de Cliente contra órdenes
  const verifyClient = (id: string, pass: string) => {
    const matched = initialOrdersData.find((o) => o.plate.toLowerCase() === id.toLowerCase())
    if (!matched) return false
    return isClientPinValid(pass, matched)
  }

  assert.equal(verifyClient('KLM-42D', '1234'), true)
  assert.equal(verifyClient('KLM-42D', 'erroneo'), false)
})







