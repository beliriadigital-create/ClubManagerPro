-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clubs_updated_at before update on public.clubs
  for each row execute function public.handle_updated_at();

create trigger personas_updated_at before update on public.personas
  for each row execute function public.handle_updated_at();

create trigger equipos_updated_at before update on public.equipos
  for each row execute function public.handle_updated_at();

create trigger tareas_updated_at before update on public.tareas
  for each row execute function public.handle_updated_at();

create trigger obligaciones_updated_at before update on public.obligaciones_fiscales
  for each row execute function public.handle_updated_at();

-- Auto-create user_profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (user_id, nombre)
  values (new.id, new.raw_user_meta_data->>'nombre');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
