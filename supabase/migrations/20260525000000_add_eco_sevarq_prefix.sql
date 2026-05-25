-- Add eco_sevarq_ prefix to all LMS tables.
-- Tables are renamed first; then functions are updated with CREATE OR REPLACE
-- so existing RLS policies that depend on app_private helpers are preserved.

-- Step 1: Rename all tables
alter table if exists public.profiles rename to eco_sevarq_profiles;
alter table if exists public.courses rename to eco_sevarq_courses;
alter table if exists public.modules rename to eco_sevarq_modules;
alter table if exists public.lessons rename to eco_sevarq_lessons;
alter table if exists public.lesson_progress rename to eco_sevarq_lesson_progress;
alter table if exists public.quizzes rename to eco_sevarq_quizzes;
alter table if exists public.quiz_questions rename to eco_sevarq_quiz_questions;
alter table if exists public.quiz_attempts rename to eco_sevarq_quiz_attempts;
alter table if exists public.certificates rename to eco_sevarq_certificates;
alter table if exists public.course_failures rename to eco_sevarq_course_failures;
alter table if exists public.user_progress rename to eco_sevarq_user_progress;
alter table if exists public.lesson_comments rename to eco_sevarq_lesson_comments;
alter table if exists public.gamification_points rename to eco_sevarq_gamification_points;
alter table if exists public.notifications rename to eco_sevarq_notifications;
alter table if exists public.admin_audit_logs rename to eco_sevarq_admin_audit_logs;

-- Step 2: Update app_private helper functions (bodies now reference renamed tables)
create or replace function app_private.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(to_jsonb(p)->>'role', to_jsonb(p)->>'nivel_acesso', 'colaborador')
  from public.eco_sevarq_profiles p
  where id = auth.uid()
$$;

create or replace function app_private.current_user_company()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(to_jsonb(p)->>'company', to_jsonb(p)->>'empresa', 'Seven')
  from public.eco_sevarq_profiles p
  where id = auth.uid()
$$;

create or replace function app_private.current_user_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(to_jsonb(p)->>'status', 'ativo')
  from public.eco_sevarq_profiles p
  where id = auth.uid()
$$;

-- Step 3: Update public functions

create or replace function public.resolve_login_email(input_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(p.email, au.email)
  from public.eco_sevarq_profiles p
  left join auth.users au on au.id = p.id
  where lower(trim(p.username)) = lower(trim(input_username))
    and coalesce(p.email, au.email) is not null
    and coalesce(p.status, 'ativo') = 'ativo'
  limit 1;
$$;

create or replace function public.is_valid_certificate_storage_object(object_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.eco_sevarq_certificates c
    where c.certificate_url = object_name
      and c.validation_code is not null
  );
$$;

create or replace function public.validate_certificate_code(input_code text)
returns table (
  certificate_id uuid,
  certificate_url text,
  validation_code text,
  issued_at timestamptz,
  completed_at timestamptz,
  workload_minutes integer,
  student_name text,
  course_title text,
  company text
)
language sql
security definer
set search_path = public
as $$
  select
    c.id as certificate_id,
    c.certificate_url,
    c.validation_code,
    c.issued_at,
    c.completed_at,
    c.workload_minutes,
    coalesce(nullif(p.full_name, ''), p.username) as student_name,
    co.title as course_title,
    co.company as company
  from public.eco_sevarq_certificates c
  join public.eco_sevarq_profiles p on p.id = c.user_id
  join public.eco_sevarq_courses co on co.id = c.course_id
  where c.validation_code = upper(trim(input_code))
    and c.validation_code is not null
  limit 1;
$$;

create or replace function public.complete_lesson_progress(input_lesson_id uuid, input_progress integer default 100)
returns public.eco_sevarq_lesson_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  next_progress integer := greatest(0, least(100, coalesce(input_progress, 100)));
  next_completed boolean := next_progress >= 100;
  saved_progress public.eco_sevarq_lesson_progress;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if app_private.current_user_status() <> 'ativo' then
    raise exception 'Inactive users cannot update lesson progress.';
  end if;

  if not exists (
    select 1
    from public.eco_sevarq_lessons l
    join public.eco_sevarq_modules m on m.id = l.module_id
    join public.eco_sevarq_courses c on c.id = m.course_id
    where l.id = input_lesson_id
      and l.is_active
      and c.is_active
      and c.company = app_private.current_user_company()
  ) then
    raise exception 'Lesson is not available for this user.';
  end if;

  insert into public.eco_sevarq_lesson_progress (
    user_id,
    lesson_id,
    progress,
    completed,
    completed_at,
    updated_at
  )
  values (
    auth.uid(),
    input_lesson_id,
    next_progress,
    next_completed,
    case when next_completed then now() else null end,
    now()
  )
  on conflict (user_id, lesson_id) do update
  set
    progress = excluded.progress,
    completed = excluded.completed,
    completed_at = case
      when excluded.completed then coalesce(public.eco_sevarq_lesson_progress.completed_at, excluded.completed_at)
      else null
    end,
    updated_at = now()
  returning * into saved_progress;

  return saved_progress;
end;
$$;

create or replace function public.submit_quiz_attempt(input_quiz_id uuid, input_answers jsonb)
returns table (
  id uuid,
  quiz_id uuid,
  module_id uuid,
  course_id uuid,
  user_id uuid,
  score integer,
  passed boolean,
  answers jsonb,
  attempt_number integer,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz_record record;
  question_record record;
  total_questions integer := 0;
  correct_questions integer := 0;
  expected_ids text[];
  received_ids text[];
  available_ids text[];
  next_score integer;
  next_passed boolean;
  next_attempt_number integer;
  saved_attempt public.eco_sevarq_quiz_attempts;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if app_private.current_user_status() <> 'ativo' then
    raise exception 'Inactive users cannot submit quizzes.';
  end if;

  select q.id, q.module_id, m.course_id, q.passing_score
  into quiz_record
  from public.eco_sevarq_quizzes q
  join public.eco_sevarq_modules m on m.id = q.module_id
  join public.eco_sevarq_courses c on c.id = m.course_id
  where q.id = input_quiz_id
    and q.is_active
    and c.is_active
    and c.company = app_private.current_user_company();

  if quiz_record.id is null then
    raise exception 'Quiz is not available for this user.';
  end if;

  for question_record in
    select qq.id, qq.options
    from public.eco_sevarq_quiz_questions qq
    where qq.quiz_id = input_quiz_id
    order by qq.order_index
  loop
    total_questions := total_questions + 1;

    select coalesce(array_agg(option_item->>'id' order by option_item->>'id'), array[]::text[])
    into expected_ids
    from jsonb_array_elements(question_record.options) option_item
    where (option_item->>'isCorrect')::boolean is true;

    select coalesce(array_agg(option_item->>'id'), array[]::text[])
    into available_ids
    from jsonb_array_elements(question_record.options) option_item;

    select coalesce(array_agg(answer_id order by answer_id), array[]::text[])
    into received_ids
    from jsonb_array_elements_text(coalesce(input_answers -> question_record.id::text, '[]'::jsonb)) answer_id;

    if array_length(received_ids, 1) is null then
      raise exception 'All quiz questions must be answered.';
    end if;

    if not received_ids <@ available_ids then
      raise exception 'Quiz answer contains an invalid option.';
    end if;

    if received_ids = expected_ids then
      correct_questions := correct_questions + 1;
    end if;
  end loop;

  if total_questions = 0 then
    raise exception 'Quiz has no questions.';
  end if;

  next_score := round((correct_questions::numeric / total_questions::numeric) * 100)::integer;
  next_passed := next_score >= coalesce(quiz_record.passing_score, 70);

  select coalesce(max(qa.attempt_number), 0) + 1
  into next_attempt_number
  from public.eco_sevarq_quiz_attempts qa
  where qa.user_id = auth.uid()
    and qa.quiz_id = input_quiz_id;

  insert into public.eco_sevarq_quiz_attempts (
    quiz_id,
    module_id,
    course_id,
    user_id,
    score,
    passed,
    answers,
    attempt_number,
    completed_at
  )
  values (
    input_quiz_id,
    quiz_record.module_id,
    quiz_record.course_id,
    auth.uid(),
    next_score,
    next_passed,
    coalesce(input_answers, '{}'::jsonb),
    next_attempt_number,
    now()
  )
  returning * into saved_attempt;

  if not next_passed then
    insert into public.eco_sevarq_course_failures (user_id, course_id, failure_count, last_failed_at)
    values (auth.uid(), quiz_record.course_id, 1, now())
    on conflict (user_id, course_id) do update
    set
      failure_count = public.eco_sevarq_course_failures.failure_count + 1,
      last_failed_at = now();

    delete from public.eco_sevarq_lesson_progress lp
    using public.eco_sevarq_lessons l
    join public.eco_sevarq_modules m on m.id = l.module_id
    where lp.lesson_id = l.id
      and lp.user_id = auth.uid()
      and m.course_id = quiz_record.course_id;
  end if;

  return query
  select
    saved_attempt.id,
    saved_attempt.quiz_id,
    saved_attempt.module_id,
    saved_attempt.course_id,
    saved_attempt.user_id,
    saved_attempt.score,
    saved_attempt.passed,
    saved_attempt.answers,
    saved_attempt.attempt_number,
    saved_attempt.completed_at;
end;
$$;

create or replace function public.issue_course_certificate(
  input_user_id uuid,
  input_course_id uuid,
  input_certificate_url text,
  input_workload_minutes integer,
  input_started_at timestamptz,
  input_completed_at timestamptz,
  input_validation_code text
)
returns public.eco_sevarq_certificates
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_is_admin boolean := app_private.current_user_role() = 'admin';
  target_profile record;
  course_record record;
  missing_lessons integer;
  missing_quizzes integer;
  saved_certificate public.eco_sevarq_certificates;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if not requester_is_admin and input_user_id <> auth.uid() then
    raise exception 'Cannot issue certificates for another user.';
  end if;

  select id, company, status
  into target_profile
  from public.eco_sevarq_profiles
  where id = input_user_id;

  if target_profile.id is null or target_profile.status <> 'ativo' then
    raise exception 'Target user is not active.';
  end if;

  select id, company, is_active
  into course_record
  from public.eco_sevarq_courses
  where id = input_course_id;

  if course_record.id is null or not course_record.is_active or course_record.company <> target_profile.company then
    raise exception 'Course is not available for this user.';
  end if;

  select count(*)
  into missing_lessons
  from public.eco_sevarq_lessons l
  join public.eco_sevarq_modules m on m.id = l.module_id
  where m.course_id = input_course_id
    and l.is_active
    and not exists (
      select 1
      from public.eco_sevarq_lesson_progress lp
      where lp.user_id = input_user_id
        and lp.lesson_id = l.id
        and lp.completed
    );

  if missing_lessons > 0 then
    raise exception 'Course has incomplete lessons.';
  end if;

  select count(*)
  into missing_quizzes
  from public.eco_sevarq_quizzes q
  join public.eco_sevarq_modules m on m.id = q.module_id
  where m.course_id = input_course_id
    and q.is_active
    and not exists (
      select 1
      from public.eco_sevarq_quiz_attempts qa
      where qa.user_id = input_user_id
        and qa.quiz_id = q.id
        and qa.passed
    );

  if missing_quizzes > 0 then
    raise exception 'Course has pending quizzes.';
  end if;

  if nullif(trim(input_certificate_url), '') is null then
    raise exception 'Certificate URL is required.';
  end if;

  if nullif(trim(input_validation_code), '') is null then
    raise exception 'Certificate validation code is required.';
  end if;

  if not requester_is_admin and position('/' || auth.uid()::text || '/' in input_certificate_url) = 0 then
    raise exception 'Invalid certificate path.';
  end if;

  insert into public.eco_sevarq_certificates (
    user_id,
    course_id,
    certificate_url,
    workload_minutes,
    started_at,
    completed_at,
    validation_code,
    issued_at,
    updated_at
  )
  values (
    input_user_id,
    input_course_id,
    input_certificate_url,
    greatest(0, coalesce(input_workload_minutes, 0)),
    input_started_at,
    coalesce(input_completed_at, now()),
    upper(trim(input_validation_code)),
    now(),
    now()
  )
  on conflict (user_id, course_id) do update
  set
    certificate_url = excluded.certificate_url,
    workload_minutes = excluded.workload_minutes,
    started_at = excluded.started_at,
    completed_at = excluded.completed_at,
    validation_code = excluded.validation_code,
    issued_at = excluded.issued_at,
    updated_at = now()
  returning * into saved_certificate;

  return saved_certificate;
end;
$$;
