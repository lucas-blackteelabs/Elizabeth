import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bath, Wind, Moon, BarChart, Sparkles, Heart } from "lucide-react";

export default function MindBody() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Mind & Body Tools"
        description="Meditation, breathing, and stress-reduction for healing and scan preparation"
      />

      <Card className="bg-primary/10 border-primary/20 mb-6">
        <CardContent className="p-4">
          <p className="text-sm text-foreground font-body">
            <span className="font-medium">Research shows:</span> Mind-body practices can reduce cortisol, support immune function, and help manage scanxiety. Even 10 minutes daily makes a measurable difference in wellbeing and immune markers.
          </p>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="meditation">
        <TabsList className="mb-6 bg-muted border border-border">
          <TabsTrigger value="meditation" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Bath className="h-4 w-4 mr-2" /> Meditation
          </TabsTrigger>
          <TabsTrigger value="breathing" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Wind className="h-4 w-4 mr-2" /> Breathing
          </TabsTrigger>
          <TabsTrigger value="sleep" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Moon className="h-4 w-4 mr-2" /> Sleep
          </TabsTrigger>
          <TabsTrigger value="scanxiety" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Heart className="h-4 w-4 mr-2" /> Scanxiety
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="meditation">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {title: "Healing Visualisation", desc: "Visualise your immune system actively clearing remaining cancer cells. Picture healthy liver cells regenerating.", time: "10 min"},
              {title: "Body Scan for Healing", desc: "A gentle scan through your body, sending love and healing to your liver and immune system.", time: "15 min"},
              {title: "Loving-Kindness", desc: "Direct compassion toward yourself and your body for all it has been through and overcome.", time: "10 min"},
              {title: "Gratitude for Recovery", desc: "Focus on gratitude for your body's remarkable response to treatment and its capacity to heal.", time: "8 min"},
              {title: "Immune System Meditation", desc: "Visualise your T-cells patrolling and protecting. Strengthen the connection between mind and immune function.", time: "12 min"},
              {title: "Calm Before Scans", desc: "A grounding meditation specifically designed for the days leading up to surveillance scans.", time: "10 min"}
            ].map((practice, index) => (
              <Card key={index} className="bg-white border-border overflow-hidden hover:border-primary/30 transition-all duration-300">
                <div className="w-full h-28 bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary/25" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-heading text-sm text-foreground mb-1">{practice.title}</h3>
                  <p className="text-sm text-muted-foreground font-body mb-2">{practice.desc}</p>
                  <p className="text-xs text-primary font-body mb-3">{practice.time}</p>
                  <Button className="w-full bg-primary/15 border border-primary/25 text-primary hover:bg-primary/25 font-body">
                    Begin Practice
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="breathing">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-border">
              <CardHeader>
                <CardTitle className="font-heading text-accent">4-7-8 Calming Breath</CardTitle>
                <CardDescription className="text-muted-foreground font-body">Activates the parasympathetic nervous system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground font-body">
                <p>1. Breathe in through your nose for <span className="font-medium text-primary">4 counts</span></p>
                <p>2. Hold your breath for <span className="font-medium text-primary">7 counts</span></p>
                <p>3. Exhale slowly through your mouth for <span className="font-medium text-primary">8 counts</span></p>
                <p>4. Repeat 4 cycles</p>
                <p className="text-xs italic text-muted-foreground">Especially helpful before bed or when anxiety rises</p>
              </CardContent>
            </Card>
            <Card className="bg-white border-border">
              <CardHeader>
                <CardTitle className="font-heading text-accent">Box Breathing</CardTitle>
                <CardDescription className="text-muted-foreground font-body">Used by special forces for calm under pressure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground font-body">
                <p>1. Breathe in for <span className="font-medium text-primary">4 counts</span></p>
                <p>2. Hold for <span className="font-medium text-primary">4 counts</span></p>
                <p>3. Breathe out for <span className="font-medium text-primary">4 counts</span></p>
                <p>4. Hold for <span className="font-medium text-primary">4 counts</span></p>
                <p className="text-xs italic text-muted-foreground">Great for scan days or waiting for results</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sleep">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white border-border">
              <CardHeader>
                <CardTitle className="font-heading text-accent">Sleep Hygiene for Healing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground font-body">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <p>Keep a consistent sleep schedule — your immune system repairs during deep sleep</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <p>Dim lights 1-2 hours before bed to support melatonin production</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <p>Avoid screens before bed — or use blue light filters</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <p>Cool bedroom (18-20°C) supports deeper, more restorative sleep</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <p>Consider magnesium glycinate before bed for relaxation</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-border">
              <CardHeader>
                <CardTitle className="font-heading text-accent">When Sleep Eludes You</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground font-body">
                <p>It's normal for sleep to be disrupted during surveillance. Your mind may race with worry, especially around scan time.</p>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <p>Try the 4-7-8 breathing technique in bed</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <p>Write worries in a journal — get them out of your head</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <p>Progressive muscle relaxation from toes to head</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <p>If awake for 20+ minutes, get up and do something calming</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="scanxiety">
          <Card className="bg-white border-border">
            <CardHeader>
              <CardTitle className="font-heading text-accent">Managing Scanxiety</CardTitle>
              <CardDescription className="text-muted-foreground font-body">
                Scan anxiety is one of the most common challenges during surveillance. Here are evidence-based strategies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-heading text-sm text-primary">Before the Scan</h3>
                  <div className="space-y-2 text-sm text-muted-foreground font-body">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <p>Acknowledge the anxiety — it's completely normal and valid</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <p>Limit "Dr Google" — research shows it increases anxiety</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <p>Plan something enjoyable for scan day afternoon</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <p>Bring a support person and comfort items</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-heading text-sm text-accent">While Waiting for Results</h3>
                  <div className="space-y-2 text-sm text-muted-foreground font-body">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      <p>Remember: your last scan showed continued improvement</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      <p>Stay busy with activities that bring you joy</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      <p>Use breathing exercises when worry thoughts arise</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      <p>Talk to your support network — you don't have to wait alone</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
