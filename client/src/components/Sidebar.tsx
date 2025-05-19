import { Link, useLocation } from "wouter";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { Heart, Home, Bot, FileText, Apple, Bath, PersonStanding, Pill, Users, Leaf, Calendar, Settings, HelpCircle, LogOut, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Logout Button Component
function LogoutButton() {
  const { logout } = useUser();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: 'Logout Error',
        description: 'There was a problem logging out. Please try again.',
        variant: 'destructive',
      });
      console.error('Logout error:', error);
    }
  };
  
  return (
    <button onClick={handleLogout} className="hover:text-primary">
      <LogOut className="h-5 w-5" />
    </button>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useUser();

  const sidebarLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
    { href: "/ai-assistant", label: "AI Assistant", icon: <Bot className="w-5 h-5" /> },
    { href: "/medical-tracker", label: "Medical Tracker", icon: <FileText className="w-5 h-5" /> },
    { href: "/nutrition", label: "Nutrition", icon: <Apple className="w-5 h-5" /> },
    { href: "/mind-body", label: "Mind & Body", icon: <Bath className="w-5 h-5" /> },
    { href: "/movement", label: "Movement", icon: <PersonStanding className="w-5 h-5" /> },
    { href: "/supplements", label: "Supplements", icon: <Pill className="w-5 h-5" /> },
    { href: "/community", label: "Community", icon: <Users className="w-5 h-5" /> },
    { href: "/spiritual", label: "Spiritual Wellbeing", icon: <Leaf className="w-5 h-5" /> },
    { href: "/calendar", label: "Calendar", icon: <Calendar className="w-5 h-5" /> },
  ];

  // Determine sidebar visibility class based on mobile and open state
  const sidebarClasses = cn(
    "w-64 h-full bg-white shadow-md flex-shrink-0 z-30 transition-all duration-300",
    {
      "fixed translate-x-0": isMobile && isOpen,
      "fixed -translate-x-full": isMobile && !isOpen,
      "relative": !isMobile,
    }
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={sidebarClasses}>
        {/* Logo and app name */}
        <div className="p-5 border-b flex items-center space-x-3">
          <div className="bg-primary text-white p-2 rounded-lg">
            <Heart className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Elizabeth</h1>
        </div>
        
        {/* User profile */}
        <div className="p-3">
          <Link href="/profile" onClick={onClose}>
            <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg mb-5 cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-medium text-gray-800">{user?.displayName || 'User'}</p>
                <p className="text-xs text-gray-500">
                  {user?.cancerType || 'Not specified'} - {user?.cancerStage || 'Not specified'}
                </p>
              </div>
            </div>
          </Link>
          
          {/* Navigation links */}
          <nav className="mt-3 space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                  location === link.href || (link.href === "/dashboard" && location === "/")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Footer icons */}
        <div className="absolute bottom-0 w-full p-3 border-t">
          <div className="flex items-center justify-between text-gray-600 text-sm px-3">
            <Link href="/profile" onClick={onClose} className="hover:text-primary">
              <UserRound className="h-5 w-5" />
            </Link>
            <button className="hover:text-primary">
              <Settings className="h-5 w-5" />
            </button>
            <button className="hover:text-primary">
              <HelpCircle className="h-5 w-5" />
            </button>
            <button 
              onClick={() => window.location.href = '/login'}
              className="hover:text-primary">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
