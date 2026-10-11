// Returns a redirect to a signed URL for a quote attachment associated with a
// public quote token. Keeps the quote-attachments storage bucket private while
// letting the public quote page render the photo gallery.
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
    const attachmentId = url.searchParams.get("id");
    if (!token || !attachmentId) {
      return new Response("missing parameters", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: quote, error: qErr } = await supabase
      .from("app_quotes")
      .select("id")
      .eq("public_token", token)
      .maybeSingle();
    if (qErr || !quote) {
      return new Response("not found", { status: 404, headers: corsHeaders });
    }

    const { data: attachment } = await supabase
      .from("quote_attachments")
      .select("storage_path")
      .eq("id", attachmentId)
      .eq("quote_id", quote.id)
      .maybeSingle();

    const path = (attachment as any)?.storage_path as string | null;
    if (!path) {
      return new Response("not found", { status: 404, headers: corsHeaders });
    }

    const { data: signed } = await supabase.storage
      .from("quote-attachments")
      .createSignedUrl(path, 60 * 60);
    if (!signed?.signedUrl) {
      return new Response("sign failed", { status: 500, headers: corsHeaders });
    }

    return Response.redirect(signed.signedUrl, 302);
  } catch (e) {
    console.error("get-quote-attachment error", e);
    return new Response("internal server error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
