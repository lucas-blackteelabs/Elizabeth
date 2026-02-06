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
    <span className="flex items-center gap-0.5 text-[hsl(34,55%,52%)]">
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
            className={`${starSize} ${s <= rating ? "text-[hsl(34,55%,52%)] fill-[hsl(34,55%,52%)]" : "text-[hsl(30,20%,80%)]"}`}
          />
        </button>
      ))}
    </div>
  );
}

const SHORTLIST_KEY = "elizabeth-date-night-shortlist";

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

export default function DateNight() {
  const { user } = useUser();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<RestaurantCard[]>([]);
  const [activities, setActivities] = useState<ActivityCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantCard | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityCard | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDate, setSaveDate] = useState("");
  const [savingRestaurant, setSavingRestaurant] = useState<RestaurantCard | null>(null);
  const [savingActivity, setSavingActivity] = useState<ActivityCard | null>(null);

  const [activeTab, setActiveTab] = useState<"discover" | "shortlist" | "history">("discover");
  const [shortlist, setShortlist] = useState(loadShortlist);

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

  const generateIdeas = async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const existingNames = append ? [...restaurants.map(r => r.name), ...activities.map(a => a.name)].join(", ") : "";
      const res = await fetch("/api/ai/date-night", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, excludeNames: existingNames }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (append) {
        setRestaurants((prev) => [...prev, ...(data.restaurants || [])]);
        setActivities((prev) => [...prev, ...(data.activities || [])]);
      } else {
        setRestaurants(data.restaurants || []);
        setActivities(data.activities || []);
      }
      setHasGenerated(true);
    } catch {
      toast({ title: "Oops", description: "Couldn't generate ideas right now. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center gap-3 mb-2">
          <Heart className="h-6 w-6 text-[hsl(0,55%,60%)] fill-[hsl(0,55%,60%)]/20" />
          <h1 className="text-2xl font-heading text-[hsl(25,35%,22%)] tracking-wide">Date Night</h1>
          <Heart className="h-6 w-6 text-[hsl(0,55%,60%)] fill-[hsl(0,55%,60%)]/20" />
        </div>
        <p className="text-[hsl(25,18%,48%)] font-body text-sm">
          Celebrating your love and making beautiful memories together
        </p>
      </div>

      {user?.dietaryPreferences && (
        <div className="mb-4 flex items-center gap-2 justify-center">
          <Leaf className="h-4 w-4 text-primary" />
          <span className="text-xs font-body text-[hsl(25,18%,48%)]">
            Dietary preferences: <span className="font-medium text-[hsl(25,30%,28%)]">{user.dietaryPreferences}</span>
          </span>
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-[hsl(30,30%,93%)] rounded-xl p-1 max-w-sm mx-auto">
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-body transition-all ${activeTab === "discover" ? "bg-white text-[hsl(25,30%,22%)] shadow-sm" : "text-[hsl(25,18%,48%)] hover:text-[hsl(25,30%,28%)]"}`}
        >
          <Sparkles className="h-3.5 w-3.5 inline mr-1" />Discover
        </button>
        <button
          onClick={() => setActiveTab("shortlist")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-body transition-all relative ${activeTab === "shortlist" ? "bg-white text-[hsl(25,30%,22%)] shadow-sm" : "text-[hsl(25,18%,48%)] hover:text-[hsl(25,30%,28%)]"}`}
        >
          <Pin className="h-3.5 w-3.5 inline mr-1" />Shortlist
          {(shortlist.restaurants.length + shortlist.activities.length) > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">{shortlist.restaurants.length + shortlist.activities.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-body transition-all relative ${activeTab === "history" ? "bg-white text-[hsl(25,30%,22%)] shadow-sm" : "text-[hsl(25,18%,48%)] hover:text-[hsl(25,30%,28%)]"}`}
        >
          <History className="h-3.5 w-3.5 inline mr-1" />History
          {planned.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[hsl(34,55%,52%)] text-white text-[10px] flex items-center justify-center">{planned.length}</span>
          )}
        </button>
      </div>

      {activeTab === "discover" && (
        <>
          {!hasGenerated && (
            <Card className="bg-gradient-to-br from-[hsl(0,40%,97%)] to-[hsl(34,40%,96%)] border-[hsl(0,30%,88%)] mb-6">
              <CardContent className="p-8 text-center">
                {loading ? (
                  <>
                    <div className="relative mx-auto mb-5 w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" style={{ animationDuration: "1s" }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Heart className="h-6 w-6 text-primary/70 animate-pulse" />
                      </div>
                    </div>
                    <h2 className="font-heading text-lg text-[hsl(25,30%,22%)] mb-2">Finding the perfect spots...</h2>
                    <p className="text-sm text-[hsl(25,18%,48%)] font-body mb-1">Searching Sydney's best restaurants and activities for you two</p>
                    <p className="text-xs text-[hsl(25,18%,60%)] font-body animate-pulse">Considering your dietary preferences</p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center gap-3 mb-4">
                      <Utensils className="h-6 w-6 text-primary/60" />
                      <Music className="h-6 w-6 text-[hsl(34,55%,52%)]/60" />
                      <MapPin className="h-6 w-6 text-[hsl(0,45%,65%)]/60" />
                    </div>
                    <p className="text-sm text-[hsl(25,30%,28%)] font-body leading-relaxed max-w-md mx-auto mb-6">
                      Taking time for each other is a beautiful part of healing. Connection, laughter, and love are powerful medicine.
                      Let us find you the perfect Sydney restaurants and activities for a wonderful evening together.
                    </p>
                    <Button
                      onClick={generateIdeas}
                      className="bg-primary text-white hover:bg-primary/90 font-heading tracking-wide gap-2 px-6"
                    >
                      <Sparkles className="h-4 w-4" /> Find Date Night Ideas
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {hasGenerated && !loading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2">
                  <Utensils className="h-5 w-5" /> Restaurant Picks
                </h2>
                <Button variant="ghost" size="sm" onClick={generateIdeas} className="text-primary hover:bg-primary/10 gap-1.5 font-body text-xs">
                  <RefreshCw className="h-3.5 w-3.5" /> New Ideas
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((r, i) => (
                  <Card
                    key={i}
                    className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group relative"
                    onClick={() => setSelectedRestaurant(r)}
                  >
                    <button
                      onClick={(e) => toggleRestaurantShortlist(r, e)}
                      className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isRestaurantShortlisted(r)
                          ? "bg-primary text-white"
                          : "bg-[hsl(30,25%,90%)] text-[hsl(25,18%,55%)] hover:bg-primary/20 hover:text-primary"
                      }`}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2 pr-8">
                        <h3 className="font-heading text-sm text-[hsl(25,30%,22%)] group-hover:text-primary transition-colors leading-tight">{r.name}</h3>
                        <PriceIndicator range={r.priceRange} />
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin className="h-3 w-3 text-[hsl(25,18%,55%)]" />
                        <span className="text-xs text-[hsl(25,18%,55%)] font-body">{r.suburb}</span>
                        <span className="text-xs text-[hsl(25,18%,70%)]">·</span>
                        <span className="text-xs text-primary/80 font-body">{r.cuisineType}</span>
                      </div>
                      <p className="text-xs text-[hsl(25,18%,48%)] font-body leading-relaxed line-clamp-3 mb-3">{r.summary}</p>
                      <div className="flex items-center gap-1.5 pt-2 border-t border-[hsl(30,25%,90%)]">
                        <Leaf className="h-3 w-3 text-primary/60" />
                        <span className="text-[10px] text-primary/70 font-body line-clamp-1">{r.dietaryNotes}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <h2 className="text-lg font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2 mt-8">
                <Music className="h-5 w-5" /> Things to Do Together
              </h2>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activities.map((a, i) => {
                  const Icon = categoryIcons[a.category] || Compass;
                  return (
                    <Card
                      key={i}
                      className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group relative"
                      onClick={() => setSelectedActivity(a)}
                    >
                      <button
                        onClick={(e) => toggleActivityShortlist(a, e)}
                        className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isActivityShortlisted(a)
                            ? "bg-[hsl(34,55%,52%)] text-white"
                            : "bg-[hsl(30,25%,90%)] text-[hsl(25,18%,55%)] hover:bg-[hsl(34,55%,52%)]/20 hover:text-[hsl(34,55%,52%)]"
                        }`}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-2 pr-8">
                          <div className="h-8 w-8 rounded-lg bg-[hsl(34,55%,52%)]/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-4 w-4 text-[hsl(34,55%,52%)]" />
                          </div>
                          <div>
                            <h3 className="font-heading text-sm text-[hsl(25,30%,22%)] group-hover:text-[hsl(34,55%,45%)] transition-colors leading-tight">{a.name}</h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-[hsl(25,18%,55%)]" />
                              <span className="text-xs text-[hsl(25,18%,55%)] font-body">{a.location}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-[hsl(25,18%,48%)] font-body leading-relaxed line-clamp-3 mb-2">{a.description}</p>
                        <div className="flex items-center gap-1 text-[10px] text-[hsl(25,18%,58%)] font-body">
                          <Clock className="h-3 w-3" /> {a.bestTime}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => generateIdeas(true)}
                  disabled={loadingMore}
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10 font-body gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Finding more ideas...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> See More Ideas
                    </>
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
            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardContent className="p-8 text-center">
                <Pin className="h-10 w-10 text-primary/30 mx-auto mb-3" />
                <p className="text-sm text-[hsl(25,18%,48%)] font-body">No items shortlisted yet.</p>
                <p className="text-xs text-[hsl(25,18%,58%)] font-body mt-1">Tap the pin icon on any restaurant or activity to save it here.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {shortlist.restaurants.length > 0 && (
                <div>
                  <h2 className="text-base font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2 mb-3">
                    <Utensils className="h-4 w-4" /> Shortlisted Restaurants
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {shortlist.restaurants.map((r, i) => (
                      <Card
                        key={i}
                        className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] rounded-xl hover:shadow-md transition-all cursor-pointer group relative"
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
                            <h3 className="font-heading text-sm text-[hsl(25,30%,22%)]">{r.name}</h3>
                            <PriceIndicator range={r.priceRange} />
                          </div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <MapPin className="h-3 w-3 text-[hsl(25,18%,55%)]" />
                            <span className="text-xs text-[hsl(25,18%,55%)] font-body">{r.suburb}</span>
                            <span className="text-xs text-[hsl(25,18%,70%)]">·</span>
                            <span className="text-xs text-primary/80 font-body">{r.cuisineType}</span>
                          </div>
                          <p className="text-xs text-[hsl(25,18%,48%)] font-body leading-relaxed line-clamp-2">{r.summary}</p>
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
                  <h2 className="text-base font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2 mb-3">
                    <Music className="h-4 w-4" /> Shortlisted Activities
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {shortlist.activities.map((a, i) => {
                      const Icon = categoryIcons[a.category] || Compass;
                      return (
                        <Card
                          key={i}
                          className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] rounded-xl hover:shadow-md transition-all cursor-pointer group relative"
                          onClick={() => setSelectedActivity(a)}
                        >
                          <button
                            onClick={(e) => toggleActivityShortlist(a, e)}
                            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-[hsl(34,55%,52%)] text-white hover:bg-red-400 transition-all"
                          >
                            <PinOff className="h-3.5 w-3.5" />
                          </button>
                          <CardContent className="p-4 pr-10">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="h-8 w-8 rounded-lg bg-[hsl(34,55%,52%)]/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="h-4 w-4 text-[hsl(34,55%,52%)]" />
                              </div>
                              <div>
                                <h3 className="font-heading text-sm text-[hsl(25,30%,22%)]">{a.name}</h3>
                                <p className="text-xs text-[hsl(25,18%,55%)] font-body">{a.location}</p>
                              </div>
                            </div>
                            <p className="text-xs text-[hsl(25,18%,48%)] font-body leading-relaxed line-clamp-2">{a.description}</p>
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
            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardContent className="p-8 text-center">
                <Heart className="h-10 w-10 text-[hsl(0,45%,75%)] mx-auto mb-3" />
                <p className="text-sm text-[hsl(25,18%,48%)] font-body">No date nights saved yet. Head to Discover to find your first!</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {planned.length > 0 && (
                <div>
                  <h2 className="text-base font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4" /> Upcoming
                  </h2>
                  <div className="space-y-3">
                    {planned.map((dn) => (
                      <Card key={dn.id} className="bg-gradient-to-r from-[hsl(34,40%,97%)] to-[hsl(36,40%,98%)] border-[hsl(34,35%,85%)] rounded-xl">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-3.5 w-3.5 text-[hsl(34,55%,52%)]" />
                                <span className="text-xs font-body font-medium text-[hsl(34,55%,45%)]">
                                  {new Date(dn.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                                </span>
                              </div>
                              <h3 className="font-heading text-sm text-[hsl(25,30%,22%)]">{dn.restaurantName}</h3>
                              {dn.restaurantSuburb && <p className="text-xs text-[hsl(25,18%,55%)] font-body">{dn.restaurantSuburb} · {dn.cuisineType}</p>}
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
                  <h2 className="text-base font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2 mb-3">
                    <History className="h-4 w-4" /> Past Date Nights
                  </h2>
                  <div className="space-y-3">
                    {completed.map((dn) => (
                      <Card key={dn.id} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] rounded-xl">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-[hsl(25,18%,55%)] font-body">
                                  {new Date(dn.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                                {dn.rating && <StarRating rating={dn.rating} size="sm" />}
                              </div>
                              <h3 className="font-heading text-sm text-[hsl(25,30%,22%)]">{dn.restaurantName}</h3>
                              {dn.restaurantSuburb && <p className="text-xs text-[hsl(25,18%,55%)] font-body">{dn.restaurantSuburb}</p>}
                              {dn.activity && (
                                <p className="text-xs text-primary/70 font-body mt-1 flex items-center gap-1">
                                  <Music className="h-3 w-3" /> {dn.activity}
                                </p>
                              )}
                              {dn.review && (
                                <p className="text-xs text-[hsl(25,18%,48%)] font-body mt-2 italic bg-[hsl(30,25%,95%)] rounded-lg p-2">
                                  "{dn.review}"
                                </p>
                              )}
                            </div>
                            {!dn.rating && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setReviewingId(dn.id); setReviewRating(0); setReviewText(""); }}
                                className="text-[hsl(34,55%,52%)] hover:bg-[hsl(34,55%,52%)]/10 text-xs gap-1"
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
        <DialogContent className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedRestaurant && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-[hsl(25,30%,22%)] tracking-wide flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  {selectedRestaurant.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-[hsl(25,18%,48%)] font-body">
                    <MapPin className="h-3.5 w-3.5" /> {selectedRestaurant.suburb}
                  </span>
                  <span className="text-primary font-body">{selectedRestaurant.cuisineType}</span>
                  <PriceIndicator range={selectedRestaurant.priceRange} />
                </div>

                <p className="text-sm text-[hsl(25,18%,42%)] font-body leading-relaxed">{selectedRestaurant.summary}</p>

                <div className="bg-[hsl(30,30%,95%)] rounded-xl p-4">
                  <h4 className="text-xs font-heading text-primary tracking-wide mb-2 uppercase">Why It Works</h4>
                  <p className="text-sm text-[hsl(25,18%,42%)] font-body">{selectedRestaurant.whyItWorks}</p>
                </div>

                <div className="bg-[hsl(158,25%,95%)] rounded-xl p-4">
                  <h4 className="text-xs font-heading text-primary tracking-wide mb-2 uppercase flex items-center gap-1.5">
                    <Leaf className="h-3.5 w-3.5" /> Dietary Notes
                  </h4>
                  <p className="text-sm text-[hsl(25,18%,42%)] font-body">{selectedRestaurant.dietaryNotes}</p>
                </div>

                <div>
                  <h4 className="text-xs font-heading text-[hsl(34,55%,45%)] tracking-wide mb-2 uppercase">What to Order</h4>
                  <div className="space-y-2">
                    {selectedRestaurant.menuSuggestions.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-[hsl(34,55%,52%)]/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] text-[hsl(34,55%,45%)] font-heading">{i + 1}</span>
                        <span className="text-sm text-[hsl(25,18%,42%)] font-body">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[hsl(0,30%,96%)] rounded-xl p-3">
                  <p className="text-xs text-[hsl(25,18%,48%)] font-body italic">{selectedRestaurant.vibe}</p>
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
        <DialogContent className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] max-w-lg">
          {selectedActivity && (() => {
            const Icon = categoryIcons[selectedActivity.category] || Compass;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-heading text-[hsl(25,30%,22%)] tracking-wide flex items-center gap-2">
                    <Icon className="h-5 w-5 text-[hsl(34,55%,52%)]" />
                    {selectedActivity.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-[hsl(25,18%,48%)]" />
                    <span className="text-[hsl(25,18%,48%)] font-body">{selectedActivity.location}</span>
                  </div>

                  <p className="text-sm text-[hsl(25,18%,42%)] font-body leading-relaxed">{selectedActivity.description}</p>

                  <div className="bg-[hsl(34,40%,95%)] rounded-xl p-4">
                    <h4 className="text-xs font-heading text-[hsl(34,55%,45%)] tracking-wide mb-2 uppercase">Why It's Special</h4>
                    <p className="text-sm text-[hsl(25,18%,42%)] font-body">{selectedActivity.whyItsSpecial}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[hsl(25,18%,48%)] font-body">
                    <Clock className="h-3.5 w-3.5" /> Best time: {selectedActivity.bestTime}
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-[hsl(34,55%,52%)]/10 rounded-full px-3 py-1 text-xs font-body text-[hsl(34,55%,42%)] capitalize">
                    <Icon className="h-3 w-3" /> {selectedActivity.category}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-[hsl(25,30%,22%)] tracking-wide flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Save Date Night
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {savingRestaurant && (
              <div className="bg-[hsl(30,30%,95%)] rounded-xl p-3">
                <p className="text-sm font-heading text-[hsl(25,30%,22%)]">{savingRestaurant.name}</p>
                <p className="text-xs text-[hsl(25,18%,55%)] font-body">{savingRestaurant.suburb} · {savingRestaurant.cuisineType}</p>
              </div>
            )}

            {activities.length > 0 && !savingActivity && (
              <div>
                <p className="text-xs font-body text-[hsl(25,18%,48%)] mb-2">Add an activity? (optional)</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {activities.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => setSavingActivity(a)}
                      className="w-full text-left p-2 rounded-lg hover:bg-primary/5 text-xs font-body text-[hsl(25,18%,42%)] transition-colors border border-transparent hover:border-primary/20"
                    >
                      {a.name} — {a.location}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {savingActivity && (
              <div className="bg-[hsl(34,40%,95%)] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-heading text-[hsl(34,55%,45%)]">{savingActivity.name}</p>
                  <p className="text-[10px] text-[hsl(25,18%,55%)] font-body">{savingActivity.location}</p>
                </div>
                <button onClick={() => setSavingActivity(null)}>
                  <X className="h-3.5 w-3.5 text-[hsl(25,18%,55%)]" />
                </button>
              </div>
            )}

            <div>
              <label className="text-xs font-body text-[hsl(25,18%,48%)] block mb-1.5">Date</label>
              <Input
                type="date"
                value={saveDate}
                onChange={(e) => setSaveDate(e.target.value)}
                className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] text-[hsl(25,30%,28%)] font-body"
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
        <DialogContent className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-[hsl(25,30%,22%)] tracking-wide flex items-center gap-2">
              <Star className="h-5 w-5 text-[hsl(34,55%,52%)]" /> How Was Your Date Night?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs font-body text-[hsl(25,18%,48%)] mb-2">Rate your experience</p>
              <div className="flex justify-center">
                <StarRating rating={reviewRating} onRate={setReviewRating} />
              </div>
            </div>

            <div>
              <label className="text-xs font-body text-[hsl(25,18%,48%)] block mb-1.5">Share your thoughts (optional)</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="How was the food? The experience? Any highlights?"
                className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] text-[hsl(25,30%,28%)] font-body resize-none"
                rows={3}
              />
            </div>

            <Button
              onClick={() => reviewingId && reviewMutation.mutate({ id: reviewingId, rating: reviewRating, review: reviewText })}
              disabled={reviewMutation.isPending || reviewRating === 0}
              className="w-full bg-[hsl(34,55%,52%)] text-white hover:bg-[hsl(34,55%,45%)] font-heading tracking-wide gap-2"
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
