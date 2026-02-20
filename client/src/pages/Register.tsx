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
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
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
      phoneNumber: '',
      address: '',
      cancerType: '',
      cancerStage: '',
      bio: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const userData = {
        username: values.username,
        password: values.password,
        confirmPassword: values.confirmPassword,
        displayName: values.displayName,
        email: values.email,
        phoneNumber: values.phoneNumber || null,
        address: values.address || null,
        timezone: tz || null,
        cancerType: values.cancerType || null,
        cancerStage: values.cancerStage || null,
        bio: values.bio || null,
        diagnosis_date: null,
      };
      
      await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      toast({
        title: 'Account created',
        description: 'Now choose a membership plan to get started.',
        variant: 'default',
      });
      
      setLocation('/subscribe');
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

  const inputClasses = "bg-muted/50 border-border text-foreground placeholder:text-muted-foreground font-body focus:border-primary/40";

  return (
    <div className="flex items-center justify-center min-h-screen bg-background py-8 px-4">
      <Card className="w-full max-w-lg bg-white border-border">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary text-white p-3 rounded-2xl mb-2 w-fit">
            <Heart className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-heading font-bold text-accent tracking-wide">Create an account</CardTitle>
          <CardDescription className="text-muted-foreground font-body">
            Join Elizabeth on your healing journey
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
                      <FormLabel className="text-foreground font-body">Username</FormLabel>
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
                      <FormLabel className="text-foreground font-body">Display Name</FormLabel>
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
                      <FormLabel className="text-foreground font-body">Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-body">Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+61 400 000 000" {...field} className={inputClasses} />
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
                      <FormLabel className="text-foreground font-body">Password</FormLabel>
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
                      <FormLabel className="text-foreground font-body">Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-body">Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Your address (for timezone and location-based features)" {...field} className={inputClasses + " min-h-[60px] resize-none"} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <h3 className="text-lg font-heading text-accent tracking-wide">Health Information (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cancerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-body">Cancer Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Melanoma, Lymphoma" {...field} className={inputClasses} />
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
                        <FormLabel className="text-foreground font-body">Cancer Stage</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Stage IV" {...field} className={inputClasses} />
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
                      <FormLabel className="text-foreground font-body">About You</FormLabel>
                      <FormControl>
                        <Input placeholder="Tell us a bit about your journey" {...field} className={inputClasses} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90 font-heading tracking-wide rounded-2xl" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center text-sm">
            <Separator className="my-4 bg-muted" />
            <p className="text-muted-foreground font-body">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-primary font-medium hover:text-primary/80"
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
