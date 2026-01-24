export const config = { runtime: "edge" };

export default async function handler(req: Request) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    // --- Replace this with your real API call ---
    // Example with fetch to your backend
    const res = await fetch(`https://promptshare-api.vercel.app/posts/${id}`);
    const post = await res.json();

    // Fallback if post not found
    if (!post) {
        return new Response(
            `<!doctype html><html><head><title>Prompt Not Found</title></head><body></body></html>`,
            { headers: { "content-type": "text/html" } }
        );
    }

    // --- Return HTML with post-specific OG tags ---
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
}
