import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get("id");

    console.log('OG Image request for post:', postId);

    if (!postId) {
      console.log('No post ID provided');
      return new Response(
        generateHTML({
          title: "PromptShare - Share Your AI Art & Prompts",
          description: "Discover and share AI-generated images with prompts. Connect with a creative community passionate about AI art.",
          image: "https://lovable.dev/opengraph-image-p98pqg.png",
          url: "https://ai-muse-share.lovable.app"
        }),
        { 
          headers: { 
            ...corsHeaders, 
            "content-type": "text/html; charset=utf-8" 
          } 
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch post data
    const { data: post, error } = await supabase
      .from("posts")
      .select("id, title, prompt, image_url")
      .eq("id", postId)
      .single();

    if (error || !post) {
      console.error('Post not found:', error);
      return new Response(
        generateHTML({
          title: "Post Not Found - PromptShare",
          description: "This post could not be found.",
          image: "https://lovable.dev/opengraph-image-p98pqg.png",
          url: `https://ai-muse-share.lovable.app/post/${postId}`
        }),
        { 
          status: 404,
          headers: { 
            ...corsHeaders, 
            "content-type": "text/html; charset=utf-8" 
          } 
        }
      );
    }

    console.log('Post found:', post.title);

    // Truncate description to 160 characters
    const description = post.prompt 
      ? post.prompt.length > 160 
        ? post.prompt.substring(0, 157) + "..." 
        : post.prompt
      : "Check out this AI prompt on PromptShare!";

    return new Response(
      generateHTML({
        title: post.title || "PromptShare Post",
        description: description,
        image: post.image_url || "https://lovable.dev/opengraph-image-p98pqg.png",
        url: `https://ai-muse-share.lovable.app/post/${post.id}`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=3600"
        } 
      }
    );

  } catch (error) {
    console.error('Error generating OG page:', error);
    return new Response(
      generateHTML({
        title: "PromptShare - Share Your AI Art & Prompts",
        description: "Discover and share AI-generated images with prompts.",
        image: "https://lovable.dev/opengraph-image-p98pqg.png",
        url: "https://ai-muse-share.lovable.app"
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          "content-type": "text/html; charset=utf-8" 
        } 
      }
    );
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateHTML({ title, description, image, url }: { 
  title: string; 
  description: string; 
  image: string; 
  url: string;
}): string {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="${safeTitle}">
  <meta name="description" content="${safeDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="PromptShare">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${url}">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${image}">
  
  <!-- Redirect to actual page after meta tags are read -->
  <meta http-equiv="refresh" content="0;url=${url}">
</head>
<body>
  <p>Redirecting to <a href="${url}">${safeTitle}</a>...</p>
</body>
</html>`;
}
