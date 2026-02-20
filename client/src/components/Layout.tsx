import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Disclaimer from "./Disclaimer";
import MobileBottomNav from "./MobileBottomNav";
import { useLocation } from "wouter";
import { Menu, LogOut, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile as useMobile } from "@/hooks/use-mobile";
import { useUser } from "@/contexts/UserContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const isMobile = useMobile();
  const [location] = useLocation();
  const { user, logout } = useUser();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarIfMobile = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!isMobile && !desktopCollapsed && (
        <Sidebar 
          isOpen={true} 
          onClose={() => {}} 
          isMobile={false}
          onCollapse={() => setDesktopCollapsed(true)}
        />
      )}

      {isMobile && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebarIfMobile} 
          isMobile={true} 
        />
      )}

      <main className="flex-1 overflow-y-auto pb-20">
        {isMobile && (
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-lg p-4 border-b border-border sticky top-0 z-20">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-primary rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-heading text-foreground">Elizabeth</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}

        {!isMobile && desktopCollapsed && (
          <div className="sticky top-0 z-20 flex items-center bg-white/80 backdrop-blur-lg border-b border-border px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDesktopCollapsed(false)}
              className="text-muted-foreground hover:text-primary rounded-xl"
              title="Open sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          </div>
        )}

        {children}
      </main>

      <MobileBottomNav />

      <Disclaimer />
    </div>
  );
}
