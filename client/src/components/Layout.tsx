import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Disclaimer from "./Disclaimer";
import MobileBottomNav from "./MobileBottomNav";
import { useLocation } from "wouter";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile as useMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMobile();
  const [location] = useLocation();

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
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebarIfMobile} 
        isMobile={isMobile} 
      />

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
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-body font-semibold text-primary">L</span>
            </div>
          </div>
        )}

        {children}
      </main>

      <MobileBottomNav />

      <Disclaimer />
    </div>
  );
}
