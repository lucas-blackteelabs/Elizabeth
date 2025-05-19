import OpenAI from "openai";

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Custom knowledge base about Radical Remission factors
// This can be expanded with more detailed information
const radicalRemissionKnowledge = `
# The Nine Factors of Radical Remission

1. Radically changing your diet
   - Focus on plant-based, whole foods
   - Reduce sugar, meat, dairy, and processed foods
   - Emphasize organic vegetables, fruits, whole grains, and healthy fats
   - Many survivors adopt juicing practices

2. Taking control of your health
   - Becoming an active participant in health decisions
   - Researching treatment options
   - Seeking second opinions
   - Developing a collaborative relationship with healthcare providers

3. Following your intuition
   - Listening to the body's signals
   - Trusting inner guidance about treatment decisions
   - Balancing analytical thinking with intuitive insights

4. Using herbs and supplements
   - Common supplements include vitamin D, vitamin C, and turmeric
   - Medicinal mushrooms like reishi, turkey tail, and shiitake
   - Green tea and herbal adaptogens
   - Always discuss with healthcare providers to avoid interactions

5. Releasing suppressed emotions
   - Addressing unresolved emotional trauma
   - Practices include therapy, journaling, and emotional release techniques
   - Acknowledging and processing difficult feelings

6. Increasing positive emotions
   - Daily gratitude practice
   - Laughter and joy as medicine
   - Focusing on hope and possibility
   - Mindfulness and staying present

7. Embracing social support
   - Building a strong support network
   - Support groups specific to cancer type
   - Maintaining meaningful connections
   - Asking for and accepting help

8. Deepening spiritual connection
   - Personal spiritual practices (not necessarily religious)
   - Meditation, prayer, or connection with nature
   - Finding meaning and purpose
   - Developing a sense of peace and acceptance

9. Having strong reasons for living
   - Identifying core values and priorities
   - Setting meaningful goals
   - Connecting with purpose beyond illness
   - Focusing on relationships and contributions
`;

/**
 * Function to get health advice from OpenAI based on user query
 * Includes custom knowledge about Radical Remission factors
 */
export async function getHealthAdvice(userQuery: string): Promise<string> {
  try {
    // Construct a prompt that includes our knowledge base
    const prompt = `
You are a compassionate health assistant for cancer patients following the "Radical Remission" approach.
Use the following information about the nine factors of Radical Remission as your knowledge base:

${radicalRemissionKnowledge}

IMPORTANT GUIDELINES:
- Always be supportive, empathetic, and hopeful while remaining factual
- Clarify that you're complementing conventional medical treatment, not replacing it
- When discussing specific practices, include practical, actionable steps
- If asked about something outside your knowledge, acknowledge limitations
- Never claim that these approaches can cure cancer
- Always emphasize consulting with healthcare providers

User question: ${userQuery}

Provide a helpful, concise response:
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // The newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: "You are a knowledgeable health assistant for cancer patients." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't process your request at this time.";
  } catch (error) {
    console.error("Error querying OpenAI:", error);
    return "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
}

/**
 * Function to add new content to the knowledge base
 * This could be expanded to store in a database
 */
export function addToKnowledgeBase(category: string, content: string): { success: boolean, message: string } {
  // In a real implementation, this would update a database
  // For now, we'll just acknowledge the addition
  console.log(`Added to knowledge base - Category: ${category}, Content: ${content}`);
  
  return { 
    success: true, 
    message: `Successfully added new information about "${category}" to the AI knowledge base.` 
  };
}