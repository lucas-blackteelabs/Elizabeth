import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface HeadingProps {
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

export function Heading({ title, description, className, children }: HeadingProps) {
  return (
    <header className={cn("mb-8", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gold tracking-wide">{title}</h1>
          {description && <p className="text-[hsl(25,18%,48%)] font-body mt-1">{description}</p>}
        </div>
        {children}
      </div>
      <div className="mt-3 h-px bg-gradient-to-r from-gold/40 via-primary/30 to-transparent" />
    </header>
  );
}