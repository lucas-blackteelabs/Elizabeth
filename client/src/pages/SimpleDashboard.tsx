import { useUser } from "@/contexts/UserContext";
import { useState } from "react";
import { MessageCircle, TrendingUp, Calendar, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SimpleDashboard() {
  const { user } = useUser();
  const [showAIChat, setShowAIChat] = useState(false);
  
  // Handle loading or no user state
  if (!user) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {user?.displayName || 'Friend'}</h1>
        <p className="text-gray-500">Let's continue your healing journey today</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Health Journey</h2>
          <p className="mb-2">Cancer Type: {user?.cancerType || "Not specified"}</p>
          <p className="mb-2">Cancer Stage: {user?.cancerStage || "Not specified"}</p>
          <p className="mb-6">Diagnosis Date: {user?.diagnosis_date || "Not specified"}</p>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-blue-100 p-2 rounded text-center">
              <p className="font-bold text-blue-700">3</p>
              <p className="text-sm">Appointments</p>
            </div>
            <div className="bg-green-100 p-2 rounded text-center">
              <p className="font-bold text-green-700">7</p>
              <p className="text-sm">Activities</p>
            </div>
            <div className="bg-purple-100 p-2 rounded text-center">
              <p className="font-bold text-purple-700">12</p>
              <p className="text-sm">Meals</p>
            </div>
          </div>
        </div>
        
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Health Assistant
            </CardTitle>
            <CardDescription>
              Get personalized guidance for your healing journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ask me about nutrition, supplements, mind-body practices, and emotional wellbeing.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  Nutrition Tips
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Stress Relief
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Exercise Ideas
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Supplements
                </Button>
              </div>
              <Button 
                className="w-full" 
                onClick={() => window.location.href = '/ai-assistant'}
              >
                Start Conversation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly Goals</span>
                <span className="font-medium">4/7</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-4/7"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">Oncology Checkup</p>
              <p className="text-sm text-muted-foreground">Dr. Sarah Thompson</p>
              <p className="text-sm">May 22, 2025 at 9:30 AM</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5" />
              Wellness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <p className="text-sm text-muted-foreground">Keep up the great work!</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="font-medium">Oncology Appointment</p>
              <p className="text-sm text-gray-500">Dr. Sarah Thompson</p>
            </div>
            <div className="text-right">
              <p className="font-medium">May 22, 2025</p>
              <p className="text-sm text-gray-500">9:30 AM</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="font-medium">Nutrition Consultation</p>
              <p className="text-sm text-gray-500">Maria Rodriguez, RD</p>
            </div>
            <div className="text-right">
              <p className="font-medium">May 25, 2025</p>
              <p className="text-sm text-gray-500">2:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}