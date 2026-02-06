import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Supplements() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Supplements & Therapies"
        description="Evidence-based supplement information and complementary therapies"
      />
      
      <div className="mb-6 flex">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(35,10%,45%)]" />
          <Input 
            placeholder="Search supplements..."
            className="pl-10 bg-[hsl(30,8%,13%)] border-[hsl(30,8%,22%)] text-[hsl(40,20%,88%)] placeholder:text-[hsl(35,10%,40%)] font-body focus:border-gold/40"
          />
        </div>
      </div>
      
      <Tabs defaultValue="database">
        <TabsList className="mb-6 bg-[hsl(30,8%,13%)] border border-[hsl(30,8%,20%)]">
          <TabsTrigger value="database" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">Supplement Database</TabsTrigger>
          <TabsTrigger value="interactions" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">Interaction Checker</TabsTrigger>
          <TabsTrigger value="therapies" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">Complementary Therapies</TabsTrigger>
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
              <Card key={index} className="bg-[hsl(30,10%,11%)] border-[hsl(30,8%,20%)] hover:border-gold/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="font-heading text-[hsl(40,20%,88%)]">{supplement.name}</CardTitle>
                  <CardDescription className="text-[hsl(35,10%,50%)] font-body">{supplement.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-body font-medium px-2 py-1 rounded border ${
                      supplement.evidence === "Strong" 
                        ? "bg-primary/20 text-gold border-primary/30" 
                        : supplement.evidence === "Moderate"
                        ? "bg-gold/10 text-gold/80 border-gold/20"
                        : "bg-[hsl(30,8%,15%)] text-[hsl(35,10%,55%)] border-[hsl(30,8%,22%)]"
                    }`}>
                      {supplement.evidence} Evidence
                    </span>
                    <Button variant="ghost" size="sm" className="text-gold/70 hover:text-gold font-body">Learn More</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="interactions">
          <Card className="bg-[hsl(30,10%,11%)] border-[hsl(30,8%,20%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold">Medication-Supplement Interaction Checker</CardTitle>
              <CardDescription className="text-[hsl(35,10%,50%)] font-body">
                Check for potential interactions between your medications and supplements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(35,10%,45%)] text-center py-12 font-body">
                Add your medications and supplements to check for interactions
              </p>
              <Button className="mx-auto block bg-gold text-[hsl(30,15%,7%)] hover:bg-gold/90 font-heading">Add Medications</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="therapies">
          <Card className="bg-[hsl(30,10%,11%)] border-[hsl(30,8%,20%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold">Complementary Therapies</CardTitle>
              <CardDescription className="text-[hsl(35,10%,50%)] font-body">
                Learn about evidence-based complementary therapies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(35,10%,45%)] text-center py-12 font-body">
                Complementary therapy information will be available soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}