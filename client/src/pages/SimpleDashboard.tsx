import { useUser } from "@/contexts/UserContext";
import { useState } from "react";
import { MessageCircle, TrendingUp, Calendar, Heart, Sparkles, Activity, Apple, Leaf } from "lucide-react";
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
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[hsl(28,15%,58%)] font-body">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const quickLinks = [
    { href: "/nutrition", label: "Nutrition", icon: <Apple className="h-5 w-5" />, desc: "Meal plans & recipes" },
    { href: "/mind-body", label: "Mind & Body", icon: <Sparkles className="h-5 w-5" />, desc: "Meditation & breathing" },
    { href: "/movement", label: "Movement", icon: <Activity className="h-5 w-5" />, desc: "Exercise & activity" },
    { href: "/spiritual", label: "Wellbeing", icon: <Leaf className="h-5 w-5" />, desc: "Spiritual practices" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-gold/70 font-body text-sm tracking-widest uppercase mb-2">Your Healing Journey</p>
        <h1 className="text-3xl lg:text-4xl font-heading font-bold text-[hsl(30,28%,92%)] tracking-wide">
          Welcome back, {user?.displayName || 'Friend'}
        </h1>
        <p className="text-[hsl(28,15%,55%)] font-body mt-2">Continue nurturing your path to wellness</p>
        <div className="mt-4 h-px bg-gradient-to-r from-gold/40 via-primary/30 to-transparent" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-[hsl(25,16%,17%)] border-[hsl(25,10%,25%)] overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-gold tracking-wide flex items-center gap-2">
              <Heart className="h-5 w-5 text-gold/70" />
              Health Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-[hsl(25,10%,23%)]">
                <span className="text-[hsl(28,15%,58%)] font-body text-sm">Cancer Type</span>
                <span className="text-[hsl(30,25%,90%)] font-body font-medium">{user?.cancerType || "Not specified"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[hsl(25,10%,23%)]">
                <span className="text-[hsl(28,15%,58%)] font-body text-sm">Stage</span>
                <span className="text-[hsl(30,25%,90%)] font-body font-medium">{user?.cancerStage || "Not specified"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[hsl(28,15%,58%)] font-body text-sm">Diagnosis Date</span>
                <span className="text-[hsl(30,25%,90%)] font-body font-medium">{user?.diagnosis_date || "Not specified"}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary/15 border border-primary/30 p-3 rounded text-center">
                <p className="font-heading font-bold text-gold text-xl">3</p>
                <p className="text-xs text-[hsl(28,15%,58%)] font-body">Appointments</p>
              </div>
              <div className="bg-primary/15 border border-primary/30 p-3 rounded text-center">
                <p className="font-heading font-bold text-gold text-xl">7</p>
                <p className="text-xs text-[hsl(28,15%,58%)] font-body">Activities</p>
              </div>
              <div className="bg-primary/15 border border-primary/30 p-3 rounded text-center">
                <p className="font-heading font-bold text-gold text-xl">12</p>
                <p className="text-xs text-[hsl(28,15%,58%)] font-body">Meals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[hsl(25,16%,17%)] border-[hsl(25,10%,25%)]">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-gold tracking-wide flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-gold/70" />
              Health Assistant
            </CardTitle>
            <CardDescription className="text-[hsl(28,15%,55%)] font-body">
              Get personalized guidance for your healing journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-[hsl(28,15%,58%)] font-body">
                Ask me about nutrition, supplements, mind-body practices, and emotional wellbeing.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs border-[hsl(25,10%,29%)] text-[hsl(28,18%,65%)] hover:bg-primary/10 hover:text-gold hover:border-gold/30 font-body">
                  Nutrition Tips
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-[hsl(25,10%,29%)] text-[hsl(28,18%,65%)] hover:bg-primary/10 hover:text-gold hover:border-gold/30 font-body">
                  Stress Relief
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-[hsl(25,10%,29%)] text-[hsl(28,18%,65%)] hover:bg-primary/10 hover:text-gold hover:border-gold/30 font-body">
                  Exercise Ideas
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-[hsl(25,10%,29%)] text-[hsl(28,18%,65%)] hover:bg-primary/10 hover:text-gold hover:border-gold/30 font-body">
                  Supplements
                </Button>
              </div>
              <Button 
                className="w-full bg-gold text-[hsl(25,20%,13%)] hover:bg-gold/90 font-heading tracking-wide glow-gold" 
                onClick={() => window.location.href = '/ai-assistant'}
              >
                Start Conversation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-[hsl(25,16%,17%)] border-[hsl(25,10%,25%)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-heading text-[hsl(30,25%,90%)]">
              <TrendingUp className="h-5 w-5 text-gold/70" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-body">
                <span className="text-[hsl(28,15%,58%)]">Weekly Goals</span>
                <span className="font-medium text-gold">4/7</span>
              </div>
              <div className="w-full bg-[hsl(25,10%,23%)] rounded-full h-2">
                <div className="bg-gradient-to-r from-primary to-gold h-2 rounded-full" style={{ width: '57%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[hsl(25,16%,17%)] border-[hsl(25,10%,25%)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-heading text-[hsl(30,25%,90%)]">
              <Calendar className="h-5 w-5 text-gold/70" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-body">
              <p className="font-medium text-[hsl(30,25%,90%)]">Oncology Checkup</p>
              <p className="text-sm text-[hsl(28,15%,58%)]">Dr. Sarah Thompson</p>
              <p className="text-sm text-gold/80">May 22, 2025 at 9:30 AM</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[hsl(25,16%,17%)] border-[hsl(25,10%,25%)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-heading text-[hsl(30,25%,90%)]">
              <Heart className="h-5 w-5 text-gold/70" />
              Wellness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-heading font-bold text-gold">85%</div>
              <p className="text-sm text-[hsl(28,15%,58%)] font-body mt-1">Keep up the great work!</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-heading text-gold tracking-wide mb-4">Explore Your Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="bg-[hsl(25,16%,17%)] border-[hsl(25,10%,25%)] hover:border-gold/30 hover:bg-[hsl(25,14%,19%)] transition-all duration-300 cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
                    <span className="text-gold">{link.icon}</span>
                  </div>
                  <h3 className="font-heading text-sm text-[hsl(30,25%,90%)] group-hover:text-gold transition-colors">{link.label}</h3>
                  <p className="text-xs text-[hsl(28,15%,55%)] font-body mt-1">{link.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      
      <Card className="bg-[hsl(25,16%,17%)] border-[hsl(25,10%,25%)]">
        <CardHeader>
          <CardTitle className="font-heading text-gold tracking-wide">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[hsl(25,10%,23%)] pb-3">
              <div>
                <p className="font-body font-medium text-[hsl(30,25%,90%)]">Oncology Appointment</p>
                <p className="text-sm text-[hsl(28,15%,58%)] font-body">Dr. Sarah Thompson</p>
              </div>
              <div className="text-right">
                <p className="font-body font-medium text-gold/80">May 22, 2025</p>
                <p className="text-sm text-[hsl(28,15%,58%)] font-body">9:30 AM</p>
              </div>
            </div>
            <div className="flex items-center justify-between pb-3">
              <div>
                <p className="font-body font-medium text-[hsl(30,25%,90%)]">Nutrition Consultation</p>
                <p className="text-sm text-[hsl(28,15%,58%)] font-body">Maria Rodriguez, RD</p>
              </div>
              <div className="text-right">
                <p className="font-body font-medium text-gold/80">May 25, 2025</p>
                <p className="text-sm text-[hsl(28,15%,58%)] font-body">2:00 PM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}