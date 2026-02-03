import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const ANSWEAR_HEADER = {
  ...CORS,
  "Content-Type": "application/json",
};

console.info("server started");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", {
      headers: CORS,
    });

  if (req.method !== "POST")
    return new Response("Only POST allowed", {
      status: 405,
      headers: CORS,
    });

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "Invalid JSON",
      }),
      {
        status: 400,
        headers: ANSWEAR_HEADER,
      }
    );
  }

  const { url } = body ?? {};

  if (!url) {
    return new Response(JSON.stringify({ error: "Missing 'url' in body" }), {
      status: 400,
      headers: ANSWEAR_HEADER,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: ANSWEAR_HEADER,
      });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("household_id, language")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile?.household_id) {
      console.error("Profile fetch error:", profileError);
      return new Response(JSON.stringify({ error: "Could not find household for user" }), {
        status: 400,
        headers: ANSWEAR_HEADER,
      });
    }

    const householdId = userProfile.household_id;
    const language = userProfile.language;

    // Step 1: Create placeholder recipe with 'importing' status
    const { data: placeholderData, error: placeholderError } = await supabase
      .from("recipes")
      .insert([
        {
          name: "Importing...",
          link: url,
          description: "",
          category: null,
          household_id: householdId,
          status: "importing",
        },
      ])
      .select();

    if (placeholderError || !placeholderData?.[0]) {
      console.error("Failed to create placeholder recipe:", placeholderError);
      throw placeholderError || new Error("Failed to create placeholder");
    }

    const recipeId = placeholderData[0].id;
    console.log("Created placeholder recipe with id:", recipeId);

    // Step 2: Call Node service for extraction
    const NODE_SERVICE_URL = "http://91.99.166.5:3000/api/extract-recipe";

    let node_data = null;
    try {
      const nodeResponse = await fetch(NODE_SERVICE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url, language: language }),
      });

      if (nodeResponse.ok) {
        node_data = await nodeResponse.json();
      } else {
        const errorText = await nodeResponse.text();
        console.error(`Node Service Error (${nodeResponse.status}):`, errorText);
      }
    } catch (fetchError) {
      console.error("Node service fetch error:", fetchError);
    }

    // Step 3: Update recipe with extracted data (or partial data on failure)
    const updateData = {
      name: node_data?.data?.recipe?.title || url,
      description: node_data?.data?.recipe?.description || "",
      category: node_data?.data?.recipe?.category || null,
      status: "ready",
    };

    const { data, error } = await supabase
      .from("recipes")
      .update(updateData)
      .eq("id", recipeId)
      .select();

    if (error) {
      console.error("Failed to update recipe:", error);
      // Still try to mark as ready even if update fails
      await supabase.from("recipes").update({ status: "ready" }).eq("id", recipeId);
      throw error;
    }

    // Step 4: Upload image if available
    const image = node_data?.data?.recipe?.imageAsBase64;

    console.log("Image check:", {
      hasImage: !!image,
      imageLength: image?.length,
      recipeId: recipeId,
      dataLength: data?.length,
    });

    if (image) {
      try {
        // Decode base64 to Uint8Array
        const binaryString = atob(image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        console.log("Image decoded:", {
          bytesLength: bytes.length,
          firstBytes: Array.from(bytes.slice(0, 10)),
        });

        const imageFormat = node_data?.data?.recipe?.imageFormat || "webp";
        const imageFileName = `${Date.now()}.${imageFormat}`;
        const imageFilePath = `recipe_${recipeId}/${imageFileName}`;

        console.log("Uploading to:", imageFilePath);

        const { data: uploadData, error: imageError } = await supabase.storage
          .from("recipeimages")
          .upload(imageFilePath, bytes, {
            contentType: `image/${imageFormat}`,
            upsert: true,
          });

        if (imageError) {
          console.error("Image upload error:", imageError);
        } else {
          console.log("Image uploaded successfully:", uploadData);
        }
      } catch (imgErr) {
        console.error("Image processing error:", imgErr);
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: ANSWEAR_HEADER,
    });
  } catch (err) {
    console.error("Server Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
      status: 500,
      headers: ANSWEAR_HEADER,
    });
  }
});
