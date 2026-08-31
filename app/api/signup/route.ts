import { createClient } from "@supabase/supabase-js";

// Invite-only signup. Public signups are disabled in the Supabase dashboard,
// so accounts can only be created here, guarded by the shared INVITE_CODE env
// var. Runs server-side with the service-role key, never in the browser.
export async function POST(request: Request) {
  let body: { email?: string; password?: string; inviteCode?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const inviteCode = body.inviteCode?.trim() ?? "";

  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const expectedInvite = process.env.INVITE_CODE;
  if (!expectedInvite) {
    // Configuration problem, not a wrong code — keep the two errors distinct.
    return Response.json(
      {
        error:
          "The invite code isn't configured on the server. Add INVITE_CODE to .env.local, then restart the dev server.",
      },
      { status: 500 },
    );
  }
  if (inviteCode !== expectedInvite) {
    return Response.json(
      { error: "That invite code isn't right. Ask a friend for the current one." },
      { status: 403 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      {
        error:
          "Server auth isn't configured yet. Add SUPABASE_SERVICE_ROLE_KEY to .env.local, then restart the dev server.",
      },
      { status: 500 },
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // email_confirm: true skips the verification email so invited friends can
  // sign in immediately after signing up.
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}
