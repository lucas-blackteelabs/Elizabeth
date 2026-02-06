import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { MessageCircle, TrendingUp, Heart, Sparkles, Activity, Apple, Leaf, Shield, Target, Clock, Scan, Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Meal, MindBodyActivity, Exercise } from "@shared/schema";

function todayStr() {
  return new Date().toISOString().split('T')[0];
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
      return apiRequest('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date: todayStr(), mealType, description, antiInflammatoryScore: null }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meals'] });
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
            onChange={e => setDescription(e.target.value)}
            className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] font-body"
          />
          {mealType && (
            <Button
              variant="outline"
              size="sm"
              onClick={getAiSuggestion}
              disabled={aiLoading}
              className="w-full text-xs border-[hsl(34,55%,52%)]/30 text-[hsl(34,55%,45%)] hover:bg-[hsl(34,55%,52%)]/10 font-body gap-1"
            >
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
          <Button 
            onClick={() => mutation.mutate()} 
            disabled={!mealType || !description || mutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/90 font-heading"
          >
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
  const endpoint = isMindBody ? '/api/mind-body' : '/api/exercises';
  const queryKey = isMindBody ? '/api/mind-body' : '/api/exercises';

  const mutation = useMutation({
    mutationFn: async () => {
      const body = isMindBody 
        ? { userId, date: todayStr(), activityType, durationMinutes: parseInt(duration), notes: notes || null }
        : { userId, date: todayStr(), exerciseType: activityType, durationMinutes: parseInt(duration), intensity: "moderate", notes: notes || null };
      return apiRequest(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
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
              {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Duration (minutes)"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] font-body"
          />
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] font-body"
          />
          <Button 
            onClick={() => mutation.mutate()} 
            disabled={!activityType || !duration || mutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/90 font-heading"
          >
            {mutation.isPending ? "Saving..." : "Log Activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SimpleDashboard() {
  const { user } = useUser();
  const today = todayStr();
  
  const { data: todayMeals = [] } = useQuery<Meal[]>({
    queryKey: ['/api/meals', { userId: user?.id, date: today }],
    queryFn: async () => {
      const res = await fetch(`/api/meals?userId=${user?.id || 1}&dateFrom=${today}&dateTo=${today}`);
      return res.json();
    },
    enabled: !!user,
  });

  const { data: todayMindBody = [] } = useQuery<MindBodyActivity[]>({
    queryKey: ['/api/mind-body', { userId: user?.id, date: today }],
    queryFn: async () => {
      const res = await fetch(`/api/mind-body?userId=${user?.id || 1}&dateFrom=${today}&dateTo=${today}`);
      return res.json();
    },
    enabled: !!user,
  });

  const { data: todayExercises = [] } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises', { userId: user?.id, date: today }],
    queryFn: async () => {
      const res = await fetch(`/api/exercises?userId=${user?.id || 1}&dateFrom=${today}&dateTo=${today}`);
      return res.json();
    },
    enabled: !!user,
  });
  
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

  const quickLinks = [
    { href: "/nutrition", label: "Nutrition", icon: <Apple className="h-5 w-5" />, desc: "Liver & immune support" },
    { href: "/mind-body", label: "Mind & Body", icon: <Sparkles className="h-5 w-5" />, desc: "Meditation & healing" },
    { href: "/movement", label: "Movement", icon: <Activity className="h-5 w-5" />, desc: "Gentle exercise" },
    { href: "/spiritual", label: "Wellbeing", icon: <Leaf className="h-5 w-5" />, desc: "Inner peace & purpose" },
  ];

  const daysOffTreatment = Math.floor((new Date().getTime() - new Date("2025-07-01").getTime()) / (1000 * 60 * 60 * 24));
  const daysOffImmunosuppression = Math.floor((new Date().getTime() - new Date("2025-12-01").getTime()) / (1000 * 60 * 60 * 24));

  const nextScanDate = user.nextScanDate ? new Date(user.nextScanDate) : null;
  const daysUntilScan = nextScanDate ? Math.ceil((nextScanDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  const totalMindBodyMins = todayMindBody.reduce((sum, a) => sum + a.durationMinutes, 0);
  const totalExerciseMins = todayExercises.reduce((sum, e) => sum + e.durationMinutes, 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-primary/70 font-body text-sm tracking-widest uppercase mb-2">Your Healing Journey</p>
        <h1 className="text-3xl lg:text-4xl font-heading font-bold text-[hsl(25,35%,22%)] tracking-wide">
          Welcome back, {user?.displayName || 'Friend'}
        </h1>
        <p className="text-[hsl(25,18%,50%)] font-body mt-2">
          {user.treatmentStatus === "Active Surveillance" 
            ? "Your body is continuing to heal. Every day your immune system grows stronger."
            : "Continue nurturing your path to wellness"}
        </p>
        <div className="mt-4 h-px bg-gradient-to-r from-primary/40 via-[hsl(34,55%,52%)]/30 to-transparent" />
      </div>

      {user.treatmentStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardContent className="p-4 text-center">
              <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold text-[hsl(25,35%,22%)]">{daysOffTreatment}</p>
              <p className="text-xs text-[hsl(25,18%,48%)] font-body">Days off treatment</p>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 text-[hsl(34,55%,52%)] mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold text-[hsl(25,35%,22%)]">{daysOffImmunosuppression}</p>
              <p className="text-xs text-[hsl(25,18%,48%)] font-body">Days immune-free</p>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-lg font-heading font-bold text-primary">NED</p>
              <p className="text-xs text-[hsl(25,18%,48%)] font-body">2026 Goal</p>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardContent className="p-4 text-center">
              <Scan className="h-6 w-6 text-[hsl(34,55%,52%)] mx-auto mb-2" />
              <p className="text-2xl font-heading font-bold text-[hsl(25,35%,22%)]">{daysUntilScan !== null ? daysUntilScan : "—"}</p>
              <p className="text-xs text-[hsl(25,18%,48%)] font-body">Days to next scan</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide">Today's Wellness</CardTitle>
            <span className="text-xs text-[hsl(25,18%,48%)] font-body">{new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-[hsl(30,30%,95%)] rounded-lg p-3 border border-[hsl(30,22%,87%)] text-center">
              <Apple className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-heading font-bold text-[hsl(25,35%,22%)]">{todayMeals.length}</p>
              <p className="text-[10px] text-[hsl(25,18%,48%)] font-body">Meals logged</p>
            </div>
            <div className="bg-[hsl(30,30%,95%)] rounded-lg p-3 border border-[hsl(30,22%,87%)] text-center">
              <Sparkles className="h-5 w-5 text-[hsl(34,55%,52%)] mx-auto mb-1" />
              <p className="text-lg font-heading font-bold text-[hsl(25,35%,22%)]">{totalMindBodyMins}</p>
              <p className="text-[10px] text-[hsl(25,18%,48%)] font-body">Min mindfulness</p>
            </div>
            <div className="bg-[hsl(30,30%,95%)] rounded-lg p-3 border border-[hsl(30,22%,87%)] text-center">
              <Activity className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-heading font-bold text-[hsl(25,35%,22%)]">{totalExerciseMins}</p>
              <p className="text-[10px] text-[hsl(25,18%,48%)] font-body">Min exercise</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <LogMealDialog userId={user.id} />
            <LogActivityDialog userId={user.id} type="mindBody" />
            <LogActivityDialog userId={user.id} type="exercise" />
          </div>

          {todayMeals.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-body font-medium text-[hsl(25,18%,48%)]">Today's meals:</p>
              {todayMeals.map((meal, i) => (
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
              {todayMindBody.map(a => (
                <div key={a.id} className="flex items-center gap-2 text-xs font-body text-[hsl(25,30%,28%)]">
                  <Check className="h-3 w-3 text-[hsl(34,55%,52%)]" />
                  <span className="capitalize">{a.activityType}</span>
                  <span className="text-[hsl(25,18%,48%)]">— {a.durationMinutes} min</span>
                </div>
              ))}
              {todayExercises.map(e => (
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Treatment Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center py-2 border-b border-[hsl(30,22%,87%)]">
                <span className="text-[hsl(25,18%,48%)] font-body text-sm">Diagnosis</span>
                <span className="text-[hsl(25,30%,28%)] font-body font-medium">{user?.cancerType || "Not specified"} — {user?.cancerStage || "Not specified"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[hsl(30,22%,87%)]">
                <span className="text-[hsl(25,18%,48%)] font-body text-sm">Current Status</span>
                <span className="text-primary font-body font-medium">{user?.treatmentStatus || "Not specified"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[hsl(30,22%,87%)]">
                <span className="text-[hsl(25,18%,48%)] font-body text-sm">Next Scan</span>
                <span className="text-[hsl(25,30%,28%)] font-body font-medium">
                  {user?.nextScanDate ? new Date(user.nextScanDate).toLocaleDateString('en-AU', { month: 'long', day: 'numeric', year: 'numeric' }) : "Not scheduled"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[hsl(25,18%,48%)] font-body text-sm">Goal</span>
                <span className="text-[hsl(34,55%,45%)] font-body font-medium">{user?.goals?.split('.')[0] || "Not specified"}</span>
              </div>
            </div>

            {user.scanSummary && (
              <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                <p className="text-xs font-heading text-primary mb-1">Latest Scan Summary</p>
                <p className="text-xs text-[hsl(25,30%,28%)] font-body leading-relaxed">{user.scanSummary.substring(0, 200)}...</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Health Assistant
            </CardTitle>
            <CardDescription className="text-[hsl(25,18%,50%)] font-body">
              Personalised guidance for your healing journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-[hsl(25,18%,48%)] font-body">
                Ask me about liver-supportive nutrition, immune system support, scan preparation, supplements, mind-body practices, and emotional wellbeing.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body">
                  Immune Support
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body">
                  Scan Anxiety
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body">
                  Liver Recovery
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body">
                  Supplements
                </Button>
              </div>
              <Button 
                className="w-full bg-primary text-white hover:bg-primary/90 font-heading tracking-wide" 
                onClick={() => window.location.href = '/ai-assistant'}
              >
                Start Conversation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {user.treatmentHistory && (
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Treatment Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: "April 2025", title: "Diagnosis", desc: "Stage IV melanoma with liver metastases. Three liver tumours identified.", color: "bg-[hsl(34,55%,52%)]" },
                { date: "April–July 2025", title: "Immunotherapy", desc: "4 cycles of ipilimumab + nivolumab. Major partial metabolic response achieved.", color: "bg-primary" },
                { date: "July 2025", title: "Treatment Stopped", desc: "Immunotherapy ceased due to severe toxicity (Grade 4 hepatitis, colitis). Started immunosuppression.", color: "bg-[hsl(0,50%,55%)]" },
                { date: "December 2025", title: "Immunosuppression Ceased", desc: "Approximately 5 months of mycophenolate completed. Immune system now recovering.", color: "bg-[hsl(34,55%,52%)]" },
                { date: "February 2026", title: "Continued Improvement", desc: "Latest scan shows continued improvement. One lesion metabolically complete. No new disease anywhere.", color: "bg-primary" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full ${item.color} mt-1.5 flex-shrink-0`} />
                  <div>
                    <p className="font-body font-medium text-[hsl(25,30%,28%)]">{item.date} — {item.title}</p>
                    <p className="text-sm text-[hsl(25,18%,48%)] font-body">{item.desc}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full border-2 border-primary bg-white mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-body font-medium text-primary">May 2026 — Goal: NED</p>
                  <p className="text-sm text-[hsl(25,18%,48%)] font-body">Target: No Evidence of Disease confirmation at next scan.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-heading text-[hsl(34,55%,45%)] tracking-wide mb-4">Explore Your Healing Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] hover:border-primary/30 hover:bg-[hsl(30,30%,95%)] transition-all duration-300 cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3 group-hover:bg-primary/25 transition-colors">
                    <span className="text-primary">{link.icon}</span>
                  </div>
                  <h3 className="font-heading text-sm text-[hsl(25,30%,28%)] group-hover:text-primary transition-colors">{link.label}</h3>
                  <p className="text-xs text-[hsl(25,18%,48%)] font-body mt-1">{link.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      
      <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
        <CardHeader>
          <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { title: "Nutrition Consultation", person: "Integrative Dietitian", date: "March 10, 2026", time: "2:00 PM", color: "text-primary" },
              { title: "PET/CT Scan", person: "Radiology Department", date: "May 15, 2026", time: "9:00 AM", color: "text-[hsl(34,55%,45%)]" },
              { title: "Oncology Review", person: "Melanoma Oncology Team", date: "May 22, 2026", time: "10:30 AM", color: "text-[hsl(34,55%,45%)]" },
            ].map((appt, i) => (
              <div key={i} className={`flex items-center justify-between pb-3 ${i < 2 ? 'border-b border-[hsl(30,22%,87%)]' : ''}`}>
                <div>
                  <p className="font-body font-medium text-[hsl(25,30%,28%)]">{appt.title}</p>
                  <p className="text-sm text-[hsl(25,18%,48%)] font-body">{appt.person}</p>
                </div>
                <div className="text-right">
                  <p className={`font-body font-medium ${appt.color}`}>{appt.date}</p>
                  <p className="text-sm text-[hsl(25,18%,48%)] font-body">{appt.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
