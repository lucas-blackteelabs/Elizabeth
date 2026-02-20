import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Disclaimer from "./Disclaimer";
import MobileBottomNav from "./MobileBottomNav";
import NotificationBell from "./NotificationBell";
import { Menu, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile as useMobile } from "@/hooks/use-mobile";
import { useUser } from "@/contexts/UserContext";
import { Link } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const isMobile = useMobile();
  const { user } = useUser();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarIfMobile = () => {
    if (isMobile) {
      setSidebarOpen(false);
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
          <div className="flex items-center bg-white/80 backdrop-blur-lg p-4 border-b border-border sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar}
                className="text-muted-foreground hover:text-primary rounded-xl h-8 w-8"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Link href="/profile">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user?.displayName || ''} className="w-8 h-8 rounded-full object-cover border border-primary/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-semibold text-sm">
                    {user?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </Link>
            </div>
            <h1 className="text-lg font-heading text-foreground flex-1 text-center">Elizabeth</h1>
            <NotificationBell />
          </div>
        )}

        {!isMobile && desktopCollapsed && (
          <div className="sticky top-0 z-20 flex items-center justify-between bg-white/80 backdrop-blur-lg border-b border-border px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDesktopCollapsed(false)}
              className="text-muted-foreground hover:text-primary rounded-xl"
              title="Open sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
            <NotificationBell />
          </div>
        )}

        {!isMobile && !desktopCollapsed && (
          <div className="sticky top-0 z-20 flex items-center justify-end bg-white/80 backdrop-blur-lg border-b border-border px-4 py-2">
            <NotificationBell />
          </div>
        )}

        {children}
      </main>

      <MobileBottomNav />

      <Disclaimer />
    </div>
  );
}
