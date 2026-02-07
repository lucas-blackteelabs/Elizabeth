import { useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Shield, Target, Clock, FileText, Camera, Loader2 } from "lucide-react";

const formSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  cancerType: z.string().optional(),
  cancerStage: z.string().optional(),
  bio: z.string().optional(),
  diagnosis_date: z.string().optional(),
  treatmentStatus: z.string().optional(),
  goals: z.string().optional(),
  oncologist: z.string().optional(),
  dietaryPreferences: z.string().optional(),
});

export default function ProfileSimple() {
  const { user, setUser } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/users/${user.id}/photo`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const updated = await res.json();
      setUser({ ...user, ...updated });
      toast({ title: "Photo updated!" });
    } catch {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
      cancerType: user?.cancerType || "",
      cancerStage: user?.cancerStage || "",
      bio: user?.bio || "",
      diagnosis_date: user?.diagnosis_date || "",
      treatmentStatus: user?.treatmentStatus || "",
      goals: user?.goals || "",
      oncologist: user?.oncologist || "",
      dietaryPreferences: user?.dietaryPreferences || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const updatedUser = await apiRequest(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      
      setUser({ ...user, ...updatedUser });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
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

  const inputClasses = "bg-muted/50 border-border text-foreground placeholder:text-muted-foreground font-body focus:border-primary/40";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-accent tracking-wide">My Profile</h1>
        <div className="mt-3 h-px bg-gradient-to-r from-primary/40 via-accent/30 to-transparent" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <Card className="bg-white border-border">
            <CardHeader>
              <CardTitle className="font-heading text-accent tracking-wide">Profile Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {user?.profilePhoto ? (
                    <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary/30 shadow-md">
                      <img src={user.profilePhoto} alt={user.displayName} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-2xl font-heading font-bold text-primary">
                      {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('') : '?'}
                    </div>
                  )}
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center shadow-sm hover:bg-primary/5 transition-colors"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-primary" />
                    )}
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                <h3 className="text-xl font-heading text-foreground">{user?.displayName || 'Loading...'}</h3>
                <p className="text-muted-foreground font-body text-sm">{user?.email || ''}</p>
                
                <div className="w-full mt-4 space-y-2">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground font-body">Type</span>
                    <span className="font-body font-medium text-foreground">{user?.cancerType || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground font-body">Stage</span>
                    <span className="font-body font-medium text-foreground">{user?.cancerStage || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground font-body">Status</span>
                    <span className="font-body font-medium text-primary">{user?.treatmentStatus || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-muted-foreground font-body">Oncologist</span>
                    <span className="font-body font-medium text-foreground text-right text-sm">{user?.oncologist || "—"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {user?.treatmentHistory && (
            <Card className="bg-white border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-accent tracking-wide text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Treatment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{user.treatmentHistory}</p>
              </CardContent>
            </Card>
          )}

          {user?.adverseEventHistory && (
            <Card className="bg-white border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-accent tracking-wide text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Side Effects History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{user.adverseEventHistory}</p>
              </CardContent>
            </Card>
          )}

          {user?.scanSummary && (
            <Card className="bg-white border-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-accent tracking-wide text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Latest Scan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{user.scanSummary}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="col-span-1 lg:col-span-2">
          <Card className="bg-white border-border">
            <CardHeader>
              <CardTitle className="font-heading text-accent tracking-wide">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Input placeholder="Your email" {...field} className={inputClasses} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cancerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-body">Cancer Type</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Melanoma" {...field} className={inputClasses} />
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

                    <FormField
                      control={form.control}
                      name="diagnosis_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-body">Diagnosis Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className={inputClasses} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="treatmentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-body">Treatment Status</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Active Surveillance" {...field} className={inputClasses} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="oncologist"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-body">Oncologist / Care Team</FormLabel>
                          <FormControl>
                            <Input placeholder="Your oncology team" {...field} className={inputClasses} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dietaryPreferences"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-body">Dietary Preferences</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g. Sugar-free, dairy-free, fish or organic chicken" 
                            className={`${inputClasses} resize-none`}
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-body">Healing Goals</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What are your healing goals?" 
                            className={`${inputClasses} resize-none`}
                            rows={3}
                            {...field} 
                          />
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
                        <FormLabel className="text-foreground font-body">About Me</FormLabel>
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
                  
                  <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90 font-heading tracking-wide" disabled={isLoading}>
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
