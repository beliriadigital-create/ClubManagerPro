-- =============================================================
-- 004_security_functions.sql
-- Funciones SECURITY DEFINER, triggers y políticas RLS
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN 1: public.get_user_role
-- Retorna el rol de plataforma del usuario autenticado
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_user_role(uid uuid default auth.uid())
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = uid;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN 2: public.is_club_member
-- Corazón del sistema de autorización.
-- Retorna TRUE si el usuario (uid) puede acceder a datos del club (cid).
--
-- Reglas:
--   1. El usuario es admin de plataforma → acceso total
--   2. El usuario es miembro del club (club_members)
--   3. El usuario es asesor asignado al club (asesor_assignments)
--
-- Un cliente de club_A nunca verá datos de club_B.
-- Un asesor puede ver datos de todos sus clubes asignados.
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_club_member(uid uuid, cid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    -- Caso 1: admin de plataforma
    select 1 from public.profiles
    where id = uid and role = 'admin'

    union all

    -- Caso 2: miembro directo del club (usuario tipo 'cliente')
    select 1 from public.club_members
    where profile_id = uid and club_id = cid

    union all

    -- Caso 3: asesor asignado a ese club específico
    select 1 from public.asesor_assignments aa
    join public.profiles pr on pr.id = aa.asesor_id
    where aa.asesor_id = uid
      and aa.club_id   = cid
      and pr.role      = 'asesor'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN 3: public.generate_numero_registro
-- Genera el siguiente número secuencial para el libro de registro.
-- Formato: ENTRY-NNNN-YYYY / EXIT-NNNN-YYYY (por club)
-- ─────────────────────────────────────────────────────────────
create or replace function public.generate_numero_registro(cid uuid, t public.registro_tipo)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  prefijo   text;
  año       text;
  siguiente int;
  patron    text;
begin
  prefijo := case t when 'entrada' then 'ENTRY' else 'EXIT' end;
  año     := to_char(current_date, 'YYYY');
  patron  := prefijo || '-%%-' || año;

  -- Cuenta registros existentes para ese club, tipo y año
  select coalesce(max(
    substring(numero_registro from prefijo || '-(\d+)-' || año)::int
  ), 0) + 1
  into siguiente
  from public.registro_oficial
  where club_id         = cid
    and tipo            = t
    and numero_registro like replace(patron, '%%', '%');

  return prefijo || '-' || lpad(siguiente::text, 4, '0') || '-' || año;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN 4: public.handle_updated_at
-- Trigger genérico para actualizar updated_at automáticamente
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Triggers de updated_at
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger trg_clubes_updated_at
  before update on public.clubes
  for each row execute function public.handle_updated_at();

create trigger trg_personas_updated_at
  before update on public.personas
  for each row execute function public.handle_updated_at();

create trigger trg_equipos_updated_at
  before update on public.equipos
  for each row execute function public.handle_updated_at();

create trigger trg_jornadas_updated_at
  before update on public.jornadas
  for each row execute function public.handle_updated_at();

create trigger trg_tareas_updated_at
  before update on public.tareas
  for each row execute function public.handle_updated_at();

create trigger trg_ejercicios_updated_at
  before update on public.ejercicios_fiscales
  for each row execute function public.handle_updated_at();

create trigger trg_obligaciones_updated_at
  before update on public.obligaciones_fiscales
  for each row execute function public.handle_updated_at();

create trigger trg_subvenciones_updated_at
  before update on public.subvenciones
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN 5: handle_new_user
-- Crea automáticamente un profile al registrarse un usuario
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'cliente')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- FUNCIÓN 6: validate_asesor_assignment
-- Garantiza que solo usuarios con rol 'asesor' entren en
-- asesor_assignments
-- ─────────────────────────────────────────────────────────────
create or replace function public.validate_asesor_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.asesor_id and role = 'asesor'
  ) then
    raise exception 'Solo usuarios con rol asesor pueden ser asignados a clubes';
  end if;
  return new;
end;
$$;

create trigger trg_validate_asesor
  before insert or update on public.asesor_assignments
  for each row execute function public.validate_asesor_assignment();

-- =============================================================
-- POLÍTICAS RLS — TABLA POR TABLA
-- Todas usan is_club_member(auth.uid(), club_id)
-- =============================================================

-- ─── profiles ────────────────────────────────────────────────
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid() or public.get_user_role() = 'admin');

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- ─── clubes ──────────────────────────────────────────────────
-- Solo ve el club si es miembro/asesor/admin
create policy "clubes_select"
  on public.clubes for select
  using (public.is_club_member(auth.uid(), id));

create policy "clubes_update"
  on public.clubes for update
  using (
    public.get_user_role() = 'admin'
    or exists (
      select 1 from public.club_members
      where profile_id = auth.uid()
        and club_id = id
        and role = 'admin_club'
    )
  );

-- ─── club_members ─────────────────────────────────────────────
create policy "club_members_select"
  on public.club_members for select
  using (public.is_club_member(auth.uid(), club_id));

create policy "club_members_insert"
  on public.club_members for insert
  with check (
    public.get_user_role() = 'admin'
    or exists (
      select 1 from public.club_members
      where profile_id = auth.uid()
        and club_id = new.club_id
        and role = 'admin_club'
    )
  );

-- ─── asesor_assignments ──────────────────────────────────────
-- Un asesor solo ve sus propias asignaciones; admin ve todas
create policy "asesor_assignments_select"
  on public.asesor_assignments for select
  using (
    asesor_id = auth.uid()
    or public.get_user_role() = 'admin'
  );

create policy "asesor_assignments_insert"
  on public.asesor_assignments for insert
  with check (public.get_user_role() = 'admin');

create policy "asesor_assignments_delete"
  on public.asesor_assignments for delete
  using (public.get_user_role() = 'admin');

-- ─── personas ────────────────────────────────────────────────
create policy "personas_select"
  on public.personas for select
  using (public.is_club_member(auth.uid(), club_id));

create policy "personas_insert"
  on public.personas for insert
  with check (public.is_club_member(auth.uid(), club_id));

create policy "personas_update"
  on public.personas for update
  using (public.is_club_member(auth.uid(), club_id));

create policy "personas_delete"
  on public.personas for delete
  using (
    public.get_user_role() = 'admin'
    or (
      public.is_club_member(auth.uid(), club_id)
      and exists (
        select 1 from public.club_members
        where profile_id = auth.uid()
          and club_id = personas.club_id
          and role = 'admin_club'
      )
    )
  );

-- ─── temporadas ──────────────────────────────────────────────
create policy "temporadas_all"
  on public.temporadas for all
  using (public.is_club_member(auth.uid(), club_id))
  with check (public.is_club_member(auth.uid(), club_id));

-- ─── equipos ─────────────────────────────────────────────────
create policy "equipos_all"
  on public.equipos for all
  using (public.is_club_member(auth.uid(), club_id))
  with check (public.is_club_member(auth.uid(), club_id));

-- ─── equipo_personas ─────────────────────────────────────────
create policy "equipo_personas_all"
  on public.equipo_personas for all
  using (
    exists (
      select 1 from public.equipos e
      where e.id = equipo_id
        and public.is_club_member(auth.uid(), e.club_id)
    )
  )
  with check (
    exists (
      select 1 from public.equipos e
      where e.id = equipo_id
        and public.is_club_member(auth.uid(), e.club_id)
    )
  );

-- ─── jornadas ────────────────────────────────────────────────
create policy "jornadas_all"
  on public.jornadas for all
  using (public.is_club_member(auth.uid(), club_id))
  with check (public.is_club_member(auth.uid(), club_id));

-- ─── asistencias ─────────────────────────────────────────────
create policy "asistencias_all"
  on public.asistencias for all
  using (
    exists (
      select 1 from public.jornadas j
      where j.id = jornada_id
        and public.is_club_member(auth.uid(), j.club_id)
    )
  )
  with check (
    exists (
      select 1 from public.jornadas j
      where j.id = jornada_id
        and public.is_club_member(auth.uid(), j.club_id)
    )
  );

-- ─── registro_oficial ────────────────────────────────────────
create policy "registro_select"
  on public.registro_oficial for select
  using (public.is_club_member(auth.uid(), club_id));

create policy "registro_insert"
  on public.registro_oficial for insert
  with check (public.is_club_member(auth.uid(), club_id));

-- El número de registro se asigna antes del insert via función
create policy "registro_update"
  on public.registro_oficial for update
  using (
    public.get_user_role() = 'admin'
    or (
      public.is_club_member(auth.uid(), club_id)
      and registrado_por = auth.uid()
    )
  );

-- ─── tareas ──────────────────────────────────────────────────
create policy "tareas_all"
  on public.tareas for all
  using (public.is_club_member(auth.uid(), club_id))
  with check (public.is_club_member(auth.uid(), club_id));

-- ─── ejercicios_fiscales ─────────────────────────────────────
create policy "ejercicios_all"
  on public.ejercicios_fiscales for all
  using (public.is_club_member(auth.uid(), club_id))
  with check (public.is_club_member(auth.uid(), club_id));

-- ─── obligaciones_fiscales ───────────────────────────────────
create policy "obligaciones_all"
  on public.obligaciones_fiscales for all
  using (public.is_club_member(auth.uid(), club_id))
  with check (public.is_club_member(auth.uid(), club_id));

-- ─── subvenciones ────────────────────────────────────────────
create policy "subvenciones_all"
  on public.subvenciones for all
  using (public.is_club_member(auth.uid(), club_id))
  with check (public.is_club_member(auth.uid(), club_id));

-- ─── interacciones_crm ───────────────────────────────────────
-- El asesor ve sus propias interacciones; admins ven todas
create policy "crm_select"
  on public.interacciones_crm for select
  using (
    asesor_id = auth.uid()
    or public.get_user_role() = 'admin'
    or public.is_club_member(auth.uid(), club_id)
  );

create policy "crm_insert"
  on public.interacciones_crm for insert
  with check (
    asesor_id = auth.uid()
    and public.is_club_member(auth.uid(), club_id)
  );

create policy "crm_update"
  on public.interacciones_crm for update
  using (asesor_id = auth.uid() or public.get_user_role() = 'admin');
