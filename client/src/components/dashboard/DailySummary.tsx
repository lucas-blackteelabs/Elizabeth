import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Apple, Pill, PersonStanding, Bath } from "lucide-react";
import { format } from "date-fns";

interface SummaryItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function SummaryItem({ icon, label, value, color }: SummaryItemProps) {
  return (
    <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
      <div className={`${color} p-2 rounded-full`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function DailySummary() {
  const today = format(new Date(), "MMM d, yyyy");
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Today's Summary</CardTitle>
          <span className="text-sm text-gray-500">{today}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-4 gap-4">
          <SummaryItem
            icon={<Pill className="h-4 w-4" />}
            label="Medications"
            value="3 of 3 taken"
            color="bg-primary/10 text-primary"
          />
          
          <SummaryItem
            icon={<Apple className="h-4 w-4" />}
            label="Nutrition"
            value="2 meals logged"
            color="bg-green-100 text-green-700"
          />
          
          <SummaryItem
            icon={<PersonStanding className="h-4 w-4" />}
            label="Movement"
            value="15 min walk"
            color="bg-amber-100 text-amber-700"
          />
          
          <SummaryItem
            icon={<Bath className="h-4 w-4" />}
            label="Mindfulness"
            value="Not completed"
            color="bg-gray-200 text-gray-700"
          />
        </div>
      </CardContent>
    </Card>
  );
}
