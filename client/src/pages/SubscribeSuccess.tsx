import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, CheckCircle, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

export default function SubscribeSuccess() {
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [, setLocation] = useLocation();
  const { setUser, user } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      setVerifying(false);
      return;
    }

    const verifySession = async () => {
      try {
        const result = await apiRequest<{ success: boolean; status: string }>('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (result.success) {
          setVerified(true);
          const updatedUser = await apiRequest('/api/auth/me', { method: 'GET' });
          setUser(updatedUser);
        }
      } catch (error) {
        console.error('Verification error:', error);
      } finally {
        setVerifying(false);
      }
    };

    verifySession();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md bg-white border-border">
        <CardContent className="pt-8 pb-8 text-center">
          {verifying ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-xl font-heading text-accent tracking-wide mb-2">
                Confirming your membership...
              </h2>
              <p className="text-muted-foreground font-body">
                Just a moment while we set everything up.
              </p>
            </>
          ) : verified ? (
            <>
              <div className="mx-auto bg-green-100 text-green-600 p-4 rounded-full w-fit mb-4">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-heading text-accent tracking-wide mb-2">
                Welcome to Elizabeth
              </h2>
              <p className="text-muted-foreground font-body mb-6">
                Your membership is active. Your healing journey begins now.
              </p>
              <Button
                onClick={() => setLocation('/dashboard')}
                className="bg-primary text-white hover:bg-primary/90 font-heading tracking-wide rounded-2xl px-8"
              >
                Go to Dashboard
              </Button>
            </>
          ) : (
            <>
              <div className="mx-auto bg-primary text-white p-3 rounded-2xl w-fit mb-4">
                <Heart className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-heading text-accent tracking-wide mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground font-body mb-6">
                We couldn't confirm your payment. Please try again or contact support.
              </p>
              <Button
                onClick={() => setLocation('/subscribe')}
                className="bg-primary text-white hover:bg-primary/90 font-heading tracking-wide rounded-2xl px-8"
              >
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
