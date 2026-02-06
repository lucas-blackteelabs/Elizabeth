import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import ChatInterface from "@/components/ai-assistant/ChatInterface";
import SuggestedTopics from "@/components/ai-assistant/SuggestedTopics";
import { useChat } from "@/hooks/use-chat";

export default function AIAssistant() {
  const { sendMessage } = useChat();
  
  const handleSelectTopic = (prompt: string) => {
    sendMessage(prompt);
  };
  
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="AI Health Assistant"
        description="Ask questions about your health, treatment, and wellness journey"
      />
      
      <ChatInterface />
      
      <SuggestedTopics onSelectTopic={handleSelectTopic} />
    </div>
  );
}