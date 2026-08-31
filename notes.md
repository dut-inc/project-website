1. Add env vars to  .env.local  (it's gitignored, so safe):
SUPABASE_SERVICE_ROLE_KEY=<project service role key>
INVITE_CODE=<a code to share with friends>
2. Disable public signups in the Supabase dashboard: Authentication → Providers → Email → turn off "Allow new users to sign up" — this makes the invite code the only way to create an account