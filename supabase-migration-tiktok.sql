alter table public.ads
drop constraint if exists ads_type_check;

alter table public.ads
add constraint ads_type_check
check (type in ('image','youtube','tiktok','link'));
