-- Two bugs in how a college is derived from a signup email.
--
-- 1. Colleges were keyed on the *full* mail domain, so student.nitw.ac.in and
--    nitw.ac.in became two separate colleges -- students of one institution
--    sitting in separate marketplaces that cannot see each other. Since IITs
--    and NITs routinely issue both forms, this would have split campuses
--    silently as the site grew.
--
-- 2. The name came from initcap(split_part(domain, '.', 1)) -- the *first*
--    label -- so student.nitw.ac.in displayed as "Student" and nitrkl.ac.in
--    as "Nitrkl".

-- Collapse a mail domain to its institution root.
--   student.nitw.ac.in -> nitw.ac.in
--   cse.iitb.ac.in     -> iitb.ac.in
--   students.mit.edu   -> mit.edu
create or replace function public.institution_domain(p_domain text)
returns text
language plpgsql
immutable
as $$
declare
  d text := lower(trim(both '.' from coalesce(p_domain, '')));
  labels text[];
  n int;
  -- Suffixes that are themselves two labels, so the institution name sits one
  -- label further left than usual.
  two_part_suffixes text[] := array[
    'ac.in','edu.in','res.in','ernet.in','org.in','ac.uk','edu.au','ac.nz',
    'edu.sg','edu.my','ac.lk','edu.pk','edu.bd','ac.id','edu.np','ac.jp','edu.cn'
  ];
  suffix text;
begin
  if d = '' then return null; end if;
  labels := string_to_array(d, '.');
  n := array_length(labels, 1);
  if n is null or n < 2 then return d; end if;

  foreach suffix in array two_part_suffixes loop
    if d like ('%.' || suffix) or d = suffix then
      if n >= 3 then
        return array_to_string(labels[n-2:n], '.');
      end if;
      return d;
    end if;
  end loop;

  return array_to_string(labels[n-1:n], '.');
end;
$$;

-- Known institutions get their real name; everything else gets a readable
-- acronym rather than a word lifted out of the domain.
create or replace function public.college_display_name(p_root text)
returns text
language plpgsql
immutable
as $$
declare
  first_label text := split_part(coalesce(p_root, ''), '.', 1);
begin
  return case p_root
    when 'nitrkl.ac.in' then 'NIT Rourkela'
    when 'nitw.ac.in'   then 'NIT Warangal'
    when 'nitc.ac.in'   then 'NIT Calicut'
    when 'nitt.edu'     then 'NIT Trichy'
    when 'nitk.edu.in'  then 'NIT Surathkal'
    when 'iitb.ac.in'   then 'IIT Bombay'
    when 'iitd.ac.in'   then 'IIT Delhi'
    when 'iitm.ac.in'   then 'IIT Madras'
    when 'iitk.ac.in'   then 'IIT Kanpur'
    when 'iitkgp.ac.in' then 'IIT Kharagpur'
    when 'iitr.ac.in'   then 'IIT Roorkee'
    when 'iitg.ac.in'   then 'IIT Guwahati'
    when 'iiith.ac.in'  then 'IIIT Hyderabad'
    when 'bits-pilani.ac.in' then 'BITS Pilani'
    else
      case when length(first_label) <= 6 then upper(first_label)
           else initcap(first_label) end
  end;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_domain text;
  v_root text;
  v_college_id uuid;
  v_blocked_domains text[] := array[
    'gmail.com','yahoo.com','outlook.com','hotmail.com',
    'icloud.com','protonmail.com','aol.com','live.com'
  ];
begin
  v_domain := lower(split_part(new.email, '@', 2));

  if v_domain = any(v_blocked_domains) then
    raise exception 'Please sign up with your official college email address, not a personal email provider.';
  end if;

  v_root := public.institution_domain(v_domain);

  insert into public.colleges (name, email_domain)
  values (public.college_display_name(v_root), v_root)
  on conflict (email_domain) do nothing;

  select id into v_college_id from public.colleges where email_domain = v_root;

  insert into public.profiles (id, college_id, full_name)
  values (
    new.id,
    v_college_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  return new;
end;
$$;

-- Repair rows created under the old rules. These are updates rather than
-- merges: at the time of writing no two existing rows collapsed to the same
-- root. If that ever changes, the listings and profiles pointing at the
-- losing college_id would need re-pointing before the duplicate is removed.
update public.colleges
   set email_domain = public.institution_domain(email_domain),
       name         = public.college_display_name(public.institution_domain(email_domain))
 where email_domain is distinct from public.institution_domain(email_domain)
    or name is distinct from public.college_display_name(public.institution_domain(email_domain));
