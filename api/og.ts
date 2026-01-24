export const config = { runtime: "edge" };

export default async function handler(req: Request) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    // TEMP example (replace with real API)
    const post = {
        title: "PromptShare - Share Your AI Art & Prompts",
        description: "Discover and share AI-generated images with prompts. Connect with a creative community passionate about AI art.",
        image: "https://lovable.dev/opengraph-image-p98pqg.png"
    };

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
