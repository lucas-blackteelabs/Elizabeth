import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, PersonStanding, Heart, Leaf } from "lucide-react";

export default function Movement() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Movement & Exercise"
        description="Gentle, immune-boosting movement for your recovery phase"
      />

      <Card className="bg-primary/10 border-primary/20 mb-6">
        <CardContent className="p-4">
          <p className="text-sm text-foreground font-body">
            <span className="font-medium">For your phase:</span> During active surveillance after immunotherapy, moderate exercise supports immune function, reduces fatigue, and improves mood. Start gently and build gradually — your body is still recovering from treatment and immunosuppression.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white border-border">
          <CardHeader>
            <CardTitle className="font-heading text-accent flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Why Movement Matters Now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground font-body">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <p>Regular moderate exercise enhances natural killer cell activity — your immune system's anti-cancer fighters</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <p>Reduces inflammation markers that can promote cancer growth</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <p>Supports liver recovery through improved blood flow and detoxification</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <p>Reduces anxiety and depression — particularly helpful during surveillance</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <p>Improves sleep quality, which is essential for immune function</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-border">
          <CardHeader>
            <CardTitle className="font-heading text-accent flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              Guidelines for You
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground font-body">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <p>Aim for 150 minutes of moderate activity per week (build up gradually)</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <p>Listen to your body — fatigue post-immunotherapy is normal and varies day to day</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <p>Outdoor exercise in nature adds extra stress-reduction benefits</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <p>Wear sun protection — melanoma patients need to be extra careful with UV exposure</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <p>Rest days are just as important as active days for recovery</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-lg font-heading text-accent tracking-wide mb-4">Recommended Activities</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {title: "Nature Walking", desc: "Gentle walking in nature reduces cortisol and boosts immune function. Start with 20 minutes.", level: "Gentle", benefit: "Immune & mood"},
          {title: "Gentle Yoga", desc: "Restorative yoga poses to reduce stress, improve flexibility, and support liver recovery.", level: "Gentle", benefit: "Stress & flexibility"},
          {title: "Swimming", desc: "Low-impact full-body exercise that's easy on joints while building cardiovascular fitness.", level: "Moderate", benefit: "Cardio & strength"},
          {title: "Tai Chi / Qigong", desc: "Ancient practices that combine gentle movement with meditation. Shown to boost immune markers.", level: "Gentle", benefit: "Immune & balance"},
          {title: "Light Resistance", desc: "Resistance bands or light weights to maintain muscle mass and bone density during recovery.", level: "Moderate", benefit: "Strength & bones"},
          {title: "Stretching & Breathwork", desc: "Combine gentle stretches with deep breathing for relaxation and improved circulation.", level: "Gentle", benefit: "Relaxation"}
        ].map((exercise, index) => (
          <Card key={index} className="bg-white border-border overflow-hidden hover:border-primary/30 transition-all duration-300">
            <div className="w-full h-28 bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
              <PersonStanding className="h-10 w-10 text-primary/25" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-heading text-sm text-foreground mb-1">{exercise.title}</h3>
              <p className="text-sm text-muted-foreground font-body mb-3">{exercise.desc}</p>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-body font-medium px-2 py-1 rounded border ${
                  exercise.level === "Gentle" 
                    ? "bg-primary/15 text-primary border-primary/25" 
                    : "bg-accent/10 text-accent border-accent/20"
                }`}>
                  {exercise.level}
                </span>
                <span className="text-xs text-muted-foreground font-body">{exercise.benefit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
