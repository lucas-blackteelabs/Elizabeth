import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Placeholder component for Supplements page
export default function Supplements() {
  return (
    <div className="p-6">
      <Heading 
        title="Supplements & Therapies"
        description="Evidence-based supplement information and complementary therapies"
      />
      
      <div className="mb-6 flex">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search supplements..."
            className="pl-10"
          />
        </div>
      </div>
      
      <Tabs defaultValue="database">
        <TabsList className="mb-6">
          <TabsTrigger value="database">Supplement Database</TabsTrigger>
          <TabsTrigger value="interactions">Interaction Checker</TabsTrigger>
          <TabsTrigger value="therapies">Complementary Therapies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="database">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {name: "Vitamin D", desc: "Supports immune function and bone health", evidence: "Strong"},
              {name: "Omega-3 Fatty Acids", desc: "Anti-inflammatory properties", evidence: "Moderate"},
              {name: "Probiotics", desc: "Supports gut health during treatment", evidence: "Moderate"},
              {name: "Turmeric/Curcumin", desc: "Natural anti-inflammatory compound", evidence: "Moderate"},
              {name: "Melatonin", desc: "May support sleep and immune function", evidence: "Limited"},
              {name: "Medicinal Mushrooms", desc: "Potential immune system support", evidence: "Limited"}
            ].map((supplement, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{supplement.name}</CardTitle>
                  <CardDescription>{supplement.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      supplement.evidence === "Strong" 
                        ? "bg-green-100 text-green-800" 
                        : supplement.evidence === "Moderate"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {supplement.evidence} Evidence
                    </span>
                    <Button variant="ghost" size="sm">Learn More</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="interactions">
          <Card>
            <CardHeader>
              <CardTitle>Medication-Supplement Interaction Checker</CardTitle>
              <CardDescription>
                Check for potential interactions between your medications and supplements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                Add your medications and supplements to check for interactions
              </p>
              <Button className="mx-auto block">Add Medications</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="therapies">
          <Card>
            <CardHeader>
              <CardTitle>Complementary Therapies</CardTitle>
              <CardDescription>
                Learn about evidence-based complementary therapies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                Complementary therapy information will be available soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
