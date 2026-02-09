import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, FileText, TrendingDown, ArrowDown, Plus, Trash2, Pencil,
  Loader2, Calendar, ClipboardList, TestTubes, Scan, Shield, Heart,
  ChevronRight, FlaskConical, Activity
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ScanResult, MedicalDocument } from "@shared/schema";

const DOC_TYPE_CONFIG: Record<string, { icon: typeof FileText; color: string; bg: string }> = {
  "scan": { icon: Scan, color: "text-blue-600", bg: "bg-blue-50" },
  "blood-test": { icon: TestTubes, color: "text-red-500", bg: "bg-red-50" },
  "pathology": { icon: FlaskConical, color: "text-purple-600", bg: "bg-purple-50" },
  "report": { icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-50" },
  "letter": { icon: FileText, color: "text-green-600", bg: "bg-green-50" },
  "other": { icon: FileText, color: "text-slate-500", bg: "bg-slate-50" },
};

function getDocConfig(type: string) {
  return DOC_TYPE_CONFIG[type] || DOC_TYPE_CONFIG.other;
}

function AISummaryCard({ userId }: { userId: number }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/ai/medical-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setSummary(data.summary);
      setHasLoaded(true);
    } catch (e) {
      setSummary("Unable to generate summary at this time.");
    }
    setLoading(false);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-white to-accent/5 border-primary/20 rounded-2xl overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-foreground text-base">Your Medical Summary</h3>
            <p className="text-[11px] font-body text-muted-foreground">AI-generated overview of your situation</p>
          </div>
        </div>

        {!hasLoaded && !loading ? (
          <Button onClick={loadSummary} className="w-full bg-primary/10 text-primary hover:bg-primary/20 border-0 font-body rounded-xl h-10">
            <Sparkles className="h-4 w-4 mr-2" /> Generate My Summary
          </Button>
        ) : loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
            <span className="text-sm font-body text-muted-foreground">Analysing your medical data...</span>
          </div>
        ) : summary ? (
          <div className="space-y-2">
            <div className="text-sm font-body text-foreground leading-relaxed whitespace-pre-line">{summary}</div>
            <Button variant="ghost" size="sm" onClick={loadSummary}
              className="text-[10px] font-body text-muted-foreground hover:text-primary mt-2 h-7 px-2">
              <Sparkles className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TumourCard({ tumourLabel, scans }: { tumourLabel: string; scans: ScanResult[] }) {
  const sorted = [...scans].sort((a, b) => new Date(a.scanDate).getTime() - new Date(b.scanDate).getTime());
  const baseline = sorted[0];
  const latest = sorted[sorted.length - 1];
  if (!baseline || !latest) return null;

  const baselineArea = baseline.sizeX * baseline.sizeY;
  const latestArea = latest.sizeX * latest.sizeY;
  const isResolved = latestArea === 0 && latest.suvMax === null;
  const areaReduction = baselineArea > 0 ? ((baselineArea - latestArea) / baselineArea * 100) : 0;
  const suvBaseline = baseline.suvMax;
  const suvLatest = latest.suvMax;
  const suvReduction = suvBaseline && suvLatest ? ((suvBaseline - suvLatest) / suvBaseline * 100) : suvLatest === null ? 100 : 0;

  const maxBaseline = Math.max(...scans.map(s => s.sizeX * s.sizeY));
  const scale = maxBaseline > 0 ? Math.min(1, Math.max(0.4, baselineArea / maxBaseline)) : 0.5;
  const baseRadius = 32 * scale;
  const currentRadius = isResolved ? 0 : baseRadius * (latestArea / baselineArea);

  return (
    <Card className={`rounded-2xl border transition-all duration-300 hover:shadow-md ${
      isResolved ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" : "bg-white border-border"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-heading text-foreground text-sm">{tumourLabel}</h4>
            <p className="text-[10px] font-body text-muted-foreground">
              {sorted.length} scans tracked
            </p>
          </div>
          {isResolved ? (
            <Badge className="bg-primary/15 text-primary text-[10px] font-body border-0">
              <Sparkles className="h-3 w-3 mr-1" /> Resolved
            </Badge>
          ) : suvLatest === null ? (
            <Badge className="bg-primary/15 text-primary text-[10px] font-body border-0">No Uptake</Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="relative flex items-center justify-center" style={{ width: 70, height: 70 }}>
            {isResolved ? (
              <div className="flex flex-col items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary/40" />
                <span className="text-[10px] font-body text-primary mt-1">Gone</span>
              </div>
            ) : (
              <>
                <svg width={70} height={70} viewBox="0 0 70 70">
                  <circle cx={35} cy={35} r={baseRadius} fill="none" stroke="currentColor"
                    className="text-muted-foreground/20" strokeWidth={1.5} strokeDasharray="3 3" />
                  <circle cx={35} cy={35} r={Math.max(3, currentRadius)} fill="currentColor"
                    className="text-accent/30" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-heading font-bold text-foreground">
                    {latest.sizeX}x{latest.sizeY}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <div className="flex justify-between text-[10px] font-body mb-0.5">
                <span className="text-muted-foreground">Size</span>
                <span className="text-primary font-medium">{areaReduction.toFixed(0)}% smaller</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary/60 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, areaReduction)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-body mb-0.5">
                <span className="text-muted-foreground">Activity (SUV)</span>
                <span className="text-accent font-medium">{suvReduction.toFixed(0)}% reduced</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent/60 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, suvReduction)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {sorted.map((scan, i) => (
            <div key={i} className="flex-shrink-0 bg-muted/50 rounded-lg p-1.5 text-center min-w-[56px] border border-border/50">
              <p className="text-[8px] text-muted-foreground font-body">
                {new Date(scan.scanDate).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })}
              </p>
              <p className="text-[10px] font-heading font-bold text-foreground">
                {scan.sizeX === 0 && scan.sizeY === 0 ? (
                  <span className="text-primary">Gone</span>
                ) : (
                  <>{scan.sizeX}x{scan.sizeY}</>
                )}
              </p>
              <p className="text-[8px] text-muted-foreground font-body">
                {scan.suvMax !== null ? `SUV ${scan.suvMax}` : "—"}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentCard({ doc, onDelete }: { doc: MedicalDocument; onDelete: () => void }) {
  const config = getDocConfig(doc.documentType);
  const DocIcon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-border hover:shadow-sm transition-all group">
      <div className={`p-2 rounded-xl ${config.bg} flex-shrink-0`}>
        <DocIcon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-body font-medium text-foreground truncate">{doc.title}</h4>
          <Badge className={`text-[9px] font-body ${config.bg} ${config.color} border-0 flex-shrink-0`}>
            {doc.documentType}
          </Badge>
        </div>
        <p className="text-[11px] font-body text-muted-foreground mt-0.5">
          {new Date(doc.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        {doc.summary && (
          <p className="text-xs font-body text-muted-foreground mt-1 line-clamp-2">{doc.summary}</p>
        )}
        {doc.notes && (
          <p className="text-[11px] font-body text-muted-foreground/70 mt-1 italic">{doc.notes}</p>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-muted-foreground hover:text-red-500 flex-shrink-0">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function AddDocumentDialog({ open, onClose, userId }: { open: boolean; onClose: () => void; userId: number }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("scan");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummaryText] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/medical-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, documentType: docType, date, summary: summary || null, notes: notes || null }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-documents"] });
      toast({ title: "Document added" });
      setTitle(""); setSummaryText(""); setNotes("");
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white border-border max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">Add Medical Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-body text-muted-foreground">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. PET/CT Scan Report"
              className="font-body rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-body text-muted-foreground">Type</label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="font-body rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scan">Scan</SelectItem>
                  <SelectItem value="blood-test">Blood Test</SelectItem>
                  <SelectItem value="pathology">Pathology</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-body text-muted-foreground">Date</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="font-body rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-xs font-body text-muted-foreground">Summary</label>
            <Textarea value={summary} onChange={e => setSummaryText(e.target.value)} placeholder="Key findings or results..."
              className="font-body rounded-xl resize-none" rows={2} />
          </div>
          <div>
            <label className="text-xs font-body text-muted-foreground">Notes (optional)</label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any personal notes..."
              className="font-body rounded-xl" />
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!title || createMutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/90 font-body rounded-xl">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TimelineSection({ user }: { user: any }) {
  const events = [
    { date: "22 April 2025", title: "Diagnosis", desc: "Stage IV melanoma. Three liver metastases + one small bowel lesion on PET/CT. BRAF wild-type, PD-L1 positive.", color: "bg-accent", icon: Activity },
    { date: "Apr – Jul 2025", title: "Immunotherapy", desc: "4 cycles ipilimumab + nivolumab. Achieved major partial metabolic response.", color: "bg-primary", icon: Shield },
    { date: "July 2025", title: "Severe Toxicity", desc: "Grade 4 hepatitis (ALT ~750) + severe colitis. All immunotherapy ceased. High-dose steroids then mycophenolate.", color: "bg-red-500", icon: Heart },
    { date: "5 Aug 2025", title: "Post-Treatment Scan", desc: "PET/CT confirms major partial response. All tumours smaller with reduced metabolic activity.", color: "bg-primary", icon: Scan },
    { date: "Dec 2025", title: "Immunosuppression Ceased", desc: "5 months mycophenolate completed. Liver function recovering. Immune system rebuilding.", color: "bg-accent", icon: Shield },
    { date: "3 Feb 2026", title: "Latest Scan", desc: "Continued improvement off therapy. Tumour 2 metabolically complete. Tumour 4 resolved. No new disease.", color: "bg-primary", icon: TrendingDown },
    { date: "May 2026", title: "Goal: NED", desc: "Target: No Evidence of Disease. PET/CT scheduled 15 May 2026.", color: "bg-primary/20 border-2 border-primary", icon: Sparkles, isGoal: true },
  ];

  return (
    <Card className="bg-white border-border rounded-2xl">
      <CardContent className="p-5">
        <h3 className="font-heading text-foreground text-base mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" /> Treatment Timeline
        </h3>
        <div className="space-y-4">
          {events.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center`}>
                    <Icon className={`h-3.5 w-3.5 ${(item as any).isGoal ? 'text-primary' : 'text-white'}`} />
                  </div>
                  {i < events.length - 1 && <div className="w-px h-full bg-border mt-1 min-h-[16px]" />}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-body text-muted-foreground">{item.date}</span>
                    {(item as any).isGoal && <Badge className="bg-primary/10 text-primary text-[9px] font-body border-0">upcoming</Badge>}
                  </div>
                  <p className={`text-sm font-body font-medium ${(item as any).isGoal ? 'text-primary' : 'text-foreground'} mt-0.5`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground font-body mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusCards({ user }: { user: any }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="bg-white border-border rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-accent/10 rounded-lg">
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <h4 className="font-heading text-foreground text-sm">Current Status</h4>
          </div>
          <div className="space-y-2">
            {[
              { label: "Status", value: user?.treatmentStatus || "—", color: "text-primary" },
              { label: "Active Treatment", value: "None (surveillance)", color: "text-foreground" },
              { label: "Immunosuppression", value: "Ceased Dec 2025", color: "text-primary" },
              { label: "Next Scan", value: user?.nextScanDate ? new Date(user.nextScanDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' }) : "—", color: "text-accent" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground font-body">{item.label}</span>
                <span className={`text-xs font-body font-medium ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-border rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <h4 className="font-heading text-foreground text-sm">Key Markers</h4>
          </div>
          <div className="space-y-2">
            {[
              { label: "Liver Function", value: "Recovering", color: "text-primary" },
              { label: "Immune System", value: "Rebuilding", color: "text-primary" },
              { label: "Tumour Response", value: "Improving", color: "text-primary" },
              { label: "LDH Level", value: "Monitor", color: "text-accent" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                <span className="text-xs text-muted-foreground font-body">{item.label}</span>
                <span className={`text-xs font-body font-medium ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {user?.adverseEventHistory && (
        <Card className="bg-white border-border rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-red-50 rounded-lg">
                <Activity className="h-4 w-4 text-red-500" />
              </div>
              <h4 className="font-heading text-foreground text-sm">Adverse Events</h4>
            </div>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">{user.adverseEventHistory}</p>
            <div className="mt-3 bg-accent/10 border border-accent/20 p-2 rounded-lg">
              <p className="text-[10px] text-foreground font-body">
                <span className="font-medium">Note:</span> Prior severe toxicity means further immunotherapy is not recommended.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MedicalTracker() {
  const { user } = useUser();
  const { toast } = useToast();
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "documents" | "timeline" | "status">("overview");

  const { data: scanResults = [], isLoading } = useQuery<ScanResult[]>({
    queryKey: ['/api/scan-results', { userId: user?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/scan-results?userId=${user?.id || 1}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!user,
  });

  const { data: documents = [] } = useQuery<MedicalDocument[]>({
    queryKey: ["/api/medical-documents", { userId: user?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/medical-documents?userId=${user?.id || 1}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!user,
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/medical-documents/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-documents"] });
      toast({ title: "Document removed" });
    },
  });

  const tumourGroups: Record<string, ScanResult[]> = {};
  scanResults.forEach(r => {
    if (!tumourGroups[r.tumourLabel]) tumourGroups[r.tumourLabel] = [];
    tumourGroups[r.tumourLabel].push(r);
  });

  const scanDates = Array.from(new Set(scanResults.map(r => r.scanDate))).sort();
  const resolvedCount = Object.values(tumourGroups).filter(scans => {
    const latest = [...scans].sort((a, b) => new Date(b.scanDate).getTime() - new Date(a.scanDate).getTime())[0];
    return latest && latest.sizeX === 0 && latest.sizeY === 0;
  }).length;

  const tabs = [
    { key: "overview", label: "Overview", icon: Sparkles },
    { key: "documents", label: "Documents", icon: FileText },
    { key: "timeline", label: "Timeline", icon: Calendar },
    { key: "status", label: "Status", icon: Shield },
  ] as const;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-accent tracking-wide">Medical Tracker</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Your scans, documents, and medical history in one place</p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent/40 via-primary/30 to-transparent" />
      </div>

      <div className="flex gap-1.5 mb-5 bg-muted/50 p-1 rounded-xl border border-border/50 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body transition-all flex-shrink-0 ${
                activeSection === tab.key
                  ? "bg-white text-primary font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeSection === "overview" && (
        <div className="space-y-5">
          {user && <AISummaryCard userId={user.id} />}

          {scanResults.length > 0 && (
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="text-sm font-body font-medium text-foreground">
                  All {Object.keys(tumourGroups).length} tumours responding
                  {resolvedCount > 0 && ` — ${resolvedCount} resolved`}
                </p>
              </div>
              <p className="text-xs text-muted-foreground font-body">
                {scanDates.length} scans from {new Date(scanDates[0]).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })} to {new Date(scanDates[scanDates.length - 1]).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(tumourGroups).map(([label, scans]) => (
                <TumourCard key={label} tumourLabel={label} scans={scans} />
              ))}
            </div>
          )}

          {scanResults.length > 0 && (
            <Card className="bg-white border-border rounded-2xl">
              <CardContent className="p-4">
                <h3 className="font-heading text-foreground text-sm mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-accent" /> Scan Comparison
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-body">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-muted-foreground"></th>
                        {scanDates.map(d => (
                          <th key={d} className="text-center py-2 px-2 text-foreground" colSpan={2}>
                            <div className="font-heading text-[10px]">
                              {new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </div>
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 px-2 text-[9px] text-muted-foreground"></th>
                        {scanDates.map(d => (
                          <th key={`${d}-h`} className="text-center py-1 px-1 text-[9px] text-muted-foreground" colSpan={1}>Size</th>
                        ))}
                        {scanDates.map(d => (
                          <th key={`${d}-s`} className="text-center py-1 px-1 text-[9px] text-muted-foreground" colSpan={1}>SUV</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(tumourGroups).map(([label, scans]) => {
                        const sorted = [...scans].sort((a, b) => new Date(a.scanDate).getTime() - new Date(b.scanDate).getTime());
                        return (
                          <tr key={label} className="border-b border-border/50">
                            <td className="py-1.5 px-2 font-medium text-foreground text-[11px]">{label}</td>
                            {sorted.map(s => (
                              <td key={`${s.id}-sz`} className="text-center py-1.5 px-1 text-foreground text-[11px]">
                                {s.sizeX === 0 ? <span className="text-primary">Gone</span> : `${s.sizeX}x${s.sizeY}`}
                              </td>
                            ))}
                            {sorted.map(s => (
                              <td key={`${s.id}-sv`} className={`text-center py-1.5 px-1 text-[11px] ${s.suvMax === null ? 'text-primary font-medium' : 'text-foreground'}`}>
                                {s.suvMax !== null ? s.suvMax : "—"}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeSection === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-foreground text-base">Medical Documents</h3>
              <p className="text-xs font-body text-muted-foreground">Scans, blood tests, pathology reports and more</p>
            </div>
            <Button onClick={() => setShowAddDoc(true)}
              className="bg-primary text-white hover:bg-primary/90 font-body rounded-xl text-xs h-9">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Document
            </Button>
          </div>

          {documents.length === 0 ? (
            <Card className="bg-white border-border rounded-2xl">
              <CardContent className="py-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-body text-muted-foreground">No documents yet</p>
                <p className="text-xs font-body text-muted-foreground/60 mt-1">Add your scan reports, blood tests, and other medical documents</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {[...documents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(doc => (
                <DocumentCard key={doc.id} doc={doc} onDelete={() => deleteDocMutation.mutate(doc.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === "timeline" && <TimelineSection user={user} />}
      {activeSection === "status" && <StatusCards user={user} />}

      <AddDocumentDialog open={showAddDoc} onClose={() => setShowAddDoc(false)} userId={user?.id || 1} />
    </div>
  );
}
