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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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
                text: `Analyze this skin image and provide:
1. The most likely skin condition/disease
2. Confidence level (as a percentage)
3. Brief description of the condition
4. Common symptoms
5. Home remedies and treatments
6. When to see a doctor
7. Prevention tips

Respond in this exact JSON format:
{
  "disease": "Name of the condition",
  "confidence": 85,
  "description": "Brief description",
  "symptoms": ["symptom1", "symptom2"],
  "remedies": ["remedy1", "remedy2"],
  "whenToSeeDoctor": "When to seek medical attention",
  "prevention": ["tip1", "tip2"]
}

If the image is not of skin or cannot be analyzed, return an appropriate message. If you cannot identify a specific condition, suggest general categories it might fall under.`
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
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
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON from the response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      // Return a default response if parsing fails
      result = {
        disease: "Unable to Identify",
        confidence: 0,
        description: "The image could not be properly analyzed. Please ensure you're uploading a clear image of the affected skin area.",
        symptoms: ["Please upload a clearer image"],
        remedies: ["Consult a dermatologist for proper diagnosis"],
        whenToSeeDoctor: "If you have any skin concerns, please consult a healthcare professional.",
        prevention: ["Regular skin checks", "Sun protection", "Good hygiene"]
      };
    }

    return new Response(JSON.stringify(result), {
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
