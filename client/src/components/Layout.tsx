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

      <main className="flex-1 overflow-y-auto pb-20 md:pb-16">
        {isMobile && (
          <div className="flex items-center justify-between bg-[hsl(32,35%,94%)] p-4 border-b border-[hsl(30,22%,87%)] sticky top-0 z-20">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="text-[hsl(25,20%,42%)] hover:text-primary"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-heading font-bold text-[hsl(34,55%,45%)] tracking-wider">Elizabeth</h1>
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
              <span className="text-sm font-heading font-semibold text-primary">L</span>
            </div>
          </div>
        )}

        {children}
      </main>

      {isMobile && <MobileBottomNav />}

      <Disclaimer />
    </div>
  );
}
