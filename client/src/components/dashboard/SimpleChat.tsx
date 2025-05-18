import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function SimpleChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: input }]);
    
    // Simulate AI response
    setLoading(true);
    const userInput = input;
    setInput("");
    
    setTimeout(() => {
      const response = getResponse(userInput);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setLoading(false);
    }, 1000);
  };

  const getResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("hello") || lowerQuery.includes("hi")) {
      return "Hello! I'm your health assistant. How can I help you on your healing journey today?";
    }
    
    if (lowerQuery.includes("nutrition") || lowerQuery.includes("food") || lowerQuery.includes("diet")) {
      return "A plant-based, anti-inflammatory diet is beneficial. Focus on colorful vegetables, fruits, whole grains, and healthy fats. Would you like some specific meal suggestions?";
    }
    
    if (lowerQuery.includes("stress") || lowerQuery.includes("anxiety") || lowerQuery.includes("meditation")) {
      return "Managing stress is crucial for healing. Try daily meditation, deep breathing exercises, or gentle yoga. Even 10 minutes can make a significant difference.";
    }
    
    if (lowerQuery.includes("sleep")) {
      return "Quality sleep is essential for healing. Create a consistent sleep schedule, keep your bedroom cool and dark, and avoid screens before bedtime for better rest.";
    }
    
    if (lowerQuery.includes("exercise") || lowerQuery.includes("movement")) {
      return "Gentle movement like walking, swimming, or yoga can be beneficial. Start with just 5-10 minutes daily and gradually increase as your energy allows.";
    }
    
    return "I'm here to support you on your healing journey. The Radical Remission research highlights nine key factors including nutrition, stress management, emotional healing, and social support. Would you like more information about any specific factor?";
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">AI</span>
          Health Assistant
        </CardTitle>
        <CardDescription>Ask me about your health journey</CardDescription>
      </CardHeader>
      <CardContent className="h-36 overflow-y-auto space-y-3 text-sm">
        {messages.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            Ask me anything about nutrition, stress management, or healing practices
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}