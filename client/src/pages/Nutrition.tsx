import { useState, useEffect, useRef } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  Apple, Sparkles, Loader2, RefreshCw, Utensils, Clock, Leaf,
  X, Pin, PinOff, Heart, ShoppingCart, ChevronRight, Plus,
  ChefHat, Flame, Coffee, Salad, Fish, CupSoda, Cookie
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import breakfastBowlImg from "../assets/meals/breakfast-bowl.png";
import smoothieImg from "../assets/meals/smoothie.png";
import saladImg from "../assets/meals/salad.png";
import soupImg from "../assets/meals/soup.png";
import fishImg from "../assets/meals/fish.png";
import grainBowlImg from "../assets/meals/grain-bowl.png";
import snackImg from "../assets/meals/snack.png";
import teaImg from "../assets/meals/tea.png";
import chickenImg from "../assets/meals/chicken.png";
import berryBowlImg from "../assets/meals/berry-bowl.png";

const mealImages: Record<string, string> = {
  "breakfast-bowl": breakfastBowlImg,
  "smoothie": smoothieImg,
  "salad": saladImg,
  "soup": soupImg,
  "fish": fishImg,
  "grain-bowl": grainBowlImg,
  "snack": snackImg,
  "tea": teaImg,
  "chicken": chickenImg,
  "berry-bowl": berryBowlImg,
};

const mealTypeIcons: Record<string, typeof Utensils> = {
  breakfast: Coffee,
  lunch: Salad,
  dinner: ChefHat,
  snack: Cookie,
  smoothie: CupSoda,
  tea: Flame,
};

const tagColors: Record<string, string> = {
  "anti-inflammatory": "bg-blue-50 text-blue-700 border-blue-100",
  "liver-support": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "immune-boost": "bg-purple-50 text-purple-700 border-purple-100",
  "omega-3": "bg-sky-50 text-sky-700 border-sky-100",
  "antioxidant": "bg-rose-50 text-rose-700 border-rose-100",
  "gut-health": "bg-amber-50 text-amber-700 border-amber-100",
  "protein": "bg-orange-50 text-orange-700 border-orange-100",
  "fibre": "bg-lime-50 text-lime-700 border-lime-100",
};

function getTagColor(tag: string): string {
  const lower = tag.toLowerCase();
  for (const [key, val] of Object.entries(tagColors)) {
    if (lower.includes(key.replace("-", ""))) return val;
    if (lower.includes(key)) return val;
  }
  return "bg-primary/5 text-primary border-primary/10";
}

interface MealCard {
  name: string;
  mealType: string;
  description: string;
  prepTime: string;
  servings: string;
  ingredients: string[];
  instructions: string[];
  healingBenefits: string;
  tags: string[];
  imageCategory: string;
}

interface ShoppingList {
  produce: string[];
  proteins: string[];
  pantry: string[];
  spices: string[];
}

const fallbackStarterMeals: MealCard[] = [
  {
    name: "Golden Turmeric Porridge",
    mealType: "breakfast",
    description: "A warming anti-inflammatory breakfast packed with turmeric, cinnamon, and topped with fresh berries and walnuts. Supports immune function and gut health.",
    prepTime: "10 mins",
    servings: "1",
    ingredients: ["1/2 cup rolled oats", "1 cup oat milk", "1 tsp turmeric powder", "1/2 tsp cinnamon", "1 tbsp maple syrup", "1/4 cup blueberries", "2 tbsp walnuts", "1 tbsp chia seeds"],
    instructions: ["Combine oats, oat milk, turmeric, and cinnamon in a saucepan.", "Cook on medium heat for 5 minutes, stirring occasionally.", "Pour into a bowl and drizzle with maple syrup.", "Top with blueberries, walnuts, and chia seeds."],
    healingBenefits: "Turmeric is a powerful anti-inflammatory that supports immune recovery. Blueberries provide antioxidants, while walnuts offer omega-3 fatty acids essential for healing.",
    tags: ["anti-inflammatory", "immune-boost", "gut-health", "omega-3"],
    imageCategory: "breakfast-bowl",
  },
  {
    name: "Lemon Herb Salmon Bowl",
    mealType: "lunch",
    description: "A vibrant nourishing bowl with baked salmon, quinoa, roasted vegetables, and a zesty lemon-tahini dressing. Rich in omega-3 and antioxidants.",
    prepTime: "25 mins",
    servings: "1",
    ingredients: ["120g salmon fillet", "1/2 cup quinoa", "1 cup mixed greens", "1/2 avocado", "1/2 cup roasted sweet potato", "1/4 cup cherry tomatoes", "1 tbsp tahini", "1 tbsp lemon juice", "Fresh dill"],
    instructions: ["Cook quinoa according to packet directions and set aside.", "Season salmon with lemon, salt, and pepper. Bake at 200°C for 12 minutes.", "Arrange greens, quinoa, sweet potato, and tomatoes in a bowl.", "Place salmon on top, add sliced avocado.", "Drizzle with tahini mixed with lemon juice. Garnish with dill."],
    healingBenefits: "Salmon provides omega-3 fatty acids that reduce inflammation. Quinoa is a complete protein supporting tissue repair. Avocado offers healthy fats for nutrient absorption.",
    tags: ["omega-3", "protein", "anti-inflammatory", "antioxidant"],
    imageCategory: "fish",
  },
  {
    name: "Beetroot Hummus & Veggie Sticks",
    mealType: "snack",
    description: "A colourful immune-boosting snack with homemade beetroot hummus and crunchy vegetable sticks. Perfect for an afternoon pick-me-up.",
    prepTime: "10 mins",
    servings: "1",
    ingredients: ["1 small cooked beetroot", "1/2 can chickpeas (drained)", "1 tbsp tahini", "1 tbsp lemon juice", "1 clove garlic", "Carrot sticks", "Cucumber sticks", "Celery sticks"],
    instructions: ["Blend beetroot, chickpeas, tahini, lemon juice, and garlic until smooth.", "Season with salt and pepper to taste.", "Serve in a small bowl alongside fresh veggie sticks."],
    healingBenefits: "Beetroot supports liver detoxification and blood health. Chickpeas provide plant protein and fibre. Raw vegetables offer digestive enzymes and vitamins.",
    tags: ["liver-support", "fibre", "antioxidant", "gut-health"],
    imageCategory: "snack",
  },
  {
    name: "Ginger Chicken & Greens Stir-Fry",
    mealType: "dinner",
    description: "A light, aromatic stir-fry with organic chicken, fresh ginger, garlic, and seasonal Asian greens served over brown rice. Gentle on the stomach.",
    prepTime: "20 mins",
    servings: "2",
    ingredients: ["200g organic chicken breast (sliced)", "2 cups Asian greens (bok choy, broccolini)", "1 tbsp fresh ginger (grated)", "2 cloves garlic (minced)", "1 tbsp tamari", "1 tsp sesame oil", "1 cup brown rice (cooked)", "1 tbsp sesame seeds", "Fresh coriander"],
    instructions: ["Cook brown rice according to packet directions.", "Heat sesame oil in a wok or large pan over high heat.", "Stir-fry chicken for 4-5 minutes until cooked through.", "Add ginger, garlic, and greens. Stir-fry for 2-3 minutes.", "Add tamari and toss to coat.", "Serve over brown rice, topped with sesame seeds and coriander."],
    healingBenefits: "Ginger is a natural anti-nausea remedy and anti-inflammatory. Asian greens are rich in folate and vitamins A, C, K. Organic chicken provides lean protein for muscle recovery.",
    tags: ["anti-inflammatory", "protein", "immune-boost"],
    imageCategory: "chicken",
  },
];

const SHORTLIST_KEY = "elizabeth-meal-shortlist";
const DISMISSED_KEY = "elizabeth-meal-dismissed";

function loadShortlist(): MealCard[] {
  try {
    const saved = localStorage.getItem(SHORTLIST_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveShortlist(data: MealCard[]) {
  localStorage.setItem(SHORTLIST_KEY, JSON.stringify(data));
}

function loadDismissed(): string[] {
  try {
    const saved = localStorage.getItem(DISMISSED_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveDismissed(names: string[]) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(names));
}

export default function Nutrition() {
  const { user } = useUser();
  const { toast } = useToast();
  const [meals, setMeals] = useState<MealCard[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [selectedMeal, setSelectedMeal] = useState<MealCard | null>(null);
  const [activeTab, setActiveTab] = useState<"discover" | "saved" | "shopping">("discover");
  const [shortlist, setShortlist] = useState<MealCard[]>(loadShortlist);
  const [dismissedNames, setDismissedNames] = useState<string[]>(loadDismissed);
  const [dismissingCard, setDismissingCard] = useState<string | null>(null);
  const [activeMealFilter, setActiveMealFilter] = useState<string>("all");
  const didAutoGenerate = useRef(false);

  const isMealShortlisted = (m: MealCard) =>
    shortlist.some((s) => s.name === m.name);

  const toggleShortlist = (m: MealCard, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isShortlisted = isMealShortlisted(m);
    const updated = isShortlisted
      ? shortlist.filter((s) => s.name !== m.name)
      : [...shortlist, m];
    setShortlist(updated);
    saveShortlist(updated);
    toast({ title: isShortlisted ? "Removed from saved" : "Saved!", description: m.name });
  };

  const dismissMeal = (m: MealCard, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDismissingCard(m.name);
    setTimeout(() => {
      setMeals((prev) => prev.filter((x) => x.name !== m.name));
      const updated = [...dismissedNames, m.name];
      setDismissedNames(updated);
      saveDismissed(updated);
      setDismissingCard(null);
    }, 250);
  };

  const loadFallbackMeals = () => {
    const available = fallbackStarterMeals.filter(m => !dismissedNames.includes(m.name));
    setMeals(available);
    setHasGenerated(true);
  };

  const generateStarterMeals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/meal-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, excludeNames: dismissedNames.join(", "), mealTypes: "starter" }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      const aiMeals = data.meals || [];
      if (aiMeals.length > 0) {
        setMeals(aiMeals);
        if (data.shoppingList) setShoppingList(data.shoppingList);
        setHasGenerated(true);
      } else {
        loadFallbackMeals();
      }
    } catch {
      loadFallbackMeals();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!didAutoGenerate.current && !hasGenerated && meals.length === 0) {
      didAutoGenerate.current = true;
      loadFallbackMeals();
      generateStarterMeals();
    }
  }, []);

  const generateMeals = async (append = false, mealTypes: string = "all") => {
    if (append) {
      setLoadingMore(mealTypes);
    } else {
      setLoading(true);
    }
    try {
      const currentNames = append ? meals.map(m => m.name) : [];
      const existingNames = [...currentNames, ...dismissedNames].join(", ");
      const res = await fetch("/api/ai/meal-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, excludeNames: existingNames, mealTypes }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (append) {
        setMeals((prev) => [...prev, ...(data.meals || [])]);
      } else {
        setMeals(data.meals || []);
        setShoppingList(data.shoppingList || null);
      }
      if (data.shoppingList && (data.shoppingList.produce?.length > 0 || data.shoppingList.proteins?.length > 0)) {
        setShoppingList(prev => {
          if (!prev || !append) return data.shoppingList;
          return {
            produce: Array.from(new Set([...prev.produce, ...(data.shoppingList.produce || [])])),
            proteins: Array.from(new Set([...prev.proteins, ...(data.shoppingList.proteins || [])])),
            pantry: Array.from(new Set([...prev.pantry, ...(data.shoppingList.pantry || [])])),
            spices: Array.from(new Set([...prev.spices, ...(data.shoppingList.spices || [])])),
          };
        });
      }
      setHasGenerated(true);
    } catch {
      toast({ title: "Oops", description: "Couldn't generate meal ideas right now. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
      setLoadingMore(null);
    }
  };

  const filteredMeals = activeMealFilter === "all"
    ? meals
    : meals.filter(m => m.mealType === activeMealFilter);

  const savedShoppingList = shortlist.length > 0 ? {
    produce: Array.from(new Set(shortlist.flatMap(m => m.ingredients.filter(i => {
      const l = i.toLowerCase();
      return l.includes("spinach") || l.includes("kale") || l.includes("broccoli") || l.includes("tomato") || l.includes("avocado") || l.includes("garlic") || l.includes("ginger") || l.includes("onion") || l.includes("lemon") || l.includes("berr") || l.includes("pepper") || l.includes("carrot") || l.includes("beetroot") || l.includes("sweet potato") || l.includes("cucumber") || l.includes("zucchini") || l.includes("capsicum") || l.includes("mushroom") || l.includes("herb") || l.includes("basil") || l.includes("mint") || l.includes("parsley") || l.includes("coriander") || l.includes("celery") || l.includes("apple") || l.includes("banana") || l.includes("mango") || l.includes("pomegranate");
    })))),
    proteins: Array.from(new Set(shortlist.flatMap(m => m.ingredients.filter(i => {
      const l = i.toLowerCase();
      return l.includes("salmon") || l.includes("chicken") || l.includes("fish") || l.includes("egg") || l.includes("tofu") || l.includes("lentil") || l.includes("chickpea") || l.includes("bean") || l.includes("sardine") || l.includes("prawn") || l.includes("turkey");
    })))),
    pantry: Array.from(new Set(shortlist.flatMap(m => m.ingredients.filter(i => {
      const l = i.toLowerCase();
      return l.includes("quinoa") || l.includes("rice") || l.includes("oat") || l.includes("oil") || l.includes("vinegar") || l.includes("nut") || l.includes("seed") || l.includes("honey") || l.includes("coconut") || l.includes("almond") || l.includes("walnut") || l.includes("tahini") || l.includes("flour") || l.includes("bread");
    })))),
    spices: Array.from(new Set(shortlist.flatMap(m => m.ingredients.filter(i => {
      const l = i.toLowerCase();
      return l.includes("turmeric") || l.includes("cumin") || l.includes("cinnamon") || l.includes("pepper") || l.includes("paprika") || l.includes("salt") || l.includes("oregano") || l.includes("rosemary") || l.includes("thyme");
    })))),
  } : null;

  return (
    <div className="p-5 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-heading text-foreground">Meal Planner</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Cancer-fighting recipes tailored to your healing journey
        </p>
      </div>

      {user?.dietaryPreferences && (
        <div className="mb-4 inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-3 py-1.5">
          <Leaf className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-body text-muted-foreground">
            <span className="font-medium text-foreground">{user.dietaryPreferences}</span>
          </span>
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1 max-w-md">
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-body font-medium transition-all ${activeTab === "discover" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />Discover
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-body font-medium transition-all relative ${activeTab === "saved" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Pin className="h-3.5 w-3.5 inline mr-1.5" />Saved
          {shortlist.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-medium">{shortlist.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("shopping")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-body font-medium transition-all ${activeTab === "shopping" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ShoppingCart className="h-3.5 w-3.5 inline mr-1.5" />Shopping
        </button>
      </div>

      {activeTab === "discover" && (
        <>
          {!hasGenerated && !loading && (
            <Card className="bg-white border-border mb-6">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center gap-4 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><ChefHat className="h-5 w-5 text-primary" /></div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Apple className="h-5 w-5 text-accent" /></div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Heart className="h-5 w-5 text-emerald-500" /></div>
                </div>
                <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-md mx-auto mb-6">
                  Personalised cancer-fighting recipes — breakfast, lunch, snack, and dinner — tailored to your healing journey.
                </p>
                <Button
                  onClick={() => generateStarterMeals()}
                  className="bg-primary text-white hover:bg-primary/90 font-body font-medium gap-2 px-6 rounded-xl"
                >
                  <Sparkles className="h-4 w-4" /> Generate Meals
                </Button>
              </CardContent>
            </Card>
          )}

          {loading && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative w-20 h-20 mb-5">
                  <div className="absolute inset-0 rounded-full border-[3px] border-primary/10" />
                  <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" style={{ animationDuration: "1.2s" }} />
                  <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-accent animate-spin" style={{ animationDuration: "1.8s", animationDirection: "reverse" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ChefHat className="h-7 w-7 text-accent animate-pulse" />
                  </div>
                </div>
                <h2 className="font-heading text-lg text-foreground mb-1">Creating your meal plan...</h2>
                <p className="text-sm text-muted-foreground font-body">Finding delicious healing recipes</p>
              </div>

              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-muted animate-pulse">
                    <div className="aspect-[4/5] relative">
                      <div className="absolute bottom-0 left-0 right-0 p-3.5 space-y-2">
                        <div className="flex gap-1.5">
                          <div className="h-5 bg-white/20 rounded-full w-16" />
                          <div className="h-5 bg-white/20 rounded-full w-14" />
                        </div>
                        <div className="h-4 bg-white/20 rounded-lg w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasGenerated && !loading && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {["all", "breakfast", "lunch", "dinner", "snack", "smoothie", "tea"].map(filter => {
                    const count = filter === "all" ? meals.length : meals.filter(m => m.mealType === filter).length;
                    if (filter !== "all" && count === 0) return null;
                    return (
                      <button
                        key={filter}
                        onClick={() => setActiveMealFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium whitespace-nowrap transition-all ${
                          activeMealFilter === filter
                            ? "bg-primary text-white shadow-sm"
                            : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                        }`}
                      >
                        {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                        {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                      </button>
                    );
                  })}
                </div>
                <Button variant="ghost" size="sm" onClick={() => generateMeals()} className="text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5 font-body text-xs rounded-lg flex-shrink-0">
                  <RefreshCw className="h-3.5 w-3.5" /> New Ideas
                </Button>
              </div>

              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                {filteredMeals.map((m, i) => {
                  const MealIcon = mealTypeIcons[m.mealType] || Utensils;
                  const imgSrc = mealImages[m.imageCategory] || mealImages["grain-bowl"];
                  return (
                    <div
                      key={m.name}
                      className={`relative rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group ${dismissingCard === m.name ? "animate-card-dismiss" : "animate-fade-in-up"}`}
                      style={{ animationDelay: `${i * 60}ms` }}
                      onClick={() => setSelectedMeal(m)}
                    >
                      <div className="absolute top-2 right-2 z-10 flex gap-1">
                        <button
                          onClick={(e) => toggleShortlist(m, e)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all backdrop-blur-md shadow-sm ${
                            isMealShortlisted(m)
                              ? "bg-primary text-white"
                              : "bg-black/30 text-white hover:bg-primary/80 hover:text-white"
                          }`}
                          title="Save"
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => dismissMeal(m, e)}
                          className="w-7 h-7 rounded-full flex items-center justify-center bg-black/30 text-white hover:bg-red-500/80 transition-all backdrop-blur-md shadow-sm"
                          title="Hide"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="aspect-[4/5] relative">
                        <img
                          src={imgSrc}
                          alt={m.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3.5">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                              <MealIcon className="h-3 w-3 text-white" />
                              <span className="text-[10px] text-white font-body font-medium uppercase tracking-wider">{m.mealType}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                              <Clock className="h-3 w-3 text-white" />
                              <span className="text-[10px] text-white font-body font-medium">{m.prepTime}</span>
                            </span>
                          </div>
                          <h3 className="font-body font-bold text-sm text-white leading-tight drop-shadow-lg">
                            {m.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {["breakfast", "lunch", "dinner", "snack"].map(type => (
                  <Button
                    key={type}
                    onClick={() => generateMeals(true, type)}
                    disabled={!!loadingMore}
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/10 font-body text-xs gap-1.5 rounded-lg capitalize"
                  >
                    {loadingMore === type ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding...</>
                    ) : (
                      <><Plus className="h-3.5 w-3.5" /> More {type}</>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "saved" && (
        <div className="space-y-6">
          {shortlist.length === 0 ? (
            <Card className="bg-white border-border">
              <CardContent className="p-8 text-center">
                <Pin className="h-10 w-10 text-primary/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-body">No recipes saved yet.</p>
                <p className="text-xs text-muted-foreground font-body mt-1">Tap the pin icon on any meal to save it here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
              {shortlist.map((m, i) => {
                const MealIcon = mealTypeIcons[m.mealType] || Utensils;
                const imgSrc = mealImages[m.imageCategory] || mealImages["grain-bowl"];
                return (
                  <div
                    key={i}
                    className="relative rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                    onClick={() => setSelectedMeal(m)}
                  >
                    <button
                      onClick={(e) => toggleShortlist(m, e)}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-primary text-white hover:bg-red-400 transition-all backdrop-blur-md shadow-sm"
                    >
                      <PinOff className="h-3.5 w-3.5" />
                    </button>
                    <div className="aspect-[4/5] relative">
                      <img src={imgSrc} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3.5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                            <MealIcon className="h-3 w-3 text-white" />
                            <span className="text-[10px] text-white font-body font-medium uppercase tracking-wider">{m.mealType}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5">
                            <Clock className="h-3 w-3 text-white" />
                            <span className="text-[10px] text-white font-body font-medium">{m.prepTime}</span>
                          </span>
                        </div>
                        <h3 className="font-body font-bold text-sm text-white leading-tight drop-shadow-lg">
                          {m.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "shopping" && (
        <div className="space-y-6">
          {shoppingList && (shoppingList.produce.length > 0 || shoppingList.proteins.length > 0) ? (
            <>
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-4">
                  <p className="text-sm text-foreground font-body">
                    <span className="font-medium">Shopping list</span> based on your {meals.length > 0 ? "generated" : "saved"} recipes. Everything you need for delicious, healing meals.
                  </p>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: "Fresh Produce", items: shoppingList.produce, icon: Apple, color: "text-emerald-600" },
                  { title: "Proteins", items: shoppingList.proteins, icon: Fish, color: "text-orange-600" },
                  { title: "Pantry Staples", items: shoppingList.pantry, icon: ShoppingCart, color: "text-amber-600" },
                  { title: "Spices & Herbs", items: shoppingList.spices, icon: Leaf, color: "text-primary" },
                ].filter(cat => cat.items.length > 0).map((cat, idx) => (
                  <Card key={idx} className="bg-white border-border rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <cat.icon className={`h-4 w-4 ${cat.color}`} />
                        </div>
                        <h3 className="font-body font-semibold text-sm text-foreground">{cat.title}</h3>
                        <span className="text-[10px] text-muted-foreground font-body ml-auto bg-muted px-2 py-0.5 rounded-full">{cat.items.length} items</span>
                      </div>
                      <div className="space-y-2">
                        {cat.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2.5 group">
                            <div className="w-4 h-4 rounded border-2 border-border group-hover:border-primary/40 transition-colors flex-shrink-0" />
                            <span className="text-sm text-foreground font-body">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : savedShoppingList && (savedShoppingList.produce.length > 0 || savedShoppingList.proteins.length > 0) ? (
            <>
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-4">
                  <p className="text-sm text-foreground font-body">
                    <span className="font-medium">Auto-generated shopping list</span> from your {shortlist.length} saved recipes.
                  </p>
                </CardContent>
              </Card>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: "Fresh Produce", items: savedShoppingList.produce, icon: Apple, color: "text-emerald-600" },
                  { title: "Proteins", items: savedShoppingList.proteins, icon: Fish, color: "text-orange-600" },
                  { title: "Pantry Staples", items: savedShoppingList.pantry, icon: ShoppingCart, color: "text-amber-600" },
                  { title: "Spices & Herbs", items: savedShoppingList.spices, icon: Leaf, color: "text-primary" },
                ].filter(cat => cat.items.length > 0).map((cat, idx) => (
                  <Card key={idx} className="bg-white border-border rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <cat.icon className={`h-4 w-4 ${cat.color}`} />
                        </div>
                        <h3 className="font-body font-semibold text-sm text-foreground">{cat.title}</h3>
                        <span className="text-[10px] text-muted-foreground font-body ml-auto bg-muted px-2 py-0.5 rounded-full">{cat.items.length}</span>
                      </div>
                      <div className="space-y-2">
                        {cat.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2.5 group">
                            <div className="w-4 h-4 rounded border-2 border-border group-hover:border-primary/40 transition-colors flex-shrink-0" />
                            <span className="text-sm text-foreground font-body">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="bg-white border-border">
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-10 w-10 text-primary/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-body">No shopping list yet.</p>
                <p className="text-xs text-muted-foreground font-body mt-1">Generate meal ideas or save some recipes to see your shopping list here.</p>
                <Button
                  onClick={() => { setActiveTab("discover"); generateMeals(); }}
                  className="mt-4 bg-primary text-white hover:bg-primary/90 font-body font-medium gap-2 rounded-xl"
                  size="sm"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Generate Meals
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={!!selectedMeal} onOpenChange={() => setSelectedMeal(null)}>
        <DialogContent className="bg-white border-border max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedMeal && (() => {
            const MealIcon = mealTypeIcons[selectedMeal.mealType] || Utensils;
            const imgSrc = mealImages[selectedMeal.imageCategory] || mealImages["grain-bowl"];
            return (
              <>
                <div className="-mx-6 -mt-6 mb-4">
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img src={imgSrc} alt={selectedMeal.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                      <div className="flex items-center gap-2 mb-1">
                        <MealIcon className="h-3.5 w-3.5 text-white/80" />
                        <span className="text-xs text-white/80 font-body uppercase tracking-wider">{selectedMeal.mealType}</span>
                        <span className="text-white/40 text-xs">·</span>
                        <Clock className="h-3.5 w-3.5 text-white/80" />
                        <span className="text-xs text-white/80 font-body">{selectedMeal.prepTime}</span>
                        <span className="text-white/40 text-xs">·</span>
                        <span className="text-xs text-white/80 font-body">{selectedMeal.servings}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogHeader>
                  <DialogTitle className="font-heading text-foreground tracking-wide text-lg">
                    {selectedMeal.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  <p className="text-sm text-foreground font-body leading-relaxed">{selectedMeal.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedMeal.tags.map((tag, i) => (
                      <span key={i} className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full border ${getTagColor(tag)}`}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="bg-primary/5 rounded-xl p-4">
                    <h4 className="text-xs font-heading text-primary tracking-wide mb-2 uppercase flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5" /> Healing Benefits
                    </h4>
                    <p className="text-sm text-foreground font-body">{selectedMeal.healingBenefits}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-heading text-accent tracking-wide mb-3 uppercase flex items-center gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5" /> Ingredients
                    </h4>
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      {selectedMeal.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                          <span className="text-sm text-foreground font-body">{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-heading text-accent tracking-wide mb-3 uppercase flex items-center gap-1.5">
                      <ChefHat className="h-3.5 w-3.5" /> Instructions
                    </h4>
                    <div className="space-y-3">
                      {selectedMeal.instructions.map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs text-primary font-body font-semibold">{i + 1}</span>
                          <p className="text-sm text-foreground font-body leading-relaxed pt-0.5">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={(e) => { toggleShortlist(selectedMeal, e); }}
                      variant={isMealShortlisted(selectedMeal) ? "outline" : "default"}
                      className={`flex-1 font-body font-medium gap-2 rounded-xl ${
                        isMealShortlisted(selectedMeal) 
                          ? "border-red-200 text-red-600 hover:bg-red-50" 
                          : "bg-primary text-white hover:bg-primary/90"
                      }`}
                    >
                      {isMealShortlisted(selectedMeal) ? (
                        <><PinOff className="h-4 w-4" /> Remove from Saved</>
                      ) : (
                        <><Pin className="h-4 w-4" /> Save Recipe</>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
