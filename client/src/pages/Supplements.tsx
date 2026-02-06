import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Supplements() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Supplements & Therapies"
        description="Evidence-based supplements for immune support and liver recovery"
      />

      <Card className="bg-[hsl(34,55%,52%)]/10 border-[hsl(34,55%,52%)]/20 mb-6">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[hsl(34,55%,52%)] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[hsl(25,30%,28%)] font-body">
            <span className="font-medium">Important:</span> After immunotherapy-related toxicity, always discuss any new supplement with your oncology team. Some supplements may interact with immune system recovery or affect liver function tests.
          </p>
        </CardContent>
      </Card>
      
      <div className="mb-6 flex">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(25,18%,48%)]" />
          <Input 
            placeholder="Search supplements..."
            className="pl-10 bg-[hsl(30,30%,95%)] border-[hsl(30,22%,85%)] text-[hsl(25,30%,28%)] placeholder:text-[hsl(25,15%,55%)] font-body focus:border-primary/40"
          />
        </div>
      </div>
      
      <Tabs defaultValue="immune">
        <TabsList className="mb-6 bg-[hsl(30,30%,95%)] border border-[hsl(30,25%,87%)]">
          <TabsTrigger value="immune" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">Immune Support</TabsTrigger>
          <TabsTrigger value="liver" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">Liver Recovery</TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">General Wellness</TabsTrigger>
        </TabsList>
        
        <TabsContent value="immune">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {name: "Vitamin D3", desc: "Critical for immune function. Melanoma patients often benefit from optimal levels (50-80 ng/mL). Discuss dosing with your team.", evidence: "Strong", note: "Get levels tested regularly"},
              {name: "Medicinal Mushrooms", desc: "Turkey tail, reishi, and shiitake contain beta-glucans that support immune surveillance against cancer cells.", evidence: "Moderate", note: "Turkey tail has strongest evidence"},
              {name: "Curcumin (Turmeric)", desc: "Powerful anti-inflammatory with potential anti-melanoma properties. Take with black pepper (piperine) for absorption.", evidence: "Moderate", note: "Check liver enzyme interactions"},
              {name: "Omega-3 (EPA/DHA)", desc: "Anti-inflammatory fatty acids that support immune function and may help reduce treatment-related inflammation.", evidence: "Strong", note: "Choose high-quality fish oil"},
              {name: "Green Tea Extract (EGCG)", desc: "Antioxidant with potential anti-melanoma properties. May support immune cell activity.", evidence: "Moderate", note: "Monitor caffeine sensitivity"},
              {name: "Vitamin C", desc: "Supports immune cell function and acts as an antioxidant. May help with recovery from immunosuppression.", evidence: "Moderate", note: "Liposomal form better absorbed"}
            ].map((supplement, index) => (
              <Card key={index} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="font-heading text-[hsl(25,30%,28%)]">{supplement.name}</CardTitle>
                  <CardDescription className="text-[hsl(25,18%,50%)] font-body">{supplement.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-primary font-body mb-3 italic">{supplement.note}</p>
                  <span className={`text-xs font-body font-medium px-2 py-1 rounded border ${
                    supplement.evidence === "Strong" 
                      ? "bg-primary/15 text-primary border-primary/25" 
                      : "bg-[hsl(34,55%,52%)]/10 text-[hsl(34,55%,45%)] border-[hsl(34,55%,52%)]/20"
                  }`}>
                    {supplement.evidence} Evidence
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="liver">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {name: "Milk Thistle (Silymarin)", desc: "The gold standard for liver support. Protects liver cells and supports regeneration after hepatitis.", evidence: "Strong", note: "Well-studied for drug-induced liver injury"},
              {name: "NAC (N-Acetyl Cysteine)", desc: "Precursor to glutathione, the liver's master antioxidant. Supports liver detoxification pathways.", evidence: "Strong", note: "Used clinically for liver protection"},
              {name: "Alpha-Lipoic Acid", desc: "Powerful antioxidant that supports liver cell protection and regeneration.", evidence: "Moderate", note: "May affect blood sugar levels"},
              {name: "Artichoke Extract", desc: "Stimulates bile production and supports healthy liver function. Gentle and well-tolerated.", evidence: "Moderate", note: "Good complementary to milk thistle"},
              {name: "Glutathione", desc: "The body's master antioxidant. Supports liver detoxification. Liposomal form for better absorption.", evidence: "Moderate", note: "Liposomal or IV forms most effective"},
              {name: "B-Complex Vitamins", desc: "Essential for liver metabolism and energy production. Supports recovery from hepatitis.", evidence: "Moderate", note: "Methylated forms preferred"}
            ].map((supplement, index) => (
              <Card key={index} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="font-heading text-[hsl(25,30%,28%)]">{supplement.name}</CardTitle>
                  <CardDescription className="text-[hsl(25,18%,50%)] font-body">{supplement.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-primary font-body mb-3 italic">{supplement.note}</p>
                  <span className={`text-xs font-body font-medium px-2 py-1 rounded border ${
                    supplement.evidence === "Strong" 
                      ? "bg-primary/15 text-primary border-primary/25" 
                      : "bg-[hsl(34,55%,52%)]/10 text-[hsl(34,55%,45%)] border-[hsl(34,55%,52%)]/20"
                  }`}>
                    {supplement.evidence} Evidence
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="general">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {name: "Probiotics", desc: "Supports gut health recovery after colitis and immunosuppression. Choose multi-strain formulas.", evidence: "Strong", note: "Critical after colitis history"},
              {name: "Magnesium", desc: "Supports sleep, stress management, and muscle recovery. Many cancer patients are deficient.", evidence: "Moderate", note: "Glycinate form for sleep support"},
              {name: "Zinc", desc: "Essential mineral for immune cell function. Supports wound healing and immune surveillance.", evidence: "Moderate", note: "Don't exceed 40mg daily"},
              {name: "Selenium", desc: "Trace mineral important for thyroid and immune function. Research shows potential anti-melanoma properties.", evidence: "Moderate", note: "Brazil nuts are a natural source"},
              {name: "Melatonin", desc: "Supports sleep quality and may have immune-modulatory and anti-cancer properties.", evidence: "Limited", note: "Start with low dose (1-3mg)"},
              {name: "Adaptogenic Herbs", desc: "Ashwagandha, rhodiola, and holy basil help manage stress and support immune balance.", evidence: "Limited", note: "Check for drug interactions"}
            ].map((supplement, index) => (
              <Card key={index} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="font-heading text-[hsl(25,30%,28%)]">{supplement.name}</CardTitle>
                  <CardDescription className="text-[hsl(25,18%,50%)] font-body">{supplement.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-primary font-body mb-3 italic">{supplement.note}</p>
                  <span className={`text-xs font-body font-medium px-2 py-1 rounded border ${
                    supplement.evidence === "Strong" 
                      ? "bg-primary/15 text-primary border-primary/25" 
                      : supplement.evidence === "Moderate"
                      ? "bg-[hsl(34,55%,52%)]/10 text-[hsl(34,55%,45%)] border-[hsl(34,55%,52%)]/20"
                      : "bg-[hsl(30,22%,93%)] text-[hsl(25,18%,48%)] border-[hsl(30,22%,85%)]"
                  }`}>
                    {supplement.evidence} Evidence
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
