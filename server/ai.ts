import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "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"
});

export async function formatOpenAIResponse(userMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI health assistant named Elizabeth for a cancer support application. 
          Your purpose is to provide supportive, empathetic guidance to cancer patients based on the "Radical Remission" research.
          
          Important guidelines:
          1. Always be compassionate and empathetic in your responses
          2. Provide evidence-based information when available
          3. Emphasize that your suggestions complement, not replace, conventional medical treatment
          4. Focus on the nine factors from Radical Remission research when relevant: nutrition, stress management, exercise, emotional healing, spirituality, supplements, social support, deepening reasons for living, and taking control of health decisions
          5. When discussing treatments or supplements, always include disclaimers about consulting healthcare providers
          6. Keep responses concise but informative (maximum 2-3 paragraphs)
          7. If asked about medical diagnoses or specific treatment recommendations, remind users to consult their healthcare team
          8. Use a warm, supportive tone that acknowledges the challenges of cancer treatment`
        },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
}

export async function getAIHealthSuggestions(userId: number, healthData: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI health assistant for a cancer support application. 
          Analyze the user's health data and provide personalized suggestions based on the Radical Remission research.
          Format your response as JSON with the following structure:
          {
            "energyLevel": "Suggestion for energy level",
            "nutrition": "Nutrition suggestion",
            "stressManagement": "Stress management suggestion",
            "exercise": "Exercise suggestion",
            "sleepQuality": "Sleep quality suggestion"
          }`
        },
        { 
          role: "user", 
          content: `Here is my health data: ${JSON.stringify(healthData)}. Please provide personalized suggestions.` 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      error: "Failed to generate health suggestions"
    };
  }
}
