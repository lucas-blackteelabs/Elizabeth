import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { sendMessage as sendMessageToApi } from "@/lib/openai";
import { useUser } from "@/contexts/UserContext";

function formatBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-primary">{part}</strong> : part
  );
}

export default function QuickChat() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<{role: "user" | "assistant", content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage("");
    
    setConversation(prev => [...prev, { role: "user", content: userMessage }]);
    
    setIsLoading(true);
    
    try {
      const response = await sendMessageToApi(userMessage, user?.id);
      setConversation(prev => [...prev, { role: "assistant", content: response.content }]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive",
      });
      setConversation(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-md bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2 font-heading text-[hsl(34,55%,45%)]">
          <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
            AI
          </span>
          Health Assistant
        </CardTitle>
        <CardDescription className="font-body text-[hsl(25,18%,48%)]">
          Ask me about nutrition, stress management, supplements and more
        </CardDescription>
      </CardHeader>
      <CardContent className="h-40 overflow-y-auto space-y-3 text-sm">
        {conversation.length === 0 ? (
          <div className="text-[hsl(25,18%,48%)] text-center my-4 font-body">
            Ask a question to get started
          </div>
        ) : (
          conversation.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg px-3 py-2 font-body ${
                  msg.role === "user" 
                    ? "bg-primary/30 border border-primary/40 text-[hsl(25,30%,22%)]" 
                    : "bg-[hsl(30,22%,93%)] border border-[hsl(30,22%,85%)] text-[hsl(25,30%,28%)]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="space-y-1">
                    {msg.content.split('\n').map((line, j) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <div key={j} className="h-1" />;
                      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                        return (
                          <div key={j} className="flex items-start gap-1.5 ml-1">
                            <span className="w-1 h-1 rounded-full bg-primary/50 mt-2 flex-shrink-0" />
                            <span>{formatBoldText(trimmed.replace(/^[-•]\s*/, ''))}</span>
                          </div>
                        );
                      }
                      return <p key={j}>{formatBoldText(trimmed)}</p>;
                    })}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-3 py-2 bg-[hsl(30,22%,93%)] border border-[hsl(30,22%,85%)] flex items-center gap-2 font-body">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-[hsl(25,18%,48%)]">Thinking...</span>
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
            className="flex-1 bg-[hsl(30,30%,95%)] border-[hsl(30,22%,85%)] text-[hsl(25,30%,22%)] placeholder:text-[hsl(25,15%,55%)] font-body"
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
