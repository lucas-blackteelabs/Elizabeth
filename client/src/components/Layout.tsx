import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Disclaimer from "./Disclaimer";
import MobileBottomNav from "./MobileBottomNav";
import { Menu, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile as useMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const isMobile = useMobile();

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
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-primary rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-heading text-foreground flex-1 text-center">Elizabeth</h1>
            <div className="w-10" />
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
