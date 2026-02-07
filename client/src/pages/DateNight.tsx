import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Sparkles, Loader2, RefreshCw, MapPin, Utensils, Star,
  Music, Calendar, ChevronLeft, Clock, DollarSign, Leaf, X,
  MessageSquare, Check, History, Compass, Palette, Mountain, Wine,
  Pin, PinOff, ChevronRight, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { DateNight as DateNightType } from "@shared/schema";

interface RestaurantCard {
  name: string;
  suburb: string;
  cuisineType: string;
  priceRange: string;
  summary: string;
  dietaryNotes: string;
  vibe: string;
  menuSuggestions: string[];
  whyItWorks: string;
}

interface ActivityCard {
  name: string;
  location: string;
  description: string;
  whyItsSpecial: string;
  bestTime: string;
  category: string;
}

const categoryIcons: Record<string, typeof Compass> = {
  active: Mountain,
  relaxing: Wine,
  creative: Palette,
  adventurous: Compass,
  romantic: Heart,
};

function PriceIndicator({ range }: { range: string }) {
  const count = (range.match(/\$/g) || []).length;
  const maxCount = Math.min(Math.max(count, 1), 4);
  return (
    <span className="flex items-center gap-0.5 text-accent">
      {Array.from({ length: maxCount }).map((_, i) => (
        <DollarSign key={i} className="h-3.5 w-3.5" />
      ))}
      {Array.from({ length: 4 - maxCount }).map((_, i) => (
        <DollarSign key={i + maxCount} className="h-3.5 w-3.5 opacity-20" />
      ))}
    </span>
  );
}

function StarRating({ rating, onRate, size = "md" }: { rating: number; onRate?: (r: number) => void; size?: "sm" | "md" }) {
  const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onRate?.(s)}
          className={`${onRate ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            className={`${starSize} ${s <= rating ? "text-accent fill-accent" : "text-muted-foreground/40"}`}
          />
        </button>
      ))}
    </div>
  );
}

const SHORTLIST_KEY = "elizabeth-date-night-shortlist";
const DISMISSED_KEY = "elizabeth-date-night-dismissed";

function loadShortlist(): { restaurants: RestaurantCard[]; activities: ActivityCard[] } {
  try {
    const saved = localStorage.getItem(SHORTLIST_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { restaurants: [], activities: [] };
}

function saveShortlist(data: { restaurants: RestaurantCard[]; activities: ActivityCard[] }) {
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

export default function DateNight() {
  const { user } = useUser();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<RestaurantCard[]>([]);
  const [activities, setActivities] = useState<ActivityCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMoreRestaurants, setLoadingMoreRestaurants] = useState(false);
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantCard | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityCard | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDate, setSaveDate] = useState("");
  const [savingRestaurant, setSavingRestaurant] = useState<RestaurantCard | null>(null);
  const [savingActivity, setSavingActivity] = useState<ActivityCard | null>(null);

  const [activeTab, setActiveTab] = useState<"discover" | "shortlist" | "history">("discover");
  const [shortlist, setShortlist] = useState(loadShortlist);
  const [dismissedNames, setDismissedNames] = useState(loadDismissed);
  const [dismissingCard, setDismissingCard] = useState<string | null>(null);

  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const isRestaurantShortlisted = (r: RestaurantCard) =>
    shortlist.restaurants.some((s) => s.name === r.name && s.suburb === r.suburb);

  const isActivityShortlisted = (a: ActivityCard) =>
    shortlist.activities.some((s) => s.name === a.name && s.location === a.location);

  const toggleRestaurantShortlist = (r: RestaurantCard, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = isRestaurantShortlisted(r)
      ? { ...shortlist, restaurants: shortlist.restaurants.filter((s) => !(s.name === r.name && s.suburb === r.suburb)) }
      : { ...shortlist, restaurants: [...shortlist.restaurants, r] };
    setShortlist(updated);
    saveShortlist(updated);
    toast({ title: isRestaurantShortlisted(r) ? "Removed from shortlist" : "Shortlisted!", description: r.name });
  };

  const toggleActivityShortlist = (a: ActivityCard, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = isActivityShortlisted(a)
      ? { ...shortlist, activities: shortlist.activities.filter((s) => !(s.name === a.name && s.location === a.location)) }
      : { ...shortlist, activities: [...shortlist.activities, a] };
    setShortlist(updated);
    saveShortlist(updated);
    toast({ title: isActivityShortlisted(a) ? "Removed from shortlist" : "Shortlisted!", description: a.name });
  };

  const dismissRestaurant = (r: RestaurantCard, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDismissingCard(r.name);
    setTimeout(() => {
      setRestaurants((prev) => prev.filter((x) => x.name !== r.name));
      const updated = [...dismissedNames, r.name];
      setDismissedNames(updated);
      saveDismissed(updated);
      setDismissingCard(null);
    }, 250);
  };

  const dismissActivity = (a: ActivityCard, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDismissingCard(a.name);
    setTimeout(() => {
      setActivities((prev) => prev.filter((x) => x.name !== a.name));
      const updated = [...dismissedNames, a.name];
      setDismissedNames(updated);
      saveDismissed(updated);
      setDismissingCard(null);
    }, 250);
  };

  const { data: dateNightHistory = [], isLoading: historyLoading } = useQuery<DateNightType[]>({
    queryKey: [`/api/date-nights?userId=${user?.id || 1}`],
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/date-nights", { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/date-nights?userId=${user?.id || 1}`] });
      toast({ title: "Date night saved!", description: "Added to your calendar." });
      setShowSaveDialog(false);
      setSaveDate("");
      setSavingRestaurant(null);
      setSavingActivity(null);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, rating, review }: { id: number; rating: number; review: string }) => {
      return apiRequest(`/api/date-nights/${id}`, { method: "PATCH", body: JSON.stringify({ rating, review, status: "completed" }), headers: { "Content-Type": "application/json" } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/date-nights?userId=${user?.id || 1}`] });
      toast({ title: "Review saved!", description: "Your feedback has been recorded." });
      setReviewingId(null);
      setReviewRating(0);
      setReviewText("");
    },
  });

  const generateIdeas = async (append = false, type: "both" | "restaurants" | "activities" = "both") => {
    if (append) {
      if (type === "restaurants") setLoadingMoreRestaurants(true);
      else if (type === "activities") setLoadingMoreActivities(true);
      else { setLoadingMoreRestaurants(true); setLoadingMoreActivities(true); }
    } else {
      setLoading(true);
    }
    try {
      const currentNames = append
        ? (type === "restaurants"
          ? restaurants.map(r => r.name)
          : type === "activities"
          ? activities.map(a => a.name)
          : [...restaurants.map(r => r.name), ...activities.map(a => a.name)]
        )
        : [];
      const existingNames = [...currentNames, ...dismissedNames].join(", ");
      const res = await fetch("/api/ai/date-night", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, excludeNames: existingNames, type }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Server error");
      }
      const data = await res.json();
      const hasResults = (data.restaurants?.length || 0) > 0 || (data.activities?.length || 0) > 0;
      if (!hasResults && !append) {
        throw new Error("No results returned. Please try again.");
      }
      if (append) {
        if (type !== "activities") setRestaurants((prev) => [...prev, ...(data.restaurants || [])]);
        if (type !== "restaurants") setActivities((prev) => [...prev, ...(data.activities || [])]);
      } else {
        setRestaurants(data.restaurants || []);
        setActivities(data.activities || []);
      }
      setHasGenerated(true);
    } catch (err: any) {
      const message = err?.message?.includes("temporarily busy")
        ? "The AI is a bit busy right now. Give it a moment and try again."
        : "Couldn't generate ideas right now. Please try again.";
      toast({ title: "Oops", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
      setLoadingMoreRestaurants(false);
      setLoadingMoreActivities(false);
    }
  };

  const openSaveDialog = (restaurant: RestaurantCard, activity?: ActivityCard) => {
    setSavingRestaurant(restaurant);
    setSavingActivity(activity || null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSaveDate(tomorrow.toISOString().split("T")[0]);
    setShowSaveDialog(true);
  };

  const handleSave = () => {
    if (!savingRestaurant || !saveDate || !user) return;
    saveMutation.mutate({
      userId: user.id,
      date: saveDate,
      restaurantName: savingRestaurant.name,
      restaurantSuburb: savingRestaurant.suburb,
      cuisineType: savingRestaurant.cuisineType,
      priceRange: savingRestaurant.priceRange,
      summary: savingRestaurant.summary,
      dietaryNotes: savingRestaurant.dietaryNotes,
      vibe: savingRestaurant.vibe,
      menuSuggestions: savingRestaurant.menuSuggestions.join(" | "),
      activity: savingActivity?.name || null,
      activityLocation: savingActivity?.location || null,
      activityDescription: savingActivity?.description || null,
      status: "planned",
    });
  };

  const planned = dateNightHistory.filter((d) => d.status === "planned").sort((a, b) => a.date.localeCompare(b.date));
  const completed = dateNightHistory.filter((d) => d.status === "completed").sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-5 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-heading text-foreground">Date Night</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Plan beautiful evenings together
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

      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1 max-w-sm">
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-body font-medium transition-all ${activeTab === "discover" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />Discover
        </button>
        <button
          onClick={() => setActiveTab("shortlist")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-body font-medium transition-all relative ${activeTab === "shortlist" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Pin className="h-3.5 w-3.5 inline mr-1.5" />Shortlist
          {(shortlist.restaurants.length + shortlist.activities.length) > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-medium">{shortlist.restaurants.length + shortlist.activities.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-body font-medium transition-all relative ${activeTab === "history" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <History className="h-3.5 w-3.5 inline mr-1.5" />History
          {planned.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-white text-[10px] flex items-center justify-center font-medium">{planned.length}</span>
          )}
        </button>
      </div>

      {activeTab === "discover" && (
        <>
          {!hasGenerated && !loading && (
            <Card className="bg-white border-border mb-6">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center gap-4 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Utensils className="h-5 w-5 text-primary" /></div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Music className="h-5 w-5 text-accent" /></div>
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center"><MapPin className="h-5 w-5 text-pink-500" /></div>
                </div>
                <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-md mx-auto mb-6">
                  Connection, laughter, and love are powerful medicine.
                  Let us find the perfect Sydney restaurants and activities for a wonderful evening together.
                </p>
                <Button
                  onClick={() => generateIdeas()}
                  className="bg-primary text-white hover:bg-primary/90 font-body font-medium gap-2 px-6 rounded-xl"
                >
                  <Sparkles className="h-4 w-4" /> Find Date Night Ideas
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
                    <Sparkles className="h-7 w-7 text-accent animate-pulse" />
                  </div>
                </div>
                <h2 className="font-heading text-lg text-foreground mb-1">Curating your perfect evening...</h2>
                <p className="text-sm text-muted-foreground font-body">Searching Sydney's best spots</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-white border-border rounded-2xl overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-3 animate-pulse">
                        <div className="flex justify-between">
                          <div className="h-4 bg-muted rounded-lg w-2/3" />
                          <div className="h-4 bg-muted rounded-lg w-12" />
                        </div>
                        <div className="h-3 bg-muted/70 rounded-lg w-1/2" />
                        <div className="space-y-1.5">
                          <div className="h-3 bg-muted/70 rounded-lg w-full" />
                          <div className="h-3 bg-muted/70 rounded-lg w-5/6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {hasGenerated && !loading && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-heading text-foreground flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" /> Restaurant Picks
                </h2>
                <Button variant="ghost" size="sm" onClick={() => generateIdeas()} className="text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5 font-body text-xs rounded-lg">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh All
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((r, i) => (
                  <Card
                    key={r.name}
                    className={`bg-white border-border rounded-2xl hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative ${dismissingCard === r.name ? "animate-card-dismiss" : "animate-fade-in-up"}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => setSelectedRestaurant(r)}
                  >
                    <div className="absolute top-2.5 right-2.5 z-10 flex gap-1">
                      <button
                        onClick={(e) => toggleRestaurantShortlist(r, e)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isRestaurantShortlisted(r)
                            ? "bg-primary text-white"
                            : "bg-muted/80 text-muted-foreground hover:bg-primary/15 hover:text-primary"
                        }`}
                        title="Shortlist"
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => dismissRestaurant(r, e)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted/80 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                        title="Hide"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2 pr-16">
                        <h3 className="font-body font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-tight">{r.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-body">{r.suburb}</span>
                        <span className="text-xs text-muted-foreground/40">·</span>
                        <span className="text-xs text-primary font-body font-medium">{r.cuisineType}</span>
                        <span className="text-xs text-muted-foreground/40">·</span>
                        <PriceIndicator range={r.priceRange} />
                      </div>
                      <p className="text-xs text-muted-foreground font-body leading-relaxed line-clamp-2 mb-3">{r.summary}</p>
                      <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                        <Leaf className="h-3 w-3 text-primary/60" />
                        <span className="text-[10px] text-primary/70 font-body line-clamp-1">{r.dietaryNotes}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => generateIdeas(true, "restaurants")}
                  disabled={loadingMoreRestaurants}
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:bg-primary/10 font-body text-xs gap-1.5 rounded-lg"
                >
                  {loadingMoreRestaurants ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding more...</>
                  ) : (
                    <><Plus className="h-3.5 w-3.5" /> More Restaurants</>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between mt-4">
                <h2 className="text-base font-heading text-foreground flex items-center gap-2">
                  <Music className="h-4 w-4 text-accent" /> Things to Do Together
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {activities.map((a, i) => {
                  const Icon = categoryIcons[a.category] || Compass;
                  return (
                    <Card
                      key={a.name}
                      className={`bg-white border-border rounded-2xl hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative ${dismissingCard === a.name ? "animate-card-dismiss" : "animate-fade-in-up"}`}
                      style={{ animationDelay: `${i * 50}ms` }}
                      onClick={() => setSelectedActivity(a)}
                    >
                      <div className="absolute top-2.5 right-2.5 z-10 flex gap-1">
                        <button
                          onClick={(e) => toggleActivityShortlist(a, e)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            isActivityShortlisted(a)
                              ? "bg-accent text-white"
                              : "bg-muted/80 text-muted-foreground hover:bg-accent/15 hover:text-accent"
                          }`}
                          title="Shortlist"
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => dismissActivity(a, e)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted/80 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                          title="Hide"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-2 pr-16">
                          <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <h3 className="font-body font-semibold text-sm text-foreground group-hover:text-accent transition-colors leading-tight">{a.name}</h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground font-body">{a.location}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-body leading-relaxed line-clamp-2 mb-2">{a.description}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-body">
                          <Clock className="h-3 w-3" /> {a.bestTime}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => generateIdeas(true, "activities")}
                  disabled={loadingMoreActivities}
                  variant="ghost"
                  size="sm"
                  className="text-accent hover:bg-accent/10 font-body text-xs gap-1.5 rounded-lg"
                >
                  {loadingMoreActivities ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding more...</>
                  ) : (
                    <><Plus className="h-3.5 w-3.5" /> More Activities</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "shortlist" && (
        <div className="space-y-6">
          {shortlist.restaurants.length === 0 && shortlist.activities.length === 0 ? (
            <Card className="bg-white border-border">
              <CardContent className="p-8 text-center">
                <Pin className="h-10 w-10 text-primary/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-body">No items shortlisted yet.</p>
                <p className="text-xs text-muted-foreground font-body mt-1">Tap the pin icon on any restaurant or activity to save it here.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {shortlist.restaurants.length > 0 && (
                <div>
                  <h2 className="text-base font-heading text-accent tracking-wide flex items-center gap-2 mb-3">
                    <Utensils className="h-4 w-4" /> Shortlisted Restaurants
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {shortlist.restaurants.map((r, i) => (
                      <Card
                        key={i}
                        className="bg-white border-border rounded-xl hover:shadow-md transition-all cursor-pointer group relative"
                        onClick={() => setSelectedRestaurant(r)}
                      >
                        <button
                          onClick={(e) => toggleRestaurantShortlist(r, e)}
                          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-primary text-white hover:bg-red-400 transition-all"
                        >
                          <PinOff className="h-3.5 w-3.5" />
                        </button>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2 pr-8">
                            <h3 className="font-heading text-sm text-foreground">{r.name}</h3>
                            <PriceIndicator range={r.priceRange} />
                          </div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-body">{r.suburb}</span>
                            <span className="text-xs text-muted-foreground/50">·</span>
                            <span className="text-xs text-primary/80 font-body">{r.cuisineType}</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-body leading-relaxed line-clamp-2">{r.summary}</p>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); openSaveDialog(r); }}
                              className="bg-primary text-white hover:bg-primary/90 font-body text-xs gap-1 h-7"
                            >
                              <Calendar className="h-3 w-3" /> Book It
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {shortlist.activities.length > 0 && (
                <div>
                  <h2 className="text-base font-heading text-accent tracking-wide flex items-center gap-2 mb-3">
                    <Music className="h-4 w-4" /> Shortlisted Activities
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {shortlist.activities.map((a, i) => {
                      const Icon = categoryIcons[a.category] || Compass;
                      return (
                        <Card
                          key={i}
                          className="bg-white border-border rounded-xl hover:shadow-md transition-all cursor-pointer group relative"
                          onClick={() => setSelectedActivity(a)}
                        >
                          <button
                            onClick={(e) => toggleActivityShortlist(a, e)}
                            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-accent text-white hover:bg-red-400 transition-all"
                          >
                            <PinOff className="h-3.5 w-3.5" />
                          </button>
                          <CardContent className="p-4 pr-10">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="h-4 w-4 text-accent" />
                              </div>
                              <div>
                                <h3 className="font-heading text-sm text-foreground">{a.name}</h3>
                                <p className="text-xs text-muted-foreground font-body">{a.location}</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground font-body leading-relaxed line-clamp-2">{a.description}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : dateNightHistory.length === 0 ? (
            <Card className="bg-white border-border">
              <CardContent className="p-8 text-center">
                <Heart className="h-10 w-10 text-pink-300 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-body">No date nights saved yet. Head to Discover to find your first!</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {planned.length > 0 && (
                <div>
                  <h2 className="text-base font-heading text-accent tracking-wide flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4" /> Upcoming
                  </h2>
                  <div className="space-y-3">
                    {planned.map((dn) => (
                      <Card key={dn.id} className="bg-white border-border rounded-xl">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-3.5 w-3.5 text-accent" />
                                <span className="text-xs font-body font-medium text-accent">
                                  {new Date(dn.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                                </span>
                              </div>
                              <h3 className="font-heading text-sm text-foreground">{dn.restaurantName}</h3>
                              {dn.restaurantSuburb && <p className="text-xs text-muted-foreground font-body">{dn.restaurantSuburb} · {dn.cuisineType}</p>}
                              {dn.activity && (
                                <p className="text-xs text-primary/70 font-body mt-1 flex items-center gap-1">
                                  <Music className="h-3 w-3" /> {dn.activity}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setReviewingId(dn.id); setReviewRating(0); setReviewText(""); }}
                              className="border-primary/30 text-primary hover:bg-primary/10 text-xs gap-1"
                            >
                              <Check className="h-3 w-3" /> Done
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {completed.length > 0 && (
                <div>
                  <h2 className="text-base font-heading text-accent tracking-wide flex items-center gap-2 mb-3">
                    <History className="h-4 w-4" /> Past Date Nights
                  </h2>
                  <div className="space-y-3">
                    {completed.map((dn) => (
                      <Card key={dn.id} className="bg-white border-border rounded-xl">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground font-body">
                                  {new Date(dn.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                                {dn.rating && <StarRating rating={dn.rating} size="sm" />}
                              </div>
                              <h3 className="font-heading text-sm text-foreground">{dn.restaurantName}</h3>
                              {dn.restaurantSuburb && <p className="text-xs text-muted-foreground font-body">{dn.restaurantSuburb}</p>}
                              {dn.activity && (
                                <p className="text-xs text-primary/70 font-body mt-1 flex items-center gap-1">
                                  <Music className="h-3 w-3" /> {dn.activity}
                                </p>
                              )}
                              {dn.review && (
                                <p className="text-xs text-muted-foreground font-body mt-2 italic bg-muted rounded-lg p-2">
                                  "{dn.review}"
                                </p>
                              )}
                            </div>
                            {!dn.rating && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setReviewingId(dn.id); setReviewRating(0); setReviewText(""); }}
                                className="text-accent hover:bg-accent/10 text-xs gap-1"
                              >
                                <MessageSquare className="h-3 w-3" /> Review
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
        <DialogContent className="bg-white border-border max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedRestaurant && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-foreground tracking-wide flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  {selectedRestaurant.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground font-body">
                    <MapPin className="h-3.5 w-3.5" /> {selectedRestaurant.suburb}
                  </span>
                  <span className="text-primary font-body">{selectedRestaurant.cuisineType}</span>
                  <PriceIndicator range={selectedRestaurant.priceRange} />
                </div>

                <p className="text-sm text-foreground font-body leading-relaxed">{selectedRestaurant.summary}</p>

                <div className="bg-muted rounded-xl p-4">
                  <h4 className="text-xs font-heading text-primary tracking-wide mb-2 uppercase">Why It Works</h4>
                  <p className="text-sm text-foreground font-body">{selectedRestaurant.whyItWorks}</p>
                </div>

                <div className="bg-primary/5 rounded-xl p-4">
                  <h4 className="text-xs font-heading text-primary tracking-wide mb-2 uppercase flex items-center gap-1.5">
                    <Leaf className="h-3.5 w-3.5" /> Dietary Notes
                  </h4>
                  <p className="text-sm text-foreground font-body">{selectedRestaurant.dietaryNotes}</p>
                </div>

                <div>
                  <h4 className="text-xs font-heading text-accent tracking-wide mb-2 uppercase">What to Order</h4>
                  <div className="space-y-2">
                    {selectedRestaurant.menuSuggestions.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] text-accent font-heading">{i + 1}</span>
                        <span className="text-sm text-foreground font-body">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground font-body italic">{selectedRestaurant.vibe}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => { openSaveDialog(selectedRestaurant); setSelectedRestaurant(null); }}
                    className="flex-1 bg-primary text-white hover:bg-primary/90 font-heading tracking-wide gap-2"
                  >
                    <Calendar className="h-4 w-4" /> Save to Calendar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="bg-white border-border max-w-lg">
          {selectedActivity && (() => {
            const Icon = categoryIcons[selectedActivity.category] || Compass;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-heading text-foreground tracking-wide flex items-center gap-2">
                    <Icon className="h-5 w-5 text-accent" />
                    {selectedActivity.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground font-body">{selectedActivity.location}</span>
                  </div>

                  <p className="text-sm text-foreground font-body leading-relaxed">{selectedActivity.description}</p>

                  <div className="bg-accent/5 rounded-xl p-4">
                    <h4 className="text-xs font-heading text-accent tracking-wide mb-2 uppercase">Why It's Special</h4>
                    <p className="text-sm text-foreground font-body">{selectedActivity.whyItsSpecial}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                    <Clock className="h-3.5 w-3.5" /> Best time: {selectedActivity.bestTime}
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-accent/10 rounded-full px-3 py-1 text-xs font-body text-accent capitalize">
                    <Icon className="h-3 w-3" /> {selectedActivity.category}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-white border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground tracking-wide flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Save Date Night
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {savingRestaurant && (
              <div className="bg-muted rounded-xl p-3">
                <p className="text-sm font-heading text-foreground">{savingRestaurant.name}</p>
                <p className="text-xs text-muted-foreground font-body">{savingRestaurant.suburb} · {savingRestaurant.cuisineType}</p>
              </div>
            )}

            {activities.length > 0 && !savingActivity && (
              <div>
                <p className="text-xs font-body text-muted-foreground mb-2">Add an activity? (optional)</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {activities.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => setSavingActivity(a)}
                      className="w-full text-left p-2 rounded-lg hover:bg-primary/5 text-xs font-body text-foreground transition-colors border border-transparent hover:border-primary/20"
                    >
                      {a.name} — {a.location}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {savingActivity && (
              <div className="bg-accent/5 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-heading text-accent">{savingActivity.name}</p>
                  <p className="text-[10px] text-muted-foreground font-body">{savingActivity.location}</p>
                </div>
                <button onClick={() => setSavingActivity(null)}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            )}

            <div>
              <label className="text-xs font-body text-muted-foreground block mb-1.5">Date</label>
              <Input
                type="date"
                value={saveDate}
                onChange={(e) => setSaveDate(e.target.value)}
                className="bg-muted/50 border-border text-foreground font-body"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !saveDate}
              className="w-full bg-primary text-white hover:bg-primary/90 font-heading tracking-wide gap-2"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              {saveMutation.isPending ? "Saving..." : "Save Date Night"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewingId} onOpenChange={() => setReviewingId(null)}>
        <DialogContent className="bg-white border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground tracking-wide flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" /> How Was Your Date Night?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs font-body text-muted-foreground mb-2">Rate your experience</p>
              <div className="flex justify-center">
                <StarRating rating={reviewRating} onRate={setReviewRating} />
              </div>
            </div>

            <div>
              <label className="text-xs font-body text-muted-foreground block mb-1.5">Share your thoughts (optional)</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="How was the food? The experience? Any highlights?"
                className="bg-muted/50 border-border text-foreground font-body resize-none"
                rows={3}
              />
            </div>

            <Button
              onClick={() => reviewingId && reviewMutation.mutate({ id: reviewingId, rating: reviewRating, review: reviewText })}
              disabled={reviewMutation.isPending || reviewRating === 0}
              className="w-full bg-accent text-white hover:bg-accent/90 font-heading tracking-wide gap-2"
            >
              {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {reviewMutation.isPending ? "Saving..." : "Save Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
