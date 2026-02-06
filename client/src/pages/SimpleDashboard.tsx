import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import {
  MessageCircle, TrendingUp, Heart, Sparkles, Activity, Apple, Leaf, Shield, Target, Clock,
  Scan, Plus, Check, Loader2, Settings2, X, GripVertical, Flame, Sun, BarChart3, Calendar,
  ArrowDown, Zap, ChevronRight, Wine
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
import type { Meal, MindBodyActivity, Exercise, ScanResult } from "@shared/schema";

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
  { id: "todayWellness", label: "Today's Wellness", description: "Log meals, mindfulness, and exercise", icon: <Heart className="h-4 w-4" />, defaultVisible: true },
  { id: "immuneRecovery", label: "Immune Recovery", description: "Track your immune system recovery", icon: <Zap className="h-4 w-4" />, defaultVisible: true },
  { id: "activityStreak", label: "Activity Streak", description: "Track meals, exercise & mindfulness streaks", icon: <Flame className="h-4 w-4" />, defaultVisible: true },
  { id: "treatmentTimeline", label: "Treatment Timeline", description: "Your full treatment history", icon: <Clock className="h-4 w-4" />, defaultVisible: false },
  { id: "aiAssistant", label: "AI Health Assistant", description: "Quick access to personalised guidance", icon: <MessageCircle className="h-4 w-4" />, defaultVisible: false },
  { id: "appointments", label: "Upcoming Appointments", description: "Your scheduled appointments", icon: <Calendar className="h-4 w-4" />, defaultVisible: false },
  { id: "inspiration", label: "Daily Inspiration", description: "A daily healing affirmation", icon: <Sun className="h-4 w-4" />, defaultVisible: false },
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

function LogMealDialog({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false);
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
        body: JSON.stringify({ userId, date: todayStr(), mealType, description, antiInflammatoryScore: null }),
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
        <Button variant="outline" size="sm" className="text-xs border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body gap-1">
          <Apple className="h-3.5 w-3.5" /> Log Meal
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-[hsl(34,55%,45%)]">Log a Meal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] font-body">
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
            className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] font-body"
          />
          {mealType && (
            <Button variant="outline" size="sm" onClick={getAiSuggestion} disabled={aiLoading} className="w-full text-xs border-[hsl(34,55%,52%)]/30 text-[hsl(34,55%,45%)] hover:bg-[hsl(34,55%,52%)]/10 font-body gap-1">
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {aiLoading ? "Getting suggestion..." : `Suggest a healing ${mealType}`}
            </Button>
          )}
          {aiSuggestion && (
            <div className="bg-[hsl(30,30%,95%)] border border-[hsl(30,22%,87%)] rounded-lg p-3 max-h-48 overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wider text-[hsl(34,55%,45%)] font-heading mb-1.5">AI Suggestion</p>
              <p className="text-xs text-[hsl(25,18%,42%)] font-body leading-relaxed whitespace-pre-line">{aiSuggestion}</p>
            </div>
          )}
          <Button onClick={() => mutation.mutate()} disabled={!mealType || !description || mutation.isPending} className="w-full bg-primary text-white hover:bg-primary/90 font-heading">
            {mutation.isPending ? "Saving..." : "Log Meal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LogActivityDialog({ userId, type }: { userId: number; type: "mindBody" | "exercise" }) {
  const [open, setOpen] = useState(false);
  const [activityType, setActivityType] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const isMindBody = type === "mindBody";
  const endpoint = isMindBody ? "/api/mind-body" : "/api/exercises";
  const queryKey = isMindBody ? "/api/mind-body" : "/api/exercises";

  const mutation = useMutation({
    mutationFn: async () => {
      const body = isMindBody
        ? { userId, date: todayStr(), activityType, durationMinutes: parseInt(duration), notes: notes || null }
        : { userId, date: todayStr(), exerciseType: activityType, durationMinutes: parseInt(duration), intensity: "moderate", notes: notes || null };
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

  const options = isMindBody
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
        { value: "yoga", label: "Yoga" },
        { value: "swimming", label: "Swimming" },
        { value: "stretching", label: "Stretching" },
        { value: "tai-chi", label: "Tai Chi" },
        { value: "other", label: "Other" },
      ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body gap-1">
          {isMindBody ? <Sparkles className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
          {isMindBody ? "Log Mindfulness" : "Log Exercise"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
        <DialogHeader>
          <DialogTitle className="font-heading text-[hsl(34,55%,45%)]">{isMindBody ? "Log Mind-Body Activity" : "Log Exercise"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={activityType} onValueChange={setActivityType}>
            <SelectTrigger className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] font-body">
              <SelectValue placeholder="Select activity" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Duration (minutes)" value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] font-body" />
          <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] font-body" />
          <Button onClick={() => mutation.mutate()} disabled={!activityType || !duration || mutation.isPending} className="w-full bg-primary text-white hover:bg-primary/90 font-heading">
            {mutation.isPending ? "Saving..." : "Log Activity"}
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
        <Button variant="outline" size="sm" className="text-xs border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body gap-1.5">
          <Settings2 className="h-3.5 w-3.5" /> Customise
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-[hsl(34,55%,45%)]">Choose Your Widgets</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[hsl(25,18%,48%)] font-body mb-2">Select the cards you'd like to see on your dashboard.</p>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {ALL_WIDGETS.map((w) => {
            const isActive = selected.includes(w.id);
            return (
              <button
                key={w.id}
                onClick={() => toggle(w.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  isActive
                    ? "bg-primary/10 border-primary/30 text-[hsl(25,30%,22%)]"
                    : "bg-[hsl(30,30%,95%)] border-[hsl(30,22%,87%)] text-[hsl(25,18%,48%)]"
                }`}
              >
                <div className={`p-1.5 rounded-md ${isActive ? "bg-primary/20 text-primary" : "bg-[hsl(30,20%,90%)] text-[hsl(25,18%,55%)]"}`}>
                  {w.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-sm">{w.label}</p>
                  <p className="text-xs text-[hsl(25,18%,48%)] font-body">{w.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isActive ? "bg-primary border-primary" : "border-[hsl(30,22%,80%)]"
                }`}>
                  {isActive && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={() => setSelected(getDefaultWidgets())} className="flex-1 font-body text-sm border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)]">
            Reset
          </Button>
          <Button onClick={apply} className="flex-1 bg-primary text-white hover:bg-primary/90 font-heading text-sm">
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
      className="group relative bg-[hsl(36,40%,98%)] border border-[hsl(30,25%,87%)] rounded-xl p-4 text-left transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0 w-full"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
          accent === "amber" ? "bg-[hsl(34,55%,52%)]/10 text-[hsl(34,55%,45%)] group-hover:bg-[hsl(34,55%,52%)]/20" : "bg-primary/10 text-primary group-hover:bg-primary/20"
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[hsl(25,18%,55%)] font-body mb-0.5">{label}</p>
          <p className={`text-xl font-heading font-bold ${
            accent === "amber" ? "text-[hsl(34,55%,45%)]" : "text-primary"
          }`}>{value}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-[hsl(25,18%,65%)] group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
      </div>
      {subtitle && <p className="text-[10px] text-[hsl(25,18%,55%)] font-body mt-2 line-clamp-1">{subtitle}</p>}
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
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(30,25%,90%)" strokeWidth="5" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(158,32%,42%)" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={dashOffset} className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-heading font-bold text-[hsl(25,35%,22%)]">{daysUntil ?? "—"}</span>
          <span className="text-xs text-[hsl(25,18%,48%)] font-body uppercase tracking-wider">days to go</span>
        </div>
      </div>
      <p className="font-heading text-base text-[hsl(34,55%,45%)] tracking-wide">Next PET/CT Scan</p>
      {scanDate && (
        <p className="text-sm text-[hsl(25,18%,48%)] font-body mt-1">
          {scanDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      <div className="mt-4 bg-primary/5 border border-primary/15 rounded-lg p-3 text-center w-full">
        <p className="text-xs font-body text-[hsl(25,18%,48%)]">
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
      <div className="bg-[hsl(34,55%,52%)]/5 border border-[hsl(34,55%,52%)]/15 rounded-xl p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(34,55%,52%)]/60 font-body text-center mb-3">Treatment Journey</p>
        <div className="flex items-center justify-center gap-1">
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-[hsl(34,55%,45%)] tabular-nums">{days}</p>
            <p className="text-[10px] text-[hsl(25,18%,48%)] font-body mt-1">days</p>
          </div>
          <span className="text-2xl font-heading text-[hsl(34,55%,52%)]/30 mx-2">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-[hsl(34,55%,45%)] tabular-nums">{pad(hours)}</p>
            <p className="text-[10px] text-[hsl(25,18%,48%)] font-body mt-1">hrs</p>
          </div>
          <span className="text-2xl font-heading text-[hsl(34,55%,52%)]/30 mx-1">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-[hsl(34,55%,45%)] tabular-nums">{pad(minutes)}</p>
            <p className="text-[10px] text-[hsl(25,18%,48%)] font-body mt-1">min</p>
          </div>
          <span className="text-2xl font-heading text-[hsl(34,55%,52%)]/30 mx-1">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-primary tabular-nums">{pad(seconds)}</p>
            <p className="text-[10px] text-[hsl(25,18%,48%)] font-body mt-1">sec</p>
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-3">
          <span className="text-xs text-[hsl(25,18%,48%)] font-body">{months} months strong</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/8 border border-primary/15 rounded-xl p-4 text-center">
          <p className="text-2xl font-heading font-bold text-primary">{daysSinceDiagnosis}</p>
          <p className="text-[10px] text-[hsl(25,18%,48%)] font-body mt-1">Since Diagnosis</p>
        </div>
        <div className="bg-[hsl(34,55%,52%)]/8 border border-[hsl(34,55%,52%)]/15 rounded-xl p-4 text-center">
          <p className="text-2xl font-heading font-bold text-[hsl(34,55%,45%)]">{months}</p>
          <p className="text-[10px] text-[hsl(25,18%,48%)] font-body mt-1">Months Strong</p>
        </div>
      </div>
      <div className="flex items-center gap-3 bg-[hsl(30,30%,95%)] rounded-xl p-4 border border-[hsl(30,22%,87%)]">
        <Target className="h-6 w-6 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-body font-medium text-[hsl(25,30%,28%)]">{user.treatmentStatus || "Active Surveillance"}</p>
          <p className="text-xs text-[hsl(25,18%,48%)] font-body">{user.cancerType} — {user.cancerStage}</p>
        </div>
      </div>
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
        <p className="text-xs font-body text-[hsl(25,18%,48%)] leading-relaxed">
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
            <p className="text-[10px] text-[hsl(25,18%,48%)] font-body mt-1">days</p>
          </div>
          <span className="text-2xl font-heading text-primary/30 mx-2">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-primary tabular-nums">{pad(hours)}</p>
            <p className="text-[10px] text-[hsl(25,18%,48%)] font-body mt-1">hrs</p>
          </div>
          <span className="text-2xl font-heading text-primary/30 mx-1">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-primary tabular-nums">{pad(minutes)}</p>
            <p className="text-[10px] text-[hsl(25,18%,48%)] font-body mt-1">min</p>
          </div>
          <span className="text-2xl font-heading text-primary/30 mx-1">:</span>
          <div className="text-center">
            <p className="text-4xl font-heading font-bold text-[hsl(34,55%,45%)] tabular-nums">{pad(seconds)}</p>
            <p className="text-[10px] text-[hsl(25,18%,48%)] font-body mt-1">sec</p>
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-3">
          <span className="text-xs font-body text-[hsl(25,18%,48%)]"><strong className="text-primary font-heading">{weeks}</strong> weeks</span>
          <span className="text-xs font-body text-[hsl(25,18%,48%)]"><strong className="text-[hsl(34,55%,45%)] font-heading">{months}</strong> months</span>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-heading text-[hsl(34,55%,45%)] uppercase tracking-wider">Recovery Milestones</p>
        {milestones.map((m, i) => (
          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${m.done ? "bg-primary/8" : "bg-[hsl(30,20%,95%)]"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${m.done ? "bg-primary text-white" : "border-2 border-[hsl(30,22%,80%)]"}`}>
              {m.done && <Check className="h-3 w-3" />}
            </div>
            <span className={`text-sm font-body ${m.done ? "text-[hsl(25,30%,28%)]" : "text-[hsl(25,18%,55%)]"}`}>{m.label}</span>
            <span className="text-[10px] text-[hsl(25,18%,55%)] font-body ml-auto">{m.weeks}w</span>
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
        <p className="text-4xl font-heading font-bold text-[hsl(34,55%,45%)]">{streak}</p>
        <p className="text-sm text-[hsl(25,18%,48%)] font-body">Day Activity Streak</p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {last7.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <p className="text-[9px] text-[hsl(25,18%,55%)] font-body">{d.day}</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-heading transition-all ${
              d.active ? "bg-[hsl(34,55%,52%)] text-white shadow-sm" : "bg-[hsl(30,20%,92%)] text-[hsl(25,18%,55%)]"
            }`}>
              {d.active ? <Check className="h-3.5 w-3.5" /> : "·"}
            </div>
            <div className="flex gap-0.5">
              {d.meals > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              {d.mindBody > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(34,55%,52%)]" />}
              {d.exercises > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[hsl(200,50%,50%)]" />}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 text-[10px] text-[hsl(25,18%,55%)] font-body">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Meals</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[hsl(34,55%,52%)]" /> Mindfulness</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[hsl(200,50%,50%)]" /> Exercise</span>
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

  if (isLoading || scanResults.length === 0) return { isLoading, scanResults, avgSizeReduction: 0, avgActivityReduction: 0, scanDates: [], tumourLabels: [], baselineScan: [], latestScan: [] };

  const scanDates = Array.from(new Set(scanResults.map((s) => s.scanDate))).sort();
  const tumourLabels = Array.from(new Set(scanResults.map((s) => s.tumourLabel))).sort();
  const baselineScan = scanResults.filter((s) => s.scanDate === scanDates[0]);
  const latestScan = scanResults.filter((s) => s.scanDate === scanDates[scanDates.length - 1]);

  let totalSizeReduction = 0;
  let totalActivityReduction = 0;
  let countSize = 0;
  let countActivity = 0;

  tumourLabels.forEach((tl) => {
    const baseline = baselineScan.find((s) => s.tumourLabel === tl);
    const latest = latestScan.find((s) => s.tumourLabel === tl);
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
  };
}

function TumourResponseCompactTile({ userId, onClick }: { userId: number; onClick: () => void }) {
  const { isLoading, avgSizeReduction, avgActivityReduction } = useTumourStats(userId);

  if (isLoading) {
    return (
      <button onClick={onClick} className="group relative bg-[hsl(36,40%,98%)] border border-[hsl(30,25%,87%)] rounded-xl p-4 text-left transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[hsl(25,18%,55%)] font-body mb-0.5">Tumour Response</p>
            <p className="text-sm font-body text-[hsl(25,18%,48%)]">Loading...</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group relative bg-[hsl(36,40%,98%)] border border-[hsl(30,25%,87%)] rounded-xl p-4 text-left transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0 w-full"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary/20 transition-all duration-300">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[hsl(25,18%,55%)] font-body mb-1">Tumour Response</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3 text-primary" />
              <span className="text-base font-heading font-bold text-primary">{avgSizeReduction}%</span>
              <span className="text-[10px] text-[hsl(25,18%,55%)] font-body">size</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3 text-[hsl(34,55%,45%)]" />
              <span className="text-base font-heading font-bold text-[hsl(34,55%,45%)]">{avgActivityReduction}%</span>
              <span className="text-[10px] text-[hsl(25,18%,55%)] font-body">activity</span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-[hsl(25,18%,65%)] group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
      </div>
    </button>
  );
}

function TumourResponseExpanded({ userId }: { userId: number }) {
  const { scanResults, scanDates, tumourLabels, baselineScan, latestScan } = useTumourStats(userId);

  if (scanResults.length === 0) {
    return <p className="text-sm text-[hsl(25,18%,48%)] font-body text-center py-4">No scan data available yet.</p>;
  }

  const tumourColors = ["hsl(158,32%,42%)", "hsl(34,55%,52%)", "hsl(200,50%,50%)"];
  const maxBaselineArea = Math.max(...baselineScan.map(s => s.sizeX * s.sizeY));

  const scanLabels = scanDates.map((date) => {
    const label = scanResults.find(s => s.scanDate === date)?.scanLabel || date;
    return label.includes("Baseline") ? "Baseline" : label.includes("Post") ? "Post-Treatment" : label.includes("Surveillance") ? "Latest Scan" : new Date(date).toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
  });

  return (
    <div className="space-y-4 py-2">
      {tumourLabels.map((tl, tumourIdx) => {
        const baseline = baselineScan.find((s) => s.tumourLabel === tl);
        const latest = latestScan.find((s) => s.tumourLabel === tl);
        if (!baseline || !latest) return null;
        const baselineArea = baseline.sizeX * baseline.sizeY;
        const latestArea = latest.sizeX * latest.sizeY;
        const sizeReduction = Math.round(((baselineArea - latestArea) / baselineArea) * 100);
        const isMetabolicComplete = !latest.suvMax || latest.suvMax === 0;

        return (
          <div key={tl} className={`${tumourIdx > 0 ? "mt-3 pt-3 border-t border-[hsl(30,22%,90%)]" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tumourColors[tumourIdx] }} />
                <p className="text-sm font-heading text-[hsl(25,30%,28%)]">{tl}</p>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDown className="h-3.5 w-3.5 text-primary" />
                <span className="text-base font-heading font-bold text-primary">{sizeReduction}% smaller</span>
                {isMetabolicComplete && (
                  <span className="text-[10px] font-body font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-1">No Activity</span>
                )}
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 px-2">
              {scanDates.map((date, scanIdx) => {
                const scan = scanResults.find(s => s.scanDate === date && s.tumourLabel === tl);
                if (!scan) return null;
                const area = scan.sizeX * scan.sizeY;
                const sizePct = (area / maxBaselineArea);
                const circleSize = Math.max(16, Math.round(sizePct * 72));
                const maxSuv = Math.max(...scanResults.filter(s => s.tumourLabel === tl).map(s => s.suvMax || 0));
                const suvPct = maxSuv > 0 && scan.suvMax ? scan.suvMax / maxSuv : 0;
                const hasActivity = scan.suvMax && scan.suvMax > 0;

                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative flex items-center justify-center" style={{ height: 80 }}>
                      <div
                        className="rounded-full transition-all duration-1000 relative flex items-center justify-center"
                        style={{
                          width: circleSize,
                          height: circleSize,
                          backgroundColor: hasActivity
                            ? `hsla(${suvPct > 0.6 ? 0 : suvPct > 0.3 ? 34 : 158}, ${Math.round(40 + suvPct * 30)}%, ${Math.round(50 + (1 - suvPct) * 20)}%, ${0.15 + suvPct * 0.25})`
                            : "hsla(158,32%,42%,0.08)",
                          border: `2px solid ${hasActivity
                            ? `hsla(${suvPct > 0.6 ? 0 : suvPct > 0.3 ? 34 : 158}, ${Math.round(40 + suvPct * 30)}%, ${Math.round(45 + (1 - suvPct) * 15)}%, ${0.4 + suvPct * 0.3})`
                            : "hsla(158,32%,42%,0.25)"}`,
                        }}
                      >
                        {hasActivity && (
                          <div
                            className="absolute rounded-full animate-pulse"
                            style={{
                              width: circleSize * 0.4,
                              height: circleSize * 0.4,
                              backgroundColor: `hsla(${suvPct > 0.6 ? 0 : suvPct > 0.3 ? 34 : 158}, ${Math.round(50 + suvPct * 20)}%, ${Math.round(45 + (1 - suvPct) * 10)}%, ${0.3 + suvPct * 0.4})`,
                            }}
                          />
                        )}
                        {!hasActivity && (
                          <Check className="h-3 w-3 text-primary/50" />
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-heading text-[hsl(25,30%,28%)]">{scanLabels[scanIdx]}</p>
                      <p className="text-[9px] text-[hsl(25,18%,55%)] font-body">{Math.round(area)} mm²</p>
                      {scan.suvMax ? (
                        <p className="text-[9px] text-[hsl(25,18%,55%)] font-body">SUV {scan.suvMax}</p>
                      ) : (
                        <p className="text-[9px] text-primary font-body font-medium">Clear</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {scanDates.length > 1 && (
              <div className="flex items-center justify-center mt-2 px-8">
                <div className="flex-1 h-px bg-gradient-to-r from-[hsl(0,50%,65%)]/30 via-[hsl(34,55%,52%)]/30 to-primary/30" />
                <ChevronRight className="h-3 w-3 text-primary/40 mx-1" />
                <span className="text-[9px] text-primary/60 font-body">improving</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TodayWellnessWidget({ userId }: { userId: number }) {
  const today = todayStr();
  const { data: todayMeals = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals", { userId, date: today }],
    queryFn: async () => {
      const res = await fetch(`/api/meals?userId=${userId}&dateFrom=${today}&dateTo=${today}`);
      return res.json();
    },
  });
  const { data: todayMindBody = [] } = useQuery<MindBodyActivity[]>({
    queryKey: ["/api/mind-body", { userId, date: today }],
    queryFn: async () => {
      const res = await fetch(`/api/mind-body?userId=${userId}&dateFrom=${today}&dateTo=${today}`);
      return res.json();
    },
  });
  const { data: todayExercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", { userId, date: today }],
    queryFn: async () => {
      const res = await fetch(`/api/exercises?userId=${userId}&dateFrom=${today}&dateTo=${today}`);
      return res.json();
    },
  });

  const totalMindBodyMins = todayMindBody.reduce((sum, a) => sum + a.durationMinutes, 0);
  const totalExerciseMins = todayExercises.reduce((sum, e) => sum + e.durationMinutes, 0);

  return (
    <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide text-base flex items-center gap-2">
            <Heart className="h-5 w-5 text-[hsl(34,55%,52%)]" /> Today's Wellness
          </CardTitle>
          <span className="text-xs text-[hsl(25,18%,48%)] font-body">{new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[hsl(30,30%,95%)] rounded-xl p-3 border border-[hsl(30,22%,87%)] text-center">
            <Apple className="h-5 w-5 text-[hsl(34,55%,52%)] mx-auto mb-1" />
            <p className="text-lg font-heading font-bold text-[hsl(25,35%,22%)]">{todayMeals.length}</p>
            <p className="text-[10px] text-[hsl(25,18%,48%)] font-body">Meals logged</p>
          </div>
          <div className="bg-[hsl(30,30%,95%)] rounded-xl p-3 border border-[hsl(30,22%,87%)] text-center">
            <Sparkles className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-heading font-bold text-[hsl(25,35%,22%)]">{totalMindBodyMins}</p>
            <p className="text-[10px] text-[hsl(25,18%,48%)] font-body">Min mindfulness</p>
          </div>
          <div className="bg-[hsl(30,30%,95%)] rounded-xl p-3 border border-[hsl(30,22%,87%)] text-center">
            <Activity className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-heading font-bold text-[hsl(25,35%,22%)]">{totalExerciseMins}</p>
            <p className="text-[10px] text-[hsl(25,18%,48%)] font-body">Min exercise</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LogMealDialog userId={userId} />
          <LogActivityDialog userId={userId} type="mindBody" />
          <LogActivityDialog userId={userId} type="exercise" />
        </div>
        {todayMeals.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-body font-medium text-[hsl(25,18%,48%)]">Today's meals:</p>
            {todayMeals.map((meal) => (
              <div key={meal.id} className="flex items-center gap-2 text-xs font-body text-[hsl(25,30%,28%)]">
                <Check className="h-3 w-3 text-primary" />
                <span className="capitalize text-[hsl(25,18%,48%)]">{meal.mealType}:</span>
                <span>{meal.description}</span>
              </div>
            ))}
          </div>
        )}
        {(todayMindBody.length > 0 || todayExercises.length > 0) && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-body font-medium text-[hsl(25,18%,48%)]">Today's activities:</p>
            {todayMindBody.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-xs font-body text-[hsl(25,30%,28%)]">
                <Check className="h-3 w-3 text-[hsl(34,55%,52%)]" />
                <span className="capitalize">{a.activityType}</span>
                <span className="text-[hsl(25,18%,48%)]">— {a.durationMinutes} min</span>
              </div>
            ))}
            {todayExercises.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-xs font-body text-[hsl(25,30%,28%)]">
                <Check className="h-3 w-3 text-primary" />
                <span className="capitalize">{e.exerciseType}</span>
                <span className="text-[hsl(25,18%,48%)]">— {e.durationMinutes} min</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TreatmentTimelineWidget() {
  const timeline = [
    { date: "April 2025", title: "Diagnosis", desc: "Stage IV melanoma with liver metastases. Three liver tumours identified.", color: "bg-[hsl(34,55%,52%)]" },
    { date: "April–July 2025", title: "Immunotherapy", desc: "4 cycles of ipilimumab + nivolumab. Major partial metabolic response achieved.", color: "bg-primary" },
    { date: "July 2025", title: "Treatment Paused", desc: "Immunotherapy paused due to severe toxicity (Grade 4 hepatitis, colitis). Started immunosuppression.", color: "bg-[hsl(0,50%,55%)]" },
    { date: "December 2025", title: "Immunosuppression Ceased", desc: "Approximately 5 months of mycophenolate completed. Immune system now recovering.", color: "bg-[hsl(34,55%,52%)]" },
    { date: "February 2026", title: "Continued Improvement", desc: "Latest scan shows continued improvement. One lesion metabolically complete. No new disease anywhere.", color: "bg-primary" },
  ];

  return (
    <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Treatment Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`} />
                {i < timeline.length && <div className="w-px h-8 bg-[hsl(30,22%,87%)]" />}
              </div>
              <div className="-mt-0.5">
                <p className="font-body font-medium text-sm text-[hsl(25,30%,28%)]">{item.date} — {item.title}</p>
                <p className="text-xs text-[hsl(25,18%,48%)] font-body mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-4">
            <div className="w-3 h-3 rounded-full border-2 border-primary bg-white flex-shrink-0" />
            <div className="-mt-0.5">
              <p className="font-body font-medium text-sm text-primary">May 2026 — Goal: NED</p>
              <p className="text-xs text-[hsl(25,18%,48%)] font-body mt-0.5">Target: No Evidence of Disease confirmation at next scan.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppointmentsWidget() {
  const appointments = [
    { title: "Nutrition Consultation", person: "Integrative Dietitian", date: "March 10, 2026", time: "2:00 PM" },
    { title: "PET/CT Scan", person: "Radiology Department", date: "May 15, 2026", time: "9:00 AM" },
    { title: "Oncology Review", person: "Melanoma Oncology Team", date: "May 22, 2026", time: "10:30 AM" },
  ];

  return (
    <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide text-base flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" /> Upcoming Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appt, i) => (
            <div key={i} className={`flex items-center justify-between pb-3 ${i < appointments.length - 1 ? "border-b border-[hsl(30,22%,87%)]" : ""}`}>
              <div>
                <p className="font-body font-medium text-sm text-[hsl(25,30%,28%)]">{appt.title}</p>
                <p className="text-xs text-[hsl(25,18%,48%)] font-body">{appt.person}</p>
              </div>
              <div className="text-right">
                <p className="font-body font-medium text-sm text-[hsl(34,55%,45%)]">{appt.date}</p>
                <p className="text-xs text-[hsl(25,18%,48%)] font-body">{appt.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
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
    <Card className="bg-gradient-to-br from-primary/5 to-[hsl(34,55%,52%)]/5 border-primary/15">
      <CardContent className="p-6 text-center">
        <Sun className="h-8 w-8 text-[hsl(34,55%,52%)] mx-auto mb-3" />
        <p className="font-body text-[hsl(25,30%,28%)] italic leading-relaxed">"{affirmation}"</p>
        <p className="text-[10px] text-[hsl(25,18%,50%)] font-body mt-3 uppercase tracking-widest">Today's Affirmation</p>
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
      <DialogContent className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2">
            {icon} {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default function SimpleDashboard() {
  const { user } = useUser();
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
            <p className="text-[hsl(25,18%,48%)] font-body">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (id: string) => activeWidgets.includes(id);

  const scanDate = user.nextScanDate ? new Date(user.nextScanDate) : null;
  const daysUntilScan = scanDate ? Math.ceil((scanDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  const diagnosisDate = user.diagnosis_date ? new Date(user.diagnosis_date) : new Date("2025-04-01");
  const treatmentStartDate = new Date("2025-04-22");
  const daysSinceTreatmentStart = Math.floor((new Date().getTime() - treatmentStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const immunoSuppressionEndDate = new Date("2025-12-01");
  const daysImmuneRecovery = Math.floor((new Date().getTime() - immunoSuppressionEndDate.getTime()) / (1000 * 60 * 60 * 24));

  const quickLinks = [
    { href: "/nutrition", label: "Nutrition", icon: <Apple className="h-5 w-5" />, desc: "Liver & immune support" },
    { href: "/mind-body", label: "Mind & Body", icon: <Sparkles className="h-5 w-5" />, desc: "Meditation & healing" },
    { href: "/movement", label: "Movement", icon: <Activity className="h-5 w-5" />, desc: "Gentle exercise" },
    { href: "/spiritual", label: "Wellbeing", icon: <Leaf className="h-5 w-5" />, desc: "Inner peace & purpose" },
    { href: "/date-night", label: "Date Night", icon: <Wine className="h-5 w-5" />, desc: "Sydney dining & fun" },
    { href: "/ai-assistant", label: "AI Assistant", icon: <MessageCircle className="h-5 w-5" />, desc: "Personalised guidance" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary/60 font-body text-xs tracking-[0.2em] uppercase mb-1.5">Your Healing Journey</p>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-[hsl(25,35%,22%)] tracking-wide">
              Welcome back, {user?.displayName || "Friend"}
            </h1>
            <p className="text-sm text-[hsl(25,18%,50%)] font-body mt-1.5">
              {user.treatmentStatus === "Active Surveillance"
                ? "Your body continues to heal beautifully. Every day brings you closer."
                : "Continue nurturing your path to wellness"}
            </p>
          </div>
          <WidgetPicker activeWidgets={activeWidgets} onChange={handleWidgetChange} />
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-primary/30 via-[hsl(34,55%,52%)]/20 to-transparent" />
      </div>

      {(isActive("scanCountdown") || isActive("treatmentJourney") || isActive("immuneRecovery") || isActive("activityStreak") || isActive("tumourResponse")) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
          {isActive("immuneRecovery") && (
            <ImmuneRecoveryCompactTimer onClick={() => setExpandedWidget("immuneRecovery")} />
          )}
          {isActive("activityStreak") && (
            <CompactStatCard
              icon={<Flame className="h-5 w-5" />}
              label="Activity Streak"
              value="View"
              subtitle="Meals, exercise & mindfulness"
              accentColor="amber"
              onClick={() => setExpandedWidget("activityStreak")}
            />
          )}
          {isActive("tumourResponse") && (
            <TumourResponseCompactTile userId={user.id} onClick={() => setExpandedWidget("tumourResponse")} />
          )}
        </div>
      )}

      <ExpandableWidget
        title="Next Scan Countdown"
        icon={<Scan className="h-5 w-5 text-primary" />}
        open={expandedWidget === "scanCountdown"}
        onOpenChange={(open) => setExpandedWidget(open ? "scanCountdown" : null)}
      >
        <ScanCountdownExpanded nextScanDate={user.nextScanDate} />
      </ExpandableWidget>

      <ExpandableWidget
        title="Your Treatment Journey"
        icon={<Shield className="h-5 w-5 text-primary" />}
        open={expandedWidget === "treatmentJourney"}
        onOpenChange={(open) => setExpandedWidget(open ? "treatmentJourney" : null)}
      >
        <TreatmentJourneyExpanded user={user} />
      </ExpandableWidget>

      <ExpandableWidget
        title="Immune Recovery"
        icon={<Zap className="h-5 w-5 text-primary" />}
        open={expandedWidget === "immuneRecovery"}
        onOpenChange={(open) => setExpandedWidget(open ? "immuneRecovery" : null)}
      >
        <ImmuneRecoveryExpanded />
      </ExpandableWidget>

      <ExpandableWidget
        title="Activity Streak"
        icon={<Flame className="h-5 w-5 text-[hsl(34,55%,45%)]" />}
        open={expandedWidget === "activityStreak"}
        onOpenChange={(open) => setExpandedWidget(open ? "activityStreak" : null)}
      >
        <ActivityStreakExpanded userId={user.id} />
      </ExpandableWidget>

      <ExpandableWidget
        title="Tumour Response"
        icon={<TrendingUp className="h-5 w-5 text-primary" />}
        open={expandedWidget === "tumourResponse"}
        onOpenChange={(open) => setExpandedWidget(open ? "tumourResponse" : null)}
      >
        <TumourResponseExpanded userId={user.id} />
      </ExpandableWidget>

      {isActive("inspiration") && (
        <div className="mb-6">
          <InspirationWidget />
        </div>
      )}

      

      {isActive("todayWellness") && (
        <div className="mb-6">
          <TodayWellnessWidget userId={user.id} />
        </div>
      )}

      {(isActive("treatmentTimeline") || isActive("appointments") || isActive("aiAssistant")) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {isActive("treatmentTimeline") && <TreatmentTimelineWidget />}
          {isActive("appointments") && <AppointmentsWidget />}
          {isActive("aiAssistant") && (
            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide text-base flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" /> Health Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body mb-4">
                  Personalised guidance for nutrition, immune support, scan preparation, and emotional wellbeing.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {["Immune Support", "Scan Anxiety", "Liver Recovery", "Supplements"].map((topic) => (
                    <Link key={topic} href="/ai-assistant">
                      <Button variant="outline" size="sm" className="w-full text-xs border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body">
                        {topic}
                      </Button>
                    </Link>
                  ))}
                </div>
                <Link href="/ai-assistant">
                  <Button className="w-full bg-primary text-white hover:bg-primary/90 font-heading tracking-wide">
                    Start Conversation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-base font-heading text-[hsl(34,55%,45%)] tracking-wide mb-4">Explore Your Healing Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="group bg-[hsl(36,40%,98%)] border border-[hsl(30,25%,87%)] rounded-xl p-4 text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0">
                <div className="mx-auto w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2.5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <span className="text-primary">{link.icon}</span>
                </div>
                <h3 className="font-heading text-xs text-[hsl(25,30%,28%)] group-hover:text-primary transition-colors">{link.label}</h3>
                <p className="text-[10px] text-[hsl(25,18%,55%)] font-body mt-0.5 line-clamp-1">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
