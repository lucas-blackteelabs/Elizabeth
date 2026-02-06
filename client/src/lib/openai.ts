import { apiRequest } from "./queryClient";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendMessage(message: string, userId?: number): Promise<ChatMessage> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, userId }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

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
    title: "Liver-Supportive Nutrition",
    description: "Foods that support liver recovery and immune health",
    prompt: "What are the best foods to support my liver recovery after hepatitis from immunotherapy, while also boosting my immune system against melanoma?"
  },
  {
    icon: "person-walking",
    title: "Movement for Recovery",
    description: "Safe exercise during surveillance",
    prompt: "What kinds of exercise are most beneficial during active surveillance after immunotherapy? I want to support my immune system and overall health."
  },
  {
    icon: "heart-pulse",
    title: "Managing Scan Anxiety",
    description: "Coping with scanxiety before results",
    prompt: "I have a scan coming up and I'm feeling anxious about it. What mind-body techniques can help me manage scanxiety and stay positive?"
  },
  {
    icon: "hand-holding-heart",
    title: "Immune System Support",
    description: "Natural ways to support immunity",
    prompt: "What holistic approaches and supplements can help support my immune system's ability to continue fighting melanoma during surveillance?"
  }
];
