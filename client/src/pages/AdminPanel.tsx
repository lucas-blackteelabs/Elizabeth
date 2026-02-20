import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Users, MessageSquare, Trash2, Mail, Phone, MapPin, Clock, Megaphone, Send, Loader2 } from "lucide-react";
import { Redirect } from "wouter";

interface AdminUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  cancerType: string | null;
  cancerStage: string | null;
  phoneNumber: string | null;
  address: string | null;
  timezone: string | null;
  createdAt: string;
}

interface Thread {
  id: number;
  userId: number;
  authorName: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

interface Reply {
  id: number;
  threadId: number;
  userId: number;
  authorName: string;
  content: string;
  createdAt: string;
}

export default function AdminPanel() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastLink, setBroadcastLink] = useState("");

  if (!user || user.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Not authorized");
      return res.json();
    },
  });

  const { data: threads = [] } = useQuery<Thread[]>({
    queryKey: ["/api/community/threads"],
    queryFn: async () => {
      const res = await fetch("/api/community/threads");
      return res.json();
    },
  });

  const { data: replies = [] } = useQuery<Reply[]>({
    queryKey: ["/api/community/replies", selectedThread],
    queryFn: async () => {
      if (!selectedThread) return [];
      const res = await fetch(`/api/community/threads/${selectedThread}/replies`);
      return res.json();
    },
    enabled: !!selectedThread,
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/threads/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/threads"] });
      toast({ title: "Thread removed" });
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/replies/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/replies", selectedThread] });
      toast({ title: "Reply removed" });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          body: broadcastBody || null,
          linkUrl: broadcastLink || null,
        }),
      });
    },
    onSuccess: () => {
      toast({ title: "Broadcast sent", description: "All users have been notified." });
      setBroadcastTitle("");
      setBroadcastBody("");
      setBroadcastLink("");
    },
    onError: () => {
      toast({ title: "Failed to send broadcast", variant: "destructive" });
    },
  });

  const nonAdminUsers = allUsers.filter(u => u.role !== "admin");

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-2xl">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground font-body">Manage users and moderate community</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/60 rounded-2xl p-1">
          <TabsTrigger value="users" className="rounded-xl font-body data-[state=active]:bg-white">
            <Users className="h-4 w-4 mr-2" /> Users ({nonAdminUsers.length})
          </TabsTrigger>
          <TabsTrigger value="moderation" className="rounded-xl font-body data-[state=active]:bg-white">
            <MessageSquare className="h-4 w-4 mr-2" /> Community ({threads.length})
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="rounded-xl font-body data-[state=active]:bg-white">
            <Megaphone className="h-4 w-4 mr-2" /> Broadcast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-3">
          {usersLoading ? (
            <Card className="bg-white rounded-2xl border-border">
              <CardContent className="p-8 text-center text-muted-foreground font-body">Loading users...</CardContent>
            </Card>
          ) : nonAdminUsers.length === 0 ? (
            <Card className="bg-white rounded-2xl border-border">
              <CardContent className="p-8 text-center text-muted-foreground font-body">No registered users yet</CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {nonAdminUsers.map(u => (
                <Card key={u.id} className="bg-white rounded-2xl border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-foreground text-lg">{u.displayName}</h3>
                          <Badge variant="outline" className="text-xs font-body rounded-xl">@{u.username}</Badge>
                          {u.cancerType && (
                            <Badge className="bg-primary/10 text-primary text-xs font-body rounded-xl hover:bg-primary/20">
                              {u.cancerType}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground font-body">
                          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {u.email}</span>
                          {u.phoneNumber && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {u.phoneNumber}</span>}
                          {u.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {u.address}</span>}
                          {u.timezone && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {u.timezone}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground font-body">
                          Joined {new Date(u.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="moderation" className="space-y-3">
          {threads.length === 0 ? (
            <Card className="bg-white rounded-2xl border-border">
              <CardContent className="p-8 text-center text-muted-foreground font-body">No community threads yet</CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {threads.map(thread => (
                <Card key={thread.id} className="bg-white rounded-2xl border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-body rounded-xl">{thread.category}</Badge>
                          <span className="text-xs text-muted-foreground font-body">by {thread.authorName}</span>
                        </div>
                        <h3 className="font-heading text-foreground truncate">{thread.title}</h3>
                        <p className="text-sm text-muted-foreground font-body line-clamp-2 mt-1">{thread.content}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary mt-2 rounded-xl font-body"
                          onClick={() => setSelectedThread(selectedThread === thread.id ? null : thread.id)}
                        >
                          {selectedThread === thread.id ? "Hide replies" : "View replies"}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                        onClick={() => deleteThreadMutation.mutate(thread.id)}
                        disabled={deleteThreadMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {selectedThread === thread.id && replies.length > 0 && (
                      <div className="mt-3 border-t border-border pt-3 space-y-2">
                        {replies.map(reply => (
                          <div key={reply.id} className="flex items-start justify-between bg-muted/40 rounded-xl p-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-body font-medium text-foreground">{reply.authorName}</span>
                              <p className="text-sm text-muted-foreground font-body mt-0.5">{reply.content}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0 h-8 w-8"
                              onClick={() => deleteReplyMutation.mutate(reply.id)}
                              disabled={deleteReplyMutation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-3">
          <Card className="bg-white rounded-2xl border-border">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <h3 className="font-heading text-foreground text-lg">Send Notification to All Users</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body">
                Send a notification that will appear in every user's notification bell. Use this for important announcements, new features, or upcoming events.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-body font-medium text-foreground mb-1 block">Title</label>
                  <Input
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. New Survivor Talk This Week!"
                    className="rounded-xl font-body"
                  />
                </div>
                <div>
                  <label className="text-xs font-body font-medium text-foreground mb-1 block">Message (optional)</label>
                  <Textarea
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder="Add more details about the announcement..."
                    className="rounded-xl font-body min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-body font-medium text-foreground mb-1 block">Link (optional)</label>
                  <Input
                    value={broadcastLink}
                    onChange={(e) => setBroadcastLink(e.target.value)}
                    placeholder="e.g. /community or /calendar"
                    className="rounded-xl font-body"
                  />
                  <p className="text-[10px] text-muted-foreground font-body mt-1">Users will be taken to this page when they tap the notification</p>
                </div>
                <Button
                  onClick={() => broadcastMutation.mutate()}
                  disabled={!broadcastTitle.trim() || broadcastMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90 rounded-xl font-body w-full"
                >
                  {broadcastMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Send Broadcast</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
