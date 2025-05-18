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
        "max-w-[80%] mb-3 p-3 rounded-lg",
        isUser 
          ? "bg-primary text-white ml-auto rounded-br-sm" 
          : "bg-gray-100 text-gray-800 mr-auto rounded-bl-sm"
      )}
    >
      {role === "assistant" ? (
        <div dangerouslySetInnerHTML={{ 
          __html: content.replace(/\n/g, '<br>').replace(
            /\*\*(.*?)\*\*/g, 
            '<strong>$1</strong>'
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
  
  // Auto-scroll to bottom when messages change
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
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 text-primary p-2 rounded-full">
              <Bot className="h-5 w-5" />
            </div>
            <CardTitle>Elizabeth AI</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
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
            <div className="flex space-x-2 p-3 max-w-[80%] bg-gray-100 rounded-lg mr-auto">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSendMessage} className="relative">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your question here..."
            className="pr-12"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost" 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80"
            disabled={isLoading}
          >
            <Layers className="h-5 w-5" />
          </Button>
        </form>
        
        <Separator className="my-3" />
        
        <div className="text-xs text-gray-500 flex justify-between items-center">
          <span>Powered by OpenAI</span>
          <span className="flex items-center">
            <ShieldCheck className="h-3 w-3 mr-1" /> HIPAA Compliant
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
