import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Coin packages configuration
const COIN_PACKAGES: Record<string, { coins: number; priceId: string }> = {
  "pack_50": { coins: 50, priceId: "price_1So9TDRlYXMejvUL6ifpcWMT" },
  "pack_150": { coins: 150, priceId: "price_1So9TNRlYXMejvULWIjJtcjs" },
  "pack_400": { coins: 400, priceId: "price_1So9TXRlYXMejvULQ47elr0S" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { packageId } = await req.json();
    
    if (!packageId || !COIN_PACKAGES[packageId]) {
      throw new Error("Invalid package");
    }

    const coinPackage = COIN_PACKAGES[packageId];
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // Get origin for success/cancel URLs
    const origin = req.headers.get("origin") || "https://yhnmadrqghlmeknwujii.lovableproject.com";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: coinPackage.priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/earnings?purchase=success`,
      cancel_url: `${origin}/earnings?purchase=cancelled`,
      metadata: {
        user_id: user.id,
        coins: coinPackage.coins.toString(),
        package_id: packageId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
