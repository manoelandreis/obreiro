// Returns a redirect to a signed URL for the company logo associated with a
// public quote token. Used by the public quote page to display the company
// logo while keeping the company-assets storage bucket private.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response("missing token", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: quote, error: qErr } = await supabase
      .from("app_quotes")
      .select("user_id")
      .eq("public_token", token)
      .maybeSingle();
    if (qErr || !quote) {
      return new Response("not found", { status: 404, headers: corsHeaders });
    }

    const { data: settings } = await supabase
      .from("app_user_settings")
      .select("logo_url")
      .eq("user_id", quote.user_id)
      .maybeSingle();

    const path = (settings as any)?.logo_url as string | null;
    if (!path) {
      return new Response("no logo", { status: 404, headers: corsHeaders });
    }

    const { data: signed } = await supabase.storage
      .from("company-assets")
      .createSignedUrl(path, 60 * 60);
    if (!signed?.signedUrl) {
      return new Response("sign failed", { status: 500, headers: corsHeaders });
    }

    return Response.redirect(signed.signedUrl, 302);
  } catch (e) {
    console.error('get-quote-logo error', e);
    return new Response('internal server error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
