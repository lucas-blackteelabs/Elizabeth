import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { apiRequest } from '@/lib/queryClient';
import { Heart } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  cancerType: z.string().optional(),
  cancerStage: z.string().optional(),
  bio: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      email: '',
      cancerType: '',
      cancerStage: '',
      bio: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const userData = {
        username: values.username,
        password: values.password,
        confirmPassword: values.confirmPassword,
        displayName: values.displayName,
        email: values.email,
        cancerType: values.cancerType || null,
        cancerStage: values.cancerStage || null,
        bio: values.bio || null,
        diagnosis_date: null
      };
      
      console.log("Sending registration data:", JSON.stringify(userData));
      
      await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      toast({
        title: 'Registration successful',
        description: 'Welcome to Elizabeth! Your account has been created.',
        variant: 'default',
      });
      
      setLocation('/');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "bg-[hsl(30,8%,13%)] border-[hsl(30,8%,22%)] text-[hsl(40,20%,88%)] placeholder:text-[hsl(35,10%,40%)] font-body focus:border-gold/40";

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-8">
      <Card className="w-full max-w-lg bg-[hsl(30,10%,11%)] border-[hsl(30,8%,20%)]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-gold text-[hsl(30,15%,7%)] p-3 rounded mb-2 w-fit">
            <Heart className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-heading font-bold text-gold tracking-wide">Create an account</CardTitle>
          <CardDescription className="text-[hsl(35,10%,50%)] font-body">
            Enter your information to create an account in Elizabeth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[hsl(40,20%,85%)] font-body">Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Choose a username" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[hsl(40,20%,85%)] font-body">Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[hsl(40,20%,85%)] font-body">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[hsl(40,20%,85%)] font-body">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[hsl(40,20%,85%)] font-body">Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-heading text-gold/80 tracking-wide">Health Information (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cancerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[hsl(40,20%,85%)] font-body">Cancer Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Breast, Lung, etc." {...field} className={inputClasses} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cancerStage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[hsl(40,20%,85%)] font-body">Cancer Stage</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Stage 1, Stage 2, etc." {...field} className={inputClasses} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[hsl(40,20%,85%)] font-body">Bio</FormLabel>
                      <FormControl>
                        <Input placeholder="Tell us a bit about yourself" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full bg-gold text-[hsl(30,15%,7%)] hover:bg-gold/90 font-heading tracking-wide glow-gold" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center text-sm">
            <Separator className="my-4 bg-[hsl(30,8%,20%)]" />
            <p className="text-[hsl(35,10%,55%)] font-body">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-gold font-medium hover:text-gold/80"
                onClick={(e) => {
                  e.preventDefault();
                  setLocation('/login');
                }}
              >
                Log in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}