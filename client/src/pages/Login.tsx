import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/contexts/UserContext';
import { Heart } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(username, password);
      
      toast({
        title: 'Login successful',
        description: 'Welcome back to Elizabeth!',
        variant: 'default',
      });
      setLocation('/');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: 'Invalid username or password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md bg-[hsl(25,16%,17%)] border-[hsl(25,10%,25%)]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-gold text-[hsl(25,20%,13%)] p-3 rounded mb-2 w-fit">
            <Heart className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-heading font-bold text-gold tracking-wide">Log in to Elizabeth</CardTitle>
          <CardDescription className="text-[hsl(28,15%,55%)] font-body">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[hsl(30,22%,87%)] font-body">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-[hsl(25,14%,19%)] border-[hsl(25,10%,27%)] text-[hsl(30,25%,90%)] placeholder:text-[hsl(28,15%,45%)] font-body focus:border-gold/40"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[hsl(30,22%,87%)] font-body">Password</Label>
                <a
                  href="#"
                  className="text-sm font-body font-medium text-gold/70 hover:text-gold"
                  onClick={(e) => {
                    e.preventDefault();
                    toast({
                      title: 'Password Reset',
                      description: 'This feature will be available in a future update.',
                    });
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[hsl(25,14%,19%)] border-[hsl(25,10%,27%)] text-[hsl(30,25%,90%)] placeholder:text-[hsl(28,15%,45%)] font-body focus:border-gold/40"
              />
            </div>
            <Button type="submit" className="w-full bg-gold text-[hsl(25,20%,13%)] hover:bg-gold/90 font-heading tracking-wide glow-gold" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Separator className="my-4 bg-[hsl(25,10%,25%)]" />
            <p className="text-[hsl(28,15%,58%)] font-body">
              Don't have an account?{' '}
              <a
                href="/register"
                className="text-gold font-medium hover:text-gold/80"
                onClick={(e) => {
                  e.preventDefault();
                  setLocation('/register');
                }}
              >
                Register
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}