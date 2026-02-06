import { Link, useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { Heart, Home, Bot, FileText, Apple, Bath, PersonStanding, Pill, Users, Leaf, Calendar, LogOut, UserRound, Wine } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useUser();

  const sidebarLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
    { href: "/ai-assistant", label: "AI Assistant", icon: <Bot className="w-5 h-5" /> },
    { href: "/medical-tracker", label: "Medical Tracker", icon: <FileText className="w-5 h-5" /> },
    { href: "/nutrition", label: "Nutrition", icon: <Apple className="w-5 h-5" /> },
    { href: "/mind-body", label: "Mind & Body", icon: <Bath className="w-5 h-5" /> },
    { href: "/movement", label: "Movement", icon: <PersonStanding className="w-5 h-5" /> },
    { href: "/supplements", label: "Supplements", icon: <Pill className="w-5 h-5" /> },
    { href: "/community", label: "Resources", icon: <Users className="w-5 h-5" /> },
    { href: "/spiritual", label: "Wellbeing", icon: <Leaf className="w-5 h-5" /> },
    { href: "/date-night", label: "Date Night", icon: <Wine className="w-5 h-5" /> },
    { href: "/calendar", label: "Calendar", icon: <Calendar className="w-5 h-5" /> },
  ];

  const sidebarClasses = cn(
    "w-64 h-full flex-shrink-0 z-30 transition-all duration-300",
    "bg-[hsl(32,35%,94%)] border-r border-[hsl(30,22%,87%)]",
    {
      "fixed translate-x-0": isMobile && isOpen,
      "fixed -translate-x-full": isMobile && !isOpen,
      "relative": !isMobile,
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
          className="fixed inset-0 bg-black/30 z-20 backdrop-blur-sm" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={sidebarClasses}>
        <div className="p-5 border-b border-[hsl(30,22%,87%)] flex items-center space-x-3">
          <div className="bg-primary text-white p-2 rounded">
            <Heart className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-heading font-bold text-[hsl(34,55%,45%)] tracking-wider">Elizabeth</h1>
        </div>
        
        <div className="p-3 overflow-y-auto" style={{ height: 'calc(100% - 130px)' }}>
          <Link href="/profile" onClick={onClose}>
            <div className="flex items-center space-x-3 p-3 bg-[hsl(30,30%,95%)] rounded mb-5 cursor-pointer hover:bg-[hsl(30,28%,92%)] transition-colors border border-[hsl(30,22%,87%)]">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-semibold">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-medium text-[hsl(25,30%,28%)] font-body">{user?.displayName || 'User'}</p>
                <p className="text-xs text-[hsl(25,18%,50%)] font-body">
                  {user?.cancerType || 'Not specified'} — {user?.cancerStage || 'Not specified'}
                </p>
              </div>
            </div>
          </Link>
          
          <nav className="mt-3 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = location === link.href || (link.href === "/dashboard" && location === "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded transition-all duration-200",
                    isActive
                      ? "bg-primary/15 text-primary border-l-2 border-primary"
                      : "text-[hsl(25,20%,42%)] hover:bg-[hsl(30,28%,92%)] hover:text-[hsl(25,30%,28%)]"
                  )}
                >
                  {link.icon}
                  <span className="font-body text-sm">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="absolute bottom-0 w-full p-3 border-t border-[hsl(30,22%,87%)]">
          <div className="flex items-center justify-between text-[hsl(25,18%,50%)] text-sm px-3">
            <Link href="/profile" onClick={onClose} className="hover:text-primary transition-colors">
              <UserRound className="h-5 w-5" />
            </Link>
            <button 
              onClick={handleLogout}
              className="hover:text-primary transition-colors"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
