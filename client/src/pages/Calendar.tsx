import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { PlusCircle, Scan, Stethoscope, Apple, Heart } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user } = useUser();
  
  const appointments = [
    { date: 10, month: 2, year: 2026, title: "Nutrition Consultation", person: "Integrative Dietitian", time: "2:00 PM", icon: <Apple className="h-4 w-4" />, color: "bg-primary/15 text-primary border-primary/25" },
    { date: 15, month: 4, year: 2026, title: "PET/CT Scan", person: "Radiology Department", time: "9:00 AM", icon: <Scan className="h-4 w-4" />, color: "bg-[hsl(34,55%,52%)]/15 text-[hsl(34,55%,45%)] border-[hsl(34,55%,52%)]/25" },
    { date: 22, month: 4, year: 2026, title: "Oncology Review", person: "Melanoma Oncology Team", time: "10:30 AM", icon: <Stethoscope className="h-4 w-4" />, color: "bg-primary/15 text-primary border-primary/25" },
  ];

  const getEventsForDate = (d: Date | undefined) => {
    if (!d) return [];
    return appointments.filter(a => a.date === d.getDate() && a.month === d.getMonth() && a.year === d.getFullYear());
  };

  const todayEvents = getEventsForDate(date);
  
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Calendar"
        description="Your appointments, scans, and wellness activities"
      />
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-[hsl(34,55%,45%)] tracking-wide">Calendar</CardTitle>
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
        
        <div className="space-y-6">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-[hsl(25,30%,28%)] text-base">
                {date ? date.toLocaleDateString('en-AU', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                }) : "No date selected"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayEvents.length > 0 ? (
                  todayEvents.map((event, i) => (
                    <div key={i} className="flex items-start space-x-3 pb-3 border-b border-[hsl(30,22%,87%)]">
                      <div className={`p-2 rounded min-w-[40px] text-center border ${event.color}`}>
                        {event.icon}
                      </div>
                      <div>
                        <p className="font-body font-medium text-[hsl(25,30%,28%)]">{event.title}</p>
                        <p className="text-sm text-[hsl(25,18%,48%)] font-body">{event.person}</p>
                        <p className="text-xs text-[hsl(25,18%,55%)] font-body">{event.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[hsl(25,18%,50%)] text-center py-6 font-body text-sm">
                    No events on this day
                  </p>
                )}
                
                <Button variant="outline" className="w-full border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-primary hover:border-primary/30 font-body">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-[hsl(34,55%,45%)] text-base">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointments.map((appt, i) => (
                  <div key={i} className="flex items-start space-x-3 pb-3 border-b border-[hsl(30,22%,87%)] last:border-0">
                    <div className={`p-2 rounded min-w-[40px] text-center border ${appt.color}`}>
                      <div className="text-xs font-heading font-bold">
                        {new Date(appt.year, appt.month, appt.date).toLocaleString('en-AU', { month: 'short' }).toUpperCase()}
                      </div>
                      <div className="text-lg font-heading font-bold">{appt.date}</div>
                    </div>
                    <div>
                      <p className="font-body font-medium text-[hsl(25,30%,28%)] text-sm">{appt.title}</p>
                      <p className="text-xs text-[hsl(25,18%,48%)] font-body">{appt.person}</p>
                      <p className="text-xs text-[hsl(25,18%,55%)] font-body">{appt.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
