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
        title: 'Welcome back',
        description: 'Your healing journey continues.',
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
      <Card className="w-full max-w-md bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary text-white p-3 rounded mb-2 w-fit">
            <Heart className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-heading font-bold text-[hsl(34,55%,45%)] tracking-wide">Elizabeth</CardTitle>
          <CardDescription className="text-[hsl(25,18%,50%)] font-body">
            Your healing companion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[hsl(25,30%,28%)] font-body">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] text-[hsl(25,30%,22%)] placeholder:text-[hsl(25,15%,55%)] font-body focus:border-primary/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[hsl(25,30%,28%)] font-body">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] text-[hsl(25,30%,22%)] placeholder:text-[hsl(25,15%,55%)] font-body focus:border-primary/40"
              />
            </div>
            <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90 font-heading tracking-wide" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Separator className="my-4 bg-[hsl(30,25%,87%)]" />
            <p className="text-[hsl(25,18%,48%)] font-body">
              Don't have an account?{' '}
              <a
                href="/register"
                className="text-primary font-medium hover:text-primary/80"
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
