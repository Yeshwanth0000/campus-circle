-- Time-to-sell is one of the few numbers that says whether a marketplace is
-- actually clearing, and it was uncomputable: status flips to 'sold' with no
-- record of when. Backfilled as null, so the metric is honest about only
-- covering sales from here on.
--
-- Done as a trigger rather than inside markAsSold() so it holds however a
-- listing's status changes.

alter table public.listings
  add column if not exists sold_at timestamptz;

comment on column public.listings.sold_at is
  'Set when status becomes sold; null for listings sold before this column existed.';

create or replace function public.stamp_listing_sold_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'sold' and coalesce(old.status, '') <> 'sold' then
    new.sold_at := now();
  elsif new.status <> 'sold' then
    new.sold_at := null;   -- relisting clears it
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stamp_listing_sold_at on public.listings;
create trigger trg_stamp_listing_sold_at
  before update on public.listings
  for each row
  execute function public.stamp_listing_sold_at();
