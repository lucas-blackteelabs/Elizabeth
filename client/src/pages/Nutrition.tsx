import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Apple, Utensils, ShoppingCart, Heart, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

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

function formatBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-[hsl(25,30%,22%)]">{part}</strong> : part
  );
}

export default function Nutrition() {
  const { user } = useUser();
  const [mealPlan, setMealPlan] = useState<string | null>(null);
  const [mealPlanLoading, setMealPlanLoading] = useState(false);
  const [mealSuggestion, setMealSuggestion] = useState<string | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);

  const generateMealPlan = async () => {
    setMealPlanLoading(true);
    try {
      const res = await fetch("/api/ai/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setMealPlan(data.content || "No meal plan was generated. Please try again.");
    } catch {
      setMealPlan("Sorry, I couldn't generate a meal plan right now. Please try again.");
    } finally {
      setMealPlanLoading(false);
    }
  };

  const generateMealSuggestion = async (mealType: string) => {
    setSelectedMealType(mealType);
    setSuggestionLoading(true);
    setMealSuggestion(null);
    try {
      const res = await fetch("/api/ai/meal-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealType, userId: user?.id }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setMealSuggestion(data.content || "No suggestion was generated. Please try again.");
    } catch {
      setMealSuggestion("Sorry, I couldn't generate a suggestion right now. Please try again.");
    } finally {
      setSuggestionLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Nutrition Centre"
        description="Liver-supportive, anti-inflammatory foods to fuel your healing"
      />

      <Card className="bg-primary/10 border-primary/20 mb-6">
        <CardContent className="p-4">
          <p className="text-sm text-[hsl(25,30%,28%)] font-body">
            <span className="font-medium">For your situation:</span> After immunotherapy-related hepatitis, focus on liver-supportive and anti-inflammatory foods. Your liver is recovering beautifully — nourish it with gentle, whole foods that also support your immune system's ongoing work against melanoma.
          </p>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="ai-plan">
        <TabsList className="mb-6 bg-[hsl(30,30%,95%)] border border-[hsl(30,25%,87%)]">
          <TabsTrigger value="ai-plan" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Sparkles className="h-4 w-4 mr-2" /> AI Meal Plan
          </TabsTrigger>
          <TabsTrigger value="recipes" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Utensils className="h-4 w-4 mr-2" /> Recipes
          </TabsTrigger>
          <TabsTrigger value="liver" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Heart className="h-4 w-4 mr-2" /> Liver Support
          </TabsTrigger>
          <TabsTrigger value="shopping" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <ShoppingCart className="h-4 w-4 mr-2" /> Shopping List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-plan">
          <div className="space-y-6">
            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[hsl(34,55%,52%)]" />
                  Your Personalised Daily Meal Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body mb-4">
                  Get a personalised cancer-fighting meal plan based on Radical Remission nutrition principles, tailored to your specific situation — liver recovery, immune support, and anti-inflammatory focus.
                </p>
                
                {!mealPlan && !mealPlanLoading && (
                  <Button 
                    onClick={generateMealPlan}
                    className="bg-primary text-white hover:bg-primary/90 font-heading tracking-wide gap-2"
                  >
                    <Sparkles className="h-4 w-4" /> Generate My Meal Plan
                  </Button>
                )}

                {mealPlanLoading && (
                  <div className="flex items-center gap-3 py-8 justify-center">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <p className="text-sm text-[hsl(25,18%,48%)] font-body">Creating your personalised meal plan...</p>
                  </div>
                )}

                {mealPlan && !mealPlanLoading && (
                  <div>
                    <div className="bg-[hsl(30,30%,95%)] border border-[hsl(30,22%,87%)] rounded-lg p-5 mb-4">
                      <AIContent content={mealPlan} />
                    </div>
                    <Button 
                      variant="outline"
                      onClick={generateMealPlan}
                      className="border-primary/30 text-primary hover:bg-primary/10 font-body gap-2"
                    >
                      <RefreshCw className="h-4 w-4" /> Generate a New Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  Quick Meal Idea
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body mb-4">
                  Need inspiration for a specific meal? Get an AI-generated cancer-fighting recipe suggestion.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["breakfast", "lunch", "dinner", "snack", "smoothie"].map(type => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => generateMealSuggestion(type)}
                      disabled={suggestionLoading}
                      className={`text-xs font-body capitalize border-[hsl(30,22%,85%)] hover:bg-primary/10 hover:text-primary hover:border-primary/30 ${selectedMealType === type && mealSuggestion ? 'bg-primary/10 text-primary border-primary/30' : 'text-[hsl(25,20%,42%)]'}`}
                    >
                      {type}
                    </Button>
                  ))}
                </div>

                {suggestionLoading && (
                  <div className="flex items-center gap-3 py-6 justify-center">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <p className="text-sm text-[hsl(25,18%,48%)] font-body">Finding a perfect {selectedMealType} for you...</p>
                  </div>
                )}

                {mealSuggestion && !suggestionLoading && (
                  <div className="bg-[hsl(30,30%,95%)] border border-[hsl(30,22%,87%)] rounded-lg p-5">
                    <AIContent content={mealSuggestion} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="recipes">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-heading text-[hsl(25,30%,28%)]">Anti-Inflammatory & Immune-Boosting Recipes</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {title: "Turmeric Golden Milk", desc: "Anti-inflammatory curcumin with black pepper for absorption", tag: "Immune Support"},
              {title: "Beetroot & Carrot Soup", desc: "Liver-cleansing vegetables with ginger and garlic", tag: "Liver Support"},
              {title: "Wild Salmon with Greens", desc: "Omega-3 rich salmon with dark leafy greens and lemon", tag: "Anti-Inflammatory"},
              {title: "Berry Antioxidant Smoothie", desc: "Blueberries, acai, spinach, and flaxseed", tag: "Antioxidant Rich"},
              {title: "Mediterranean Lentil Bowl", desc: "Fibre-rich lentils with olive oil, herbs, and vegetables", tag: "Gut Health"},
              {title: "Green Tea Matcha Bowl", desc: "Matcha with avocado, nuts, seeds, and fresh fruit", tag: "Immune Support"}
            ].map((recipe, index) => (
              <Card key={index} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] overflow-hidden hover:border-primary/30 transition-all duration-300">
                <div className="w-full h-32 bg-gradient-to-br from-primary/15 to-[hsl(34,55%,52%)]/10 flex items-center justify-center">
                  <Apple className="h-10 w-10 text-primary/30" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-heading text-sm text-[hsl(25,30%,28%)] mb-1">{recipe.title}</h3>
                  <p className="text-sm text-[hsl(25,18%,50%)] font-body mb-3">{recipe.desc}</p>
                  <span className="text-xs font-body font-medium px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20">
                    {recipe.tag}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="liver">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardHeader>
                <CardTitle className="font-heading text-[hsl(34,55%,45%)]">Foods That Support Liver Recovery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 font-body text-sm text-[hsl(25,18%,48%)]">
                  {[
                    { name: "Cruciferous vegetables", desc: "broccoli, cauliflower, Brussels sprouts support liver detox enzymes" },
                    { name: "Beetroot", desc: "contains betaine which supports liver cell function" },
                    { name: "Leafy greens", desc: "spinach, kale, rocket rich in chlorophyll and antioxidants" },
                    { name: "Garlic & onions", desc: "contain sulphur compounds that aid liver detoxification" },
                    { name: "Berries", desc: "antioxidant-rich, especially blueberries protect liver cells" },
                    { name: "Fatty fish", desc: "salmon, sardines provide omega-3s that reduce liver inflammation" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <p><span className="font-medium text-[hsl(25,30%,28%)]">{item.name}</span> — {item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardHeader>
                <CardTitle className="font-heading text-[hsl(34,55%,45%)]">Foods to Minimise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 font-body text-sm text-[hsl(25,18%,48%)]">
                  {[
                    { name: "Alcohol", desc: "places additional burden on recovering liver", color: "bg-[hsl(0,50%,55%)]" },
                    { name: "Processed foods", desc: "preservatives and additives stress the liver", color: "bg-[hsl(0,50%,55%)]" },
                    { name: "Refined sugars", desc: "contribute to inflammation and fatty liver", color: "bg-[hsl(0,50%,55%)]" },
                    { name: "Excess saturated fat", desc: "can impede liver recovery", color: "bg-[hsl(0,50%,55%)]" },
                    { name: "Grapefruit", desc: "may interact with some medications; check with your team", color: "bg-[hsl(34,55%,52%)]" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color} mt-1.5 flex-shrink-0`} />
                      <p><span className="font-medium text-[hsl(25,30%,28%)]">{item.name}</span> — {item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="shopping">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-[hsl(34,55%,45%)]">Healing Shopping List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-heading text-sm text-primary mb-3">Vegetables</h3>
                  <ul className="space-y-1 text-sm text-[hsl(25,18%,48%)] font-body">
                    <li>Broccoli & cauliflower</li>
                    <li>Beetroot</li>
                    <li>Spinach & kale</li>
                    <li>Sweet potato</li>
                    <li>Garlic & ginger</li>
                    <li>Red capsicum</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-heading text-sm text-primary mb-3">Proteins & Fats</h3>
                  <ul className="space-y-1 text-sm text-[hsl(25,18%,48%)] font-body">
                    <li>Wild salmon</li>
                    <li>Sardines</li>
                    <li>Walnuts & almonds</li>
                    <li>Extra virgin olive oil</li>
                    <li>Avocados</li>
                    <li>Chia & flax seeds</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-heading text-sm text-primary mb-3">Fruits & Extras</h3>
                  <ul className="space-y-1 text-sm text-[hsl(25,18%,48%)] font-body">
                    <li>Blueberries & raspberries</li>
                    <li>Lemons & limes</li>
                    <li>Green tea / matcha</li>
                    <li>Turmeric (fresh & powder)</li>
                    <li>Raw honey</li>
                    <li>Dark chocolate (85%+)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
