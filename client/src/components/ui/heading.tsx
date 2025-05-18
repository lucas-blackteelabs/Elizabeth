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
    <header className={cn("mb-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
