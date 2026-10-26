-- Le Pouls 2027 : base de données Supabase.
-- À coller une seule fois dans Supabase > SQL Editor, puis « Run ».
-- Une ligne par personne (identifiant anonyme). Personne ne peut lire les lignes des autres :
-- le site ne reçoit que des totaux, via la fonction get_results().

create table if not exists public.votes (
  id          uuid primary key references auth.users(id) on delete cascade,
  test        jsonb not null default '{}'::jsonb,
  ans         jsonb not null default '{}'::jsonb,
  duel        jsonb not null default '{}'::jsonb,
  x           real,
  y           real,
  tribe       text,
  consent_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint votes_objects check (jsonb_typeof(test)='object' and jsonb_typeof(ans)='object' and jsonb_typeof(duel)='object'),
  constraint votes_size check (pg_column_size(test)+pg_column_size(ans)+pg_column_size(duel) < 32000)
);

alter table public.votes enable row level security;

drop policy if exists "lire ma ligne" on public.votes;
drop policy if exists "creer ma ligne" on public.votes;
drop policy if exists "modifier ma ligne" on public.votes;
drop policy if exists "supprimer ma ligne" on public.votes;
create policy "lire ma ligne"      on public.votes for select to authenticated using (id = auth.uid());
create policy "creer ma ligne"     on public.votes for insert to authenticated with check (id = auth.uid());
create policy "modifier ma ligne"  on public.votes for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "supprimer ma ligne" on public.votes for delete to authenticated using (id = auth.uid());

-- La tribu est recalculée ici à partir des réponses : le navigateur ne peut pas la choisir.
-- Même barème que TEST dans app.js.
create or replace function public.compute_tribe() returns trigger
language plpgsql as $$
declare
  signs jsonb := '{"e1":["x",-1],"e2":["x",-1],"e3":["x",-1],"e4":["x",1],"e5":["x",1],"e6":["x",1],
                   "s1":["y",1],"s2":["y",1],"s3":["y",1],"s4":["y",-1],"s5":["y",-1],"s6":["y",-1]}';
  k text; val int; sx int := 0; sy int := 0; c int := 0;
begin
  for k in select jsonb_object_keys(signs) loop
    val := case new.test->>k when 'O' then 1 when 'D' then 0 when 'X' then -1 else null end;
    if val is not null then
      c := c + 1;
      if signs->k->>0 = 'x' then sx := sx + val * (signs->k->>1)::int;
      else sy := sy + val * (signs->k->>1)::int; end if;
    end if;
  end loop;
  if c = 12 then
    new.x := sx / 6.0;
    new.y := sy / 6.0;
    new.tribe := case
      when abs(new.x) < 0.3 and abs(new.y) < 0.3 then 'chouette'
      when new.x < 0 and new.y >= 0 then 'loup'
      when new.x < 0 then 'heron'
      when new.y >= 0 then 'lynx'
      else 'cerf' end;
  else
    new.x := null; new.y := null; new.tribe := null;
  end if;
  new.updated_at := now();
  if tg_op = 'UPDATE' then new.consent_at := old.consent_at; end if;
  return new;
end $$;

drop trigger if exists votes_compute on public.votes;
create trigger votes_compute before insert or update on public.votes
for each row execute function public.compute_tribe();

-- Totaux publics. Masqués la veille et le jour de chaque tour (heure de Paris).
create or replace function public.get_results() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  paris timestamp := now() at time zone 'Europe/Paris';
  result jsonb;
begin
  if (paris >= '2027-04-17 00:00' and paris < '2027-04-18 20:00')
  or (paris >= '2027-05-01 00:00' and paris < '2027-05-02 20:00') then
    return jsonb_build_object('blackout', true);
  end if;

  with a as (
    select 'ans'::text f, e.key k, v.tribe t, e.value val, count(*) n
    from votes v, jsonb_each_text(v.ans) e
    where e.value in ('O','D','X') and e.key ~ '^[A-Za-z0-9_-]{1,40}$'
    group by 1,2,3,4
  ), d as (
    select 'duel'::text f, e.key k, v.tribe t, e.value val, count(*) n
    from votes v, jsonb_each_text(v.duel) e
    where e.value in ('A','B','N') and e.key ~ '^d[0-9]{1,3}$'
    group by 1,2,3,4
  ), m as (
    select round(x::numeric, 3) x, round(y::numeric, 3) y, tribe t, count(*) n
    from votes where tribe is not null
    group by 1,2,3
  )
  select jsonb_build_object(
    'n',    (select count(*) from votes),
    'rows', coalesce((select jsonb_agg(jsonb_build_array(f,k,t,val,n)) from (select * from a union all select * from d) z), '[]'::jsonb),
    'map',  coalesce((select jsonb_agg(jsonb_build_array(x,y,t,n)) from m), '[]'::jsonb)
  ) into result;
  return result;
end $$;

revoke all on function public.get_results() from public;
grant execute on function public.get_results() to anon, authenticated;

-- Effacement prévu : toutes les réponses seront supprimées après l'élection
-- (voir politique.html). À exécuter à la main le 2 août 2027 :
--   delete from public.votes;
