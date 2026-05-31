-- =============================================================
-- 003_asesoria_schema.sql
-- Módulo de asesoría: fiscal, subvenciones, CRM
-- =============================================================

-- ─── Tipos enumerados ────────────────────────────────────────
create type public.obligacion_estado   as enum ('pendiente', 'presentado', 'vencido', 'no_aplica');
create type public.obligacion_frecuencia as enum ('mensual', 'trimestral', 'semestral', 'anual', 'puntual');
create type public.subvencion_estado   as enum ('identificada', 'solicitud', 'documentacion', 'justificacion', 'cobrado', 'denegada');
create type public.ejercicio_estado    as enum ('abierto', 'cerrado');
create type public.interaccion_tipo    as enum ('reunion', 'email', 'llamada', 'visita', 'otro');

-- ─── Tabla: ejercicios_fiscales ──────────────────────────────
-- Año fiscal del club. Agrupa obligaciones de un ejercicio.
create table public.ejercicios_fiscales (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubes(id) on delete cascade,
  anio        int  not null check (anio >= 2000 and anio <= 2100),
  estado      public.ejercicio_estado not null default 'abierto',
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(club_id, anio)
);
create index idx_ejercicios_club_id on public.ejercicios_fiscales(club_id);

-- ─── Tabla: obligaciones_fiscales ───────────────────────────
create table public.obligaciones_fiscales (
  id                  uuid primary key default gen_random_uuid(),
  club_id             uuid not null references public.clubes(id) on delete cascade,
  ejercicio_id        uuid references public.ejercicios_fiscales(id) on delete set null,
  nombre              text not null,           -- "IVA 1T 2025", "Modelo 347"
  descripcion         text,
  fecha_vencimiento   date not null,
  estado              public.obligacion_estado not null default 'pendiente',
  frecuencia          public.obligacion_frecuencia not null default 'puntual',
  importe             numeric(12,2),
  file_url            text,                    -- justificante presentación
  recordatorio_dias   int not null default 15, -- avisar N días antes
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_obligaciones_club_id  on public.obligaciones_fiscales(club_id);
create index idx_obligaciones_fecha    on public.obligaciones_fiscales(club_id, fecha_vencimiento);
create index idx_obligaciones_estado   on public.obligaciones_fiscales(club_id, estado);

-- ─── Tabla: subvenciones ─────────────────────────────────────
create table public.subvenciones (
  id                  uuid primary key default gen_random_uuid(),
  club_id             uuid not null references public.clubes(id) on delete cascade,
  nombre              text not null,
  organismo           text,
  descripcion         text,
  importe_solicitado  numeric(12,2) not null default 0,
  importe_concedido   numeric(12,2),
  estado              public.subvencion_estado not null default 'identificada',
  fecha_limite        date,
  fecha_solicitud     date,
  fecha_resolucion    date,
  documentos          jsonb not null default '[]'::jsonb, -- [{nombre, url, subido_en}]
  notas               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_subvenciones_club_id on public.subvenciones(club_id);
create index idx_subvenciones_estado  on public.subvenciones(club_id, estado);

-- ─── Tabla: interacciones_crm ────────────────────────────────
-- Historial de contacto asesor-club
create table public.interacciones_crm (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubes(id) on delete cascade,
  asesor_id   uuid not null references public.profiles(id) on delete cascade,
  tipo        public.interaccion_tipo not null,
  resumen     text not null,
  fecha       timestamptz not null default now(),
  seguimiento date,                            -- fecha de próximo seguimiento
  created_at  timestamptz not null default now()
);
create index idx_crm_club_id   on public.interacciones_crm(club_id);
create index idx_crm_asesor_id on public.interacciones_crm(asesor_id);
create index idx_crm_fecha     on public.interacciones_crm(fecha desc);

-- ─── Vista: club_dashboard_360 ───────────────────────────────
-- Vista consolidada para el panel del asesor (no RLS, se protege en función)
create or replace view public.club_dashboard_360 as
select
  c.id,
  c.nombre,
  c.logo_url,
  c.cif,
  -- Personas activas
  count(distinct p.id) filter (where p.estado = 'activo')          as total_personas,
  -- Tareas operativas pendientes
  count(distinct t.id) filter (where t.estado in ('pendiente','en_progreso')) as tareas_pendientes,
  -- Obligaciones fiscales vencidas
  count(distinct o.id) filter (where o.estado = 'vencido')         as obligaciones_vencidas,
  -- Obligaciones a vencer en los próximos 30 días
  count(distinct o.id) filter (
    where o.estado = 'pendiente'
    and o.fecha_vencimiento between current_date and current_date + 30
  )                                                                  as obligaciones_proximas,
  -- Subvenciones activas (no cerradas)
  count(distinct s.id) filter (
    where s.estado not in ('cobrado','denegada')
  )                                                                  as subvenciones_activas,
  -- Semáforo de salud: rojo si hay vencidas, amarillo si hay próximas, verde si no
  case
    when count(distinct o.id) filter (where o.estado = 'vencido') > 0   then 'rojo'
    when count(distinct o.id) filter (
      where o.estado = 'pendiente'
      and o.fecha_vencimiento between current_date and current_date + 30
    ) > 0                                                             then 'amarillo'
    else 'verde'
  end                                                                as semaforo
from public.clubes c
left join public.personas          p on p.club_id = c.id
left join public.tareas            t on t.club_id = c.id
left join public.obligaciones_fiscales o on o.club_id = c.id
left join public.subvenciones      s on s.club_id = c.id
group by c.id, c.nombre, c.logo_url, c.cif;

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.ejercicios_fiscales  enable row level security;
alter table public.obligaciones_fiscales enable row level security;
alter table public.subvenciones          enable row level security;
alter table public.interacciones_crm     enable row level security;

-- ─── Grants ──────────────────────────────────────────────────
grant select, insert, update, delete on public.ejercicios_fiscales   to authenticated;
grant select, insert, update, delete on public.obligaciones_fiscales  to authenticated;
grant select, insert, update, delete on public.subvenciones           to authenticated;
grant select, insert, update, delete on public.interacciones_crm      to authenticated;
grant select on public.club_dashboard_360 to authenticated;
