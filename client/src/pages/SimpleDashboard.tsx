import { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "@/contexts/UserContext";
import {
  TrendingUp, Heart, Sparkles, Shield, Target, Scan, Plus, Check, Loader2, Settings2, X,
  ArrowDown, ChevronRight, Camera, Pencil, Trash2, Utensils, Dumbbell, Brain, Apple, Activity,
  ImagePlus, Play, Calendar, RefreshCw, Zap, Moon, Star, CloudMoon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Meal, MindBodyActivity, Exercise, ScanResult, Appointment, CustomActivityType, TumourNickname, MotivationalWallItem, SleepEntry } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

const WIDGET_STORAGE_KEY = "elizabeth-dashboard-widgets";

interface WidgetDef {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultVisible: boolean;
}

const AVAILABLE_WIDGETS: WidgetDef[] = [
  { id: "scanCountdown", label: "Scan Countdown", description: "Days until your next scan", icon: <Scan className="h-4 w-4" />, defaultVisible: true },
  { id: "treatmentJourney", label: "Treatment Journey", description: "Days since diagnosis", icon: <Shield className="h-4 w-4" />, defaultVisible: true },
  { id: "tumourResponse", label: "Tumour Response", description: "Track tumour changes", icon: <TrendingUp className="h-4 w-4" />, defaultVisible: true },
  { id: "dailyBrief", label: "Today's Vibe", description: "AI wellness message", icon: <Sparkles className="h-4 w-4" />, defaultVisible: true },
  { id: "motivationalWall", label: "Worth Fighting For", description: "Your reasons to keep going", icon: <Heart className="h-4 w-4" />, defaultVisible: true },
  { id: "sleepTracker", label: "Sleep Tracker", description: "Track your sleep hours & quality", icon: <Moon className="h-4 w-4" />, defaultVisible: true },
];

function getDefaultWidgets(): string[] {
  return AVAILABLE_WIDGETS.filter(w => w.defaultVisible).map(w => w.id);
}

function loadWidgets(): string[] {
  try {
    const saved = localStorage.getItem(WIDGET_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return getDefaultWidgets();
}

function saveWidgets(ids: string[]) {
  localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(ids));
}

function ManageActivityTypesDialog({ userId, category }: { userId: number; category: string }) {
  const [open, setOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const { toast } = useToast();

  const { data: customTypes = [] } = useQuery<CustomActivityType[]>({
    queryKey: ["/api/activity-types", { userId, category }],
    queryFn: async () => {
      const res = await fetch(`/api/activity-types?userId=${userId}&category=${category}`);
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/activity-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, category, value: newValue.toLowerCase().replace(/\s+/g, "-"), label: newLabel }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-types"] });
      setNewValue("");
      setNewLabel("");
      toast({ title: "Type added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/activity-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-types"] });
      setEditingId(null);
      toast({ title: "Type updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/activity-types/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-types"] });
      toast({ title: "Type removed" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground hover:text-primary font-body gap-1 h-6 px-2">
          <Settings2 className="h-3 w-3" /> Manage Types
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Manage {category === "mindBody" ? "Mind-Body" : category === "exercise" ? "Exercise" : "Therapy"} Types</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {customTypes.map((t) => (
              <div key={t.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg border border-border">
                {editingId === t.id ? (
                  <>
                    <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="flex-1 h-8 text-xs bg-white font-body" />
                    <Button size="sm" className="h-7 text-xs bg-primary text-white" onClick={() => updateMutation.mutate(t.id)}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-body text-foreground">{t.label}</span>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingId(t.id); setEditLabel(t.label); }}>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteMutation.mutate(t.id)}>
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            {customTypes.length === 0 && <p className="text-xs text-muted-foreground font-body text-center py-2">No custom types yet.</p>}
          </div>
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs font-body font-medium text-foreground">Add New Type</p>
            <Input placeholder="Label (e.g. Acupuncture)" value={newLabel} onChange={(e) => { setNewLabel(e.target.value); setNewValue(e.target.value); }} className="bg-muted/50 border-border font-body text-sm" />
            <Button onClick={() => createMutation.mutate()} disabled={!newLabel || createMutation.isPending} className="w-full bg-primary text-white hover:bg-primary/90 font-body font-medium text-sm">
              {createMutation.isPending ? "Adding..." : "Add Type"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LogMealDialog({ userId, defaultDate }: { userId: number; defaultDate?: string }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate || todayStr());
  const [mealType, setMealType] = useState("");
  const [description, setDescription] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date, mealType, description, antiInflammatoryScore: null }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      setOpen(false);
      setMealType("");
      setDescription("");
      setAiSuggestion("");
      toast({ title: "Meal logged", description: "Keep nourishing your body." });
    },
  });

  const getAiSuggestion = async () => {
    if (!mealType) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/meal-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealType, userId }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setAiSuggestion(data.content || "No suggestion available.");
    } catch {
      setAiSuggestion("Couldn't get a suggestion right now.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs border-border text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body gap-1">
          <Apple className="h-3.5 w-3.5" /> Log Meal
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Log a Meal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-muted/50 border-border font-body" />
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger className="bg-muted/50 border-border font-body">
              <SelectValue placeholder="Meal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snack</SelectItem>
              <SelectItem value="juice">Juice / Smoothie</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="What did you eat? (e.g. turmeric latte, green salad)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-muted/50 border-border font-body"
          />
          {mealType && (
            <Button variant="outline" size="sm" onClick={getAiSuggestion} disabled={aiLoading} className="w-full text-xs border-accent/30 text-accent hover:bg-accent/10 font-body gap-1">
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {aiLoading ? "Getting suggestion..." : `Suggest a healing ${mealType}`}
            </Button>
          )}
          {aiSuggestion && (
            <div className="bg-muted border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wider text-accent font-heading mb-1.5">AI Suggestion</p>
              <p className="text-xs text-foreground font-body leading-relaxed whitespace-pre-line">{aiSuggestion}</p>
            </div>
          )}
          <Button onClick={() => mutation.mutate()} disabled={!mealType || !description || mutation.isPending} className="w-full bg-primary text-white hover:bg-primary/90 font-body font-medium">
            {mutation.isPending ? "Saving..." : "Log Meal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LogActivityDialog({ userId, type, defaultDate }: { userId: number; type: "mindBody" | "exercise"; defaultDate?: string }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate || todayStr());
  const [activityType, setActivityType] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const isMindBody = type === "mindBody";
  const endpoint = isMindBody ? "/api/mind-body" : "/api/exercises";
  const queryKey = isMindBody ? "/api/mind-body" : "/api/exercises";
  const category = isMindBody ? "mindBody" : "exercise";

  const { data: customTypes = [] } = useQuery<CustomActivityType[]>({
    queryKey: ["/api/activity-types", { userId, category }],
    queryFn: async () => {
      const res = await fetch(`/api/activity-types?userId=${userId}&category=${category}`);
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const body = isMindBody
        ? { userId, date, activityType, durationMinutes: parseInt(duration), notes: notes || null }
        : { userId, date, exerciseType: activityType, durationMinutes: parseInt(duration), intensity: "moderate", notes: notes || null };
      return apiRequest(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setOpen(false);
      setActivityType("");
      setDuration("");
      setNotes("");
      toast({ title: isMindBody ? "Activity logged" : "Exercise logged", description: "Well done! Every step counts." });
    },
  });

  const builtInOptions = isMindBody
    ? [
        { value: "meditation", label: "Meditation" },
        { value: "breathwork", label: "Breathwork" },
        { value: "journaling", label: "Journaling" },
        { value: "yoga", label: "Yoga" },
        { value: "visualization", label: "Healing Visualization" },
        { value: "gratitude", label: "Gratitude Practice" },
      ]
    : [
        { value: "walking", label: "Walking" },
        { value: "strength-training", label: "Strength Training" },
        { value: "yoga", label: "Yoga" },
        { value: "swimming", label: "Swimming" },
        { value: "stretching", label: "Stretching" },
        { value: "tai-chi", label: "Tai Chi" },
        { value: "other", label: "Other" },
      ];

  const customOptions = customTypes.filter(ct => !builtInOptions.some(b => b.value === ct.value)).map(ct => ({ value: ct.value, label: ct.label }));
  const options = [...builtInOptions, ...customOptions];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs border-border text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body gap-1">
          {isMindBody ? <Sparkles className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
          {isMindBody ? "Log Mindfulness" : "Log Exercise"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">{isMindBody ? "Log Mind-Body Activity" : "Log Exercise"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-muted/50 border-border font-body" />
          <div className="flex items-center gap-2">
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger className="bg-muted/50 border-border font-body flex-1">
                <SelectValue placeholder="Select activity" />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ManageActivityTypesDialog userId={userId} category={category} />
          </div>
          <Input type="number" placeholder="Duration (minutes)" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-muted/50 border-border font-body" />
          <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-muted/50 border-border font-body" />
          <Button onClick={() => mutation.mutate()} disabled={!activityType || !duration || mutation.isPending} className="w-full bg-primary text-white hover:bg-primary/90 font-body font-medium">
            {mutation.isPending ? "Saving..." : "Log Activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditMealDialog({ meal, open, onOpenChange }: { meal: Meal; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [mealType, setMealType] = useState(meal.mealType);
  const [description, setDescription] = useState(meal.description);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/meals/${meal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealType, description }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      onOpenChange(false);
      toast({ title: "Meal updated" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Edit Meal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger className="bg-muted/50 border-border font-body">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snack</SelectItem>
              <SelectItem value="juice">Juice / Smoothie</SelectItem>
            </SelectContent>
          </Select>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted/50 border-border font-body" />
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full bg-primary text-white hover:bg-primary/90 font-body font-medium">
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditMindBodyDialog({ activity, open, onOpenChange }: { activity: MindBodyActivity; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [activityType, setActivityType] = useState(activity.activityType);
  const [duration, setDuration] = useState(String(activity.durationMinutes));
  const [notes, setNotes] = useState(activity.notes || "");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/mind-body/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityType, durationMinutes: parseInt(duration), notes: notes || null }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mind-body"] });
      onOpenChange(false);
      toast({ title: "Activity updated" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Edit Mind-Body Activity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={activityType} onChange={(e) => setActivityType(e.target.value)} className="bg-muted/50 border-border font-body" placeholder="Activity type" />
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-muted/50 border-border font-body" placeholder="Minutes" />
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-muted/50 border-border font-body" placeholder="Notes" />
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full bg-primary text-white hover:bg-primary/90 font-body font-medium">
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditExerciseDialog({ exercise, open, onOpenChange }: { exercise: Exercise; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [exerciseType, setExerciseType] = useState(exercise.exerciseType);
  const [duration, setDuration] = useState(String(exercise.durationMinutes));
  const [notes, setNotes] = useState(exercise.notes || "");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/exercises/${exercise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseType, durationMinutes: parseInt(duration), notes: notes || null }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      onOpenChange(false);
      toast({ title: "Exercise updated" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Edit Exercise</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={exerciseType} onChange={(e) => setExerciseType(e.target.value)} className="bg-muted/50 border-border font-body" placeholder="Exercise type" />
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-muted/50 border-border font-body" placeholder="Minutes" />
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-muted/50 border-border font-body" placeholder="Notes" />
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full bg-primary text-white hover:bg-primary/90 font-body font-medium">
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WidgetPicker({ activeWidgets, onChange }: { activeWidgets: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(activeWidgets);

  useEffect(() => {
    setSelected(activeWidgets);
  }, [activeWidgets]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  };

  const apply = () => {
    onChange(selected);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs border-border text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body gap-1.5">
          <Settings2 className="h-3.5 w-3.5" /> Customise
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Choose Your Widgets</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground font-body mb-2">Select the cards you'd like to see on your dashboard.</p>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {AVAILABLE_WIDGETS.map((w) => {
            const isActive = selected.includes(w.id);
            return (
              <button
                key={w.id}
                onClick={() => toggle(w.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  isActive
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-md ${isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {w.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-sm">{w.label}</p>
                  <p className="text-xs text-muted-foreground font-body">{w.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isActive ? "bg-primary border-primary" : "border-border"
                }`}>
                  {isActive && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={() => setSelected(getDefaultWidgets())} className="flex-1 font-body text-sm border-border text-foreground">
            Reset
          </Button>
          <Button onClick={apply} className="flex-1 bg-primary text-white hover:bg-primary/90 font-body font-medium text-sm">
            Save Layout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompactStatCard({
  icon, label, value, subtitle, accentColor, onClick
}: {
  icon: React.ReactNode; label: string; value: string | number; subtitle?: string;
  accentColor?: string; onClick: () => void;
}) {
  const accent = accentColor || "primary";
  return (
    <button
      onClick={onClick}
      className="group relative bg-white border border-border rounded-2xl p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 active:translate-y-0 w-full"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
          accent === "amber" ? "bg-accent/10 text-accent group-hover:bg-accent/15" : "bg-primary/10 text-primary group-hover:bg-primary/15"
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body font-medium mb-0.5">{label}</p>
          <p className={`text-xl font-heading ${
            accent === "amber" ? "text-accent" : "text-primary"
          }`}>{value}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
      {subtitle && <p className="text-[10px] text-muted-foreground font-body mt-2 line-clamp-1">{subtitle}</p>}
    </button>
  );
}

function ScanCountdownExpanded({ nextScanDate }: { nextScanDate: string | null }) {
  const scanDate = nextScanDate ? new Date(nextScanDate) : null;
  const daysUntil = scanDate ? Math.ceil((scanDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  const totalDays = 90;
  const progress = daysUntil !== null ? Math.max(0, Math.min(1, 1 - daysUntil / totalDays)) : 0;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative w-40 h-40 mb-4">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset} className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-heading font-bold text-foreground">{daysUntil ?? "—"}</span>
          <span className="text-xs text-muted-foreground font-body uppercase tracking-wider">days to go</span>
        </div>
      </div>
      <p className="font-heading text-base text-accent tracking-wide">Next PET/CT Scan</p>
      {scanDate && (
        <p className="text-sm text-muted-foreground font-body mt-1">
          {scanDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      <div className="mt-4 bg-primary/5 border border-primary/15 rounded-lg p-3 text-center w-full">
        <p className="text-xs font-body text-muted-foreground">
          Every day your body continues to heal. Your scans have shown consistent improvement — trust the process.
        </p>
      </div>
    </div>
  );
}

function useTreatmentJourneyTimer() {
  const treatmentStartDate = new Date("2025-04-22T00:00:00");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalMs = now.getTime() - treatmentStartDate.getTime();
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const months = Math.floor(days / 30);

  return { days, hours, minutes, seconds, months };
}

function TreatmentJourneyExpanded({ user }: { user: any }) {
  const { days, hours, minutes, seconds, months } = useTreatmentJourneyTimer();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const diagnosisDate = user.diagnosis_date ? new Date(user.diagnosis_date) : new Date("2025-04-01");
  const daysSinceDiagnosis = Math.floor((new Date().getTime() - diagnosisDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-5 py-2">
      <div className="bg-accent/5 border border-accent/15 rounded-xl p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-accent/60 font-body text-center mb-3">Treatment Journey</p>
        <div className="flex items-center justify-center gap-1">
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-accent tabular-nums">{days}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">days</p>
          </div>
          <span className="text-2xl font-heading text-accent/30 mx-2">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-accent tabular-nums">{pad(hours)}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">hrs</p>
          </div>
          <span className="text-2xl font-heading text-accent/30 mx-1">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-accent tabular-nums">{pad(minutes)}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">min</p>
          </div>
          <span className="text-2xl font-heading text-accent/30 mx-1">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-primary tabular-nums">{pad(seconds)}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">sec</p>
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-3">
          <span className="text-xs text-muted-foreground font-body">{months} months strong</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/8 border border-primary/15 rounded-xl p-4 text-center">
          <p className="text-2xl font-heading font-bold text-primary">{daysSinceDiagnosis}</p>
          <p className="text-[10px] text-muted-foreground font-body mt-1">Since Diagnosis</p>
        </div>
        <div className="bg-accent/8 border border-accent/15 rounded-xl p-4 text-center">
          <p className="text-2xl font-heading font-bold text-accent">{months}</p>
          <p className="text-[10px] text-muted-foreground font-body mt-1">Months Strong</p>
        </div>
      </div>
      <div className="flex items-center gap-3 bg-muted rounded-xl p-4 border border-border">
        <Target className="h-6 w-6 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-body font-medium text-foreground">{user.treatmentStatus || "Active Surveillance"}</p>
          <p className="text-xs text-muted-foreground font-body">{user.cancerType} — {user.cancerStage}</p>
        </div>
      </div>
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
        <p className="text-xs font-body text-muted-foreground leading-relaxed">
          {user.medicalNotes || "You're showing incredible resilience on this journey. Keep going."}
        </p>
      </div>
    </div>
  );
}

function useTumourStats(userId: number) {
  const { data: scanResults = [], isLoading } = useQuery<ScanResult[]>({
    queryKey: ["/api/scan-results", { userId }],
    queryFn: async () => {
      const res = await fetch(`/api/scan-results?userId=${userId}`);
      return res.json();
    },
  });

  if (isLoading || scanResults.length === 0) return { isLoading, scanResults, avgSizeReduction: 0, avgActivityReduction: 0, scanDates: [], tumourLabels: [], baselineScan: [], latestScan: [], maxBaselineArea: 0 };

  const scanDates = Array.from(new Set(scanResults.map((s) => s.scanDate))).sort();
  const tumourLabels = Array.from(new Set(scanResults.map((s) => s.tumourLabel))).sort();
  const baselineScan = scanResults.filter((s) => s.scanDate === scanDates[0]);
  const latestScan = scanResults.filter((s) => s.scanDate === scanDates[scanDates.length - 1]);

  let totalSizeReduction = 0;
  let totalActivityReduction = 0;
  let countSize = 0;
  let countActivity = 0;
  let maxBaselineArea = 0;

  tumourLabels.forEach((tl) => {
    const baseline = baselineScan.find((s) => s.tumourLabel === tl);
    const latest = latestScan.find((s) => s.tumourLabel === tl);
    if (baseline) {
      const bArea = baseline.sizeX * baseline.sizeY;
      if (bArea > maxBaselineArea) maxBaselineArea = bArea;
    }
    if (baseline && latest) {
      const baselineArea = baseline.sizeX * baseline.sizeY;
      const latestArea = latest.sizeX * latest.sizeY;
      if (baselineArea > 0) {
        totalSizeReduction += ((baselineArea - latestArea) / baselineArea) * 100;
        countSize++;
      }
      const baselineSuv = baseline.suvMax || 0;
      const latestSuv = latest.suvMax || 0;
      if (baselineSuv > 0) {
        totalActivityReduction += ((baselineSuv - latestSuv) / baselineSuv) * 100;
        countActivity++;
      }
    }
  });

  return {
    isLoading,
    scanResults,
    avgSizeReduction: countSize > 0 ? Math.round(totalSizeReduction / countSize) : 0,
    avgActivityReduction: countActivity > 0 ? Math.round(totalActivityReduction / countActivity) : 0,
    scanDates,
    tumourLabels,
    baselineScan,
    latestScan,
    maxBaselineArea,
  };
}

function useTumourNicknames(userId: number) {
  const { data: nicknames = [] } = useQuery<TumourNickname[]>({
    queryKey: ["/api/tumour-nicknames", { userId }],
    queryFn: async () => {
      const res = await fetch(`/api/tumour-nicknames?userId=${userId}`);
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { userId: number; tumourLabel: string; nickname: string }) => {
      return apiRequest("/api/tumour-nicknames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tumour-nicknames"] });
    },
  });

  const getNickname = (tumourLabel: string) => {
    const found = nicknames.find((n) => n.tumourLabel === tumourLabel);
    return found?.nickname || null;
  };

  return { nicknames, getNickname, saveMutation };
}

function NicknameEditor({ userId, tumourLabel, currentNickname, displayLabel }: { userId: number; tumourLabel: string; currentNickname: string | null; displayLabel: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentNickname || "");
  const { saveMutation } = useTumourNicknames(userId);
  const { toast } = useToast();

  useEffect(() => {
    if (open) setValue(currentNickname || "");
  }, [open, currentNickname]);

  const handleSave = () => {
    if (!value.trim()) return;
    saveMutation.mutate({ userId, tumourLabel, nickname: value.trim() }, {
      onSuccess: () => {
        toast({ title: "Nickname saved" });
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1 group/nick text-left">
          <span className="truncate">{displayLabel}</span>
          <Pencil className="h-3 w-3 text-muted-foreground/40 group-hover/nick:text-primary transition-colors flex-shrink-0" />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Rename Tumour</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs font-body text-muted-foreground">{tumourLabel}</p>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Give it a nickname..."
            className="bg-muted/50 border-border font-body"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="font-body">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!value.trim() || saveMutation.isPending} className="bg-primary text-white font-body">
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TumourResponseCompactTile({ userId, onClick }: { userId: number; onClick: () => void }) {
  const { isLoading, tumourLabels, baselineScan, latestScan, maxBaselineArea } = useTumourStats(userId);

  if (isLoading) {
    return (
      <button onClick={onClick} className="group relative bg-white border border-border rounded-2xl p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 active:translate-y-0 w-full">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <p className="text-sm font-body text-muted-foreground">Loading tumour response...</p>
        </div>
      </button>
    );
  }

  const tumourData = tumourLabels.map((tl) => {
    const baseline = baselineScan.find((s) => s.tumourLabel === tl);
    const latest = latestScan.find((s) => s.tumourLabel === tl);
    if (!baseline || !latest) return null;
    const baselineArea = baseline.sizeX * baseline.sizeY;
    const latestArea = latest.sizeX * latest.sizeY;
    const isResolved = latest.sizeX === 0 && latest.sizeY === 0 && (!latest.suvMax || latest.suvMax === 0);
    const noFocalUptake = !latest.suvMax && latest.sizeX > 0;
    const sizeReduction = baselineArea > 0 ? Math.round(((baselineArea - latestArea) / baselineArea) * 100) : 0;
    const baselineSuv = baseline.suvMax || 0;
    const latestSuv = latest.suvMax || 0;
    const suvReduction = baselineSuv > 0 ? Math.round(((baselineSuv - latestSuv) / baselineSuv) * 100) : 0;
    const maxDim = Math.max(baseline.sizeX, baseline.sizeY);
    return { label: tl, isResolved, noFocalUptake, sizeReduction, suvReduction, baselineSize: `${baseline.sizeX}x${baseline.sizeY}`, latestSize: isResolved ? "Gone" : `${latest.sizeX}x${latest.sizeY}`, baselineR: maxDim, latestR: isResolved ? 0 : Math.max(latest.sizeX, latest.sizeY) };
  }).filter(Boolean) as { label: string; isResolved: boolean; noFocalUptake: boolean; sizeReduction: number; suvReduction: number; baselineSize: string; latestSize: string; baselineR: number; latestR: number }[];

  const maxR = Math.max(...tumourData.map(t => t.baselineR), 1);

  return (
    <button
      onClick={onClick}
      className="group relative bg-white border border-border rounded-2xl p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 active:translate-y-0 w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body font-medium">Tumour Response</p>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {tumourData.map((t) => {
          const baseCircle = Math.max(16, (t.baselineR / maxR) * 36);
          const nowCircle = t.isResolved ? 0 : Math.max(6, (t.latestR / maxR) * 36);
          return (
            <div key={t.label} className={`rounded-xl p-3 border ${
              t.isResolved ? "bg-gradient-to-br from-blue-50 to-sky-50/60 border-blue-200/50"
              : t.noFocalUptake ? "bg-gradient-to-br from-sky-50 to-blue-50/60 border-sky-200/50"
              : "bg-gradient-to-br from-green-50 to-emerald-50/60 border-green-200/50"
            }`}>
              <p className="text-[10px] font-body text-muted-foreground mb-2 truncate">{t.label}</p>
              <div className="flex items-end gap-2 mb-1.5">
                <div className="flex items-end gap-1">
                  <div className="rounded-full border-2 border-red-300/60 bg-red-100/50 flex-shrink-0" style={{ width: baseCircle, height: baseCircle }} title={`Baseline: ${t.baselineSize}mm`} />
                  {t.isResolved ? (
                    <span className="text-base leading-none">🪓</span>
                  ) : t.noFocalUptake ? (
                    <div className="rounded-full border-2 border-sky-400/70 flex-shrink-0 relative" style={{ width: nowCircle, height: nowCircle, background: "linear-gradient(135deg, #bfdbfe 0%, #e0f2fe 40%, #dbeafe 100%)" }} title={`Now: ${t.latestSize}mm`}>
                      <span className="absolute -top-1 -right-1 text-[8px]">❄️</span>
                    </div>
                  ) : (
                    <div className="rounded-full border-2 border-green-400/70 bg-green-200/60 flex-shrink-0" style={{ width: nowCircle, height: nowCircle }} title={`Now: ${t.latestSize}mm`} />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className={`text-lg font-heading font-bold leading-none ${t.isResolved ? "text-blue-600" : t.noFocalUptake ? "text-sky-600" : "text-green-700"}`}>
                    {t.isResolved ? "Gone" : t.noFocalUptake ? "Cold" : `↓${t.suvReduction}%`}
                  </p>
                  <p className="text-[9px] font-body text-muted-foreground mt-0.5">
                    {t.isResolved ? "Resolved ❄️" : t.noFocalUptake ? "No focal uptake ❄️" : `Size ↓${t.sizeReduction}%`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-body text-muted-foreground/70">
                <span>{t.baselineSize}mm</span>
                <span>→</span>
                <span className={t.isResolved ? "text-blue-500 font-medium" : t.noFocalUptake ? "text-sky-500 font-medium" : "text-green-600 font-medium"}>{t.latestSize}{t.isResolved ? "" : "mm"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </button>
  );
}

function ActivityRing({ cx, cy, radius, remainingPct }: { cx: number; cy: number; radius: number; remainingPct: number }) {
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, remainingPct));
  const dashOffset = circumference * (1 - pct / 100);
  return (
    <>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(38, 40%, 90%)" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(38, 92%, 50%)" strokeWidth={3} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={dashOffset} transform={`rotate(-90 ${cx} ${cy})`} className="transition-all duration-1000" />
    </>
  );
}

function TumourResponseExpanded({ userId }: { userId: number }) {
  const { scanResults, tumourLabels, baselineScan, latestScan, avgSizeReduction, avgActivityReduction, maxBaselineArea } = useTumourStats(userId);
  const { getNickname } = useTumourNicknames(userId);

  if (scanResults.length === 0) {
    return <p className="text-sm text-muted-foreground font-body text-center py-4">No scan data available yet.</p>;
  }

  const showCelebration = avgSizeReduction > 30 || avgActivityReduction > 30;

  return (
    <div className="space-y-5 py-2">
      {showCelebration && (
        <div className="relative overflow-hidden bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-2xl p-4 text-center">
          <div className="absolute top-1 left-3 text-lg animate-bounce" style={{ animationDelay: "0s" }}>✨</div>
          <div className="absolute top-2 right-5 text-sm animate-bounce" style={{ animationDelay: "0.3s" }}>🎉</div>
          <div className="absolute bottom-1 left-8 text-sm animate-bounce" style={{ animationDelay: "0.6s" }}>⭐</div>
          <div className="absolute bottom-2 right-3 text-lg animate-bounce" style={{ animationDelay: "0.2s" }}>✨</div>
          <p className="font-heading text-lg text-emerald-800 mb-1">Amazing Progress!</p>
          <p className="text-xs font-body text-emerald-700">Your body is responding beautifully to treatment. Every scan tells a story of healing — and yours is remarkable.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {tumourLabels.map((tl) => {
          const baseline = baselineScan.find((s) => s.tumourLabel === tl);
          const latest = latestScan.find((s) => s.tumourLabel === tl);
          if (!baseline || !latest) return null;

          const baselineArea = baseline.sizeX * baseline.sizeY;
          const latestArea = latest.sizeX * latest.sizeY;
          const isResolved = latest.sizeX === 0 && latest.sizeY === 0 && (!latest.suvMax || latest.suvMax === 0);
          const noFocalUptake = !latest.suvMax && latest.sizeX > 0;
          const sizeReduction = baselineArea > 0 ? Math.round(((baselineArea - latestArea) / baselineArea) * 100) : 0;
          const isMetabolicComplete = !latest.suvMax || latest.suvMax === 0;
          const baselineSuv = baseline.suvMax || 0;
          const latestSuv = latest.suvMax || 0;
          const suvReduction = baselineSuv > 0 ? Math.round(((baselineSuv - latestSuv) / baselineSuv) * 100) : 0;
          const suvRemaining = 100 - suvReduction;

          const proportionalSize = maxBaselineArea > 0 ? Math.sqrt(baselineArea / maxBaselineArea) : 0.5;
          const baselineR = Math.max(20, proportionalSize * 52);
          const currentR = isResolved ? 0 : (baselineArea > 0 ? Math.max(5, Math.sqrt(latestArea / maxBaselineArea) * 52) : 0);
          const activityRingR = baselineR + 8;
          const svgSize = (activityRingR + 6) * 2;
          const cx = svgSize / 2;
          const cy = svgSize / 2;

          const nickname = getNickname(tl);
          const displayName = nickname || tl;

          return (
            <div
              key={tl}
              className={`rounded-2xl border p-5 transition-all ${
                isResolved ? "bg-gradient-to-br from-blue-50/60 via-white to-sky-50/40 border-blue-200/50"
                : noFocalUptake ? "bg-gradient-to-br from-sky-50/40 via-white to-blue-50/30 border-sky-200/50"
                : "bg-white border-border"
              }`}
            >
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
                  {isResolved ? (
                    <>
                      <svg width={svgSize} height={svgSize}>
                        <defs>
                          <linearGradient id={`ice-grad-${tl}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.5" />
                            <stop offset="30%" stopColor="#93c5fd" stopOpacity="0.3" />
                            <stop offset="70%" stopColor="#dbeafe" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#eff6ff" stopOpacity="0.4" />
                          </linearGradient>
                          <filter id={`frost-${tl}`}>
                            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
                            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                          </filter>
                          <clipPath id={`circle-clip-${tl}`}>
                            <circle cx={cx} cy={cy} r={baselineR} />
                          </clipPath>
                        </defs>
                        <circle cx={cx} cy={cy} r={baselineR} fill={`url(#ice-grad-${tl})`} stroke="#93c5fd" strokeWidth={1.5} strokeDasharray="3 5" opacity={0.6} />
                        <circle cx={cx} cy={cy} r={baselineR * 0.7} fill="none" stroke="#bfdbfe" strokeWidth={0.5} strokeDasharray="2 4" opacity={0.4} />
                        <circle cx={cx} cy={cy} r={baselineR * 0.4} fill="#dbeafe" opacity={0.2} />
                        <g clipPath={`url(#circle-clip-${tl})`}>
                          <line x1={cx - baselineR * 0.9} y1={cy + baselineR * 0.15} x2={cx + baselineR * 0.9} y2={cy - baselineR * 0.15} stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
                          <line x1={cx - baselineR * 0.7} y1={cy - baselineR * 0.1} x2={cx + baselineR * 0.7} y2={cy + baselineR * 0.1} stroke="#60a5fa" strokeWidth={1.5} strokeLinecap="round" opacity={0.45} />
                          <line x1={cx - baselineR * 0.5} y1={cy + baselineR * 0.35} x2={cx + baselineR * 0.3} y2={cy - baselineR * 0.5} stroke="#93c5fd" strokeWidth={1} strokeLinecap="round" opacity={0.35} />
                          <line x1={cx + baselineR * 0.2} y1={cy + baselineR * 0.4} x2={cx + baselineR * 0.6} y2={cy - baselineR * 0.3} stroke="#93c5fd" strokeWidth={0.8} strokeLinecap="round" opacity={0.3} />
                        </g>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl drop-shadow-sm" style={{ transform: "rotate(-15deg)" }}>🪓</span>
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 text-[10px]">❄️</div>
                      <div className="absolute -bottom-0.5 -left-0.5 text-[10px]">❄️</div>
                    </>
                  ) : noFocalUptake ? (
                    <>
                      <svg width={svgSize} height={svgSize}>
                        <defs>
                          <linearGradient id={`cold-grad-${tl}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.7" />
                            <stop offset="40%" stopColor="#e0f2fe" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.8" />
                          </linearGradient>
                          <clipPath id={`cold-clip-${tl}`}>
                            <circle cx={cx} cy={cy} r={currentR} />
                          </clipPath>
                        </defs>
                        <circle cx={cx} cy={cy} r={baselineR} fill="none" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="4 4" />
                        <circle cx={cx} cy={cy} r={currentR} fill={`url(#cold-grad-${tl})`} stroke="#7dd3fc" strokeWidth={1.5} className="transition-all duration-1000" />
                        <g clipPath={`url(#cold-clip-${tl})`} opacity={0.5}>
                          <line x1={cx - currentR * 0.8} y1={cy + currentR * 0.1} x2={cx + currentR * 0.8} y2={cy - currentR * 0.1} stroke="#38bdf8" strokeWidth={1.5} strokeLinecap="round" />
                          <line x1={cx - currentR * 0.6} y1={cy - currentR * 0.3} x2={cx + currentR * 0.5} y2={cy + currentR * 0.3} stroke="#7dd3fc" strokeWidth={1} strokeLinecap="round" />
                          <line x1={cx - currentR * 0.3} y1={cy + currentR * 0.5} x2={cx + currentR * 0.4} y2={cy - currentR * 0.6} stroke="#93c5fd" strokeWidth={0.8} strokeLinecap="round" />
                        </g>
                        <circle cx={cx} cy={cy} r={activityRingR} fill="none" stroke="#7dd3fc" strokeWidth={3} strokeDasharray="2 6" opacity={0.3} />
                      </svg>
                      <div className="absolute -top-0.5 -right-0.5 text-[10px]">❄️</div>
                    </>
                  ) : (
                    <svg width={svgSize} height={svgSize}>
                      <circle cx={cx} cy={cy} r={baselineR} fill="none" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="4 4" />
                      {currentR > 0 && (
                        <circle cx={cx} cy={cy} r={currentR} fill="hsl(142, 71%, 85%)" stroke="hsl(142, 71%, 45%)" strokeWidth={1.5} className="transition-all duration-1000" />
                      )}
                      <ActivityRing cx={cx} cy={cy} radius={activityRingR} remainingPct={isMetabolicComplete ? 0 : suvRemaining} />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`flex items-center gap-1.5 text-sm font-heading mb-1 ${isResolved ? "text-muted-foreground/60" : "text-foreground"}`}>
                    <NicknameEditor userId={userId} tumourLabel={tl} currentNickname={nickname} displayLabel={displayName} />
                    <ScanResultEditor userId={userId} tumourLabel={tl} displayName={displayName} />
                  </div>
                  {isResolved ? (
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-sky-50 text-blue-600 text-xs font-body font-semibold border border-blue-200/50">
                        🪓 Axed &amp; Gone Cold
                      </span>
                      <p className="text-xs font-body text-blue-400/70 mt-1.5">Frozen out — no longer visible on imaging ❄️</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-body font-semibold ${
                          noFocalUptake ? "bg-sky-50 text-sky-700 border border-sky-200/50" : "bg-amber-50 text-amber-700"
                        }`}>
                          {noFocalUptake ? (
                            <>❄️ Cold — no focal uptake</>
                          ) : (
                            <><ArrowDown className="h-3 w-3" />{isMetabolicComplete ? "100" : suvReduction}% activity</>
                          )}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-body font-semibold">
                          <ArrowDown className="h-3 w-3" />{sizeReduction}% size
                        </span>
                      </div>
                      <p className={`text-xs font-body ${noFocalUptake ? "text-sky-500" : "text-muted-foreground"}`}>
                        {latest.sizeX}×{latest.sizeY}mm
                        {noFocalUptake ? " · Metabolically cold ❄️" : latest.suvMax ? ` · SUV ${latest.suvMax}` : ""}
                      </p>
                    </>
                  )}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-body">
                      <span className="text-muted-foreground">Baseline</span>
                      <span className="text-foreground font-medium">{baseline.sizeX}×{baseline.sizeY}mm{baseline.suvMax ? ` · SUV ${baseline.suvMax}` : ""}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-body">
                      <span className="text-muted-foreground">Latest</span>
                      <span className={`font-medium ${isResolved ? "text-blue-500" : noFocalUptake ? "text-sky-500" : "text-foreground"}`}>
                        {latest.sizeX === 0 && latest.sizeY === 0 ? "🪓 Axed!" : `${latest.sizeX}×${latest.sizeY}mm`}
                        {latest.suvMax ? ` · SUV ${latest.suvMax}` : isResolved ? " · Ice cold ❄️" : noFocalUptake ? " · Cold ❄️" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-6 text-[10px] text-muted-foreground font-body">
        <span className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full border border-gray-300" style={{ borderStyle: "dashed" }} /> Baseline size</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: "hsl(142, 71%, 85%)", border: "1px solid hsl(142, 71%, 45%)" }} /> Current size</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: "hsl(38, 92%, 50%)" }} /> Activity remaining</span>
      </div>
    </div>
  );
}

function ScanResultEditor({ userId, tumourLabel, displayName }: { userId: number; tumourLabel: string; displayName: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: allScans = [] } = useQuery<ScanResult[]>({
    queryKey: ["/api/scan-results", { userId }],
    queryFn: async () => {
      const res = await fetch(`/api/scan-results?userId=${userId}`);
      return res.json();
    },
  });

  const tumourScans = useMemo(() =>
    allScans
      .filter(s => s.tumourLabel === tumourLabel)
      .sort((a, b) => a.scanDate.localeCompare(b.scanDate)),
    [allScans, tumourLabel]
  );

  const [editValues, setEditValues] = useState<Record<number, { sizeX: string; sizeY: string; suvMax: string; notes: string }>>({});

  const scanKey = tumourScans.map(s => `${s.id}-${s.sizeX}-${s.sizeY}-${s.suvMax}`).join("|");
  useEffect(() => {
    if (open) {
      const vals: Record<number, { sizeX: string; sizeY: string; suvMax: string; notes: string }> = {};
      tumourScans.forEach(s => {
        vals[s.id] = {
          sizeX: String(s.sizeX),
          sizeY: String(s.sizeY),
          suvMax: s.suvMax != null ? String(s.suvMax) : "",
          notes: s.notes || "",
        };
      });
      setEditValues(vals);
    }
  }, [open, scanKey]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { sizeX?: number; sizeY?: number; suvMax?: number | null; notes?: string } }) => {
      return apiRequest(`/api/scan-results/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scan-results", { userId }] });
    },
  });

  const handleSave = async () => {
    let saved = 0;
    for (const scan of tumourScans) {
      const ev = editValues[scan.id];
      if (!ev) continue;
      const newSizeX = parseFloat(ev.sizeX) || 0;
      const newSizeY = parseFloat(ev.sizeY) || 0;
      const newSuvMax = ev.suvMax.trim() === "" ? null : parseFloat(ev.suvMax);
      const newNotes = ev.notes.trim();

      const changed = newSizeX !== scan.sizeX || newSizeY !== scan.sizeY ||
        (newSuvMax !== scan.suvMax) || newNotes !== (scan.notes || "");

      if (changed) {
        await updateMutation.mutateAsync({
          id: scan.id,
          data: { sizeX: newSizeX, sizeY: newSizeY, suvMax: newSuvMax, notes: newNotes },
        });
        saved++;
      }
    }
    toast({ title: saved > 0 ? "Scan results updated" : "No changes to save" });
    if (saved > 0) setOpen(false);
  };

  const updateField = (id: number, field: string, value: string) => {
    setEditValues(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Edit scan results">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{displayName}</DialogTitle>
          <p className="text-xs font-body text-muted-foreground">Update size and SUV from your scan results</p>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {tumourScans.map((scan) => {
            const ev = editValues[scan.id];
            if (!ev) return null;
            const scanDateFormatted = new Date(scan.scanDate + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
            return (
              <div key={scan.id} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-heading font-semibold">{scanDateFormatted}</p>
                  <p className="text-[10px] font-body text-muted-foreground">{scan.scanLabel}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-body text-muted-foreground block mb-1">Size X (mm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={ev.sizeX}
                      onChange={(e) => updateField(scan.id, "sizeX", e.target.value)}
                      className="h-8 text-sm font-body"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-body text-muted-foreground block mb-1">Size Y (mm)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={ev.sizeY}
                      onChange={(e) => updateField(scan.id, "sizeY", e.target.value)}
                      className="h-8 text-sm font-body"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-body text-muted-foreground block mb-1">SUV Max</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={ev.suvMax}
                      onChange={(e) => updateField(scan.id, "suvMax", e.target.value)}
                      className="h-8 text-sm font-body"
                      placeholder="—"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-body text-muted-foreground block mb-1">Notes</label>
                  <Input
                    value={ev.notes}
                    onChange={(e) => updateField(scan.id, "notes", e.target.value)}
                    className="h-8 text-sm font-body"
                    placeholder="e.g. No focal uptake"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1 font-body" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="flex-1 font-body bg-primary hover:bg-primary/90" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const DAILY_BRIEF_SESSION_KEY = "elizabeth-daily-brief-cache";

function useDailyBrief(userId: number) {
  const [brief, setBrief] = useState<string | null>(() => {
    try {
      const cached = sessionStorage.getItem(DAILY_BRIEF_SESSION_KEY);
      if (cached) return cached;
    } catch {}
    return null;
  });
  const [hasLoaded, setHasLoaded] = useState(!!brief);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ content: string }>("/api/ai/daily-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: (data) => {
      const content = data.content || "Let's go, legend 👑";
      setBrief(content);
      setHasLoaded(true);
      try { sessionStorage.setItem(DAILY_BRIEF_SESSION_KEY, content); } catch {}
    },
    onError: () => {
      setBrief("You're doing amazing things 💫");
      setHasLoaded(true);
    },
  });

  useEffect(() => {
    if (!hasLoaded && !mutation.isPending) {
      mutation.mutate();
    }
  }, []);

  const refresh = () => {
    try { sessionStorage.removeItem(DAILY_BRIEF_SESSION_KEY); } catch {}
    mutation.mutate();
  };

  return { brief, isLoading: mutation.isPending && !brief, refresh, isPending: mutation.isPending };
}

function DaySummaryDialog({ userId, open, onOpenChange }: { userId: number; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", { userId }],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?userId=${userId}`);
      return res.json();
    },
    enabled: open,
  });
  const { data: meals = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals", { userId, date: todayStr() }],
    queryFn: async () => {
      const res = await fetch(`/api/meals?userId=${userId}&dateFrom=${todayStr()}&dateTo=${todayStr()}`);
      return res.json();
    },
    enabled: open,
  });
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", { userId, date: todayStr() }],
    queryFn: async () => {
      const res = await fetch(`/api/exercises?userId=${userId}&dateFrom=${todayStr()}&dateTo=${todayStr()}`);
      return res.json();
    },
    enabled: open,
  });

  const today = todayStr();
  const todaysAppts = appointments.filter(a => a.date === today).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const upcomingAppts = appointments.filter(a => a.date > today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Your Day
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {appointments.length === 0 && !meals.length && !exercises.length && (
            <div className="space-y-2">
              <div className="h-12 bg-muted/40 rounded-xl animate-pulse" />
              <div className="h-10 bg-muted/30 rounded-xl animate-pulse" />
              <div className="h-10 bg-muted/20 rounded-xl animate-pulse" />
            </div>
          )}
          {todaysAppts.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body font-medium mb-2">Today</p>
              <div className="space-y-2">
                {todaysAppts.map(a => (
                  <div key={a.id} className="flex items-center gap-3 bg-primary/5 rounded-xl px-3 py-2.5 border border-primary/10">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-foreground font-medium">{a.title}</p>
                      {a.time && <p className="text-xs font-body text-muted-foreground">{a.time}{a.location ? ` · ${a.location}` : ""}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {todaysAppts.length === 0 && (
            <div className="bg-muted/30 rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-body text-muted-foreground">No appointments today — enjoy your free time 🌿</p>
            </div>
          )}
          {upcomingAppts.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body font-medium mb-2">Coming Up</p>
              <div className="space-y-1.5">
                {upcomingAppts.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-foreground">{a.title}</p>
                      <p className="text-[10px] font-body text-muted-foreground">{new Date(a.date + "T00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}{a.time ? ` · ${a.time}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(meals.length > 0 || exercises.length > 0) && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body font-medium mb-2">Logged Today</p>
              <div className="flex flex-wrap gap-2">
                {meals.map(m => (
                  <span key={m.id} className="inline-flex items-center gap-1 text-xs font-body bg-amber-50 text-amber-700 rounded-full px-2.5 py-1 border border-amber-200/50">
                    <Utensils className="h-3 w-3" /> {m.mealType}
                  </span>
                ))}
                {exercises.map(e => (
                  <span key={e.id} className="inline-flex items-center gap-1 text-xs font-body bg-green-50 text-green-700 rounded-full px-2.5 py-1 border border-green-200/50">
                    <Dumbbell className="h-3 w-3" /> {e.exerciseType}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getTodayDateString() {
  return new Date().toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' }).split('/').reverse().join('-');
}

function WorthFightingForWidget({ userId }: { userId: number }) {
  const [wallOpen, setWallOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState("amber");
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<MotivationalWallItem | null>(null);
  const [nanoBananaImage, setNanoBananaImage] = useState<string | null>(null);
  const [nanoBananaCaption, setNanoBananaCaption] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [creativity, setCreativity] = useState(0.3);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadLatestBanana() {
      try {
        const res = await fetch(`/api/ai/nano-banana/latest?userId=${userId}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (data.imagePath) {
          setNanoBananaImage(data.imagePath);
          setNanoBananaCaption(data.caption || "You've got this 🍌");
          const today = getTodayDateString();
          if (data.date !== today) {
            generateNanoBananaAuto();
          }
        } else {
          generateNanoBananaAuto();
        }
      } catch {
        setNanoBananaImage("/nano-banana/default-1.png");
        setNanoBananaCaption("You've got this, warrior 🍌");
      } finally {
        setInitialLoadDone(true);
      }
    }

    async function generateNanoBananaAuto() {
      try {
        setGenerating(true);
        const res = await fetch("/api/ai/nano-banana", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, creativity: 0.3 }),
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setNanoBananaImage(data.imagePath);
        setNanoBananaCaption(data.caption || "You've got this 🍌");
      } catch {
        if (!nanoBananaImage) {
          setNanoBananaImage("/nano-banana/default-1.png");
          setNanoBananaCaption("You've got this, warrior 🍌");
        }
      } finally {
        setGenerating(false);
      }
    }

    loadLatestBanana();
  }, [userId]);

  const { data: items = [] } = useQuery<MotivationalWallItem[]>({
    queryKey: ["/api/motivational-wall", { userId }],
    queryFn: async () => {
      const res = await fetch(`/api/motivational-wall?userId=${userId}`);
      return res.json();
    },
  });

  const mediaItems = items.filter(i => i.type === "image" || i.type === "video");

  const creativityLabel = creativity < 0.25 ? "Gentle" : creativity < 0.5 ? "Warm" : creativity < 0.75 ? "Playful" : "Bananas!";
  const creativityEmoji = creativity < 0.25 ? "🤍" : creativity < 0.5 ? "💛" : creativity < 0.75 ? "🎨" : "🍌";

  const generateNanoBanana = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/nano-banana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, creativity }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNanoBananaImage(data.imagePath);
      setNanoBananaCaption(data.caption || "You've got this 🍌");
    } catch {
      setNanoBananaCaption("Tap the banana to try again 🍌");
    } finally {
      setGenerating(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/motivational-wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type: "text", content: newContent, color: newColor }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/motivational-wall"] });
      setNewContent("");
      setAddOpen(false);
      toast({ title: "Added to your wall" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/motivational-wall/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/motivational-wall"] });
      setPreviewItem(null);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", String(userId));
      formData.append("content", "");
      formData.append("color", "amber");
      const res = await fetch("/api/motivational-wall/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      queryClient.invalidateQueries({ queryKey: ["/api/motivational-wall"] });
      toast({ title: "Added to your wall" });
    } catch {
      toast({ title: "Upload failed — try a smaller file", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const colorMap: Record<string, string> = {
    amber: "from-amber-50 to-orange-50 border-amber-200/50",
    green: "from-green-50 to-emerald-50 border-green-200/50",
    blue: "from-blue-50 to-cyan-50 border-blue-200/50",
    pink: "from-pink-50 to-rose-50 border-pink-200/50",
    purple: "from-purple-50 to-violet-50 border-purple-200/50",
  };

  return (
    <>
      <div className="bg-gradient-to-br from-accent/5 via-white to-amber-50/50 border border-accent/20 rounded-2xl overflow-hidden transition-all hover:shadow-lg w-full">
        {/* Nano Banana Image Section */}
        <button
          onClick={() => nanoBananaImage ? setWallOpen(true) : generateNanoBanana()}
          disabled={generating}
          className="w-full text-left relative"
        >
          {nanoBananaImage ? (
            <div className="relative">
              <img src={nanoBananaImage} alt="Nano Banana" className="w-full aspect-[4/3] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-lg font-heading text-white leading-snug drop-shadow-md">{nanoBananaCaption}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); generateNanoBanana(); }}
                disabled={generating}
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 text-white" />}
              </button>
            </div>
          ) : (
            <div className="p-4 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-200/60 to-amber-200/60 flex items-center justify-center flex-shrink-0">
                  {generating ? <Loader2 className="h-5 w-5 text-amber-600 animate-spin" /> : <Zap className="h-5 w-5 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  {generating ? (
                    <div className="space-y-1.5">
                      <div className="h-3 bg-amber-100 rounded-full w-3/4 animate-pulse" />
                      <p className="text-xs text-amber-500/70 font-body">Creating your image...</p>
                    </div>
                  ) : (
                    <p className="text-sm font-body text-muted-foreground">Tap to generate a Nano Banana 🍌</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </button>

        {/* Title + Carousel Section */}
        <div className="px-3 pt-2 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-accent" />
              <p className="text-xs font-heading text-foreground uppercase tracking-wide">Worth Fighting For</p>
            </div>
            <button onClick={() => setWallOpen(true)} className="text-[10px] text-accent font-body font-medium hover:underline">
              View All
            </button>
          </div>

          {mediaItems.length > 0 ? (
            <div ref={carouselRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {mediaItems.map((item) => (
                <button key={item.id} onClick={() => setPreviewItem(item)}
                  className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-border/50 hover:ring-2 hover:ring-accent/30 transition-all">
                  {item.type === "video" ? (
                    <div className="relative w-full h-full">
                      <video src={item.imageUrl!} className="w-full h-full object-cover" muted preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <img src={item.imageUrl!} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
              <button onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center hover:border-accent/50 hover:bg-accent/5 transition-colors">
                <Plus className="h-4 w-4 text-muted-foreground/50" />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-2 py-2 px-3 rounded-xl border border-dashed border-border/50 hover:border-accent/50 hover:bg-accent/5 transition-colors">
              <ImagePlus className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-xs font-body text-muted-foreground/70">Add photos & videos</span>
            </button>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />

      {/* Full Wall Dialog */}
      <Dialog open={wallOpen} onOpenChange={setWallOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-0 rounded-2xl">
          {/* Nano Banana hero in dialog */}
          {nanoBananaImage && (
            <div className="relative">
              <img src={nanoBananaImage} alt="Nano Banana" className="w-full aspect-[4/3] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-lg font-heading text-white leading-snug drop-shadow-lg">{nanoBananaCaption}</p>
              </div>
              <button
                onClick={generateNanoBanana}
                disabled={generating}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-sm text-white rounded-full text-xs font-body hover:bg-black/50 transition-colors disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                {generating ? "Creating..." : "New 🍌"}
              </button>
            </div>
          )}

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base flex items-center gap-2">
                <Heart className="h-5 w-5 text-accent" /> Worth Fighting For
              </h3>
              {!nanoBananaImage && (
                <button onClick={generateNanoBanana} disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full text-xs font-body hover:from-amber-600 hover:to-yellow-600 transition-all disabled:opacity-50 shadow-sm">
                  {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  Nano 🍌
                </button>
              )}
            </div>

            <div className="bg-gradient-to-r from-amber-50/80 to-yellow-50/60 rounded-xl p-3 border border-amber-200/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-amber-700/70 font-body font-medium">Creativity</span>
                <span className="text-xs font-body font-semibold text-amber-700">{creativityEmoji} {creativityLabel}</span>
              </div>
              <Slider
                value={[creativity]}
                onValueChange={(v) => setCreativity(v[0])}
                min={0}
                max={1}
                step={0.01}
                className="w-full [&_[data-radix-slider-track]]:bg-amber-200/50 [&_[data-radix-slider-range]]:bg-gradient-to-r [&_[data-radix-slider-range]]:from-amber-400 [&_[data-radix-slider-range]]:to-yellow-400 [&_[data-radix-slider-thumb]]:border-amber-400 [&_[data-radix-slider-thumb]]:shadow-md"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] font-body text-amber-600/50">Conservative</span>
                <span className="text-[9px] font-body text-amber-600/50">Go bananas</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="flex-1 rounded-xl font-body text-xs h-9 border-dashed">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <ImagePlus className="h-3.5 w-3.5 mr-1.5" />}
                {uploading ? "Uploading..." : "Add Photo / Video"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}
                className="rounded-xl font-body text-xs h-9 border-dashed">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Text
              </Button>
            </div>

            {items.length === 0 ? (
              <button onClick={() => fileInputRef.current?.click()} className="w-full bg-muted/30 hover:bg-muted/50 border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors">
                <ImagePlus className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-body text-muted-foreground">Add photos, videos & reasons to keep fighting</p>
                <p className="text-xs font-body text-muted-foreground/60 mt-1">People, moments, dreams, places...</p>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {items.map((item) => (
                  <button key={item.id} onClick={() => setPreviewItem(item)}
                    className={`group relative rounded-xl overflow-hidden min-h-[100px] transition-all hover:shadow-md ${
                      item.type === "text" ? `bg-gradient-to-br ${colorMap[item.color || "amber"] || colorMap.amber} border p-3 flex items-center justify-center` : ""
                    }`}>
                    {item.type === "image" && item.imageUrl && (
                      <img src={item.imageUrl} alt={item.content || ""} className="w-full h-full object-cover absolute inset-0" />
                    )}
                    {item.type === "video" && item.imageUrl && (
                      <>
                        <video src={item.imageUrl} className="w-full h-full object-cover absolute inset-0" muted preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <Play className="h-3.5 w-3.5 text-foreground ml-0.5" />
                          </div>
                        </div>
                      </>
                    )}
                    {item.type === "text" && (
                      <p className="text-xs font-body text-foreground text-center leading-relaxed relative z-10">{item.content}</p>
                    )}
                    {(item.type === "image" || item.type === "video") && item.content && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
                        <p className="text-[10px] font-body text-white leading-snug">{item.content}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Item Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => { if (!open) setPreviewItem(null); }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
          {previewItem && (
            <div>
              {previewItem.type === "image" && previewItem.imageUrl && (
                <img src={previewItem.imageUrl} alt={previewItem.content || ""} className="w-full max-h-[60vh] object-contain bg-black" />
              )}
              {previewItem.type === "video" && previewItem.imageUrl && (
                <video src={previewItem.imageUrl} controls autoPlay className="w-full max-h-[60vh] bg-black" />
              )}
              {previewItem.type === "text" && (
                <div className={`bg-gradient-to-br ${colorMap[previewItem.color || "amber"] || colorMap.amber} p-8 min-h-[200px] flex items-center justify-center`}>
                  <p className="text-lg font-body text-foreground text-center leading-relaxed">{previewItem.content}</p>
                </div>
              )}
              <div className="p-4 flex items-center justify-between">
                {previewItem.content && (previewItem.type === "image" || previewItem.type === "video") ? (
                  <p className="text-sm font-body text-foreground flex-1">{previewItem.content}</p>
                ) : (
                  <div className="flex-1" />
                )}
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(previewItem.id)}
                  className="text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl text-xs font-body ml-2">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Text Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add to Your Wall</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-body text-muted-foreground mb-2 block">What's worth fighting for?</label>
              <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)}
                placeholder="A person, a dream, a moment, a quote..."
                className="resize-none font-body text-sm min-h-[80px]" />
            </div>
            <div>
              <label className="text-sm font-body text-muted-foreground mb-2 block">Colour</label>
              <div className="flex gap-2">
                {Object.keys(colorMap).map((c) => (
                  <button key={c} onClick={() => setNewColor(c)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorMap[c]} border-2 transition-all ${newColor === c ? "ring-2 ring-primary scale-110" : ""}`} />
                ))}
              </div>
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={!newContent.trim() || createMutation.isPending}
              className="w-full bg-primary text-white hover:bg-primary/90 font-body rounded-xl">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add to Wall
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TodayWellnessWidget({ userId }: { userId: number }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editingMindBody, setEditingMindBody] = useState<MindBodyActivity | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const { toast } = useToast();

  const { data: dayMeals = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals", { userId, date: selectedDate }],
    queryFn: async () => {
      const res = await fetch(`/api/meals?userId=${userId}&dateFrom=${selectedDate}&dateTo=${selectedDate}`);
      return res.json();
    },
  });
  const { data: dayMindBody = [] } = useQuery<MindBodyActivity[]>({
    queryKey: ["/api/mind-body", { userId, date: selectedDate }],
    queryFn: async () => {
      const res = await fetch(`/api/mind-body?userId=${userId}&dateFrom=${selectedDate}&dateTo=${selectedDate}`);
      return res.json();
    },
  });
  const { data: dayExercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", { userId, date: selectedDate }],
    queryFn: async () => {
      const res = await fetch(`/api/exercises?userId=${userId}&dateFrom=${selectedDate}&dateTo=${selectedDate}`);
      return res.json();
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/meals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Meal deleted" });
    },
  });

  const deleteMindBodyMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/mind-body/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mind-body"] });
      toast({ title: "Activity deleted" });
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/exercises/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({ title: "Exercise deleted" });
    },
  });

  const totalMindBodyMins = dayMindBody.reduce((sum, a) => sum + a.durationMinutes, 0);
  const totalExerciseMins = dayExercises.reduce((sum, e) => sum + e.durationMinutes, 0);

  const isToday = selectedDate === todayStr();
  const displayDate = new Date(selectedDate + "T00:00:00");

  return (
    <Card className="bg-white border-border rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading text-foreground flex items-center gap-2">
            <Heart className="h-4 w-4 text-accent" /> {isToday ? "Today" : displayDate.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
          </h2>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-auto h-7 text-[10px] bg-muted/50 border-border font-body" />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <LogMealDialog userId={userId} defaultDate={selectedDate} />
          <LogActivityDialog userId={userId} type="mindBody" defaultDate={selectedDate} />
          <LogActivityDialog userId={userId} type="exercise" defaultDate={selectedDate} />
        </div>

        {(dayMeals.length > 0 || dayMindBody.length > 0 || dayExercises.length > 0) && (
          <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-body">
                <Utensils className="h-3 w-3 text-accent" />
                <span className="font-semibold text-foreground">{dayMeals.length}</span>
                <span className="text-muted-foreground">meals</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-body">
                <Brain className="h-3 w-3 text-primary" />
                <span className="font-semibold text-foreground">{totalMindBodyMins}</span>
                <span className="text-muted-foreground">min mind</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-body">
                <Dumbbell className="h-3 w-3 text-sky-500" />
                <span className="font-semibold text-foreground">{totalExerciseMins}</span>
                <span className="text-muted-foreground">min move</span>
              </div>
            </div>
            {dayMeals.map((meal) => (
              <div key={meal.id} className="flex items-center gap-2 text-xs font-body text-foreground group">
                <Check className="h-3 w-3 text-accent flex-shrink-0" />
                <span className="capitalize text-muted-foreground">{meal.mealType}:</span>
                <span className="flex-1 truncate">{meal.description}</span>
                <button onClick={() => setEditingMeal(meal)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded">
                  <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </button>
                <button onClick={() => deleteMealMutation.mutate(meal.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded">
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                </button>
              </div>
            ))}
            {dayMindBody.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-xs font-body text-foreground group">
                <Check className="h-3 w-3 text-primary flex-shrink-0" />
                <span className="capitalize">{a.activityType}</span>
                <span className="text-muted-foreground">— {a.durationMinutes} min</span>
                <div className="flex-1" />
                <button onClick={() => setEditingMindBody(a)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded">
                  <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </button>
                <button onClick={() => deleteMindBodyMutation.mutate(a.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded">
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                </button>
              </div>
            ))}
            {dayExercises.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-xs font-body text-foreground group">
                <Check className="h-3 w-3 text-sky-500 flex-shrink-0" />
                <span className="capitalize">{e.exerciseType}</span>
                <span className="text-muted-foreground">— {e.durationMinutes} min</span>
                <div className="flex-1" />
                <button onClick={() => setEditingExercise(e)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded">
                  <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </button>
                <button onClick={() => deleteExerciseMutation.mutate(e.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded">
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {editingMeal && <EditMealDialog meal={editingMeal} open={!!editingMeal} onOpenChange={(v) => { if (!v) setEditingMeal(null); }} />}
      {editingMindBody && <EditMindBodyDialog activity={editingMindBody} open={!!editingMindBody} onOpenChange={(v) => { if (!v) setEditingMindBody(null); }} />}
      {editingExercise && <EditExerciseDialog exercise={editingExercise} open={!!editingExercise} onOpenChange={(v) => { if (!v) setEditingExercise(null); }} />}
    </Card>
  );
}

function SleepTrackerWidget({ userId }: { userId: number }) {
  const [logOpen, setLogOpen] = useState(false);
  const [hours, setHours] = useState("7");
  const [quality, setQuality] = useState("3");
  const [notes, setNotes] = useState("");
  const [logDate, setLogDate] = useState(todayStr());
  const { toast } = useToast();

  const last7Start = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split("T")[0];
  }, []);

  const { data: sleepData = [], isLoading: sleepLoading } = useQuery<SleepEntry[]>({
    queryKey: ["/api/sleep", { userId, dateFrom: last7Start, dateTo: todayStr() }],
    queryFn: async () => {
      const res = await fetch(`/api/sleep?userId=${userId}&dateFrom=${last7Start}&dateTo=${todayStr()}`);
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date: logDate,
          hours: parseFloat(hours),
          quality: parseInt(quality),
          notes: notes || null,
          source: "manual",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sleep"] });
      setLogOpen(false);
      setHours("7");
      setQuality("3");
      setNotes("");
      setLogDate(todayStr());
      toast({ title: "Sleep logged", description: "Sweet dreams tracked." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/sleep/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sleep"] });
      toast({ title: "Entry removed" });
    },
  });

  const todayEntry = sleepData.find((e) => e.date === todayStr());
  const avgHours = sleepData.length > 0 ? (sleepData.reduce((sum, e) => sum + e.hours, 0) / sleepData.length).toFixed(1) : null;
  const avgQuality = sleepData.length > 0 ? (sleepData.reduce((sum, e) => sum + e.quality, 0) / sleepData.length).toFixed(1) : null;

  const qualityLabel = (q: number) => {
    if (q <= 1) return "Poor";
    if (q <= 2) return "Fair";
    if (q <= 3) return "Good";
    if (q <= 4) return "Great";
    return "Excellent";
  };

  const qualityColor = (q: number) => {
    if (q <= 1) return "text-red-400";
    if (q <= 2) return "text-amber-400";
    if (q <= 3) return "text-primary";
    if (q <= 4) return "text-emerald-500";
    return "text-emerald-600";
  };

  const renderStars = (q: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-3 w-3 ${i < q ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
    ));
  };

  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const entry = sleepData.find((e) => e.date === dateStr);
      days.push({
        label: d.toLocaleDateString("en-AU", { weekday: "short" }).charAt(0),
        date: dateStr,
        hours: entry?.hours ?? 0,
        quality: entry?.quality ?? 0,
        hasData: !!entry,
      });
    }
    return days;
  }, [sleepData]);

  const maxHours = Math.max(10, ...last7Days.map((d) => d.hours));

  return (
    <Card className="bg-white border-border rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading text-foreground flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-400" /> Sleep
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
              <CloudMoon className="h-3 w-3" /> Wearable ready
            </span>
            <Dialog open={logOpen} onOpenChange={setLogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs border-border text-foreground hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 font-body gap-1 h-7">
                  <Plus className="h-3 w-3" /> Log
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-border">
                <DialogHeader>
                  <DialogTitle className="font-heading text-foreground flex items-center gap-2">
                    <Moon className="h-5 w-5 text-indigo-400" /> Log Sleep
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-body text-muted-foreground mb-1 block">Date</label>
                    <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="bg-muted/50 border-border font-body" />
                  </div>
                  <div>
                    <label className="text-xs font-body text-muted-foreground mb-1 block">Hours slept</label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[parseFloat(hours)]}
                        onValueChange={(v) => setHours(v[0].toString())}
                        min={0}
                        max={14}
                        step={0.5}
                        className="flex-1"
                      />
                      <span className="text-lg font-heading text-indigo-500 w-12 text-right">{hours}h</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-body text-muted-foreground mb-1 block">Quality</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuality(q.toString())}
                          className={`flex-1 py-2 rounded-xl border text-xs font-body transition-all ${
                            parseInt(quality) === q
                              ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-medium"
                              : "border-border text-muted-foreground hover:border-indigo-200"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <Star className={`h-3.5 w-3.5 ${parseInt(quality) === q ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                            <span className="text-[10px]">{qualityLabel(q)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-body text-muted-foreground mb-1 block">Notes (optional)</label>
                    <Textarea
                      placeholder="How did you feel? Any dreams?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-muted/50 border-border font-body text-sm resize-none"
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                    className="w-full bg-indigo-500 text-white hover:bg-indigo-600 font-body font-medium"
                  >
                    {createMutation.isPending ? "Saving..." : "Log Sleep"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {sleepLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 text-indigo-300 animate-spin" />
          </div>
        ) : sleepData.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100">
                <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-body mb-0.5">Last Night</p>
                <p className="text-xl font-heading text-indigo-600">
                  {todayEntry ? `${todayEntry.hours}h` : "—"}
                </p>
                {todayEntry && (
                  <div className="flex items-center gap-0.5 mt-1">{renderStars(todayEntry.quality)}</div>
                )}
              </div>
              <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-0.5">7-Day Avg</p>
                <p className="text-xl font-heading text-foreground">{avgHours}h</p>
                <p className={`text-[10px] font-body ${qualityColor(Math.round(parseFloat(avgQuality || "0")))}`}>
                  {avgQuality ? qualityLabel(Math.round(parseFloat(avgQuality))) : "—"}
                </p>
              </div>
            </div>

            <div className="bg-muted/20 rounded-xl p-3 border border-border/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-2">This Week</p>
              <div className="flex items-end gap-1 h-16">
                {last7Days.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: "48px" }}>
                      {day.hasData ? (
                        <div
                          className="w-full max-w-[20px] rounded-t-md transition-all"
                          style={{
                            height: `${(day.hours / maxHours) * 48}px`,
                            background: day.quality >= 4 ? "linear-gradient(to top, #818cf8, #6366f1)" :
                                        day.quality >= 3 ? "linear-gradient(to top, #a5b4fc, #818cf8)" :
                                        day.quality >= 2 ? "linear-gradient(to top, #c7d2fe, #a5b4fc)" :
                                        "linear-gradient(to top, #e0e7ff, #c7d2fe)",
                          }}
                        />
                      ) : (
                        <div className="w-full max-w-[20px] h-1 rounded bg-muted-foreground/10" />
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground font-body">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {sleepData.length > 0 && (
              <div className="space-y-1">
                {sleepData.slice(-3).reverse().map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 text-xs font-body text-foreground group">
                    <Moon className="h-3 w-3 text-indigo-400 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {new Date(entry.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                    </span>
                    <span className="font-medium">{entry.hours}h</span>
                    <div className="flex items-center gap-0.5">{renderStars(entry.quality)}</div>
                    {entry.source !== "manual" && (
                      <span className="text-[9px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-full">{entry.source}</span>
                    )}
                    <div className="flex-1" />
                    <button
                      onClick={() => deleteMutation.mutate(entry.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Moon className="h-8 w-8 text-indigo-200 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-body">No sleep data yet</p>
            <p className="text-[10px] text-muted-foreground/70 font-body mt-1">Log your first night or connect a wearable</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExpandableWidget({ title, icon, children, open, onOpenChange }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  open: boolean; onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground tracking-wide flex items-center gap-2">
            {icon} {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default function SimpleDashboard() {
  const { user, setUser } = useUser();
  const { toast } = useToast();
  const [activeWidgets, setActiveWidgets] = useState<string[]>(loadWidgets());
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [daySummaryOpen, setDaySummaryOpen] = useState(false);
  const dailyBrief = useDailyBrief(user?.id ?? 0);

  const handleWidgetChange = (ids: string[]) => {
    setActiveWidgets(ids);
    saveWidgets(ids);
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-body">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (id: string) => activeWidgets.includes(id);

  const scanDate = user.nextScanDate ? new Date(user.nextScanDate) : null;
  const daysUntilScan = scanDate ? Math.ceil((scanDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  const treatmentStartDate = new Date("2025-04-22");
  const daysSinceTreatmentStart = Math.floor((new Date().getTime() - treatmentStartDate.getTime()) / (1000 * 60 * 60 * 24));

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/users/${user.id}/photo`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const updated = await res.json();
      setUser(updated);
      toast({ title: "Photo updated!" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="px-4 py-4 lg:p-8 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {user.profilePhoto ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-sm">
                <img src={user.profilePhoto} alt={user.displayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/15 flex items-center justify-center shadow-sm">
                <span className="text-lg font-heading text-primary/60">{(user.displayName || "L")[0]}</span>
              </div>
            )}
            <button onClick={() => photoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-primary/20 flex items-center justify-center shadow-sm hover:bg-primary/5 transition-colors">
              {uploadingPhoto ? <Loader2 className="h-2.5 w-2.5 text-primary animate-spin" /> : <Camera className="h-2.5 w-2.5 text-primary" />}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-heading text-foreground">
              Hey {user?.displayName || "Friend"}
            </h1>
            <p className="text-xs text-muted-foreground font-body">
              {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <WidgetPicker activeWidgets={activeWidgets} onChange={handleWidgetChange} />
        </div>
      </div>

      {/* Today's Vibe — tap to see day summary */}
      {isActive("dailyBrief") && (
        <div className="mb-4">
          <button onClick={() => setDaySummaryOpen(true)} className="w-full px-4 py-3 rounded-2xl bg-white border border-border hover:shadow-md hover:-translate-y-0.5 transition-all text-left group">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {dailyBrief.isLoading ? (
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-accent/10 rounded-full w-4/5 animate-pulse" />
                    <div className="h-3.5 bg-accent/10 rounded-full w-3/5 animate-pulse" />
                  </div>
                ) : (
                  <p className="text-sm font-body text-foreground leading-relaxed whitespace-pre-line">{dailyBrief.brief}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                <span onClick={(e) => { e.stopPropagation(); dailyBrief.refresh(); }}
                  className="w-7 h-7 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center transition-colors cursor-pointer">
                  {dailyBrief.isPending ? <Loader2 className="h-3 w-3 text-accent animate-spin" /> : <RefreshCw className="h-3 w-3 text-accent" />}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </button>
        </div>
      )}
      <DaySummaryDialog userId={user.id} open={daySummaryOpen} onOpenChange={setDaySummaryOpen} />

      {/* Quick Log + Today's Wellness (always visible) */}
      <TodayWellnessWidget userId={user.id} />

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
        {isActive("scanCountdown") && (
          <CompactStatCard
            icon={<Scan className="h-5 w-5" />}
            label="Next Scan"
            value={daysUntilScan ?? "—"}
            subtitle={scanDate ? scanDate.toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : undefined}
            onClick={() => setExpandedWidget("scanCountdown")}
          />
        )}
        {isActive("treatmentJourney") && (
          <CompactStatCard
            icon={<Shield className="h-5 w-5" />}
            label="Treatment Journey"
            value={`${daysSinceTreatmentStart}d`}
            subtitle={user.treatmentStatus || "Active Surveillance"}
            accentColor="amber"
            onClick={() => setExpandedWidget("treatmentJourney")}
          />
        )}
      </div>

      {/* Tumour Response */}
      {isActive("tumourResponse") && (
        <div className="mb-4">
          <TumourResponseCompactTile userId={user.id} onClick={() => setExpandedWidget("tumourResponse")} />
        </div>
      )}

      {/* Worth Fighting For + Nano Banana */}
      {isActive("motivationalWall") && (
        <div className="mb-4">
          <WorthFightingForWidget userId={user.id} />
        </div>
      )}

      {/* Sleep Tracker */}
      {isActive("sleepTracker") && (
        <div className="mb-4">
          <SleepTrackerWidget userId={user.id} />
        </div>
      )}

      {/* Expanded dialogs */}
      <ExpandableWidget title="Next Scan Countdown" icon={<Scan className="h-5 w-5 text-primary" />}
        open={expandedWidget === "scanCountdown"} onOpenChange={(open) => setExpandedWidget(open ? "scanCountdown" : null)}>
        <ScanCountdownExpanded nextScanDate={user.nextScanDate} />
      </ExpandableWidget>
      <ExpandableWidget title="Your Treatment Journey" icon={<Shield className="h-5 w-5 text-primary" />}
        open={expandedWidget === "treatmentJourney"} onOpenChange={(open) => setExpandedWidget(open ? "treatmentJourney" : null)}>
        <TreatmentJourneyExpanded user={user} />
      </ExpandableWidget>
      <ExpandableWidget title="Tumour Response" icon={<TrendingUp className="h-5 w-5 text-primary" />}
        open={expandedWidget === "tumourResponse"} onOpenChange={(open) => setExpandedWidget(open ? "tumourResponse" : null)}>
        <TumourResponseExpanded userId={user.id} />
      </ExpandableWidget>
    </div>
  );
}
