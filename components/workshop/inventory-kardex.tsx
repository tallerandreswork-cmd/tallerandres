'use client'

import React, { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  DollarSign,
  Edit3,
  Filter,
  Minus,
  Package,
  PackageCheck,
  Plus,
  PlusCircle,
  Search,
  Trash2,
  Wrench,
  X,
  XCircle,
} from 'lucide-react'
import {
  type InventoryItem,
  type PartSystemCategory,
  PART_SYSTEM_CATEGORIES,
  formatCLP,
} from '@/lib/workshop-data'

interface InventoryKardexPanelProps {
  inventory: InventoryItem[]
  onAddInventoryItem: (item: InventoryItem) => void
  onUpdateInventoryItem: (item: InventoryItem) => void
  onDeleteInventoryItem: (itemId: string) => void
  onUpdateStock: (itemId: string, newStock: number) => void
  onToast: (msg: string) => void
  isSupabaseOnline?: boolean
}

export function InventoryKardexPanel({
  inventory = [],
  onAddInventoryItem,
  onUpdateInventoryItem,
  onDeleteInventoryItem,
  onUpdateStock,
  onToast,
  isSupabaseOnline = false,
}: InventoryKardexPanelProps) {
  // Filtros y buscador
  const [searchPart, setSearchPart] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [stockStatusFilter, setStockStatusFilter] = useState<'todos' | 'disponible' | 'critico' | 'agotado'>('todos')

  // Modal para agregar o editar repuesto
  const [isPartModalOpen, setIsPartModalOpen] = useState(false)
  const [editingPartId, setEditingPartId] = useState<string | null>(null)
  const [partForm, setPartForm] = useState<{
    sku: string
    name: string
    brand: string
    category: PartSystemCategory
    stock: string
    minStock: string
    unitPriceBOB: string
  }>({
    sku: '',
    name: '',
    brand: '',
    category: 'Motor y Lubricación',
    stock: '1',
    minStock: '2',
    unitPriceBOB: '150',
  })

  // Métricas de inventario
  const criticalStockCount = useMemo(
    () => inventory.filter((item) => item.stock > 0 && item.stock <= item.minStock).length,
    [inventory]
  )

  const outOfStockCount = useMemo(
    () => inventory.filter((item) => item.stock === 0).length,
    [inventory]
  )

  const inStockCount = useMemo(
    () => inventory.filter((item) => item.stock > item.minStock).length,
    [inventory]
  )

  const totalInventoryValueBOB = useMemo(
    () => inventory.reduce((acc, item) => acc + item.stock * item.unitPriceBOB, 0),
    [inventory]
  )

  const uniqueBrandsCount = useMemo(
    () => new Set(inventory.map((i) => i.brand)).size,
    [inventory]
  )

  // Lista filtrada
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (selectedCategory !== 'Todas' && item.category !== selectedCategory) {
        return false
      }
      if (stockStatusFilter === 'disponible' && item.stock <= item.minStock) {
        return false
      }
      if (stockStatusFilter === 'critico' && (item.stock === 0 || item.stock > item.minStock)) {
        return false
      }
      if (stockStatusFilter === 'agotado' && item.stock !== 0) {
        return false
      }
      if (!searchPart.trim()) return true
      const q = searchPart.toLowerCase()
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      )
    })
  }, [inventory, selectedCategory, stockStatusFilter, searchPart])

  const handleOpenAddModal = () => {
    setEditingPartId(null)
    setPartForm({
      sku: '',
      name: '',
      brand: '',
      category: 'Motor y Lubricación',
      stock: '6',
      minStock: '2',
      unitPriceBOB: '120',
    })
    setIsPartModalOpen(true)
  }

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingPartId(item.id)
    setPartForm({
      sku: item.sku,
      name: item.name,
      brand: item.brand,
      category: item.category,
      stock: String(item.stock),
      minStock: String(item.minStock),
      unitPriceBOB: String(item.unitPriceBOB),
    })
    setIsPartModalOpen(true)
  }

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault()
    if (!partForm.name.trim()) {
      onToast('Ingresa el nombre del repuesto o insumo')
      return
    }

    const cleanSku =
      partForm.sku.trim() ||
      `OEM-${partForm.brand.slice(0, 3).toUpperCase() || 'GEN'}-${Math.floor(1000 + Math.random() * 9000)}`
    const parsedStock = Math.max(0, parseInt(partForm.stock, 10) || 0)
    const parsedMinStock = Math.max(1, parseInt(partForm.minStock, 10) || 2)
    const parsedPrice = Math.max(0, parseFloat(partForm.unitPriceBOB) || 0)

    if (editingPartId) {
      const updatedItem: InventoryItem = {
        id: editingPartId,
        sku: cleanSku,
        name: partForm.name.trim(),
        brand: partForm.brand.trim() || 'OEM Multimarca',
        category: partForm.category,
        stock: parsedStock,
        minStock: parsedMinStock,
        unitPriceBOB: parsedPrice,
      }
      onUpdateInventoryItem(updatedItem)
      setIsPartModalOpen(false)
      onToast(`Repuesto "${updatedItem.name}" actualizado en el Kardex`)
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}`,
        sku: cleanSku,
        name: partForm.name.trim(),
        brand: partForm.brand.trim() || 'OEM Multimarca',
        category: partForm.category,
        stock: parsedStock,
        minStock: parsedMinStock,
        unitPriceBOB: parsedPrice,
      }
      onAddInventoryItem(newItem)
      setIsPartModalOpen(false)
      onToast(`Repuesto "${newItem.name}" agregado con éxito al Kardex`)
    }
  }

  const handleDeletePart = (item: InventoryItem) => {
    const ok = window.confirm(
      `¿Deseas dar de baja y eliminar el repuesto "${item.name}" (${item.sku}) del Kardex de taller?`
    )
    if (ok) {
      onDeleteInventoryItem(item.id)
      onToast(`Repuesto "${item.name}" eliminado del Kardex`)
    }
  }

  const handleSetStock = (itemId: string, newStock: number) => {
    const safeStock = Math.max(0, newStock)
    onUpdateStock(itemId, safeStock)
  }

  return (
    <div className="section-container">
      {/* 1. RIBBON DE KPIS DE BODEGA E INVENTARIO */}
      <div className="stats-grid" style={{ padding: 0, marginBottom: '14px' }}>
        <article className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon blue">
              <Package />
            </div>
            <span className="stat-change">{uniqueBrandsCount} marcas en stock</span>
          </div>
          <p className="stat-label">Repuestos Catalogados</p>
          <h2 className="stat-value">{inventory.length} SKUs</h2>
        </article>

        <article className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon green">
              <PackageCheck />
            </div>
            <span className="stat-change">Nivel de servicio óptimo</span>
          </div>
          <p className="stat-label">Stock Disponible</p>
          <h2 className="stat-value">{inStockCount} repuestos</h2>
        </article>

        <article
          className="stat-card clickable"
          onClick={() => setStockStatusFilter('critico')}
          style={criticalStockCount > 0 ? { borderColor: '#fed7aa', background: '#fffaf5' } : {}}
        >
          <div className="stat-card-top">
            <div className="stat-icon orange">
              <AlertTriangle />
            </div>
            <span className="stat-change" style={{ color: criticalStockCount > 0 ? '#c2410c' : undefined }}>
              {criticalStockCount > 0 ? 'Reponer urgente' : 'Sin alertas'}
            </span>
          </div>
          <p className="stat-label">Stock Crítico</p>
          <h2 className="stat-value" style={{ color: criticalStockCount > 0 ? '#ea580c' : undefined }}>
            {criticalStockCount} ítems
          </h2>
        </article>

        <article
          className="stat-card clickable"
          onClick={() => setStockStatusFilter(outOfStockCount > 0 ? 'agotado' : 'todos')}
          style={outOfStockCount > 0 ? { borderColor: '#fca5a5', background: '#fff5f5' } : {}}
        >
          <div className="stat-card-top">
            <div className="stat-icon purple">
              <DollarSign />
            </div>
            <span className="stat-change" style={{ color: outOfStockCount > 0 ? '#b91c1c' : undefined }}>
              {outOfStockCount > 0 ? `${outOfStockCount} agotados` : 'Valorizado en Bs'}
            </span>
          </div>
          <p className="stat-label">Valor en Bodega (Bs)</p>
          <h2 className="stat-value">{formatCLP(totalInventoryValueBOB)}</h2>
        </article>
      </div>

      {/* 2. PANEL PRINCIPAL DE KARDEX */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="finance-kicker">KARDEX E INVENTARIO DE BODEGA · BOLIVIA (BS)</span>
            <h2>Kardex de Repuestos e Insumos en Bodega</h2>
            <p>
              Control en tiempo real de repuestos originales (OEM), lubricantes y consumibles. Descuenta automáticamente
              al registrar una pieza en cualquier orden de trabajo.
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
              {isSupabaseOnline ? '☁️ Supabase PostgreSQL en Vivo' : '💾 Modo Local'}
            </span>

            <button
              type="button"
              className="button primary"
              style={{
                background: 'var(--orange)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 14px',
                fontSize: '11.5px',
                fontWeight: 700,
              }}
              onClick={handleOpenAddModal}
            >
              <Plus style={{ width: '14px', height: '14px' }} /> + Nuevo Repuesto / Insumo
            </button>
          </div>
        </div>

        {/* 3. FILTROS Y BUSCADOR */}
        <div className="filter-bar" style={{ padding: '0 0 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`filter-chip ${stockStatusFilter === 'todos' ? 'active' : ''}`}
              onClick={() => setStockStatusFilter('todos')}
            >
              🔘 Todos ({inventory.length})
            </button>
            <button
              type="button"
              className={`filter-chip ${stockStatusFilter === 'disponible' ? 'active' : ''}`}
              onClick={() => setStockStatusFilter('disponible')}
              style={
                stockStatusFilter === 'disponible'
                  ? { background: '#f0fdf4', borderColor: '#86efac', color: '#15803d' }
                  : {}
              }
            >
              ✅ Disponibles ({inStockCount})
            </button>
            <button
              type="button"
              className={`filter-chip ${stockStatusFilter === 'critico' ? 'active' : ''}`}
              onClick={() => setStockStatusFilter('critico')}
              style={
                stockStatusFilter === 'critico'
                  ? { background: '#fff7ed', borderColor: '#fdba74', color: '#c2410c' }
                  : {}
              }
            >
              ⚠️ Stock Crítico ({criticalStockCount})
            </button>
            {outOfStockCount > 0 && (
              <button
                type="button"
                className={`filter-chip ${stockStatusFilter === 'agotado' ? 'active' : ''}`}
                onClick={() => setStockStatusFilter('agotado')}
                style={
                  stockStatusFilter === 'agotado'
                    ? { background: '#fff1f2', borderColor: '#fca5a5', color: '#b91c1c' }
                    : {}
                }
              >
                ❌ Agotados ({outOfStockCount})
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ maxWidth: '240px' }}>
              <Search style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Buscar por SKU, nombre, marca..."
                value={searchPart}
                onChange={(e) => setSearchPart(e.target.value)}
                style={{ height: '30px', fontSize: '11px' }}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                height: '30px',
                fontSize: '11px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                padding: '0 8px',
                background: '#ffffff',
              }}
            >
              <option value="Todas">Todas las Categorías</option>
              {PART_SYSTEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. TABLA DE KARDEX */}
        {filteredInventory.length === 0 ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            No se encontraron repuestos con los filtros seleccionados.
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU / Código OEM</th>
                  <th>Repuesto / Insumo</th>
                  <th>Marca / Categoría</th>
                  <th>Precio Unitario (Bs)</th>
                  <th>Stock Mínimo</th>
                  <th>Stock Actual</th>
                  <th style={{ textAlign: 'right' }}>Gestión de Existencias</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const isOutOfStock = item.stock === 0
                  const isCritical = item.stock > 0 && item.stock <= item.minStock

                  return (
                    <tr
                      key={item.id}
                      style={{
                        background: isOutOfStock
                          ? '#fff5f5'
                          : isCritical
                            ? '#fffaf5'
                            : undefined,
                      }}
                    >
                      <td>
                        <span
                          className="plate-chip"
                          style={{
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            color: '#0f172a',
                            fontWeight: 700,
                          }}
                        >
                          {item.sku}
                        </span>
                      </td>

                      <td>
                        <strong style={{ fontSize: '12px', color: '#0f172a' }}>{item.name}</strong>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          Marca: {item.brand}
                        </div>
                      </td>

                      <td>
                        <span
                          className="intake-badge"
                          style={{
                            fontSize: '9.5px',
                            background: '#f8fafc',
                            borderColor: '#e2e8f0',
                            color: '#334155',
                          }}
                        >
                          {item.category}
                        </span>
                      </td>

                      <td>
                        <strong style={{ fontSize: '12px', color: '#0f172a' }}>
                          {formatCLP(item.unitPriceBOB)}
                        </strong>
                      </td>

                      <td>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {item.minStock} unid.
                        </span>
                      </td>

                      <td>
                        {isOutOfStock ? (
                          <span
                            className="intake-badge"
                            style={{
                              background: '#fee2e2',
                              color: '#b91c1c',
                              borderColor: '#fca5a5',
                              fontWeight: 800,
                              fontSize: '10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <XCircle style={{ width: '11px', height: '11px' }} />
                            0 unid. (Agotado)
                          </span>
                        ) : isCritical ? (
                          <span
                            className="intake-badge"
                            style={{
                              background: '#fff3e8',
                              color: '#c2410c',
                              borderColor: '#fed7aa',
                              fontWeight: 800,
                              fontSize: '10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <AlertTriangle style={{ width: '11px', height: '11px' }} />
                            {item.stock} unid. (Crítico)
                          </span>
                        ) : (
                          <span
                            className="intake-badge"
                            style={{
                              background: '#f0fdf4',
                              color: '#15803d',
                              borderColor: '#bbf7d0',
                              fontWeight: 700,
                              fontSize: '10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle2 style={{ width: '11px', height: '11px' }} />
                            {item.stock} unid. (Óptimo)
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            justifyContent: 'flex-end',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* Controles de stock rápido */}
                          <button
                            type="button"
                            className="mini-btn"
                            style={{
                              padding: '4px 7px',
                              fontSize: '10.5px',
                              borderRadius: '6px',
                              background: '#f8fafc',
                            }}
                            onClick={() => handleSetStock(item.id, item.stock - 1)}
                            disabled={item.stock === 0}
                            title="Descontar 1 unidad"
                          >
                            <Minus style={{ width: '11px', height: '11px' }} />
                          </button>

                          <button
                            type="button"
                            className="mini-btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '10.5px',
                              borderRadius: '6px',
                              background: '#f0fdf4',
                              color: '#15803d',
                              borderColor: '#bbf7d0',
                              fontWeight: 700,
                            }}
                            onClick={() => handleSetStock(item.id, item.stock + 1)}
                            title="Sumar 1 unidad"
                          >
                            +1
                          </button>

                          <button
                            type="button"
                            className="mini-btn"
                            style={{
                              padding: '4px 9px',
                              fontSize: '10.5px',
                              borderRadius: '6px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              borderColor: '#bfdbfe',
                              fontWeight: 700,
                            }}
                            onClick={() => handleSetStock(item.id, item.stock + 5)}
                            title="Reponer lote de 5 unidades"
                          >
                            + Reponer +5
                          </button>

                          {/* Botón editar */}
                          <button
                            type="button"
                            className="mini-btn"
                            style={{
                              padding: '4px 7px',
                              borderRadius: '6px',
                            }}
                            onClick={() => handleOpenEditModal(item)}
                            title="Editar datos del repuesto"
                          >
                            <Edit3 style={{ width: '12px', height: '12px' }} />
                          </button>

                          {/* Botón eliminar */}
                          <button
                            type="button"
                            className="mini-btn"
                            style={{
                              padding: '4px 7px',
                              borderRadius: '6px',
                              color: '#dc2626',
                              borderColor: '#fca5a5',
                            }}
                            onClick={() => handleDeletePart(item)}
                            title="Dar de baja y eliminar repuesto"
                          >
                            <Trash2 style={{ width: '12px', height: '12px' }} />
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

      {/* 5. MODAL PARA REGISTRAR O EDITAR REPUESTO */}
      {isPartModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsPartModalOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="part-modal-title"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">
                  {editingPartId ? 'ACTUALIZACIÓN DE KARDEX' : 'NUEVO REPUESTO EN TALLER'}
                </p>
                <h2 id="part-modal-title">
                  {editingPartId ? 'Editar Repuesto / Insumo' : 'Registrar Nuevo Repuesto'}
                </h2>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Los repuestos registrados quedan disponibles para los mecánicos en cada orden y sincronizados con Supabase.
                </span>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setIsPartModalOpen(false)}
                aria-label="Cerrar modal"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSavePart} style={{ padding: '16px' }}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ gridColumn: 'span 2' }}>
                  Nombre del Repuesto o Insumo *
                  <input
                    type="text"
                    required
                    placeholder="Ej. Kit de arrastre DID 525VX3 Gold + Corona JT"
                    value={partForm.name}
                    onChange={(e) => setPartForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </label>

                <label>
                  Código SKU / Referencia OEM
                  <input
                    type="text"
                    placeholder="Ej. DID-525VX3-108ZB"
                    value={partForm.sku}
                    onChange={(e) => setPartForm((prev) => ({ ...prev, sku: e.target.value }))}
                  />
                  <small style={{ color: '#64748b', fontSize: '10px', marginTop: '2px', display: 'block' }}>
                    Si se deja vacío se genera código OEM automático.
                  </small>
                </label>

                <label>
                  Marca / Fabricante
                  <input
                    type="text"
                    placeholder="Ej. DID Japan, Motul, EBC, Yuasa..."
                    value={partForm.brand}
                    onChange={(e) => setPartForm((prev) => ({ ...prev, brand: e.target.value }))}
                  />
                </label>

                <label>
                  Categoría del Sistema
                  <select
                    value={partForm.category}
                    onChange={(e) =>
                      setPartForm((prev) => ({ ...prev, category: e.target.value as PartSystemCategory }))
                    }
                  >
                    {PART_SYSTEM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Precio Unitario al Público (Bs) *
                  <input
                    type="number"
                    min="0"
                    step="5"
                    required
                    placeholder="Ej. 130"
                    value={partForm.unitPriceBOB}
                    onChange={(e) => setPartForm((prev) => ({ ...prev, unitPriceBOB: e.target.value }))}
                  />
                </label>

                <label>
                  Stock Inicial en Bodega
                  <input
                    type="number"
                    min="0"
                    placeholder="1"
                    value={partForm.stock}
                    onChange={(e) => setPartForm((prev) => ({ ...prev, stock: e.target.value }))}
                  />
                  <small style={{ color: '#64748b', fontSize: '10px', marginTop: '2px', display: 'block' }}>
                    Unidades físicas actualmente en estantería.
                  </small>
                </label>

                <label>
                  Stock Mínimo (Alerta Crítica)
                  <input
                    type="number"
                    min="1"
                    placeholder="2"
                    value={partForm.minStock}
                    onChange={(e) => setPartForm((prev) => ({ ...prev, minStock: e.target.value }))}
                  />
                  <small style={{ color: '#64748b', fontSize: '10px', marginTop: '2px', display: 'block' }}>
                    Alerta cuando el stock sea menor o igual a este número.
                  </small>
                </label>
              </div>

              <div
                className="modal-actions"
                style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}
              >
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setIsPartModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="button primary">
                  <Check style={{ width: '14px', height: '14px' }} />
                  {editingPartId ? 'Guardar Cambios' : 'Registrar Repuesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

