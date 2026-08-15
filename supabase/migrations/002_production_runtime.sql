-- CampusResolve production runtime (forward migration; do not edit 001 destructively)
-- Run after 001_initial.sql

alter table public.profiles
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.complaint_events
  add column if not exists actor_role text;

alter table public.attachments
  add column if not exists mime_type text;

create table if not exists public.escalations (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  reason text not null,
  recipient_role public.user_role not null default 'admin',
  status_at_escalation public.complaint_status not null,
  deadline_exceeded timestamptz,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_email text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create sequence if not exists public.ticket_seq start 1;

create or replace function public.next_ticket_id()
returns text
language plpgsql
as $$
declare
  n bigint;
  y int := extract(year from (now() at time zone 'utc'))::int;
begin
  n := nextval('public.ticket_seq');
  return 'CR-' || y::text || '-' || lpad(n::text, 4, '0');
end;
$$;

create index if not exists idx_complaints_student on public.complaints(student_id);
create index if not exists idx_complaints_worker on public.complaints(assigned_worker_id);
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_category on public.complaints(category);
create index if not exists idx_complaints_urgency on public.complaints(urgency);
create index if not exists idx_complaints_escalated on public.complaints(is_escalated);
create index if not exists idx_complaints_response_deadline on public.complaints(response_deadline);
create index if not exists idx_complaints_resolution_deadline on public.complaints(resolution_deadline);
create index if not exists idx_complaints_created on public.complaints(created_at desc);
create index if not exists idx_events_complaint on public.complaint_events(complaint_id, created_at);
create index if not exists idx_attachments_complaint on public.attachments(complaint_id);
create index if not exists idx_escalations_complaint on public.escalations(complaint_id, created_at desc);

-- Always create student profiles (ignore client-supplied role)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, hostel_block)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'student',
    nullif(new.raw_user_meta_data->>'hostel_block', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active = true
$$;

create or replace function public.assert_transition(
  p_from public.complaint_status,
  p_to public.complaint_status,
  p_role public.user_role
)
returns void
language plpgsql
as $$
begin
  if p_from = p_to and p_to = 'assigned' and p_role in ('warden', 'admin') then
    return;
  end if;
  if p_from = 'submitted' and p_to = 'under_review' and p_role in ('warden', 'admin') then return; end if;
  if p_from = 'submitted' and p_to = 'assigned' and p_role = 'admin' then return; end if;
  if p_from = 'under_review' and p_to = 'assigned' and p_role in ('warden', 'admin') then return; end if;
  if p_from = 'assigned' and p_to = 'in_progress' and p_role = 'worker' then return; end if;
  if p_from = 'assigned' and p_to = 'assigned' and p_role in ('warden', 'admin') then return; end if;
  if p_from = 'in_progress' and p_to = 'resolved' and p_role = 'worker' then return; end if;
  if p_from = 'in_progress' and p_to = 'assigned' and p_role in ('warden', 'admin') then return; end if;
  if p_from = 'resolved' and p_to = 'closed' and p_role in ('student', 'warden', 'admin') then return; end if;
  if p_from = 'resolved' and p_to = 'under_review' and p_role in ('student', 'warden', 'admin') then return; end if;
  raise exception 'Invalid status transition: % → % for role %', p_from, p_to, p_role;
end;
$$;

create or replace function public.log_complaint_event(
  p_complaint_id uuid,
  p_actor_id uuid,
  p_actor_role text,
  p_from public.complaint_status,
  p_to public.complaint_status,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.complaint_events (complaint_id, actor_id, actor_role, from_status, to_status, note)
  values (p_complaint_id, p_actor_id, p_actor_role, p_from, p_to, left(coalesce(p_note, ''), 1000));
end;
$$;

create or replace function public.record_escalation(
  p_complaint_id uuid,
  p_reason text,
  p_status public.complaint_status,
  p_deadline timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.escalations (complaint_id, reason, recipient_role, status_at_escalation, deadline_exceeded)
  values (p_complaint_id, p_reason, 'admin', p_status, p_deadline);
  update public.complaints
    set is_escalated = true,
        escalation_reason = p_reason,
        updated_at = now()
  where id = p_complaint_id;
end;
$$;

create or replace function public.create_complaint(
  p_category text,
  p_hostel_location text,
  p_description text,
  p_urgency public.urgency_level
)
returns public.complaints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
  v_row public.complaints;
  v_emergency boolean;
  v_priority int;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  select role into v_role from public.profiles where id = v_uid and active;
  if v_role is distinct from 'student' then raise exception 'Only students can create complaints'; end if;

  v_priority := case p_urgency
    when 'emergency' then 1 when 'high' then 2 when 'medium' then 3 else 4 end;
  v_emergency := (p_urgency = 'emergency' or p_category = 'safety');

  insert into public.complaints (
    ticket_id, student_id, category, hostel_location, description, urgency, status, priority,
    is_escalated, escalation_reason
  ) values (
    public.next_ticket_id(), v_uid, p_category, left(p_hostel_location, 200), left(p_description, 4000),
    p_urgency, 'submitted', v_priority, v_emergency,
    case when v_emergency then 'Emergency / safety priority flag' else null end
  )
  returning * into v_row;

  perform public.log_complaint_event(v_row.id, v_uid, 'student', null, 'submitted', 'Complaint registered');
  if v_emergency then
    perform public.record_escalation(v_row.id, 'Emergency / safety priority flag', 'submitted');
  end if;
  return v_row;
end;
$$;

create or replace function public.review_complaint(p_complaint_id uuid, p_note text default null)
returns public.complaints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role := public.current_role();
  v_row public.complaints;
  v_from public.complaint_status;
begin
  if v_role not in ('warden', 'admin') then raise exception 'Forbidden'; end if;
  select * into v_row from public.complaints where id = p_complaint_id for update;
  if not found then raise exception 'Complaint not found'; end if;
  v_from := v_row.status;
  perform public.assert_transition(v_from, 'under_review', v_role);
  update public.complaints set status = 'under_review', updated_at = now()
  where id = p_complaint_id returning * into v_row;
  perform public.log_complaint_event(
    p_complaint_id, v_uid, v_role::text, v_from, 'under_review',
    coalesce(nullif(p_note, ''), 'Reviewed by warden')
  );
  return v_row;
end;
$$;

create or replace function public.assign_complaint(
  p_complaint_id uuid,
  p_worker_id uuid,
  p_urgency public.urgency_level default null,
  p_response_deadline timestamptz default null,
  p_resolution_deadline timestamptz default null
)
returns public.complaints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role := public.current_role();
  v_row public.complaints;
  v_from public.complaint_status;
  v_urgency public.urgency_level;
  v_worker_name text;
  v_priority int;
begin
  if v_role not in ('warden', 'admin') then raise exception 'Forbidden'; end if;
  select * into v_row from public.complaints where id = p_complaint_id for update;
  if not found then raise exception 'Complaint not found'; end if;
  v_from := v_row.status;
  perform public.assert_transition(v_from, 'assigned', v_role);

  select full_name into v_worker_name from public.profiles
  where id = p_worker_id and role = 'worker' and active;
  if v_worker_name is null then raise exception 'Worker not found'; end if;

  v_urgency := coalesce(p_urgency, v_row.urgency);
  v_priority := case v_urgency
    when 'emergency' then 1 when 'high' then 2 when 'medium' then 3 else 4 end;

  update public.complaints set
    status = 'assigned',
    assigned_worker_id = p_worker_id,
    urgency = v_urgency,
    priority = v_priority,
    response_deadline = p_response_deadline,
    resolution_deadline = p_resolution_deadline,
    updated_at = now()
  where id = p_complaint_id
  returning * into v_row;

  perform public.log_complaint_event(
    p_complaint_id, v_uid, v_role::text, v_from, 'assigned',
    'Assigned to ' || v_worker_name
  );
  return v_row;
end;
$$;

create or replace function public.accept_task(p_complaint_id uuid)
returns public.complaints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role := public.current_role();
  v_row public.complaints;
begin
  if v_role is distinct from 'worker' then raise exception 'Forbidden'; end if;
  select * into v_row from public.complaints where id = p_complaint_id for update;
  if not found then raise exception 'Complaint not found'; end if;
  if v_row.assigned_worker_id is distinct from v_uid then raise exception 'Not your assignment'; end if;
  perform public.assert_transition(v_row.status, 'in_progress', 'worker');
  update public.complaints set status = 'in_progress', updated_at = now()
  where id = p_complaint_id returning * into v_row;
  perform public.log_complaint_event(
    p_complaint_id, v_uid, 'worker', 'assigned', 'in_progress',
    'Worker accepted and started work'
  );
  return v_row;
end;
$$;

create or replace function public.resolve_complaint(p_complaint_id uuid, p_notes text)
returns public.complaints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role := public.current_role();
  v_row public.complaints;
  v_notes text := left(trim(coalesce(p_notes, '')), 2000);
begin
  if v_role is distinct from 'worker' then raise exception 'Forbidden'; end if;
  if v_notes = '' then raise exception 'Resolution notes are required'; end if;
  select * into v_row from public.complaints where id = p_complaint_id for update;
  if not found then raise exception 'Complaint not found'; end if;
  if v_row.assigned_worker_id is distinct from v_uid then raise exception 'Not your assignment'; end if;
  perform public.assert_transition(v_row.status, 'resolved', 'worker');
  update public.complaints set
    status = 'resolved',
    resolution_notes = v_notes,
    updated_at = now()
  where id = p_complaint_id returning * into v_row;
  perform public.log_complaint_event(
    p_complaint_id, v_uid, 'worker', 'in_progress', 'resolved', 'Work completed by worker'
  );
  return v_row;
end;
$$;

create or replace function public.verify_complaint(
  p_complaint_id uuid,
  p_accepted boolean,
  p_comment text default null
)
returns public.complaints
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role := public.current_role();
  v_row public.complaints;
  v_from public.complaint_status;
  v_reason text := left(trim(coalesce(p_comment, '')), 1000);
begin
  select * into v_row from public.complaints where id = p_complaint_id for update;
  if not found then raise exception 'Complaint not found'; end if;
  if v_role = 'student' and v_row.student_id is distinct from v_uid then
    raise exception 'Forbidden';
  end if;
  if v_role not in ('student', 'warden', 'admin') then raise exception 'Forbidden'; end if;
  v_from := v_row.status;

  if p_accepted then
    perform public.assert_transition(v_from, 'closed', v_role);
    update public.complaints set
      status = 'closed', is_escalated = false, escalation_reason = null, updated_at = now()
    where id = p_complaint_id returning * into v_row;
    perform public.log_complaint_event(
      p_complaint_id, v_uid, v_role::text, v_from, 'closed',
      coalesce(nullif(v_reason, ''), 'Student accepted resolution')
    );
  else
    if v_reason = '' then raise exception 'Rejection reason is required'; end if;
    perform public.assert_transition(v_from, 'under_review', v_role);
    perform public.record_escalation(p_complaint_id, 'Student rejected: ' || v_reason, v_from);
    update public.complaints set status = 'under_review', updated_at = now()
    where id = p_complaint_id returning * into v_row;
    perform public.log_complaint_event(
      p_complaint_id, v_uid, v_role::text, v_from, 'under_review',
      'Rejected: ' || v_reason
    );
  end if;
  return v_row;
end;
$$;

create or replace function public.add_complaint_comment(p_complaint_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role := public.current_role();
  v_row public.complaints;
  v_note text := left(trim(coalesce(p_note, '')), 1000);
begin
  if v_uid is null or v_note = '' then raise exception 'Invalid comment'; end if;
  select * into v_row from public.complaints where id = p_complaint_id;
  if not found then raise exception 'Complaint not found'; end if;
  if not (
    v_row.student_id = v_uid
    or v_row.assigned_worker_id = v_uid
    or v_role in ('warden', 'admin')
  ) then raise exception 'Forbidden'; end if;
  perform public.log_complaint_event(p_complaint_id, v_uid, v_role::text, v_row.status, v_row.status, v_note);
end;
$$;

drop policy if exists "profiles read own or staff" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "students manage own complaints" on public.complaints;
drop policy if exists "students insert complaints" on public.complaints;
drop policy if exists "staff update complaints" on public.complaints;
drop policy if exists "events readable with complaint" on public.complaint_events;
drop policy if exists "events insert authenticated" on public.complaint_events;
drop policy if exists "attachments readable with complaint" on public.attachments;
drop policy if exists "attachments insert own" on public.attachments;

alter table public.escalations enable row level security;
alter table public.audit_log enable row level security;

create policy "profiles_select"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.current_role() in ('warden', 'admin')
    or (public.current_role() = 'worker' and role = 'worker')
  );

create policy "profiles_update_own_safe"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "complaints_select"
  on public.complaints for select to authenticated
  using (
    student_id = auth.uid()
    or assigned_worker_id = auth.uid()
    or public.current_role() in ('warden', 'admin')
  );

create policy "complaints_no_direct_insert"
  on public.complaints for insert to authenticated
  with check (false);

create policy "complaints_no_direct_update"
  on public.complaints for update to authenticated
  using (false);

create policy "events_select"
  on public.complaint_events for select to authenticated
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

create policy "events_no_direct_insert"
  on public.complaint_events for insert to authenticated
  with check (false);

create policy "attachments_select"
  on public.attachments for select to authenticated
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

create policy "attachments_insert_own"
  on public.attachments for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.complaints c
      where c.id = complaint_id
        and (
          (c.student_id = auth.uid() and kind = 'evidence')
          or (c.assigned_worker_id = auth.uid() and kind = 'completion')
          or public.current_role() in ('warden', 'admin')
        )
    )
  );

create policy "escalations_select_staff"
  on public.escalations for select to authenticated
  using (
    public.current_role() in ('warden', 'admin')
    or exists (
      select 1 from public.complaints c
      where c.id = complaint_id and c.student_id = auth.uid()
    )
  );

create policy "audit_select_admin"
  on public.audit_log for select to authenticated
  using (public.current_role() = 'admin');

insert into storage.buckets (id, name, public)
values ('complaint-evidence', 'complaint-evidence', false)
on conflict (id) do nothing;

drop policy if exists "complaint_evidence_select" on storage.objects;
drop policy if exists "complaint_evidence_insert" on storage.objects;
drop policy if exists "complaint_evidence_update" on storage.objects;
drop policy if exists "complaint_evidence_delete" on storage.objects;

create policy "complaint_evidence_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'complaint-evidence');

create policy "complaint_evidence_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'complaint-evidence'
    and auth.uid()::text = (storage.foldername(name))[3]
  );

create policy "complaint_evidence_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'complaint-evidence'
    and auth.uid()::text = (storage.foldername(name))[3]
  );

create policy "complaint_evidence_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'complaint-evidence'
    and (
      auth.uid()::text = (storage.foldername(name))[3]
      or public.current_role() = 'admin'
    )
  );

grant usage on sequence public.ticket_seq to authenticated, service_role;
grant execute on function public.next_ticket_id() to authenticated, service_role;
grant execute on function public.create_complaint(text, text, text, public.urgency_level) to authenticated;
grant execute on function public.review_complaint(uuid, text) to authenticated;
grant execute on function public.assign_complaint(uuid, uuid, public.urgency_level, timestamptz, timestamptz) to authenticated;
grant execute on function public.accept_task(uuid) to authenticated;
grant execute on function public.resolve_complaint(uuid, text) to authenticated;
grant execute on function public.verify_complaint(uuid, boolean, text) to authenticated;
grant execute on function public.add_complaint_comment(uuid, text) to authenticated;
