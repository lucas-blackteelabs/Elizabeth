import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { PlusCircle } from "lucide-react";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Integrated Calendar"
        description="Manage your appointments, treatments, and wellness activities"
      >
        <Button className="bg-gold text-[hsl(0,0%,100%)] hover:bg-gold/90 font-heading tracking-wide">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </Heading>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold tracking-wide">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded border border-[hsl(30,25%,87%)]"
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-[hsl(25,30%,28%)] text-base">
                {date ? date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                }) : "No date selected"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {date?.getDate() === 17 ? (
                  <div className="flex items-start space-x-3 pb-3 border-b border-[hsl(30,22%,87%)]">
                    <div className="bg-primary/20 text-gold p-2 rounded min-w-[60px] text-center border border-primary/30">
                      <div className="text-sm font-heading">9:30 AM</div>
                    </div>
                    <div>
                      <p className="font-body font-medium text-[hsl(25,30%,28%)]">Oncology Appointment</p>
                      <p className="text-sm text-[hsl(25,18%,48%)] font-body">Dr. Sarah Thompson</p>
                      <p className="text-xs text-[hsl(28,15%,50%)] font-body">Memorial Hospital</p>
                    </div>
                  </div>
                ) : date?.getDate() === 19 ? (
                  <div className="flex items-start space-x-3 pb-3 border-b border-[hsl(30,22%,87%)]">
                    <div className="bg-gold/10 text-gold p-2 rounded min-w-[60px] text-center border border-gold/20">
                      <div className="text-sm font-heading">2:00 PM</div>
                    </div>
                    <div>
                      <p className="font-body font-medium text-[hsl(25,30%,28%)]">Nutrition Consultation</p>
                      <p className="text-sm text-[hsl(25,18%,48%)] font-body">Maria Rodriguez, RD</p>
                      <p className="text-xs text-[hsl(28,15%,50%)] font-body">Wellness Center</p>
                    </div>
                  </div>
                ) : date?.getDate() === 22 ? (
                  <div className="flex items-start space-x-3 pb-3 border-b border-[hsl(30,22%,87%)]">
                    <div className="bg-gold/10 text-gold p-2 rounded min-w-[60px] text-center border border-gold/20">
                      <div className="text-sm font-heading">6:00 PM</div>
                    </div>
                    <div>
                      <p className="font-body font-medium text-[hsl(25,30%,28%)]">Support Group</p>
                      <p className="text-sm text-[hsl(25,18%,48%)] font-body">Community Center</p>
                      <p className="text-xs text-[hsl(28,15%,50%)] font-body">Weekly Meeting</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[hsl(28,15%,50%)] text-center py-8 font-body">
                    No events scheduled for this day
                  </p>
                )}
                
                <Button variant="outline" className="w-full border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-gold hover:border-gold/30 font-body">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}