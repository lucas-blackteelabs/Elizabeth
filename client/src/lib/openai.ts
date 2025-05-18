import { apiRequest } from "./queryClient";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendMessage(message: string): Promise<ChatMessage> {
  const response = await apiRequest(
    "POST", 
    "/api/ai/chat", 
    { message }
  );
  
  const data = await response.json();
  return data;
}

export interface ChatSuggestion {
  icon: string;
  title: string;
  description: string;
  prompt: string;
}

export const chatSuggestions: ChatSuggestion[] = [
  {
    icon: "apple-whole",
    title: "Nutrition During Treatment",
    description: "Foods that help with side effects",
    prompt: "What are the best foods to eat during chemotherapy to reduce side effects and support healing?"
  },
  {
    icon: "person-walking",
    title: "Safe Exercise Options",
    description: "Staying active during recovery",
    prompt: "Can you recommend gentle exercises that are safe during cancer treatment? I want to maintain some activity but I get tired easily."
  },
  {
    icon: "bed",
    title: "Improving Sleep",
    description: "Better rest during treatment",
    prompt: "I'm having trouble sleeping during my treatment. What natural approaches might help me get better sleep?"
  },
  {
    icon: "hand-holding-heart",
    title: "Managing Anxiety",
    description: "Techniques for emotional balance",
    prompt: "What are some effective techniques for managing anxiety related to my cancer diagnosis and treatment?"
  }
];
