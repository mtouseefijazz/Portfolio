import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "You need to be signed in." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await caller.auth.getUser();
    if (userError || !userData.user) return json({ error: "You need to be signed in." }, 401);

    const { data: isAdmin, error: adminError } = await caller.rpc("is_current_user_admin");
    if (adminError) throw adminError;
    if (!isAdmin) return json({ error: "Only the admin can change these settings." }, 403);

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : undefined;
    const password = typeof body?.password === "string" ? body.password : undefined;

    if (!email && !password) return json({ error: "Nothing to update." }, 400);
    if (email !== undefined && (email.length > 255 || !EMAIL_PATTERN.test(email))) {
      return json({ error: "Enter a valid email address." }, 400);
    }
    if (password !== undefined && password.length < 8) {
      return json({ error: "Password must be at least 8 characters." }, 400);
    }

    const attrs: { email?: string; email_confirm?: boolean; password?: string } = {};
    if (email) {
      attrs.email = email;
      attrs.email_confirm = true;
    }
    if (password) attrs.password = password;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.auth.admin.updateUserById(userData.user.id, attrs);
    if (error) return json({ error: error.message }, 400);

    return json({ email: data.user.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return json({ error: message }, 500);
  }
});
