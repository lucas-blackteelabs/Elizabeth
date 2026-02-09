import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  Brain,
  Wind,
  Sparkles,
  Moon,
  Eye,
  BookOpen,
  PersonStanding,
  Footprints,
  Waves,
  Leaf,
  StretchHorizontal,
  Droplets,
  Apple,
  Salad,
  Fish,
  GlassWater,
  Heart,
  Users,
  MessageCircle,
  TreePine,
  Palette,
  ArrowRight,
  Star,
  Activity,
} from "lucide-react";

const radicalRemissionFactors: Record<string, string> = {
  diet: "RR Factor #1: Radically Changing Your Diet",
  herbs: "RR Factor #2: Using Herbs & Supplements",
  intuition: "RR Factor #3: Following Your Intuition",
  emotions: "RR Factor #4: Releasing Suppressed Emotions",
  positive: "RR Factor #5: Increasing Positive Emotions",
  support: "RR Factor #6: Embracing Social Support",
  spiritual: "RR Factor #7: Deepening Spiritual Connection",
  reasons: "RR Factor #8: Having Strong Reasons for Living",
  control: "RR Factor #9: Taking Control of Your Health",
};

const mindBodyCards = [
  {
    icon: Brain,
    title: "Meditation for Healing",
    description: "Guided visualisation to support your immune system. Picture your T-cells actively patrolling and protecting your body as you heal.",
    button: "Start Practice",
    factor: "positive",
    time: "10–15 min",
  },
  {
    icon: Wind,
    title: "Breathing for Calm",
    description: "4-7-8 and box breathing techniques to activate your parasympathetic nervous system and reduce cortisol levels naturally.",
    button: "Start Practice",
    factor: "control",
    time: "5–10 min",
  },
  {
    icon: Activity,
    title: "Progressive Muscle Relaxation",
    description: "Systematically tense and release muscle groups to melt away physical tension held in the body from stress and treatment.",
    button: "Start Practice",
    factor: "emotions",
    time: "15–20 min",
  },
  {
    icon: Eye,
    title: "Visualisation & Guided Imagery",
    description: "Visualise your immune system clearing remaining cancer cells and your liver regenerating healthy tissue. A powerful healing practice.",
    button: "Start Practice",
    factor: "positive",
    time: "10–12 min",
  },
  {
    icon: BookOpen,
    title: "Journaling for Processing",
    description: "Write through your emotions, fears, and hopes. Processing feelings on paper has been shown to improve immune function and reduce anxiety.",
    button: "Start Practice",
    factor: "emotions",
    time: "10–20 min",
  },
  {
    icon: Moon,
    title: "Sleep Hygiene",
    description: "Optimise your sleep environment and routine for deep, restorative rest. Your immune system repairs and regenerates during sleep.",
    button: "Learn More",
    factor: "control",
    time: "Ongoing",
  },
];

const movementCards = [
  {
    icon: Leaf,
    title: "Gentle Yoga",
    description: "Restorative yoga poses to reduce stress, improve flexibility, and support liver recovery after immunotherapy treatment.",
    duration: "20–30 min",
    intensity: "Gentle",
    factor: "control",
  },
  {
    icon: Footprints,
    title: "Nature Walking",
    description: "Walking in nature reduces cortisol and boosts natural killer cell activity. Start with 20 minutes and build gradually.",
    duration: "20–40 min",
    intensity: "Gentle",
    factor: "positive",
  },
  {
    icon: Waves,
    title: "Swimming",
    description: "Low-impact full-body exercise that builds cardiovascular fitness while being easy on joints recovering from treatment.",
    duration: "20–30 min",
    intensity: "Moderate",
    factor: "control",
  },
  {
    icon: PersonStanding,
    title: "Tai Chi",
    description: "Ancient practice combining gentle movement with meditation. Research shows it boosts immune markers and improves balance.",
    duration: "15–30 min",
    intensity: "Gentle",
    factor: "spiritual",
  },
  {
    icon: StretchHorizontal,
    title: "Stretching & Breathwork",
    description: "Combine gentle stretches with deep breathing for relaxation, improved circulation, and lymphatic flow support.",
    duration: "10–15 min",
    intensity: "Gentle",
    factor: "control",
  },
  {
    icon: Droplets,
    title: "Lymphatic Drainage",
    description: "Gentle self-massage techniques to support your lymphatic system and help your body's natural detoxification processes.",
    duration: "10–15 min",
    intensity: "Gentle",
    factor: "control",
  },
];

const nutritionCards = [
  {
    icon: Salad,
    title: "Anti-Inflammatory Diet",
    description: "Focus on colourful vegetables, berries, fatty fish, and turmeric to reduce chronic inflammation that can promote cancer growth.",
    tip: "Aim for 8+ servings of vegetables daily",
    factor: "diet",
  },
  {
    icon: Fish,
    title: "Liver-Supportive Foods",
    description: "Cruciferous vegetables, beetroot, garlic, and green tea support your liver's detoxification pathways as it continues to recover.",
    tip: "Include bitter greens like rocket and dandelion",
    factor: "diet",
  },
  {
    icon: Apple,
    title: "Immune-Boosting Foods",
    description: "Medicinal mushrooms, citrus, ginger, bone broth, and fermented foods to strengthen and support your immune surveillance.",
    tip: "Add shiitake or reishi mushrooms to meals",
    factor: "diet",
  },
  {
    icon: GlassWater,
    title: "Hydration & Detox",
    description: "Proper hydration supports every bodily function including immune response and liver recovery. Add lemon or cucumber for extra benefit.",
    tip: "Aim for 2–3 litres of filtered water daily",
    factor: "diet",
  },
];

const wellbeingCards = [
  {
    icon: Heart,
    title: "Gratitude Practice",
    description: "Daily gratitude journaling rewires your brain for positivity and has been shown to improve immune function and sleep quality.",
    button: "Start Practice",
    factor: "positive",
  },
  {
    icon: Users,
    title: "Social Support Groups",
    description: "Connect with other melanoma survivors and immunotherapy patients who truly understand your journey and can offer peer support.",
    button: "Find Groups",
    factor: "support",
  },
  {
    icon: MessageCircle,
    title: "Counselling Resources",
    description: "Professional support for processing the emotional impact of your diagnosis, treatment, and ongoing surveillance anxiety.",
    button: "Learn More",
    factor: "emotions",
  },
  {
    icon: TreePine,
    title: "Nature Therapy",
    description: "Forest bathing and time in nature reduces cortisol, lowers blood pressure, and boosts natural killer cell activity for days afterward.",
    button: "Learn More",
    factor: "spiritual",
  },
  {
    icon: Palette,
    title: "Creative Expression",
    description: "Art therapy, music, and creative writing help process emotions that are difficult to verbalise and release suppressed feelings.",
    button: "Explore",
    factor: "emotions",
  },
  {
    icon: Sparkles,
    title: "Spiritual Connection",
    description: "Deepen your sense of meaning and connection — through prayer, meditation, nature, or whatever resonates with your personal beliefs.",
    button: "Start Practice",
    factor: "spiritual",
  },
];

export default function Resources() {
  return (
    <div className="p-6 lg:p-8">
      <Heading
        title="Resources"
        description="Personalised healing resources tailored to your journey, grounded in the Radical Remission 9 key healing factors"
      />

      <Card className="bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border-primary/25 mb-8 rounded-2xl">
        <CardContent className="p-5 flex items-start gap-3">
          <Star className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground font-body">
            <span className="font-medium font-heading text-base">Personalised for You</span>
            <br />
            These resources are personalised for your Stage IV Melanoma journey during active surveillance, based on the Radical Remission 9 key healing factors. Each practice is chosen to support your immune system, emotional wellbeing, and overall recovery.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="mind-body">
        <TabsList className="mb-6 bg-muted border border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="mind-body" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Brain className="h-4 w-4 mr-2" /> Mind & Body
          </TabsTrigger>
          <TabsTrigger value="movement" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <PersonStanding className="h-4 w-4 mr-2" /> Movement
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Apple className="h-4 w-4 mr-2" /> Nutrition
          </TabsTrigger>
          <TabsTrigger value="wellbeing" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Heart className="h-4 w-4 mr-2" /> Wellbeing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mind-body">
          <Card className="bg-primary/10 border-primary/20 mb-6 rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm text-foreground font-body">
                <span className="font-medium">Research shows:</span> Mind-body practices can reduce cortisol, support immune function, and help manage scanxiety. Even 10 minutes daily makes a measurable difference in wellbeing and immune markers.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mindBodyCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="bg-white border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300">
                  <div className="w-full h-24 bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
                    <Icon className="h-10 w-10 text-primary/40" />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-heading text-base text-foreground mb-1">{card.title}</h3>
                    <p className="text-sm text-muted-foreground font-body mb-2">{card.description}</p>
                    <p className="text-xs text-primary font-body font-medium mb-1">{card.time}</p>
                    <p className="text-xs text-accent/80 font-body mb-4 italic">{radicalRemissionFactors[card.factor]}</p>
                    <Button className="w-full bg-primary/15 border border-primary/25 text-primary hover:bg-primary/25 font-body">
                      {card.button}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="movement">
          <Card className="bg-primary/10 border-primary/20 mb-6 rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm text-foreground font-body">
                <span className="font-medium">For your phase:</span> During active surveillance after immunotherapy, moderate exercise supports immune function, reduces fatigue, and improves mood. Start gently and build gradually — your body is still recovering.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movementCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="bg-white border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300">
                  <div className="w-full h-24 bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
                    <Icon className="h-10 w-10 text-primary/40" />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-heading text-base text-foreground mb-1">{card.title}</h3>
                    <p className="text-sm text-muted-foreground font-body mb-3">{card.description}</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-body text-muted-foreground">Duration: <span className="text-foreground font-medium">{card.duration}</span></span>
                      <span className={`text-xs font-body font-medium px-2 py-0.5 rounded-full border ${
                        card.intensity === "Gentle"
                          ? "bg-primary/15 text-primary border-primary/25"
                          : "bg-accent/10 text-accent border-accent/20"
                      }`}>
                        {card.intensity}
                      </span>
                    </div>
                    <p className="text-xs text-accent/80 font-body mb-4 italic">{radicalRemissionFactors[card.factor]}</p>
                    <Button className="w-full bg-primary/15 border border-primary/25 text-primary hover:bg-primary/25 font-body">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="nutrition">
          <Card className="bg-primary/10 border-primary/20 mb-6 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-foreground font-body">
                <span className="font-medium">Radical Remission Factor #1:</span> Radically changing your diet is one of the most common factors in remarkable cancer recoveries. Nourish your body with healing foods.
              </p>
              <Link href="/nutrition">
                <Button className="bg-primary text-white hover:bg-primary/90 font-body whitespace-nowrap">
                  Full Nutrition Plan <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nutritionCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="bg-white border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading text-foreground flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground font-body mb-3">{card.description}</p>
                    <div className="bg-muted/50 border border-border rounded-lg p-3 mb-2">
                      <p className="text-xs text-primary font-body font-medium">💡 Quick tip: {card.tip}</p>
                    </div>
                    <p className="text-xs text-accent/80 font-body italic">{radicalRemissionFactors[card.factor]}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="wellbeing">
          <Card className="bg-primary/10 border-primary/20 mb-6 rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm text-foreground font-body">
                <span className="font-medium">Multiple Radical Remission Factors:</span> Social support (#6), deepening spiritual connection (#7), having strong reasons for living (#8), and releasing suppressed emotions (#4) are all essential to holistic healing.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wellbeingCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="bg-white border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading text-foreground flex items-center gap-3 text-base">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground font-body mb-3">{card.description}</p>
                    <p className="text-xs text-accent/80 font-body mb-4 italic">{radicalRemissionFactors[card.factor]}</p>
                    <Button className="w-full bg-primary/15 border border-primary/25 text-primary hover:bg-primary/25 font-body">
                      {card.button}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
