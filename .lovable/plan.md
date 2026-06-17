Upgrade `userteste@obreiro.pt` (user_id `c961f2fc-ff28-4215-a300-f05cd58ece0e`) to the Pro tier so the account unlocks logo customization and other Pro features.

## Change
- Upsert into `public.user_subscriptions`: set `tier = 'pro'`, `status = 'active'` for that user_id (no other fields touched).

## Verification
- Re-query `user_subscriptions` to confirm tier/status.
- User refreshes the app; `useSubscription` will report `isPro = true`.