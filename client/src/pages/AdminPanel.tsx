import { useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, MessageSquare, Trash2, Mail, Phone, MapPin, Clock, Megaphone, Send, Loader2, Mic, Plus, Pencil, X, Calendar, Link as LinkIcon } from "lucide-react";
import { Redirect } from "wouter";
import type { SurvivorTalk, Survivor } from "@shared/schema";

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

interface TalkFormData {
  survivorId: string;
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: string;
  location: string;
  meetingLink: string;
  capacity: string;
  category: string;
}

const emptyTalkForm: TalkFormData = {
  survivorId: "",
  title: "",
  description: "",
  scheduledAt: "",
  durationMinutes: "60",
  location: "",
  meetingLink: "",
  capacity: "",
  category: "general",
};

function formatDateForInput(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPanel() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastLink, setBroadcastLink] = useState("");
  const [talkForm, setTalkForm] = useState<TalkFormData>(emptyTalkForm);
  const [editingTalkId, setEditingTalkId] = useState<number | null>(null);
  const [showTalkForm, setShowTalkForm] = useState(false);

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

  const { data: talks = [], isLoading: talksLoading } = useQuery<SurvivorTalk[]>({
    queryKey: ["/api/survivor-talks"],
    queryFn: async () => {
      const res = await fetch("/api/survivor-talks", { credentials: "include" });
      return res.json();
    },
  });

  const { data: survivors = [] } = useQuery<Survivor[]>({
    queryKey: ["/api/survivors"],
    queryFn: async () => {
      const res = await fetch("/api/survivors", { credentials: "include" });
      return res.json();
    },
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

  const createTalkMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/talks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survivorId: parseInt(talkForm.survivorId),
          title: talkForm.title,
          description: talkForm.description,
          scheduledAt: talkForm.scheduledAt,
          durationMinutes: parseInt(talkForm.durationMinutes) || 60,
          location: talkForm.location || null,
          meetingLink: talkForm.meetingLink || null,
          capacity: talkForm.capacity ? parseInt(talkForm.capacity) : null,
          category: talkForm.category,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survivor-talks"] });
      toast({ title: "Talk created" });
      resetTalkForm();
    },
    onError: () => {
      toast({ title: "Failed to create talk", variant: "destructive" });
    },
  });

  const updateTalkMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/admin/talks/${editingTalkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survivorId: parseInt(talkForm.survivorId),
          title: talkForm.title,
          description: talkForm.description,
          scheduledAt: talkForm.scheduledAt,
          durationMinutes: parseInt(talkForm.durationMinutes) || 60,
          location: talkForm.location || null,
          meetingLink: talkForm.meetingLink || null,
          capacity: talkForm.capacity ? parseInt(talkForm.capacity) : null,
          category: talkForm.category,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survivor-talks"] });
      toast({ title: "Talk updated" });
      resetTalkForm();
    },
    onError: () => {
      toast({ title: "Failed to update talk", variant: "destructive" });
    },
  });

  const deleteTalkMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/talks/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survivor-talks"] });
      toast({ title: "Talk deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete talk", variant: "destructive" });
    },
  });

  function resetTalkForm() {
    setTalkForm(emptyTalkForm);
    setEditingTalkId(null);
    setShowTalkForm(false);
  }

  function editTalk(talk: SurvivorTalk) {
    setTalkForm({
      survivorId: talk.survivorId.toString(),
      title: talk.title,
      description: talk.description,
      scheduledAt: formatDateForInput(talk.scheduledAt as unknown as string),
      durationMinutes: talk.durationMinutes.toString(),
      location: talk.location || "",
      meetingLink: talk.meetingLink || "",
      capacity: talk.capacity ? talk.capacity.toString() : "",
      category: talk.category || "general",
    });
    setEditingTalkId(talk.id);
    setShowTalkForm(true);
  }

  function getSurvivorName(survivorId: number) {
    const s = survivors.find(s => s.id === survivorId);
    return s ? s.name : `Survivor #${survivorId}`;
  }

  const nonAdminUsers = allUsers.filter(u => u.role !== "admin");
  const isFormValid = talkForm.survivorId && talkForm.title.trim() && talkForm.description.trim() && talkForm.scheduledAt;
  const isSaving = createTalkMutation.isPending || updateTalkMutation.isPending;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-2xl">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground font-body">Manage users, community, and survivor talks</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/60 rounded-2xl p-1 flex-wrap h-auto">
          <TabsTrigger value="users" className="rounded-xl font-body data-[state=active]:bg-white">
            <Users className="h-4 w-4 mr-2" /> Users ({nonAdminUsers.length})
          </TabsTrigger>
          <TabsTrigger value="moderation" className="rounded-xl font-body data-[state=active]:bg-white">
            <MessageSquare className="h-4 w-4 mr-2" /> Community ({threads.length})
          </TabsTrigger>
          <TabsTrigger value="talks" className="rounded-xl font-body data-[state=active]:bg-white">
            <Mic className="h-4 w-4 mr-2" /> Talks ({talks.length})
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

        <TabsContent value="talks" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              <h3 className="font-heading text-foreground text-lg">Survivor Talks</h3>
            </div>
            {!showTalkForm && (
              <Button
                onClick={() => { resetTalkForm(); setShowTalkForm(true); }}
                className="bg-primary text-white hover:bg-primary/90 rounded-xl font-body"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Talk
              </Button>
            )}
          </div>

          {showTalkForm && (
            <Card className="bg-white rounded-2xl border-border border-primary/30">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-foreground">{editingTalkId ? "Edit Talk" : "New Talk"}</h4>
                  <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={resetTalkForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-body font-medium text-foreground mb-1 block">Title *</label>
                    <Input
                      value={talkForm.title}
                      onChange={(e) => setTalkForm({ ...talkForm, title: e.target.value })}
                      placeholder="e.g. Healing Beyond the Diagnosis"
                      className="rounded-xl font-body"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-body font-medium text-foreground mb-1 block">Description *</label>
                    <Textarea
                      value={talkForm.description}
                      onChange={(e) => setTalkForm({ ...talkForm, description: e.target.value })}
                      placeholder="Describe what the talk is about..."
                      className="rounded-xl font-body min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-body font-medium text-foreground mb-1 block">Survivor *</label>
                    <Select value={talkForm.survivorId} onValueChange={(v) => setTalkForm({ ...talkForm, survivorId: v })}>
                      <SelectTrigger className="rounded-xl font-body">
                        <SelectValue placeholder="Select a survivor" />
                      </SelectTrigger>
                      <SelectContent>
                        {survivors.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-body font-medium text-foreground mb-1 block">Date & Time *</label>
                    <Input
                      type="datetime-local"
                      value={talkForm.scheduledAt}
                      onChange={(e) => setTalkForm({ ...talkForm, scheduledAt: e.target.value })}
                      className="rounded-xl font-body"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-body font-medium text-foreground mb-1 block">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={talkForm.durationMinutes}
                      onChange={(e) => setTalkForm({ ...talkForm, durationMinutes: e.target.value })}
                      placeholder="60"
                      className="rounded-xl font-body"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-body font-medium text-foreground mb-1 block">Capacity</label>
                    <Input
                      type="number"
                      value={talkForm.capacity}
                      onChange={(e) => setTalkForm({ ...talkForm, capacity: e.target.value })}
                      placeholder="No limit"
                      className="rounded-xl font-body"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-body font-medium text-foreground mb-1 block">Category</label>
                    <Select value={talkForm.category} onValueChange={(v) => setTalkForm({ ...talkForm, category: v })}>
                      <SelectTrigger className="rounded-xl font-body">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="healing">Healing</SelectItem>
                        <SelectItem value="nutrition">Nutrition</SelectItem>
                        <SelectItem value="mindfulness">Mindfulness</SelectItem>
                        <SelectItem value="treatment">Treatment</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-body font-medium text-foreground mb-1 block">Location</label>
                    <Input
                      value={talkForm.location}
                      onChange={(e) => setTalkForm({ ...talkForm, location: e.target.value })}
                      placeholder="e.g. Microsoft Teams"
                      className="rounded-xl font-body"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-body font-medium text-foreground mb-1 block">Meeting Link</label>
                    <Input
                      value={talkForm.meetingLink}
                      onChange={(e) => setTalkForm({ ...talkForm, meetingLink: e.target.value })}
                      placeholder="https://teams.microsoft.com/..."
                      className="rounded-xl font-body"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => editingTalkId ? updateTalkMutation.mutate() : createTalkMutation.mutate()}
                    disabled={!isFormValid || isSaving}
                    className="bg-primary text-white hover:bg-primary/90 rounded-xl font-body flex-1"
                  >
                    {isSaving ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                    ) : editingTalkId ? (
                      "Save Changes"
                    ) : (
                      <><Plus className="h-4 w-4 mr-1" /> Create Talk</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetTalkForm} className="rounded-xl font-body">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {talksLoading ? (
            <Card className="bg-white rounded-2xl border-border">
              <CardContent className="p-8 text-center text-muted-foreground font-body">Loading talks...</CardContent>
            </Card>
          ) : talks.length === 0 && !showTalkForm ? (
            <Card className="bg-white rounded-2xl border-border">
              <CardContent className="p-8 text-center">
                <Mic className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-body text-muted-foreground">No talks yet. Create your first survivor talk!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {talks.map(talk => {
                const isUpcoming = new Date(talk.scheduledAt as unknown as string) > new Date();
                return (
                  <Card key={talk.id} className={`bg-white rounded-2xl border-border ${!isUpcoming ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-heading text-foreground">{talk.title}</h3>
                            <Badge variant="outline" className="text-[10px] font-body rounded-xl">{talk.category || "general"}</Badge>
                            {isUpcoming ? (
                              <Badge className="bg-green-100 text-green-700 text-[10px] font-body rounded-xl hover:bg-green-100">Upcoming</Badge>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground text-[10px] font-body rounded-xl hover:bg-muted">Past</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-body line-clamp-2">{talk.description}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-body">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {getSurvivorName(talk.survivorId)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {new Date(talk.scheduledAt as unknown as string).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {talk.durationMinutes}min
                            </span>
                            {talk.rsvpCount ? (
                              <span>{talk.rsvpCount} RSVP{talk.rsvpCount !== 1 ? 's' : ''}</span>
                            ) : null}
                            {talk.meetingLink && (
                              <span className="flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" /> Meeting link set
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:text-primary hover:bg-primary/10 rounded-xl h-8 w-8"
                            onClick={() => editTalk(talk)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-8 w-8"
                            onClick={() => deleteTalkMutation.mutate(talk.id)}
                            disabled={deleteTalkMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
