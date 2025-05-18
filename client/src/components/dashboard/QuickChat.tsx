import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function QuickChat() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<{role: "user" | "assistant", content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage("");
    
    // Add user message to conversation
    setConversation(prev => [...prev, { role: "user", content: userMessage }]);
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the OpenAI API
      // For now, we'll simulate a response since we don't have an active OpenAI API key
      
      setTimeout(() => {
        const aiResponse = generateSampleResponse(userMessage);
        setConversation(prev => [...prev, { role: "assistant", content: aiResponse }]);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // This function generates sample responses based on user input keywords
  // In a real implementation, this would be replaced with actual OpenAI API calls
  const generateSampleResponse = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! I'm your AI health assistant. How can I support your healing journey today?";
    }
    else if (lowerMessage.includes("meditation") || lowerMessage.includes("stress")) {
      return "Meditation can be very helpful for cancer patients. Try the 4-7-8 breathing technique: breathe in for 4 seconds, hold for 7, and exhale for 8. This activates your parasympathetic nervous system and helps reduce stress.";
    }
    else if (lowerMessage.includes("food") || lowerMessage.includes("diet") || lowerMessage.includes("nutrition")) {
      return "A plant-based, anti-inflammatory diet is often recommended for cancer patients. Try incorporating more colorful vegetables, berries, leafy greens, and omega-3 rich foods like flaxseeds. Would you like some specific recipe suggestions?";
    }
    else if (lowerMessage.includes("exercise") || lowerMessage.includes("movement")) {
      return "Gentle movement like walking, swimming, or yoga can be beneficial during cancer treatment. Start with just 5-10 minutes daily and gradually increase as your energy allows. Always consult your healthcare provider about what's appropriate for your specific situation.";
    }
    else if (lowerMessage.includes("supplement")) {
      return "Some supplements like vitamin D, omega-3, and certain mushroom extracts may support immune function, but it's crucial to discuss any supplements with your oncologist as some can interfere with treatments. Would you like information about specific supplements?";
    }
    else if (lowerMessage.includes("sleep")) {
      return "Quality sleep is essential for healing. Try maintaining a consistent sleep schedule, keeping your bedroom cool and dark, and avoiding screens before bed. Magnesium glycinate and gentle stretching before bedtime can also help improve sleep quality.";
    }
    else {
      return "That's an interesting question about your health journey. The nine factors from Radical Remission research include nutrition, stress management, emotional healing, spiritual connection, exercise, and social support. Which area would you like to explore more deeply?";
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            AI
          </span>
          Health Assistant
        </CardTitle>
        <CardDescription>
          Ask me about nutrition, stress management, supplements and more
        </CardDescription>
      </CardHeader>
      <CardContent className="h-40 overflow-y-auto space-y-3 text-sm">
        {conversation.length === 0 ? (
          <div className="text-muted-foreground text-center my-4">
            Ask a question to get started
          </div>
        ) : (
          conversation.map((msg, i) => (
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
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Ask me anything..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !message.trim()}>
            {isLoading ? (
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