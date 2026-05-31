-- Subvenciones pipeline
create table if not exists public.subvenciones (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  nombre text not null,
  importe_solicitado numeric(12,2) not null default 0,
  importe_concedido numeric(12,2),
  estado text not null check (estado in ('identificada','en_preparacion','solicitada','concedida','denegada')) default 'identificada',
  fecha_limite date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subvenciones enable row level security;

create policy "subvenciones_select" on public.subvenciones for select using (
  public.get_user_role() = 'admin'
  or (public.get_user_role() = 'asesor' and public.asesor_has_club(club_id))
  or club_id = public.get_user_club_id()
);

create trigger subvenciones_updated_at before update on public.subvenciones
  for each row execute function public.handle_updated_at();

-- Alertas semáforo
create table if not exists public.alertas_semaforo (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  tipo text not null check (tipo in ('fiscal','laboral','deportivo','administrativo')),
  nivel text not null check (nivel in ('verde','amarillo','rojo')),
  mensaje text not null,
  resuelta boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.alertas_semaforo enable row level security;

create policy "alertas_select" on public.alertas_semaforo for select using (
  public.get_user_role() = 'admin'
  or (public.get_user_role() = 'asesor' and public.asesor_has_club(club_id))
  or club_id = public.get_user_club_id()
);

-- View: club 360 summary
create or replace view public.club_360 as
select
  c.id,
  c.nombre,
  c.logo_url,
  c.email,
  count(distinct p.id) filter (where p.estado = 'activo') as total_personas,
  count(distinct t.id) filter (where t.estado in ('pendiente','en_progreso')) as tareas_pendientes,
  count(distinct o.id) filter (where o.estado = 'vencida') as obligaciones_vencidas,
  case
    when count(distinct o.id) filter (where o.estado = 'vencida') > 0 then 'rojo'
    when count(distinct o.id) filter (where o.estado = 'pendiente' and o.fecha_vencimiento <= current_date + 30) > 0 then 'amarillo'
    else 'verde'
  end as estado_semaforo
from public.clubs c
left join public.personas p on p.club_id = c.id
left join public.tareas t on t.club_id = c.id
left join public.obligaciones_fiscales o on o.club_id = c.id
group by c.id;
