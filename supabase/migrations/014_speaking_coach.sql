-- 014: Speaking coach. Delivery numbers for each spoken answer: length, words, speaking speed,
-- long pauses and filler words. Only these numbers are kept; the audio is still discarded.
alter table public.interview_turns add column speech jsonb;
