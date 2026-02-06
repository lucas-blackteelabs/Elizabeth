import { AlertCircle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="fixed bottom-0 w-full bg-[hsl(25,18%,13%)] p-3 text-xs text-[hsl(28,15%,50%)] text-center md:text-left border-t border-[hsl(25,10%,23%)] z-10">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        <p className="font-body">
          Elizabeth is designed to complement medical treatment, not replace it. Always consult with your healthcare providers before making changes to your treatment plan.
        </p>
      </div>
    </div>
  );
}