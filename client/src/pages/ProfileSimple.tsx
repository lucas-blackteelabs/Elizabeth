import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";

const formSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  cancerType: z.string().min(1, { message: "Please select a cancer type" }),
  cancerStage: z.string().min(1, { message: "Please select a cancer stage" }),
  bio: z.string().optional(),
  diagnosis_date: z.string().optional(),
});

export default function ProfileSimple() {
  const { user, setUser } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
      cancerType: user?.cancerType || "",
      cancerStage: user?.cancerStage || "",
      bio: user?.bio || "",
      diagnosis_date: user?.diagnosis_date || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      setUser({
        ...user,
        displayName: values.displayName,
        email: values.email,
        cancerType: values.cancerType || null,
        cancerStage: values.cancerStage || null,
        bio: values.bio || null,
        diagnosis_date: values.diagnosis_date || null
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const inputClasses = "bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)] text-[hsl(25,30%,28%)] placeholder:text-[hsl(25,15%,55%)] font-body focus:border-gold/40";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-gold tracking-wide">My Profile</h1>
        <div className="mt-3 h-px bg-gradient-to-r from-gold/40 via-primary/30 to-transparent" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold tracking-wide">Profile Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-primary/20 border-2 border-gold/30 flex items-center justify-center text-2xl font-heading font-bold text-gold mb-4">
                  {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('') : '?'}
                </div>
                <h3 className="text-xl font-heading text-[hsl(25,30%,28%)]">{user?.displayName || 'Loading...'}</h3>
                <p className="text-[hsl(25,18%,50%)] font-body">{user?.email || 'Loading...'}</p>
                
                <div className="w-full mt-4 space-y-2">
                  <div className="flex justify-between py-2 border-b border-[hsl(30,22%,87%)]">
                    <span className="text-sm text-[hsl(25,18%,50%)] font-body">Cancer Type:</span>
                    <span className="font-body font-medium text-[hsl(25,30%,28%)]">{user?.cancerType || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[hsl(25,18%,50%)] font-body">Cancer Stage:</span>
                    <span className="font-body font-medium text-[hsl(25,30%,28%)]">{user?.cancerStage || "Not specified"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold tracking-wide">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[hsl(25,30%,28%)] font-body">Display Name</FormLabel>
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
                        <FormLabel className="text-[hsl(25,30%,28%)] font-body">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Your email" {...field} className={inputClasses} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cancerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[hsl(25,30%,28%)] font-body">Cancer Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className={inputClasses}>
                                <SelectValue placeholder="Select cancer type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)]">
                              <SelectItem value="breast">Breast Cancer</SelectItem>
                              <SelectItem value="lung">Lung Cancer</SelectItem>
                              <SelectItem value="colon">Colorectal Cancer</SelectItem>
                              <SelectItem value="prostate">Prostate Cancer</SelectItem>
                              <SelectItem value="melanoma">Melanoma</SelectItem>
                              <SelectItem value="leukemia">Leukemia</SelectItem>
                              <SelectItem value="lymphoma">Lymphoma</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cancerStage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[hsl(25,30%,28%)] font-body">Cancer Stage</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className={inputClasses}>
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[hsl(35,30%,96%)] border-[hsl(30,22%,85%)]">
                              <SelectItem value="stage1">Stage I</SelectItem>
                              <SelectItem value="stage2">Stage II</SelectItem>
                              <SelectItem value="stage3">Stage III</SelectItem>
                              <SelectItem value="stage4">Stage IV</SelectItem>
                              <SelectItem value="remission">Remission</SelectItem>
                              <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="diagnosis_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[hsl(25,30%,28%)] font-body">Diagnosis Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className={inputClasses} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[hsl(25,30%,28%)] font-body">About Me</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell others about yourself..." 
                            className={`${inputClasses} resize-none`}
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full bg-gold text-[hsl(0,0%,100%)] hover:bg-gold/90 font-heading tracking-wide glow-gold" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}