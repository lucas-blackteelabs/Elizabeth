import { useUser } from "@/contexts/UserContext";
import { MessageCircle, TrendingUp, Calendar, Heart, Sparkles, Activity, Apple, Leaf, Shield, Target, Clock, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function SimpleDashboard() {
  const { user } = useUser();
  
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
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-[hsl(34,55%,52%)] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-body font-medium text-[hsl(25,30%,28%)]">April 2025 — Diagnosis</p>
                  <p className="text-sm text-[hsl(25,18%,48%)] font-body">Stage IV melanoma with liver metastases. Three liver tumours identified.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-body font-medium text-[hsl(25,30%,28%)]">April–July 2025 — Immunotherapy</p>
                  <p className="text-sm text-[hsl(25,18%,48%)] font-body">4 cycles of ipilimumab + nivolumab. Major partial metabolic response achieved.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-[hsl(0,50%,55%)] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-body font-medium text-[hsl(25,30%,28%)]">July 2025 — Treatment Stopped</p>
                  <p className="text-sm text-[hsl(25,18%,48%)] font-body">Immunotherapy ceased due to severe toxicity (Grade 4 hepatitis, colitis). Started immunosuppression.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-[hsl(34,55%,52%)] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-body font-medium text-[hsl(25,30%,28%)]">December 2025 — Immunosuppression Ceased</p>
                  <p className="text-sm text-[hsl(25,18%,48%)] font-body">Approximately 5 months of mycophenolate completed. Immune system now recovering.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-body font-medium text-[hsl(25,30%,28%)]">February 2026 — Continued Improvement</p>
                  <p className="text-sm text-[hsl(25,18%,48%)] font-body">Latest scan shows continued improvement. One lesion metabolically complete. No new disease anywhere.</p>
                </div>
              </div>
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
            <div className="flex items-center justify-between border-b border-[hsl(30,22%,87%)] pb-3">
              <div>
                <p className="font-body font-medium text-[hsl(25,30%,28%)]">Nutrition Consultation</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body">Integrative Dietitian</p>
              </div>
              <div className="text-right">
                <p className="font-body font-medium text-primary">March 10, 2026</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body">2:00 PM</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-[hsl(30,22%,87%)] pb-3">
              <div>
                <p className="font-body font-medium text-[hsl(25,30%,28%)]">PET/CT Scan</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body">Radiology Department</p>
              </div>
              <div className="text-right">
                <p className="font-body font-medium text-[hsl(34,55%,45%)]">May 15, 2026</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body">9:00 AM</p>
              </div>
            </div>
            <div className="flex items-center justify-between pb-3">
              <div>
                <p className="font-body font-medium text-[hsl(25,30%,28%)]">Oncology Review</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body">Melanoma Oncology Team</p>
              </div>
              <div className="text-right">
                <p className="font-body font-medium text-[hsl(34,55%,45%)]">May 22, 2026</p>
                <p className="text-sm text-[hsl(25,18%,48%)] font-body">10:30 AM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
