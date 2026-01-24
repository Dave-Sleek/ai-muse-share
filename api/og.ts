export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        `<!doctype html><html><head><title>Post Not Found</title></head><body></body></html>`,
        { headers: { "content-type": "text/html" }, status: 404 }
      );
    }

    // --- Fetch post from Supabase REST API ---
    const res = await fetch(
      `https://ai-muse-share.lovable.app.supabase.co/rest/v1/posts?id=eq.${id}`,
      {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY!}`,
          'Accept': 'application/json'
        }
      }
    );

    const data = await res.json();
    const post = data[0]; // REST always returns an array

    if (!post) {
      return new Response(
        `<!doctype html><html><head><title>Post Not Found</title></head><body></body></html>`,
        { headers: { "content-type": "text/html" }, status: 404 }
      );
    }

    // --- Use post fields ---
    const title = post.title || "PromptShare - Share Your AI Art & Prompts";
    const description = post.prompt || "Check out this AI prompt on PromptShare!";
    const image = post.image_url || "https://lovable.dev/opengraph-image-p98pqg.png";

    return new Response(
      `<!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${image}" />
          <meta property="og:type" content="article" />
        </head>
        <body></body>
      </html>`,
      { headers: { "content-type": "text/html" } }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      `<!doctype html><html><head><title>Error</title></head><body></body></html>`,
      { headers: { "content-type": "text/html" }, status: 500 }
    );
  }
}
