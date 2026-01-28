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

  let { images } = body ?? {};

  if (!Array.isArray(images)) {
    return new Response(JSON.stringify({ error: "Missing 'images' in body" }), {
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

    const NODE_SERVICE_URL = "http://91.99.166.5:3000/api/extract-recipe-from-images";

    const nodeResponse = await fetch(NODE_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ images: images, language: language }),
    });

    if (!nodeResponse.ok) {
      const errorText = await nodeResponse.text();
      console.error(`Node Service Error (${nodeResponse.status}):`, errorText);

      return new Response(
        JSON.stringify({
          error: "Recipe extraction failed",
          details: errorText,
        }),
        {
          status: nodeResponse.status,
          headers: ANSWEAR_HEADER,
        }
      );
    }

    const node_data = await nodeResponse.json();

    const { data, error } = await supabase
      .from("recipes")
      .insert([
        {
          name: node_data.data.recipe.title,
          description: node_data.data.recipe.description,
          household_id: householdId,
          category: node_data.data.recipe.category,
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    const image = node_data.data.recipe.imageAsBase64;

    console.log("Image check:", {
      hasImage: !!image,
      imageLength: image?.length,
      recipeId: data[0]?.id,
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

        const imageFormat = node_data.data.recipe.imageFormat || "webp";
        const imageFileName = `${Date.now()}.${imageFormat}`;
        const imageFilePath = `recipe_${data[0].id}/${imageFileName}`;

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
