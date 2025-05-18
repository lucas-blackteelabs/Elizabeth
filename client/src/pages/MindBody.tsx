import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Bath, Wind, Moon, BarChart } from "lucide-react";

// Placeholder component for Mind & Body page
export default function MindBody() {
  return (
    <div className="p-6">
      <Heading 
        title="Mind & Body Tools"
        description="Meditation, breathing exercises, and stress-reduction techniques"
      />
      
      <Tabs defaultValue="meditation">
        <TabsList className="mb-6">
          <TabsTrigger value="meditation">
            <Bath className="h-4 w-4 mr-2" /> Meditation
          </TabsTrigger>
          <TabsTrigger value="breathing">
            <Wind className="h-4 w-4 mr-2" /> Breathing
          </TabsTrigger>
          <TabsTrigger value="sleep">
            <Moon className="h-4 w-4 mr-2" /> Sleep
          </TabsTrigger>
          <TabsTrigger value="emotions">
            <BarChart className="h-4 w-4 mr-2" /> Emotion Tracking
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="meditation">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Guided Meditations</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {["Healing Visualization", "Body Scan", "Loving-Kindness", "Gratitude Practice", "Pain Relief", "Anxiety Reduction"].map((title, index) => (
              <Card key={index} className="overflow-hidden">
                <img 
                  src={`https://images.unsplash.com/photo-${1506126613408 + index}-eca07ce68773?auto=format&fit=crop&w=600&h=300`} 
                  alt="Meditation scene" 
                  className="w-full h-40 object-cover"
                />
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {index % 2 === 0 ? "10 minutes" : "15 minutes"}
                  </p>
                  <Button className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Begin Practice
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="breathing">
          <Card>
            <CardHeader>
              <CardTitle>Breathing Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                Breathing exercises will be available soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sleep">
          <Card>
            <CardHeader>
              <CardTitle>Sleep Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                Sleep tracking and resources will be available soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="emotions">
          <Card>
            <CardHeader>
              <CardTitle>Emotion Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                Emotion tracking will be available soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
