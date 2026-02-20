import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Check, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';

export default function Subscribe() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, logout } = useUser();

  const { data: productsData, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['/api/stripe/products'],
  });

  const prices = productsData?.data || [];
  const monthlyPrice = prices.find((p: any) => {
    const recurring = typeof p.recurring === 'string' ? JSON.parse(p.recurring) : p.recurring;
    return recurring?.interval === 'month';
  });
  const yearlyPrice = prices.find((p: any) => {
    const recurring = typeof p.recurring === 'string' ? JSON.parse(p.recurring) : p.recurring;
    return recurring?.interval === 'year';
  });

  const handleCheckout = async (priceId: string) => {
    setIsCheckingOut(true);
    try {
      const result = await apiRequest<{ url: string }>('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Unable to start checkout',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const features = [
    'AI-powered health companion',
    'Personalized meal planning',
    'Medical tracking & scan history',
    'Treatment progress monitoring',
    'Community support forums',
    'Verified survivor connections',
    'Date night suggestions',
    'Journal with AI analysis',
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-8 px-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="mx-auto bg-primary text-white p-3 rounded-2xl mb-3 w-fit">
            <Heart className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-accent tracking-wide mb-2">
            Welcome to Elizabeth
          </h1>
          <p className="text-muted-foreground font-body text-lg max-w-md mx-auto">
            Your personal healing companion. Choose a plan to begin your journey.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card 
              className={`bg-white border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedPlan === monthlyPrice?.price_id ? 'border-primary shadow-md' : 'border-border'
              }`}
              onClick={() => monthlyPrice && setSelectedPlan(monthlyPrice.price_id)}
            >
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-heading text-accent tracking-wide">Monthly</CardTitle>
                <CardDescription className="font-body text-muted-foreground">
                  Flexible month-to-month
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4">
                  <span className="text-4xl font-heading font-bold text-foreground">$9.95</span>
                  <span className="text-muted-foreground font-body">/month</span>
                </div>
                <Button
                  className="w-full bg-primary text-white hover:bg-primary/90 font-heading tracking-wide rounded-2xl"
                  disabled={isCheckingOut || !monthlyPrice}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (monthlyPrice) handleCheckout(monthlyPrice.price_id);
                  }}
                >
                  {isCheckingOut && selectedPlan === monthlyPrice?.price_id ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                  ) : (
                    'Choose Monthly'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card 
              className={`bg-white border-2 cursor-pointer transition-all hover:shadow-md relative ${
                selectedPlan === yearlyPrice?.price_id ? 'border-primary shadow-md' : 'border-border'
              }`}
              onClick={() => yearlyPrice && setSelectedPlan(yearlyPrice.price_id)}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3 py-0.5 rounded-full text-xs font-heading tracking-wide flex items-center gap-1">
                <Star className="h-3 w-3" /> Save 20%
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-heading text-accent tracking-wide">Annual</CardTitle>
                <CardDescription className="font-body text-muted-foreground">
                  Best value - save $23.52/year
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-1">
                  <span className="text-4xl font-heading font-bold text-foreground">$7.99</span>
                  <span className="text-muted-foreground font-body">/month</span>
                </div>
                <p className="text-xs text-muted-foreground font-body mb-4">
                  Billed as $95.88/year
                </p>
                <Button
                  className="w-full bg-primary text-white hover:bg-primary/90 font-heading tracking-wide rounded-2xl"
                  disabled={isCheckingOut || !yearlyPrice}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (yearlyPrice) handleCheckout(yearlyPrice.price_id);
                  }}
                >
                  {isCheckingOut && selectedPlan === yearlyPrice?.price_id ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                  ) : (
                    'Choose Annual'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-white/80 border-border mb-6">
          <CardContent className="pt-6">
            <h3 className="font-heading text-lg text-accent tracking-wide mb-4 text-center">
              Everything included with your membership
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-body text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {user && (
          <div className="text-center">
            <button
              onClick={async () => {
                await logout();
                setLocation('/login');
              }}
              className="text-sm text-muted-foreground font-body hover:text-foreground transition-colors"
            >
              Sign in with a different account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
