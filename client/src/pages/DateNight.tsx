import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { Heart, Sparkles, Loader2, RefreshCw, MapPin, Utensils, Star, Music } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-[hsl(25,30%,22%)]">{part}</strong> : part
  );
}

function AIContent({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="text-sm text-[hsl(25,18%,42%)] font-body leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
          const text = trimmed.replace(/^#+\s*/, '');
          return <p key={i} className="font-heading text-primary text-sm mt-3 mb-1">{text}</p>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const text = trimmed.replace(/^[-•]\s*/, '');
          return (
            <div key={i} className="flex items-start gap-1.5 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 flex-shrink-0" />
              <span>{formatBold(text)}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div key={i} className="flex items-start gap-1.5 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 flex-shrink-0" />
              <span>{formatBold(trimmed.replace(/^\d+\.\s*/, ''))}</span>
            </div>
          );
        }
        return <p key={i}>{formatBold(trimmed)}</p>;
      })}
    </div>
  );
}

export default function DateNight() {
  const { user } = useUser();
  const [ideas, setIdeas] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateIdeas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/date-night", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setIdeas(data.content || "No ideas were generated. Please try again.");
    } catch {
      setIdeas("Sorry, I couldn't generate date night ideas right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center gap-3 mb-3">
          <Heart className="h-7 w-7 text-[hsl(0,55%,60%)] fill-[hsl(0,55%,60%)]/20" />
          <h1 className="text-3xl font-heading text-[hsl(25,35%,22%)] tracking-wide">Date Night</h1>
          <Heart className="h-7 w-7 text-[hsl(0,55%,60%)] fill-[hsl(0,55%,60%)]/20" />
        </div>
        <p className="text-[hsl(25,18%,48%)] font-body text-sm max-w-lg mx-auto">
          Celebrating your love and making beautiful memories together
        </p>
      </div>

      <Card className="bg-gradient-to-br from-[hsl(0,40%,97%)] to-[hsl(34,40%,96%)] border-[hsl(0,30%,88%)] mb-6">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center gap-2 mb-3">
            <Star className="h-4 w-4 text-[hsl(34,55%,52%)]" />
            <Music className="h-4 w-4 text-[hsl(34,55%,52%)]" />
            <MapPin className="h-4 w-4 text-[hsl(34,55%,52%)]" />
          </div>
          <p className="text-sm text-[hsl(25,30%,28%)] font-body leading-relaxed max-w-md mx-auto">
            Taking time for each other is a beautiful part of healing. Connection, laughter, and love are powerful medicine.
            You and your partner deserve moments of joy and togetherness — let us help you plan something special.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(34,55%,52%)]" />
            Personalised Date Night Ideas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[hsl(25,18%,48%)] font-body mb-4">
            Get AI-curated restaurant recommendations and activity suggestions tailored for a wonderful evening together — with your comfort and energy levels in mind.
          </p>

          {!ideas && !loading && (
            <Button
              onClick={generateIdeas}
              className="bg-primary text-white hover:bg-primary/90 font-heading tracking-wide gap-2"
            >
              <Sparkles className="h-4 w-4" /> Generate Ideas
            </Button>
          )}

          {loading && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-sm text-[hsl(25,18%,48%)] font-body">Planning something special for you two...</p>
            </div>
          )}

          {ideas && !loading && (
            <div>
              <div className="bg-[hsl(30,30%,95%)] border border-[hsl(30,22%,87%)] rounded-xl p-5 mb-4">
                <AIContent content={ideas} />
              </div>
              <Button
                variant="outline"
                onClick={generateIdeas}
                className="border-primary/30 text-primary hover:bg-primary/10 font-body gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Get New Ideas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] rounded-xl">
          <CardContent className="p-5 text-center">
            <Utensils className="h-8 w-8 text-primary/40 mx-auto mb-2" />
            <h3 className="font-heading text-sm text-[hsl(25,30%,28%)] mb-1">Restaurant Ideas</h3>
            <p className="text-xs text-[hsl(25,18%,48%)] font-body">
              Cosy spots with nourishing menus you'll both love
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] rounded-xl">
          <CardContent className="p-5 text-center">
            <Music className="h-8 w-8 text-[hsl(34,55%,52%)]/40 mx-auto mb-2" />
            <h3 className="font-heading text-sm text-[hsl(25,30%,28%)] mb-1">Activities</h3>
            <p className="text-xs text-[hsl(25,18%,48%)] font-body">
              Fun experiences tailored to your energy and interests
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] rounded-xl">
          <CardContent className="p-5 text-center">
            <MapPin className="h-8 w-8 text-[hsl(0,45%,65%)]/40 mx-auto mb-2" />
            <h3 className="font-heading text-sm text-[hsl(25,30%,28%)] mb-1">Local Gems</h3>
            <p className="text-xs text-[hsl(25,18%,48%)] font-body">
              Hidden treasures and beloved favourites nearby
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
