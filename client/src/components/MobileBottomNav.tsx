import { Link, useLocation } from "wouter";
import { Home, Apple, Sparkles, Calendar, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/nutrition", label: "Nutrition", icon: Apple },
  { href: "/ai-assistant", label: "AI", icon: Bot, isCenter: true },
  { href: "/treatment-plus", label: "Treatment+", icon: Sparkles },
  { href: "/calendar", label: "Timeline", icon: Calendar },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-border safe-area-bottom shadow-[0_-2px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-end justify-around px-1 h-16 max-w-3xl mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center relative -mt-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                    isActive
                      ? "bg-primary shadow-primary/30 scale-105"
                      : "bg-gradient-to-br from-primary to-primary/85 shadow-primary/20 hover:scale-105 hover:shadow-primary/30"
                  )}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={cn(
                    "text-[9px] font-body font-semibold mt-0.5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>{item.label}</span>
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center py-2 px-1.5 transition-all duration-200 min-w-[44px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground/70"
              )}>
                <div className={cn(
                  "relative flex items-center justify-center",
                  isActive && "after:absolute after:-bottom-1 after:w-1 after:h-1 after:rounded-full after:bg-primary"
                )}>
                  <Icon className={cn("h-[18px] w-[18px] transition-all", isActive && "stroke-[2.5]")} />
                </div>
                <span className={cn(
                  "text-[9px] font-body mt-1 leading-none",
                  isActive ? "font-semibold" : "font-medium"
                )}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
