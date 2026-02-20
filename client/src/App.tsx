import { Switch, Route } from "wouter";
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
import Supplements from "@/pages/Supplements";
import Calendar from "@/pages/Calendar";
import ProfileSimple from "@/pages/ProfileSimple";
import DateNight from "@/pages/DateNight";
import Resources from "@/pages/Resources";
import TreatmentPlus from "@/pages/TreatmentPlus";
import Community from "@/pages/Community";
import AdminPanel from "@/pages/AdminPanel";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { Redirect } from "wouter";
import AIChatButton from "@/components/AIChatButton";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useUser();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-body text-lg">Loading Elizabeth...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useUser();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }
  
  return <Component />;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login">
        <AuthRoute component={Login} />
      </Route>
      <Route path="/register">
        <AuthRoute component={Register} />
      </Route>
      <Route path="/">
        <Layout>
          <ProtectedRoute component={SimpleDashboard} />
        </Layout>
      </Route>
      <Route path="/dashboard">
        <Layout>
          <ProtectedRoute component={SimpleDashboard} />
        </Layout>
      </Route>
      <Route path="/ai-assistant">
        <Layout>
          <ProtectedRoute component={AIAssistant} />
        </Layout>
      </Route>
      <Route path="/medical-tracker">
        <Layout>
          <ProtectedRoute component={MedicalTracker} />
        </Layout>
      </Route>
      <Route path="/nutrition">
        <Layout>
          <ProtectedRoute component={Nutrition} />
        </Layout>
      </Route>
      <Route path="/supplements">
        <Layout>
          <ProtectedRoute component={Supplements} />
        </Layout>
      </Route>
      <Route path="/mind-body">
        <Redirect to="/resources" />
      </Route>
      <Route path="/movement">
        <Redirect to="/resources" />
      </Route>
      <Route path="/community">
        <Layout>
          <ProtectedRoute component={Community} />
        </Layout>
      </Route>
      <Route path="/spiritual">
        <Redirect to="/resources" />
      </Route>
      <Route path="/calendar">
        <Layout>
          <ProtectedRoute component={Calendar} />
        </Layout>
      </Route>
      <Route path="/resources">
        <Layout>
          <ProtectedRoute component={Resources} />
        </Layout>
      </Route>
      <Route path="/treatment-plus">
        <Layout>
          <ProtectedRoute component={TreatmentPlus} />
        </Layout>
      </Route>
      <Route path="/date-night">
        <Layout>
          <ProtectedRoute component={DateNight} />
        </Layout>
      </Route>
      <Route path="/admin">
        <Layout>
          <ProtectedRoute component={AdminPanel} />
        </Layout>
      </Route>
      <Route path="/profile">
        <Layout>
          <ProtectedRoute component={ProfileSimple} />
        </Layout>
      </Route>
      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
    </Switch>
  );
}

function AuthenticatedAIChatButton() {
  const { isAuthenticated } = useUser();
  if (!isAuthenticated) return null;
  return (
    <div className="hidden md:block">
      <AIChatButton />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
          <AuthenticatedAIChatButton />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
