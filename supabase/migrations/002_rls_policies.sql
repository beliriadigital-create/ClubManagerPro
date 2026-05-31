-- Enable RLS on all tables
alter table public.clubs enable row level security;
alter table public.user_profiles enable row level security;
alter table public.asesor_clubs enable row level security;
alter table public.personas enable row level security;
alter table public.equipos enable row level security;
alter table public.tareas enable row level security;
alter table public.obligaciones_fiscales enable row level security;

-- Helper: get current user role
create or replace function public.get_user_role()
returns text language sql security definer stable as $$
  select rol from public.user_profiles where user_id = auth.uid();
$$;

-- Helper: get current user club_id
create or replace function public.get_user_club_id()
returns uuid language sql security definer stable as $$
  select club_id from public.user_profiles where user_id = auth.uid();
$$;

-- Helper: check if asesor has access to club
create or replace function public.asesor_has_club(p_club_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.asesor_clubs
    where asesor_id = auth.uid() and club_id = p_club_id
  );
$$;

-- Clubs policies
create policy "clubs_select" on public.clubs for select using (
  public.get_user_role() = 'admin'
  or (public.get_user_role() = 'asesor' and public.asesor_has_club(id))
  or (public.get_user_role() = 'cliente' and id = public.get_user_club_id())
);

-- User profiles
create policy "profiles_select_own" on public.user_profiles for select using (user_id = auth.uid());
create policy "profiles_update_own" on public.user_profiles for update using (user_id = auth.uid());

-- Personas
create policy "personas_select" on public.personas for select using (
  public.get_user_role() = 'admin'
  or (public.get_user_role() = 'asesor' and public.asesor_has_club(club_id))
  or club_id = public.get_user_club_id()
);
create policy "personas_insert" on public.personas for insert with check (
  public.get_user_role() in ('admin', 'cliente') and club_id = public.get_user_club_id()
);
create policy "personas_update" on public.personas for update using (
  public.get_user_role() in ('admin', 'cliente') and club_id = public.get_user_club_id()
);

-- Equipos
create policy "equipos_select" on public.equipos for select using (
  public.get_user_role() = 'admin'
  or (public.get_user_role() = 'asesor' and public.asesor_has_club(club_id))
  or club_id = public.get_user_club_id()
);

-- Tareas
create policy "tareas_select" on public.tareas for select using (
  public.get_user_role() = 'admin'
  or (public.get_user_role() = 'asesor' and public.asesor_has_club(club_id))
  or club_id = public.get_user_club_id()
);

-- Obligaciones fiscales
create policy "obligaciones_select" on public.obligaciones_fiscales for select using (
  public.get_user_role() = 'admin'
  or (public.get_user_role() = 'asesor' and public.asesor_has_club(club_id))
  or club_id = public.get_user_club_id()
);
