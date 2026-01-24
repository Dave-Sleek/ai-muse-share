import { createClient } from '@supabase/supabase-js';

export const config = { runtime: "edge" };

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Fetch post from Supabase
    const { data: post, error } = await supabase
      .from('posts')         // Replace 'posts' with your table name
      .select('title, description, image') // Fields you want for OG
      .eq('id', id)
      .single();

    if (error || !post) {
      return new Response(
        `<!doctype html><html><head><title>Post Not Found</title></head><body></body></html>`,
        { headers: { "content-type": "text/html" }, status: 404 }
      );
    }

    // Return HTML with OG tags
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
