import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-gold" />
            <h1 className="text-2xl font-heading font-bold text-[hsl(25,35%,22%)]">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-[hsl(25,18%,48%)] font-body">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}