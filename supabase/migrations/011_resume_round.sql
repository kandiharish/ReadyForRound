-- 011: a new "Resume deep-dive" interview round
alter table public.interview_turns drop constraint if exists interview_turns_round_check;
alter table public.interview_turns add constraint interview_turns_round_check
  check (round in ('technical', 'project', 'behavioural', 'hr', 'resume'));
