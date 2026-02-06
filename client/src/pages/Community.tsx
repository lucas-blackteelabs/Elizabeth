import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, BookOpen, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Community() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Community & Resources"
        description="Connection, support, and curated resources for your healing journey"
      />

      <Card className="bg-primary/10 border-primary/20 mb-6">
        <CardContent className="p-4">
          <p className="text-sm text-[hsl(25,30%,28%)] font-body">
            <span className="font-medium">Radical Remission Factor #7:</span> Embracing social support is one of the nine key healing factors. Strong connections with others who understand your journey can reduce stress, boost immune function, and improve outcomes.
          </p>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="resources">
        <TabsList className="mb-6 bg-[hsl(30,30%,95%)] border border-[hsl(30,25%,87%)]">
          <TabsTrigger value="resources" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <BookOpen className="h-4 w-4 mr-2" /> Resources
          </TabsTrigger>
          <TabsTrigger value="support" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <Users className="h-4 w-4 mr-2" /> Support Networks
          </TabsTrigger>
          <TabsTrigger value="reading" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-body">
            <MessageSquare className="h-4 w-4 mr-2" /> Reading List
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="resources">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {title: "Radical Remission Project", desc: "Dr Kelly Turner's research on the nine healing factors common to remarkable cancer recoveries. The foundation of Elizabeth's approach.", link: "radicalremission.com"},
              {title: "Melanoma Institute Australia", desc: "World-leading melanoma research and treatment centre. Comprehensive information about melanoma immunotherapy and surveillance.", link: "melanoma.org.au"},
              {title: "Cancer Council Australia", desc: "Trusted information about cancer types, treatment, support services, and practical assistance for Australians affected by cancer.", link: "cancer.org.au"},
              {title: "Anticancer Lifestyle Program", desc: "Evidence-based lifestyle modifications to reduce cancer recurrence. Covers nutrition, exercise, stress management, and sleep.", link: "anticancerlifestyle.org"},
              {title: "Immunotherapy Side Effects Guide", desc: "Understanding and managing immune-related adverse events from checkpoint inhibitor therapy, including hepatitis and colitis.", link: "cancer.net"},
              {title: "Chris Wark - Chris Beat Cancer", desc: "Evidence-based holistic healing strategies alongside conventional treatment. Nutrition, supplements, and lifestyle approaches.", link: "chrisbeatcancer.com"}
            ].map((resource, index) => (
              <Card key={index} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="font-heading text-[hsl(25,30%,28%)] flex items-center gap-2">
                    {resource.title}
                    <ExternalLink className="h-3.5 w-3.5 text-[hsl(25,18%,48%)]" />
                  </CardTitle>
                  <CardDescription className="text-[hsl(25,18%,50%)] font-body">{resource.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-primary font-body">{resource.link}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="support">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {title: "Melanoma Patients Australia", desc: "Peer support from other melanoma patients and survivors. People who truly understand immunotherapy experiences.", members: "Active community"},
              {title: "Immunotherapy Support Groups", desc: "Connect with others who've experienced checkpoint inhibitor treatment, including managing side effects and surveillance anxiety.", members: "Online & in-person"},
              {title: "Cancer Wellness Groups", desc: "Holistic wellness groups focused on nutrition, meditation, and complementary therapies alongside conventional treatment.", members: "Local chapters"},
              {title: "Young Cancer Survivors Network", desc: "Support for younger adults navigating cancer, treatment aftermath, and building a new normal.", members: "National network"}
            ].map((group, index) => (
              <Card key={index} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="font-heading text-[hsl(25,30%,28%)]">{group.title}</CardTitle>
                  <CardDescription className="text-[hsl(25,18%,50%)] font-body">{group.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-body text-primary">{group.members}</span>
                    <Button variant="outline" size="sm" className="border-primary/25 text-primary hover:bg-primary/10 font-body">Learn More</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="reading">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {title: "Radical Remission", author: "Dr Kelly Turner", desc: "The nine key factors that make a real difference. The research behind Elizabeth's approach to healing."},
              {title: "The Metabolic Approach to Cancer", author: "Dr Nasha Winters & Jess Higgins Kelley", desc: "How diet and lifestyle can be used alongside conventional treatment to improve outcomes."},
              {title: "Anticancer: A New Way of Life", author: "Dr David Servan-Schreiber", desc: "A physician's personal journey with cancer and the science of natural defences against it."},
              {title: "The Healing Self", author: "Deepak Chopra & Rudolph Tanzi", desc: "How to strengthen your immune system and create lifelong health through mind-body connection."},
              {title: "When Breath Becomes Air", author: "Paul Kalanithi", desc: "A powerful memoir about facing mortality and finding what makes life worth living."},
              {title: "Mind Over Medicine", author: "Dr Lissa Rankin", desc: "Scientific proof that the mind can heal the body. How beliefs, feelings, and thoughts influence health."}
            ].map((book, index) => (
              <Card key={index} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] hover:border-primary/30 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-[hsl(25,30%,28%)] text-base">{book.title}</CardTitle>
                  <p className="text-sm text-primary font-body">{book.author}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[hsl(25,18%,50%)] font-body">{book.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
