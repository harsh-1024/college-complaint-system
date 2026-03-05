create extension if not exists "pgcrypto";

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  complaint_id text unique not null,
  student_name text,
  is_anonymous boolean not null default false,
  email text,
  college text not null,
  title text not null,
  description text not null,
  category text not null,
  image_url text,
  status text not null default 'Pending',
  admin_comments text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists complaints_created_at_idx on public.complaints (created_at desc);
create index if not exists complaints_status_idx on public.complaints (status);
create index if not exists complaints_college_idx on public.complaints (college);
create index if not exists complaints_category_idx on public.complaints (category);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists complaints_set_updated_at on public.complaints;
create trigger complaints_set_updated_at
before update on public.complaints
for each row
execute function public.set_updated_at_timestamp();

alter table public.complaints disable row level security;

-- Create a public bucket in Supabase Storage named: complaint-images
-- If using a different name, update SUPABASE_STORAGE_BUCKET in .env
