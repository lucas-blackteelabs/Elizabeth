import { Heading } from "@/components/ui/heading";
import DailySummary from "@/components/dashboard/DailySummary";
import ProgressTracker from "@/components/dashboard/ProgressTracker";
import UpcomingAppointments from "@/components/dashboard/UpcomingAppointments";
import FeaturedResources from "@/components/dashboard/FeaturedResources";
import SimpleChat from "@/components/dashboard/SimpleChat";
import { useUser } from "@/contexts/UserContext";

export default function Dashboard() {
  const { user } = useUser();
  
  // If user is not loaded yet, show loading state
  if (!user) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Heading 
        title={`Welcome back, ${user.displayName || 'Friend'}`}
        description="Let's continue your healing journey today"
      />
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <DailySummary />
        </div>
        <div>
          <SimpleChat />
        </div>
      </div>
      
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
