import { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "@/contexts/UserContext";
import {
  MessageCircle, TrendingUp, Heart, Sparkles, Activity, Apple, Leaf, Shield, Target, Clock,
  Scan, Plus, Check, Loader2, Settings2, X, GripVertical, Flame, Sun, BarChart3, Calendar,
  ArrowDown, Zap, ChevronRight, Wine, Camera, Pencil, Trash2, Edit3, Stethoscope, Waves,
  BookHeart, ImagePlus, Trophy, SmilePlus, Utensils, Dumbbell, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Meal, MindBodyActivity, Exercise, ScanResult, Appointment, CustomActivityType, TumourNickname, JournalEntry, MotivationalWallItem } from "@shared/schema";
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

const ALL_WIDGETS: WidgetDef[] = [
  { id: "scanCountdown", label: "Next Scan Countdown", description: "Visual countdown to your next scan", icon: <Scan className="h-4 w-4" />, defaultVisible: true },
  { id: "treatmentJourney", label: "Treatment Journey", description: "Days since diagnosis and key milestones", icon: <Shield className="h-4 w-4" />, defaultVisible: true },
  { id: "tumourResponse", label: "Tumour Response", description: "Visualise tumour size and activity changes", icon: <BarChart3 className="h-4 w-4" />, defaultVisible: true },
  { id: "dailyBrief", label: "Daily Brief", description: "Personalised AI wellness message", icon: <Sparkles className="h-4 w-4" />, defaultVisible: true },
  { id: "todayWellness", label: "Today's Wellness", description: "Log meals, mindfulness, and exercise", icon: <Heart className="h-4 w-4" />, defaultVisible: true },
  { id: "activityStreak", label: "Activity Streak", description: "Track meals, exercise & mindfulness streaks", icon: <Flame className="h-4 w-4" />, defaultVisible: true },
  { id: "healingTherapies", label: "Healing Therapies", description: "Accumulated therapy sessions and minutes", icon: <Stethoscope className="h-4 w-4" />, defaultVisible: false },
  { id: "treatmentTimeline", label: "Treatment Timeline", description: "Your full treatment history", icon: <Clock className="h-4 w-4" />, defaultVisible: false },
  { id: "aiAssistant", label: "AI Health Assistant", description: "Quick access to personalised guidance", icon: <MessageCircle className="h-4 w-4" />, defaultVisible: false },
  { id: "appointments", label: "Upcoming Appointments", description: "Your scheduled appointments", icon: <Calendar className="h-4 w-4" />, defaultVisible: false },
  { id: "inspiration", label: "Daily Inspiration", description: "A daily healing affirmation", icon: <Sun className="h-4 w-4" />, defaultVisible: false },
  { id: "gutCheck", label: "Daily Gut Check", description: "Quick daily journal with AI insights", icon: <BookHeart className="h-4 w-4" />, defaultVisible: true },
  { id: "motivationalWall", label: "Evidence Wall", description: "Evidence of a Life Worth Fighting For", icon: <ImagePlus className="h-4 w-4" />, defaultVisible: true },
  { id: "funFacts", label: "Fun Stats", description: "Fun rotating wellness achievements", icon: <Trophy className="h-4 w-4" />, defaultVisible: true },
];

function getDefaultWidgets(): string[] {
  return ALL_WIDGETS.filter(w => w.defaultVisible).map(w => w.id);
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

function EditGoalsDialog({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const [open, setOpen] = useState(false);
  const [goals, setGoals] = useState(user.goals || "");
  const { toast } = useToast();

  useEffect(() => {
    if (open) setGoals(user.goals || "");
  }, [open, user.goals]);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals }),
      });
    },
    onSuccess: (data: any) => {
      setUser(data);
      setOpen(false);
      toast({ title: "Goals updated", description: "Keep striving!" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary font-body gap-1 h-7 px-2">
          <Edit3 className="h-3 w-3" /> Goals
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Edit Your Goals</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-border bg-muted/50 p-3 text-sm font-body text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="What are your healing goals?"
          />
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full bg-primary text-white hover:bg-primary/90 font-body font-medium">
            {mutation.isPending ? "Saving..." : "Save Goals"}
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
          {ALL_WIDGETS.map((w) => {
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

function useImmuneRecoveryTimer() {
  const immunoSuppressionEndDate = new Date("2025-12-01T00:00:00");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalMs = now.getTime() - immunoSuppressionEndDate.getTime();
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  return { days, hours, minutes, seconds, weeks, months };
}

function ImmuneRecoveryCompactTimer({ onClick }: { onClick: () => void }) {
  const { days, weeks } = useImmuneRecoveryTimer();

  return (
    <CompactStatCard
      icon={<Zap className="h-5 w-5" />}
      label="Immune Recovery"
      value={`${days}d`}
      subtitle={`${weeks} weeks recovering`}
      onClick={onClick}
    />
  );
}

function ImmuneRecoveryExpanded() {
  const { days, hours, minutes, seconds, weeks, months } = useImmuneRecoveryTimer();
  const pad = (n: number) => n.toString().padStart(2, "0");

  const milestones = [
    { weeks: 4, label: "Initial recovery phase", done: weeks >= 4 },
    { weeks: 8, label: "Immune cells rebuilding", done: weeks >= 8 },
    { weeks: 12, label: "T-cell function improving", done: weeks >= 12 },
    { weeks: 24, label: "Substantial immune restoration", done: weeks >= 24 },
    { weeks: 52, label: "Full immune reconstitution", done: weeks >= 52 },
  ];

  return (
    <div className="space-y-5 py-2">
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-body text-center mb-3">Time Recovering</p>
        <div className="flex items-center justify-center gap-1">
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-primary tabular-nums">{days}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">days</p>
          </div>
          <span className="text-2xl font-heading text-primary/30 mx-2">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-primary tabular-nums">{pad(hours)}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">hrs</p>
          </div>
          <span className="text-2xl font-heading text-primary/30 mx-1">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-primary tabular-nums">{pad(minutes)}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">min</p>
          </div>
          <span className="text-2xl font-heading text-primary/30 mx-1">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-accent tabular-nums">{pad(seconds)}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-1">sec</p>
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-3">
          <span className="text-xs font-body text-muted-foreground"><strong className="text-primary font-heading">{weeks}</strong> weeks</span>
          <span className="text-xs font-body text-muted-foreground"><strong className="text-accent font-heading">{months}</strong> months</span>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-heading text-accent uppercase tracking-wider">Recovery Milestones</p>
        {milestones.map((m, i) => (
          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${m.done ? "bg-primary/8" : "bg-muted"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${m.done ? "bg-primary text-white" : "border-2 border-border"}`}>
              {m.done && <Check className="h-3 w-3" />}
            </div>
            <span className={`text-sm font-body ${m.done ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</span>
            <span className="text-[10px] text-muted-foreground font-body ml-auto">{m.weeks}w</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityStreakExpanded({ userId }: { userId: number }) {
  const { data: recentMeals = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals", { userId, recent: true }],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const res = await fetch(`/api/meals?userId=${userId}&dateFrom=${sevenDaysAgo}&dateTo=${todayStr()}`);
      return res.json();
    },
  });
  const { data: recentMindBody = [] } = useQuery<MindBodyActivity[]>({
    queryKey: ["/api/mind-body", { userId, recent: true }],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const res = await fetch(`/api/mind-body?userId=${userId}&dateFrom=${sevenDaysAgo}&dateTo=${todayStr()}`);
      return res.json();
    },
  });
  const { data: recentExercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", { userId, recent: true }],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const res = await fetch(`/api/exercises?userId=${userId}&dateFrom=${sevenDaysAgo}&dateTo=${todayStr()}`);
      return res.json();
    },
  });

  const activeDates = new Set<string>();
  recentMeals.forEach((m) => activeDates.add(m.date));
  recentMindBody.forEach((a) => activeDates.add(a.date));
  recentExercises.forEach((e) => activeDates.add(e.date));

  let streak = 0;
  const d = new Date();
  while (true) {
    const dateStr = d.toISOString().split("T")[0];
    if (activeDates.has(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = dt.toISOString().split("T")[0];
    const meals = recentMeals.filter(m => m.date === dateStr).length;
    const mindBody = recentMindBody.filter(a => a.date === dateStr).length;
    const exercises = recentExercises.filter(e => e.date === dateStr).length;
    return {
      day: dt.toLocaleDateString("en-AU", { weekday: "short" }),
      date: dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      active: activeDates.has(dateStr),
      meals, mindBody, exercises
    };
  });

  return (
    <div className="space-y-4 py-2">
      <div className="text-center">
        <p className="text-4xl font-heading font-bold text-accent">{streak}</p>
        <p className="text-sm text-muted-foreground font-body">Day Activity Streak</p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {last7.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <p className="text-[9px] text-muted-foreground font-body">{d.day}</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-heading transition-all ${
              d.active ? "bg-accent text-white shadow-sm" : "bg-muted text-muted-foreground"
            }`}>
              {d.active ? <Check className="h-3.5 w-3.5" /> : "·"}
            </div>
            <div className="flex gap-0.5">
              {d.meals > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              {d.mindBody > 0 && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
              {d.exercises > 0 && <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 text-[10px] text-muted-foreground font-body">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Meals</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent" /> Mindfulness</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sky-500" /> Exercise</span>
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
      <button onClick={onClick} className="group relative bg-white border border-border rounded-2xl p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 active:translate-y-0 w-full col-span-2 lg:col-span-4">
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
    const sizeReduction = baselineArea > 0 ? Math.round(((baselineArea - latestArea) / baselineArea) * 100) : 0;
    return { label: tl, isResolved, sizeReduction };
  }).filter(Boolean) as { label: string; isResolved: boolean; sizeReduction: number }[];

  return (
    <button
      onClick={onClick}
      className="group relative bg-white border border-border rounded-2xl p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 active:translate-y-0 w-full col-span-2 lg:col-span-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body font-medium">Tumour Response</p>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
      <div className="flex items-center gap-2 overflow-x-auto">
        {tumourData.map((t) => (
          <div key={t.label} className={`flex items-center gap-2 rounded-xl px-3 py-2 border flex-1 min-w-0 ${
            t.isResolved
              ? "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200/60"
              : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/60"
          }`}>
            {t.isResolved ? (
              <div className="relative w-9 h-9 flex-shrink-0">
                <svg width={36} height={36} viewBox="0 0 36 36">
                  <circle cx={18} cy={18} r={14} fill="#dbeafe" stroke="#93c5fd" strokeWidth={1.5} strokeDasharray="3 4" opacity={0.7} />
                  <line x1={6} y1={20} x2={30} y2={16} stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
                  <line x1={8} y1={16} x2={28} y2={20} stroke="#60a5fa" strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm">🪓</span>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <ArrowDown className="h-4 w-4 text-green-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-body text-muted-foreground truncate">{t.label}</p>
              <p className={`text-sm font-heading font-bold ${t.isResolved ? "text-blue-600" : "text-green-700"}`}>
                {t.isResolved ? "Axed! ❄️" : `↓${t.sizeReduction}%`}
              </p>
            </div>
          </div>
        ))}
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
                isResolved ? "bg-gradient-to-br from-blue-50/60 via-white to-sky-50/40 border-blue-200/50" : "bg-white border-border"
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
                  <div className={`text-sm font-heading mb-1 ${isResolved ? "text-muted-foreground/60" : "text-foreground"}`}>
                    <NicknameEditor userId={userId} tumourLabel={tl} currentNickname={nickname} displayLabel={displayName} />
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
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-body font-semibold">
                          <ArrowDown className="h-3 w-3" />{sizeReduction}% size
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-body font-semibold">
                          <ArrowDown className="h-3 w-3" />{isMetabolicComplete ? "100" : suvReduction}% activity
                        </span>
                      </div>
                      <p className="text-xs font-body text-muted-foreground">
                        {latest.sizeX}×{latest.sizeY}mm
                        {isMetabolicComplete ? " · No metabolic activity" : latest.suvMax ? ` · SUV ${latest.suvMax}` : ""}
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
                      <span className={`font-medium ${isResolved ? "text-blue-500" : "text-foreground"}`}>
                        {latest.sizeX === 0 && latest.sizeY === 0 ? "🪓 Axed!" : `${latest.sizeX}×${latest.sizeY}mm`}
                        {latest.suvMax ? ` · SUV ${latest.suvMax}` : isResolved ? " · Ice cold ❄️" : " · Clear"}
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

const DAILY_BRIEF_SESSION_KEY = "elizabeth-daily-brief-cache";

function DailyBriefWidget({ userId }: { userId: number }) {
  const [brief, setBrief] = useState<string | null>(() => {
    try {
      const cached = sessionStorage.getItem(DAILY_BRIEF_SESSION_KEY);
      if (cached) return cached;
    } catch {}
    return null;
  });
  const [hasLoaded, setHasLoaded] = useState(!!brief);

  const { data: allAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", { userId }],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?userId=${userId}`);
      return res.json();
    },
  });

  const today = todayStr();
  const todaysAppointments = allAppointments.filter(a => a.date === today);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ content: string }>("/api/ai/daily-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: (data) => {
      const content = data.content || "You've got this, queen! 👑";
      setBrief(content);
      setHasLoaded(true);
      try { sessionStorage.setItem(DAILY_BRIEF_SESSION_KEY, content); } catch {}
    },
    onError: () => {
      setBrief("Plot twist: you're the hero of this story 💫");
      setHasLoaded(true);
    },
  });

  useEffect(() => {
    if (!hasLoaded && !mutation.isPending) {
      mutation.mutate();
    }
  }, []);

  const handleRefresh = () => {
    try { sessionStorage.removeItem(DAILY_BRIEF_SESSION_KEY); } catch {}
    mutation.mutate();
  };

  return (
    <Card className="bg-gradient-to-br from-amber-50/80 via-white to-primary/5 border-amber-200/50 rounded-2xl overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <span className="text-xs font-body text-muted-foreground uppercase tracking-wider">Today's Vibe</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={mutation.isPending}
            className="text-xs text-muted-foreground hover:text-accent font-body h-7 px-2"
          >
            {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          </Button>
        </div>
        {mutation.isPending && !brief ? (
          <div className="h-5 bg-muted rounded-full w-3/4 animate-pulse" />
        ) : (
          <p className="text-lg font-heading text-foreground leading-snug">{brief}</p>
        )}

        {todaysAppointments.length > 0 && (
          <div className="mt-4 pt-3 border-t border-amber-200/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-2">Today's Schedule</p>
            <div className="space-y-2">
              {todaysAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center gap-2.5 bg-white/70 rounded-xl px-3 py-2">
                  <div className="w-1.5 h-8 rounded-full bg-primary/60 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-foreground truncate">{appt.title}</p>
                    <p className="text-xs text-muted-foreground font-body">{appt.time}{appt.location ? ` · ${appt.location}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GutCheckWidget({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const { toast } = useToast();

  const { data: entries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal", { userId }],
    queryFn: async () => {
      const res = await fetch(`/api/journal?userId=${userId}`);
      return res.json();
    },
  });

  const todayEntry = entries.find(e => e.date === todayStr());

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date: todayStr(), mood, energy, content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setOpen(false);
      setContent("");
      setMood(3);
      setEnergy(3);
      toast({ title: "Gut check saved ✨" });
    },
  });

  const analysisMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ analysis: string }>("/api/ai/journal-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    },
  });

  const moodEmojis = ["😔", "😐", "🙂", "😊", "🤩"];
  const energyEmojis = ["🔋", "🪫", "⚡", "💪", "🚀"];

  const recentEntries = entries
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <Card className="bg-white border-border rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-foreground text-base flex items-center gap-2">
            <BookHeart className="h-5 w-5 text-primary" /> Daily Gut Check
          </CardTitle>
          <div className="flex gap-1">
            {entries.length >= 2 && (
              <Button variant="ghost" size="sm" onClick={() => { setShowAnalysis(!showAnalysis); if (!showAnalysis && !analysisMutation.data) analysisMutation.mutate(); }}
                className="text-xs text-muted-foreground hover:text-primary font-body h-7 px-2">
                {analysisMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Insights
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)}
              className="text-xs text-muted-foreground hover:text-primary font-body h-7 px-2">
              <Plus className="h-3 w-3 mr-1" /> Log
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {todayEntry ? (
          <div className="bg-primary/5 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-lg">{moodEmojis[(todayEntry.mood || 3) - 1]}</span>
              <span className="text-lg">{energyEmojis[(todayEntry.energy || 3) - 1]}</span>
              <span className="text-[10px] text-muted-foreground font-body">Today</span>
            </div>
            <p className="text-sm font-body text-foreground line-clamp-2">{todayEntry.content}</p>
          </div>
        ) : (
          <button onClick={() => setOpen(true)} className="w-full bg-muted/50 hover:bg-muted rounded-xl p-4 text-center transition-colors mb-3">
            <SmilePlus className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs font-body text-muted-foreground">How are you feeling today?</p>
          </button>
        )}

        {showAnalysis && analysisMutation.data && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 mb-3">
            <p className="text-xs font-body text-foreground leading-relaxed">{(analysisMutation.data as any).analysis}</p>
          </div>
        )}

        {recentEntries.length > 0 && (
          <div className="flex gap-1.5">
            {recentEntries.slice(0, 7).map((e) => (
              <div key={e.id} className="flex flex-col items-center gap-0.5" title={`${e.date}: ${e.content}`}>
                <span className="text-sm">{moodEmojis[(e.mood || 3) - 1]}</span>
                <span className="text-[8px] text-muted-foreground font-body">
                  {new Date(e.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Daily Gut Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-body text-muted-foreground mb-2 block">How's your mood?</label>
              <div className="flex gap-2">
                {moodEmojis.map((emoji, i) => (
                  <button key={i} onClick={() => setMood(i + 1)}
                    className={`text-2xl p-2 rounded-xl transition-all ${mood === i + 1 ? "bg-primary/15 scale-110 ring-2 ring-primary/30" : "hover:bg-muted"}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-body text-muted-foreground mb-2 block">Energy level?</label>
              <div className="flex gap-2">
                {energyEmojis.map((emoji, i) => (
                  <button key={i} onClick={() => setEnergy(i + 1)}
                    className={`text-2xl p-2 rounded-xl transition-all ${energy === i + 1 ? "bg-accent/15 scale-110 ring-2 ring-accent/30" : "hover:bg-muted"}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-body text-muted-foreground mb-2 block">What's on your mind?</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="Just a few words... how are you really feeling?"
                className="resize-none font-body text-sm min-h-[80px]" />
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={!content.trim() || createMutation.isPending}
              className="w-full bg-primary text-white hover:bg-primary/90 font-body rounded-xl">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Gut Check
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function MotivationalWallWidget({ userId }: { userId: number }) {
  const [wallOpen, setWallOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState("amber");
  const { toast } = useToast();

  const { data: items = [] } = useQuery<MotivationalWallItem[]>({
    queryKey: ["/api/motivational-wall", { userId }],
    queryFn: async () => {
      const res = await fetch(`/api/motivational-wall?userId=${userId}`);
      return res.json();
    },
  });

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
    },
  });

  const colorMap: Record<string, string> = {
    amber: "from-amber-50 to-orange-50 border-amber-200/50",
    green: "from-green-50 to-emerald-50 border-green-200/50",
    blue: "from-blue-50 to-cyan-50 border-blue-200/50",
    pink: "from-pink-50 to-rose-50 border-pink-200/50",
    purple: "from-purple-50 to-violet-50 border-purple-200/50",
  };

  return (
    <>
      <button onClick={() => setWallOpen(true)}
        className="group bg-gradient-to-br from-accent/10 via-white to-primary/5 border border-accent/20 rounded-2xl p-4 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
            <Heart className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading text-foreground">Evidence Worth Fighting For</p>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">
              {items.length > 0 ? `${items.length} reasons on your wall` : "Tap to start your wall"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
        </div>
      </button>

      <Dialog open={wallOpen} onOpenChange={setWallOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Heart className="h-5 w-5 text-accent" /> Evidence Worth Fighting For
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {items.length === 0 ? (
              <button onClick={() => setAddOpen(true)} className="w-full bg-muted/30 hover:bg-muted/50 border-2 border-dashed border-border rounded-xl p-8 text-center transition-colors">
                <Heart className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-body text-muted-foreground">Add reasons to keep fighting</p>
                <p className="text-xs font-body text-muted-foreground/60 mt-1">Photos, quotes, people, dreams, moments...</p>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {items.map((item) => (
                  <div key={item.id} className={`group relative bg-gradient-to-br ${colorMap[item.color || "amber"] || colorMap.amber} border rounded-xl p-3 min-h-[80px] flex items-center justify-center`}>
                    <p className="text-xs font-body text-foreground text-center leading-relaxed">{item.content}</p>
                    <button onClick={() => deleteMutation.mutate(item.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setAddOpen(true)} className="border-2 border-dashed border-border rounded-xl p-3 min-h-[80px] flex items-center justify-center hover:bg-muted/30 transition-colors">
                  <Plus className="h-5 w-5 text-muted-foreground/40" />
                </button>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-xs font-body text-muted-foreground mb-3 text-center">A little banana-sized motivation</p>
              <div className="rounded-xl overflow-hidden bg-muted/30 border border-border aspect-video flex items-center justify-center">
                <div className="text-center p-4">
                  <span className="text-3xl mb-2 block">🍌</span>
                  <p className="text-sm font-heading text-foreground">Nano Banana Short</p>
                  <p className="text-[10px] font-body text-muted-foreground mt-1">Coming soon — tiny videos, big feelings</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

function FunFactsWidget({ userId }: { userId: number }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: factsData } = useQuery<{ facts: string[] }>({
    queryKey: ["/api/fun-facts", { userId }],
    queryFn: async () => {
      const res = await fetch(`/api/fun-facts?userId=${userId}`);
      return res.json();
    },
  });

  const facts = factsData?.facts || [];
  if (facts.length === 0) return null;

  const fact = facts[currentIndex % facts.length];
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < facts.length - 1;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-white to-accent/5 border-primary/20 rounded-2xl overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
            <Trophy className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-0.5">Did you know?</p>
            <p className="text-sm font-body text-foreground font-medium leading-snug">{fact}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => canPrev && setCurrentIndex(currentIndex - 1)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${canPrev ? "bg-muted hover:bg-primary/10 text-foreground" : "text-muted-foreground/30 cursor-default"}`}>
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          </button>
          <div className="flex gap-1">
            {facts.map((_, i) => (
              <button key={i} onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentIndex % facts.length ? "bg-accent w-4" : "bg-border w-1.5 hover:bg-accent/30"}`} />
            ))}
          </div>
          <button onClick={() => canNext && setCurrentIndex(currentIndex + 1)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${canNext ? "bg-muted hover:bg-primary/10 text-foreground" : "text-muted-foreground/30 cursor-default"}`}>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardContent>
    </Card>
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

function TreatmentTimelineWidget() {
  const timeline = [
    { date: "April 2025", title: "Diagnosis", desc: "Stage IV melanoma with liver metastases. Three liver tumours identified.", color: "bg-accent" },
    { date: "April–July 2025", title: "Immunotherapy", desc: "4 cycles of ipilimumab + nivolumab. Major partial metabolic response achieved.", color: "bg-primary" },
    { date: "July 2025", title: "Treatment Paused", desc: "Immunotherapy paused due to severe toxicity (Grade 4 hepatitis, colitis). Started immunosuppression.", color: "bg-red-500" },
    { date: "December 2025", title: "Immunosuppression Ceased", desc: "Approximately 5 months of mycophenolate completed. Immune system now recovering.", color: "bg-accent" },
    { date: "February 2026", title: "Continued Improvement", desc: "Latest scan shows continued improvement. One lesion metabolically complete. No new disease anywhere.", color: "bg-primary" },
  ];

  return (
    <Card className="bg-white border-border rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-foreground tracking-wide text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Treatment Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`} />
                {i < timeline.length && <div className="w-px h-8 bg-muted" />}
              </div>
              <div className="-mt-0.5">
                <p className="font-body font-medium text-sm text-foreground">{item.date} — {item.title}</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-4">
            <div className="w-3 h-3 rounded-full border-2 border-primary bg-white flex-shrink-0" />
            <div className="-mt-0.5">
              <p className="font-body font-medium text-sm text-primary">May 2026 — Goal: NED</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">Target: No Evidence of Disease confirmation at next scan.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppointmentFormDialog({ userId, appointment, open, onOpenChange }: {
  userId: number; appointment?: Appointment; open: boolean; onOpenChange: (v: boolean) => void;
}) {
  const [title, setTitle] = useState(appointment?.title || "");
  const [description, setDescription] = useState(appointment?.description || "");
  const [date, setDate] = useState(appointment?.date || "");
  const [time, setTime] = useState(appointment?.time || "");
  const [location, setLocation] = useState(appointment?.location || "");
  const { toast } = useToast();
  const isEdit = !!appointment;

  useEffect(() => {
    if (open) {
      setTitle(appointment?.title || "");
      setDescription(appointment?.description || "");
      setDate(appointment?.date || "");
      setTime(appointment?.time || "");
      setLocation(appointment?.location || "");
    }
  }, [open, appointment]);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = { userId, title, description: description || null, date, time, location: location || null };
      if (isEdit) {
        return apiRequest(`/api/appointments/${appointment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      return apiRequest("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      onOpenChange(false);
      toast({ title: isEdit ? "Appointment updated" : "Appointment added" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">{isEdit ? "Edit Appointment" : "Add Appointment"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Title (e.g. Oncology Review)" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/50 border-border font-body" />
          <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted/50 border-border font-body" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-muted/50 border-border font-body" />
          <Input placeholder="Time (e.g. 10:30 AM)" value={time} onChange={(e) => setTime(e.target.value)} className="bg-muted/50 border-border font-body" />
          <Input placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} className="bg-muted/50 border-border font-body" />
          <Button onClick={() => mutation.mutate()} disabled={!title || !date || !time || mutation.isPending} className="w-full bg-primary text-white hover:bg-primary/90 font-body font-medium">
            {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Appointment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AppointmentsWidget({ userId }: { userId: number }) {
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", { userId }],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?userId=${userId}`);
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/appointments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({ title: "Appointment deleted" });
    },
  });

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  const upcomingAppointments = sortedAppointments.filter(a => new Date(a.date) >= new Date(todayStr()));

  return (
    <Card className="bg-white border-border rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-foreground tracking-wide text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Upcoming Appointments
          </CardTitle>
          <Button variant="outline" size="sm" className="text-xs border-border text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body gap-1" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 text-primary animate-spin" /></div>
        ) : upcomingAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body text-center py-4">No upcoming appointments.</p>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map((appt, i) => (
              <div key={appt.id} className={`flex items-center justify-between pb-3 group ${i < upcomingAppointments.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-sm text-foreground">{appt.title}</p>
                  {appt.description && <p className="text-xs text-muted-foreground font-body truncate">{appt.description}</p>}
                  {appt.location && <p className="text-[10px] text-muted-foreground font-body">{appt.location}</p>}
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-body font-medium text-sm text-accent">
                    {new Date(appt.date + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">{appt.time}</p>
                </div>
                <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingAppointment(appt)} className="p-1 hover:bg-muted rounded">
                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(appt.id)} className="p-1 hover:bg-muted rounded">
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AppointmentFormDialog userId={userId} open={showForm} onOpenChange={setShowForm} />
      {editingAppointment && (
        <AppointmentFormDialog userId={userId} appointment={editingAppointment} open={!!editingAppointment} onOpenChange={(v) => { if (!v) setEditingAppointment(null); }} />
      )}
    </Card>
  );
}

function InspirationWidget() {
  const affirmations = [
    "My body knows how to heal, and I trust the process.",
    "Every healthy choice I make today supports my immune system.",
    "I am surrounded by love and support on this journey.",
    "My scans show my body is responding. I am getting better every day.",
    "I choose hope, nourishment, and peace today.",
    "My immune system is my ally — growing stronger with each passing week.",
    "I am more than my diagnosis. I am strong, resilient, and full of life.",
    "Each day I give my body what it needs to heal — good food, gentle movement, and peace of mind.",
    "The evidence of healing is all around me. I celebrate every improvement.",
    "I trust my body, my team, and the journey ahead.",
  ];

  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const affirmation = affirmations[dayOfYear % affirmations.length];

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/15">
      <CardContent className="p-6 text-center">
        <Sun className="h-8 w-8 text-accent mx-auto mb-3" />
        <p className="font-body text-foreground italic leading-relaxed">"{affirmation}"</p>
        <p className="text-[10px] text-muted-foreground font-body mt-3 uppercase tracking-widest">Today's Affirmation</p>
      </CardContent>
    </Card>
  );
}

function getTherapyIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("acupuncture") || t.includes("needle")) return <Target className="h-6 w-6" />;
  if (t.includes("hyperbaric") || t.includes("oxygen")) return <Waves className="h-6 w-6" />;
  if (t.includes("oncology") || t.includes("integrat")) return <Stethoscope className="h-6 w-6" />;
  if (t.includes("meditation") || t.includes("mindful")) return <Sparkles className="h-6 w-6" />;
  if (t.includes("yoga")) return <Leaf className="h-6 w-6" />;
  if (t.includes("breath")) return <Heart className="h-6 w-6" />;
  if (t.includes("walk") || t.includes("swim") || t.includes("exercise")) return <Activity className="h-6 w-6" />;
  if (t.includes("journal") || t.includes("gratitude")) return <Sun className="h-6 w-6" />;
  if (t.includes("visual")) return <Sparkles className="h-6 w-6" />;
  if (t.includes("strength")) return <Flame className="h-6 w-6" />;
  if (t.includes("stretch") || t.includes("tai")) return <Leaf className="h-6 w-6" />;
  return <Heart className="h-6 w-6" />;
}

const therapyGradients = [
  "from-emerald-50 to-teal-50 border-emerald-200",
  "from-amber-50 to-orange-50 border-amber-200",
  "from-violet-50 to-purple-50 border-violet-200",
  "from-sky-50 to-cyan-50 border-sky-200",
  "from-rose-50 to-pink-50 border-rose-200",
  "from-lime-50 to-green-50 border-lime-200",
  "from-indigo-50 to-blue-50 border-indigo-200",
  "from-fuchsia-50 to-pink-50 border-fuchsia-200",
];

const therapyTextColors = [
  "text-emerald-700",
  "text-amber-700",
  "text-violet-700",
  "text-sky-700",
  "text-rose-700",
  "text-lime-700",
  "text-indigo-700",
  "text-fuchsia-700",
];

function HealingTherapiesWidget({ userId }: { userId: number }) {
  const { data: allMindBody = [] } = useQuery<MindBodyActivity[]>({
    queryKey: ["/api/mind-body", { userId, all: true }],
    queryFn: async () => {
      const res = await fetch(`/api/mind-body?userId=${userId}`);
      return res.json();
    },
  });

  const { data: allExercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", { userId, all: true }],
    queryFn: async () => {
      const res = await fetch(`/api/exercises?userId=${userId}`);
      return res.json();
    },
  });

  const { data: therapyTypes = [] } = useQuery<CustomActivityType[]>({
    queryKey: ["/api/activity-types", { userId, category: "therapy" }],
    queryFn: async () => {
      const res = await fetch(`/api/activity-types?userId=${userId}&category=therapy`);
      return res.json();
    },
  });

  const therapyMap = new Map<string, { sessions: number; minutes: number; label: string }>();

  allMindBody.forEach((a) => {
    const key = a.activityType;
    const existing = therapyMap.get(key) || { sessions: 0, minutes: 0, label: key };
    existing.sessions++;
    existing.minutes += a.durationMinutes;
    therapyMap.set(key, existing);
  });

  allExercises.forEach((e) => {
    const key = e.exerciseType;
    const existing = therapyMap.get(key) || { sessions: 0, minutes: 0, label: key };
    existing.sessions++;
    existing.minutes += e.durationMinutes;
    therapyMap.set(key, existing);
  });

  therapyTypes.forEach((tt) => {
    if (!therapyMap.has(tt.value)) {
      therapyMap.set(tt.value, { sessions: 0, minutes: 0, label: tt.label });
    }
  });

  const therapies = Array.from(therapyMap.entries())
    .map(([key, data]) => ({ key, ...data }))
    .filter(t => t.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions);

  if (therapies.length === 0) {
    return (
      <Card className="bg-white border-border rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-foreground tracking-wide text-base flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" /> Healing Therapies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground font-body text-center py-4">Log activities to see your therapy progress here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-border rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-foreground tracking-wide text-base flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" /> Healing Therapies
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground font-body">Your accumulated therapy journey</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {therapies.map((therapy, idx) => {
            const gradientClass = therapyGradients[idx % therapyGradients.length];
            const textColor = therapyTextColors[idx % therapyTextColors.length];
            return (
              <div key={therapy.key} className={`bg-gradient-to-br ${gradientClass} rounded-xl p-4 border text-center`}>
                <div className={`mx-auto w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center mb-2 ${textColor}`}>
                  {getTherapyIcon(therapy.key)}
                </div>
                <p className={`text-2xl font-heading font-bold ${textColor}`}>{therapy.sessions}</p>
                <p className="text-[10px] text-muted-foreground font-body mb-1">sessions</p>
                <p className="text-xs font-body font-medium text-foreground capitalize">{therapy.label.replace(/-/g, " ")}</p>
                <p className="text-[10px] text-muted-foreground font-body">{therapy.minutes} total mins</p>
              </div>
            );
          })}
        </div>
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

function WeeklyActivityRings({ userId }: { userId: number }) {
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
  const today = todayStr();

  const { data: meals = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals", { userId, trend: true }],
    queryFn: async () => {
      const res = await fetch(`/api/meals?userId=${userId}&dateFrom=${sevenDaysAgo}&dateTo=${today}`);
      return res.json();
    },
  });
  const { data: mindBody = [] } = useQuery<MindBodyActivity[]>({
    queryKey: ["/api/mind-body", { userId, trend: true }],
    queryFn: async () => {
      const res = await fetch(`/api/mind-body?userId=${userId}&dateFrom=${sevenDaysAgo}&dateTo=${today}`);
      return res.json();
    },
  });
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", { userId, trend: true }],
    queryFn: async () => {
      const res = await fetch(`/api/exercises?userId=${userId}&dateFrom=${sevenDaysAgo}&dateTo=${today}`);
      return res.json();
    },
  });

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(Date.now() - (6 - i) * 86400000);
      const dateStr = dt.toISOString().split("T")[0];
      const hasMeals = meals.some(m => m.date === dateStr);
      const hasMind = mindBody.some(a => a.date === dateStr);
      const hasExercise = exercises.some(e => e.date === dateStr);
      const mealCount = meals.filter(m => m.date === dateStr).length;
      const mindMins = mindBody.filter(a => a.date === dateStr).reduce((s, a) => s + a.durationMinutes, 0);
      const exMins = exercises.filter(e => e.date === dateStr).reduce((s, e) => s + e.durationMinutes, 0);
      const score = (hasMeals ? 1 : 0) + (hasMind ? 1 : 0) + (hasExercise ? 1 : 0);
      const isToday = dateStr === today;
      return { dt, dateStr, hasMeals, hasMind, hasExercise, mealCount, mindMins, exMins, score, isToday };
    });
  }, [meals, mindBody, exercises, today]);

  const activeDays = days.filter(d => d.score > 0).length;
  const totalMeals = days.reduce((s, d) => s + d.mealCount, 0);
  const totalMind = days.reduce((s, d) => s + d.mindMins, 0);
  const totalEx = days.reduce((s, d) => s + d.exMins, 0);

  return (
    <Card className="bg-white border-border rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body font-medium">Your Week</p>
          <p className="text-xs font-body text-primary font-semibold">{activeDays}/7 active</p>
        </div>
        <div className="flex items-center justify-between gap-1 mb-4">
          {days.map((d, i) => {
            const size = 42;
            const r = 16;
            const circ = 2 * Math.PI * r;
            const mealPct = d.hasMeals ? 100 : 0;
            const mindPct = d.hasMind ? 100 : 0;
            const exPct = d.hasExercise ? 100 : 0;
            return (
              <div key={i} className={`flex flex-col items-center gap-1 ${d.isToday ? "scale-110" : ""}`}>
                <p className={`text-[9px] font-body ${d.isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  {d.dt.toLocaleDateString("en-AU", { weekday: "narrow" })}
                </p>
                <div className="relative" style={{ width: size, height: size }}>
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(30, 25%, 92%)" strokeWidth={3} />
                    <circle cx={size/2} cy={size/2} r={r-4.5} fill="none" stroke="hsl(30, 25%, 92%)" strokeWidth={3} />
                    <circle cx={size/2} cy={size/2} r={r-9} fill="none" stroke="hsl(30, 25%, 92%)" strokeWidth={3} />
                    {exPct > 0 && (
                      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(200, 70%, 50%)" strokeWidth={3} strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={circ * (1 - exPct / 100)} transform={`rotate(-90 ${size/2} ${size/2})`} />
                    )}
                    {mindPct > 0 && (
                      <circle cx={size/2} cy={size/2} r={r-4.5} fill="none" stroke="hsl(158, 32%, 42%)" strokeWidth={3} strokeLinecap="round"
                        strokeDasharray={circ * (r-4.5)/r} strokeDashoffset={circ * (r-4.5)/r * (1 - mindPct / 100)} transform={`rotate(-90 ${size/2} ${size/2})`} />
                    )}
                    {mealPct > 0 && (
                      <circle cx={size/2} cy={size/2} r={r-9} fill="none" stroke="hsl(34, 55%, 52%)" strokeWidth={3} strokeLinecap="round"
                        strokeDasharray={circ * (r-9)/r} strokeDashoffset={circ * (r-9)/r * (1 - mealPct / 100)} transform={`rotate(-90 ${size/2} ${size/2})`} />
                    )}
                  </svg>
                  {d.score === 0 && !d.isToday && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 text-[10px] font-body text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{background: "hsl(34, 55%, 52%)"}} /> {totalMeals} meals</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{background: "hsl(158, 32%, 42%)"}} /> {totalMind}m mind</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{background: "hsl(200, 70%, 50%)"}} /> {totalEx}m move</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityHeatmap({ userId }: { userId: number }) {
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
  const today = todayStr();

  const { data: meals = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals", { userId, trend: true }],
    queryFn: async () => {
      const res = await fetch(`/api/meals?userId=${userId}&dateFrom=${sevenDaysAgo}&dateTo=${today}`);
      return res.json();
    },
  });
  const { data: mindBody = [] } = useQuery<MindBodyActivity[]>({
    queryKey: ["/api/mind-body", { userId, trend: true }],
    queryFn: async () => {
      const res = await fetch(`/api/mind-body?userId=${userId}&dateFrom=${sevenDaysAgo}&dateTo=${today}`);
      return res.json();
    },
  });
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", { userId, trend: true }],
    queryFn: async () => {
      const res = await fetch(`/api/exercises?userId=${userId}&dateFrom=${sevenDaysAgo}&dateTo=${today}`);
      return res.json();
    },
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = dt.toISOString().split("T")[0];
    const hasMeal = meals.some(m => m.date === dateStr);
    const hasMind = mindBody.some(a => a.date === dateStr);
    const hasExercise = exercises.some(e => e.date === dateStr);
    const score = (hasMeal ? 1 : 0) + (hasMind ? 1 : 0) + (hasExercise ? 1 : 0);
    const isToday = dateStr === today;
    return { dt, dateStr, hasMeal, hasMind, hasExercise, score, isToday };
  });

  const getIntensity = (score: number) => {
    if (score === 0) return "bg-muted border-border";
    if (score === 1) return "bg-primary/15 border-primary/25";
    if (score === 2) return "bg-primary/30 border-primary/40";
    return "bg-primary/50 border-primary/60";
  };

  return (
    <div className="flex items-center gap-2">
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <p className="text-[9px] text-muted-foreground font-body">{d.dt.toLocaleDateString("en-AU", { weekday: "narrow" })}</p>
          <div className={`w-full aspect-square rounded-lg border transition-all ${getIntensity(d.score)} ${d.isToday ? "ring-2 ring-accent/40 ring-offset-1" : ""}`}
            title={`${d.dt.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}: ${d.score} activities`}>
          </div>
          <div className="flex gap-0.5">
            {d.hasMeal && <div className="w-1 h-1 rounded-full bg-accent" />}
            {d.hasMind && <div className="w-1 h-1 rounded-full bg-primary" />}
            {d.hasExercise && <div className="w-1 h-1 rounded-full bg-sky-500" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SimpleDashboard() {
  const { user, setUser } = useUser();
  const { toast } = useToast();
  const [activeWidgets, setActiveWidgets] = useState<string[]>(loadWidgets());
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);

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
    <div className="p-5 lg:p-8 max-w-5xl mx-auto">
      {/* Header with goal */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="relative group">
            {user.profilePhoto ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md">
                <img src={user.profilePhoto} alt={user.displayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/15 flex items-center justify-center shadow-md">
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
            <h1 className="text-lg lg:text-xl font-heading text-foreground">
              Hey {user?.displayName || "Friend"}
            </h1>
            <p className="text-xs text-muted-foreground font-body">
              {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <EditGoalsDialog user={user} setUser={setUser} />
            <WidgetPicker activeWidgets={activeWidgets} onChange={handleWidgetChange} />
          </div>
        </div>
        {user.goals && (
          <div className="mt-3 bg-gradient-to-r from-primary/8 to-accent/8 border border-primary/15 rounded-xl px-4 py-2.5 flex items-start gap-2">
            <Target className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs font-body text-foreground leading-relaxed">{user.goals}</p>
          </div>
        )}
      </div>

      {/* Today's Vibe — daily brief */}
      {isActive("dailyBrief") && (
        <div className="mb-4">
          <DailyBriefWidget userId={user.id} />
        </div>
      )}

      {/* Combined: Log + Today's Wellness */}
      <TodayWellnessWidget userId={user.id} />

      {/* Weekly Activity Rings */}
      <div className="my-4">
        <WeeklyActivityRings userId={user.id} />
      </div>

      {/* Compact Stat Tiles — no immune recovery */}
      <div className="grid grid-cols-2 gap-3 mb-4">
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

      {/* Tumour Response — horizontal, full width */}
      {isActive("tumourResponse") && (
        <div className="mb-4">
          <TumourResponseCompactTile userId={user.id} onClick={() => setExpandedWidget("tumourResponse")} />
        </div>
      )}

      {/* Expanded stat dialogs */}
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

      {/* Evidence Worth Fighting For tile + Did You Know */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {isActive("motivationalWall") && <MotivationalWallWidget userId={user.id} />}
        {isActive("funFacts") && <FunFactsWidget userId={user.id} />}
      </div>

      {/* Gut Check + Inspiration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {isActive("gutCheck") && <GutCheckWidget userId={user.id} />}
        {isActive("inspiration") && <InspirationWidget />}
      </div>

      {/* Healing Therapies */}
      {isActive("healingTherapies") && (
        <div className="mb-4">
          <HealingTherapiesWidget userId={user.id} />
        </div>
      )}

      {/* Treatment Timeline + Appointments */}
      {(isActive("treatmentTimeline") || isActive("appointments")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {isActive("treatmentTimeline") && <TreatmentTimelineWidget />}
          {isActive("appointments") && <AppointmentsWidget userId={user.id} />}
        </div>
      )}
    </div>
  );
}
