-- CampusResolve initial schema (run in Supabase SQL editor)
create extension if not exists "pgcrypto";

create type public.user_role as enum ('student', 'warden', 'worker', 'admin');
create type public.complaint_status as enum (
  'submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed'
);
create type public.urgency_level as enum ('low', 'medium', 'high', 'emergency');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role public.user_role not null default 'student',
  hostel_block text,
  created_at timestamptz not null default now()
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  ticket_id text unique not null,
  student_id uuid not null references public.profiles(id),
  category text not null,
  hostel_location text not null,
  description text not null,
  urgency public.urgency_level not null default 'medium',
  status public.complaint_status not null default 'submitted',
  priority int not null default 3,
  assigned_worker_id uuid references public.profiles(id),
  response_deadline timestamptz,
  resolution_deadline timestamptz,
  is_escalated boolean not null default false,
  escalation_reason text,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.complaint_events (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  from_status public.complaint_status,
  to_status public.complaint_status,
  note text not null,
  created_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  kind text not null check (kind in ('evidence', 'completion')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_events enable row level security;
alter table public.attachments enable row level security;

create or replace function public.current_role()
returns public.user_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "profiles read own or staff"
  on public.profiles for select
  using (
    id = auth.uid()
    or public.current_role() in ('warden', 'admin', 'worker')
  );

create policy "profiles update own"
  on public.profiles for update
  using (id = auth.uid());

create policy "students manage own complaints"
  on public.complaints for select
  using (
    student_id = auth.uid()
    or assigned_worker_id = auth.uid()
    or public.current_role() in ('warden', 'admin')
  );

create policy "students insert complaints"
  on public.complaints for insert
  with check (student_id = auth.uid());

create policy "staff update complaints"
  on public.complaints for update
  using (
    public.current_role() in ('warden', 'admin')
    or assigned_worker_id = auth.uid()
    or student_id = auth.uid()
  );

create policy "events readable with complaint"
  on public.complaint_events for select
  using (
    exists (
      select 1 from public.complaints c
      where c.id = complaint_id
        and (
          c.student_id = auth.uid()
          or c.assigned_worker_id = auth.uid()
          or public.current_role() in ('warden', 'admin')
        )
    )
  );

create policy "events insert authenticated"
  on public.complaint_events for insert
  with check (actor_id = auth.uid());

create policy "attachments readable with complaint"
  on public.attachments for select
  using (
    exists (
      select 1 from public.complaints c
      where c.id = complaint_id
        and (
          c.student_id = auth.uid()
          or c.assigned_worker_id = auth.uid()
          or public.current_role() in ('warden', 'admin')
        )
    )
  );

create policy "attachments insert own"
  on public.attachments for insert
  with check (uploaded_by = auth.uid());

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;
