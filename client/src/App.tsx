import { Switch, Route, useLocation, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import SimpleDashboard from "@/pages/SimpleDashboard";
import AIAssistant from "@/pages/AIAssistant";
import MedicalTracker from "@/pages/MedicalTracker";
import Nutrition from "@/pages/Nutrition";
import MindBody from "@/pages/MindBody";
import Movement from "@/pages/Movement";
import Supplements from "@/pages/Supplements";
import Community from "@/pages/Community";
import SpiritualWellbeing from "@/pages/SpiritualWellbeing";
import Calendar from "@/pages/Calendar";
import ProfileSimple from "@/pages/ProfileSimple";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { UserProvider } from "@/contexts/UserContext";

// Simple router without auth-dependent routing for now
function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={SimpleDashboard} />
        <Route path="/dashboard" component={SimpleDashboard} />
        <Route path="/ai-assistant" component={AIAssistant} />
        <Route path="/medical-tracker" component={MedicalTracker} />
        <Route path="/nutrition" component={Nutrition} />
        <Route path="/mind-body" component={MindBody} />
        <Route path="/movement" component={Movement} />
        <Route path="/supplements" component={Supplements} />
        <Route path="/community" component={Community} />
        <Route path="/spiritual" component={SpiritualWellbeing} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/profile" component={ProfileSimple} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
