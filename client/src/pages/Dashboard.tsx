import { Heading } from "@/components/ui/heading";
import DailySummary from "@/components/dashboard/DailySummary";
import ProgressTracker from "@/components/dashboard/ProgressTracker";
import UpcomingAppointments from "@/components/dashboard/UpcomingAppointments";
import FeaturedResources from "@/components/dashboard/FeaturedResources";
import { useUser } from "@/contexts/UserContext";

export default function Dashboard() {
  const { user } = useUser();
  
  return (
    <div className="p-6">
      <Heading 
        title={`Welcome back, ${user.displayName}`}
        description="Let's continue your healing journey today"
      />
      
      <DailySummary />
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <ProgressTracker />
        </div>
        <div>
          <UpcomingAppointments />
        </div>
      </div>
      
      <FeaturedResources />
    </div>
  );
}
