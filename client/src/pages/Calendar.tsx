import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { PlusCircle } from "lucide-react";

// Placeholder component for Calendar page
export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  return (
    <div className="p-6">
      <Heading 
        title="Integrated Calendar"
        description="Manage your appointments, treatments, and wellness activities"
      >
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </Heading>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
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
                  <div className="flex items-start space-x-3 pb-3 border-b">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg min-w-[60px] text-center">
                      <div className="text-sm">9:30 AM</div>
                    </div>
                    <div>
                      <p className="font-medium">Oncology Appointment</p>
                      <p className="text-sm text-gray-500">Dr. Sarah Thompson</p>
                      <p className="text-xs text-gray-500">Memorial Hospital</p>
                    </div>
                  </div>
                ) : date?.getDate() === 19 ? (
                  <div className="flex items-start space-x-3 pb-3 border-b">
                    <div className="bg-green-100 text-green-700 p-2 rounded-lg min-w-[60px] text-center">
                      <div className="text-sm">2:00 PM</div>
                    </div>
                    <div>
                      <p className="font-medium">Nutrition Consultation</p>
                      <p className="text-sm text-gray-500">Maria Rodriguez, RD</p>
                      <p className="text-xs text-gray-500">Wellness Center</p>
                    </div>
                  </div>
                ) : date?.getDate() === 22 ? (
                  <div className="flex items-start space-x-3 pb-3 border-b">
                    <div className="bg-amber-100 text-amber-700 p-2 rounded-lg min-w-[60px] text-center">
                      <div className="text-sm">6:00 PM</div>
                    </div>
                    <div>
                      <p className="font-medium">Support Group</p>
                      <p className="text-sm text-gray-500">Community Center</p>
                      <p className="text-xs text-gray-500">Weekly Meeting</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No events scheduled for this day
                  </p>
                )}
                
                <Button variant="outline" className="w-full">
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
