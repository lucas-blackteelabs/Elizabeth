import { Heading } from "@/components/ui/heading";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Placeholder component for Community page
export default function Community() {
  return (
    <div className="p-6">
      <Heading 
        title="Community"
        description="Connect with others on similar healing journeys"
      />
      
      <Tabs defaultValue="forums">
        <TabsList className="mb-6">
          <TabsTrigger value="forums">
            <MessageSquare className="h-4 w-4 mr-2" /> Forums
          </TabsTrigger>
          <TabsTrigger value="mentors">
            <Users className="h-4 w-4 mr-2" /> Mentor Matching
          </TabsTrigger>
          <TabsTrigger value="resources">
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
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{forum.title}</CardTitle>
                  <CardDescription>
                    {forum.members} members · {forum.posts} posts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Join Discussion</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="mentors">
          <Card>
            <CardHeader>
              <CardTitle>Mentor Matching</CardTitle>
              <CardDescription>
                Connect with someone who has been through a similar journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                Our mentor matching system is coming soon
              </p>
              <Button className="mx-auto block">Join Waitlist</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Community Resources</CardTitle>
              <CardDescription>
                Resources shared by community members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-12">
                No resources have been shared yet
              </p>
              <Button className="mx-auto block">Share a Resource</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
