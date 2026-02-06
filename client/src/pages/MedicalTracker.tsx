import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Clock, Calendar, Activity, Shield, Scan, Heart } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function MedicalTracker() {
  const { user } = useUser();
  
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Medical Tracker"
        description="Your treatment history, scan results, and health milestones"
      />

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
          <CardHeader>
            <CardTitle className="flex items-center font-heading text-[hsl(25,30%,28%)]">
              <Scan className="h-5 w-5 mr-2 text-primary" />
              Latest Scan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user?.scanSummary ? (
              <div className="space-y-3">
                <p className="text-sm text-[hsl(25,18%,48%)] font-body leading-relaxed">{user.scanSummary}</p>
                <div className="bg-primary/10 border border-primary/20 p-2 rounded">
                  <p className="text-xs text-primary font-body font-medium">Overall: Continued improvement off therapy</p>
                </div>
              </div>
            ) : (
              <p className="text-[hsl(25,18%,50%)] text-center py-6 font-body text-sm">No scan results recorded yet</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
          <CardHeader>
            <CardTitle className="flex items-center font-heading text-[hsl(25,30%,28%)]">
              <Shield className="h-5 w-5 mr-2 text-[hsl(34,55%,52%)]" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1.5 border-b border-[hsl(30,22%,87%)]">
                <span className="text-sm text-[hsl(25,18%,48%)] font-body">Status</span>
                <span className="text-sm font-body font-medium text-primary">{user?.treatmentStatus || "—"}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[hsl(30,22%,87%)]">
                <span className="text-sm text-[hsl(25,18%,48%)] font-body">Active Treatment</span>
                <span className="text-sm font-body font-medium text-[hsl(25,30%,28%)]">None</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[hsl(30,22%,87%)]">
                <span className="text-sm text-[hsl(25,18%,48%)] font-body">Immunosuppression</span>
                <span className="text-sm font-body font-medium text-primary">Ceased Dec 2025</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-[hsl(25,18%,48%)] font-body">Next Scan</span>
                <span className="text-sm font-body font-medium text-[hsl(34,55%,45%)]">
                  {user?.nextScanDate ? new Date(user.nextScanDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                </span>
              </div>
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
              <div className="flex justify-between items-center py-1.5 border-b border-[hsl(30,22%,87%)]">
                <span className="text-sm text-[hsl(25,18%,48%)] font-body">Liver Function</span>
                <span className="text-sm font-body font-medium text-primary">Recovering</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[hsl(30,22%,87%)]">
                <span className="text-sm text-[hsl(25,18%,48%)] font-body">Immune System</span>
                <span className="text-sm font-body font-medium text-primary">Rebuilding</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[hsl(30,22%,87%)]">
                <span className="text-sm text-[hsl(25,18%,48%)] font-body">Tumour Response</span>
                <span className="text-sm font-body font-medium text-primary">Improving</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-[hsl(25,18%,48%)] font-body">LDH Level</span>
                <span className="text-sm font-body font-medium text-[hsl(25,30%,28%)]">Monitor</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide">Treatment Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[hsl(34,55%,52%)]" />
                <div className="w-px h-full bg-[hsl(30,22%,85%)]" />
              </div>
              <div className="pb-6">
                <p className="font-body font-medium text-[hsl(25,30%,28%)]">April 2025 — Diagnosis</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body mt-1">Stage IV melanoma identified. Three liver metastases found on imaging. BRAF wild-type. PD-L1 positive.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="w-px h-full bg-[hsl(30,22%,85%)]" />
              </div>
              <div className="pb-6">
                <p className="font-body font-medium text-[hsl(25,30%,28%)]">April – July 2025 — Immunotherapy</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body mt-1">4 cycles of ipilimumab + nivolumab (combination checkpoint inhibitor therapy). Achieved major partial metabolic response on interim PET/CT.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[hsl(0,50%,55%)]" />
                <div className="w-px h-full bg-[hsl(30,22%,85%)]" />
              </div>
              <div className="pb-6">
                <p className="font-body font-medium text-[hsl(25,30%,28%)]">July 2025 — Severe Toxicity</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body mt-1">Grade 4 hepatitis (ALT ~750) and severe colitis. All immunotherapy ceased. High-dose corticosteroids initiated, followed by mycophenolate immunosuppression.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-[hsl(34,55%,52%)]" />
                <div className="w-px h-full bg-[hsl(30,22%,85%)]" />
              </div>
              <div className="pb-6">
                <p className="font-body font-medium text-[hsl(25,30%,28%)]">December 2025 — Immunosuppression Ceased</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body mt-1">Approximately 5 months of mycophenolate completed. Liver function recovering. Immune system beginning to rebuild naturally.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="w-px h-full bg-[hsl(30,22%,85%)]" />
              </div>
              <div className="pb-6">
                <p className="font-body font-medium text-[hsl(25,30%,28%)]">February 2026 — Latest Scan</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body mt-1">Continued improvement off therapy. One lesion metabolically complete (no uptake). Others show lower SUV, necrotic/calcified. No new disease anywhere — brain, lungs, bones, nodes all clear.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full border-2 border-primary bg-white" />
              </div>
              <div>
                <p className="font-body font-medium text-primary">May 2026 — Goal: NED</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body mt-1">Target: No Evidence of Disease confirmation. PET/CT scheduled May 15, 2026.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {user?.adverseEventHistory && (
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
          <CardHeader>
            <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Adverse Event History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[hsl(25,18%,48%)] font-body leading-relaxed">{user.adverseEventHistory}</p>
            <div className="mt-4 bg-[hsl(34,55%,52%)]/10 border border-[hsl(34,55%,52%)]/20 p-3 rounded-lg">
              <p className="text-xs text-[hsl(25,30%,28%)] font-body">
                <span className="font-medium">Note:</span> Prior severe toxicity means additional immunotherapy is not recommended. Current strategy is active surveillance, with the expectation that the initial treatment's immune response continues working.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
