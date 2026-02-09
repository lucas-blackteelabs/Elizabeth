import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Pencil, Trash2, Syringe, Leaf, Brain, Sparkles, Star, Check,
  MapPin, User, AlertTriangle, CalendarPlus, Loader2, ChevronRight, Clock
} from "lucide-react";
import type { TreatmentProgram, TreatmentSession } from "@shared/schema";

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof Syringe; label: string }> = {
  medical: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Syringe, label: "Medical" },
  complementary: { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: Leaf, label: "Complementary" },
  "mind-body": { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", icon: Brain, label: "Mind-Body" },
  integrative: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Sparkles, label: "Integrative" },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  active: { color: "text-emerald-700", bg: "bg-emerald-50" },
  completed: { color: "text-amber-700", bg: "bg-amber-50" },
  paused: { color: "text-slate-600", bg: "bg-slate-100" },
};

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.medical;
}

function ProgramCard({
  program,
  onEdit,
  onDelete,
  onClick,
}: {
  program: TreatmentProgram;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const cat = getCategoryConfig(program.category);
  const CatIcon = cat.icon;
  const progress = program.totalSessions && program.totalSessions > 0
    ? Math.round(((program.completedSessions || 0) / program.totalSessions) * 100)
    : 0;
  const isCompleted = program.status === "completed" || (program.totalSessions && program.completedSessions === program.totalSessions);
  const statusCfg = STATUS_CONFIG[program.status] || STATUS_CONFIG.active;
  const hasSideEffects = program.category === "medical" && program.sideEffects;

  return (
    <Card
      className={`bg-white border-border rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
        isCompleted ? "border-2 border-amber-400 shadow-[0_0_20px_rgba(196,140,60,0.15)]" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl ${cat.bg} ${cat.border} border flex items-center justify-center`}>
              <CatIcon className={`h-5 w-5 ${cat.color}`} />
            </div>
            <div>
              <h3 className="font-heading text-foreground text-base leading-tight">{program.name}</h3>
              <p className="text-xs font-body text-muted-foreground">{program.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {isCompleted && <Star className="h-5 w-5 text-amber-400 fill-amber-400" />}
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge className={`${cat.bg} ${cat.color} border ${cat.border} text-[10px] font-body`}>
            {cat.label}
          </Badge>
          <Badge className={`${statusCfg.bg} ${statusCfg.color} text-[10px] font-body`}>
            {isCompleted ? "Completed!" : program.status}
          </Badge>
        </div>

        {program.totalSessions && program.totalSessions > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-body text-muted-foreground">Progress</span>
              <span className="text-[11px] font-body font-medium text-foreground">
                {program.completedSessions || 0}/{program.totalSessions} sessions
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {(program.provider || program.location) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
            {program.provider && (
              <span className="flex items-center gap-1 text-[11px] font-body text-muted-foreground">
                <User className="h-3 w-3" /> {program.provider}
              </span>
            )}
            {program.location && (
              <span className="flex items-center gap-1 text-[11px] font-body text-muted-foreground">
                <MapPin className="h-3 w-3" /> {program.location}
              </span>
            )}
          </div>
        )}

        {hasSideEffects && (
          <div className="mt-2 p-2.5 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-body font-semibold text-red-700">Side Effects</p>
                <p className="text-[11px] font-body text-red-600 mt-0.5">{program.sideEffects}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end mt-2">
          <span className="text-[11px] font-body text-primary flex items-center gap-0.5">
            View details <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramDetailDialog({
  program,
  open,
  onClose,
  userId,
}: {
  program: TreatmentProgram;
  open: boolean;
  onClose: () => void;
  userId: number;
}) {
  const { toast } = useToast();
  const cat = getCategoryConfig(program.category);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<TreatmentSession[]>({
    queryKey: ["/api/treatment-sessions", { programId: program.id }],
    queryFn: async () => {
      const res = await fetch(`/api/treatment-sessions?programId=${program.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    enabled: open,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      return apiRequest(`/api/treatment-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-sessions", { programId: program.id }] });
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-programs"] });
      toast({ title: "Session completed", description: "Great progress on your healing journey!" });
    },
  });

  const addAppointmentMutation = useMutation({
    mutationFn: async (session: TreatmentSession) => {
      return apiRequest("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: `${program.name} - Session ${session.sessionNumber}`,
          description: `${program.type} session at ${program.location || "TBD"}`,
          date: session.date || new Date().toISOString().split("T")[0],
          time: session.time || "09:00",
          location: program.location || "",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({ title: "Appointment created", description: "Added to your calendar." });
    },
  });

  const sortedSessions = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-border max-h-[85vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground text-xl">{program.name}</DialogTitle>
          <p className="text-sm font-body text-muted-foreground">{program.type} • {cat.label}</p>
        </DialogHeader>

        <div className="space-y-4">
          {program.notes && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <p className="text-xs font-body text-muted-foreground font-medium mb-1">Notes</p>
              <p className="text-sm font-body text-foreground">{program.notes}</p>
            </div>
          )}

          {program.sideEffects && program.category === "medical" && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-body font-semibold text-red-700">Side Effects & Adverse Events</p>
                  <p className="text-sm font-body text-red-600 mt-1">{program.sideEffects}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-heading text-foreground text-base mb-3">Session Timeline</h4>
            {sessionsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : sortedSessions.length === 0 ? (
              <p className="text-sm font-body text-muted-foreground text-center py-4">No sessions recorded yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-3">
                  {sortedSessions.map((session) => {
                    const isSessionCompleted = session.status === "completed";
                    const isScheduled = session.status === "scheduled";
                    const hasSeSe = session.sideEffects && session.sideEffects.length > 0;

                    return (
                      <div key={session.id} className="relative pl-12">
                        <div className={`absolute left-3 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 ${
                          isSessionCompleted
                            ? "bg-emerald-500 border-emerald-500"
                            : isScheduled
                            ? "bg-white border-primary"
                            : "bg-white border-border"
                        }`}>
                          {isSessionCompleted && <Check className="h-3 w-3 text-white" />}
                        </div>

                        <div className={`p-3 rounded-xl border ${
                          hasSeSe ? "bg-red-50 border-red-200" : "bg-white border-border"
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-body font-medium text-foreground">
                              Session {session.sessionNumber}
                            </span>
                            <div className="flex items-center gap-1">
                              <Badge className={`text-[10px] font-body ${
                                isSessionCompleted ? "bg-emerald-50 text-emerald-700" :
                                isScheduled ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600"
                              }`}>
                                {session.status}
                              </Badge>
                            </div>
                          </div>

                          {session.date && (
                            <p className="text-[11px] font-body text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.date}{session.time ? ` at ${session.time}` : ""}
                            </p>
                          )}

                          {session.notes && (
                            <p className="text-[11px] font-body text-muted-foreground mt-1">{session.notes}</p>
                          )}

                          {hasSeSe && (
                            <div className="mt-1.5 flex items-start gap-1.5">
                              <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                              <p className="text-[11px] font-body text-red-600">{session.sideEffects}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            {!isSessionCompleted && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] font-body border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => markCompleteMutation.mutate(session.id)}
                                disabled={markCompleteMutation.isPending}
                              >
                                <Check className="h-3 w-3 mr-1" /> Mark Complete
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] font-body border-border text-muted-foreground hover:bg-muted/50"
                              onClick={() => addAppointmentMutation.mutate(session)}
                              disabled={addAppointmentMutation.isPending}
                            >
                              <CalendarPlus className="h-3 w-3 mr-1" /> Add to Calendar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddEditProgramDialog({
  open,
  onClose,
  userId,
  editProgram,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  userId: number;
  editProgram?: TreatmentProgram | null;
  prefill?: { name?: string; type?: string; category?: string; notes?: string; frequency?: string } | null;
}) {
  const { toast } = useToast();
  const isEdit = !!editProgram;

  const [name, setName] = useState(editProgram?.name || prefill?.name || "");
  const [type, setType] = useState(editProgram?.type || prefill?.type || "");
  const [category, setCategory] = useState(editProgram?.category || prefill?.category || "medical");
  const [startDate, setStartDate] = useState(editProgram?.startDate || new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(editProgram?.endDate || "");
  const [totalSessions, setTotalSessions] = useState(editProgram?.totalSessions?.toString() || "");
  const [frequency, setFrequency] = useState(editProgram?.frequency || prefill?.frequency || "");
  const [provider, setProvider] = useState(editProgram?.provider || "");
  const [location, setLocation] = useState(editProgram?.location || "");
  const [notes, setNotes] = useState(editProgram?.notes || prefill?.notes || "");

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: any = {
        userId,
        name,
        type,
        category,
        startDate,
        endDate: endDate || null,
        totalSessions: totalSessions ? parseInt(totalSessions) : null,
        completedSessions: 0,
        frequency: frequency || null,
        provider: provider || null,
        location: location || null,
        notes: notes || null,
        sideEffects: null,
        status: "active",
      };
      const program = await apiRequest("/api/treatment-programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (totalSessions && parseInt(totalSessions) > 0) {
        const sessCount = parseInt(totalSessions);
        for (let i = 1; i <= sessCount; i++) {
          await apiRequest("/api/treatment-sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              programId: program.id,
              userId,
              sessionNumber: i,
              status: "scheduled",
            }),
          });
        }
      }
      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-programs"] });
      onClose();
      toast({ title: "Program created", description: "Your treatment program has been added." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/treatment-programs/${editProgram!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          category,
          startDate,
          endDate: endDate || null,
          totalSessions: totalSessions ? parseInt(totalSessions) : null,
          frequency: frequency || null,
          provider: provider || null,
          location: location || null,
          notes: notes || null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-programs"] });
      onClose();
      toast({ title: "Program updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-border max-h-[85vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">
            {isEdit ? "Edit Program" : "Add Treatment Program"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-body font-medium text-foreground">Program Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Immunotherapy" className="mt-1 bg-muted/50 border-border font-body" />
          </div>
          <div>
            <label className="text-xs font-body font-medium text-foreground">Type</label>
            <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Pembrolizumab" className="mt-1 bg-muted/50 border-border font-body" />
          </div>
          <div>
            <label className="text-xs font-body font-medium text-foreground">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1 bg-muted/50 border-border font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="complementary">Complementary</SelectItem>
                <SelectItem value="mind-body">Mind-Body</SelectItem>
                <SelectItem value="integrative">Integrative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body font-medium text-foreground">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 bg-muted/50 border-border font-body" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-foreground">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 bg-muted/50 border-border font-body" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body font-medium text-foreground">Total Sessions</label>
              <Input type="number" value={totalSessions} onChange={(e) => setTotalSessions(e.target.value)} placeholder="e.g. 6" className="mt-1 bg-muted/50 border-border font-body" />
            </div>
            <div>
              <label className="text-xs font-body font-medium text-foreground">Frequency</label>
              <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. Every 3 weeks" className="mt-1 bg-muted/50 border-border font-body" />
            </div>
          </div>
          <div>
            <label className="text-xs font-body font-medium text-foreground">Provider</label>
            <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Dr. Smith" className="mt-1 bg-muted/50 border-border font-body" />
          </div>
          <div>
            <label className="text-xs font-body font-medium text-foreground">Location</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Cancer Centre" className="mt-1 bg-muted/50 border-border font-body" />
          </div>
          <div>
            <label className="text-xs font-body font-medium text-foreground">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." className="mt-1 bg-muted/50 border-border font-body min-h-[60px]" />
          </div>
          <Button
            className="w-full bg-primary text-white hover:bg-primary/90 font-body font-medium"
            onClick={() => isEdit ? updateMutation.mutate() : createMutation.mutate()}
            disabled={!name || !type || isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isEdit ? "Save Changes" : "Create Program"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AiSuggestion {
  name: string;
  type: string;
  description: string;
  frequency: string;
  evidence: string;
}

export default function TreatmentPlus() {
  const { user } = useUser();
  const { toast } = useToast();
  const userId = user?.id || 1;

  const [selectedProgram, setSelectedProgram] = useState<TreatmentProgram | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editProgram, setEditProgram] = useState<TreatmentProgram | null>(null);
  const [prefill, setPrefill] = useState<AiSuggestion | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: programs = [], isLoading } = useQuery<TreatmentProgram[]>({
    queryKey: ["/api/treatment-programs", { userId }],
    queryFn: async () => {
      const res = await fetch(`/api/treatment-programs?userId=${userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/treatment-programs/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treatment-programs"] });
      toast({ title: "Program deleted" });
    },
  });

  const getAiSuggestions = async () => {
    setAiLoading(true);
    try {
      const data = await apiRequest("/api/ai/treatment-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setAiSuggestions(data.suggestions || []);
    } catch {
      toast({ title: "Couldn't load suggestions", description: "Please try again later.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const activePrograms = programs.filter((p) => p.status === "active");
  const completedPrograms = programs.filter((p) => p.status === "completed" || (p.totalSessions && p.completedSessions === p.totalSessions));
  const pausedPrograms = programs.filter((p) => p.status === "paused");
  const allSorted = [...activePrograms, ...pausedPrograms, ...completedPrograms];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="font-heading text-2xl md:text-3xl text-foreground">Treatment +</h1>
          <p className="text-sm font-body text-muted-foreground mt-1">
            Your complete treatment programs and healing therapies
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg text-foreground">Your Programs</h2>
          <Button
            onClick={() => { setPrefill(null); setEditProgram(null); setAddOpen(true); }}
            className="bg-primary text-white hover:bg-primary/90 font-body text-sm gap-1.5"
            size="sm"
          >
            <Plus className="h-4 w-4" /> Add Program
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : allSorted.length === 0 ? (
          <Card className="bg-white border-border rounded-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-heading text-lg text-foreground mb-1">No programs yet</h3>
              <p className="text-sm font-body text-muted-foreground mb-4">
                Start tracking your treatment journey by adding your first program.
              </p>
              <Button
                onClick={() => { setPrefill(null); setEditProgram(null); setAddOpen(true); }}
                className="bg-primary text-white hover:bg-primary/90 font-body gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Your First Program
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allSorted.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onEdit={() => { setEditProgram(program); setAddOpen(true); }}
                onDelete={() => deleteMutation.mutate(program.id)}
                onClick={() => setSelectedProgram(program)}
              />
            ))}
          </div>
        )}

        <div className="mt-8">
          <Card className="bg-white border-border rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading text-base text-foreground">Discover More Healing Options</h3>
                  <p className="text-xs font-body text-muted-foreground">AI-powered suggestions tailored to your journey</p>
                </div>
              </div>

              <Button
                onClick={getAiSuggestions}
                disabled={aiLoading}
                variant="outline"
                className="w-full border-accent/30 text-accent hover:bg-accent/10 font-body text-sm gap-1.5 mb-4"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {aiLoading ? "Getting suggestions..." : "Get AI Suggestions"}
              </Button>

              {aiSuggestions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiSuggestions.map((suggestion, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-muted/50 border border-border">
                      <h4 className="text-sm font-body font-semibold text-foreground">{suggestion.name}</h4>
                      <p className="text-[11px] font-body text-muted-foreground mt-1">{suggestion.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {suggestion.frequency && (
                          <Badge className="bg-primary/10 text-primary text-[10px] font-body">{suggestion.frequency}</Badge>
                        )}
                        {suggestion.evidence && (
                          <Badge className="bg-amber-50 text-amber-700 text-[10px] font-body">{suggestion.evidence}</Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full h-7 text-[11px] font-body border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => {
                          setPrefill(suggestion);
                          setEditProgram(null);
                          setAddOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add to My Programs
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedProgram && (
        <ProgramDetailDialog
          program={selectedProgram}
          open={!!selectedProgram}
          onClose={() => setSelectedProgram(null)}
          userId={userId}
        />
      )}

      <AddEditProgramDialog
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditProgram(null); setPrefill(null); }}
        userId={userId}
        editProgram={editProgram}
        prefill={prefill ? { name: prefill.name, type: prefill.type || prefill.name, category: "complementary", notes: prefill.description, frequency: prefill.frequency } : null}
      />
    </div>
  );
}
