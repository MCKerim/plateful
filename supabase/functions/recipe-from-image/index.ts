import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { CORS, ANSWEAR_HEADER } from "../_shared/headers.ts";
import { parseIngredient } from "../_shared/parse-ingredient.ts";

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

  const { images } = body ?? {};

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

    // Step 1: Create placeholder recipe with 'importing' status
    const { data: placeholderData, error: placeholderError } = await supabase
      .from("recipes")
      .insert([
        {
          name: "Importing...",
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

    // Upload first user-provided image as fallback (before extraction)
    const firstUserImage = images[0];
    if (firstUserImage) {
      try {
        const binaryString = atob(firstUserImage);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const fallbackImagePath = `recipe_${recipeId}/${Date.now()}_user.webp`;
        await supabase.storage.from("recipeimages").upload(fallbackImagePath, bytes, {
          contentType: "image/webp",
          upsert: true,
        });
        console.log("Uploaded fallback user image");
      } catch (imgErr) {
        console.error("Failed to upload fallback image:", imgErr);
      }
    }

    // Step 2: Call Node service for extraction
    const NODE_SERVICE_URL = "http://91.99.166.5:3000/api/extract-recipe-from-images";

    let node_data = null;
    try {
      const nodeResponse = await fetch(NODE_SERVICE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images: images, language: language }),
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
    const recipe = node_data?.data?.recipe;
    const updateData = {
      name: recipe?.title || "Imported Recipe",
      description: recipe?.description || null,
      instructions: recipe?.instructions || "",
      category: recipe?.category || null,
      base_servings: recipe?.servings || null,
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

    // Step 4: Insert ingredients if available
    const ingredients = recipe?.ingredients;
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      try {
        const ingredientRows = ingredients.map(
          (ing: { item: string; section: string | null }, index: number) => {
            const parsed = parseIngredient(ing.item);
            return {
              recipe_id: recipeId,
              raw_text: ing.item,
              quantity_value: parsed.quantityValue,
              quantity_display: parsed.quantityDisplay,
              unit: parsed.unit,
              unit_normalized: parsed.unitNormalized,
              ingredient_name: parsed.ingredientName,
              ingredient_name_normalized: parsed.ingredientNameNormalized,
              preparation_note: parsed.preparationNote,
              is_scalable: parsed.isScalable,
              is_optional: false,
              group_name: ing.section || null,
              sort_order: index,
            };
          }
        );

        const { error: ingredientError } = await supabase
          .from("recipe_ingredients")
          .insert(ingredientRows);

        if (ingredientError) {
          console.error("Failed to insert ingredients:", ingredientError);
        } else {
          console.log(`Inserted ${ingredientRows.length} ingredients for recipe ${recipeId}`);
        }
      } catch (ingErr) {
        console.error("Ingredient insertion error:", ingErr);
      }
    }

    // Step 5: Upload extracted image if available (better quality than user image)
    const image = recipe?.imageAsBase64;

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

        const imageFormat = recipe?.imageFormat || "webp";
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
