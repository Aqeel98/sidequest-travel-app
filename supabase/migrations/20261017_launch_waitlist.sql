-- Launch waitlist: emails collected on the holding page.
-- Run once in Supabase → SQL Editor.
-- The public can only INSERT. Nobody can read the list through the API;
-- view or export it from Supabase → Table Editor → launch_waitlist.

create table if not exists public.launch_waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text not null default 'holding_page',
  created_at  timestamptz not null default now(),
  constraint launch_waitlist_email_format
    check (char_length(email) between 5 and 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint launch_waitlist_source_allowed
    check (source in ('holding_page', 'quiz'))
);

-- One row per address, case-insensitive. Duplicates return error 23505,
-- which the app treats as "already on the list".
create unique index if not exists launch_waitlist_email_unique
  on public.launch_waitlist (lower(email));

alter table public.launch_waitlist enable row level security;

drop policy if exists "Anyone can join the waitlist" on public.launch_waitlist;
create policy "Anyone can join the waitlist"
  on public.launch_waitlist
  for insert
  to anon, authenticated
  with check (true);

-- No select/update/delete policies: the list is write-only from the browser.
grant insert on public.launch_waitlist to anon, authenticated;
