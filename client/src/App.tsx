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
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Protected route component to restrict access
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    navigate('/login');
    return null;
  }
  
  return <Route {...rest} component={Component} />;
}

function Router() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Switch>
      {/* Public routes accessible to all */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes that require authentication */}
      {isAuthenticated ? (
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
            <Route component={NotFound} />
          </Switch>
        </Layout>
      ) : (
        <Route>
          {() => {
            // Redirect to login if not authenticated
            window.location.pathname !== '/login' && 
            window.location.pathname !== '/register' && 
            window.location.replace('/login');
            return null;
          }}
        </Route>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
