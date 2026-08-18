create policy reservations_self_update on public.reservations
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());
