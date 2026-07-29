create table if not exists public.setek_records (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  grade text not null,
  subject text not null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.setek_records enable row level security;
create policy "Allow anon read setek records" on public.setek_records for select to anon using (true);
create policy "Allow anon insert setek records" on public.setek_records for insert to anon with check (true);
create index if not exists setek_records_created_at_idx on public.setek_records (created_at desc);
