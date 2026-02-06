import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Community() {
  return (
    <div className="p-6 lg:p-8">
      <Heading 
        title="Community"
        description="Connect with others on similar healing journeys"
      />
      
      <Tabs defaultValue="forums">
        <TabsList className="mb-6 bg-[hsl(30,30%,95%)] border border-[hsl(30,25%,87%)]">
          <TabsTrigger value="forums" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <MessageSquare className="h-4 w-4 mr-2" /> Forums
          </TabsTrigger>
          <TabsTrigger value="mentors" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <Users className="h-4 w-4 mr-2" /> Mentor Matching
          </TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-primary/20 data-[state=active]:text-gold font-body">
            <BookOpen className="h-4 w-4 mr-2" /> Shared Resources
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="forums">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {title: "Breast Cancer", members: 328, posts: 1452},
              {title: "Lung Cancer", members: 215, posts: 876},
              {title: "Colorectal Cancer", members: 189, posts: 723},
              {title: "Prostate Cancer", members: 263, posts: 1024},
              {title: "Lymphoma", members: 176, posts: 654},
              {title: "General Discussion", members: 452, posts: 2134}
            ].map((forum, index) => (
              <Card key={index} className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)] hover:border-gold/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="font-heading text-[hsl(25,30%,28%)]">{forum.title}</CardTitle>
                  <CardDescription className="text-[hsl(25,18%,50%)] font-body">
                    {forum.members} members · {forum.posts} posts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-primary/30 border border-primary/40 text-gold hover:bg-primary/40 font-body">Join Discussion</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="mentors">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold">Mentor Matching</CardTitle>
              <CardDescription className="text-[hsl(25,18%,50%)] font-body">
                Connect with someone who has been through a similar journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(28,15%,50%)] text-center py-12 font-body">
                Our mentor matching system is coming soon
              </p>
              <Button className="mx-auto block bg-gold text-[hsl(0,0%,100%)] hover:bg-gold/90 font-heading">Join Waitlist</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources">
          <Card className="bg-[hsl(36,40%,98%)] border-[hsl(30,25%,87%)]">
            <CardHeader>
              <CardTitle className="font-heading text-gold">Community Resources</CardTitle>
              <CardDescription className="text-[hsl(25,18%,50%)] font-body">
                Resources shared by community members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-[hsl(28,15%,50%)] text-center py-12 font-body">
                No resources have been shared yet
              </p>
              <Button className="mx-auto block bg-gold text-[hsl(0,0%,100%)] hover:bg-gold/90 font-heading">Share a Resource</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}