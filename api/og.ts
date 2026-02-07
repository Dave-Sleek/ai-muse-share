export const config = { runtime: "edge" };

// HTML escape function to prevent XSS attacks
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
    const supabaseUrl = process.env.SUPABASE_URL || 'https://yhnmadrqghlmeknwujii.supabase.co';
    const res = await fetch(
      `${supabaseUrl}/rest/v1/posts?id=eq.${encodeURIComponent(id)}`,
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

    // --- Sanitize post fields to prevent XSS ---
    const title = escapeHtml(post.title || "PromptShare - Share Your AI Art & Prompts");
    const description = escapeHtml(post.prompt || "Check out this AI prompt on PromptShare!");
    // Image URLs should be validated but don't need HTML escaping in content attribute
    const image = post.image_url || "https://ai-muse-share.lovable.app/og-image.png";

    return new Response(
      `<!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${escapeHtml(image)}" />
          <meta property="og:type" content="article" />
          <meta property="og:site_name" content="PromptShare" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${escapeHtml(image)}" />
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
