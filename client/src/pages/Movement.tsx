import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Activity, PersonStanding } from "lucide-react";

export default function Movement() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Movement & Exercise"
        description="Customized exercise plans for different treatment stages"
      />
      
      <Card className="mb-6 bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
        <CardHeader>
          <CardTitle className="flex items-center font-heading text-[hsl(25,30%,28%)]">
            <Activity className="h-5 w-5 mr-2 text-gold/70" />
            Your Activity This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-[hsl(28,15%,50%)] font-body">Activity tracking will appear here</p>
          </div>
        </CardContent>
      </Card>
      
      <h2 className="text-lg font-heading text-gold tracking-wide mb-4">Recommended Exercises</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {["Gentle Yoga", "Seated Stretches", "Walking Program", "Chair Exercises", "Tai Chi Basics", "Resistance Band"].map((title, index) => (
          <Card key={index} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] overflow-hidden hover:border-gold/20 transition-all duration-300">
            <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-[hsl(30,22%,93%)] flex items-center justify-center">
              <PersonStanding className="h-12 w-12 text-gold/30" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-heading text-sm text-[hsl(25,30%,28%)] mb-1">{title}</h3>
              <p className="text-sm text-[hsl(25,18%,50%)] font-body mb-3">
                Low-impact exercise appropriate during treatment
              </p>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-body font-medium px-2 py-1 rounded border ${
                  index % 3 === 0 
                    ? "bg-primary/20 text-gold/80 border-primary/30" 
                    : index % 3 === 1 
                    ? "bg-gold/10 text-gold/80 border-gold/20" 
                    : "bg-[hsl(30,22%,93%)] text-[hsl(25,18%,48%)] border-[hsl(30,22%,85%)]"
                }`}>
                  {index % 3 === 0 ? "Beginner" : index % 3 === 1 ? "Intermediate" : "All Levels"}
                </span>
                <Button variant="ghost" size="sm" className="flex items-center text-gold/70 hover:text-gold font-body">
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