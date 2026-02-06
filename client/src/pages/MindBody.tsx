import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Bath, Wind, Moon, BarChart, Sparkles } from "lucide-react";

export default function MindBody() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Mind & Body Tools"
        description="Meditation, breathing exercises, and stress-reduction techniques"
      />
      
      <Tabs defaultValue="meditation">
        <TabsList className="mb-6 bg-[hsl(30,8%,13%)] border border-[hsl(30,8%,20%)]">
          <TabsTrigger value="meditation" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <Bath className="h-4 w-4 mr-2" /> Meditation
          </TabsTrigger>
          <TabsTrigger value="breathing" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <Wind className="h-4 w-4 mr-2" /> Breathing
          </TabsTrigger>
          <TabsTrigger value="sleep" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <Moon className="h-4 w-4 mr-2" /> Sleep
          </TabsTrigger>
          <TabsTrigger value="emotions" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <BarChart className="h-4 w-4 mr-2" /> Emotions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="meditation">
          <div className="mb-4">
            <h2 className="text-lg font-heading text-[hsl(40,20%,88%)]">Guided Meditations</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {["Healing Visualization", "Body Scan", "Loving-Kindness", "Gratitude Practice", "Pain Relief", "Anxiety Reduction"].map((title, index) => (
              <Card key={index} className="bg-[hsl(30,10%,11%)] border-[hsl(30,8%,20%)] overflow-hidden hover:border-gold/20 transition-all duration-300">
                <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-[hsl(30,8%,15%)] flex items-center justify-center">
                  <Sparkles className="h-12 w-12 text-gold/30" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-heading text-sm text-[hsl(40,20%,88%)] mb-1">{title}</h3>
                  <p className="text-sm text-[hsl(35,10%,50%)] font-body mb-3">
                    {index % 2 === 0 ? "10 minutes" : "15 minutes"}
                  </p>
                  <Button className="w-full bg-primary/30 border border-primary/40 text-gold hover:bg-primary/40 font-body">
                    <Play className="h-4 w-4 mr-2" />
                    Begin Practice
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="breathing">
          <Card className="bg-[hsl(30,10%,11%)] border-[hsl(30,8%,20%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold">Breathing Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(35,10%,45%)] text-center py-12 font-body">
                Breathing exercises will be available soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sleep">
          <Card className="bg-[hsl(30,10%,11%)] border-[hsl(30,8%,20%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold">Sleep Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(35,10%,45%)] text-center py-12 font-body">
                Sleep tracking and resources will be available soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="emotions">
          <Card className="bg-[hsl(30,10%,11%)] border-[hsl(30,8%,20%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold">Emotion Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(35,10%,45%)] text-center py-12 font-body">
                Emotion tracking will be available soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}