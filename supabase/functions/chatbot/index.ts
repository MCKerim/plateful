import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "npm:openai";
import { TOOLS, proposeRecipe, proposeRecipeEdit } from "./tools.ts";
import { CORS, ANSWEAR_HEADER, STREAM_HEADER } from "./headers.ts";
import { DEFAULT_PROMPT } from "./prompts.ts";

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", {
      headers: CORS,
    });
  if (req.method !== "POST")
    return new Response("Only POST allowed", {
      status: 405,
      headers: CORS,
    });
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey)
    return new Response(
      JSON.stringify({
        error: "Missing OPENAI_API_KEY",
      }),
      {
        status: 500,
        headers: ANSWEAR_HEADER,
      }
    );
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
  const { messages, previous_response_id } = body ?? {};
  if (!Array.isArray(messages)) {
    return new Response(
      JSON.stringify({
        error: "messages must be an array",
      }),
      {
        status: 400,
        headers: ANSWEAR_HEADER,
      }
    );
  }
  const client = new OpenAI({
    apiKey,
  });

  let proposalCounter = 0;
  let answear = await client.responses.create({
    model: "gpt-4.1-mini",
    tools: TOOLS,
    instructions: DEFAULT_PROMPT,
    previous_response_id: previous_response_id ?? null,
    input: messages,
  });
  let loopCount = 0;
  let toolOutputs = [];
  const toolOutputsForUI = [];
  do {
    toolOutputs = [];
    for (const item of answear.output ?? []) {
      if (item.type === "function_call") {
        proposalCounter++;
        const proposalId = `p_${proposalCounter}`;
        switch (item.name) {
          case "propose_recipe": {
            const { title, description, category } = JSON.parse(item.arguments);
            const toolOutputForUI = proposeRecipe(proposalId, title, description, category);
            toolOutputs.push({
              type: "function_call_output",
              call_id: item.call_id,
              output: toolOutputForUI.status,
            });
            toolOutputsForUI.push(toolOutputForUI);
            break;
          }
          case "propose_recipe_edit": {
            const {
              recipeId: editRecipeId,
              title: editTitle,
              description: editDescription,
              category: editCategory,
            } = JSON.parse(item.arguments);
            const editToolOutputForUI = proposeRecipeEdit(
              proposalId,
              editRecipeId,
              editTitle,
              editDescription,
              editCategory
            );
            toolOutputs.push({
              type: "function_call_output",
              call_id: item.call_id,
              output: editToolOutputForUI.status,
            });
            toolOutputsForUI.push(editToolOutputForUI);
            break;
          }
          default:
            console.error("Function not implemented: " + item.name);
            break;
        }
      }
    }
    if (toolOutputs.length !== 0) {
      answear = await client.responses.create({
        model: "gpt-4.1-mini",
        tools: TOOLS,
        instructions: DEFAULT_PROMPT,
        previous_response_id: answear.id,
        input: toolOutputs,
      });
    }
    loopCount++;
  } while (toolOutputs.length !== 0 && loopCount <= 5);

  // Stream the final text response via SSE
  const finalText = answear.output_text ?? "";
  const responseId = answear.id;
  const encoder = new TextEncoder();
  const chunkSize = 12;
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const stream = new ReadableStream({
    async start(controller) {
      // Stream text in chunks with small delays so the client receives them incrementally
      for (let i = 0; i < finalText.length; i += chunkSize) {
        const chunk = finalText.slice(i, i + chunkSize);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`)
        );
        await delay(30);
      }

      // Send done event with metadata
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            done: true,
            id: responseId,
            tool_outputs_for_ui: JSON.stringify(toolOutputsForUI),
          })}\n\n`
        )
      );

      controller.close();
    },
  });

  return new Response(stream, {
    headers: STREAM_HEADER,
  });
});
