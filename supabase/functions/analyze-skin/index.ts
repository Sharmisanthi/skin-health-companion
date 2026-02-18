import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SKIN_DISEASES_CONTEXT = `You are a medical AI assistant specialized in dermatology and skin disease detection. 

When analyzing skin images, you should identify potential skin conditions from the following categories:

1. INFECTIOUS SKIN DISEASES:
   - Bacterial: Impetigo, Cellulitis, Folliculitis, Boils, Carbuncle
   - Viral: Warts, Herpes Simplex, Shingles, Chickenpox, Molluscum Contagiosum
   - Fungal: Ringworm, Athlete's Foot, Jock Itch, Nail Fungus, Candidiasis
   - Parasitic: Scabies, Pediculosis

2. INFLAMMATORY & ALLERGIC: Eczema, Contact Dermatitis, Psoriasis, Urticaria, Lichen Planus

3. ACNE & SEBACEOUS: Acne Vulgaris, Acne Rosacea, Sebaceous Cyst

4. PIGMENTATION DISORDERS: Vitiligo, Melasma, Hyperpigmentation

5. AUTOIMMUNE: Lupus, Pemphigus, Alopecia Areata

6. HAIR & SCALP: Alopecia, Dandruff, Scalp Psoriasis

7. NAIL DISORDERS: Nail Fungus, Ingrown Nail, Nail Psoriasis

8. SKIN CANCERS: Basal Cell Carcinoma, Squamous Cell Carcinoma, Melanoma

9. OTHER: Sunburn, Burns, Stretch Marks, Keloids

Provide detailed, helpful, and accurate information. Always remind users that this is for educational purposes and they should consult a healthcare professional for proper diagnosis.`;

function getImageParts(imageData: string): { mimeType: string; base64Data: string } {
  let mimeType = "image/jpeg";
  let base64Data = imageData;
  
  if (imageData.startsWith("data:")) {
    const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    } else {
      // Strip any data: prefix we can't parse
      base64Data = imageData.split(",").pop() || imageData;
    }
  }
  
  // Remove whitespace
  base64Data = base64Data.replace(/\s/g, "");
  
  return { mimeType, base64Data };
}

function extractJSON(content: string): Record<string, unknown> | null {
  // Try direct parse first
  try {
    return JSON.parse(content);
  } catch (_) {
    // continue
  }

  // Try extracting from markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (_) {
      // continue
    }
  }

  // Try extracting any JSON object
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (_) {
      // continue
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract base64 and mime type from the image data
    const { mimeType, base64Data } = getImageParts(image);

    console.log("Sending request to AI Gateway with model openai/gpt-5-mini");
    console.log("Image mime type:", mimeType, "base64 length:", base64Data.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          {
            role: "system",
            content: SKIN_DISEASES_CONTEXT
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this skin image carefully. Look at the visual features - color, texture, shape, patterns, lesion boundaries, and any abnormalities.

Based on your analysis, respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text) in this exact format:

{"disease": "Name of the condition", "confidence": 85, "description": "Brief description of the condition", "symptoms": ["symptom1", "symptom2", "symptom3"], "remedies": ["remedy1", "remedy2", "remedy3"], "whenToSeeDoctor": "When to seek medical attention", "prevention": ["tip1", "tip2", "tip3"]}

If the image does not show skin or you cannot identify a condition, still use the same JSON format with disease set to "Unknown" and provide general skin care advice.

IMPORTANT: Output ONLY the JSON object, nothing else.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_completion_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("AI response received, choices:", data.choices?.length);
    
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in AI response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No response from AI");
    }

    console.log("AI content (first 500 chars):", content.substring(0, 500));

    // Parse JSON from the response
    const result = extractJSON(content);
    
    if (result) {
      // Ensure all required fields exist
      const finalResult = {
        disease: result.disease || "Unknown Condition",
        confidence: typeof result.confidence === 'number' ? result.confidence : 50,
        description: result.description || "Analysis completed. Please consult a healthcare professional for proper diagnosis.",
        symptoms: Array.isArray(result.symptoms) ? result.symptoms : ["Consult a dermatologist for specific symptoms"],
        remedies: Array.isArray(result.remedies) ? result.remedies : ["Consult a dermatologist for proper treatment"],
        whenToSeeDoctor: result.whenToSeeDoctor || "If symptoms persist or worsen, consult a healthcare professional.",
        prevention: Array.isArray(result.prevention) ? result.prevention : ["Regular skin checks", "Sun protection", "Good hygiene"],
      };

      return new Response(JSON.stringify(finalResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.error("Failed to parse JSON from content:", content.substring(0, 500));
    
    // Return a fallback response
    return new Response(JSON.stringify({
      disease: "Analysis Inconclusive",
      confidence: 0,
      description: "The AI could not properly analyze this image. Please try uploading a clearer, well-lit image of the affected skin area.",
      symptoms: ["Please upload a clearer image for better analysis"],
      remedies: ["Consult a dermatologist for proper diagnosis"],
      whenToSeeDoctor: "If you have any skin concerns, please consult a healthcare professional.",
      prevention: ["Regular skin checks", "Sun protection", "Good hygiene"]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred during analysis" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
