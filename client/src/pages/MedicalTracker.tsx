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
    <div className="p-6 lg:p-8">
      <Heading 
        title="Medical Tracker"
        description="Keep track of your appointments, test results, and medications"
      >
        <Button className="bg-gold text-[hsl(0,0%,100%)] hover:bg-gold/90 font-heading tracking-wide">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </Heading>
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
          <CardHeader>
            <CardTitle className="flex items-center font-heading text-[hsl(25,30%,28%)]">
              <FileText className="h-5 w-5 mr-2 text-gold/70" />
              Recent Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[hsl(28,15%,50%)] text-center py-8 font-body">
              No test results have been added yet
            </p>
            <Dialog open={testResultsOpen} onOpenChange={setTestResultsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-gold hover:border-gold/30 font-body">Upload Test Results</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
                <DialogHeader>
                  <DialogTitle className="font-heading text-gold">Upload Test Results</DialogTitle>
                  <DialogDescription className="text-[hsl(25,18%,48%)] font-body">
                    Add medical test results to track your health progress
                  </DialogDescription>
                  <DialogClose className="absolute top-4 right-4 text-[hsl(25,18%,48%)]">
                    <X className="h-4 w-4" />
                  </DialogClose>
                </DialogHeader>
                <TestResultsUpload />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
          <CardHeader>
            <CardTitle className="flex items-center font-heading text-[hsl(25,30%,28%)]">
              <Clock className="h-5 w-5 mr-2 text-gold/70" />
              Medication Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[hsl(28,15%,50%)] text-center py-8 font-body">
              No medications have been added yet
            </p>
            <Button variant="outline" className="w-full border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-gold hover:border-gold/30 font-body">Add Medication</Button>
          </CardContent>
        </Card>
        
        <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
          <CardHeader>
            <CardTitle className="flex items-center font-heading text-[hsl(25,30%,28%)]">
              <Calendar className="h-5 w-5 mr-2 text-gold/70" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 pb-3 border-b border-[hsl(30,22%,87%)]">
                <div className="bg-primary/20 text-gold p-2 rounded min-w-[40px] text-center border border-primary/30">
                  <div className="text-xs font-heading font-bold">MAY</div>
                  <div className="text-lg font-heading font-bold">17</div>
                </div>
                <div>
                  <p className="font-body font-medium text-[hsl(25,30%,28%)]">Oncology Appointment</p>
                  <p className="text-sm text-[hsl(25,18%,48%)] font-body">Dr. Sarah Thompson</p>
                  <p className="text-xs text-[hsl(28,15%,50%)] font-body">9:30 AM - 10:30 AM</p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-[hsl(30,22%,85%)] text-[hsl(25,20%,42%)] hover:bg-primary/10 hover:text-gold hover:border-gold/30 font-body">View All Appointments</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
        <CardHeader>
          <CardTitle className="font-heading text-gold tracking-wide">Health Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[hsl(28,15%,50%)] text-center py-12 font-body">
            Your health timeline will appear here once you add medical records
          </p>
        </CardContent>
      </Card>
    </div>
  );
}