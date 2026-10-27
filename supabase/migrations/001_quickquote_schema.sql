-- =====================================================================
-- QuickQuote — Freelance Service Quotation System
-- Supabase / PostgreSQL schema (Tables 3.1 – 3.7) + Row-Level Security
-- Run this whole file once in: Supabase Dashboard -> SQL Editor -> New query
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- Table 3.1: users (profile row for every Supabase Auth account)
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id            uuid primary key default uuid_generate_v4()
                references auth.users (id) on delete cascade,
  first_name    varchar(50)  not null default '',
  last_name     varchar(50)  not null default '',
  email         varchar(100) not null unique,
  role          varchar(15)  not null default 'freelancer'
                check (role in ('freelancer', 'admin')),
  business_name varchar(100),
  tax_rate      decimal(5,2) default 7.5,
  is_active     boolean      not null default true,
  created_at    timestamptz  not null default now()
);

-- ---------------------------------------------------------------------
-- Table 3.2: projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id            uuid primary key default uuid_generate_v4(),
  freelancer_id uuid not null references public.users (id) on delete cascade,
  project_name  varchar(100) not null,
  description   text,
  start_date    date,
  deadline      date,
  health_status varchar(10) not null default 'green'
                check (health_status in ('red', 'yellow', 'green')),
  status        varchar(20) not null default 'active'
                check (status in ('active', 'completed', 'cancelled')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Table 3.3: quotations
-- ---------------------------------------------------------------------
create table if not exists public.quotations (
  id                  uuid primary key default uuid_generate_v4(),
  freelancer_id       uuid not null references public.users (id) on delete cascade,
  project_id          uuid references public.projects (id) on delete set null,
  service_description text not null,
  gross_amount        decimal(12,2) not null,
  tax_rate            decimal(5,2)  not null,
  net_amount          decimal(12,2) not null,
  expiry_date         date,
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Table 3.4: invoices
-- (client_name / client_email / invoice_number / project_title / status /
--  tax_rate / notes added to support the Invoice Generator and status tabs)
-- ---------------------------------------------------------------------
create table if not exists public.invoices (
  id             uuid primary key default uuid_generate_v4(),
  freelancer_id  uuid not null references public.users (id) on delete cascade,
  project_id     uuid references public.projects (id) on delete set null,
  invoice_number varchar(40),
  client_name    varchar(100) not null,
  client_email   varchar(100) not null,
  project_title  varchar(150),
  subtotal       decimal(12,2) not null,
  tax_rate       decimal(5,2)  not null default 0,
  tax_amount     decimal(12,2) not null default 0.00,
  total_amount   decimal(12,2) not null,
  status         varchar(15)   not null default 'sent'
                 check (status in ('draft', 'sent', 'approved', 'paid')),
  issue_date     date not null,
  due_date       date,
  notes          text,
  pdf_url        text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Table 3.5: invoice_line_items
-- ---------------------------------------------------------------------
create table if not exists public.invoice_line_items (
  id          uuid primary key default uuid_generate_v4(),
  invoice_id  uuid not null references public.invoices (id) on delete cascade,
  description varchar(300)  not null,
  quantity    decimal(10,2) not null default 1,
  unit_price  decimal(12,2) not null,
  total_price decimal(12,2) not null
);

-- ---------------------------------------------------------------------
-- Table 3.7: system_metrics (Upstash cache reference log)
-- ---------------------------------------------------------------------
create table if not exists public.system_metrics (
  id                uuid primary key default uuid_generate_v4(),
  recorded_at       timestamptz  not null default now(),
  api_request_count integer      not null default 0,
  avg_latency_ms    decimal(8,2) not null default 0.00,
  recorded_by       uuid references public.users (id) on delete set null
);

create index if not exists projects_freelancer_idx   on public.projects (freelancer_id);
create index if not exists quotations_freelancer_idx on public.quotations (freelancer_id);
create index if not exists invoices_freelancer_idx   on public.invoices (freelancer_id);
create index if not exists line_items_invoice_idx    on public.invoice_line_items (invoice_id);

-- =====================================================================
-- Helper functions & triggers
-- =====================================================================

-- Is the current user an admin? (security definer avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- New Supabase Auth account -> profile row + role claim in app_metadata.
-- Everyone signs up as 'freelancer'; admins are promoted manually (see README).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    'freelancer'
  )
  on conflict (id) do nothing;

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                             || jsonb_build_object('role', 'freelancer', 'is_active', true)
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change role / is_active (stops users promoting themselves).
create or replace function public.protect_user_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only administrators can change role or account status';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_user_columns on public.users;
create trigger protect_user_columns
  before update on public.users
  for each row execute function public.protect_user_columns();

-- Keep the JWT role / is_active claims (auth.users.app_metadata) in sync.
create or replace function public.sync_user_claims()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                             || jsonb_build_object('role', new.role, 'is_active', new.is_active)
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_user_claims on public.users;
create trigger sync_user_claims
  after update of role, is_active on public.users
  for each row execute function public.sync_user_claims();

-- =====================================================================
-- Row-Level Security
-- =====================================================================
alter table public.users              enable row level security;
alter table public.projects           enable row level security;
alter table public.quotations         enable row level security;
alter table public.invoices           enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.system_metrics     enable row level security;

-- users
drop policy if exists "users: read own or admin"   on public.users;
drop policy if exists "users: update own or admin" on public.users;
create policy "users: read own or admin" on public.users
  for select using (id = auth.uid() or public.is_admin());
create policy "users: update own or admin" on public.users
  for update using (id = auth.uid() or public.is_admin());

-- projects
drop policy if exists "projects: owner full access" on public.projects;
drop policy if exists "projects: admin read"        on public.projects;
create policy "projects: owner full access" on public.projects
  for all using (freelancer_id = auth.uid()) with check (freelancer_id = auth.uid());
create policy "projects: admin read" on public.projects
  for select using (public.is_admin());

-- quotations
drop policy if exists "quotations: owner full access" on public.quotations;
drop policy if exists "quotations: admin read"        on public.quotations;
create policy "quotations: owner full access" on public.quotations
  for all using (freelancer_id = auth.uid()) with check (freelancer_id = auth.uid());
create policy "quotations: admin read" on public.quotations
  for select using (public.is_admin());

-- invoices
drop policy if exists "invoices: owner full access" on public.invoices;
drop policy if exists "invoices: admin read"        on public.invoices;
create policy "invoices: owner full access" on public.invoices
  for all using (freelancer_id = auth.uid()) with check (freelancer_id = auth.uid());
create policy "invoices: admin read" on public.invoices
  for select using (public.is_admin());

-- invoice_line_items (access follows the parent invoice)
drop policy if exists "line items: via own invoice" on public.invoice_line_items;
create policy "line items: via own invoice" on public.invoice_line_items
  for all
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.freelancer_id = auth.uid()))
  with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.freelancer_id = auth.uid()));

-- system_metrics (admins only)
drop policy if exists "metrics: admin only" on public.system_metrics;
create policy "metrics: admin only" on public.system_metrics
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Storage bucket for saved invoice PDFs (private; path = <user id>/<invoice id>.pdf)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

drop policy if exists "invoice pdfs: owner read"   on storage.objects;
drop policy if exists "invoice pdfs: owner write"  on storage.objects;
drop policy if exists "invoice pdfs: owner update" on storage.objects;
create policy "invoice pdfs: owner read" on storage.objects
  for select using (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "invoice pdfs: owner write" on storage.objects
  for insert with check (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "invoice pdfs: owner update" on storage.objects
  for update using (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);
