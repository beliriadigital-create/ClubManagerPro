-- =============================================================
-- 002_business_logic.sql
-- Módulo operativo: personas, equipos, jornadas, asistencias,
-- registro oficial
-- =============================================================

-- ─── Tipos enumerados ────────────────────────────────────────
create type public.asistencia_estado as enum ('presente', 'ausente', 'justificado');
create type public.registro_tipo     as enum ('entrada', 'salida');
create type public.jornada_tipo      as enum ('entrenamiento', 'partido', 'concentracion', 'otro');

-- ─── Tabla: personas ─────────────────────────────────────────
create table public.personas (
  id               uuid primary key default gen_random_uuid(),
  club_id          uuid not null references public.clubes(id) on delete cascade,
  nombre           text not null,
  apellidos        text not null,
  dni              text,
  fecha_nacimiento date,
  email            text,
  telefono         text,
  foto_url         text,
  tipo             text not null default 'socio'
                     check (tipo in ('jugador','entrenador','directivo','socio','staff','arbitro')),
  estado           text not null default 'activo'
                     check (estado in ('activo','inactivo','suspendido')),
  numero_licencia  text,
  -- QR único por persona (generado en backend/función)
  qr_code          text unique,
  -- Datos extra: alergias, tallas, grupo_sanguineo, contacto_emergencia…
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on column public.personas.metadata is
  'jsonb libre: { alergias: [], talla_camiseta: "M", grupo_sanguineo: "A+", contacto_emergencia: {nombre, telefono} }';

create index idx_personas_club_id on public.personas(club_id);
create index idx_personas_tipo    on public.personas(club_id, tipo);

-- ─── Tabla: temporadas ───────────────────────────────────────
create table public.temporadas (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubes(id) on delete cascade,
  nombre      text not null,           -- "2024-2025"
  fecha_inicio date,
  fecha_fin    date,
  activa       boolean not null default false,
  created_at   timestamptz not null default now()
);
create index idx_temporadas_club_id on public.temporadas(club_id);

-- ─── Tabla: equipos ──────────────────────────────────────────
create table public.equipos (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubes(id) on delete cascade,
  temporada_id uuid references public.temporadas(id) on delete set null,
  nombre       text not null,
  categoria    text not null,          -- "Benjamín A", "Juvenil", "Sénior"
  color_eq     text,                   -- hex del equipamiento
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_equipos_club_id on public.equipos(club_id);

-- ─── Tabla: equipo_personas (roster) ─────────────────────────
create table public.equipo_personas (
  id          uuid primary key default gen_random_uuid(),
  equipo_id   uuid not null references public.equipos(id) on delete cascade,
  persona_id  uuid not null references public.personas(id) on delete cascade,
  dorsal      text,
  posicion    text,
  created_at  timestamptz not null default now(),
  unique(equipo_id, persona_id)
);

-- ─── Tabla: jornadas ─────────────────────────────────────────
create table public.jornadas (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubes(id) on delete cascade,
  equipo_id   uuid not null references public.equipos(id) on delete cascade,
  fecha       timestamptz not null,
  rival       text,
  tipo        public.jornada_tipo not null default 'entrenamiento',
  lugar       text,
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_jornadas_club_id  on public.jornadas(club_id);
create index idx_jornadas_equipo   on public.jornadas(equipo_id);
create index idx_jornadas_fecha    on public.jornadas(fecha desc);

-- ─── Tabla: asistencias ──────────────────────────────────────
create table public.asistencias (
  id          uuid primary key default gen_random_uuid(),
  jornada_id  uuid not null references public.jornadas(id) on delete cascade,
  persona_id  uuid not null references public.personas(id) on delete cascade,
  estado      public.asistencia_estado not null default 'ausente',
  lat_lng     point,                   -- coordenadas GPS del fichaje
  fichado_en  timestamptz,
  notas       text,
  created_at  timestamptz not null default now(),
  unique(jornada_id, persona_id)
);
create index idx_asistencias_jornada  on public.asistencias(jornada_id);
create index idx_asistencias_persona  on public.asistencias(persona_id);

-- ─── Tabla: registro_oficial ─────────────────────────────────
-- Libro de registro oficial de entrada/salida de documentos
create table public.registro_oficial (
  id               uuid primary key default gen_random_uuid(),
  club_id          uuid not null references public.clubes(id) on delete cascade,
  tipo             public.registro_tipo not null,
  -- Número secuencial por club y tipo: ENTRY-0001-2025, EXIT-0001-2025
  numero_registro  text not null,
  extracto         text not null,
  fecha            date not null default current_date,
  remitente        text,
  destinatario     text,
  file_url         text,
  registrado_por   uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  unique(club_id, numero_registro)
);
create index idx_registro_club_id on public.registro_oficial(club_id);
create index idx_registro_fecha   on public.registro_oficial(club_id, fecha desc);

-- ─── Tabla: tareas ───────────────────────────────────────────
-- (Kanban operativo del club)
create table public.tareas (
  id               uuid primary key default gen_random_uuid(),
  club_id          uuid not null references public.clubes(id) on delete cascade,
  titulo           text not null,
  descripcion      text,
  estado           text not null default 'pendiente'
                     check (estado in ('pendiente','en_progreso','completada','cancelada')),
  prioridad        text not null default 'media'
                     check (prioridad in ('baja','media','alta','urgente')),
  asignado_a       uuid references public.personas(id) on delete set null,
  fecha_vencimiento date,
  orden            int not null default 0,   -- posición en columna Kanban
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_tareas_club_estado on public.tareas(club_id, estado);

-- ─── RLS ─────────────────────────────────────────────────────
alter table public.personas         enable row level security;
alter table public.temporadas       enable row level security;
alter table public.equipos          enable row level security;
alter table public.equipo_personas  enable row level security;
alter table public.jornadas         enable row level security;
alter table public.asistencias      enable row level security;
alter table public.registro_oficial enable row level security;
alter table public.tareas           enable row level security;

-- ─── Grants ──────────────────────────────────────────────────
grant select, insert, update, delete on public.personas         to authenticated;
grant select, insert, update, delete on public.temporadas       to authenticated;
grant select, insert, update, delete on public.equipos          to authenticated;
grant select, insert, update, delete on public.equipo_personas  to authenticated;
grant select, insert, update, delete on public.jornadas         to authenticated;
grant select, insert, update, delete on public.asistencias      to authenticated;
grant select, insert, update, delete on public.registro_oficial to authenticated;
grant select, insert, update, delete on public.tareas           to authenticated;
