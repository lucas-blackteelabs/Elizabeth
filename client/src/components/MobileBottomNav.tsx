import { Link, useLocation } from "wouter";
import { Home, Apple, Calendar, Wine } from "lucide-react";
import AIChatButton from "./AIChatButton";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/nutrition", label: "Nutrition", icon: Apple },
  { href: "__ai__", label: "AI", icon: null },
  { href: "/date-night", label: "Date Night", icon: Wine },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[hsl(32,35%,94%)] border-t border-[hsl(30,22%,87%)] md:hidden">
      <div className="flex items-end justify-around px-1 h-16">
        {navItems.map((item) => {
          if (item.href === "__ai__") {
            return (
              <div key="ai" className="flex flex-col items-center relative -mb-1">
                <AIChatButton isMobileNavEmbedded />
              </div>
            );
          }

          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          const Icon = item.icon!;

          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center py-2 px-3 transition-colors",
                isActive ? "text-primary" : "text-[hsl(25,18%,55%)]"
              )}>
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-body mt-0.5">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
