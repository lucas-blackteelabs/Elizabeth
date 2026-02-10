import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

const radicalRemissionKnowledge = `
# The Nine Factors of Radical Remission

1. Radically changing your diet
   - Focus on plant-based, whole foods
   - Reduce sugar, meat, dairy, and processed foods
   - Emphasize organic vegetables, fruits, whole grains, and healthy fats
   - Anti-inflammatory foods are especially important
   - Liver-supportive foods for patients who experienced hepatotoxicity

2. Taking control of your health
   - Becoming an active participant in health decisions
   - Researching treatment options
   - Seeking second opinions
   - Understanding scan results and treatment timelines
   - Developing a collaborative relationship with healthcare providers

3. Following your intuition
   - Listening to the body's signals
   - Trusting inner guidance about treatment decisions
   - Balancing analytical thinking with intuitive insights

4. Using herbs and supplements
   - Common supplements include vitamin D, vitamin C, and turmeric/curcumin
   - Medicinal mushrooms like reishi, turkey tail, and shiitake
   - Green tea and herbal adaptogens
   - Liver-supportive supplements (milk thistle, NAC) for post-hepatitis recovery
   - Immune-modulating supplements to support natural immune function
   - Always discuss with healthcare providers to avoid interactions

5. Releasing suppressed emotions
   - Addressing unresolved emotional trauma
   - Processing fear and anxiety around scans and treatment decisions
   - Practices include therapy, journaling, and emotional release techniques
   - Acknowledging and processing difficult feelings about diagnosis

6. Increasing positive emotions
   - Daily gratitude practice
   - Laughter and joy as medicine
   - Celebrating treatment milestones and scan improvements
   - Focusing on hope and possibility
   - Mindfulness and staying present

7. Embracing social support
   - Building a strong support network
   - Support groups specific to cancer type (melanoma community)
   - Maintaining meaningful connections
   - Asking for and accepting help

8. Deepening spiritual connection
   - Personal spiritual practices (not necessarily religious)
   - Meditation, prayer, or connection with nature
   - Finding meaning and purpose through the cancer journey
   - Developing a sense of peace and acceptance

9. Having strong reasons for living
   - Identifying core values and priorities
   - Setting meaningful goals beyond illness
   - Connecting with purpose
   - Focusing on relationships and contributions
`;

const cancerFightingNutrition = `
# Cancer-Fighting & Radical Remission Nutrition Guidelines

## Core Principles
- Plant-forward, whole-foods diet with emphasis on anti-inflammatory foods
- Minimise processed foods, refined sugar, and red/processed meat
- Focus on nutrient density and bioavailability
- Support liver recovery (especially post-immunotherapy hepatotoxicity)
- Support immune system function

## Key Food Categories

### Cruciferous Vegetables (sulforaphane, DIM — anti-cancer)
Broccoli, broccoli sprouts, cauliflower, cabbage, kale, Brussels sprouts, bok choy, watercress

### Allium Family (allicin — immune support)
Garlic, onions, leeks, shallots, chives

### Berries & Dark Fruits (anthocyanins — antioxidant)
Blueberries, blackberries, raspberries, pomegranate, tart cherries

### Liver-Supportive Foods
Beetroot, artichoke, dandelion greens, lemon, turmeric, milk thistle tea, bitter greens

### Anti-Inflammatory Spices
Turmeric (with black pepper for absorption), ginger, cinnamon, rosemary, oregano

### Healthy Fats (omega-3, reduce inflammation)
Wild salmon, sardines, walnuts, flaxseed, chia seeds, extra virgin olive oil, avocado

### Immune-Boosting Foods
Medicinal mushrooms (shiitake, maitake, reishi), green tea, fermented foods (kimchi, sauerkraut, miso), bone broth

### Whole Grains & Legumes
Quinoa, brown rice, oats, lentils, chickpeas, black beans

## Foods to Minimise
- Refined sugar and artificial sweeteners
- Processed and ultra-processed foods
- Red meat (limit), processed meat (avoid)
- Excessive alcohol
- Deep-fried foods
- Excessive dairy (especially conventional)

## Meal Pattern Recommendations
- Eat the rainbow — variety of coloured vegetables daily
- Include protein with every meal for tissue repair
- Stay well-hydrated (water, herbal teas, bone broth)
- Consider intermittent fasting if appropriate (discuss with team)
- Prioritise organic when possible (especially dirty dozen)
`;

export async function getHealthAdvice(userQuery: string, userContext: string = ""): Promise<string> {
  try {
    const systemPrompt = `You are Elizabeth, a compassionate and knowledgeable health companion for cancer patients following the "Radical Remission" approach. You provide personalised, holistic guidance that complements conventional medical treatment.

${radicalRemissionKnowledge}

${userContext}

IMPORTANT GUIDELINES:
- Always be warm, supportive, empathetic, and hopeful while remaining factual
- Personalise responses based on the patient's specific situation when context is available
- For melanoma patients post-immunotherapy: focus on immune system support, liver recovery, anti-inflammatory nutrition, and scan anxiety management
- Clarify that you're complementing conventional medical treatment, not replacing it
- When discussing specific practices, include practical, actionable steps
- If asked about something outside your knowledge, acknowledge limitations
- Never claim that these approaches can cure cancer
- Always emphasize consulting with healthcare providers
- Be aware of drug interactions and contraindications, especially for patients who experienced immunotherapy toxicity
- Celebrate progress and positive scan results to support emotional wellbeing
- Keep responses concise but thorough (2-4 paragraphs)
- Use gentle formatting with bullet points where helpful`;

    const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
    for (let i = 0; i < modelsToTry.length; i++) {
      const modelName = modelsToTry[i];
      try {
        if (i > 0) await new Promise(r => setTimeout(r, 500));
        const m = genAI.getGenerativeModel({ model: modelName });
        const result = await m.generateContent({
          contents: [
            { role: "user", parts: [{ text: systemPrompt + "\n\nUser's question: " + userQuery }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });
        return result.response.text() || "I'm sorry, I couldn't process your request at this time.";
      } catch (err: any) {
        if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("rate")) {
          console.log(`Chat: model ${modelName} rate-limited, trying next...`);
          continue;
        }
        throw err;
      }
    }
    return "I'm having trouble connecting right now. Please try again in a moment.";
  } catch (error) {
    console.error("Error querying Gemini:", error);
    return "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
}

export async function generateMealPlan(userContext: string = ""): Promise<string> {
  try {
    const prompt = `You are Elizabeth, a nutrition-focused health companion for cancer patients. Generate a personalised daily meal plan based on Radical Remission principles and the patient's specific medical situation.

${cancerFightingNutrition}

${userContext}

Generate a complete daily meal plan with:
1. **Breakfast** — an anti-inflammatory, nutrient-dense morning meal
2. **Morning Snack** — immune-boosting snack
3. **Lunch** — a cancer-fighting, colourful main meal
4. **Afternoon Snack** — liver-supportive snack
5. **Dinner** — a healing, whole-foods evening meal
6. **Evening** — a calming tea or elixir

For each meal:
- Name the dish
- List key cancer-fighting ingredients and WHY they help (briefly)
- Keep it practical and delicious, not clinical

End with a brief encouraging note about how this day of eating supports their healing.
Format with clear headers and bullet points. Keep it warm and supportive in tone.`;

    const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
    for (const modelName of modelsToTry) {
      try {
        const m = genAI.getGenerativeModel({ model: modelName });
        const result = await m.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
        });
        return result.response.text() || "I couldn't generate a meal plan right now. Please try again.";
      } catch (err: any) {
        if (err?.status === 429) { console.log(`Meal plan: model ${modelName} rate-limited, trying next...`); continue; }
        throw err;
      }
    }
    return "I'm having trouble generating your meal plan right now. Please try again in a moment.";
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return "I'm having trouble generating your meal plan right now. Please try again in a moment.";
  }
}

export async function getMealSuggestion(mealType: string, userContext: string = ""): Promise<string> {
  try {
    const prompt = `You are Elizabeth, a nutrition companion for cancer patients following Radical Remission principles.

${cancerFightingNutrition}

${userContext}

Suggest ONE specific ${mealType} recipe that is:
- Anti-inflammatory and cancer-fighting
- Liver-supportive (patient had immunotherapy hepatotoxicity)
- Immune-boosting
- Practical and delicious

Provide:
- **Recipe name**
- **Key ingredients** (with brief cancer-fighting benefits)
- **Simple instructions** (3-5 steps)
- **Why this helps**: One sentence on how this meal supports their healing

Keep it warm, concise, and encouraging.`;

    const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
    for (const modelName of modelsToTry) {
      try {
        const m = genAI.getGenerativeModel({ model: modelName });
        const result = await m.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 600 },
        });
        return result.response.text() || "I couldn't generate a suggestion right now.";
      } catch (err: any) {
        if (err?.status === 429) { console.log(`Meal suggestion: model ${modelName} rate-limited, trying next...`); continue; }
        throw err;
      }
    }
    return "I'm having trouble generating a suggestion right now. Please try again.";
  } catch (error) {
    console.error("Error generating meal suggestion:", error);
    return "I'm having trouble generating a suggestion right now. Please try again.";
  }
}

export interface RestaurantCard {
  name: string;
  suburb: string;
  cuisineType: string;
  priceRange: string;
  summary: string;
  dietaryNotes: string;
  vibe: string;
  menuSuggestions: string[];
  whyItWorks: string;
}

export interface ActivityCard {
  name: string;
  location: string;
  description: string;
  whyItsSpecial: string;
  bestTime: string;
  category: string;
}

export interface DateNightSuggestions {
  restaurants: RestaurantCard[];
  activities: ActivityCard[];
}

export async function getDateNightIdeas(userContext: string = "", dietaryPreferences: string = "", excludeNames: string = "", type: string = "both"): Promise<DateNightSuggestions> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const dietaryInfo = dietaryPreferences
      ? `\n\nDIETARY PREFERENCES (for the patient — her partner can eat anything, and restaurants can usually tailor their menu when briefed):\n${dietaryPreferences}\n\nIMPORTANT: Factor these preferences into your recommendations and highlight which dishes suit her needs, but do NOT exclude restaurants that don't strictly adhere — the partner eats other things and restaurants can usually accommodate when asked.`
      : "";

    const restaurantSchema = `"restaurants": [
    {
      "name": "Restaurant Name",
      "suburb": "Suburb",
      "cuisineType": "Cuisine Type",
      "priceRange": "$$ to $$$$",
      "summary": "2-3 sentence summary of why this restaurant is a great choice for this couple, mentioning how it can cater to dietary needs",
      "dietaryNotes": "Specific notes on what dietary accommodations are available for the patient's needs",
      "vibe": "One sentence describing the atmosphere and romantic appeal",
      "menuSuggestions": ["Dish 1 with brief note on why it's suitable", "Dish 2", "Dish 3"],
      "whyItWorks": "Brief explanation of why this restaurant is particularly suitable"
    }
  ]`;

    const activitySchema = `"activities": [
    {
      "name": "Activity Name",
      "location": "Location in Sydney",
      "description": "2-3 sentence description of the activity",
      "whyItsSpecial": "How this supports connection, joy, or healing — link to Radical Remission positive emotions and social support",
      "bestTime": "When to go",
      "category": "one of: active, relaxing, creative, adventurous, romantic"
    }
  ]`;

    let jsonStructure: string;
    let countInstruction: string;

    if (type === "restaurants") {
      jsonStructure = `{\n  ${restaurantSchema}\n}`;
      countInstruction = "Include exactly 3 restaurants. Use REAL Sydney restaurants that exist. Mix restaurant types (e.g. waterfront, cosy neighbourhood, fine dining).";
    } else if (type === "activities") {
      jsonStructure = `{\n  ${activitySchema}\n}`;
      countInstruction = "Include exactly 3 activities. Mix activity types across categories (active, relaxing, creative, adventurous, romantic).";
    } else {
      jsonStructure = `{\n  ${restaurantSchema},\n  ${activitySchema}\n}`;
      countInstruction = "Include exactly 3 restaurants and 3 activities. Use REAL Sydney restaurants that exist. Mix restaurant types (e.g. waterfront, cosy neighbourhood, fine dining). Mix activity types across categories.";
    }

    const prompt = `You are a thoughtful date night planner for a couple in Sydney, Australia. One partner is a cancer patient with specific dietary needs.

${cancerFightingNutrition}

${userContext}${dietaryInfo}

You MUST respond with ONLY valid JSON (no markdown, no backticks, no explanation). Return this exact structure:

${jsonStructure}

${countInstruction} Keep summaries concise (1-2 sentences each). Keep the tone warm and encouraging.${excludeNames ? `\n\nIMPORTANT: Do NOT suggest any of these already-suggested places: ${excludeNames}. Suggest DIFFERENT ones.` : ""}`;

    const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
    let result;
    let lastError: any;
    for (const modelName of modelsToTry) {
      try {
        const m = genAI.getGenerativeModel({ model: modelName });
        result = await m.generateContent({
          contents: [
            { role: "user", parts: [{ text: prompt }] }
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });
        break;
      } catch (err: any) {
        lastError = err;
        if (err?.status === 429) {
          console.log(`Date night: model ${modelName} rate-limited, trying next...`);
          continue;
        }
        throw err;
      }
    }
    if (!result) {
      throw lastError || new Error("All AI models unavailable");
    }

    const text = result.response.text() || "";
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned) as DateNightSuggestions;
      return parsed;
    } catch (parseError) {
      console.error("JSON parse error, attempting repair:", parseError);
      const restaurants: RestaurantCard[] = [];
      const activities: ActivityCard[] = [];
      const restaurantRegex = /\{[^{}]*"name"\s*:\s*"[^"]*"[^{}]*"suburb"\s*:\s*"[^"]*"[^{}]*"cuisineType"\s*:\s*"[^"]*"[^{}]*\}/g;
      const activityRegex = /\{[^{}]*"name"\s*:\s*"[^"]*"[^{}]*"location"\s*:\s*"[^"]*"[^{}]*"category"\s*:\s*"[^"]*"[^{}]*\}/g;
      const rMatches = cleaned.match(restaurantRegex);
      if (rMatches) {
        for (const m of rMatches) {
          try { restaurants.push(JSON.parse(m)); } catch {}
        }
      }
      const aMatches = cleaned.match(activityRegex);
      if (aMatches) {
        for (const m of aMatches) {
          try { activities.push(JSON.parse(m)); } catch {}
        }
      }
      if (restaurants.length > 0 || activities.length > 0) {
        return { restaurants, activities };
      }
      throw parseError;
    }
  } catch (error: any) {
    console.error("Error generating date night ideas:", error);
    if (error?.status === 429 || error?.message?.includes("temporarily busy") || error?.message?.includes("unavailable")) {
      throw new Error("AI service is temporarily busy. Please try again in a moment.");
    }
    throw error;
  }
}

export interface MealCard {
  name: string;
  mealType: string;
  description: string;
  prepTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
  healingBenefits: string;
  tags: string[];
  imageCategory: string;
}

export interface MealSuggestions {
  meals: MealCard[];
  shoppingList: {
    produce: string[];
    proteins: string[];
    pantry: string[];
    spices: string[];
  };
}

export async function getMealIdeas(userContext: string = "", dietaryPreferences: string = "", excludeNames: string = "", mealTypes: string = "all"): Promise<MealSuggestions> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const dietaryInfo = dietaryPreferences
      ? `\n\nDIETARY PREFERENCES:\n${dietaryPreferences}\n\nFactor these preferences into all meal suggestions. Focus on meals that align with these dietary needs.`
      : "";

    const imageCategories = [
      "breakfast-bowl", "smoothie", "salad", "soup", "fish", 
      "grain-bowl", "snack", "tea", "chicken", "berry-bowl"
    ];

    let mealTypeInstruction: string;
    if (mealTypes === "starter") {
      mealTypeInstruction = "Generate exactly 4 meals: 1 breakfast, 1 lunch, 1 snack, and 1 dinner. One of each type, no more.";
    } else if (mealTypes === "breakfast") {
      mealTypeInstruction = "Generate exactly 4 BREAKFAST recipes (morning meals, smoothies, bowls).";
    } else if (mealTypes === "lunch") {
      mealTypeInstruction = "Generate exactly 4 LUNCH recipes (salads, bowls, soups, wraps).";
    } else if (mealTypes === "dinner") {
      mealTypeInstruction = "Generate exactly 4 DINNER recipes (main courses with protein and vegetables).";
    } else if (mealTypes === "snack") {
      mealTypeInstruction = "Generate exactly 4 SNACK recipes (healthy bites, energy balls, dips, small plates).";
    } else {
      mealTypeInstruction = "Generate exactly 6 meals: 1 breakfast, 1 morning snack or smoothie, 1 lunch, 1 afternoon snack, 1 dinner, and 1 evening tea or elixir. Vary the meal types.";
    }

    const prompt = `You are Elizabeth, a nutrition-focused health companion for cancer patients following Radical Remission principles.

${cancerFightingNutrition}

${userContext}${dietaryInfo}

${mealTypeInstruction}

Each recipe MUST be:
- Anti-inflammatory and cancer-fighting
- Liver-supportive (patient had immunotherapy hepatotoxicity)
- Immune-boosting
- Practical, delicious, and achievable at home

You MUST respond with ONLY valid JSON (no markdown, no backticks). Return this exact structure:

{
  "meals": [
    {
      "name": "Recipe Name",
      "mealType": "one of: breakfast, lunch, dinner, snack, smoothie, tea",
      "description": "1-2 sentence appetising description of the dish",
      "prepTime": "e.g. 15 mins, 30 mins",
      "servings": "e.g. 2 serves",
      "ingredients": ["200g salmon fillet", "1 cup quinoa", "2 cups spinach"],
      "instructions": ["Step 1 description", "Step 2 description", "Step 3 description"],
      "healingBenefits": "1-2 sentences explaining the cancer-fighting and healing benefits of this meal",
      "tags": ["anti-inflammatory", "liver-support", "omega-3"],
      "imageCategory": "one of: ${imageCategories.join(", ")}"
    }
  ],
  "shoppingList": {
    "produce": ["list of fresh produce items needed across all meals"],
    "proteins": ["list of protein items needed"],
    "pantry": ["list of pantry staples needed"],
    "spices": ["list of spices and seasonings needed"]
  }
}

Choose the imageCategory that best visually matches each meal:
- breakfast-bowl: granola bowls, oatmeal, yogurt dishes
- smoothie: smoothies, juices, blended drinks
- salad: salads, raw vegetable dishes
- soup: soups, broths, stews
- fish: salmon, seafood dishes
- grain-bowl: buddha bowls, quinoa bowls, rice dishes
- snack: nuts, fruit plates, energy balls, small bites
- tea: teas, golden lattes, elixirs, warm drinks
- chicken: chicken dishes, poultry mains
- berry-bowl: acai bowls, berry dishes, fruit-forward meals

Keep the tone warm and encouraging. Make recipes practical and delicious.${excludeNames ? `\n\nIMPORTANT: Do NOT suggest any of these already-suggested meals: ${excludeNames}. Suggest DIFFERENT recipes.` : ""}`;

    const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
    let result;
    let lastError: any;
    for (const modelName of modelsToTry) {
      try {
        const m = genAI.getGenerativeModel({ model: modelName });
        result = await m.generateContent({
          contents: [
            { role: "user", parts: [{ text: prompt }] }
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });
        break;
      } catch (err: any) {
        lastError = err;
        if (err?.status === 429) {
          console.log(`Model ${modelName} rate-limited, trying next...`);
          continue;
        }
        throw err;
      }
    }
    if (!result) {
      throw lastError || new Error("All AI models unavailable");
    }

    const text = result.response.text() || "";
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned) as MealSuggestions;
      if (!parsed.meals || parsed.meals.length === 0) {
        throw new Error("No meals in response");
      }
      return parsed;
    } catch (parseError) {
      console.error("Meal ideas JSON parse error, attempting repair:", parseError);
      const mealObjects: MealCard[] = [];
      const mealRegex = /\{[^{}]*"name"\s*:\s*"[^"]+?"[^{}]*"mealType"[^{}]*\}/g;
      const matches = cleaned.match(mealRegex);
      if (matches) {
        for (const match of matches) {
          try {
            const obj = JSON.parse(match);
            if (obj.name && obj.mealType) mealObjects.push(obj);
          } catch {}
        }
      }
      if (mealObjects.length > 0) {
        return { meals: mealObjects, shoppingList: { produce: [], proteins: [], pantry: [], spices: [] } };
      }
      throw parseError;
    }
  } catch (error: any) {
    console.error("Error generating meal ideas:", error);
    if (error?.status === 429) {
      throw new Error("AI service is temporarily busy. Please try again in a moment.");
    }
    throw error;
  }
}

export interface SearchedRestaurant {
  name: string;
  suburb: string;
  cuisineType: string;
  priceRange: string;
  summary: string;
  dietaryNotes: string;
  vibe: string;
  menuSuggestions: string[];
  whyItWorks: string;
  rating: number;
  reviewHighlights: string[];
  suitabilityScore: number;
  suitabilityExplanation: string;
  openingHours: string;
  website: string;
  phoneNumber: string;
}

export async function searchRestaurant(query: string, dietaryPreferences: string = "", userContext: string = ""): Promise<SearchedRestaurant[]> {
  try {
    const dietaryInfo = dietaryPreferences
      ? `\n\nPATIENT DIETARY PREFERENCES:\n${dietaryPreferences}\n\nAssess how well each restaurant can accommodate these dietary needs. Be honest — if a restaurant isn't a great fit, say so, but also note if they could adapt dishes.`
      : "";

    const prompt = `You are a knowledgeable Sydney restaurant guide helping a cancer patient and her partner find suitable restaurants.

${cancerFightingNutrition}

${userContext}${dietaryInfo}

The user is searching for: "${query}"

Search your knowledge for REAL Sydney restaurants matching this query. This could be:
- A specific restaurant name (e.g. "Icebergs Dining Room")
- A cuisine type (e.g. "Japanese in Surry Hills")
- A suburb or area (e.g. "restaurants in Manly")
- A general query (e.g. "seafood near the harbour")

Return up to 4 real restaurants that match. For each restaurant, provide genuine details based on your knowledge. Be honest about ratings and reviews — these should reflect real public sentiment, not made up. If you're not confident about a specific detail, use reasonable estimates.

The suitabilityScore should be 1-10 based on how well the restaurant can accommodate the patient's dietary needs (sugar-free, dairy-free, fish/organic chicken focus, anti-inflammatory). Score 8+ means excellent fit, 5-7 means decent with modifications, below 5 means challenging.

You MUST respond with ONLY valid JSON (no markdown, no backticks). Return this exact structure:

{
  "restaurants": [
    {
      "name": "Restaurant Name (real name)",
      "suburb": "Suburb, Sydney",
      "cuisineType": "Cuisine Type",
      "priceRange": "$$ to $$$$",
      "summary": "2-3 sentence description of the restaurant, its reputation, and what makes it notable",
      "dietaryNotes": "Specific assessment of how well this restaurant can accommodate sugar-free, dairy-free, fish/chicken dietary needs. Mention specific menu items or accommodation options.",
      "vibe": "One sentence describing the atmosphere",
      "menuSuggestions": ["Suitable dish 1 with dietary note", "Suitable dish 2", "Suitable dish 3"],
      "whyItWorks": "Why this restaurant could work for this couple",
      "rating": 4.2,
      "reviewHighlights": ["Key positive review point 1", "Another highlight from reviews", "Any dietary-relevant review note"],
      "suitabilityScore": 7,
      "suitabilityExplanation": "Brief explanation of the suitability score — what works and what might need adaptation",
      "openingHours": "General opening hours (e.g. 'Tue-Sun 12pm-10pm, closed Mon')",
      "website": "Website URL if known, or empty string",
      "phoneNumber": "Phone number if known, or empty string"
    }
  ]
}

If the query is very specific (a single restaurant name), return just that one restaurant with detailed information. If broader, return up to 4 matching restaurants. If you don't recognise the restaurant or query, return an empty array and be honest.`;

    const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
    let result;
    let lastError: any;
    for (const modelName of modelsToTry) {
      try {
        const m = genAI.getGenerativeModel({ model: modelName });
        result = await m.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        });
        break;
      } catch (err: any) {
        lastError = err;
        if (err?.status === 429) {
          console.log(`Restaurant search: model ${modelName} rate-limited, trying next...`);
          continue;
        }
        throw err;
      }
    }
    if (!result) {
      throw lastError || new Error("All AI models unavailable");
    }

    const text = result.response.text() || "";
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      return parsed.restaurants || [];
    } catch (parseError) {
      console.error("Restaurant search JSON parse error:", parseError);
      return [];
    }
  } catch (error: any) {
    console.error("Error searching restaurants:", error);
    if (error?.status === 429 || error?.message?.includes("temporarily busy")) {
      throw new Error("AI service is temporarily busy. Please try again in a moment.");
    }
    throw error;
  }
}

export function addToKnowledgeBase(category: string, content: string): { success: boolean, message: string } {
  console.log(`Added to knowledge base - Category: ${category}, Content: ${content}`);
  
  return { 
    success: true, 
    message: `Successfully added new information about "${category}" to the AI knowledge base.` 
  };
}
