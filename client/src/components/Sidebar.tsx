import { Link, useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { Heart, Home, Bot, FileText, Apple, Calendar, LogOut, Wine, BookOpen, Sparkles, Pill, Users, Shield, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  onCollapse?: () => void;
}

export default function Sidebar({ isOpen, onClose, isMobile, onCollapse }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useUser();

  const sidebarLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <Home className="w-[18px] h-[18px]" /> },
    { href: "/medical-tracker", label: "Medical Tracker", icon: <FileText className="w-[18px] h-[18px]" /> },
    { href: "/treatment-plus", label: "Treatment +", icon: <Sparkles className="w-[18px] h-[18px]" /> },
    { href: "/nutrition", label: "Nutrition", icon: <Apple className="w-[18px] h-[18px]" /> },
    { href: "/supplements", label: "Supplements", icon: <Pill className="w-[18px] h-[18px]" /> },
    { href: "/resources", label: "Resources", icon: <BookOpen className="w-[18px] h-[18px]" /> },
    { href: "/calendar", label: "Timeline", icon: <Calendar className="w-[18px] h-[18px]" /> },
    { href: "/community", label: "Community", icon: <Users className="w-[18px] h-[18px]" /> },
    { href: "/date-night", label: "Date Night", icon: <Wine className="w-[18px] h-[18px]" /> },
    { href: "/ai-assistant", label: "AI Assistant", icon: <Bot className="w-[18px] h-[18px]" /> },
  ];

  if (user?.role === "admin") {
    sidebarLinks.push({ href: "/admin", label: "Admin Panel", icon: <Shield className="w-[18px] h-[18px]" /> });
  }

  const sidebarClasses = cn(
    "w-64 flex-shrink-0 z-30 transition-all duration-300",
    "bg-white border-r border-border",
    {
      "fixed inset-y-0 left-0 translate-x-0": isMobile && isOpen,
      "fixed inset-y-0 left-0 -translate-x-full": isMobile && !isOpen,
      "sticky top-0 h-screen": !isMobile,
    }
  );

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 backdrop-blur-sm" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-white p-2 rounded-xl">
                <Heart className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-heading text-foreground">Elizabeth</h1>
            </div>
            {!isMobile && onCollapse && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCollapse}
                className="text-muted-foreground hover:text-primary rounded-xl h-8 w-8"
                title="Close sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="p-3 overflow-y-auto flex-1 min-h-0">
            <Link href="/profile" onClick={onClose}>
              <div className="flex items-center space-x-3 p-3 bg-muted/60 rounded-xl mb-4 cursor-pointer hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-semibold text-lg">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-foreground font-body text-sm">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-muted-foreground font-body">
                    {user?.cancerType || 'Not specified'} — {user?.cancerStage || 'Not specified'}
                  </p>
                </div>
              </div>
            </Link>
            
            <nav className="space-y-0.5">
              {sidebarLinks.map((link) => {
                const isActive = location === link.href || (link.href === "/dashboard" && location === "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-body",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex-shrink-0 p-3 border-t border-border bg-white">
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-body text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
