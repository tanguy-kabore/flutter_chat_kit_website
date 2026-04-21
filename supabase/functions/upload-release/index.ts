import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") ?? "";
    const GH_OWNER     = Deno.env.get("GH_OWNER") ?? "";
    const GH_REPO      = Deno.env.get("GH_REPO") ?? "";

    if (!GITHUB_TOKEN || !GH_OWNER || !GH_REPO) {
      throw new Error("Secrets GitHub non configurés sur Supabase");
    }

    // Version dans les query params, fichier en corps brut (pas de FormData = pas de buffering)
    const url = new URL(req.url);
    const version = url.searchParams.get("version") ?? "";
    if (!version) throw new Error("Paramètre 'version' manquant");

    const fileName = `chatkit-v${version}.apk`;
    const contentLength = req.headers.get("content-length") ?? "";

    // 1. Créer la release GitHub (ou récupérer si elle existe déjà)
    let releaseId: number;

    const createRes = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
          "User-Agent": "ChatKit-Admin",
        },
        body: JSON.stringify({
          tag_name: `v${version}`,
          name: `ChatKit v${version}`,
          draft: false,
          prerelease: false,
        }),
      }
    );

    if (createRes.ok) {
      releaseId = (await createRes.json()).id;
    } else if (createRes.status === 422) {
      // Tag/release déjà existant — on le récupère
      const getRes = await fetch(
        `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/tags/v${version}`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "ChatKit-Admin",
          },
        }
      );
      if (!getRes.ok) throw new Error("Impossible de récupérer la release existante");
      releaseId = (await getRes.json()).id;
    } else {
      const err = await createRes.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? `GitHub API: ${createRes.status}`);
    }

    // 2. Pipe le corps de la requête directement vers GitHub (zéro buffering mémoire)
    const uploadHeaders: Record<string, string> = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/vnd.android.package-archive",
      Accept: "application/vnd.github+json",
      "User-Agent": "ChatKit-Admin",
    };
    if (contentLength) uploadHeaders["Content-Length"] = contentLength;

    const uploadRes = await fetch(
      `https://uploads.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`,
      {
        method: "POST",
        headers: uploadHeaders,
        body: req.body,
        // @ts-ignore
        duplex: "half",
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? `Upload GitHub échoué: ${uploadRes.status}`);
    }

    const asset = await uploadRes.json() as { browser_download_url: string };

    return new Response(
      JSON.stringify({ download_url: asset.browser_download_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
