import { useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Clock, Calendar, X } from "lucide-react";
import { TestResultsUpload } from "@/components/medical-tracker/TestResultsUpload";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

export default function MedicalTracker() {
  const [testResultsOpen, setTestResultsOpen] = useState(false);
  
  return (
    <div className="p-6">
      <Heading 
        title="Medical Tracker"
        description="Keep track of your appointments, test results, and medications"
      >
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </Heading>
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              No test results have been added yet
            </p>
            <Dialog open={testResultsOpen} onOpenChange={setTestResultsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Upload Test Results</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload Test Results</DialogTitle>
                  <DialogDescription>
                    Add medical test results to track your health progress
                  </DialogDescription>
                  <DialogClose className="absolute top-4 right-4">
                    <X className="h-4 w-4" />
                  </DialogClose>
                </DialogHeader>
                <TestResultsUpload />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Medication Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              No medications have been added yet
            </p>
            <Button variant="outline" className="w-full">Add Medication</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 pb-3 border-b">
                <div className="bg-primary/10 text-primary p-2 rounded-lg min-w-[40px] text-center">
                  <div className="text-xs font-bold">MAY</div>
                  <div className="text-lg font-bold">17</div>
                </div>
                <div>
                  <p className="font-medium">Oncology Appointment</p>
                  <p className="text-sm text-gray-500">Dr. Sarah Thompson</p>
                  <p className="text-xs text-gray-500">9:30 AM - 10:30 AM</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">View All Appointments</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Health Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-12">
            Your health timeline will appear here once you add medical records
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
