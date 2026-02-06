import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, BookOpen, Pencil, Sparkles } from "lucide-react";

export default function SpiritualWellbeing() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Spiritual & Psychological Wellbeing"
        description="Nurturing inner strength, purpose, and emotional resilience"
      />

      <Card className="bg-primary/10 border-primary/20 mb-6">
        <CardContent className="p-4">
          <p className="text-sm text-[hsl(25,30%,28%)] font-body">
            <span className="font-medium">Radical Remission research shows:</span> Having strong reasons for living, following your own intuition, and deepening your spiritual connection are among the most common factors in remarkable recoveries.
          </p>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="reflection">
        <TabsList className="mb-6 bg-[hsl(30,30%,95%)] border border-[hsl(30,25%,87%)]">
          <TabsTrigger value="reflection" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Heart className="h-4 w-4 mr-2" /> Healing Practices
          </TabsTrigger>
          <TabsTrigger value="purpose" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Sparkles className="h-4 w-4 mr-2" /> Reasons to Live
          </TabsTrigger>
          <TabsTrigger value="journal" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Pencil className="h-4 w-4 mr-2" /> Journaling
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reflection">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {title: "Gratitude Practice", desc: "List three things you're grateful for today. Include something about your body's healing capacity."},
              {title: "Self-Compassion", desc: "You've been through so much — grade 4 toxicity, months of recovery. Honour your strength and resilience."},
              {title: "Forgiveness & Release", desc: "Release anger, resentment, or fear that may be held in your body. Radical Remission identifies this as key."},
              {title: "Deepening Intuition", desc: "Listen to your body's wisdom. What is it telling you about your path to healing?"},
              {title: "Social Connection", desc: "Strong social support is linked to better cancer outcomes. Nurture your relationships."},
              {title: "Taking Control", desc: "Identify areas of your health you can control — diet, supplements, movement, mindset."}
            ].map((practice, index) => (
              <Card key={index} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="font-heading text-[hsl(25,30%,28%)]">{practice.title}</CardTitle>
                  <CardDescription className="text-[hsl(25,18%,50%)] font-body">{practice.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-primary/15 border border-primary/25 text-primary hover:bg-primary/25 font-body">Start Practice</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="purpose">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-[hsl(34,55%,45%)]">Strong Reasons for Living</CardTitle>
              <CardDescription className="text-[hsl(25,18%,50%)] font-body">
                Research shows that people with a clear sense of purpose and strong reasons for living have significantly better health outcomes. This is one of the nine key factors in Radical Remission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-heading text-sm text-primary">Reflection Prompts</h3>
                    <div className="space-y-3 text-sm text-[hsl(25,18%,48%)] font-body">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <p>What brings me the most joy in life?</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <p>Who depends on me and needs me present?</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <p>What would I regret not doing or experiencing?</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <p>What legacy do I want to create?</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <p>What future milestones do I want to be there for?</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-heading text-sm text-[hsl(34,55%,45%)]">Your NED Goal: May 2026</h3>
                    <p className="text-sm text-[hsl(25,18%,48%)] font-body">
                      You have a powerful and specific goal: achieving No Evidence of Disease by your May 2026 scan. Your body is already showing remarkable progress — one lesion metabolically complete, no new disease.
                    </p>
                    <p className="text-sm text-[hsl(25,18%,48%)] font-body">
                      Visualise reaching that milestone. Feel the relief, the joy, the gratitude. Your immune system responded beautifully to treatment, and it continues to work even now.
                    </p>
                    <p className="text-sm text-primary font-body font-medium italic">
                      Every day you nourish your body, calm your mind, and move with intention, you are supporting your immune system's ongoing work.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="journal">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-[hsl(34,55%,45%)]">Healing Journal</CardTitle>
              <CardDescription className="text-[hsl(25,18%,50%)] font-body">
                A private space to document your healing journey, track how you're feeling, and process emotions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-[hsl(30,30%,95%)] border border-[hsl(30,25%,87%)] rounded-lg p-4">
                  <h3 className="font-heading text-sm text-primary mb-3">Today's Prompt</h3>
                  <p className="text-sm text-[hsl(25,18%,48%)] font-body italic">
                    "What is one thing my body did today that I'm grateful for? How did I support my healing today?"
                  </p>
                </div>
                <p className="text-sm text-[hsl(25,18%,50%)] font-body text-center py-4">
                  Journal entries will be saved privately and securely.
                </p>
                <Button className="mx-auto block bg-primary text-white hover:bg-primary/90 font-heading">Start Writing</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
