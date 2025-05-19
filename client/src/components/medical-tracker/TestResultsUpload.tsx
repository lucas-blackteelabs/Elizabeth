import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/UserContext";

const testTypes = [
  { value: "blood", label: "Blood Test" },
  { value: "imaging", label: "Imaging (X-ray, CT, MRI)" },
  { value: "biopsy", label: "Biopsy" },
  { value: "other", label: "Other" }
];

export function TestResultsUpload() {
  const [testType, setTestType] = useState("");
  const [testDate, setTestDate] = useState("");
  const [testName, setTestName] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testType || !testDate || !testName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create form data to handle file upload
      const formData = new FormData();
      formData.append("userId", user?.id.toString() || "1");
      formData.append("testType", testType);
      formData.append("testDate", testDate);
      formData.append("testName", testName);
      formData.append("testDescription", testDescription);
      if (file) {
        formData.append("file", file);
      }

      // For now, we'll simulate the API call
      // In a production environment, we would send this to an actual endpoint
      setTimeout(() => {
        console.log("Test result data to be sent:", {
          userId: user?.id || 1,
          testType,
          testDate,
          testName,
          testDescription,
          fileName: file?.name
        });
        
        toast({
          title: "Test Results Uploaded",
          description: "Your test results have been successfully saved.",
        });
        
        // Reset form
        setTestType("");
        setTestDate("");
        setTestName("");
        setTestDescription("");
        setFile(null);
        setIsUploading(false);
      }, 1500);
      
      // Actual API implementation would be:
      // await apiRequest('/api/medical-records/test-results', {
      //   method: 'POST',
      //   body: formData,
      // });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "There was a problem uploading your test results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Test Results</CardTitle>
        <CardDescription>
          Add your medical test results to keep track of your health journey
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="test-type">Test Type *</Label>
              <Select 
                value={testType} 
                onValueChange={setTestType}
              >
                <SelectTrigger id="test-type">
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {testTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="test-date">Test Date *</Label>
              <Input
                id="test-date"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="test-name">Test Name *</Label>
              <Input
                id="test-name"
                placeholder="e.g., Complete Blood Count, CT Scan"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="test-description">Description</Label>
              <Textarea
                id="test-description"
                placeholder="Enter any relevant details about this test"
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="test-file">Upload File (optional)</Label>
              <Input
                id="test-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              <p className="text-xs text-gray-500">
                Accepted formats: PDF, JPG, PNG (max 10MB)
              </p>
            </div>
            
            <Button type="submit" disabled={isUploading}>
              {isUploading ? "Uploading..." : "Save Test Results"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}