-- =========================================================================
-- ESQUEMA DE BASE DE DATOS PARA TALLER DE MOTOCICLETAS (SUPABASE POSTGRESQL)
-- =========================================================================
-- Diseñado siguiendo las mejores prácticas de Supabase:
-- - Timestamps con zona horaria (TIMESTAMPTZ)
-- - Llaves foráneas con eliminación segura
-- - Índices optimizados para búsquedas por placa, estado y mecánico
-- - Row Level Security (RLS) habilitado
-- - Publicación Realtime para sincronización instantánea Admin <-> Mecánico <-> Cliente

-- 1. Extensiones necesarias
create extension if not exists "uuid-ossp";

-- 2. Tabla de Configuración del Taller (Datos legales NIT, WhatsApp, presupuesto)
create table if not exists public.workshop_settings (
  id text primary key default 'default_settings',
  workshop_name text not null default 'MotoLab Bolivia',
  workshop_subtitle text not null default 'Centro Especializado en Motocicletas y Mecánica Multimarca',
  workshop_phone text not null default '+591 7642-3390',
  workshop_nit text not null default '3849201015',
  bank_name text not null default 'Banco Nacional de Bolivia (BNB)',
  bank_account text not null default 'Cta Cte BOB 2000-849201-92',
  whatsapp_signature text not null default 'Equipo Técnico Especializado · MotoLab Bolivia',
  default_labor_rate numeric not null default 120,
  monthly_expense_budget numeric not null default 32000,
  admin_name text not null default 'Marco Ríos',
  admin_role text not null default 'Administrador General',
  mechanics text[] not null default array['Marco Ríos', 'Lucía Vidal', 'Carlos Méndez'],
  notifications_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 3. Tabla de Órdenes de Trabajo (Kanban, Diagnóstico, Checklist Anti-Reclamos)
create table if not exists public.orders (
  id text primary key,
  bike text not null,
  plate text not null,
  client text not null,
  client_nit_ci text,
  phone text not null,
  email text,
  service text not null,
  diagnosis text not null,
  mileage text default '12.500 km',
  fuel_level text default '1/2 tanque',
  mechanic text not null,
  status text not null default 'Agendado' check (status in ('Agendado', 'En diagnóstico', 'En reparación', 'Listo para entrega', 'Entregado')),
  eta text not null,
  created_at_label text not null default 'Hoy, 09:30',
  accent text not null default 'orange',
  avatar text not null default 'MR',
  mechanic_note text not null default '',
  mechanic_note_updated_at text not null default 'Hace un momento',
  quote_approved boolean not null default false,
  quote_approved_at text,
  paid boolean not null default false,
  paid_method text default 'QR Simple',
  qr_payment_notified boolean default false,
  client_comment text,
  photos_count integer not null default 0,
  timeline jsonb not null default '{}'::jsonb,
  replaced_parts jsonb not null default '[]'::jsonb,
  health_check jsonb not null default '[]'::jsonb,
  intake_checklist jsonb not null default '{}'::jsonb,
  next_service_km text,
  quote_items jsonb not null default '[]'::jsonb,
  history jsonb not null default '[]'::jsonb,
  whatsapp_logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices de alto rendimiento para el taller
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_plate on public.orders (plate);
create index if not exists idx_orders_mechanic on public.orders (mechanic);
create index if not exists idx_orders_created_at on public.orders (created_at desc);

-- 4. Tabla de Kardex e Inventario de Repuestos en Bodega (Bs)
create table if not exists public.inventory (
  id text primary key,
  sku text not null unique,
  name text not null,
  brand text not null,
  category text not null,
  stock integer not null default 0,
  min_stock integer not null default 2,
  unit_price_bob numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inventory_sku on public.inventory (sku);
create index if not exists idx_inventory_category on public.inventory (category);

-- 5. Tabla de Libro Mayor Contable / Transacciones Financieras (Bs)
create table if not exists public.finance_transactions (
  id text primary key,
  date text not null,
  month text not null,
  description text not null,
  category text not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  payment_method text not null default 'QR Simple',
  status text not null default 'Pagado' check (status in ('Pagado', 'Pendiente de pago')),
  provider_or_client text,
  invoice_or_doc text,
  order_id text references public.orders(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_type_month on public.finance_transactions (type, month);
create index if not exists idx_finance_created_at on public.finance_transactions (created_at desc);

-- 6. Tabla de Actividades y Notificaciones de Taller
create table if not exists public.activities (
  id text primary key,
  tone text not null default 'orange',
  icon_type text not null default 'wrench',
  actor text not null,
  action text not null,
  target text not null,
  order_id text,
  time text not null default 'Justo ahora',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_created_at on public.activities (created_at desc);

-- 7. Trigger automático para actualizar updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_orders_updated_at on public.orders;
create trigger tr_orders_updated_at
before update on public.orders
for each row execute function public.handle_updated_at();

drop trigger if exists tr_settings_updated_at on public.workshop_settings;
create trigger tr_settings_updated_at
before update on public.workshop_settings
for each row execute function public.handle_updated_at();

-- 8. Habilitar Row Level Security (RLS) en todas las tablas
alter table public.workshop_settings enable row level security;
alter table public.orders enable row level security;
alter table public.inventory enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.activities enable row level security;

-- Políticas permisivas iniciales para el MVP en producción (compatible con clave Anon y Authenticated)
create policy "Allow read access to workshop_settings" on public.workshop_settings for select using (true);
create policy "Allow write access to workshop_settings" on public.workshop_settings for all using (true);

create policy "Allow read access to orders" on public.orders for select using (true);
create policy "Allow insert access to orders" on public.orders for insert with check (true);
create policy "Allow update access to orders" on public.orders for update using (true);
create policy "Allow delete access to orders" on public.orders for delete using (true);

create policy "Allow read access to inventory" on public.inventory for select using (true);
create policy "Allow write access to inventory" on public.inventory for all using (true);

create policy "Allow read access to finance_transactions" on public.finance_transactions for select using (true);
create policy "Allow write access to finance_transactions" on public.finance_transactions for all using (true);

create policy "Allow read access to activities" on public.activities for select using (true);
create policy "Allow write access to activities" on public.activities for all using (true);

-- 9. Habilitar Realtime para Órdenes, Actividades e Inventario
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.finance_transactions;

-- 10. Storage Bucket para Fotos Técnicas de Taller
insert into storage.buckets (id, name, public)
values ('workshop-photos', 'workshop-photos', true)
on conflict (id) do update set public = true;

create policy "Public Access to Workshop Photos" on storage.objects
for select using (bucket_id = 'workshop-photos');

create policy "Authenticated & Anon Upload to Workshop Photos" on storage.objects
for insert with check (bucket_id = 'workshop-photos');

