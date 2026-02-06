import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Disclaimer from "./Disclaimer";
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

      <main className="flex-1 overflow-y-auto pb-16">
        {isMobile && (
          <div className="flex items-center justify-between bg-[hsl(30,12%,9%)] p-4 border-b border-[hsl(30,8%,18%)] sticky top-0 z-20">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="text-[hsl(35,15%,65%)] hover:text-gold"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-heading font-bold text-gold tracking-wider">Elizabeth</h1>
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
              <span className="text-sm font-heading font-semibold text-gold">L</span>
            </div>
          </div>
        )}

        {children}
      </main>

      <Disclaimer />
    </div>
  );
}