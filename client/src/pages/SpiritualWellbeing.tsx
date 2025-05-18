import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, BookOpen, Pencil } from "lucide-react";

// Placeholder component for Spiritual Wellbeing page
export default function SpiritualWellbeing() {
  return (
    <div className="p-6">
      <Heading 
        title="Spiritual & Psychological Wellbeing"
        description="Reflective practices and purpose discovery tools"
      />
      
      <Tabs defaultValue="reflection">
        <TabsList className="mb-6">
          <TabsTrigger value="reflection">
            <Heart className="h-4 w-4 mr-2" /> Reflective Practices
          </TabsTrigger>
          <TabsTrigger value="purpose">
            <BookOpen className="h-4 w-4 mr-2" /> Purpose Discovery
          </TabsTrigger>
          <TabsTrigger value="journal">
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
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{practice.title}</CardTitle>
                  <CardDescription>{practice.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Start Practice</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="purpose">
          <Card>
            <CardHeader>
              <CardTitle>Purpose Discovery</CardTitle>
              <CardDescription>
                Tools to help you identify and pursue what gives your life meaning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                Purpose discovery exercises are coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="journal">
          <Card>
            <CardHeader>
              <CardTitle>Healing Journal</CardTitle>
              <CardDescription>
                A private space to document your healing journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                Journal feature coming soon
              </p>
              <Button className="mx-auto block">Create Journal</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
