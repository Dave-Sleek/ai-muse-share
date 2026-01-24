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
    const post = data[0];

    if (!post) {
      return new Response(
        `<!doctype html><html><head><title>Post Not Found</title></head><body></body></html>`,
        { headers: { "content-type": "text/html" }, status: 404 }
      );
    }

    return new Response(
      `<!doctype html>
      <html>
        <head>
          <title>${post.title}</title>
          <meta property="og:title" content="${post.title}" />
          <meta property="og:description" content="${post.description}" />
          <meta property="og:image" content="${post.image}" />
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
