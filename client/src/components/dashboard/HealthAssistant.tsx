import { useState, useRef, useEffect } from "react";
import { Send, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Message type for our chat
type Message = {
  role: "user" | "assistant";
  content: string;
};

// Knowledge addition type
type KnowledgeAddition = {
  category: string;
  content: string;
};

export default function HealthAssistant() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState<KnowledgeAddition>({
    category: "",
    content: ""
  });
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle sending a message to the AI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get a response from the AI assistant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding new knowledge to the AI
  const handleAddKnowledge = async () => {
    if (!newKnowledge.category.trim() || !newKnowledge.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a category and content.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch("/api/ai/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newKnowledge),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add knowledge");
      }
      
      const data = await response.json();
      
      toast({
        title: "Knowledge added",
        description: data.message,
      });
      
      // Reset form and close dialog
      setNewKnowledge({ category: "", content: "" });
      setKnowledgeOpen(false);
    } catch (error) {
      console.error("Error adding knowledge:", error);
      toast({
        title: "Error",
        description: "Failed to add knowledge to the AI assistant.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-md h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">AI</span>
              Health Assistant
            </CardTitle>
            <CardDescription>Ask me about your healing journey</CardDescription>
          </div>
          <Dialog open={knowledgeOpen} onOpenChange={setKnowledgeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Knowledge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Knowledge to AI Assistant</DialogTitle>
                <DialogDescription>
                  Add specific information about treatments, research, or personal experiences to enhance the AI's responses.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">Category</label>
                  <Input
                    id="category"
                    placeholder="Nutrition, Supplements, Treatment, etc."
                    value={newKnowledge.category}
                    onChange={(e) => setNewKnowledge(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">Content</label>
                  <Textarea
                    id="content"
                    placeholder="Enter detailed information here..."
                    rows={5}
                    value={newKnowledge.content}
                    onChange={(e) => setNewKnowledge(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setKnowledgeOpen(false)}>Cancel</Button>
                <Button onClick={handleAddKnowledge}>Add to Knowledge Base</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto pt-2 pb-0">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-center py-8 px-4">
              <p className="mb-2">Ask me about:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Nutrition", "Supplements", "Mind-Body", "Emotions", "Spiritual Connection", "Exercise", "Support"].map((topic) => (
                  <Button 
                    key={topic} 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => setMessage(`Tell me about ${topic.toLowerCase()} for cancer healing`)}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-2 border-t mt-2">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            placeholder="Ask about nutrition, stress, supplements..."
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