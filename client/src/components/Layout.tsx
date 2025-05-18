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

  // Extract page title from location
  const getPageTitle = () => {
    const path = location.split("/")[1];
    if (!path) return "Dashboard";
    
    // Convert kebab-case to Title Case
    return path
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar component */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebarIfMobile} 
        isMobile={isMobile} 
      />

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto bg-gray-50 pb-16">
        {/* Mobile header */}
        {isMobile && (
          <div className="flex items-center justify-between bg-white p-4 shadow-sm sticky top-0 z-20">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-bold text-gray-800">Elizabeth</h1>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600">L</span>
            </div>
          </div>
        )}

        {/* Page content */}
        {children}
      </main>

      {/* Disclaimer footer */}
      <Disclaimer />
    </div>
  );
}
