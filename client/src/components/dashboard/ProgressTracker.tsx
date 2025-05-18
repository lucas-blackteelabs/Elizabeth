import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type TimeRange = "week" | "month" | "year";

interface ProgressItemProps {
  label: string;
  value: number;
  color: string;
}

function ProgressItem({ label, value, color }: ProgressItemProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between mb-1 text-sm">
        <span className="font-medium">{label}</span>
        <span className={color}>{value}%</span>
      </div>
      <Progress value={value} className={`h-2.5 ${color.includes('primary') ? 'bg-primary/20' : ''}`} />
    </div>
  );
}

export default function ProgressTracker() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Your Progress</CardTitle>
          <div className="flex space-x-2 text-sm">
            <Button 
              variant={timeRange === "week" ? "secondary" : "ghost"} 
              onClick={() => setTimeRange("week")}
              className="px-3 py-1 h-auto"
            >
              Week
            </Button>
            <Button 
              variant={timeRange === "month" ? "secondary" : "ghost"} 
              onClick={() => setTimeRange("month")}
              className="px-3 py-1 h-auto"
            >
              Month
            </Button>
            <Button 
              variant={timeRange === "year" ? "secondary" : "ghost"} 
              onClick={() => setTimeRange("year")}
              className="px-3 py-1 h-auto"
            >
              Year
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ProgressItem 
            label="Energy Levels" 
            value={68} 
            color="text-primary"
          />
          
          <ProgressItem 
            label="Nutrition Goals" 
            value={82} 
            color="text-green-600"
          />
          
          <ProgressItem 
            label="Stress Management" 
            value={45} 
            color="text-amber-600"
          />
          
          <ProgressItem 
            label="Sleep Quality" 
            value={60} 
            color="text-indigo-600"
          />
        </div>
      </CardContent>
    </Card>
  );
}
