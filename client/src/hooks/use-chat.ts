import { useState, useEffect } from "react";
import { ChatMessage, sendMessage as sendMessageToApi } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "Hey there! I'm Elizabeth, your personal AI assistant. Ask me absolutely anything — health questions, recipe ideas, planning help, creative brainstorming, or just a chat. I also know your health profile, so I can give personalised advice when you need it."
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, dataUserId } = useUser();
  
  // Load messages from localStorage on initial load
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error("Error parsing saved messages:", error);
      }
    }
  }, []);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    const userMessage: ChatMessage = {
      role: "user",
      content: message
    };
    
    setIsLoading(true);
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await sendMessageToApi(message, dataUserId);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
      
      // Add fallback response if API fails
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearMessages = () => {
    setMessages([INITIAL_MESSAGE]);
    localStorage.removeItem("chatMessages");
  };
  
  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
}
