import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, BookOpen, Pencil } from "lucide-react";

export default function SpiritualWellbeing() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Spiritual & Psychological Wellbeing"
        description="Reflective practices and purpose discovery tools"
      />
      
      <Tabs defaultValue="reflection">
        <TabsList className="mb-6 bg-[hsl(25,14%,19%)] border border-[hsl(25,10%,25%)]">
          <TabsTrigger value="reflection" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <Heart className="h-4 w-4 mr-2" /> Reflective Practices
          </TabsTrigger>
          <TabsTrigger value="purpose" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <BookOpen className="h-4 w-4 mr-2" /> Purpose Discovery
          </TabsTrigger>
          <TabsTrigger value="journal" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <Pencil className="h-4 w-4 mr-2" /> Journaling
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reflection">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {title: "Gratitude Practice", desc: "Cultivate thankfulness even during difficult times"},
              {title: "Values Exploration", desc: "Identify what matters most to you"},
              {title: "Life Review", desc: "Reflect on meaningful moments and achievements"},
              {title: "Self-Compassion", desc: "Develop kindness toward yourself during healing"},
              {title: "Meaning Making", desc: "Find purpose in your cancer experience"},
              {title: "Legacy Building", desc: "Consider how you wish to impact others"}
            ].map((practice, index) => (
              <Card key={index} className="bg-[hsl(25,16%,17%)] border-[hsl(25,10%,25%)] hover:border-gold/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="font-heading text-[hsl(30,25%,90%)]">{practice.title}</CardTitle>
                  <CardDescription className="text-[hsl(28,15%,55%)] font-body">{practice.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-primary/30 border border-primary/40 text-gold hover:bg-primary/40 font-body">Start Practice</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="purpose">
          <Card className="bg-[hsl(25,16%,17%)] border-[hsl(25,10%,25%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold">Purpose Discovery</CardTitle>
              <CardDescription className="text-[hsl(28,15%,55%)] font-body">
                Tools to help you identify and pursue what gives your life meaning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(28,15%,50%)] text-center py-12 font-body">
                Purpose discovery exercises are coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="journal">
          <Card className="bg-[hsl(25,16%,17%)] border-[hsl(25,10%,25%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold">Healing Journal</CardTitle>
              <CardDescription className="text-[hsl(28,15%,55%)] font-body">
                A private space to document your healing journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(28,15%,50%)] text-center py-12 font-body">
                Journal feature coming soon
              </p>
              <Button className="mx-auto block bg-gold text-[hsl(25,20%,13%)] hover:bg-gold/90 font-heading">Create Journal</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}