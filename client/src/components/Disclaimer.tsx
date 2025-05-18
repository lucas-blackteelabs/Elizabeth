import { AlertCircle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="fixed bottom-0 w-full bg-white shadow-md p-3 text-xs text-gray-500 text-center md:text-left border-t z-10">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <AlertCircle className="h-3 w-3" />
        <p>
          Elizabeth is designed to complement medical treatment, not replace it. Always consult with your healthcare providers before making changes to your treatment plan.
        </p>
      </div>
    </div>
  );
}
