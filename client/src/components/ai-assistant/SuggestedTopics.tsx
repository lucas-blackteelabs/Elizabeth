import { Apple, PersonStanding, Bed, Heart } from "lucide-react";
import { chatSuggestions } from "@/lib/openai";
import { Button } from "@/components/ui/button";

interface SuggestedTopicProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function SuggestedTopic({ icon, title, description, onClick }: SuggestedTopicProps) {
  return (
    <Button
      variant="outline"
      className="bg-[hsl(25,16%,17%)] border-[hsl(25,10%,27%)] p-4 rounded text-left hover:border-gold/30 hover:bg-[hsl(25,14%,19%)] transition-all h-auto"
      onClick={onClick}
    >
      <div className="flex flex-col items-start gap-2">
        <div className="text-gold mb-2">
          {icon}
        </div>
        <h3 className="font-heading text-sm text-[hsl(30,25%,90%)] mb-1">{title}</h3>
        <p className="text-sm text-[hsl(28,15%,55%)] font-body">{description}</p>
      </div>
    </Button>
  );
}

interface SuggestedTopicsProps {
  onSelectTopic: (prompt: string) => void;
}

export default function SuggestedTopics({ onSelectTopic }: SuggestedTopicsProps) {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'apple-whole':
        return <Apple className="h-5 w-5" />;
      case 'person-walking':
        return <PersonStanding className="h-5 w-5" />;
      case 'bed':
        return <Bed className="h-5 w-5" />;
      case 'hand-holding-heart':
        return <Heart className="h-5 w-5" />;
      default:
        return <Apple className="h-5 w-5" />;
    }
  };

  return (
    <div>
      <h2 className="text-lg font-heading text-gold tracking-wide mb-4">Suggested Topics</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {chatSuggestions.map((suggestion, index) => (
          <SuggestedTopic
            key={index}
            icon={getIconComponent(suggestion.icon)}
            title={suggestion.title}
            description={suggestion.description}
            onClick={() => onSelectTopic(suggestion.prompt)}
          />
        ))}
      </div>
    </div>
  );
}