import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SKIN_DISEASES_CONTEXT = `You are a medical AI assistant specialized in dermatology and skin disease detection. 

Identify potential skin conditions from these categories:
1. INFECTIOUS: Bacterial (Impetigo, Cellulitis, Folliculitis, Boils), Viral (Warts, Herpes, Shingles), Fungal (Ringworm, Athlete's Foot, Nail Fungus), Parasitic (Scabies)
2. INFLAMMATORY & ALLERGIC: Eczema, Contact Dermatitis, Psoriasis, Urticaria, Lichen Planus
3. ACNE & SEBACEOUS: Acne Vulgaris, Acne Rosacea, Sebaceous Cyst
4. PIGMENTATION: Vitiligo, Melasma, Hyperpigmentation
5. AUTOIMMUNE: Lupus, Pemphigus, Alopecia Areata
6. HAIR & SCALP: Alopecia, Dandruff, Scalp Psoriasis
7. NAIL DISORDERS: Nail Fungus, Ingrown Nail, Nail Psoriasis
8. SKIN CANCERS: Basal Cell Carcinoma, Squamous Cell Carcinoma, Melanoma
9. OTHER: Sunburn, Burns, Stretch Marks, Keloids

This is for educational purposes only. Always recommend consulting a healthcare professional.`;

const ANALYSIS_TOOL = {
  type: "function",
  function: {
    name: "report_skin_analysis",
    description: "Report the results of analyzing a skin image for potential conditions",
    parameters: {
      type: "object",
      properties: {
        disease: { type: "string", description: "Name of the identified skin condition" },
        confidence: { type: "number", description: "Confidence percentage (0-100)" },
        description: { type: "string", description: "Brief description of the condition" },
        symptoms: { type: "array", items: { type: "string" }, description: "Common symptoms" },
        remedies: { type: "array", items: { type: "string" }, description: "Recommended remedies and treatments" },
        whenToSeeDoctor: { type: "string", description: "When to seek medical attention" },
        prevention: { type: "array", items: { type: "string" }, description: "Prevention tips" },
      },
      required: ["disease", "confidence", "description", "symptoms", "remedies", "whenToSeeDoctor", "prevention"],
      additionalProperties: false,
    },
  },
};

function extractJSON(content: string): Record<string, unknown> | null {
  let cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch (_) { /* continue */ }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) {
    let jsonStr = cleaned.substring(start, end + 1)
      .replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, " ");
    try { return JSON.parse(jsonStr); } catch (_) { /* continue */ }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image) throw new Error("No image provided");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log("Sending request to AI Gateway");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SKIN_DISEASES_CONTEXT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this skin image. Identify the most likely skin condition, symptoms, remedies, when to see a doctor, and prevention tips. Call the report_skin_analysis function with your findings. If the image is unclear or not skin-related, report disease as 'Unknown' with general skin care advice."
              },
              {
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ],
        tools: [ANALYSIS_TOOL],
        tool_choice: { type: "function", function: { name: "report_skin_analysis" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please top up credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response received");

    // Try tool call first (structured output)
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const result = JSON.parse(toolCall.function.arguments);
        console.log("Tool call parsed successfully:", result.disease);
        return new Response(JSON.stringify({
          disease: result.disease || "Unknown",
          confidence: result.confidence ?? 50,
          description: result.description || "Please consult a healthcare professional.",
          symptoms: result.symptoms || ["Consult a dermatologist"],
          remedies: result.remedies || ["Consult a dermatologist"],
          whenToSeeDoctor: result.whenToSeeDoctor || "If symptoms persist, consult a doctor.",
          prevention: result.prevention || ["Regular skin checks", "Sun protection"],
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        console.error("Tool call parse error:", e);
      }
    }

    // Fallback: try parsing content as JSON
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log("Trying content fallback, first 300 chars:", content.substring(0, 300));
      const result = extractJSON(content);
      if (result) {
        return new Response(JSON.stringify({
          disease: result.disease || "Unknown",
          confidence: typeof result.confidence === "number" ? result.confidence : 50,
          description: result.description || "Please consult a healthcare professional.",
          symptoms: Array.isArray(result.symptoms) ? result.symptoms : ["Consult a dermatologist"],
          remedies: Array.isArray(result.remedies) ? result.remedies : ["Consult a dermatologist"],
          whenToSeeDoctor: result.whenToSeeDoctor || "If symptoms persist, consult a doctor.",
          prevention: Array.isArray(result.prevention) ? result.prevention : ["Regular skin checks"],
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    console.error("Could not extract result from AI response");
    return new Response(JSON.stringify({
      disease: "Analysis Inconclusive",
      confidence: 0,
      description: "Could not analyze the image. Please upload a clearer, well-lit photo.",
      symptoms: ["Upload a clearer image"],
      remedies: ["Consult a dermatologist"],
      whenToSeeDoctor: "If you have skin concerns, consult a healthcare professional.",
      prevention: ["Regular skin checks", "Sun protection", "Good hygiene"],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred during analysis" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
