import { useState, useRef, useEffect } from "react";
import { Bot, Layers, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
}

function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";
  return (
    <div 
      className={cn(
        "max-w-[80%] mb-3 p-3 rounded-lg font-body",
        isUser 
          ? "bg-primary/30 border border-primary/40 text-[hsl(25,30%,22%)] ml-auto rounded-br-sm" 
          : "bg-[hsl(30,22%,93%)] border border-[hsl(30,22%,85%)] text-[hsl(25,30%,28%)] mr-auto rounded-bl-sm"
      )}
    >
      {role === "assistant" ? (
        <div dangerouslySetInnerHTML={{ 
          __html: content.replace(/\n/g, '<br>').replace(
            /\*\*(.*?)\*\*/g, 
            '<strong class="text-gold">$1</strong>'
          ).replace(
            /•\s(.*?)(?=\n|$)/g,
            '• <span>$1</span><br>'
          ) 
        }} />
      ) : (
        <p>{content}</p>
      )}
    </div>
  );
}

export default function ChatInterface() {
  const { messages, isLoading, sendMessage } = useChat();
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    await sendMessage(inputValue);
    setInputValue("");
  };
  
  return (
    <Card className="mb-6 bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gold/10 text-gold p-2 rounded-full border border-gold/20">
              <Bot className="h-5 w-5" />
            </div>
            <CardTitle className="font-heading text-gold tracking-wide">Elizabeth AI</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-[hsl(30,30%,95%)] rounded border border-[hsl(30,25%,87%)]">
          <p className="text-sm text-[hsl(25,18%,48%)] font-body">
            I'm here to provide information and support for your cancer journey. I can help with questions about nutrition, exercise, supplements, and emotional wellbeing. Remember that my guidance complements but doesn't replace medical advice from your healthcare team.
          </p>
        </div>
        
        <div 
          ref={chatContainerRef}
          className="h-80 overflow-y-auto mb-4 scrollbar-hide"
        >
          {messages.map((message, index) => (
            <ChatBubble 
              key={index} 
              role={message.role} 
              content={message.content} 
            />
          ))}
          {isLoading && (
            <div className="flex space-x-2 p-3 max-w-[80%] bg-[hsl(30,22%,93%)] border border-[hsl(30,22%,85%)] rounded-lg mr-auto">
              <div className="w-2 h-2 rounded-full bg-gold/50 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 rounded-full bg-gold/50 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 rounded-full bg-gold/50 animate-bounce"></div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSendMessage} className="relative">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your question here..."
            className="pr-12 bg-[hsl(30,30%,95%)] border-[hsl(30,22%,85%)] text-[hsl(25,30%,22%)] placeholder:text-[hsl(25,15%,55%)] font-body focus:border-gold/40"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost" 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gold hover:text-gold/80"
            disabled={isLoading}
          >
            <Layers className="h-5 w-5" />
          </Button>
        </form>
        
        <Separator className="my-3 bg-[hsl(30,25%,87%)]" />
        
        <div className="text-xs text-[hsl(28,15%,50%)] flex justify-between items-center font-body">
          <span>Powered by OpenAI</span>
          <span className="flex items-center">
            <ShieldCheck className="h-3 w-3 mr-1" /> HIPAA Compliant
          </span>
        </div>
      </CardContent>
    </Card>
  );
}