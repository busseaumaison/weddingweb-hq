-- À exécuter UNE FOIS dans Supabase > SQL Editor AVANT de déployer les nouveaux composants.
-- Migration non destructive : conserve les réponses actuelles.
alter table public.guests add column if not exists is_child boolean not null default false;
alter table public.guests add column if not exists child_age smallint;
alter table public.families add column if not exists song_suggestion text;
alter table public.families add column if not exists message_to_couple text;
alter table public.families add column if not exists shared_memory text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='guests_child_age_range') then
    alter table public.guests add constraint guests_child_age_range check(child_age is null or (child_age between 0 and 17));
  end if;
end $$;
-- Seules les routes serveur avec service_role accèdent aux informations privées.
