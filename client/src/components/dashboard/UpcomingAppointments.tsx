import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Appointment } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface AppointmentItemProps {
  month: string;
  day: string;
  title: string;
  person: string;
  time: string;
  colorClass: string;
}

function AppointmentItem({ month, day, title, person, time, colorClass }: AppointmentItemProps) {
  return (
    <div className="flex items-start space-x-3 pb-3 border-b">
      <div className={`${colorClass} p-2 rounded-lg min-w-[40px] text-center`}>
        <div className="text-xs font-bold">{month}</div>
        <div className="text-lg font-bold">{day}</div>
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500">{person}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}

// Hardcoded data for initial state
const mockAppointments = [
  {
    id: 1,
    title: "Oncology Appointment",
    description: "Regular checkup with oncologist",
    date: "2023-05-17",
    time: "9:30 AM - 10:30 AM",
    location: "Memorial Hospital",
    person: "Dr. Sarah Thompson"
  },
  {
    id: 2,
    title: "Nutrition Consultation",
    description: "Dietary planning session",
    date: "2023-05-19",
    time: "2:00 PM - 3:00 PM",
    location: "Wellness Center",
    person: "Maria Rodriguez, RD"
  },
  {
    id: 3,
    title: "Support Group",
    description: "Weekly cancer support meeting",
    date: "2023-05-22",
    time: "6:00 PM - 7:30 PM",
    location: "Community Center",
    person: "Community Center"
  }
];

export default function UpcomingAppointments() {
  // Will be replaced with actual API call once backend is ready
  const { data: appointments } = useQuery({
    queryKey: ['/api/appointments'],
    initialData: mockAppointments
  });
  
  const colorClasses = [
    "bg-primary/10 text-primary",
    "bg-green-100 text-green-700",
    "bg-amber-100 text-amber-700"
  ];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString()
    };
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Upcoming</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment, index) => {
            const { month, day } = formatDate(appointment.date);
            return (
              <AppointmentItem
                key={appointment.id}
                month={month}
                day={day}
                title={appointment.title}
                person={appointment.person}
                time={appointment.time}
                colorClass={colorClasses[index % colorClasses.length]}
              />
            );
          })}
          
          <a href="/calendar" className="block text-center text-sm text-primary hover:text-primary/80 font-medium pt-2">
            View All Appointments
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
