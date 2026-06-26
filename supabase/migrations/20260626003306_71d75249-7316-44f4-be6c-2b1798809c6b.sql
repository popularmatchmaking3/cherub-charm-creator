
-- Clean up any leftover storage policies from prior test
drop policy if exists "Users can view photos of any profile" on storage.objects;
drop policy if exists "Users can upload to their own folder" on storage.objects;
drop policy if exists "Users can update their own photos" on storage.objects;
drop policy if exists "Users can delete their own photos" on storage.objects;
drop policy if exists "Authenticated read call sounds" on storage.objects;
drop policy if exists "Admins upload call sounds" on storage.objects;
drop policy if exists "Admins update call sounds" on storage.objects;
drop policy if exists "Admins delete call sounds" on storage.objects;
drop policy if exists "verif_user_insert" on storage.objects;
drop policy if exists "verif_user_select" on storage.objects;
drop policy if exists "verif_user_update" on storage.objects;
drop policy if exists "verif_user_delete" on storage.objects;

-- Enums
create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.disability_category as enum (
  'visually_impaired','hearing_impaired','speech_impaired','locomotor','intellectual','multiple','other'
);
create type public.gender as enum ('male', 'female', 'other');
create type public.marital_status as enum ('never_married', 'divorced', 'widowed');

-- user_roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  permissions text[] default null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- app_private schema with helpers
create schema if not exists app_private;
grant usage on schema app_private to authenticated, service_role;

create or replace function app_private.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
grant execute on function app_private.has_role(uuid, public.app_role) to authenticated, service_role;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  gender public.gender,
  date_of_birth date,
  disability_category public.disability_category,
  disability_percentage int check (disability_percentage between 0 and 100),
  religion text,
  mother_tongue text,
  marital_status public.marital_status,
  education text,
  occupation text,
  country text,
  state text,
  city text,
  pin_code text,
  about text,
  partner_preferences text,
  avatar_url text,
  is_verified boolean not null default false,
  is_profile_complete boolean not null default false,
  membership_tier text not null default 'free',
  membership_expires_at timestamptz,
  is_hidden boolean not null default false,
  banned_until timestamptz,
  is_banned_permanent boolean not null default false,
  ban_reason text,
  block_disabled boolean not null default false,
  report_disabled boolean not null default false,
  created_for text,
  guardian_name text,
  guardian_relation text,
  guardian_phone text,
  guardian_email text,
  interests text[] default '{}'::text[],
  habits jsonb default '{}'::jsonb,
  family_details text,
  annual_income text,
  partner_min_age integer,
  partner_max_age integer,
  partner_about text,
  accept_audio_calls boolean not null default true,
  accept_video_calls boolean not null default true,
  id_verification_status text not null default 'none' check (id_verification_status in ('none','pending','verified','rejected')),
  id_verification_url text,
  id_verification_submitted_at timestamptz,
  id_verification_note text,
  disability_verification_status text not null default 'none' check (disability_verification_status in ('none','pending','verified','rejected')),
  disability_verification_url text,
  disability_verification_submitted_at timestamptz,
  disability_verification_note text,
  disability_verified boolean not null default false,
  photos_private boolean not null default false,
  last_seen_at timestamptz,
  show_online_status boolean not null default true,
  preferred_language text not null default 'en',
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  review_decided_at timestamptz,
  review_decided_by uuid,
  review_notes text,
  onboarding_step integer not null default 0,
  onboarding_draft jsonb not null default '{}'::jsonb,
  daily_message_limit_override integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
create index idx_profiles_last_seen on public.profiles(last_seen_at desc);
alter table public.profiles enable row level security;

-- helpers depending on profiles
create or replace function public.is_approved(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = _user_id and review_status = 'approved'); $$;
revoke all on function public.is_approved(uuid) from public, anon;
grant execute on function public.is_approved(uuid) to authenticated, service_role;

-- user_roles policies
create policy "Users can view their own roles" on public.user_roles for select to authenticated
  using (auth.uid() = user_id or app_private.has_role(auth.uid(), 'admin'));
create policy "Only admins can insert roles" on public.user_roles for insert to authenticated
  with check (app_private.has_role(auth.uid(), 'admin'));
create policy "Only admins can update roles" on public.user_roles for update to authenticated
  using (app_private.has_role(auth.uid(), 'admin'));
create policy "Only admins can delete roles" on public.user_roles for delete to authenticated
  using (app_private.has_role(auth.uid(), 'admin'));

-- profiles policies
create policy "profiles_select_visible" on public.profiles for select to authenticated
using (
  id = auth.uid()
  or app_private.has_role(auth.uid(), 'admin'::public.app_role)
  or (public.is_approved(auth.uid()) and review_status = 'approved' and is_hidden = false)
);
create policy "Users can insert their own profile" on public.profiles for insert to authenticated
  with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated
  using (auth.uid() = id);
create policy "Users can delete their own profile" on public.profiles for delete to authenticated
  using (auth.uid() = id);
create policy "Admins can update any profile" on public.profiles for update to authenticated
  using (app_private.has_role(auth.uid(), 'admin'));

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- handle_new_user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, review_status)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'pending');
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- admin hide trigger
create or replace function public.handle_admin_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT' and new.role = 'admin') then
    update public.profiles set is_hidden = true where id = new.user_id;
  elsif (tg_op = 'DELETE' and old.role = 'admin') then
    if not exists (select 1 from public.user_roles where user_id = old.user_id and role = 'admin') then
      update public.profiles set is_hidden = false where id = old.user_id;
    end if;
  end if;
  return coalesce(new, old);
end; $$;
revoke execute on function public.handle_admin_role_change() from public, anon, authenticated;
create trigger user_roles_admin_hide after insert on public.user_roles
  for each row execute function public.handle_admin_role_change();
create trigger user_roles_admin_unhide after delete on public.user_roles
  for each row execute function public.handle_admin_role_change();

-- admin helpers
create or replace function public.any_admin_exists() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'admin');
$$;
grant execute on function public.any_admin_exists() to anon, authenticated;

create or replace function public.admin_has_permission(_user_id uuid, _perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles
    where user_id = _user_id and role = 'admin'
      and (permissions is null or array_length(permissions, 1) is null or _perm = any(permissions)));
$$;
grant execute on function public.admin_has_permission(uuid, text) to authenticated;

-- Storage policies
create policy "Users can view photos of any profile" on storage.objects for select to authenticated
  using (bucket_id = 'profile-photos');
create policy "Users can upload to their own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update their own photos" on storage.objects for update to authenticated
  using (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete their own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Authenticated read call sounds" on storage.objects for select to authenticated
  using (bucket_id = 'call-sounds');
create policy "Admins upload call sounds" on storage.objects for insert to authenticated
  with check (bucket_id = 'call-sounds' and app_private.has_role(auth.uid(), 'admin'::app_role));
create policy "Admins update call sounds" on storage.objects for update to authenticated
  using (bucket_id = 'call-sounds' and app_private.has_role(auth.uid(), 'admin'::app_role));
create policy "Admins delete call sounds" on storage.objects for delete to authenticated
  using (bucket_id = 'call-sounds' and app_private.has_role(auth.uid(), 'admin'::app_role));

create policy "verif_user_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "verif_user_select" on storage.objects for select to authenticated
  using (bucket_id = 'verification-docs'
         and ((storage.foldername(name))[1] = auth.uid()::text
              or app_private.has_role(auth.uid(), 'admin'::public.app_role)));
create policy "verif_user_update" on storage.objects for update to authenticated
  using (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "verif_user_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Interests
create type public.interest_status as enum ('pending', 'accepted', 'declined');
create table public.interests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status public.interest_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);
grant select, insert, update, delete on public.interests to authenticated;
grant all on public.interests to service_role;
create index idx_interests_receiver on public.interests(receiver_id);
create index idx_interests_sender on public.interests(sender_id);
alter table public.interests enable row level security;

create policy "Users see their own interests" on public.interests for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id or app_private.has_role(auth.uid(), 'admin'));
create policy "Users send interest as themselves" on public.interests for insert to authenticated
  with check (auth.uid() = sender_id and public.is_approved(auth.uid()));
create policy "Receiver updates status, sender can cancel" on public.interests for update to authenticated
  using (auth.uid() = receiver_id or auth.uid() = sender_id);
create policy "Sender can delete (cancel)" on public.interests for delete to authenticated
  using (auth.uid() = sender_id);
create trigger interests_updated_at before update on public.interests
  for each row execute function public.set_updated_at();

create or replace function app_private.are_matched(_a uuid, _b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.interests where status = 'accepted'
    and ((sender_id = _a and receiver_id = _b) or (sender_id = _b and receiver_id = _a)));
$$;
grant execute on function app_private.are_matched(uuid, uuid) to authenticated, service_role;

-- conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references auth.users(id) on delete cascade,
  user2_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (user1_id < user2_id),
  unique (user1_id, user2_id)
);
grant select, insert, update, delete on public.conversations to authenticated;
grant all on public.conversations to service_role;
create index idx_conv_user1 on public.conversations(user1_id);
create index idx_conv_user2 on public.conversations(user2_id);
alter table public.conversations enable row level security;
create policy "Participants view conversations" on public.conversations for select to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id or app_private.has_role(auth.uid(), 'admin'));
create policy "Matched users can create conversation" on public.conversations for insert to authenticated
  with check ((auth.uid() = user1_id or auth.uid() = user2_id) and app_private.are_matched(user1_id, user2_id));

-- messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);
grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
create index idx_messages_conv on public.messages(conversation_id, created_at);
alter table public.messages enable row level security;
create policy "Participants read messages" on public.messages for select to authenticated
  using (exists (select 1 from public.conversations c where c.id = messages.conversation_id
            and (auth.uid() = c.user1_id or auth.uid() = c.user2_id))
    or app_private.has_role(auth.uid(), 'admin'));
create policy "Participants send messages" on public.messages for insert to authenticated
with check (
  auth.uid() = sender_id and public.is_approved(auth.uid())
  and exists (select 1 from public.conversations c where c.id = messages.conversation_id
    and (auth.uid() = c.user1_id or auth.uid() = c.user2_id))
);

create or replace function public.bump_conversation_last_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin update public.conversations set last_message_at = new.created_at where id = new.conversation_id; return new; end $$;
revoke execute on function public.bump_conversation_last_message() from public, anon, authenticated;
create trigger messages_bump_conv after insert on public.messages
  for each row execute function public.bump_conversation_last_message();

-- calls
create type public.call_type as enum ('audio', 'video');
create type public.call_status as enum ('ringing','accepted','declined','ended','missed');
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null,
  callee_id uuid not null,
  type call_type not null,
  status call_status not null default 'ringing',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  ended_at timestamptz
);
grant select, insert, update on public.calls to authenticated;
grant all on public.calls to service_role;
create index calls_callee_idx on public.calls(callee_id, created_at desc);
create index calls_caller_idx on public.calls(caller_id, created_at desc);
alter table public.calls enable row level security;
create policy "Participants view calls" on public.calls for select to authenticated
  using (auth.uid() = caller_id or auth.uid() = callee_id);
create policy "Participants update call" on public.calls for update to authenticated
  using (auth.uid() = caller_id or auth.uid() = callee_id);
create policy "Matched users start calls" on public.calls for insert to authenticated
  with check (auth.uid() = caller_id and app_private.are_matched(caller_id, callee_id));
alter table public.calls replica identity full;

-- app_settings
create type public.membership_tier as enum ('free', 'premium');
create type public.membership_request_status as enum ('pending', 'approved', 'rejected');

create table public.app_settings (
  id int primary key default 1,
  maintenance_mode boolean not null default false,
  calls_enabled boolean not null default true,
  payments_enabled boolean not null default false,
  signups_enabled boolean not null default true,
  maintenance_message text not null default 'Hum kuch behtar laa rahe hain. Thodi der mein wapas aayein.',
  ring_sound text not null default 'classic',
  connect_sound text not null default 'beep',
  outgoing_ring_url text,
  incoming_ring_url text,
  connect_url text,
  disconnect_url text,
  review_pending_message text not null default 'Aapka account abhi review mein hai. Hamari team aapki profile verify kar rahi hai.',
  review_rejected_message text not null default 'Hume khed hai — aapka account abhi approve nahi kiya gaya.',
  review_approved_welcome text not null default 'Aapka account approve ho gaya hai.',
  daily_message_limit_free integer not null default 20,
  daily_message_limit_premium integer not null default 200,
  membership_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint single_row check (id = 1)
);
grant select on public.app_settings to anon, authenticated;
grant update on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
insert into public.app_settings (id) values (1);
alter table public.app_settings enable row level security;
create policy "Anyone can read app settings" on public.app_settings for select to authenticated, anon using (true);
create policy "Only admins can update app settings" on public.app_settings for update to authenticated
  using (app_private.has_role(auth.uid(), 'admin'::app_role))
  with check (app_private.has_role(auth.uid(), 'admin'::app_role));
create trigger app_settings_set_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

-- membership requests
create table public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  requested_tier public.membership_tier not null default 'premium',
  note text,
  status public.membership_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_by uuid,
  reviewed_at timestamptz
);
grant select, insert, update on public.membership_requests to authenticated;
grant all on public.membership_requests to service_role;
create index membership_requests_user_idx on public.membership_requests(user_id);
create index membership_requests_status_idx on public.membership_requests(status);
alter table public.membership_requests enable row level security;
create policy "Users view own requests, admins view all" on public.membership_requests for select to authenticated
  using (auth.uid() = user_id or app_private.has_role(auth.uid(), 'admin'::app_role));
create policy "Users create own requests" on public.membership_requests for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Admins update requests" on public.membership_requests for update to authenticated
  using (app_private.has_role(auth.uid(), 'admin'::app_role))
  with check (app_private.has_role(auth.uid(), 'admin'::app_role));

-- notifications
create type public.notification_audience as enum ('all', 'user');
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience notification_audience not null default 'all',
  target_user_id uuid,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;

create table public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);
grant select, insert on public.notification_reads to authenticated;
grant all on public.notification_reads to service_role;

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;
create policy "Users read notifications meant for them" on public.notifications for select to authenticated
using (audience = 'all' or (audience = 'user' and target_user_id = auth.uid())
  or app_private.has_role(auth.uid(), 'admin'::app_role));
create policy "Only admins create notifications" on public.notifications for insert to authenticated
  with check (app_private.has_role(auth.uid(), 'admin'::app_role));
create policy "Only admins delete notifications" on public.notifications for delete to authenticated
  using (app_private.has_role(auth.uid(), 'admin'::app_role));
create policy "Users view own reads" on public.notification_reads for select to authenticated using (auth.uid() = user_id);
create policy "Users mark own reads" on public.notification_reads for insert to authenticated with check (auth.uid() = user_id);

-- user_blocks
create table public.user_blocks (
  id uuid not null default gen_random_uuid() primary key,
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);
grant select, insert, delete on public.user_blocks to authenticated;
grant all on public.user_blocks to service_role;
alter table public.user_blocks enable row level security;
create policy "Users manage their own blocks" on public.user_blocks for all to authenticated
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- user_reports
create table public.user_reports (
  id uuid not null default gen_random_uuid() primary key,
  reporter_id uuid not null,
  reported_id uuid not null,
  reason text not null,
  context text,
  category text,
  evidence text,
  created_at timestamptz not null default now()
);
grant select, insert on public.user_reports to authenticated;
grant all on public.user_reports to service_role;
alter table public.user_reports enable row level security;
create policy "Users insert own reports" on public.user_reports for insert to authenticated
  with check (auth.uid() = reporter_id);
create policy "Users view own reports" on public.user_reports for select to authenticated
  using (auth.uid() = reporter_id);

-- user_ip_log
create table public.user_ip_log (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  ip text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create unique index user_ip_log_user_ip_uidx on public.user_ip_log (user_id, ip);
grant select, insert on public.user_ip_log to authenticated;
grant all on public.user_ip_log to service_role;
alter table public.user_ip_log enable row level security;
create policy "Users insert own ip log" on public.user_ip_log for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users view own ip log" on public.user_ip_log for select to authenticated
  using (auth.uid() = user_id);

-- banned_ips
create table public.banned_ips (
  ip text not null primary key,
  reason text,
  banned_user_id uuid,
  created_at timestamptz not null default now()
);
grant select on public.banned_ips to authenticated;
grant all on public.banned_ips to service_role;
alter table public.banned_ips enable row level security;

-- login_history
create table public.login_history (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ip text,
  user_agent text,
  device_label text,
  country text,
  city text,
  is_suspicious boolean not null default false,
  suspicious_reason text,
  session_ref text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  is_trusted boolean not null default false,
  device_fingerprint text
);
grant select on public.login_history to authenticated;
grant all on public.login_history to service_role;
alter table public.login_history enable row level security;
create policy "Users can view their own login history" on public.login_history
  for select to authenticated using (auth.uid() = user_id);
create index login_history_user_created_idx on public.login_history(user_id, created_at desc);

-- photo_access_requests
create table public.photo_access_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> owner_id),
  unique (requester_id, owner_id)
);
grant select, insert, update, delete on public.photo_access_requests to authenticated;
grant all on public.photo_access_requests to service_role;
alter table public.photo_access_requests enable row level security;
create policy "par_select_own" on public.photo_access_requests for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = owner_id
         or app_private.has_role(auth.uid(), 'admin'::public.app_role));
create policy "par_requester_insert" on public.photo_access_requests for insert to authenticated
  with check (auth.uid() = requester_id);
create policy "par_owner_update" on public.photo_access_requests for update to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "par_requester_delete" on public.photo_access_requests for delete to authenticated
  using (auth.uid() = requester_id);
create trigger set_updated_at_photo_access_requests before update on public.photo_access_requests
  for each row execute function public.set_updated_at();

-- support tickets
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  category text not null default 'general',
  status text not null default 'open',
  priority text not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;
alter table public.support_tickets enable row level security;
create policy "tickets_select" on public.support_tickets for select to authenticated
  using (auth.uid() = user_id or exists (select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role='admin'));
create policy "tickets_insert" on public.support_tickets for insert to authenticated
  with check (auth.uid() = user_id);
create policy "tickets_update" on public.support_tickets for update to authenticated
  using (auth.uid() = user_id or exists (select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role='admin'))
  with check (auth.uid() = user_id or exists (select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role='admin'));
create trigger trg_support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  is_admin_reply boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert on public.ticket_messages to authenticated;
grant all on public.ticket_messages to service_role;
alter table public.ticket_messages enable row level security;
create policy "ticket_msgs_select" on public.ticket_messages for select to authenticated
  using (exists (select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role='admin')
    or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()));
create policy "ticket_msgs_insert" on public.ticket_messages for insert to authenticated
  with check (sender_id = auth.uid() and (
      exists (select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role='admin')
      or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())));
create index idx_tickets_user on public.support_tickets(user_id, created_at desc);
create index idx_tickets_status on public.support_tickets(status, created_at desc);
create index idx_ticket_msgs_ticket on public.ticket_messages(ticket_id, created_at);

-- touch_last_seen
create or replace function public.touch_last_seen() returns void
language sql security definer set search_path = public as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;
grant execute on function public.touch_last_seen() to authenticated;

-- success_stories
create table public.success_stories (
  id uuid not null default gen_random_uuid() primary key,
  couple_names text not null,
  story text not null,
  image_url text,
  married_on date,
  is_published boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.success_stories to anon, authenticated;
grant all on public.success_stories to service_role;
alter table public.success_stories enable row level security;
create policy "stories_public_read" on public.success_stories for select using (is_published = true);
create policy "stories_admin_all" on public.success_stories for all to authenticated
  using (public.admin_has_permission(auth.uid(), 'stories'))
  with check (public.admin_has_permission(auth.uid(), 'stories'));

create or replace function public.update_updated_at_column() returns trigger as $$
begin new.updated_at = now(); return new; end; $$
language plpgsql set search_path = public;
create trigger update_success_stories_updated_at before update on public.success_stories
  for each row execute function public.update_updated_at_column();

-- appeals
create table public.appeals (
  id uuid not null default gen_random_uuid() primary key,
  full_name text not null,
  email text not null,
  phone text,
  reason text,
  details text not null,
  status text not null default 'pending',
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);
grant insert on public.appeals to anon, authenticated;
grant select, update on public.appeals to authenticated;
grant all on public.appeals to service_role;
alter table public.appeals enable row level security;
create policy "Anyone can submit an appeal" on public.appeals for insert to anon, authenticated with check (true);
create policy "Admins can view appeals" on public.appeals for select to authenticated
  using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'::public.app_role));
create policy "Admins can update appeals" on public.appeals for update to authenticated
  using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'::public.app_role))
  with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'::public.app_role));

-- feature_suggestions
create table public.feature_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.feature_suggestions to authenticated;
grant insert on public.feature_suggestions to anon;
grant all on public.feature_suggestions to service_role;
alter table public.feature_suggestions enable row level security;
create policy "Anyone can submit suggestions" on public.feature_suggestions for insert to anon, authenticated
  with check (length(name) between 1 and 100 and length(message) between 3 and 2000);
create policy "Admins can read suggestions" on public.feature_suggestions for select to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));
create policy "Admins can delete suggestions" on public.feature_suggestions for delete to authenticated
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));

-- realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.interests;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.calls;
alter publication supabase_realtime add table public.app_settings;
alter publication supabase_realtime add table public.notifications;
