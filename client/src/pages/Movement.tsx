import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Activity } from "lucide-react";

// Placeholder component for Movement page
export default function Movement() {
  return (
    <div className="p-6">
      <Heading 
        title="Movement & Exercise"
        description="Customized exercise plans for different treatment stages"
      />
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Your Activity This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Activity tracking will appear here</p>
          </div>
        </CardContent>
      </Card>
      
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommended Exercises</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {["Gentle Yoga", "Seated Stretches", "Walking Program", "Chair Exercises", "Tai Chi Basics", "Resistance Band"].map((title, index) => (
          <Card key={index} className="overflow-hidden">
            <img 
              src={`https://images.unsplash.com/photo-${1544367567 + index}-0f2fcb009e0b?auto=format&fit=crop&w=600&h=300`} 
              alt="Exercise demonstration" 
              className="w-full h-40 object-cover"
            />
            <CardContent className="p-4">
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-gray-600 mb-3">
                Low-impact exercise appropriate during treatment
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {index % 3 === 0 ? "Beginner" : index % 3 === 1 ? "Intermediate" : "All Levels"}
                </span>
                <Button variant="ghost" size="sm" className="flex items-center">
                  <Play className="h-4 w-4 mr-2" />
                  Watch
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
