import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import AIAssistant from "@/pages/AIAssistant";
import MedicalTracker from "@/pages/MedicalTracker";
import Nutrition from "@/pages/Nutrition";
import MindBody from "@/pages/MindBody";
import Movement from "@/pages/Movement";
import Supplements from "@/pages/Supplements";
import Community from "@/pages/Community";
import SpiritualWellbeing from "@/pages/SpiritualWellbeing";
import Calendar from "@/pages/Calendar";
import Profile from "@/pages/Profile";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/ai-assistant" component={AIAssistant} />
        <Route path="/medical-tracker" component={MedicalTracker} />
        <Route path="/nutrition" component={Nutrition} />
        <Route path="/mind-body" component={MindBody} />
        <Route path="/movement" component={Movement} />
        <Route path="/supplements" component={Supplements} />
        <Route path="/community" component={Community} />
        <Route path="/spiritual" component={SpiritualWellbeing} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
