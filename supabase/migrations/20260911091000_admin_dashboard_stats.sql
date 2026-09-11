-- Aggregate-only stats for the admin dashboard at /admin.
--
-- Needed because messages and conversations are RLS-scoped to their
-- participants: an admin querying them directly would only ever count their
-- own threads, and the dashboard would quietly under-report. This runs as
-- definer so it can see the whole college, but it returns counts only --
-- never rows -- and refuses anyone without is_admin.
--
-- Retention leans on auth.users.last_sign_in_at because the app stores no
-- last-seen of its own; hence auth in the search_path.

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_college uuid;
  caller_is_admin boolean;
  result jsonb;
begin
  select college_id, coalesce(is_admin, false)
    into caller_college, caller_is_admin
  from public.profiles
  where id = auth.uid();

  if not coalesce(caller_is_admin, false) then
    raise exception 'admin_dashboard_stats: not authorised';
  end if;

  with
  convo as (
    select c.id,
           c.created_at,
           c.buyer_id,
           c.seller_id,
           (select min(m.created_at) from messages m
             where m.conversation_id = c.id and m.sender_id = c.buyer_id) as first_buyer_at,
           (select min(m.created_at) from messages m
             where m.conversation_id = c.id and m.sender_id = c.seller_id) as first_seller_at,
           (select count(*) from messages m where m.conversation_id = c.id) as msg_count
    from conversations c
    join profiles p on p.id = c.buyer_id
    where p.college_id = caller_college
  ),
  seen as (
    select p.id,
           p.created_at as signed_up_at,
           u.last_sign_in_at
    from profiles p
    join auth.users u on u.id = p.id
    where p.college_id = caller_college
  )
  select jsonb_build_object(
    'users_total',        (select count(*) from profiles p where p.college_id = caller_college),
    'users_24h',          (select count(*) from profiles p where p.college_id = caller_college and p.created_at >= now() - interval '24 hours'),
    'users_7d',           (select count(*) from profiles p where p.college_id = caller_college and p.created_at >= now() - interval '7 days'),

    'active_24h',         (select count(*) from seen where last_sign_in_at >= now() - interval '24 hours'),
    'active_7d',          (select count(*) from seen where last_sign_in_at >= now() - interval '7 days'),
    'never_returned',     (select count(*) from seen where last_sign_in_at is null or last_sign_in_at <= signed_up_at + interval '30 minutes'),

    'listings_total',     (select count(*) from listings l where l.college_id = caller_college),
    'listings_available', (select count(*) from listings l where l.college_id = caller_college and l.status = 'available'),
    'listings_sold',      (select count(*) from listings l where l.college_id = caller_college and l.status = 'sold'),
    'listings_expired',   (select count(*) from listings l where l.college_id = caller_college and l.status = 'expired'),
    'listings_24h',       (select count(*) from listings l where l.college_id = caller_college and l.created_at >= now() - interval '24 hours'),
    'listings_7d',        (select count(*) from listings l where l.college_id = caller_college and l.created_at >= now() - interval '7 days'),
    'listings_with_photo',(select count(*) from listings l where l.college_id = caller_college and array_length(l.images, 1) > 0),
    'listings_no_desc',   (select count(*) from listings l where l.college_id = caller_college and coalesce(trim(l.description), '') = ''),
    'total_views',        (select coalesce(sum(l.view_count), 0) from listings l where l.college_id = caller_college),
    'median_price',       (select coalesce(percentile_cont(0.5) within group (order by l.price), 0)
                             from listings l where l.college_id = caller_college and l.price > 0),

    'listings_zero_views',(select count(*) from listings l
                            where l.college_id = caller_college and l.status = 'available' and l.view_count = 0),
    'listings_no_convo',  (select count(*) from listings l
                            where l.college_id = caller_college and l.status = 'available'
                              and not exists (select 1 from conversations c where c.listing_id = l.id)),
    'listings_stale_30d', (select count(*) from listings l
                            where l.college_id = caller_college and l.status = 'available'
                              and l.created_at < now() - interval '30 days'),

    'sell_through_pct',   (select case when count(*) = 0 then 0
                                  else round(100.0 * count(*) filter (where l.status = 'sold') / count(*)) end
                             from listings l where l.college_id = caller_college),
    'median_days_to_sell',(select coalesce(round(percentile_cont(0.5) within group (
                               order by extract(epoch from (l.sold_at - l.created_at)) / 86400
                             )::numeric, 1), 0)
                             from listings l
                            where l.college_id = caller_college and l.sold_at is not null),
    'sold_with_timing',   (select count(*) from listings l where l.college_id = caller_college and l.sold_at is not null),

    'total_images',       (select coalesce(sum(coalesce(array_length(l.images, 1), 0)), 0)
                             from listings l where l.college_id = caller_college),

    'conversations_total',(select count(*) from convo),
    'messages_total',     (select coalesce(sum(msg_count), 0) from convo),
    'messages_24h',       (select count(*) from messages m
                             join convo c on c.id = m.conversation_id
                            where m.created_at >= now() - interval '24 hours'),

    'convos_unanswered',  (select count(*) from convo where first_buyer_at is not null and first_seller_at is null),
    'convos_one_message', (select count(*) from convo where msg_count = 1),
    'median_reply_mins',  (select coalesce(round(percentile_cont(0.5) within group (
                               order by extract(epoch from (first_seller_at - first_buyer_at)) / 60
                             )::numeric, 0), 0)
                             from convo
                            where first_buyer_at is not null and first_seller_at is not null
                              and first_seller_at > first_buyer_at),

    'saves_total',        (select count(*) from saved_listings s
                             join profiles p on p.id = s.user_id
                            where p.college_id = caller_college),
    'reports_open',       (select count(*) from reports r
                             join profiles p on p.id = r.reporter_id
                            where p.college_id = caller_college and r.status = 'open'),

    'sellers',            (select count(distinct l.seller_id) from listings l where l.college_id = caller_college),
    'messagers',          (select count(distinct m.sender_id) from messages m
                             join convo c on c.id = m.conversation_id),

    'by_category',        (select coalesce(jsonb_agg(x order by x.listings desc), '[]'::jsonb) from (
                             select cat.name as name, count(l.id) as listings
                             from categories cat
                             left join listings l on l.category_id = cat.id and l.college_id = caller_college
                             group by cat.name having count(l.id) > 0
                           ) x),

    'empty_categories',   (select coalesce(jsonb_agg(cat.name order by cat.name), '[]'::jsonb)
                             from categories cat
                            where not exists (
                              select 1 from listings l
                               where l.category_id = cat.id and l.college_id = caller_college
                            )),

    'book_departments',   (select coalesce(jsonb_agg(x order by x.n desc), '[]'::jsonb) from (
                             select coalesce(nullif(l.custom_fields->>'department', ''), 'Not set') as name,
                                    count(*) as n
                             from listings l
                             join categories cat on cat.id = l.category_id
                             where l.college_id = caller_college and cat.slug = 'books'
                             group by 1
                           ) x),

    'top_sellers',        (select coalesce(jsonb_agg(x order by x.listings desc), '[]'::jsonb) from (
                             select coalesce(p.full_name, 'Student') as name,
                                    count(l.id) as listings,
                                    coalesce(sum(l.view_count), 0) as views
                             from listings l
                             join profiles p on p.id = l.seller_id
                             where l.college_id = caller_college
                             group by p.id, p.full_name
                             order by count(l.id) desc
                             limit 5
                           ) x),

    'activity_by_hour',   (select coalesce(jsonb_agg(x order by x.hour), '[]'::jsonb) from (
                             select h.hour,
                                    (select count(*) from messages m
                                       join convo c on c.id = m.conversation_id
                                      where extract(hour from m.created_at at time zone 'Asia/Kolkata') = h.hour) as n
                             from generate_series(0, 23) as h(hour)
                           ) x),

    'price_buckets',      (select coalesce(jsonb_agg(x order by x.sort), '[]'::jsonb) from (
                             select b.label, b.sort,
                                    (select count(*) from listings l
                                      where l.college_id = caller_college
                                        and l.price >= b.lo and (b.hi is null or l.price < b.hi)) as n
                             from (values
                               ('Free', 0, 1, 1),
                               ('Under 200', 1, 200, 2),
                               ('200-500', 200, 500, 3),
                               ('500-1k', 500, 1000, 4),
                               ('1k-5k', 1000, 5000, 5),
                               ('5k+', 5000, null, 6)
                             ) as b(label, lo, hi, sort)
                           ) x),

    'signups_by_day',     (select coalesce(jsonb_agg(x order by x.day), '[]'::jsonb) from (
                             select to_char(d.day, 'YYYY-MM-DD') as day,
                                    (select count(*) from profiles p
                                      where p.college_id = caller_college
                                        and p.created_at >= d.day and p.created_at < d.day + interval '1 day') as count
                             from generate_series(date_trunc('day', now()) - interval '13 days',
                                                  date_trunc('day', now()), interval '1 day') as d(day)
                           ) x),

    'listings_by_day',    (select coalesce(jsonb_agg(x order by x.day), '[]'::jsonb) from (
                             select to_char(d.day, 'YYYY-MM-DD') as day,
                                    (select count(*) from listings l
                                      where l.college_id = caller_college
                                        and l.created_at >= d.day and l.created_at < d.day + interval '1 day') as count
                             from generate_series(date_trunc('day', now()) - interval '13 days',
                                                  date_trunc('day', now()), interval '1 day') as d(day)
                           ) x),

    'top_listings',       (select coalesce(jsonb_agg(x order by x.view_count desc), '[]'::jsonb) from (
                             select l.id, l.title, l.view_count, l.status
                             from listings l where l.college_id = caller_college
                             order by l.view_count desc limit 8
                           ) x),

    'generated_at',       to_char(now() at time zone 'Asia/Kolkata', 'DD Mon, HH12:MI am')
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
