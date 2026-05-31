-- =============================================================
-- 001_initial_schema.sql
-- Core: profiles, clubes, membresías y asignaciones de asesor
-- =============================================================

-- ─── Tipos enumerados ────────────────────────────────────────
create type public.user_role as enum ('admin', 'asesor', 'cliente');
create type public.club_member_role as enum ('admin_club', 'staff', 'tesorero', 'secretario');

-- ─── Tabla: profiles ─────────────────────────────────────────
-- Extiende auth.users con datos de negocio y rol de plataforma
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        public.user_role not null default 'cliente',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'Perfiles de usuario extendidos desde auth.users';

-- ─── Tabla: clubes ───────────────────────────────────────────
create table public.clubes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  cif         text,
  direccion   text,
  logo_url    text,
  settings    jsonb not null default '{}'::jsonb,  -- color_primario, deporte, etc.
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.clubes is 'Clubes deportivos gestionados en la plataforma';

-- ─── Tabla: club_members ─────────────────────────────────────
-- Vincula usuarios tipo 'cliente' a su club con un rol interno
create table public.club_members (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubes(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        public.club_member_role not null default 'staff',
  created_at  timestamptz not null default now(),
  unique(club_id, profile_id)
);
comment on table public.club_members is 'Membresía de usuarios cliente dentro de un club';

-- ─── Tabla: asesor_assignments ───────────────────────────────
-- Relación 1:N → un asesor puede gestionar varios clubes
create table public.asesor_assignments (
  id          uuid primary key default gen_random_uuid(),
  asesor_id   uuid not null references public.profiles(id) on delete cascade,
  club_id     uuid not null references public.clubes(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(asesor_id, club_id),
  -- Solo perfiles con rol 'asesor' pueden aparecer aquí
  constraint fk_asesor_role check (true)  -- validado via trigger en 004
);
comment on table public.asesor_assignments is 'Asignación de asesores a clubes (1 asesor : N clubes)';

-- ─── Índices ─────────────────────────────────────────────────
create index idx_club_members_club_id   on public.club_members(club_id);
create index idx_club_members_profile   on public.club_members(profile_id);
create index idx_asesor_assignments_asesor on public.asesor_assignments(asesor_id);
create index idx_asesor_assignments_club   on public.asesor_assignments(club_id);

-- ─── RLS ────────────────────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.clubes             enable row level security;
alter table public.club_members       enable row level security;
alter table public.asesor_assignments enable row level security;

-- ─── Grants (acceso desde cliente autenticado) ───────────────
grant select, insert, update on public.profiles           to authenticated;
grant select                 on public.clubes             to authenticated;
grant select                 on public.club_members       to authenticated;
grant select                 on public.asesor_assignments to authenticated;
grant insert, delete         on public.asesor_assignments to authenticated;
