const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, content-length",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
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

    const url = new URL(req.url);
    const version = url.searchParams.get("version") ?? "";
    if (!version) throw new Error("Paramètre 'version' manquant");

    const fileName = `chatkit-v${version}.apk`;
    const contentLength = req.headers.get("content-length") ?? "";

    const ghHeaders = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "ChatKit-Admin",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // 1. Créer ou récupérer la release GitHub
    let releaseId: number;

    const createRes = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases`,
      {
        method: "POST",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
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
      const getRes = await fetch(
        `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/tags/v${version}`,
        { headers: ghHeaders }
      );
      if (!getRes.ok) throw new Error("Impossible de récupérer la release existante");
      releaseId = (await getRes.json()).id;
    } else {
      const err = await createRes.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? `GitHub API: ${createRes.status}`);
    }

    // 2. Supprimer l'asset existant si même nom (re-upload)
    const listRes = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/${releaseId}/assets`,
      { headers: ghHeaders }
    );
    if (listRes.ok) {
      const assets = await listRes.json() as Array<{ id: number; name: string }>;
      const existing = assets.find((a) => a.name === fileName);
      if (existing) {
        await fetch(
          `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/assets/${existing.id}`,
          { method: "DELETE", headers: ghHeaders }
        );
      }
    }

    // 3. Streamer le corps directement vers GitHub (pas de buffering RAM)
    const uploadHeaders: Record<string, string> = {
      ...ghHeaders,
      "Content-Type": "application/vnd.android.package-archive",
    };
    if (contentLength) uploadHeaders["Content-Length"] = contentLength;

    const uploadRes = await fetch(
      `https://uploads.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`,
      {
        method: "POST",
        headers: uploadHeaders,
        body: req.body,
        // @ts-ignore — required for streaming in Deno
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
