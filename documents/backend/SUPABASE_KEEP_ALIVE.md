# Supabase Keep Alive (Edge Function + GitHub Action)

## Issue
Supabase free projects can **pause** after inactivity. When paused, **Auth/DB/API** requests fail until the project wakes up.

## Reason
No scheduled traffic means Supabase marks the project inactive and pauses compute.

## Resolution
Create a tiny **Edge Function** that performs a minimal DB query, then schedule a **GitHub Action** to call it daily.

---

## 1) Create Edge Function in Supabase Dashboard

In Supabase Dashboard:
- Go to **Edge Functions**
- Create function: **`keep-alive`**
- Paste code below into `index.ts`

### `keep-alive` function code

```ts
/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // Simple auth: require your anon key in Authorization header.
  // (You can swap this for a dedicated secret if you prefer.)
  const expected = Deno.env.get("KEEP_ALIVE_AUTH") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";

  // If KEEP_ALIVE_AUTH is set, use it. Otherwise, accept the anon key token.
  // This lets GitHub Actions send SUPABASE_ANON_KEY without storing service role in GitHub.
  if (expected) {
    if (token !== expected) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    // If you did not set KEEP_ALIVE_AUTH, you MUST at least send *some* bearer token.
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Minimal query to wake compute (pick a small table that exists).
  const { error } = await supabase.from("user_profiles").select("id").limit(1);
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, at: new Date().toISOString() }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
```

---

## 2) Set Edge Function secrets

In Supabase Dashboard → **Edge Functions** → **Secrets**, set:
- `SUPABASE_URL`: your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: service role key (never commit this)

Optional (recommended):
- `KEEP_ALIVE_AUTH`: a random secret string (then GitHub sends this instead of anon key)

---

## 3) GitHub Action (already in repo)

Workflow file:
- `.github/workflows/supabase-keepalive.yml`

### GitHub secrets required
In GitHub repo → **Settings → Secrets and variables → Actions** add:
- `SUPABASE_PROJECT_REF`: your Supabase project ref (the subdomain part)
- `SUPABASE_ANON_KEY`: anon key (or if you used `KEEP_ALIVE_AUTH`, you can put that secret here instead)

---

## 4) Test

1. Deploy the `keep-alive` function in Supabase dashboard.
2. Run GitHub Action manually (**workflow_dispatch**).
3. Check the action logs for HTTP 200 and `{ ok: true }`.

---

## Notes
- This reduces pausing by keeping periodic activity, but free-tier behavior can still change.
- If `user_profiles` table name differs, update the query in the function code to a table that exists.
