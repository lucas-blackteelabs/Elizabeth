import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, ShieldCheck, Wand2 } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

function formatBoldText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-primary">{part}</strong> : part
  );
}

function ChatBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "max-w-[85%] mb-3 p-3 rounded-lg font-body text-sm",
        isUser
          ? "bg-primary/30 border border-primary/40 text-foreground ml-auto rounded-br-sm"
          : "bg-muted border border-border text-foreground mr-auto rounded-bl-sm"
      )}
    >
      {role === "assistant" ? (
        <div className="space-y-1">
          {content.split('\n').map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-1" />;
            if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
              const text = trimmed.replace(/^[-•]\s*/, '');
              return (
                <div key={i} className="flex items-start gap-1.5 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 flex-shrink-0" />
                  <span>{formatBoldText(text)}</span>
                </div>
              );
            }
            if (/^\d+\.\s/.test(trimmed)) {
              return (
                <div key={i} className="flex items-start gap-1.5 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 flex-shrink-0" />
                  <span>{formatBoldText(trimmed.replace(/^\d+\.\s*/, ''))}</span>
                </div>
              );
            }
            if (trimmed.startsWith('#')) {
              const text = trimmed.replace(/^#+\s*/, '');
              return <p key={i} className="font-heading text-primary text-sm mt-2 mb-1">{text}</p>;
            }
            return <p key={i}>{formatBoldText(trimmed)}</p>;
          })}
        </div>
      ) : (
        <p>{content}</p>
      )}
    </div>
  );
}

export default function AIChatButton({ isMobileNavEmbedded = false }: { isMobileNavEmbedded?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { messages, isLoading, sendMessage } = useChat();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    await sendMessage(inputValue);
    setInputValue("");
  };

  const magicButton = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "relative group transition-all duration-500",
        isMobileNavEmbedded
          ? "w-14 h-14 -mt-7 rounded-full flex items-center justify-center"
          : "fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center",
        isOpen
          ? "scale-90"
          : "hover:scale-110 animate-magic-float"
      )}
    >
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-500",
        isOpen
          ? "bg-muted-foreground"
          : "bg-gradient-to-br from-primary via-primary to-primary/90"
      )} />

      {!isOpen && (
        <>
          <div className="absolute inset-[-4px] rounded-full bg-primary/25 animate-ping" style={{ animationDuration: "2.5s" }} />
          <div className="absolute inset-[-2px] rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-sm" />
          <div className="absolute inset-[-6px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/20 to-accent/15 blur-md" />
        </>
      )}

      <div className={cn(
        "absolute inset-0 rounded-full shadow-lg transition-all duration-300",
        !isOpen && "shadow-[0_4px_20px_rgba(122,155,118,0.35)] group-hover:shadow-[0_6px_28px_rgba(122,155,118,0.5)]"
      )} />

      <div className="relative z-10 text-white">
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Wand2 className="h-6 w-6 transition-transform duration-700 group-hover:rotate-12" />
        )}
      </div>

      {!isOpen && (
        <span className="absolute -top-0.5 -right-0.5 z-20 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-50" style={{ animationDuration: "2s" }} />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-accent items-center justify-center">
            <Sparkles className="h-2.5 w-2.5 text-white" />
          </span>
        </span>
      )}
    </button>
  );

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      {isOpen && (
        <div className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-[420px] z-50 bg-white border border-border rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 duration-300" style={{ maxHeight: "70vh" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary p-1.5 rounded-full">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-heading text-sm text-accent tracking-wide">Elizabeth AI</h3>
                <p className="text-[10px] text-muted-foreground font-body">Ask me anything about your health journey</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 min-h-0" style={{ maxHeight: "calc(70vh - 120px)" }}>
            {messages.map((message, index) => (
              <ChatBubble key={index} role={message.role} content={message.content} />
            ))}
            {isLoading && (
              <div className="flex space-x-2 p-3 max-w-[80%] bg-muted border border-border rounded-lg mr-auto">
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"></div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground font-body focus:outline-none focus:border-primary/40"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[10px] text-muted-foreground font-body">Powered by Google Gemini</span>
              <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> HIPAA Compliant
              </span>
            </div>
          </form>
        </div>
      )}

      {!isMobileNavEmbedded && magicButton}
      {isMobileNavEmbedded && magicButton}
    </>
  );
}
