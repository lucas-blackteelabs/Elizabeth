import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, Shield, Scan, Heart, TrendingDown, ArrowDown, Clock } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useQuery } from "@tanstack/react-query";
import type { ScanResult } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ScanProgressBar({ label, baseline, current, unit }: { label: string; baseline: number; current: number; unit: string }) {
  const pctChange = ((baseline - current) / baseline * 100);
  const barWidth = Math.max(5, (current / baseline) * 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-body">
        <span className="text-[hsl(25,18%,48%)]">{label}</span>
        <span className="text-primary font-medium">{pctChange > 0 ? `${pctChange.toFixed(0)}% reduction` : "stable"}</span>
      </div>
      <div className="relative h-4 bg-[hsl(30,25%,90%)] rounded-full overflow-hidden">
        <div className="absolute inset-0 h-full bg-[hsl(30,25%,85%)] rounded-full" style={{ width: '100%' }} />
        <div className="absolute inset-0 h-full bg-primary/60 rounded-full transition-all duration-1000" style={{ width: `${barWidth}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-[hsl(25,18%,55%)] font-body">
        <span>Baseline: {baseline}{unit}</span>
        <span>Current: {current}{unit}</span>
      </div>
    </div>
  );
}

function TumourCard({ tumourLabel, scans }: { tumourLabel: string; scans: ScanResult[] }) {
  const sorted = [...scans].sort((a, b) => new Date(a.scanDate).getTime() - new Date(b.scanDate).getTime());
  const baseline = sorted[0];
  const latest = sorted[sorted.length - 1];
  
  if (!baseline || !latest) return null;
  
  const baselineArea = baseline.sizeX * baseline.sizeY;
  const latestArea = latest.sizeX * latest.sizeY;
  const areaReduction = ((baselineArea - latestArea) / baselineArea * 100).toFixed(0);
  
  const suvBaseline = baseline.suvMax;
  const suvLatest = latest.suvMax;
  const suvChange = suvBaseline && suvLatest 
    ? ((suvBaseline - suvLatest) / suvBaseline * 100).toFixed(0) 
    : suvLatest === null ? "Complete" : null;

  return (
    <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-[hsl(25,30%,28%)] text-base flex items-center gap-2">
          {tumourLabel}
          {suvLatest === null && (
            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-body">No uptake</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {sorted.map((scan, i) => (
            <div key={i} className="bg-[hsl(30,30%,95%)] rounded p-2 border border-[hsl(30,22%,87%)]">
              <p className="text-[10px] text-[hsl(25,18%,50%)] font-body mb-1">
                {new Date(scan.scanDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })}
              </p>
              <p className="text-sm font-heading font-bold text-[hsl(25,30%,28%)]">{scan.sizeX}x{scan.sizeY}<span className="text-[10px] font-body">mm</span></p>
              <p className="text-xs text-[hsl(25,18%,48%)] font-body">
                SUV {scan.suvMax !== null ? scan.suvMax : "—"}
              </p>
            </div>
          ))}
        </div>
        
        <ScanProgressBar 
          label="Size (area)" 
          baseline={baselineArea} 
          current={latestArea} 
          unit="mm²" 
        />
        
        {suvBaseline && (
          <ScanProgressBar 
            label="SUV Max" 
            baseline={suvBaseline} 
            current={suvLatest || 0} 
            unit="" 
          />
        )}
        
        <div className="flex gap-3">
          <div className="flex items-center gap-1 text-xs text-primary font-body">
            <ArrowDown className="h-3 w-3" />
            <span>{areaReduction}% smaller</span>
          </div>
          {suvChange && (
            <div className="flex items-center gap-1 text-xs text-primary font-body">
              <TrendingDown className="h-3 w-3" />
              <span>SUV {suvChange === "Complete" ? "metabolically complete" : `${suvChange}% lower`}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MedicalTracker() {
  const { user } = useUser();
  
  const { data: scanResults = [], isLoading } = useQuery<ScanResult[]>({
    queryKey: ['/api/scan-results', { userId: user?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/scan-results?userId=${user?.id || 1}`);
      if (!res.ok) throw new Error('Failed to fetch scan results');
      return res.json();
    },
    enabled: !!user,
  });

  const tumourGroups: Record<string, ScanResult[]> = {};
  scanResults.forEach(r => {
    if (!tumourGroups[r.tumourLabel]) tumourGroups[r.tumourLabel] = [];
    tumourGroups[r.tumourLabel].push(r);
  });

  const scanDates = Array.from(new Set(scanResults.map(r => r.scanDate))).sort();
  
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Medical Tracker"
        description="Your scan results, treatment history, and health milestones"
      />

      <Tabs defaultValue="scans">
        <TabsList className="mb-6 bg-[hsl(30,30%,95%)] border border-[hsl(30,25%,87%)]">
          <TabsTrigger value="scans" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Scan className="h-4 w-4 mr-2" /> Scan Results
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Clock className="h-4 w-4 mr-2" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="status" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Shield className="h-4 w-4 mr-2" /> Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scans">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : scanResults.length > 0 ? (
            <>
              <Card className="bg-primary/10 border-primary/20 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <TrendingDown className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-body font-medium text-[hsl(25,30%,28%)]">
                        All three liver tumours continue to shrink
                      </p>
                      <p className="text-xs text-[hsl(25,18%,48%)] font-body mt-1">
                        {scanDates.length} scans tracked from {new Date(scanDates[0]).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })} to {new Date(scanDates[scanDates.length - 1]).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}. Tumour 2 now shows no metabolic activity.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {Object.entries(tumourGroups).map(([label, scans]) => (
                  <TumourCard key={label} tumourLabel={label} scans={scans} />
                ))}
              </div>

              <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
                <CardHeader>
                  <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide">Scan Comparison Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-body">
                      <thead>
                        <tr className="border-b border-[hsl(30,22%,87%)]">
                          <th className="text-left py-2 px-3 text-[hsl(25,18%,48%)]"></th>
                          {scanDates.map((d, i) => (
                            <th key={d} className="text-center py-2 px-3 text-[hsl(25,30%,28%)]" colSpan={2}>
                              <div className="font-heading text-xs">
                                {new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-[10px] text-[hsl(25,18%,55%)] font-normal mt-0.5">
                                {scanResults.find(r => r.scanDate === d)?.scanLabel?.split('(')[0]?.trim()}
                              </div>
                            </th>
                          ))}
                        </tr>
                        <tr className="border-b border-[hsl(30,22%,87%)]">
                          <th className="text-left py-1 px-3 text-[10px] text-[hsl(25,18%,55%)]"></th>
                          {scanDates.map(d => (
                            <>
                              <th key={`${d}-size`} className="text-center py-1 px-2 text-[10px] text-[hsl(25,18%,55%)]">Size (mm)</th>
                              <th key={`${d}-suv`} className="text-center py-1 px-2 text-[10px] text-[hsl(25,18%,55%)]">SUV Max</th>
                            </>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(tumourGroups).map(([label, scans]) => {
                          const sorted = [...scans].sort((a, b) => new Date(a.scanDate).getTime() - new Date(b.scanDate).getTime());
                          return (
                            <tr key={label} className="border-b border-[hsl(30,22%,90%)]">
                              <td className="py-2 px-3 font-medium text-[hsl(25,30%,28%)]">{label}</td>
                              {sorted.map((s, i) => (
                                <>
                                  <td key={`${s.id}-size`} className="text-center py-2 px-2 text-[hsl(25,30%,28%)]">
                                    {s.sizeX}x{s.sizeY}
                                  </td>
                                  <td key={`${s.id}-suv`} className={`text-center py-2 px-2 ${s.suvMax === null ? 'text-primary font-medium' : 'text-[hsl(25,30%,28%)]'}`}>
                                    {s.suvMax !== null ? s.suvMax : "No uptake"}
                                  </td>
                                </>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardContent className="py-12 text-center">
                <Scan className="h-8 w-8 text-[hsl(25,18%,55%)] mx-auto mb-3" />
                <p className="text-[hsl(25,18%,50%)] font-body">No scan results recorded yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide">Treatment Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { date: "22 April 2025", title: "Diagnosis", desc: "Stage IV melanoma identified. Three liver metastases found on PET/CT. BRAF wild-type. PD-L1 positive.", color: "bg-[hsl(34,55%,52%)]" },
                  { date: "April – July 2025", title: "Immunotherapy", desc: "4 cycles of ipilimumab + nivolumab (combination checkpoint inhibitor therapy). Achieved major partial metabolic response on interim PET/CT.", color: "bg-primary" },
                  { date: "July 2025", title: "Severe Toxicity", desc: "Grade 4 hepatitis (ALT ~750) and severe colitis. All immunotherapy ceased. High-dose corticosteroids initiated, followed by mycophenolate immunosuppression.", color: "bg-[hsl(0,50%,55%)]" },
                  { date: "5 August 2025", title: "Post-Treatment Scan", desc: "PET/CT shows major partial response. All three tumours smaller with reduced metabolic activity. Response confirmed even after treatment cessation.", color: "bg-primary" },
                  { date: "December 2025", title: "Immunosuppression Ceased", desc: "Approximately 5 months of mycophenolate completed. Liver function recovering. Immune system beginning to rebuild naturally.", color: "bg-[hsl(34,55%,52%)]" },
                  { date: "3 February 2026", title: "Latest Scan", desc: "Continued improvement off therapy. Tumour 2 now shows no metabolic activity (metabolically complete). Others continue shrinking with lower SUV. No new disease anywhere.", color: "bg-primary" },
                  { date: "May 2026", title: "Goal: NED", desc: "Target: No Evidence of Disease confirmation. PET/CT scheduled 15 May 2026.", color: "border-2 border-primary bg-white", isGoal: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`} />
                      {i < 6 && <div className="w-px h-full bg-[hsl(30,22%,85%)]" />}
                    </div>
                    <div className="pb-2">
                      <p className={`font-body font-medium ${(item as any).isGoal ? 'text-primary' : 'text-[hsl(25,30%,28%)]'}`}>{item.date} — {item.title}</p>
                      <p className="text-sm text-[hsl(25,18%,48%)] font-body mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardHeader>
                <CardTitle className="flex items-center font-heading text-[hsl(25,30%,28%)]">
                  <Shield className="h-5 w-5 mr-2 text-[hsl(34,55%,52%)]" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Status", value: user?.treatmentStatus || "—", color: "text-primary" },
                    { label: "Active Treatment", value: "None", color: "text-[hsl(25,30%,28%)]" },
                    { label: "Immunosuppression", value: "Ceased Dec 2025", color: "text-primary" },
                    { label: "Next Scan", value: user?.nextScanDate ? new Date(user.nextScanDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' }) : "—", color: "text-[hsl(34,55%,45%)]" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-[hsl(30,22%,87%)] last:border-0">
                      <span className="text-sm text-[hsl(25,18%,48%)] font-body">{item.label}</span>
                      <span className={`text-sm font-body font-medium ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardHeader>
                <CardTitle className="flex items-center font-heading text-[hsl(25,30%,28%)]">
                  <Heart className="h-5 w-5 mr-2 text-primary" />
                  Key Markers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Liver Function", value: "Recovering" },
                    { label: "Immune System", value: "Rebuilding" },
                    { label: "Tumour Response", value: "Improving" },
                    { label: "LDH Level", value: "Monitor" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-[hsl(30,22%,87%)] last:border-0">
                      <span className="text-sm text-[hsl(25,18%,48%)] font-body">{item.label}</span>
                      <span className="text-sm font-body font-medium text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {user?.adverseEventHistory && (
              <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
                <CardHeader>
                  <CardTitle className="font-heading text-[hsl(25,30%,28%)] flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[hsl(34,55%,52%)]" />
                    Adverse Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[hsl(25,18%,48%)] font-body leading-relaxed">{user.adverseEventHistory}</p>
                  <div className="mt-3 bg-[hsl(34,55%,52%)]/10 border border-[hsl(34,55%,52%)]/20 p-3 rounded-lg">
                    <p className="text-xs text-[hsl(25,30%,28%)] font-body">
                      <span className="font-medium">Note:</span> Prior severe toxicity means further immunotherapy is not recommended. Current strategy is active surveillance.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {user?.scanSummary && (
            <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
              <CardHeader>
                <CardTitle className="flex items-center font-heading text-[hsl(25,30%,28%)]">
                  <Scan className="h-5 w-5 mr-2 text-primary" />
                  Latest Scan Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body leading-relaxed">{user.scanSummary}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
